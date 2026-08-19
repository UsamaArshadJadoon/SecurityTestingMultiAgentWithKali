/**
 * PHASE 6 CRITICAL GAPS TESTS (A-D)
 *
 * Gap A: Sensitive Data Detection
 * Gap B: Secrets Management
 * Gap C: Structured Logging
 * Gap D: Error Handling & Retry
 */

const { SecretsManager, createSecretsManager } = require('../orchestrator/secrets-manager.js');
const { StructuredLogger, createLogger } = require('../orchestrator/structured-logger.js');
const { ErrorClassifier, RetryEngine, ErrorHandler } = require('../orchestrator/error-handler.js');

const fs = require('fs');
const path = require('path');
const os = require('os');

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase6-test-'));
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

// ============================================================================
// GAP A: SECRETS MANAGER TESTS
// ============================================================================

describe('Gap A: Secrets Manager', () => {
  test('should store secret securely', () => {
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    secretsMgr.setSecret('security/jira/api-token', 'jira-token-12345', {
      createdBy: 'admin'
    });

    expect(secretsMgr.getSecret('security/jira/api-token')).toBe('jira-token-12345');
  });

  test('should throw error for non-existent secret', () => {
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    expect(() => secretsMgr.getSecret('non/existent')).toThrow();
  });

  test('should rotate secret', () => {
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    secretsMgr.setSecret('security/slack/webhook', 'old-webhook-url');
    secretsMgr.rotateSecret('security/slack/webhook', 'new-webhook-url');

    expect(secretsMgr.getSecret('security/slack/webhook')).toBe('new-webhook-url');
  });

  test('should detect secrets needing rotation', () => {
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    secretsMgr.setSecret('security/db/password', 'old-password', {
      rotationDays: 1  // Expires in 1 day
    });

    const needsRotation = secretsMgr.getSecretsNeedingRotation(7);
    expect(needsRotation.length).toBeGreaterThan(0);
  });

  test('should track rotation history', () => {
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    secretsMgr.setSecret('security/key', 'value1');
    secretsMgr.rotateSecret('security/key', 'value2');
    secretsMgr.rotateSecret('security/key', 'value3');

    const history = secretsMgr.getRotationHistory('security/key');
    expect(history.length).toBe(2);
  });

  test('should get statistics', () => {
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    secretsMgr.setSecret('security/jira/token', 'token1');
    secretsMgr.setSecret('security/slack/hook', 'hook1');
    secretsMgr.setSecret('database/postgres/password', 'pass1');

    const stats = secretsMgr.getStats();
    expect(stats.total_secrets).toBe(3);
    expect(stats.secrets_by_type.security).toBe(2);
    expect(stats.secrets_by_type.database).toBe(1);
  });

  test('should persist secrets to disk', () => {
    const vaultPath = path.join(testDir, 'vault');
    const secretsMgr = createSecretsManager(vaultPath);

    secretsMgr.setSecret('security/test', 'test-value');

    // Create new manager from same vault - should load secret
    const secretsMgr2 = createSecretsManager(vaultPath);
    expect(secretsMgr2.getSecret('security/test')).toBe('test-value');
  });
});

// ============================================================================
// GAP B: STRUCTURED LOGGER TESTS
// ============================================================================

describe('Gap B: Structured Logger', () => {
  test('should log info message', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    logger.info('Test message', { userId: 'user-001' });

    const stats = logger.getStats();
    expect(stats.info).toBeGreaterThan(0);
  });

  test('should log error with context', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    logger.error('Database error', { operation: 'query', table: 'findings' });

    const stats = logger.getStats();
    expect(stats.error).toBeGreaterThan(0);
  });

  test('should support context stacking', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    logger.pushContext({ tenant_id: 'client-acme' });
    logger.info('Operation in tenant context', { operation: 'create_finding' });
    logger.popContext();

    const stats = logger.getStats();
    expect(stats.info).toBeGreaterThan(0);
  });

  test('should start and end trace', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    const traceId = logger.startTrace();
    logger.addSpan('step-1', { duration: 100 });
    logger.addSpan('step-2', { duration: 200 });
    logger.endTrace(traceId, { success: true });

    const stats = logger.getStats();
    expect(stats.info).toBeGreaterThan(0);
  });

  test('should audit actions', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    logger.audit('SECRET_ROTATED', 'security/db/password', {
      actor: 'admin-001'
    });

    const stats = logger.getStats();
    expect(stats.audit).toBeGreaterThan(0);
  });

  test('should query logs', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    logger.info('Test message 1', { userId: 'user-001' });
    logger.info('Test message 2', { userId: 'user-002' });
    logger.error('Error message', { userId: 'user-001' });

    const errorLogs = logger.queryLogs({ level: 'error' });
    expect(errorLogs.length).toBeGreaterThan(0);
  });

  test('should query logs by message', () => {
    const logger = createLogger(path.join(testDir, 'logs'));

    logger.info('Finding discovered', { finding_id: 'F-001' });
    logger.info('Finding approved', { finding_id: 'F-001' });

    const discovered = logger.queryLogs({ message: 'discovered' });
    expect(discovered.length).toBe(1);
  });
});

