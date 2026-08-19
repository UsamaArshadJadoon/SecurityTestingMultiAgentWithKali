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

// Phase 2 Modules (Performance Optimization)
const { DatabasePool } = require('./orchestrator/database-pool.js');
const { PrometheusMetrics, createDefaultMetrics } = require('./orchestrator/prometheus-metrics.js');
const { withTimeout, requestTimeoutMiddleware } = require('./orchestrator/request-timeout.js');
const { validateConfig, loadEnvironmentConfig, validateConfigOnStartup } = require('./orchestrator/config-validator.js');
const { processBulk } = require('./orchestrator/bulk-operations.js');

// Phase 3 Modules (Enterprise Features)
const { validateRequest } = require('./orchestrator/schema-validator.js');
const { classifyError, retryWithBackoff, errorHandler } = require('./orchestrator/error-handler.js');
const { ApiVersionManager, apiVersionMiddleware } = require('./orchestrator/api-versioning.js');
const { CircuitBreakerRegistry, circuitBreakerMiddleware } = require('./orchestrator/circuit-breaker.js');
const { EndpointRateLimiter, endpointRateLimitMiddleware } = require('./orchestrator/endpoint-rate-limiter.js');
const { RequestSigner, requestSigningMiddleware } = require('./orchestrator/request-signing.js');
const { AuditLogger } = require('./orchestrator/audit-logger.js');
const { FeatureFlagManager, featureFlagMiddleware } = require('./orchestrator/feature-flags.js');
const { BenchmarkManager, performanceMeasurementMiddleware } = require('./orchestrator/performance-benchmarks.js');

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

// Initialize Phase 2 components
const dbPool = new DatabasePool({
  min: 5,
  max: 20,
  idleTimeout: 30000,
  acquireTimeout: 5000
});

const prometheusMetrics = createDefaultMetrics();

// Initialize Phase 3 components
const versionManager = new ApiVersionManager();
const circuitBreakerRegistry = new CircuitBreakerRegistry();
const endpointLimiter = new EndpointRateLimiter();

// SECURITY: Require explicit request signing secret - fail if not configured
if (!process.env.REQUEST_SIGNING_SECRET) {
  logger.error('FATAL: REQUEST_SIGNING_SECRET environment variable not set');
  process.exit(1);
}
const requestSigner = new RequestSigner(process.env.REQUEST_SIGNING_SECRET);

const auditLogger = new AuditLogger(path.join(__dirname, 'audit-logs'));
const featureFlagManager = new FeatureFlagManager();
const benchmarkManager = new BenchmarkManager();

// Make logger, metrics, and managers global for easy access
global.logger = logger;
global.metrics = prometheusMetrics;
global.auditLogger = auditLogger;
global.featureFlags = featureFlagManager;
global.benchmarks = benchmarkManager;

// ============================================================================
// MIDDLEWARE STACK - Order matters!
// ============================================================================

// 1. Request context (must be first - sets up tracing)
app.use(requestContextMiddleware);

// 2. JSON parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// 4. Request timeout protection (Phase 2)
app.use(requestTimeoutMiddleware());

// 5. API versioning (Phase 3)
app.use(apiVersionMiddleware(versionManager));

// 6. Feature flags (Phase 3)
app.use(featureFlagMiddleware(featureFlagManager));

// 7. Performance measurement (Phase 3)
app.use(performanceMeasurementMiddleware(benchmarkManager));

// 8. Circuit breaker (Phase 3)
app.use(circuitBreakerMiddleware(circuitBreakerRegistry, 'main-api'));

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
 * Authentication middleware - validates Bearer token
 * SECURITY: Requires authenticated request with valid Bearer token
 */
