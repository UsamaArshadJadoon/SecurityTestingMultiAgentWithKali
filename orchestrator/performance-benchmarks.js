#!/usr/bin/env node

/**
 * PERFORMANCE BENCHMARKING - Phase 3 Gap 18
 *
 * Measures operation performance and tracks regressions.
 * Provides baseline comparisons and performance reports.
 */

/**
 * Performance benchmark
 */
class PerformanceBenchmark {
  constructor(name, options = {}) {
    this.name = name;
    this.description = options.description || '';
    this.measurements = [];
    this.baseline = options.baseline;
    this.thresholds = {
      maxDuration: options.maxDuration || Infinity,
      maxP95: options.maxP95,
      maxP99: options.maxP99
    };
  }

  /**
   * Record measurement
   */
  recordMeasurement(durationMs, metadata = {}) {
    const measurement = {
      timestamp: Date.now(),
      durationMs,
      metadata
    };

    this.measurements.push(measurement);
    return measurement;
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.measurements.length === 0) {
      return { count: 0, error: 'No measurements' };
    }

    const durations = this.measurements.map(m => m.durationMs).sort((a, b) => a - b);
    const n = durations.length;

    return {
      name: this.name,
      count: n,
      min: durations[0],
      max: durations[n - 1],
      mean: durations.reduce((a, b) => a + b, 0) / n,
      median: durations[Math.floor(n / 2)],
      p95: durations[Math.floor(n * 0.95)],
      p99: durations[Math.floor(n * 0.99)],
      baseline: this.baseline,
      regression: this._checkRegression(durations),
      thresholdViolations: this._checkThresholds(durations)
    };
  }

  /**
   * Check for performance regression
   * @private
   */
  _checkRegression(durations) {
    if (!this.baseline) return null;

    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const increase = ((mean - this.baseline) / this.baseline) * 100;

    return {
      baseline: this.baseline,
      current: mean,
      increase: increase.toFixed(2) + '%',
      regressed: increase > 10 // Regression if >10% slower
    };
  }

  /**
   * Check threshold violations
   * @private
   */
  _checkThresholds(durations) {
    const violations = [];
    const stats = {
      max: Math.max(...durations),
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };

    if (this.thresholds.maxDuration && stats.max > this.thresholds.maxDuration) {
      violations.push({
        metric: 'max',
        value: stats.max,
        threshold: this.thresholds.maxDuration
      });
    }

    if (this.thresholds.maxP95 && stats.p95 > this.thresholds.maxP95) {
      violations.push({
        metric: 'p95',
        value: stats.p95,
        threshold: this.thresholds.maxP95
      });
    }

    if (this.thresholds.maxP99 && stats.p99 > this.thresholds.maxP99) {
      violations.push({
        metric: 'p99',
        value: stats.p99,
        threshold: this.thresholds.maxP99
      });
    }

    return violations;
  }

  /**
   * Clear measurements
   */
  clear() {
    this.measurements = [];
  }

  /**
   * Set new baseline
   */
  setBaseline(durationMs) {
    this.baseline = durationMs;
  }
}

/**
 * Performance benchmark manager
 */
class BenchmarkManager {
  constructor() {
    this.benchmarks = new Map();
    this.activeTimers = new Map();
  }

  /**
   * Register benchmark
   */
  registerBenchmark(name, options = {}) {
    const benchmark = new PerformanceBenchmark(name, options);
    this.benchmarks.set(name, benchmark);
    return benchmark;
  }

  /**
   * Start timer for benchmark
   */
  startTimer(benchmarkName, timerId = null) {
    const id = timerId || `${benchmarkName}-${Date.now()}-${Math.random()}`;
    this.activeTimers.set(id, {
      benchmarkName,
      startTime: Date.now()
    });
    return id;
  }

  /**
   * Stop timer and record measurement
   */
  stopTimer(timerId, metadata = {}) {
    const timerInfo = this.activeTimers.get(timerId);
    if (!timerInfo) {
      throw new Error(`Timer ${timerId} not found`);
    }

    const durationMs = Date.now() - timerInfo.startTime;
    const benchmark = this.benchmarks.get(timerInfo.benchmarkName);

    if (benchmark) {
      benchmark.recordMeasurement(durationMs, metadata);
    }

    this.activeTimers.delete(timerId);
    return durationMs;
  }

  /**
   * Get benchmark stats
   */
  getBenchmarkStats(name) {
    const benchmark = this.benchmarks.get(name);
    if (!benchmark) return null;
    return benchmark.getStats();
  }

  /**
   * Get all benchmarks stats
   */
  getAllStats() {
    const stats = {};
    this.benchmarks.forEach((benchmark, name) => {
      stats[name] = benchmark.getStats();
    });
    return stats;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalBenchmarks: this.benchmarks.size,
      benchmarks: this.getAllStats(),
      regressions: [],
      thresholdViolations: []
    };

    // Collect regressions
    Object.entries(report.benchmarks).forEach(([name, stats]) => {
      if (stats.regression?.regressed) {
        report.regressions.push({
          benchmark: name,
          ...stats.regression
        });
      }

      if (stats.thresholdViolations?.length > 0) {
        report.thresholdViolations.push({
          benchmark: name,
          violations: stats.thresholdViolations
        });
      }
    });

    return report;
  }
}

/**
 * Express middleware for automatic performance measurement
 */
function performanceMeasurementMiddleware(manager) {
  return (req, res, next) => {
    const benchmarkName = `${req.method}:${req.path}`;
    const timerId = manager.startTimer(benchmarkName);

    // Ensure benchmark exists
    if (!manager.benchmarks.has(benchmarkName)) {
      manager.registerBenchmark(benchmarkName);
    }

    // Hook into response finish
    res.on('finish', () => {
      const duration = manager.stopTimer(timerId, {
        statusCode: res.statusCode
      });

      res.set('X-Response-Time', `${duration}ms`);
    });

    next();
  };
}

/**
 * Decorator for benchmarking async functions
 */
function benchmark(manager, benchmarkName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const timerId = manager.startTimer(benchmarkName);
      try {
        return await originalMethod.apply(this, args);
      } finally {
        manager.stopTimer(timerId);
      }
    };

    return descriptor;
  };
}

/**
 * Time async operation
 */
async function timeOperation(manager, benchmarkName, operation) {
  const timerId = manager.startTimer(benchmarkName);
  try {
    return await operation();
  } finally {
    manager.stopTimer(timerId);
  }
}

module.exports = {
  PerformanceBenchmark,
  BenchmarkManager,
  performanceMeasurementMiddleware,
  benchmark,
  timeOperation
};
