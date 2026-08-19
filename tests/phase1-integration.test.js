/**
 * PHASE 1 INTEGRATION TESTS
 *
 * Tests all Phase 1 critical features:
 * - Request context propagation
 * - Health check endpoint
 * - Graceful shutdown
 * - Database rate limiting
 * - Structured logging
 */

const request = require('supertest');
const { app, logger, requestContext } = require('../server.js');

describe('Phase 1: Critical Features Integration', () => {

  // ============================================================================
  // REQUEST CONTEXT TESTS
  // ============================================================================

  describe('Request Context Propagation', () => {
    test('should initialize context for each request', async () => {
      const res = await request(app)
        .get('/health')
        .set('X-User-ID', 'test-user')
        .set('X-Tenant-ID', 'test-tenant')
        .set('X-Request-ID', 'req-123');

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe('req-123');
    });

    test('should propagate context through execution', async () => {
      const ctx = requestContext.getCurrent();
      expect(ctx).toBeDefined();
      expect(ctx.requestId).toBeDefined();
      expect(ctx.userId).toBeDefined();
      expect(ctx.tenantId).toBeDefined();
    });

    test('should track context in nested operations', async () => {
      requestContext.initialize({
        userId: 'user-1',
        tenantId: 'tenant-1'
      });

      requestContext.push({
        operation: 'sub-operation'
      });

      const ctx = requestContext.getCurrent();
      expect(ctx.userId).toBe('user-1');
      expect(ctx.tenantId).toBe('tenant-1');
      expect(ctx.operation).toBe('sub-operation');

      requestContext.pop();
    });

    test('should generate unique request IDs', async () => {
      const id1 = requestContext.initialize().requestId;
      const id2 = requestContext.initialize().requestId;

      expect(id1).not.toBe(id2);
    });
  });

  // ============================================================================
  // HEALTH CHECK TESTS
  // ============================================================================

  describe('Health Check Endpoint', () => {
    test('should return 200 when healthy', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    test('should include health checks', async () => {
      const res = await request(app).get('/health');

      expect(res.body.checks).toBeDefined();
      expect(res.body.checks.memory).toBeDefined();
      expect(res.body.checks.uptime).toBeDefined();
      expect(res.body.checks.runtime).toBeDefined();
    });

    test('should include timestamp', async () => {
      const res = await request(app).get('/health');

      expect(res.body.timestamp).toBeDefined();
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });

    test('should return detailed health on /health/detailed', async () => {
      const res = await request(app).get('/health/detailed');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.context).toBeDefined();
      expect(res.body.context.request_id).toBeDefined();
    });

    test('should track memory usage in health check', async () => {
      const res = await request(app).get('/health');

      expect(res.body.checks.memory.status).toBe('healthy');
      expect(res.body.checks.memory.used_mb).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // GRACEFUL SHUTDOWN TESTS
  // ============================================================================

  describe('Graceful Shutdown', () => {
    test('should handle SIGTERM signal', (done) => {
      // This test verifies the handler is registered
      expect(process.listeners('SIGTERM').length).toBeGreaterThan(0);
      done();
    });

    test('should handle SIGINT signal', (done) => {
      // This test verifies the handler is registered
      expect(process.listeners('SIGINT').length).toBeGreaterThan(0);
      done();
    });

    test('should return 200 for health during normal operation', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.shutdown).toBe(false);
    });
  });

  // ============================================================================
  // RATE LIMITING TESTS
  // ============================================================================

  describe('Database Rate Limiting', () => {
    test('should allow queries within limit', async () => {
      const limiter = require('../orchestrator/database-rate-limiter.js');
      const dbLimiter = new limiter.DatabaseRateLimiter();

      const result = dbLimiter.checkQueryAllowed('user-1', 'tenant-1');

      expect(result.allowed).toBe(true);
      expect(result.userRemaining).toBeGreaterThan(0);
    });

    test('should reject queries exceeding limit', async () => {
      const limiter = require('../orchestrator/database-rate-limiter.js');
      const dbLimiter = new limiter.DatabaseRateLimiter({
        queryPerUserPerMinute: 1  // Very low limit for testing
      });

      // First query should succeed
      const result1 = dbLimiter.checkQueryAllowed('user-2', 'tenant-1');
      expect(result1.allowed).toBe(true);

      // Second query should fail
      const result2 = dbLimiter.checkQueryAllowed('user-2', 'tenant-1');
      expect(result2.allowed).toBe(false);
      expect(result2.reason).toContain('rate limit exceeded');
    });

    test('should validate result size', async () => {
      const limiter = require('../orchestrator/database-rate-limiter.js');
      const dbLimiter = new limiter.DatabaseRateLimiter();

      const small = dbLimiter.checkResultSize(100);
      expect(small.status).toBe('ok');

      const large = dbLimiter.checkResultSize(100000);
      expect(large.status).toBe('error');
    });

    test('should track statistics', async () => {
      const limiter = require('../orchestrator/database-rate-limiter.js');
      const dbLimiter = new limiter.DatabaseRateLimiter();

      const stats = dbLimiter.getStats();

      expect(stats.user_limits.per_minute).toBeDefined();
      expect(stats.tenant_limits.per_minute).toBeDefined();
      expect(stats.result_limits.max_size).toBeDefined();
    });
  });

  // ============================================================================
  // STRUCTURED LOGGING TESTS
  // ============================================================================

  describe('Structured Logging', () => {
    test('should log info messages', () => {
      const log = require('../orchestrator/structured-logger.js');
      const testLogger = new log.StructuredLogger();

      expect(() => {
        testLogger.info('Test message', { key: 'value' });
      }).not.toThrow();
    });

    test('should log error messages', () => {
      const log = require('../orchestrator/structured-logger.js');
      const testLogger = new log.StructuredLogger();

      expect(() => {
        testLogger.error('Error message', { error: 'test' });
      }).not.toThrow();
    });

    test('should support context stacking', () => {
      const log = require('../orchestrator/structured-logger.js');
      const testLogger = new log.StructuredLogger();

      testLogger.pushContext({ tenant_id: 'tenant-1' });
      testLogger.info('Message with context');
      testLogger.popContext();

      expect(() => {
        testLogger.info('Message without context');
      }).not.toThrow();
    });

    test('should track statistics', () => {
      const log = require('../orchestrator/structured-logger.js');
      const testLogger = new log.StructuredLogger();

      const stats = testLogger.getStats();
      expect(stats).toBeDefined();
    });
  });

  // ============================================================================
  // API ENDPOINTS TESTS
  // ============================================================================

  describe('API Endpoints', () => {
    test('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    test('GET /health/detailed should return detailed info', async () => {
      const res = await request(app).get('/health/detailed');
      expect(res.status).toBe(200);
      expect(res.body.request_id).toBeDefined();
    });

    test('GET /api/metrics should return metrics', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      expect(res.body.rate_limiter).toBeDefined();
      expect(res.body.logger).toBeDefined();
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    test('POST /api/engagements should validate required fields', async () => {
      const res = await request(app)
        .post('/api/engagements')
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    test('should include request ID in responses', async () => {
      const res = await request(app).get('/health/detailed');
      expect(res.body.request_id).toBeDefined();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Full Phase 1 Integration', () => {
    test('should handle complete request flow', async () => {
      const res = await request(app)
        .get('/health/detailed')
        .set('X-User-ID', 'integration-user')
        .set('X-Tenant-ID', 'integration-tenant');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.context.user_id).toBeDefined();
      expect(res.body.context.tenant_id).toBeDefined();
      expect(res.body.request_id).toBeDefined();
    });

    test('should track context across endpoints', async () => {
      const res1 = await request(app).get('/health');
      const res2 = await request(app).get('/api/metrics');

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });

    test('should provide monitoring data', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.body.memory).toBeDefined();
      expect(res.body.memory.rss).toBeGreaterThan(0);
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    test('should maintain health under load', async () => {
      const promises = [];

      // Simulate concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/health'));
      }

      const results = await Promise.all(promises);

      results.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
      });
    });
  });
});
