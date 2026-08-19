#!/usr/bin/env node

/**
 * REQUEST TIMEOUT PROTECTION - Phase 2 Optimization
 *
 * Wraps async operations with timeout protection.
 * Prevents hung requests from blocking the thread indefinitely.
 */

class RequestTimeoutError extends Error {
  constructor(message, operationId) {
    super(message);
    this.name = 'RequestTimeoutError';
    this.operationId = operationId;
    this.code = 'ETIMEDOUT';
  }
}

/**
 * Wrap async function with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationId - Unique operation identifier
 * @returns {Promise} Result or timeout error
 */
async function withTimeout(fn, timeoutMs, operationId = 'unknown') {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new RequestTimeoutError(
          `Operation ${operationId} exceeded timeout of ${timeoutMs}ms`,
          operationId
        )),
        timeoutMs
      )
    )
  ]);
}

/**
 * Middleware to enforce request timeout
 * @param {number} timeoutMs - Timeout in milliseconds (default 30s)
 * @returns {Function} Express middleware
 */
function requestTimeoutMiddleware(timeoutMs = 30000) {
  return (req, res, next) => {
    const ctx = req.requestContext?.() || {};
    const operationId = ctx.requestId || req.get('X-Request-ID') || 'unknown';

    // Set response timeout
    req.setTimeout(timeoutMs, () => {
      const logger = global.logger;
      if (logger) {
        logger.warn('Request timeout', {
          operation_id: operationId,
          path: req.path,
          method: req.method,
          timeout_ms: timeoutMs
        });
      }

      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          operation_id: operationId,
          timeout_ms: timeoutMs
        });
      }

      res.destroy();
    });

    next();
  };
}

/**
 * Batch operation with timeout
 * @param {Array<Function>} operations - Array of async operations
 * @param {number} timeoutMs - Timeout per operation
 * @param {object} options - Configuration options
 * @returns {Promise<Array>} Results array
 */
async function batchWithTimeout(operations, timeoutMs = 30000, options = {}) {
  const {
    continueOnError = false,
    parallel = false
  } = options;

  const results = [];
  const errors = [];

  const executeOp = async (op, index) => {
    try {
      const result = await withTimeout(
        op,
        timeoutMs,
        `batch-op-${index}`
      );
      results[index] = result;
    } catch (error) {
      if (continueOnError) {
        errors.push({ index, error });
        results[index] = null;
      } else {
        throw error;
      }
    }
  };

  if (parallel) {
    await Promise.all(operations.map((op, i) => executeOp(op, i)));
  } else {
    for (let i = 0; i < operations.length; i++) {
      await executeOp(operations[i], i);
    }
  }

  return {
    results,
    errors,
    success: errors.length === 0,
    errorCount: errors.length,
    successCount: results.filter(r => r !== null).length
  };
}

module.exports = {
  RequestTimeoutError,
  withTimeout,
  requestTimeoutMiddleware,
  batchWithTimeout
};
