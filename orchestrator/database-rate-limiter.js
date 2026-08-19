#!/usr/bin/env node

/**
 * DATABASE RATE LIMITER
 *
 * Protects database from DoS attacks and resource exhaustion.
 * Enforces per-user and per-tenant rate limits on database operations.
 */

class DatabaseRateLimiter {
  constructor(config = {}) {
    this.config = {
      queryPerUserPerMinute: config.queryPerUserPerMinute || 100,
      queryPerTenantPerMinute: config.queryPerTenantPerMinute || 1000,
      maxResultSize: config.maxResultSize || 10000,
      maxQueryTime: config.maxQueryTime || 30000,  // 30 seconds
      windowSize: config.windowSize || 60000  // 1 minute
    };

    this.userQueries = new Map();
    this.tenantQueries = new Map();
  }

  /**
   * Check if query is allowed
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {object} Check result {allowed, remaining, resetIn}
   */
  checkQueryAllowed(userId, tenantId) {
    const now = Date.now();

    // Check user rate limit
    const userBucket = this._getBucket(this.userQueries, userId, now);
    if (userBucket.count >= this.config.queryPerUserPerMinute) {
      return {
        allowed: false,
        reason: 'User query rate limit exceeded',
        limit: this.config.queryPerUserPerMinute,
        current: userBucket.count,
        resetIn: Math.ceil((userBucket.resetTime - now) / 1000)
      };
    }

    // Check tenant rate limit
    const tenantBucket = this._getBucket(this.tenantQueries, tenantId, now);
    if (tenantBucket.count >= this.config.queryPerTenantPerMinute) {
      return {
        allowed: false,
        reason: 'Tenant query rate limit exceeded',
        limit: this.config.queryPerTenantPerMinute,
        current: tenantBucket.count,
        resetIn: Math.ceil((tenantBucket.resetTime - now) / 1000)
      };
    }

    // Increment counters
    userBucket.count++;
    tenantBucket.count++;

    return {
      allowed: true,
      userRemaining: this.config.queryPerUserPerMinute - userBucket.count,
      tenantRemaining: this.config.queryPerTenantPerMinute - tenantBucket.count
    };
  }

  /**
   * Check result size is acceptable
   * @param {number} resultCount - Number of results returned
   * @returns {object} Check result {status, message}
   */
  checkResultSize(resultCount) {
    if (resultCount > this.config.maxResultSize) {
      return {
        status: 'error',
        message: `Result set too large: ${resultCount} > ${this.config.maxResultSize}`,
        limit: this.config.maxResultSize,
        actual: resultCount
      };
    }

    if (resultCount > this.config.maxResultSize * 0.8) {
      return {
        status: 'warning',
        message: `Result set approaching limit: ${resultCount} / ${this.config.maxResultSize}`,
        limit: this.config.maxResultSize,
        actual: resultCount,
        percentUsed: ((resultCount / this.config.maxResultSize) * 100).toFixed(1)
      };
    }

    return {
      status: 'ok',
      resultCount
    };
  }

  /**
   * Wrap database query with rate limiting
   * @param {Function} queryFn - Database query function
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<any>} Query result
   */
  async executeQuery(queryFn, userId, tenantId) {
    // Check rate limit
    const allowed = this.checkQueryAllowed(userId, tenantId);
    if (!allowed.allowed) {
      const error = new Error(allowed.reason);
      error.status = 429;  // Too Many Requests
      error.retryAfter = allowed.resetIn;
      throw error;
    }

    // Execute query with timeout
    const startTime = Date.now();
    try {
      const result = await Promise.race([
        queryFn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Query timeout')),
            this.config.maxQueryTime
          )
        )
      ]);

      // Check result size
      const sizeCheck = this.checkResultSize(
        Array.isArray(result) ? result.length : 1
      );
      if (sizeCheck.status === 'error') {
        throw new Error(sizeCheck.message);
      }

      const duration = Date.now() - startTime;
      return {
        data: result,
        duration,
        rateLimitRemaining: allowed.userRemaining
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statistics
   * @returns {object} Current rate limit stats
   */
  getStats() {
    const now = Date.now();

    return {
      users_tracked: this.userQueries.size,
      tenants_tracked: this.tenantQueries.size,
      user_limits: {
        per_minute: this.config.queryPerUserPerMinute,
        enforcement: 'enabled'
      },
      tenant_limits: {
        per_minute: this.config.queryPerTenantPerMinute,
        enforcement: 'enabled'
      },
      result_limits: {
        max_size: this.config.maxResultSize,
        max_query_time_ms: this.config.maxQueryTime
      }
    };
  }

  /**
   * Internal: Get or create rate limit bucket
   * @private
   */
  _getBucket(map, key, now) {
    if (!map.has(key)) {
      map.set(key, {
        count: 0,
        resetTime: now + this.config.windowSize
      });
    }

    const bucket = map.get(key);

    // Reset if window expired
    if (now > bucket.resetTime) {
      bucket.count = 0;
      bucket.resetTime = now + this.config.windowSize;
    }

    return bucket;
  }
}

module.exports = {
  DatabaseRateLimiter
};
