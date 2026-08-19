#!/usr/bin/env node

/**
 * PROMETHEUS METRICS - Phase 2 Optimization
 *
 * Exports metrics in Prometheus format for monitoring and alerting.
 * Provides counters, gauges, and histograms for system observability.
 */

class PrometheusMetrics {
  constructor(config = {}) {
    this.config = {
      prefix: config.prefix || 'security_testing',
      includeTimestamp: config.includeTimestamp !== false
    };

    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.summaries = new Map();
  }

  /**
   * Register a counter metric
   * @param {string} name - Metric name
   * @param {string} help - Metric help text
   * @param {Array<string>} labels - Optional label names
   */
  registerCounter(name, help, labels = []) {
    this.counters.set(name, {
      help,
      labels,
      values: new Map()
    });
  }

  /**
   * Increment a counter
   * @param {string} name - Counter name
   * @param {object} labelValues - Optional label values
   * @param {number} value - Increment value (default 1)
   */
  incrementCounter(name, labelValues = {}, value = 1) {
    const counter = this.counters.get(name);
    if (!counter) return;

    const key = this._labelKey(labelValues);
    const current = counter.values.get(key) || 0;
    counter.values.set(key, current + value);
  }

  /**
   * Register a gauge metric
   * @param {string} name - Metric name
   * @param {string} help - Metric help text
   * @param {Array<string>} labels - Optional label names
   */
  registerGauge(name, help, labels = []) {
    this.gauges.set(name, {
      help,
      labels,
      values: new Map()
    });
  }

  /**
   * Set gauge value
   * @param {string} name - Gauge name
   * @param {number} value - Gauge value
   * @param {object} labelValues - Optional label values
   */
  setGauge(name, value, labelValues = {}) {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this._labelKey(labelValues);
    gauge.values.set(key, value);
  }

  /**
   * Register a histogram metric
   * @param {string} name - Metric name
   * @param {string} help - Metric help text
   * @param {Array<number>} buckets - Histogram buckets
   * @param {Array<string>} labels - Optional label names
   */
  registerHistogram(name, help, buckets = [0.1, 0.5, 1, 5, 10], labels = []) {
    this.histograms.set(name, {
      help,
      buckets,
      labels,
      values: new Map()
    });
  }

  /**
   * Observe a value in histogram
   * @param {string} name - Histogram name
   * @param {number} value - Value to observe
   * @param {object} labelValues - Optional label values
   */
  observeHistogram(name, value, labelValues = {}) {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    const key = this._labelKey(labelValues);
    if (!histogram.values.has(key)) {
      histogram.values.set(key, {
        count: 0,
        sum: 0,
        buckets: histogram.buckets.map(() => 0)
      });
    }

    const entry = histogram.values.get(key);
    entry.count++;
    entry.sum += value;

    // Increment bucket counts
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        entry.buckets[i]++;
      }
    }
  }

  /**
   * Export metrics in Prometheus format
   * @returns {string} Prometheus formatted metrics
   */
  export() {
    const lines = [];

    // Export counters
    for (const [name, counter] of this.counters.entries()) {
      lines.push(`# HELP ${this._fullName(name)} ${counter.help}`);
      lines.push(`# TYPE ${this._fullName(name)} counter`);

      for (const [labelKey, value] of counter.values.entries()) {
        const labels = this._formatLabels(labelKey, counter.labels);
        lines.push(`${this._fullName(name)}${labels} ${value}`);
      }
    }

    // Export gauges
    for (const [name, gauge] of this.gauges.entries()) {
      lines.push(`# HELP ${this._fullName(name)} ${gauge.help}`);
      lines.push(`# TYPE ${this._fullName(name)} gauge`);

      for (const [labelKey, value] of gauge.values.entries()) {
        const labels = this._formatLabels(labelKey, gauge.labels);
        lines.push(`${this._fullName(name)}${labels} ${value}`);
      }
    }

    // Export histograms
    for (const [name, histogram] of this.histograms.entries()) {
      lines.push(`# HELP ${this._fullName(name)} ${histogram.help}`);
      lines.push(`# TYPE ${this._fullName(name)} histogram`);

      for (const [labelKey, entry] of histogram.values.entries()) {
        const labels = this._formatLabels(labelKey, histogram.labels);

        // Bucket lines
        for (let i = 0; i < histogram.buckets.length; i++) {
          const bucket = histogram.buckets[i];
          const bucketLabels = `${labels}le="${bucket}"`;
          lines.push(`${this._fullName(name)}_bucket${bucketLabels} ${entry.buckets[i]}`);
        }

        // +Inf bucket
        lines.push(`${this._fullName(name)}_bucket${labels}le="+Inf" ${entry.count}`);

        // Sum and count
        lines.push(`${this._fullName(name)}_sum${labels} ${entry.sum}`);
        lines.push(`${this._fullName(name)}_count${labels} ${entry.count}`);
      }
    }

    if (this.config.includeTimestamp) {
      lines.push(`# Timestamp: ${new Date().toISOString()}`);
    }

    return lines.join('\n');
  }

  /**
   * Get metrics as object
   * @returns {object} Metrics object
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms)
    };
  }

  /**
   * Internal: Get full metric name with prefix
   * @private
   */
  _fullName(name) {
    return `${this.config.prefix}_${name}`;
  }

  /**
   * Internal: Format labels for output
   * @private
   */
  _formatLabels(labelKey, labelNames) {
    if (!labelNames || labelNames.length === 0) {
      return '';
    }

    const values = labelKey.split('|');
    const pairs = labelNames.map((name, i) => `${name}="${values[i] || ''}"`);
    return `{${pairs.join(',')}}`;
  }

  /**
   * Internal: Create label key from values
   * @private
   */
  _labelKey(labelValues) {
    return Object.values(labelValues).join('|');
  }
}

/**
 * Create default metrics
 */
function createDefaultMetrics() {
  const metrics = new PrometheusMetrics();

  // Counter: Findings discovered
  metrics.registerCounter(
    'findings_discovered_total',
    'Total findings discovered',
    ['severity', 'agent']
  );

  // Counter: SLA breaches
  metrics.registerCounter(
    'sla_breaches_total',
    'Total SLA breaches',
    ['stage']
  );

  // Gauge: Active operations
  metrics.registerGauge(
    'active_operations',
    'Current active operations',
    ['type']
  );

  // Gauge: Pool stats
  metrics.registerGauge(
    'connection_pool_available',
    'Available connections in pool'
  );

  // Histogram: Query duration
  metrics.registerHistogram(
    'query_duration_seconds',
    'Database query duration',
    [0.01, 0.05, 0.1, 0.5, 1, 5],
    ['operation']
  );

  // Histogram: Request duration
  metrics.registerHistogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    [0.01, 0.05, 0.1, 0.5, 1],
    ['method', 'path']
  );

  return metrics;
}

module.exports = {
  PrometheusMetrics,
  createDefaultMetrics
};
