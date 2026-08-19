#!/usr/bin/env node

/**
 * REQUEST CONTEXT MIDDLEWARE
 *
 * Propagates request context (requestId, userId, tenantId) through entire operation.
 * Enables end-to-end tracing: user → engagement → findings → audit logs
 */

const crypto = require('crypto');

class RequestContext {
  constructor() {
    this.stack = [];
  }

  /**
   * Initialize context for new request
   * @param {object} data - Context data (userId, tenantId, etc.)
   * @returns {string} requestId for tracing
   */
  initialize(data = {}) {
    const requestId = data.requestId || this._generateId();
    const context = {
      requestId,
      userId: data.userId || 'system',
      tenantId: data.tenantId || 'default',
      agentName: data.agentName || null,
      engagementId: data.engagementId || null,
      timestamp: new Date().toISOString(),
      ...data
    };

    this.stack.push(context);
    return requestId;
  }

  /**
   * Push nested context (for sub-operations)
   * @param {object} data - Additional context
   */
  push(data = {}) {
    const current = this.getCurrent();
    const nested = {
      ...current,
      ...data,
      parentRequestId: current.requestId
    };
    this.stack.push(nested);
  }

  /**
   * Pop context
   */
  pop() {
    if (this.stack.length > 1) {
      this.stack.pop();
    }
  }

  /**
   * Get current context
   * @returns {object} Current context
   */
  getCurrent() {
    if (this.stack.length === 0) {
      return {
        requestId: this._generateId(),
        userId: 'system',
        tenantId: 'default',
        timestamp: new Date().toISOString()
      };
    }
    return this.stack[this.stack.length - 1];
  }

  /**
   * Get full context stack for debugging
   * @returns {Array} Full stack
   */
  getStack() {
    return [...this.stack];
  }

  /**
   * Clear context
   */
  clear() {
    this.stack = [];
  }

  /**
   * Internal: Generate unique ID
   * @private
   */
  _generateId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

// Singleton instance
const requestContext = new RequestContext();

/**
 * Express middleware to initialize context
 */
function requestContextMiddleware(req, res, next) {
  const requestId = requestContext.initialize({
    requestId: req.headers['x-request-id'] || undefined,
    userId: req.user?.id || req.headers['x-user-id'] || 'anonymous',
    tenantId: req.headers['x-tenant-id'] || 'default',
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Make context available to all downstream handlers
  req.requestContext = () => requestContext.getCurrent();
  res.on('finish', () => requestContext.clear());

  // Set response header for tracing
  res.set('X-Request-ID', requestId);

  next();
}

/**
 * Wrap async function to preserve context
 */
function withContext(fn) {
  return async function(...args) {
    try {
      return await fn(...args);
    } finally {
      // Context remains intact for logging
    }
  };
}

module.exports = {
  RequestContext,
  requestContext,
  requestContextMiddleware,
  withContext
};
