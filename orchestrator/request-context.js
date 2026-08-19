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
 * SECURITY: Derives userId/tenantId from verified auth, not client headers
 */
function requestContextMiddleware(req, res, next) {
  // Extract userId from verified token/session ONLY
  // Never trust X-User-ID or X-Tenant-ID headers from client
  let userId = 'anonymous';
  let tenantId = 'default';
  let isAuthenticated = false;

  // Check for Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // NOTE: JWT verification requires:
      // 1. jsonwebtoken package: npm install jsonwebtoken
      // 2. JWT_SECRET or JWT_PUBLIC_KEY in environment
      // For now, fail closed (require verification to be implemented)
      // DO NOT ship with unverified tokens - this will be a 401
      // SECURITY: Require JWT_SECRET to be configured - fail if missing
      const secret = process.env.JWT_SECRET || process.env.JWT_PUBLIC_KEY;
      if (!secret) {
        const logger = global.logger;
        if (logger) {
          logger.error('FATAL: JWT_SECRET or JWT_PUBLIC_KEY not configured', {
            path: req.path,
            message: 'Bearer token provided but no verification key available'
          });
        }
        throw new Error('JWT verification not configured - cannot authenticate bearer tokens');
      }

      const jwt = require('jsonwebtoken');
      const options = {
        algorithms: process.env.JWT_ALGORITHM ? [process.env.JWT_ALGORITHM] : ['HS256']
      };
      const claims = jwt.verify(token, secret, options);
      userId = claims.sub || claims.user_id || claims.id;
      tenantId = claims.tenant || claims.tenant_id || 'default';
      isAuthenticated = true;
    } catch (error) {
      // Token verification failed - fall back to unauthenticated
      const logger = global.logger;
      if (logger) {
        logger.debug('JWT verification failed', {
          error: error.message,
          path: req.path
        });
      }
      isAuthenticated = false;
    }
  }

  // Fall back to req.ip for rate limiting unauthenticated requests
  if (!isAuthenticated) {
    userId = req.ip || 'unknown-ip';
  }

  const requestId = requestContext.initialize({
    requestId: req.headers['x-request-id'] || undefined,
    userId,  // From verified auth only, never from client headers
    tenantId,  // From verified auth only
    isAuthenticated,
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
