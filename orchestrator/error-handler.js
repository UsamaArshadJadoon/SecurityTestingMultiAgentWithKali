#!/usr/bin/env node

/**
 * ERROR HANDLER & RETRY LOGIC
 *
 * Classifies errors and applies appropriate retry strategies.
 * Prevents silent failures and implements graceful degradation.
 */

class ErrorClassifier {
  /**
   * Classify error type
   * @param {Error} error - Error to classify
   * @returns {string} Classification: FATAL, CRITICAL, RECOVERABLE, IGNORABLE
   */
  static classify(error) {
    const message = error.message || '';
    const code = error.code || '';

    // FATAL: Stop immediately, escalate
    if (message.includes('FATAL') || code === 'EACCES' || code === 'ENOENT') {
      return 'FATAL';
    }

    // CRITICAL: Retry with exponential backoff
    if (
      code === 'ECONNREFUSED' ||  // Connection refused
      code === 'ETIMEDOUT' ||      // Timeout
      code === 'EHOSTUNREACH' ||   // Host unreachable
      message.includes('503') ||   // Service unavailable
      message.includes('500')      // Server error (retry-able)
    ) {
      return 'CRITICAL';
    }

    // RECOVERABLE: Queue for later retry
    if (
      code === 'ENOMEM' ||         // Out of memory
      message.includes('429')      // Rate limited
    ) {
      return 'RECOVERABLE';
    }

    // IGNORABLE: Log and continue
    return 'IGNORABLE';
  }

  /**
   * Get retry strategy for error
   * @param {string} classification - Error classification
   * @returns {object} Retry strategy
   */
  static getRetryStrategy(classification) {
    const strategies = {
      'FATAL': {
        shouldRetry: false,
        maxRetries: 0,
        escalate: true
      },
      'CRITICAL': {
        shouldRetry: true,
        maxRetries: 5,
        backoffType: 'exponential',
        baseDelay: 1000,  // 1 second
        maxDelay: 60000   // 1 minute
      },
      'RECOVERABLE': {
        shouldRetry: true,
        maxRetries: 3,
        backoffType: 'exponential',
        baseDelay: 5000,  // 5 seconds
        maxDelay: 300000  // 5 minutes
      },
      'IGNORABLE': {
        shouldRetry: false,
        maxRetries: 0,
        escalate: false
      }
    };

    return strategies[classification];
  }
}

class RetryEngine {
  /**
   * Execute operation with retry
   * @param {Function} operation - Async function to execute
   * @param {object} options - Retry options
   * @returns {Promise<any>} Operation result
   */
  static async executeWithRetry(operation, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const maxDelay = options.maxDelay || 60000;
    const onRetry = options.onRetry || (() => {});

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const classification = ErrorClassifier.classify(error);
        if (classification === 'FATAL' || classification === 'IGNORABLE') {
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );

        onRetry({
          attempt,
          maxRetries,
          delay,
          error: error.message
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Execute operation with circuit breaker pattern
   * @param {Function} operation - Async function to execute
   * @param {object} options - Circuit breaker options
   * @returns {Promise<any>} Operation result or cached result
   */
  static async executeWithCircuitBreaker(operation, options = {}) {
    const failureThreshold = options.failureThreshold || 5;
    const resetTimeout = options.resetTimeout || 60000;  // 1 minute
    const operationKey = options.key || 'default';

    if (!this.circuitBreakers) {
      this.circuitBreakers = new Map();
    }

    if (!this.circuitBreakers.has(operationKey)) {
      this.circuitBreakers.set(operationKey, {
        state: 'CLOSED',  // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: null
      });
    }

    const breaker = this.circuitBreakers.get(operationKey);

    // Check if circuit should be reset
    if (breaker.state === 'OPEN') {
      const timeSinceFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceFailure > resetTimeout) {
        breaker.state = 'HALF_OPEN';
        breaker.failureCount = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for ${operationKey}. Retry after ${resetTimeout - timeSinceFailure}ms`);
      }
    }

    try {
      const result = await operation();
      // Success - reset breaker
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      return result;
    } catch (error) {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failureCount >= failureThreshold) {
        breaker.state = 'OPEN';
      }

      throw error;
    }
  }
}

class ErrorHandler {
  /**
   * Handle error with appropriate response
   * @param {Error} error - Error to handle
   * @param {object} context - Error context
   * @returns {Promise<object>} Handling result
   */
  static async handle(error, context = {}) {
    const classification = ErrorClassifier.classify(error);
    const strategy = ErrorClassifier.getRetryStrategy(classification);

    if (strategy.escalate) {
      // FATAL: Escalate immediately
      return {
        handled: false,
        classification,
        shouldEscalate: true,
        error: error.message
      };
    }

    if (strategy.shouldRetry) {
      // CRITICAL or RECOVERABLE: Retry
      try {
        const result = await RetryEngine.executeWithRetry(
          context.operation,
          {
            maxRetries: strategy.maxRetries,
            baseDelay: strategy.baseDelay,
            maxDelay: strategy.maxDelay,
            onRetry: (retryInfo) => {
              if (context.onRetry) {
                context.onRetry(retryInfo);
              }
            }
          }
        );

        return {
          handled: true,
          classification,
          success: true,
          result
        };
      } catch (retryError) {
        // All retries failed
        return {
          handled: false,
          classification,
          retriesExhausted: true,
          error: retryError.message
        };
      }
    }

    // IGNORABLE: Log and continue
    return {
      handled: true,
      classification,
      ignored: true,
      warning: error.message
    };
  }

  /**
   * Get error statistics
   * @returns {object} Error handling stats
   */
  static getStats() {
    return {
      circuit_breakers: this._circuitBreakerStats()
    };
  }

  /**
   * Internal: Get circuit breaker stats
   * @private
   */
  static _circuitBreakerStats() {
    if (!RetryEngine.circuitBreakers) return {};

    const stats = {};
    RetryEngine.circuitBreakers.forEach((breaker, key) => {
      stats[key] = {
        state: breaker.state,
        failureCount: breaker.failureCount
      };
    });

    return stats;
  }
}

module.exports = {
  ErrorClassifier,
  RetryEngine,
  ErrorHandler
};
