#!/usr/bin/env node

/**
 * CACHE MANAGER - Phase 2 Performance Optimization
 *
 * In-memory caching layer with TTL and pattern-based invalidation.
 * Dramatically reduces database queries and improves response times.
 */

class CacheManager {
  constructor(config = {}) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0
    };
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000,  // 5 minutes default
      maxSize: config.maxSize || 1000,   // Max entries
      maxValueSize: config.maxValueSize || 1024 * 1024  // 1MB per entry
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time
    entry.lastAccess = Date.now();
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Optional TTL override
   * @returns {boolean} Success
   */
  set(key, value, ttl = this.config.ttl) {
    // Check value size
    const size = JSON.stringify(value).length;
    if (size > this.config.maxValueSize) {
      return false;  // Value too large
    }

    // Evict if cache full (simple LRU)
    if (this.cache.size >= this.config.maxSize) {
      this._evictLRU();
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      created: Date.now(),
      lastAccess: Date.now(),
      size
    });

    this.stats.sets++;
    return true;
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   * @returns {number} Number of invalidated entries
   */
  invalidate(pattern) {
    let count = 0;
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (key.match(regex)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.invalidations += count;
    return count;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += size;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const totalSize = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);

    return {
      entries: this.cache.size,
      max_entries: this.config.maxSize,
      total_size_bytes: totalSize,
      total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hit_rate: this.cache.size === 0 ? 0 :
        ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%',
      sets: this.stats.sets,
      invalidations: this.stats.invalidations
    };
  }

  /**
   * Internal: Evict least recently used entry
   * @private
   */
  _evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Get cache with keys matching pattern
   * @param {string|RegExp} pattern - Pattern to match
   * @returns {Map} Matching entries
   */
  getByPattern(pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const matches = new Map();

    for (const [key, entry] of this.cache.entries()) {
      if (key.match(regex)) {
        // Check expiration
        if (Date.now() <= entry.expiry) {
          matches.set(key, entry.value);
        } else {
          this.cache.delete(key);
        }
      }
    }

    return matches;
  }
}

module.exports = {
  CacheManager
};
