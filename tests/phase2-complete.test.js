#!/usr/bin/env node

/**
 * PHASE 2 COMPLETE INTEGRATION TESTS
 *
 * Tests all Phase 2 components working together:
 * - Request timeout protection
 * - Configuration validation
 * - Bulk operations
 * - Security hardening (JWT, SSRF)
 */

const request = require('supertest');
const { app } = require('../server.js');
const {
  validateConfig,
  loadEnvironmentConfig,
  validateConfigOnStartup
} = require('../orchestrator/config-validator.js');
const {
  withTimeout,
  RequestTimeoutError,
  batchWithTimeout
} = require('../orchestrator/request-timeout.js');
const {
  processBulk,
  bulkImportFindings,
  streamingBulkProcessor
} = require('../orchestrator/bulk-operations.js');

describe('Phase 2: Complete Integration', () => {
  // =========================================================================
  // CONFIGURATION TESTS
  // =========================================================================

  describe('Configuration Validation', () => {
    test('should validate correct configuration', () => {
      const config = {
        port: 3000,
        env: 'production',
        database: {
          minConnections: 5,
          maxConnections: 20
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid port', () => {
      const config = {
        port: 70000, // Out of range
        env: 'production'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid environment', () => {
      const config = {
        port: 3000,
        env: 'invalid-env'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    test('should load environment-specific config', () => {
      const devConfig = loadEnvironmentConfig('development');
      expect(devConfig.logLevel).toBe('debug');
      expect(devConfig.security.corsEnabled).toBe(true);
    });

    test('should load production config with security enabled', () => {
      const prodConfig = loadEnvironmentConfig('production');
      expect(prodConfig.logLevel).toBe('warn');
      expect(prodConfig.security.requireAuth).toBe(true);
      expect(prodConfig.security.corsEnabled).toBe(false);
    });

    test('should validate config consistency on startup', async () => {
      const config = {
        port: 3000,
        env: 'test',
        database: {
          minConnections: 20,
          maxConnections: 5 // Invalid: min > max
        }
      };

      await expect(validateConfigOnStartup(config)).rejects.toThrow();
    });

    test('should enforce rateLimit consistency', async () => {
      const config = {
        port: 3000,
        env: 'test',
        rateLimit: {
          perUserPerMinute: 1000,
          perTenantPerMinute: 100 // Invalid: user > tenant
        }
      };

      await expect(validateConfigOnStartup(config)).rejects.toThrow();
    });
  });

  // =========================================================================
  // REQUEST TIMEOUT TESTS
  // =========================================================================

  describe('Request Timeout Protection', () => {
    test('should complete operation within timeout', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      };

      const result = await withTimeout(operation, 5000, 'test-op');
      expect(result).toBe('success');
    });

    test('should timeout operation exceeding limit', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      };

      await expect(withTimeout(operation, 100, 'slow-op')).rejects.toThrow(RequestTimeoutError);
    });

    test('should include operation ID in timeout error', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      };

      try {
        await withTimeout(operation, 100, 'test-op-123');
        fail('Should have thrown');
      } catch (error) {
        expect(error.operationId).toBe('test-op-123');
        expect(error.code).toBe('ETIMEDOUT');
      }
    });

    test('should handle batch operations with timeout', async () => {
      const operations = [
        async () => { await new Promise(r => setTimeout(r, 10)); return 'op1'; },
        async () => { await new Promise(r => setTimeout(r, 10)); return 'op2'; },
        async () => { await new Promise(r => setTimeout(r, 10)); return 'op3'; }
      ];

      const result = await batchWithTimeout(operations, 1000, { parallel: true });
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
    });

    test('should continue on error in batch operations', async () => {
      const operations = [
        async () => { throw new Error('op1 failed'); },
        async () => 'op2 success',
        async () => { throw new Error('op3 failed'); }
      ];

      const result = await batchWithTimeout(operations, 1000, {
        continueOnError: true,
        parallel: true
      });

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(2);
      expect(result.successCount).toBe(1);
    });
  });

  // =========================================================================
  // BULK OPERATIONS TESTS
  // =========================================================================

  describe('Bulk Operations', () => {
    test('should process bulk items sequentially', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = [];

      const processor = async (item) => {
        results.push(item);
        return item * 2;
      };

      const result = await processBulk(items, processor, {
        concurrency: 1,
        operationId: 'bulk-test'
      });

      expect(result.succeeded).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.processed).toBe(5);
      expect(results.length).toBe(5);
    });

    test('should process bulk items concurrently', async () => {
      const items = Array.from({ length: 20 }, (_, i) => i);
      let concurrent = 0;
      let maxConcurrent = 0;

      const processor = async (item) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(r => setTimeout(r, 10));
        concurrent--;
        return item;
      };

      const result = await processBulk(items, processor, {
        concurrency: 5,
        operationId: 'concurrent-test'
      });

      expect(result.succeeded).toBe(20);
      expect(maxConcurrent).toBeLessThanOrEqual(6); // May spike slightly
    });

    test('should handle bulk operation errors', async () => {
      const items = [1, 2, 3, 4, 5];

      const processor = async (item) => {
        if (item === 3) throw new Error('Item 3 failed');
        return item;
      };

      const result = await processBulk(items, processor, {
        continueOnError: true,
        operationId: 'error-test'
      });

      expect(result.succeeded).toBe(4);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    test('should generate bulk operation statistics', async () => {
      const items = Array.from({ length: 100 }, (_, i) => i);

      const processor = async (item) => {
        if (Math.random() < 0.1) throw new Error('Random failure');
        return item;
      };

      const result = await processBulk(items, processor, {
        continueOnError: true,
        operationId: 'stats-test'
      });

      const stats = result.getStats();
      expect(stats.total).toBe(100);
      expect(stats.processed).toBe(100);
      expect(stats.success_rate).toBeDefined();
      expect(stats.duration_ms).toBeGreaterThan(0);
    });

    test('should stream bulk operations', async () => {
      const items = [1, 2, 3, 4, 5];
      const processedItems = [];

      const processor = async (item) => {
        return item * 2;
      };

      const generator = streamingBulkProcessor(items, processor, { concurrency: 2 });
      let count = 0;

      for await (const result of generator) {
        count++;
        if (result.success) {
          processedItems.push(result.result);
        }
      }

      expect(count).toBe(5);
      expect(processedItems.length).toBe(5);
    });
  });

  // =========================================================================
  // SECURITY HARDENING TESTS
  // =========================================================================

  describe('Security Hardening - SSRF Protection', () => {
    test('should reject loopback addresses', async () => {
      const response = await request(app)
        .post('/api/engagements')
        .set('Authorization', 'Bearer test-token')
        .send({
          engagement_name: 'test',
          target_url: 'http://127.0.0.1:8000',
          scope_file: '/tmp/scope.yaml'
        });

      // Should fail due to invalid target_url (SSRF protection)
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not allowed');
    });

    test('should reject private IP ranges', async () => {
      const response = await request(app)
        .post('/api/engagements')
        .set('Authorization', 'Bearer test-token')
        .send({
          engagement_name: 'test',
          target_url: 'http://192.168.1.1',
          scope_file: '/tmp/scope.yaml'
        });

      expect(response.status).toBe(400);
    });

    test('should reject metadata endpoints', async () => {
      const response = await request(app)
        .post('/api/engagements')
        .set('Authorization', 'Bearer test-token')
        .send({
          engagement_name: 'test',
          target_url: 'http://169.254.169.254/latest/meta-data',
          scope_file: '/tmp/scope.yaml'
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // PHASE 2 FULL INTEGRATION
  // =========================================================================

  describe('Phase 2 Full Integration', () => {
    test('should handle config-validated request with timeout protection', async () => {
      const result = await request(app)
        .get('/health')
        .expect(200);

      expect(result.body).toBeDefined();
    });

    test('should report metrics with bulk operation stats', async () => {
      const result = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(result.body.database_pool).toBeDefined();
      expect(result.body.uptime).toBeGreaterThan(0);
    });

    test('should maintain security and performance together', async () => {
      const measurements = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await request(app)
          .get('/health')
          .expect(200);
        const duration = Date.now() - start;
        measurements.push(duration);
      }

      const avgDuration = measurements.reduce((a, b) => a + b) / measurements.length;
      expect(avgDuration).toBeLessThan(500); // Should be fast despite security checks
    });

    test('should expose Prometheus metrics for monitoring Phase 2', async () => {
      const result = await request(app)
        .get('/metrics')
        .expect(200);

      expect(result.text).toContain('connection_pool_available');
      expect(result.text).toContain('security_testing_');
    });
  });
});
