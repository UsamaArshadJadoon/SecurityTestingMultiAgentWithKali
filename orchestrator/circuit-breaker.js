#!/usr/bin/env node

/**
 * CIRCUIT BREAKER PATTERN - Phase 3 Gap 13
 *
 * Prevents cascading failures by stopping requests to failing services.
 * Implements state machine: CLOSED → OPEN → HALF_OPEN → CLOSED
 */

const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation, requests pass through
  OPEN: 'OPEN',           // Failing, requests fail fast
  HALF_OPEN: 'HALF_OPEN'  // Testing, limited requests allowed
};

/**
 * Single circuit breaker
 */
class CircuitBreaker {
  constructor(key, options = {}) {
    this.key = key;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();

    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.timeout = options.timeout || 30000;

    // Monitoring
    this.stats = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateChanges: []
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute(operation) {
    this.stats.totalRequests++;

    // OPEN: Fail fast
    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.resetTimeout) {
        this._transitionTo(CircuitState.HALF_OPEN);
      } else {
        const error = new Error(`Circuit breaker OPEN for ${this.key}`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        error.retryAfterMs = this.resetTimeout - timeSinceFailure;
        throw error;
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);

      this._recordSuccess();
      return result;
    } catch (error) {
      this._recordFailure();
      throw error;
    }
  }

  /**
   * Record successful operation
   * @private
   */
  _recordSuccess() {
    this.stats.totalSuccesses++;
    this.failureCount = 0;
    this.successCount++;

    if (this.state === CircuitState.HALF_OPEN && this.successCount >= this.successThreshold) {
      this._transitionTo(CircuitState.CLOSED);
    }
  }

  /**
   * Record failed operation
   * @private
   */
  _recordFailure() {
    this.stats.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold && this.state !== CircuitState.OPEN) {
      this._transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Transition to new state
   * @private
   */
  _transitionTo(newState) {
    if (this.state !== newState) {
      const logger = global.logger;
      if (logger) {
        logger.info('Circuit breaker state change', {
          key: this.key,
          from: this.state,
          to: newState,
          timestamp: new Date().toISOString()
        });
      }

      this.state = newState;
      this.lastStateChangeTime = Date.now();
      this.failureCount = 0;
      this.successCount = 0;

      this.stats.stateChanges.push({
        from: this.state === newState ? undefined : this.state,
        to: newState,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      key: this.key,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      uptime: Date.now() - this.lastStateChangeTime,
      stats: this.stats
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this._transitionTo(CircuitState.CLOSED);
  }
}

/**
 * Circuit breaker registry
 */
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Get or create circuit breaker
   */
  getOrCreate(key, options) {
    if (!this.breakers.has(key)) {
      this.breakers.set(key, new CircuitBreaker(key, options));
    }
    return this.breakers.get(key);
  }

  /**
   * Get all breakers
   */
  getAll() {
    return Array.from(this.breakers.values());
  }

  /**
   * Get status of all breakers
   */
  getStatus() {
    const status = {};
    this.breakers.forEach((breaker, key) => {
      status[key] = breaker.getStatus();
    });
    return status;
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Reset specific breaker
   */
  reset(key) {
    const breaker = this.breakers.get(key);
    if (breaker) {
      breaker.reset();
    }
  }
}

/**
 * Express middleware for circuit breaker
 */
function circuitBreakerMiddleware(registry, breakerKey) {
  return async (req, res, next) => {
    const breaker = registry.getOrCreate(breakerKey, {
      failureThreshold: 10,
      resetTimeout: 30000
    });

    try {
      await breaker.execute(() => next());
    } catch (error) {
      if (error.code === 'CIRCUIT_BREAKER_OPEN') {
        const logger = global.logger;
        if (logger) {
          logger.warn('Circuit breaker open', {
            key: breakerKey,
            path: req.path,
            retryAfterMs: error.retryAfterMs
          });
        }

        res.set('Retry-After', Math.ceil(error.retryAfterMs / 1000));
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          code: 'CIRCUIT_BREAKER_OPEN',
          retry_after_ms: error.retryAfterMs
        });
      }

      next(error);
    }
  };
}

module.exports = {
  CircuitState,
  CircuitBreaker,
  CircuitBreakerRegistry,
  circuitBreakerMiddleware
};
