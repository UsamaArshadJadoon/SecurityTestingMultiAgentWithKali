#!/usr/bin/env node

/**
 * HEALTH CHECK SYSTEM
 *
 * Provides /health endpoint for Kubernetes, Docker, and monitoring systems.
 * Checks all critical subsystems and returns aggregate health status.
 */

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Register health check
   * @param {string} name - Check name (e.g., 'database', 'jira')
   * @param {Function} checkFn - Async function that returns {status, message}
   */
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  /**
   * Get health status
   * @returns {Promise<object>} Health report
   */
  async getHealth() {
    const report = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      shutdown: this.isShuttingDown,
      checks: {}
    };

    // Run all checks in parallel
    const checkResults = await Promise.allSettled(
      Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
        try {
          const result = await checkFn();
          return [name, result];
        } catch (error) {
          return [name, { status: 'unhealthy', message: error.message }];
        }
      })
    );

    // Aggregate results
    let hasUnhealthy = false;
    checkResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const [name, check] = result.value;
        report.checks[name] = check;
        if (check.status !== 'healthy') {
          hasUnhealthy = true;
        }
      } else {
        report.checks[name] = {
          status: 'error',
          message: result.reason.message
        };
        hasUnhealthy = true;
      }
    });

    // Set overall status
    if (this.isShuttingDown) {
      report.status = 'shutting_down';
    } else if (hasUnhealthy) {
      report.status = 'unhealthy';
    }

    return report;
  }

  /**
   * Set shutdown status
   */
  shutdown() {
    this.isShuttingDown = true;
  }

  /**
   * Express middleware for /health endpoint
   */
  middleware() {
    return async (req, res) => {
      const health = await this.getHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    };
  }
}

/**
 * Default health checks
 */
function createDefaultHealthChecker() {
  const checker = new HealthChecker();

  // Check memory usage
  checker.register('memory', async () => {
    const usage = process.memoryUsage();
    const percentUsed = (usage.heapUsed / usage.heapTotal) * 100;
    return {
      status: percentUsed > 95 ? 'unhealthy' : 'healthy',
      message: `${percentUsed.toFixed(1)}% heap used`,
      used_mb: Math.round(usage.heapUsed / 1024 / 1024),
      total_mb: Math.round(usage.heapTotal / 1024 / 1024)
    };
  });

  // Check uptime
  checker.register('uptime', async () => {
    const uptime = process.uptime();
    return {
      status: 'healthy',
      message: `${Math.round(uptime / 60)} minutes`,
      seconds: Math.round(uptime)
    };
  });

  // Check Node.js version
  checker.register('runtime', async () => {
    return {
      status: 'healthy',
      message: `Node ${process.version}`,
      version: process.version,
      platform: process.platform
    };
  });

  return checker;
}

module.exports = {
  HealthChecker,
  createDefaultHealthChecker
};
