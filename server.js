#!/usr/bin/env node

/**
 * PHASE 1 PRODUCTION SERVER
 *
 * Wraps Orchestrator with Phase 1 critical features:
 * - Request context tracing (userId, tenantId, requestId)
 * - Health check endpoint (/health)
 * - Graceful shutdown handler
 * - Database rate limiting
 * - Structured logging
 */

const express = require('express');
const path = require('path');

// Phase 1 Modules
const { requestContext, requestContextMiddleware, withContext } = require('./orchestrator/request-context.js');
const { createDefaultHealthChecker } = require('./orchestrator/health-check.js');
const { setupGracefulShutdown } = require('./orchestrator/graceful-shutdown.js');
const { DatabaseRateLimiter } = require('./orchestrator/database-rate-limiter.js');
const { StructuredLogger, createLogger } = require('./orchestrator/structured-logger.js');

// Import Orchestrator
const { PenetrationTestOrchestrator } = require('./orchestrator/Orchestrator.js');

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const port = process.env.PORT || 3000;

// Initialize Phase 1 components
const logger = createLogger(path.join(__dirname, 'logs'));
const healthChecker = createDefaultHealthChecker();
const dbRateLimiter = new DatabaseRateLimiter();

// Make logger global for easy access
global.logger = logger;

// ============================================================================
// MIDDLEWARE STACK - Order matters!
// ============================================================================

// 1. Request context (must be first - sets up tracing)
app.use(requestContextMiddleware);

// 2. JSON parsing
app.use(express.json());

// 3. Request logging
app.use((req, res, next) => {
  const ctx = requestContext.getCurrent();
  logger.info('HTTP request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    request_id: ctx.requestId
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health Check Endpoint
 * Used by Kubernetes/Docker for liveness and readiness probes
 * Also useful for monitoring systems
 */
app.get('/health', healthChecker.middleware());

/**
 * Health Check Detail Endpoint
 * Extended health information for debugging
 */
app.get('/health/detailed', async (req, res) => {
  const health = await healthChecker.getHealth();
  const ctx = requestContext.getCurrent();

  logger.info('Health check requested', {
    request_id: ctx.requestId,
    status: health.status
  });

  res.json({
    ...health,
    request_id: ctx.requestId,
    context: {
      user_id: ctx.userId,
      tenant_id: ctx.tenantId
    }
  });
});

/**
 * Engagement Status Endpoint
 * Get status of current engagement execution
 */
app.get('/api/engagements/:engagementName', async (req, res) => {
  const ctx = requestContext.getCurrent();

  try {
    const orchestrator = new PenetrationTestOrchestrator(req.params.engagementName);
    const result = await dbRateLimiter.executeQuery(
      () => orchestrator.status(),
      ctx.userId,
      ctx.tenantId
    );

    logger.info('Engagement status retrieved', {
      engagement: req.params.engagementName,
      request_id: ctx.requestId
    });

    res.json(result.data);
  } catch (error) {
    if (error.status === 429) {
      res.set('Retry-After', error.retryAfter);
      res.status(429).json({ error: 'Rate limited' });
    } else {
      logger.error('Error getting engagement status', {
        error: error.message,
        engagement: req.params.engagementName,
        request_id: ctx.requestId
      });
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Start Engagement Endpoint
 * Initiate a new penetration test engagement
 */
app.post('/api/engagements', async (req, res) => {
  const ctx = requestContext.getCurrent();

  try {
    const { engagement_name, target_url, scope_file } = req.body;

    if (!engagement_name || !target_url || !scope_file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Rate limit check
    const allowed = dbRateLimiter.checkQueryAllowed(ctx.userId, ctx.tenantId);
    if (!allowed.allowed) {
      res.set('Retry-After', allowed.resetIn);
      return res.status(429).json({ error: allowed.reason });
    }

    const orchestrator = new PenetrationTestOrchestrator(engagement_name);
    const result = await orchestrator.run({
      engagementName: engagement_name,
      targetUrl: target_url,
      scopeFile: scope_file
    });

    logger.info('Engagement started', {
      engagement: engagement_name,
      target: target_url,
      request_id: ctx.requestId,
      user_id: ctx.userId
    });

    res.status(201).json({
      engagement_id: engagement_name,
      status: 'started',
      findings_count: result.allFindings.length
    });
  } catch (error) {
    logger.error('Error starting engagement', {
      error: error.message,
      request_id: ctx.requestId
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Metrics Endpoint (for monitoring)
 */
app.get('/api/metrics', (req, res) => {
  const ctx = requestContext.getCurrent();

  const metrics = {
    rate_limiter: dbRateLimiter.getStats(),
    logger: logger.getStats(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    request_id: ctx.requestId
  };

  res.json(metrics);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  const ctx = requestContext.getCurrent();

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    request_id: ctx.requestId,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    request_id: ctx.requestId
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(port, () => {
  logger.info('Phase 1 Server started', {
    port,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });

  // Register health checks
  healthChecker.register('api', async () => ({
    status: 'healthy',
    message: 'API responding',
    timestamp: new Date().toISOString()
  }));

  healthChecker.register('rate_limiter', async () => ({
    status: 'healthy',
    message: 'Rate limiter active',
    stats: dbRateLimiter.getStats()
  }));

  healthChecker.register('logger', async () => ({
    status: 'healthy',
    message: 'Logging operational',
    stats: logger.getStats()
  }));
});

// ============================================================================
// GRACEFUL SHUTDOWN (Phase 1 - Critical)
// ============================================================================

const shutdownManager = setupGracefulShutdown(server, {
  shutdownTimeout: 30000,
  logger
});

// Cleanup hooks
shutdownManager.beforeShutdown(async () => {
  logger.info('Closing database connections...');
  // Add your database cleanup here
});

shutdownManager.afterShutdown(async () => {
  logger.info('Flushing logs...');
  // Logs are already flushed by graceful shutdown
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { app, server, logger, requestContext };
