#!/usr/bin/env node

/**
 * STRUCTURED LOGGER
 *
 * Comprehensive logging with JSONL format, context tracking, and audit trails.
 * Integrates with observability platforms (CloudWatch, ELK, Datadog, New Relic).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class StructuredLogger {
  constructor(logDir = './logs', config = {}) {
    this.logDir = logDir;
    this.config = {
      serviceName: config.serviceName || 'SecurityTestingFramework',
      environment: config.environment || process.env.NODE_ENV || 'development',
      version: config.version || '5.0',
      minLevel: config.minLevel || 'info',  // debug, info, warn, error, fatal
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile !== false,
      enableRemote: config.enableRemote || false
    };

    this.logFiles = {
      debug: path.join(logDir, 'debug.jsonl'),
      info: path.join(logDir, 'info.jsonl'),
      warn: path.join(logDir, 'warn.jsonl'),
      error: path.join(logDir, 'error.jsonl'),
      audit: path.join(logDir, 'audit.jsonl')
    };

    this.contextStack = [];
    this.requestTraces = new Map();

    this._ensureLogDirectory();
  }

  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {object} context - Additional context
   */
  debug(message, context = {}) {
    this._log('debug', message, context);
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {object} context - Additional context
   */
  info(message, context = {}) {
    this._log('info', message, context);
  }

  /**
   * Log warning
   * @param {string} message - Message to log
   * @param {object} context - Additional context
   */
  warn(message, context = {}) {
    this._log('warn', message, context);
  }

  /**
   * Log error
   * @param {string} message - Message to log
   * @param {object} context - Additional context
   */
  error(message, context = {}) {
    this._log('error', message, context);
  }

  /**
   * Log fatal error
   * @param {string} message - Message to log
   * @param {object} context - Additional context
   */
  fatal(message, context = {}) {
    this._log('fatal', message, context);
  }

  /**
   * Log audit event (separate from regular logs)
   * @param {string} action - Audit action
   * @param {string} resource - Resource affected
   * @param {object} details - Action details
   */
  audit(action, resource, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'audit',
      action,
      resource,
      actor: details.actor || 'system',
      details,
      trace_id: this._getCurrentTraceId()
    };

    this._writeLog('audit', entry);
  }

  /**
   * Start a new request trace
   * @param {string} traceId - Unique trace ID
   * @returns {string} Trace ID
   */
  startTrace(traceId = null) {
    const id = traceId || this._generateTraceId();
    this.requestTraces.set(id, {
      startTime: Date.now(),
      spans: []
    });
    return id;
  }

  /**
   * Add span to current trace
   * @param {string} spanName - Span name
   * @param {object} context - Span context
   */
  addSpan(spanName, context = {}) {
    const traceId = this._getCurrentTraceId();
    if (!traceId) return;

    const trace = this.requestTraces.get(traceId);
    if (trace) {
      trace.spans.push({
        name: spanName,
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  /**
   * End trace and log summary
   * @param {string} traceId - Trace ID to end
   * @param {object} result - Result context
   */
  endTrace(traceId, result = {}) {
    const trace = this.requestTraces.get(traceId);
    if (!trace) return;

    const duration = Date.now() - trace.startTime;

    this._log('info', `Trace completed: ${traceId}`, {
      trace_id: traceId,
      duration_ms: duration,
      span_count: trace.spans.length,
      spans: trace.spans,
      ...result
    });

    this.requestTraces.delete(traceId);
  }

  /**
   * Push context for nested operations
   * @param {object} context - Context to push
   */
  pushContext(context) {
    this.contextStack.push(context);
  }

  /**
   * Pop context
   */
  popContext() {
    this.contextStack.pop();
  }

  /**
   * Get statistics
   * @returns {object} Log statistics
   */
  getStats() {
    const stats = {};

    Object.entries(this.logFiles).forEach(([level, filePath]) => {
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
        stats[level] = lines.length;
      } else {
        stats[level] = 0;
      }
    });

    return stats;
  }

  /**
   * Query logs
   * @param {object} filter - Filter criteria
   * @returns {Array} Matching log entries
   */
  queryLogs(filter = {}) {
    const results = [];
    const logPath = this.logFiles[filter.level || 'info'];

    if (!fs.existsSync(logPath)) return results;

    const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l.trim());

    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);

        // Apply filters
        if (filter.message && !entry.message.includes(filter.message)) return;
        if (filter.actor && entry.actor !== filter.actor) return;
        if (filter.resource && entry.resource !== filter.resource) return;
        if (filter.traceId && entry.trace_id !== filter.traceId) return;

        results.push(entry);
      } catch (e) {
        // Skip invalid JSON lines
      }
    });

    return results;
  }

  /**
   * Internal: Main logging function
   * @private
   */
  _log(level, message, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      trace_id: this._getCurrentTraceId(),
      span_id: this._getCurrentSpanId(),
      ...this._mergedContext(),
      ...context
    };

    this._writeLog(level, entry);

    if (this.config.enableConsole) {
      this._logToConsole(level, entry);
    }

    if (this.config.enableRemote && level === 'error') {
      this._sendToRemote(entry);
    }
  }

  /**
   * Internal: Write log to file
   * @private
   */
  _writeLog(level, entry) {
    if (!this.config.enableFile) return;

    const logPath = this.logFiles[level] || this.logFiles.info;
    const line = JSON.stringify(entry) + '\n';

    fs.appendFileSync(logPath, line, { flag: 'a' });
  }

  /**
   * Internal: Log to console
   * @private
   */
  _logToConsole(level, entry) {
    const colors = {
      debug: '\x1b[36m',    // cyan
      info: '\x1b[32m',     // green
      warn: '\x1b[33m',     // yellow
      error: '\x1b[31m',    // red
      fatal: '\x1b[35m',    // magenta
      audit: '\x1b[36m'     // cyan
    };

    const color = colors[level] || '';
    const reset = '\x1b[0m';

    console.log(`${color}[${level.toUpperCase()}]${reset} ${entry.message}`, entry);
  }

  /**
   * Internal: Send to remote observability platform
   * @private
   */
  _sendToRemote(entry) {
    // In production: send to Datadog, New Relic, CloudWatch, etc.
    // This is a stub implementation
    // Could use: https.post() to send to remote service
  }

  /**
   * Internal: Merge context stack
   * @private
   */
  _mergedContext() {
    const merged = {};
    this.contextStack.forEach(ctx => {
      Object.assign(merged, ctx);
    });
    return merged;
  }

  /**
   * Internal: Get current trace ID
   * @private
   */
  _getCurrentTraceId() {
    // Get from context stack or generate new one
    for (let i = this.contextStack.length - 1; i >= 0; i--) {
      if (this.contextStack[i].trace_id) {
        return this.contextStack[i].trace_id;
      }
    }
    return null;
  }

  /**
   * Internal: Get current span ID
   * @private
   */
  _getCurrentSpanId() {
    for (let i = this.contextStack.length - 1; i >= 0; i--) {
      if (this.contextStack[i].span_id) {
        return this.contextStack[i].span_id;
      }
    }
    return null;
  }

  /**
   * Internal: Generate trace ID
   * @private
   */
  _generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Internal: Ensure log directory exists
   * @private
   */
  _ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
}

function createLogger(logDir, config) {
  return new StructuredLogger(logDir, config);
}

module.exports = {
  StructuredLogger,
  createLogger
};
