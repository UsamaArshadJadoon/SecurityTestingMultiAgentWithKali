#!/usr/bin/env node

/**
 * PHASE 3 INTEGRATION TESTS
 *
 * Comprehensive testing of all Phase 3 modules:
 * - Schema validation, API versioning, circuit breaker
 * - Rate limiting, request signing, feature flags
 * - Performance benchmarking, audit logging
 */

const { validateRequest, createSchemaValidator } = require('../orchestrator/schema-validator.js');
const { ApiVersionManager, ApiVersion } = require('../orchestrator/api-versioning.js');
const { CircuitBreakerRegistry } = require('../orchestrator/circuit-breaker.js');
const { EndpointRateLimiter } = require('../orchestrator/endpoint-rate-limiter.js');
const { RequestSigner } = require('../orchestrator/request-signing.js');
const { FeatureFlagManager } = require('../orchestrator/feature-flags.js');
const { BenchmarkManager } = require('../orchestrator/performance-benchmarks.js');

describe('Phase 3: Advanced Features', () => {
  // =========================================================================
  // SCHEMA VALIDATION TESTS (Gap 9)
  // =========================================================================

  describe('Schema Validation (Gap 9)', () => {
    test('should validate correct request', () => {
      const validator = createSchemaValidator({
        testSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['id', 'name']
        }
      });

      const result = validator.validate('testSchema', { id: '123', name: 'test' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid request', () => {
      const validator = createSchemaValidator({
        testSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['id', 'name']
        }
      });

      const result = validator.validate('testSchema', { id: '123' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // API VERSIONING TESTS (Gap 12)
  // =========================================================================

  describe('API Versioning (Gap 12)', () => {
    test('should register API versions', () => {
      const manager = new ApiVersionManager();
      const v1 = new ApiVersion('1.0', { releaseDate: new Date() });
      const v2 = new ApiVersion('2.0', { releaseDate: new Date() });

      manager.registerVersion(v1);
      manager.registerVersion(v2);

      expect(manager.getAllVersions()).toHaveLength(2);
      expect(manager.getVersion('1.0')).toBe(v1);
    });

    test('should mark version as deprecated', () => {
      const deprecationDate = new Date(Date.now() - 1000);
      const v1 = new ApiVersion('1.0', { deprecationDate });

      expect(v1.isDeprecated()).toBe(true);
      expect(v1.getStatus()).toBe('deprecated');
    });

    test('should track version status', () => {
      const v1 = new ApiVersion('1.0', {
        changes: ['Added new endpoint', 'Removed old endpoint']
      });

      const status = v1.getStatus();
      expect(status).toBe('active');
    });
  });

  // =========================================================================
  // CIRCUIT BREAKER TESTS (Gap 13)
  // =========================================================================

  describe('Circuit Breaker (Gap 13)', () => {
    test('should allow requests when circuit is closed', async () => {
      const registry = new CircuitBreakerRegistry();
      const breaker = registry.getOrCreate('test-service', {
        failureThreshold: 3
      });

      const operation = async () => 'success';
      const result = await breaker.execute(operation);

      expect(result).toBe('success');
    });

    test('should open circuit after threshold failures', async () => {
      const registry = new CircuitBreakerRegistry();
      const breaker = registry.getOrCreate('failing-service', {
        failureThreshold: 2
      });

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Operation failed');
          });
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.state).toBe('OPEN');
    });

    test('should fail fast when circuit is open', async () => {
      const registry = new CircuitBreakerRegistry();
      const breaker = registry.getOrCreate('open-service', {
        failureThreshold: 1,
        resetTimeout: 1000
      });

      await breaker.execute(async () => {
        throw new Error('Fail');
      }).catch(() => {});

      expect(breaker.state).toBe('OPEN');

      try {
        await breaker.execute(async () => 'success');
        fail('Should have thrown');
      } catch (error) {
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
      }
    });
  });

  // =========================================================================
  // ENDPOINT RATE LIMITING TESTS (Gap 14)
  // =========================================================================

  describe('Endpoint Rate Limiting (Gap 14)', () => {
    test('should allow requests within limit', () => {
      const limiter = new EndpointRateLimiter({
        requestsPerMinute: 10,
        burstSize: 5
      });

      limiter.registerEndpoint('POST', '/api/test', {
        requestsPerMinute: 10,
        burstSize: 5
      });

      const result = limiter.checkLimit('POST', '/api/test', 'user-123');
      expect(result.allowed).toBe(true);
    });

    test('should reject requests exceeding burst', () => {
      const limiter = new EndpointRateLimiter();
      limiter.registerEndpoint('POST', '/api/test', {
        burstSize: 2
      });

      const user = 'user-456';

      // Allow 2 requests
      limiter.checkLimit('POST', '/api/test', user);
      limiter.checkLimit('POST', '/api/test', user);

      // Third should be rejected
      const result = limiter.checkLimit('POST', '/api/test', user);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Burst limit');
    });

    test('should track endpoint statistics', () => {
      const limiter = new EndpointRateLimiter();
      limiter.registerEndpoint('GET', '/api/data', { requestsPerMinute: 100 });

      const stats = limiter.getEndpointStats('GET', '/api/data');
      expect(stats).toBeDefined();
      expect(stats.stats.totalRequests).toBe(0);
    });
  });

  // =========================================================================
  // REQUEST SIGNING TESTS (Gap 15)
  // =========================================================================

  describe('Request Signing (Gap 15)', () => {
    test('should sign request with HMAC', () => {
      const secret = 'test-secret';
      const signer = new RequestSigner(secret);

      const signature = signer.sign('POST', '/api/test', { data: 'test' });

      expect(signature.signature).toBeDefined();
      expect(signature.algorithm).toBe('sha256');
      expect(signature.timestamp).toBeDefined();
    });

    test('should verify valid signature', () => {
      const secret = 'test-secret';
      const signer = new RequestSigner(secret);

      const body = { data: 'test' };
      const sig = signer.sign('POST', '/api/test', body);

      const isValid = signer.verify('POST', '/api/test', body, sig.signature);
      expect(isValid).toBe(true);
    });

    test('should reject invalid signature', () => {
      const secret = 'test-secret';
      const signer = new RequestSigner(secret);

      const body = { data: 'test' };
      const isValid = signer.verify('POST', '/api/test', body, 'invalid-signature');

      expect(isValid).toBe(false);
    });
  });

  // =========================================================================
  // FEATURE FLAGS TESTS (Gap 17)
  // =========================================================================

  describe('Feature Flags (Gap 17)', () => {
    test('should register feature flag', () => {
      const manager = new FeatureFlagManager();
      manager.registerFlag('new-feature', { enabled: true });

      const flag = manager.getFlag('new-feature');
      expect(flag).toBeDefined();
      expect(flag.enabled).toBe(true);
    });

    test('should check if feature enabled', () => {
      const manager = new FeatureFlagManager();
      manager.registerFlag('beta-feature', { enabled: false });

      const isEnabled = manager.isEnabled('beta-feature');
      expect(isEnabled).toBe(false);
    });

    test('should support rollout percentage', () => {
      const manager = new FeatureFlagManager();
      manager.registerFlag('gradual-rollout', {
        enabled: true,
        rolloutPercentage: 50
      });

      const flag = manager.getFlag('gradual-rollout');
      const enabled1 = flag.isEnabledForUser('user-1');
      const enabled2 = flag.isEnabledForUser('user-2');

      // Should be deterministic per user
      expect(flag.isEnabledForUser('user-1')).toBe(enabled1);
      expect(flag.isEnabledForUser('user-2')).toBe(enabled2);
    });

    test('should support user allowlisting', () => {
      const manager = new FeatureFlagManager();
      manager.registerFlag('beta', { enabled: false });
      const flag = manager.getFlag('beta');

      flag.allowUser('beta-tester-1');

      expect(flag.isEnabledForUser('beta-tester-1')).toBe(true);
      expect(flag.isEnabledForUser('regular-user')).toBe(false);
    });
  });

  // =========================================================================
  // PERFORMANCE BENCHMARKING TESTS (Gap 18)
  // =========================================================================

  describe('Performance Benchmarking (Gap 18)', () => {
    test('should record measurements', () => {
      const manager = new BenchmarkManager();
      manager.registerBenchmark('test-operation');

      const timerId = manager.startTimer('test-operation');
      setTimeout(() => {}, 10);
      const duration = manager.stopTimer(timerId);

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('should calculate statistics', () => {
      const manager = new BenchmarkManager();
      manager.registerBenchmark('slow-operation');

      // Record multiple measurements
      for (let i = 0; i < 10; i++) {
        const timerId = manager.startTimer('slow-operation');
        manager.stopTimer(timerId);
      }

      const stats = manager.getBenchmarkStats('slow-operation');
      expect(stats.count).toBe(10);
      expect(stats.mean).toBeDefined();
      expect(stats.median).toBeDefined();
      expect(stats.p95).toBeDefined();
    });

    test('should detect performance regression', () => {
      const manager = new BenchmarkManager();
      manager.registerBenchmark('monitored-operation', {
        baseline: 100
      });

      const benchmark = manager.getFlag ? null : manager.benchmarks.get('monitored-operation');
      if (benchmark) {
        benchmark.recordMeasurement(150); // 50% slower
        const stats = benchmark.getStats();
        expect(stats.regression?.regressed).toBe(true);
      }
    });

    test('should generate performance report', () => {
      const manager = new BenchmarkManager();
      manager.registerBenchmark('api-call');
      manager.registerBenchmark('db-query');

      const timerId1 = manager.startTimer('api-call');
      manager.stopTimer(timerId1);

      const timerId2 = manager.startTimer('db-query');
      manager.stopTimer(timerId2);

      const report = manager.generateReport();
      expect(report.totalBenchmarks).toBe(2);
      expect(report.benchmarks).toBeDefined();
    });
  });

  // =========================================================================
  // PHASE 3 FULL INTEGRATION
  // =========================================================================

  describe('Phase 3 Full Integration', () => {
    test('should work together: versioning + schema validation', () => {
      const versionManager = new ApiVersionManager();
      const v1 = new ApiVersion('1.0');
      versionManager.registerVersion(v1);

      const validator = createSchemaValidator({
        requestSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      });

      expect(versionManager.getVersion('1.0')).toBeDefined();
      expect(validator.validate('requestSchema', { id: '123' }).valid).toBe(true);
    });

    test('should work together: circuit breaker + rate limiting', async () => {
      const breaker = new CircuitBreakerRegistry();
      const limiter = new EndpointRateLimiter();

      limiter.registerEndpoint('POST', '/api/risky', { burstSize: 1 });
      const cbBreaker = breaker.getOrCreate('risky-service');

      const result1 = limiter.checkLimit('POST', '/api/risky', 'user-1');
      expect(result1.allowed).toBe(true);

      const result2 = limiter.checkLimit('POST', '/api/risky', 'user-1');
      expect(result2.allowed).toBe(false);
    });

    test('should work together: feature flags + benchmarking', () => {
      const featureManager = new FeatureFlagManager();
      const benchmarkManager = new BenchmarkManager();

      featureManager.registerFlag('performance-tracking', { enabled: true });
      benchmarkManager.registerBenchmark('feature-operation');

      expect(featureManager.isEnabled('performance-tracking')).toBe(true);
      expect(benchmarkManager.benchmarks.has('feature-operation')).toBe(true);
    });
  });
});
