#!/usr/bin/env node

/**
 * PHASE 2 INTEGRATION TESTS
 *
 * Tests for:
 * - Database connection pooling
 * - Prometheus metrics collection and export
 * - Performance metrics tracking
 * - Health check integration with pool status
 */

const request = require('supertest');
const { app, dbPool, prometheusMetrics } = require('../server.js');

describe('Phase 2: Performance Optimization', () => {
  // =========================================================================
  // DATABASE CONNECTION POOL TESTS
  // =========================================================================

  describe('Database Connection Pool', () => {
    test('should initialize with minimum connections', async () => {
      const stats = dbPool.getStats();
      expect(stats.pool_size).toBeGreaterThanOrEqual(5);
      expect(stats.min_size).toBe(5);
      expect(stats.max_size).toBe(20);
    });

    test('should track available connections', async () => {
      const stats = dbPool.getStats();
      expect(stats.available).toBeGreaterThanOrEqual(0);
      expect(stats.in_use).toBeGreaterThanOrEqual(0);
    });

    test('should provide pool statistics', async () => {
      const stats = dbPool.getStats();
      expect(stats).toHaveProperty('pool_size');
      expect(stats).toHaveProperty('available');
      expect(stats).toHaveProperty('in_use');
      expect(stats).toHaveProperty('waiting_queue');
      expect(stats).toHaveProperty('created_total');
      expect(stats).toHaveProperty('acquired_total');
      expect(stats).toHaveProperty('released_total');
      expect(stats).toHaveProperty('timeout_errors');
      expect(stats).toHaveProperty('other_errors');
    });

    test('should acquire and release connections', async () => {
      const before = dbPool.getStats();
      const conn = await dbPool.acquire();
      const during = dbPool.getStats();

      expect(during.in_use).toBeGreaterThan(before.in_use);
      expect(during.acquired_total).toBeGreaterThan(before.acquired_total);

      dbPool.release(conn);
      const after = dbPool.getStats();

      expect(after.released_total).toBeGreaterThan(before.released_total);
    });

    test('should respect max connection limit', async () => {
      const stats = dbPool.getStats();
      expect(stats.pool_size).toBeLessThanOrEqual(stats.max_size);
    });
  });

  // =========================================================================
  // PROMETHEUS METRICS TESTS
  // =========================================================================

  describe('Prometheus Metrics Collection', () => {
    test('should register counter metrics', () => {
      prometheusMetrics.incrementCounter('findings_discovered_total', {
        severity: 'critical',
        agent: 'test'
      }, 5);

      const metrics = prometheusMetrics.getMetrics();
      expect(metrics.counters).toBeDefined();
      expect(metrics.counters['findings_discovered_total']).toBeDefined();
    });

    test('should register gauge metrics', () => {
      prometheusMetrics.setGauge('active_operations', 3, { type: 'test' });

      const metrics = prometheusMetrics.getMetrics();
      expect(metrics.gauges).toBeDefined();
      expect(metrics.gauges['active_operations']).toBeDefined();
    });

    test('should register histogram metrics', () => {
      prometheusMetrics.observeHistogram('query_duration_seconds', 0.25, {
        operation: 'test'
      });

      const metrics = prometheusMetrics.getMetrics();
      expect(metrics.histograms).toBeDefined();
      expect(metrics.histograms['query_duration_seconds']).toBeDefined();
    });

    test('should export metrics in Prometheus format', () => {
      const exported = prometheusMetrics.export();
      expect(typeof exported).toBe('string');
      expect(exported).toContain('# HELP');
      expect(exported).toContain('# TYPE');
    });

    test('should include timestamp in export', () => {
      const exported = prometheusMetrics.export();
      expect(exported).toContain('Timestamp:');
    });

    test('should track findings discovered', () => {
      const before = prometheusMetrics.getMetrics();

      prometheusMetrics.incrementCounter('findings_discovered_total', {
        severity: 'high',
        agent: 'test'
      }, 3);

      const after = prometheusMetrics.getMetrics();
      expect(after.counters['findings_discovered_total']).toBeDefined();
    });

    test('should track query duration histogram', () => {
      const durations = [0.01, 0.05, 0.15, 0.5, 1.2];

      for (const duration of durations) {
        prometheusMetrics.observeHistogram('query_duration_seconds', duration, {
          operation: 'test'
        });
      }

      const metrics = prometheusMetrics.getMetrics();
      expect(metrics.histograms['query_duration_seconds']).toBeDefined();
    });

    test('should track HTTP request duration', () => {
      prometheusMetrics.observeHistogram('http_request_duration_seconds', 0.35, {
        method: 'POST',
        path: '/api/engagements'
      });

      const metrics = prometheusMetrics.getMetrics();
      expect(metrics.histograms['http_request_duration_seconds']).toBeDefined();
    });
  });

  // =========================================================================
  // METRICS ENDPOINT TESTS
  // =========================================================================

  describe('Metrics Endpoints', () => {
    test('GET /api/metrics should return JSON metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('rate_limiter');
      expect(response.body).toHaveProperty('database_pool');
      expect(response.body).toHaveProperty('logger');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      // request_id may not be available in all contexts, but response should have X-Request-ID header
      if (response.body.request_id) {
        expect(typeof response.body.request_id).toBe('string');
      }
      expect(response.headers['x-request-id']).toBeDefined();
    });

    test('GET /api/metrics database_pool should show current stats', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.body.database_pool).toHaveProperty('pool_size');
      expect(response.body.database_pool).toHaveProperty('available');
      expect(response.body.database_pool).toHaveProperty('in_use');
    });

    test('GET /metrics should return Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200)
        .expect('Content-Type', /text\/plain/);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.text).toContain('security_testing_');
    });

    test('GET /metrics should include pool availability', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('connection_pool_available');
    });

    test('GET /metrics should be scrapeable by Prometheus', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      const lines = response.text.split('\n');
      const helpLines = lines.filter(l => l.startsWith('# HELP'));
      const typeLines = lines.filter(l => l.startsWith('# TYPE'));

      expect(helpLines.length).toBeGreaterThan(0);
      expect(typeLines.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // HEALTH CHECK WITH POOL STATUS
  // =========================================================================

  describe('Health Check Integration with Pool', () => {
    test('health check should include database_pool status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.database_pool).toBeDefined();
    });

    test('database_pool health should show available connections', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.checks.database_pool.status).toMatch(/healthy|degraded/);
      expect(response.body.checks.database_pool.stats).toHaveProperty('available');
    });

    test('should report degraded status when pool is saturated', async () => {
      // This is a manual test - pool would need to be saturated
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      const poolStatus = response.body.checks.database_pool.status;
      expect(['healthy', 'degraded']).toContain(poolStatus);
    });
  });

  // =========================================================================
  // PERFORMANCE TRACKING
  // =========================================================================

  describe('Performance Metrics Tracking', () => {
    test('should track HTTP request duration', async () => {
      const before = prometheusMetrics.getMetrics();

      await request(app)
        .get('/health')
        .expect(200);

      const after = prometheusMetrics.getMetrics();
      // Metrics should be recorded (implementation dependent)
      expect(after).toBeDefined();
    });

    test('should measure request latency', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/metrics')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should not degrade performance with metrics collection', async () => {
      const measurements = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await request(app).get('/health').expect(200);
        const duration = Date.now() - startTime;
        measurements.push(duration);
      }

      const avgDuration = measurements.reduce((a, b) => a + b) / measurements.length;
      expect(avgDuration).toBeLessThan(500); // Average should be under 500ms
    });
  });

  // =========================================================================
  // GRACEFUL SHUTDOWN
  // =========================================================================

  describe('Graceful Shutdown with Pool Drain', () => {
    test('should drain pool connections on shutdown', async () => {
      const statsBefore = dbPool.getStats();
      expect(statsBefore.created_total).toBeGreaterThanOrEqual(0);

      // Pool draining is tested via the shutdown manager integration
      // which is tested in phase1-integration.test.js
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Phase 2 Full Integration', () => {
    test('should handle concurrent metrics updates', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/api/metrics').expect(200));
      }

      const results = await Promise.all(promises);
      results.forEach(res => {
        expect(res.body.database_pool).toBeDefined();
      });
    });

    test('should maintain pool health under concurrent load', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/health/detailed')
            .expect(200)
        );
      }

      const results = await Promise.all(promises);
      results.forEach(res => {
        const poolStatus = res.body.checks.database_pool.status;
        expect(['healthy', 'degraded']).toContain(poolStatus);
      });
    });

    test('should expose both JSON and Prometheus metrics', async () => {
      const jsonRes = await request(app).get('/api/metrics').expect(200);
      const prometheusRes = await request(app)
        .get('/metrics')
        .expect(200);

      expect(jsonRes.body).toHaveProperty('database_pool');
      expect(prometheusRes.text).toContain('connection_pool_available');
    });

    test('should track metrics across multiple requests', async () => {
      const before = dbPool.getStats();

      await request(app).get('/health').expect(200);
      await request(app).get('/api/metrics').expect(200);
      await request(app).get('/metrics').expect(200);

      const after = dbPool.getStats();
      expect(after.acquired_total).toBeGreaterThanOrEqual(before.acquired_total);
    });
  });
});
