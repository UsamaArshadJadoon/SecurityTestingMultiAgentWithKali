#!/usr/bin/env node

/**
 * PER-ENDPOINT RATE LIMITING - Phase 3 Gap 14
 *
 * Fine-grained rate limiting per API endpoint.
 * Protects high-cost operations from abuse.
 */

class EndpointRateLimiter {
  constructor(defaultLimits = {}) {
    this.endpoints = new Map();
    this.defaultLimits = {
      requestsPerMinute: defaultLimits.requestsPerMinute || 100,
      burstSize: defaultLimits.burstSize || 10,
      windowMs: defaultLimits.windowMs || 60000
    };
  }

  /**
   * Register endpoint with rate limit
   */
  registerEndpoint(method, path, limits = {}) {
    const key = `${method}:${path}`;
    this.endpoints.set(key, {
      method,
      path,
      limits: { ...this.defaultLimits, ...limits },
      stats: {
        totalRequests: 0,
        rejectedRequests: 0,
        windows: new Map()
      }
    });
  }

  /**
   * Check if request is allowed
   */
  checkLimit(method, path, identifier) {
    const key = `${method}:${path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) {
      return { allowed: true, reason: 'No limit configured' };
    }

    endpoint.stats.totalRequests++;

    const now = Date.now();
    const windowKey = identifier;

    // Get or create window for this identifier
    if (!endpoint.stats.windows.has(windowKey)) {
      endpoint.stats.windows.set(windowKey, {
        requests: [],
        exceededBurst: false
      });
    }

    const window = endpoint.stats.windows.get(windowKey);

    // Remove expired requests
    window.requests = window.requests.filter(
      t => now - t < endpoint.limits.windowMs
    );

    // Check burst limit
    if (window.requests.length >= endpoint.limits.burstSize) {
      window.exceededBurst = true;
      endpoint.stats.rejectedRequests++;
      const resetIn = endpoint.limits.windowMs - (now - window.requests[0]);
      return {
        allowed: false,
        reason: 'Burst limit exceeded',
        retryAfterMs: resetIn,
        current: window.requests.length,
        limit: endpoint.limits.burstSize
      };
    }

    // Check sustained rate
    const requestsThisWindow = window.requests.length;
    const maxRequestsPerWindow = (endpoint.limits.requestsPerMinute / 60) * endpoint.limits.windowMs;

    if (requestsThisWindow >= maxRequestsPerWindow) {
      endpoint.stats.rejectedRequests++;
      const resetIn = endpoint.limits.windowMs - (now - window.requests[0]);
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfterMs: resetIn,
        current: requestsThisWindow,
        limit: maxRequestsPerWindow
      };
    }

    // Allow request
    window.requests.push(now);
    window.exceededBurst = false;

    return {
      allowed: true,
      remaining: Math.floor(maxRequestsPerWindow - requestsThisWindow - 1),
      resetIn: endpoint.limits.windowMs - (now - window.requests[0])
    };
  }

  /**
   * Get endpoint stats
   */
  getEndpointStats(method, path) {
    const key = `${method}:${path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) return null;

    return {
      method,
      path,
      limits: endpoint.limits,
      stats: {
        totalRequests: endpoint.stats.totalRequests,
        rejectedRequests: endpoint.stats.rejectedRequests,
        rejectRate: endpoint.stats.totalRequests > 0
          ? (endpoint.stats.rejectedRequests / endpoint.stats.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        activeWindows: endpoint.stats.windows.size
      }
    };
  }

  /**
   * Get all endpoint stats
   */
  getAllStats() {
    const stats = [];
    this.endpoints.forEach((endpoint, key) => {
      const [method, path] = key.split(':');
      stats.push(this.getEndpointStats(method, path));
    });
    return stats;
  }

  /**
   * Reset endpoint limit
   */
  resetEndpoint(method, path) {
    const key = `${method}:${path}`;
    const endpoint = this.endpoints.get(key);
    if (endpoint) {
      endpoint.stats.windows.clear();
    }
  }
}

/**
 * Express middleware for endpoint rate limiting
 */
function endpointRateLimitMiddleware(limiter) {
  return (req, res, next) => {
    const method = req.method;
    const path = req.path;

    // Use IP as identifier (or user ID if authenticated)
    const ctx = req.requestContext?.() || {};
    const identifier = ctx.userId || req.ip;

    const result = limiter.checkLimit(method, path, identifier);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', result.limit?.toString() || 'unlimited');
    if (result.remaining !== undefined) {
      res.set('X-RateLimit-Remaining', result.remaining.toString());
    }
    if (result.resetIn !== undefined) {
      res.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + result.resetIn / 1000).toString());
    }

    if (!result.allowed) {
      const logger = global.logger;
      if (logger) {
        logger.warn('Endpoint rate limit exceeded', {
          method,
          path,
          identifier,
          reason: result.reason,
          retryAfterMs: result.retryAfterMs
        });
      }

      res.set('Retry-After', Math.ceil(result.retryAfterMs / 1000));
      return res.status(429).json({
        error: result.reason,
        retry_after_ms: result.retryAfterMs,
        limit: result.limit,
        current: result.current
      });
    }

    next();
  };
}

module.exports = {
  EndpointRateLimiter,
  endpointRateLimitMiddleware
};
