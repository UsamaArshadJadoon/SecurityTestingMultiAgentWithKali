#!/usr/bin/env node

/**
 * DATABASE CONNECTION POOL - Phase 2 Optimization
 *
 * Reuses database connections instead of creating new ones per query.
 * Prevents file descriptor exhaustion and improves performance.
 */

const EventEmitter = require('events');

class DatabasePool extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      min: config.min || 5,
      max: config.max || 20,
      idleTimeout: config.idleTimeout || 30000,  // 30 seconds
      acquireTimeout: config.acquireTimeout || 5000,  // 5 seconds
      createConnection: config.createConnection || (() => ({}))
    };

    this.connections = [];
    this.available = [];
    this.inUse = new Set();
    this.waitingQueue = [];
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      destroyed: 0,
      timeouts: 0,
      errors: 0
    };

    this._initializePool();
  }

  /**
   * Initialize minimum pool connections
   */
  async _initializePool() {
    for (let i = 0; i < this.config.min; i++) {
      try {
        const conn = await this.config.createConnection();
        this.connections.push({
          id: i,
          connection: conn,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          inUse: false
        });
        this.available.push(this.connections[i]);
        this.stats.created++;
      } catch (error) {
        this.emit('error', error);
        this.stats.errors++;
      }
    }

    // Start idle timeout checker
    this._startIdleTimeout();
  }

  /**
   * Acquire a connection from the pool
   * @returns {Promise<object>} Database connection
   */
  async acquire() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
        this.stats.timeouts++;
      }, this.config.acquireTimeout);

      const tryAcquire = async () => {
        // Try to get available connection
        if (this.available.length > 0) {
          clearTimeout(timeout);
          const poolConn = this.available.shift();
          poolConn.inUse = true;
          poolConn.lastUsed = Date.now();
          this.inUse.add(poolConn);
          this.stats.acquired++;
          resolve(poolConn.connection);
          return;
        }

        // Create new connection if under limit
        if (this.connections.length < this.config.max) {
          try {
            const conn = await this.config.createConnection();
            const poolConn = {
              id: this.connections.length,
              connection: conn,
              createdAt: Date.now(),
              lastUsed: Date.now(),
              inUse: true
            };
            this.connections.push(poolConn);
            this.inUse.add(poolConn);
            this.stats.created++;
            this.stats.acquired++;
            clearTimeout(timeout);
            resolve(conn);
            return;
          } catch (error) {
            this.stats.errors++;
            clearTimeout(timeout);
            reject(error);
            return;
          }
        }

        // Queue the request
        this.waitingQueue.push({
          resolve,
          reject,
          timestamp: Date.now()
        });
      };

      tryAcquire();
    });
  }

  /**
   * Release connection back to pool
   * @param {object} connection - Connection to release
   */
  release(connection) {
    // Find the pool connection wrapper
    const poolConn = this.connections.find(pc => pc.connection === connection);

    if (poolConn) {
      poolConn.inUse = false;
      poolConn.lastUsed = Date.now();
      this.inUse.delete(poolConn);
      this.stats.released++;

      // Check if anyone is waiting
      if (this.waitingQueue.length > 0) {
        const waiter = this.waitingQueue.shift();
        poolConn.inUse = true;
        this.inUse.add(poolConn);
        this.stats.acquired++;
        waiter.resolve(poolConn.connection);
      } else {
        // Return to available pool
        this.available.push(poolConn);
      }
    }
  }

  /**
   * Get pool statistics
   * @returns {object} Pool stats
   */
  getStats() {
    return {
      pool_size: this.connections.length,
      min_size: this.config.min,
      max_size: this.config.max,
      available: this.available.length,
      in_use: this.inUse.size,
      waiting_queue: this.waitingQueue.length,
      created_total: this.stats.created,
      acquired_total: this.stats.acquired,
      released_total: this.stats.released,
      destroyed_total: this.stats.destroyed,
      timeout_errors: this.stats.timeouts,
      other_errors: this.stats.errors
    };
  }

  /**
   * Drain the pool (close all connections)
   */
  async drain() {
    // Reject any waiting requests
    while (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      waiter.reject(new Error('Pool draining'));
    }

    // Close all connections
    for (const poolConn of this.connections) {
      if (typeof poolConn.connection.close === 'function') {
        try {
          await poolConn.connection.close();
        } catch (error) {
          this.emit('error', error);
        }
      }
      this.stats.destroyed++;
    }

    this.connections = [];
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Internal: Start idle timeout checker
   * @private
   */
  _startIdleTimeout() {
    setInterval(() => {
      const now = Date.now();
      const toRemove = [];

      for (let i = 0; i < this.available.length; i++) {
        const poolConn = this.available[i];
        const idleTime = now - poolConn.lastUsed;

        if (idleTime > this.config.idleTimeout && this.connections.length > this.config.min) {
          toRemove.push(i);
        }
      }

      // Remove in reverse order to maintain indices
      for (let i = toRemove.length - 1; i >= 0; i--) {
        const poolConn = this.available[toRemove[i]];
        this.available.splice(toRemove[i], 1);

        // Remove from connections
        const idx = this.connections.indexOf(poolConn);
        if (idx !== -1) {
          this.connections.splice(idx, 1);
        }

        if (typeof poolConn.connection.close === 'function') {
          try {
            poolConn.connection.close();
          } catch (error) {
            // Ignore
          }
        }

        this.stats.destroyed++;
      }
    }, 10000);  // Check every 10 seconds
  }
}

module.exports = {
  DatabasePool
};
