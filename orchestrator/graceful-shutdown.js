#!/usr/bin/env node

/**
 * GRACEFUL SHUTDOWN HANDLER
 *
 * Ensures clean shutdown: stop new requests, wait for in-flight operations,
 * close connections, flush logs, then exit.
 */

class GracefulShutdownManager {
  constructor(options = {}) {
    this.isShuttingDown = false;
    this.activeOperations = new Map();
    this.shutdownTimeout = options.shutdownTimeout || 30000;  // 30 seconds
    this.hooks = {
      beforeShutdown: [],
      afterShutdown: []
    };
    this.logger = options.logger || console;
  }

  /**
   * Register hook to run before shutdown
   * @param {Function} fn - Async function to run
   */
  beforeShutdown(fn) {
    this.hooks.beforeShutdown.push(fn);
  }

  /**
   * Register hook to run after shutdown
   * @param {Function} fn - Async function to run
   */
  afterShutdown(fn) {
    this.hooks.afterShutdown.push(fn);
  }

  /**
   * Track operation
   * @param {string} operationId - Unique operation ID
   * @returns {Function} Function to call when operation completes
   */
  trackOperation(operationId) {
    const operation = {
      id: operationId,
      startTime: Date.now(),
      completed: false
    };
    this.activeOperations.set(operationId, operation);

    return () => {
      operation.completed = true;
      operation.duration = Date.now() - operation.startTime;
      this.activeOperations.delete(operationId);
    };
  }

  /**
   * Get active operations
   * @returns {Array} Active operations
   */
  getActiveOperations() {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Initiate graceful shutdown
   * @param {string} signal - Signal that triggered shutdown (SIGTERM, SIGINT, etc.)
   * @param {object} server - Express server to close
   */
  async shutdown(signal, server) {
    if (this.isShuttingDown) {
      this.logger.error('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info(`Shutdown initiated by ${signal}`);

    try {
      // Phase 1: Stop accepting new requests
      if (server) {
        server.close(() => {
          this.logger.info('HTTP server closed');
        });
      }

      // Phase 2: Run before-shutdown hooks
      for (const hook of this.hooks.beforeShutdown) {
        try {
          await hook();
        } catch (error) {
          this.logger.error('Error in shutdown hook:', error);
        }
      }

      // Phase 3: Wait for active operations to complete
      await this._waitForActiveOperations();

      // Phase 4: Run after-shutdown hooks
      for (const hook of this.hooks.afterShutdown) {
        try {
          await hook();
        } catch (error) {
          this.logger.error('Error in cleanup hook:', error);
        }
      }

      this.logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Internal: Wait for active operations
   * @private
   */
  async _waitForActiveOperations() {
    const startTime = Date.now();

    while (this.activeOperations.size > 0) {
      const elapsed = Date.now() - startTime;

      if (elapsed > this.shutdownTimeout) {
        const remaining = Array.from(this.activeOperations.keys());
        this.logger.warn(
          `Shutdown timeout reached. Terminating ${remaining.length} active operations:`,
          remaining
        );
        break;
      }

      this.logger.info(
        `Waiting for ${this.activeOperations.size} active operations to complete...`
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.logger.info('All active operations completed');
  }
}

/**
 * Setup graceful shutdown for Express server
 */
function setupGracefulShutdown(server, options = {}) {
  const manager = new GracefulShutdownManager(options);
  const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];

  signals.forEach(signal => {
    process.on(signal, () => {
      manager.shutdown(signal, server);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    manager.shutdown('uncaughtException', server);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:', reason);
    manager.shutdown('unhandledRejection', server);
  });

  return manager;
}

module.exports = {
  GracefulShutdownManager,
  setupGracefulShutdown
};