function authRequired(req, res, next) {
  const ctx = requestContext.getCurrent();

  if (!ctx.isAuthenticated) {
    logger.warn('Unauthenticated request to protected endpoint', {
      path: req.path,
      method: req.method,
      request_id: ctx.requestId,
      ip: req.ip
    });
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

/**
 * Validate URL to prevent SSRF attacks
 * SECURITY: Prevents requests to loopback, private IPs, metadata endpoints
 * Uses DNS resolution to prevent DNS rebinding attacks
 */
async function validateTargetUrl(url) {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, reason: 'Invalid protocol' };
    }

    const hostname = parsed.hostname?.toLowerCase().replace(/\.$/, '');
    if (!hostname) {
      return { valid: false, reason: 'No hostname in URL' };
    }

    // Reject 0.0.0.0 and other special cases
    if (['0.0.0.0', '0.0.0.0'].includes(hostname)) {
      return { valid: false, reason: 'Invalid IP address' };
    }

    // Reject bracketed IPv6 that are private
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const ipv6 = hostname.slice(1, -1);
      if (isPrivateOrReservedIp(ipv6)) {
        return { valid: false, reason: 'Private IPv6 address not allowed' };
      }
    }

    // Try to resolve hostname (handles DNS rebinding attacks)
    try {
      const dns = require('dns').promises;
      const addresses = await dns.resolve4(hostname).catch(() => []);
      const addressesV6 = await dns.resolve6(hostname).catch(() => []);
      const allAddresses = [...addresses, ...addressesV6];

      // If hostname resolves to private/reserved IPs, reject
      for (const addr of allAddresses) {
        if (isPrivateOrReservedIp(addr)) {
          return { valid: false, reason: `Resolved IP ${addr} is private or reserved` };
        }
      }
    } catch (dnsError) {
      // DNS resolution failed - still try string matching as fallback
      if (isPrivateOrReservedIp(hostname)) {
        return { valid: false, reason: 'Private or reserved IP address' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Check if IP is private, loopback, or reserved
 * SECURITY: Comprehensive IP range validation
 */
function isPrivateOrReservedIp(ip) {
  // Loopback (IPv4)
  if (ip === 'localhost' || ip === '127.0.0.1' || /^127\./.test(ip)) {
    return true;
  }

  // Loopback (IPv6)
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }

  // Private ranges (RFC 1918)
  if (/^10\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip) || /^192\.168\./.test(ip)) {
    return true;
  }

  // Link-local (169.254.x.x)
  if (/^169\.254\./.test(ip)) {
    return true;
  }

  // Metadata endpoints
  if (ip === '169.254.169.254') {
    return true;
  }

  // Reserved (0.0.0.0/8, 255.255.255.255)
  if (/^0\./.test(ip) || /^255\./.test(ip)) {
    return true;
  }

  // IPv6 ULA (fd00::/8)
  if (/^fd[0-9a-f]{2}:/i.test(ip)) {
    return true;
  }

  // IPv6 link-local (fe80::/10)
  if (/^fe80:/i.test(ip)) {
    return true;
  }

  // IPv6 multicast (ff00::/8)
  if (/^ff/i.test(ip)) {
    return true;
  }

  // IPv6 loopback
  if (ip === '::1') {
    return true;
  }

  return false;
}

/**
 * Validate scope file path to prevent directory traversal
 * SECURITY: Restricts scope files to whitelisted directory
 */
function validateScopeFile(scopePath) {
  const path = require('path');
  const fs = require('fs');

  // Whitelist directory for scope files
  const SCOPE_DIR = path.join(__dirname, 'scopes');

  try {
    const realPath = fs.realpathSync(scopePath);
    const basePath = fs.realpathSync(SCOPE_DIR);

    // Check if file is within scope directory
    if (!realPath.startsWith(basePath + path.sep)) {
      return { valid: false, reason: 'Scope file outside allowed directory' };
    }

    // Check if file exists and is readable
    if (!fs.existsSync(realPath)) {
      return { valid: false, reason: 'Scope file not found' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid scope file path' };
  }
}

/**
 * Start Engagement Endpoint
 * Initiate a new penetration test engagement
 * SECURITY: Requires authentication, validates inputs
 */
app.post('/api/engagements', authRequired, async (req, res) => {
  const ctx = requestContext.getCurrent();

  try {
    const { engagement_name, target_url, scope_file } = req.body;

    // Validate required fields
    if (!engagement_name || !target_url || !scope_file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate target URL (prevent SSRF with DNS rebinding protection)
    const urlValidation = await validateTargetUrl(target_url);
    if (!urlValidation.valid) {
      logger.warn('Invalid target URL', {
        reason: urlValidation.reason,
        request_id: ctx.requestId,
        user_id: ctx.userId
      });
      return res.status(400).json({ error: urlValidation.reason });
    }

    // Validate scope file (prevent directory traversal)
    const fileValidation = validateScopeFile(scope_file);
    if (!fileValidation.valid) {
      logger.warn('Invalid scope file', {
        reason: fileValidation.reason,
        request_id: ctx.requestId,
        user_id: ctx.userId
      });
      return res.status(400).json({ error: fileValidation.reason });
    }

    // Rate limit check (derived from authenticated user, not spoofable headers)
    const allowed = dbRateLimiter.checkQueryAllowed(ctx.userId, ctx.tenantId);
    if (!allowed.allowed) {
      res.set('Retry-After', allowed.resetIn);
      logger.warn('Rate limit exceeded', {
        request_id: ctx.requestId,
        user_id: ctx.userId
      });
      return res.status(429).json({ error: allowed.reason });
    }

    // Track metrics
    const startTime = Date.now();

    try {
      const orchestrator = new PenetrationTestOrchestrator(engagement_name);
      const result = await orchestrator.run({
        engagementName: engagement_name,
        targetUrl: target_url,
        scopeFile: scope_file
      });

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      prometheusMetrics.observeHistogram('http_request_duration_seconds', duration, {
        method: 'POST',
        path: '/api/engagements'
      });
      prometheusMetrics.incrementCounter('findings_discovered_total', {
        severity: 'unknown',  // Would be determined by finding analysis
        agent: 'orchestrator'
      }, result.allFindings.length);

      logger.info('Engagement started', {
        engagement: engagement_name,
        target: target_url,
        request_id: ctx.requestId,
        user_id: ctx.userId,
        findings: result.allFindings.length,
        duration
      });

      res.status(201).json({
        engagement_id: engagement_name,
        status: 'started',
        findings_count: result.allFindings.length
      });
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      prometheusMetrics.observeHistogram('http_request_duration_seconds', duration, {
        method: 'POST',
        path: '/api/engagements'
      });
      throw error;
    }
  } catch (error) {
    logger.error('Error starting engagement', {
      error: error.message,
      request_id: ctx.requestId,
      user_id: ctx.userId
    });
    res.status(500).json({ error: error.message });
  }
});

/**
 * JSON Metrics Endpoint (for monitoring)
 */
app.get('/api/metrics', (req, res) => {
  const ctx = requestContext.getCurrent();

  const metrics = {
    rate_limiter: dbRateLimiter.getStats(),
    database_pool: dbPool.getStats(),
    logger: logger.getStats(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    request_id: ctx?.requestId || req.get('X-Request-ID') || 'unknown'
  };

  res.json(metrics);
});

/**
 * Prometheus Metrics Endpoint (for scraping)
 */
app.get('/metrics', (req, res) => {
  // Add current pool stats to metrics
  prometheusMetrics.setGauge('connection_pool_available', dbPool.getStats().available);

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(prometheusMetrics.export());
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

  healthChecker.register('database_pool', async () => {
    const stats = dbPool.getStats();
    const status = stats.in_use < stats.max_size ? 'healthy' : 'degraded';
    return {
      status,
      message: `Pool: ${stats.available}/${stats.max_size} available`,
      stats
    };
  });

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
  await dbPool.drain();
  logger.info('Database pool drained');
});

shutdownManager.afterShutdown(async () => {
  logger.info('Flushing logs...');
  // Logs are already flushed by graceful shutdown
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  app,
  server,
  logger,
  requestContext,
  dbPool,           // Phase 2
  prometheusMetrics // Phase 2
};