// ============================================================================
// GAP C: ERROR HANDLER TESTS
// ============================================================================

describe('Gap C: Error Handler & Retry Logic', () => {
  test('should classify FATAL errors', () => {
    const error = new Error('FATAL: Out of disk space');
    const classification = ErrorClassifier.classify(error);

    expect(classification).toBe('FATAL');
  });

  test('should classify CRITICAL errors', () => {
    const error = new Error('ECONNREFUSED: Connection refused');
    error.code = 'ECONNREFUSED';
    const classification = ErrorClassifier.classify(error);

    expect(classification).toBe('CRITICAL');
  });

  test('should classify RECOVERABLE errors', () => {
    const error = new Error('HTTP 429: Too Many Requests');
    const classification = ErrorClassifier.classify(error);

    expect(classification).toBe('RECOVERABLE');
  });

  test('should get retry strategy for classification', () => {
    const strategy = ErrorClassifier.getRetryStrategy('CRITICAL');

    expect(strategy.shouldRetry).toBe(true);
    expect(strategy.maxRetries).toBe(5);
    expect(strategy.backoffType).toBe('exponential');
  });

  test('should retry operation on failure', async () => {
    let attempts = 0;

    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('ECONNREFUSED: Connection refused');
      }
      return { success: true };
    };

    const result = await RetryEngine.executeWithRetry(operation, {
      maxRetries: 5,
      baseDelay: 10
    });

    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
  });

  test('should use exponential backoff', async () => {
    const delays = [];
    let attempts = 0;

    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('ECONNREFUSED');
      }
      return { success: true };
    };

    await RetryEngine.executeWithRetry(operation, {
      maxRetries: 5,
      baseDelay: 10,
      onRetry: (info) => {
        delays.push(info.delay);
      }
    });

    // Delays should increase exponentially
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });

  test('should handle all retries exhausted', async () => {
    const operation = async () => {
      throw new Error('ECONNREFUSED');
    };

    await expect(
      RetryEngine.executeWithRetry(operation, {
        maxRetries: 2,
        baseDelay: 10
      })
    ).rejects.toThrow();
  });

  test('should implement circuit breaker', async () => {
    let callCount = 0;

    const operation = async () => {
      callCount++;
      throw new Error('Service unavailable');
    };

    // First 5 calls fail
    for (let i = 0; i < 5; i++) {
      try {
        await RetryEngine.executeWithCircuitBreaker(operation, {
          key: 'test-service',
          failureThreshold: 5,
          resetTimeout: 100
        });
      } catch (e) {
        // Expected
      }
    }

    // Circuit should now be OPEN
    await expect(
      RetryEngine.executeWithCircuitBreaker(operation, {
        key: 'test-service',
        failureThreshold: 5
      })
    ).rejects.toThrow('Circuit breaker OPEN');
  });

  test('should handle errors with appropriate response', async () => {
    let retried = false;

    const operation = async () => {
      if (!retried) {
        retried = true;
        throw new Error('ECONNREFUSED');
      }
      return { success: true };
    };

    const result = await ErrorHandler.handle(
      new Error('ECONNREFUSED: Connection refused'),
      {
        operation,
        onRetry: (info) => console.log(`Retrying after ${info.delay}ms`)
      }
    );

    expect(result.handled).toBe(true);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Phase 6 Integration Tests', () => {
  test('should use logger in error handling flow', () => {
    const logger = createLogger(path.join(testDir, 'logs'));
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    // Store secret
    secretsMgr.setSecret('test/key', 'test-value');

    // Log access
    logger.info('Secret accessed', {
      secret_path: 'test/key',
      actor: 'user-001'
    });

    // Verify logs
    const stats = logger.getStats();
    expect(stats.info).toBeGreaterThan(0);
  });

  test('should detect secrets needing rotation and log alert', () => {
    const logger = createLogger(path.join(testDir, 'logs'));
    const secretsMgr = createSecretsManager(path.join(testDir, 'vault'));

    secretsMgr.setSecret('test/key', 'value', { rotationDays: 1 });

    const needsRotation = secretsMgr.getSecretsNeedingRotation();
    if (needsRotation.length > 0) {
      logger.warn('Secrets approaching expiry', {
        count: needsRotation.length,
        secrets: needsRotation
      });
    }

    const stats = logger.getStats();
    expect(stats.warn).toBeGreaterThan(0);
  });
});
