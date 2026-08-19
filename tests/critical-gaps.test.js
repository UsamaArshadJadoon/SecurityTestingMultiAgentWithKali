/**
 * CRITICAL GAPS - COMPREHENSIVE TESTS
 *
 * Tests for all 5 critical gap implementations:
 * 1. Finding deduplication
 * 2. Audit logging
 * 3. PII/secrets masking
 * 4. Evidence encryption
 * 5. Rate limiting
 */

const { DeduplicationTracker, generateFindingSignature } = require('../orchestrator/deduplication.js');
const { AuditLogger } = require('../orchestrator/audit-logger.js');
const { PIIMasker } = require('../orchestrator/pii-masker.js');
const { EvidenceEncryptor, generateKey } = require('../orchestrator/encryption.js');
const { RateLimiter } = require('../orchestrator/rate-limiter.js');

const fs = require('fs');
const path = require('path');
const os = require('os');

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaps-test-'));
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

// ============================================================================
// DEDUPLICATION TESTS
// ============================================================================

describe('Finding Deduplication', () => {
  test('should generate consistent signatures for identical findings', () => {
    const finding = {
      title: 'SQL Injection',
      affected_component: '/api/login',
      cvss_score: 7.5,
      severity: 'High'
    };

    const sig1 = generateFindingSignature(finding);
    const sig2 = generateFindingSignature(finding);
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
  });

  test('should detect first-time findings as unique', () => {
    const tracker = new DeduplicationTracker();
    const finding = {
      title: 'SQL Injection',
      affected_component: '/api/login',
      cvss_score: 7.5,
      severity: 'High',
      discovering_by: 'Agent-001'
    };

    const result = tracker.checkDuplicate(finding);
    expect(result.isDuplicate).toBe(false);
    expect(result.count).toBe(1);
  });

  test('should detect duplicate findings', () => {
    const tracker = new DeduplicationTracker();
    const finding = {
      title: 'SQL Injection',
      affected_component: '/api/login',
      cvss_score: 7.5,
      severity: 'High',
      discovered_by: 'Agent-001'
    };

    // First discovery
    tracker.checkDuplicate(finding);

    // Duplicate from different agent
    const duplicate = { ...finding, discovered_by: 'Agent-003' };
    const result = tracker.checkDuplicate(duplicate);

    expect(result.isDuplicate).toBe(true);
    expect(result.count).toBe(2);
    expect(result.duplicateNumber).toBe(1);
  });

  test('should track multiple duplicates', () => {
    const tracker = new DeduplicationTracker();
    const finding = {
      title: 'SQL Injection',
      affected_component: '/api/login',
      cvss_score: 7.5,
      severity: 'High'
    };

    // 5 discoveries of same vulnerability
    for (let i = 0; i < 5; i++) {
      const result = tracker.checkDuplicate({ ...finding, discovered_by: `Agent-${i}` });
      expect(result.count).toBe(i + 1);
    }

    const stats = tracker.getStats();
    expect(stats.unique_findings).toBe(1);
    expect(stats.total_duplicates).toBe(4);
    expect(stats.duplicate_patterns[0].total_occurrences).toBe(5);
  });

  test('should enhance findings with deduplication metadata', () => {
    const tracker = new DeduplicationTracker();
    const finding = { title: 'XSS', affected_component: '/search', cvss_score: 5.0, severity: 'Medium' };

    tracker.checkDuplicate(finding);
    const duplicate = { ...finding, discovered_by: 'Agent-002' };
    const dedup = tracker.checkDuplicate(duplicate);
    const enhanced = tracker.enhanceFinding(duplicate, dedup);

    expect(enhanced.deduplication_signature).toBeDefined();
    expect(enhanced.deduplication_status).toBe('duplicate');
    expect(enhanced.deduplication_count).toBe(2);
  });
});

// ============================================================================
// AUDIT LOGGING TESTS
// ============================================================================

describe('Audit Logging', () => {
  test('should create audit log file', () => {
    const logger = new AuditLogger(testDir);
    expect(fs.existsSync(logger.auditFile)).toBe(true);
  });

  test('should log events to audit trail', () => {
    const logger = new AuditLogger(testDir);
    logger.info('test-event', { detail: 'value' });

    const entries = logger.readAuditLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].event).toBe('test-event');
    expect(entries[0].level).toBe('info');
    expect(entries[0].details.detail).toBe('value');
  });

  test('should log different levels', () => {
    const logger = new AuditLogger(testDir);
    logger.info('info-event', {});
    logger.warn('warn-event', {});
    logger.error('error-event', {});
    logger.debug('debug-event', {});

    const entries = logger.readAuditLog();
    expect(entries).toHaveLength(4);
    expect(entries[0].level).toBe('info');
    expect(entries[1].level).toBe('warn');
    expect(entries[2].level).toBe('error');
    expect(entries[3].level).toBe('debug');
  });

  test('should log agent execution events', () => {
    const logger = new AuditLogger(testDir);
    logger.agentStarted('Agent-001', 3600, 1);
    logger.agentCompleted('Agent-001', 5, 120000);

    const entries = logger.readAuditLog();
    expect(entries).toHaveLength(2);
    expect(entries[0].event).toBe('agent-started');
    expect(entries[1].event).toBe('agent-completed');
  });

  test('should get audit statistics', () => {
    const logger = new AuditLogger(testDir);
    logger.info('event1', {});
    logger.info('event1', {});
    logger.warn('event2', {});

    const stats = logger.getStats();
    expect(stats.total_events).toBe(3);
    expect(stats.events_by_level.info).toBe(2);
    expect(stats.events_by_level.warn).toBe(1);
    expect(stats.events_by_type.event1).toBe(2);
  });

  test('should handle corrupted audit file gracefully', () => {
    const logger = new AuditLogger(testDir);
    fs.writeFileSync(logger.auditFile, 'corrupted{');

    const entries = logger.readAuditLog();
    expect(entries).toEqual([]);
  });
});

// ============================================================================
// PII/SECRETS MASKING TESTS
// ============================================================================

describe('PII/Secrets Masking', () => {
  test('should detect email addresses', () => {
    const masker = new PIIMasker({ detectOnly: true });
    const detections = masker.detect('Contact: john.doe@example.com for details');

    expect(detections).toHaveLength(1);
    expect(detections[0].category).toBe('email');
  });

  test('should detect API keys', () => {
    const masker = new PIIMasker({ detectOnly: true });
    const detections = masker.detect('api_key=abc123xyz789secret');

    expect(detections).toHaveLength(1);
    expect(detections[0].category).toBe('api_key');
  });

  test('should detect bearer tokens', () => {
    const masker = new PIIMasker({ detectOnly: true });
    const detections = masker.detect('Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

    expect(detections.length).toBeGreaterThan(0);
    expect(detections.some(d => d.category === 'bearer_token')).toBe(true);
  });

  test('should detect passwords', () => {
    const masker = new PIIMasker({ detectOnly: true });
    const detections = masker.detect('password=SuperSecret123!@#');

    expect(detections).toHaveLength(1);
    expect(detections[0].category).toBe('password');
  });

  test('should detect AWS access keys', () => {
    const masker = new PIIMasker({ detectOnly: true });
    const detections = masker.detect('AKIAIOSFODNN7EXAMPLE');

    expect(detections).toHaveLength(1);
    expect(detections[0].category).toBe('aws_access_key');
  });

  test('should mask sensitive data', () => {
    const masker = new PIIMasker({ detectOnly: false });
    const original = 'Email: test@example.com, API Key: secret123abc';
    const result = masker.maskString(original);

    expect(result.masked_text).toContain('[EMAIL_REDACTED]');
    expect(result.masked_text).toContain('[API_KEY_REDACTED]');
    expect(result.detections_count).toBeGreaterThan(0);
  });

  test('should mask PII in finding objects', () => {
    const masker = new PIIMasker();
    const finding = {
      title: 'SQL Injection',
      evidence: {
        request: 'POST /api/login\nAuthorization: Bearer token123xyz',
        response: 'HTTP 200 {"email": "user@example.com"}'
      }
    };

    const masked = masker.maskFinding(finding);
    expect(masked._pii_masking.was_masked).toBe(true);
    expect(masked._pii_masking.total_detections).toBeGreaterThan(0);
  });

  test('should provide masking statistics', () => {
    const masker = new PIIMasker({ detectOnly: true });
    const findings = [
      {
        evidence: { request: 'api_key=secret123' }
      },
      {
        evidence: { request: 'password=pass123, email: test@test.com' }
      }
    ];

    const stats = masker.getStats(findings);
    expect(stats.total_pii_detections).toBeGreaterThan(0);
    expect(stats.findings_with_pii).toBe(2);
  });
});

// ============================================================================
// EVIDENCE ENCRYPTION TESTS
// ============================================================================

describe('Evidence Encryption', () => {
  test('should generate valid encryption keys', () => {
    const key = generateKey('test-seed');
    expect(key).toBeDefined();
    expect(typeof key).toBe('string');
  });

  test('should validate encryption keys', () => {
    const key = generateKey();
    expect(EvidenceEncryptor.isValidKey(key)).toBe(true);
    expect(EvidenceEncryptor.isValidKey('invalid')).toBe(false);
  });

  test('should encrypt and decrypt findings', () => {
    const key = generateKey();
    const encryptor = new EvidenceEncryptor(key);

    const finding = {
      title: 'Test',
      evidence: {
        request: 'POST /api\nAuth: secret',
        response: 'HTTP 200'
      }
    };

    const encrypted = encryptor.encryptFinding(finding);
    expect(encrypted._evidence_encrypted).toBe(true);
    expect(encrypted.evidence.encrypted).toBeDefined();
    expect(encrypted.evidence.iv).toBeDefined();
    expect(encrypted.evidence.auth_tag).toBeDefined();

    const decrypted = encryptor.decryptFinding(encrypted);
    expect(decrypted.evidence.request).toBe(finding.evidence.request);
    expect(decrypted.evidence.response).toBe(finding.evidence.response);
  });

  test('should fail decryption with wrong key', () => {
    const key1 = generateKey('seed1');
    const key2 = generateKey('seed2');

    const encryptor1 = new EvidenceEncryptor(key1);
    const encryptor2 = new EvidenceEncryptor(key2);

    const finding = {
      title: 'Test',
      evidence: { request: 'Secret data' }
    };

    const encrypted = encryptor1.encryptFinding(finding);

    expect(() => {
      encryptor2.decryptFinding(encrypted);
    }).toThrow();
  });

  test('should support encryption disable', () => {
    const encryptor = new EvidenceEncryptor(null);
    const finding = { title: 'Test', evidence: { request: 'data' } };

    const result = encryptor.encryptFinding(finding);
    expect(result).toEqual(finding); // No changes
  });

  test('should get encryption status', () => {
    const key = generateKey();
    const encryptor = new EvidenceEncryptor(key);

    const finding = {
      title: 'Test',
      evidence: { request: 'data' }
    };

    const encrypted = encryptor.encryptFinding(finding);
    const status = encryptor.getEncryptionStatus(encrypted);

    expect(status.encryption_enabled).toBe(true);
    expect(status.evidence_encrypted).toBe(true);
    expect(status.algorithm).toBe('aes-256-gcm');
  });
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

describe('Rate Limiting', () => {
  test('should allow findings below limit', () => {
    const limiter = new RateLimiter({
      per_agent_per_hour: 100
    });

    const finding = { title: 'Test' };
    const result = limiter.checkRate(finding, 'Agent-001', 'engagement-1');

    expect(result.allowed).toBe(true);
    expect(result.details.agent_usage).toContain('0/100');
  });

  test('should reject oversized findings', () => {
    const limiter = new RateLimiter({
      max_finding_size_bytes: 100  // Very small
    });

    const finding = {
      title: 'X'.repeat(200),  // Exceeds limit
      evidence: { request: 'data', response: 'data' }
    };

    const result = limiter.checkRate(finding, 'Agent-001', 'engagement-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('FINDING_TOO_LARGE');
  });

  test('should track and enforce agent rate limits', () => {
    const limiter = new RateLimiter({
      per_agent_per_hour: 3
    });

    const finding = { title: 'Test' };

    // Add 3 findings
    limiter.recordFinding('Agent-001', 'engagement-1');
    limiter.recordFinding('Agent-001', 'engagement-1');
    limiter.recordFinding('Agent-001', 'engagement-1');

    // 4th should fail
    const result = limiter.checkRate(finding, 'Agent-001', 'engagement-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('AGENT_RATE_LIMIT_EXCEEDED');
  });

  test('should track and enforce engagement rate limits', () => {
    const limiter = new RateLimiter({
      per_engagement_per_hour: 3
    });

    const finding = { title: 'Test' };

    // Add from different agents, same engagement
    limiter.recordFinding('Agent-001', 'engagement-1');
    limiter.recordFinding('Agent-002', 'engagement-1');
    limiter.recordFinding('Agent-003', 'engagement-1');

    // 4th from any agent should fail
    const result = limiter.checkRate(finding, 'Agent-004', 'engagement-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ENGAGEMENT_RATE_LIMIT_EXCEEDED');
  });

  test('should record rejections', () => {
    const limiter = new RateLimiter();

    limiter.recordRejection('Agent-001', 'FINDING_TOO_LARGE', {
      size: 100000,
      limit: 10000
    });

    const stats = limiter.getStats();
    expect(stats.rejections_total).toBe(1);
    expect(stats.rejections_by_reason.FINDING_TOO_LARGE).toBe(1);
  });

  test('should provide rate limit statistics', () => {
    const limiter = new RateLimiter();

    limiter.recordFinding('Agent-001', 'engagement-1');
    limiter.recordFinding('Agent-001', 'engagement-1');
    limiter.recordFinding('Agent-002', 'engagement-1');

    const stats = limiter.getStats();
    expect(stats.agents['Agent-001'].findings_this_hour).toBe(2);
    expect(stats.agents['Agent-002'].findings_this_hour).toBe(1);
    expect(stats.engagements['engagement-1'].findings_this_hour).toBe(3);
  });

  test('should detect approaching limits', () => {
    const limiter = new RateLimiter({
      per_agent_per_hour: 100
    });

    // Add 85 findings (85% of 100)
    for (let i = 0; i < 85; i++) {
      limiter.recordFinding('Agent-001', 'engagement-1');
    }

    const approaching = limiter.isApproachingLimit('Agent-001');
    expect(approaching).toBe(true);
  });

  test('should reset limits', () => {
    const limiter = new RateLimiter();
    limiter.recordFinding('Agent-001', 'engagement-1');

    let stats = limiter.getStats();
    expect(stats.agents['Agent-001'].findings_this_hour).toBe(1);

    limiter.reset();
    stats = limiter.getStats();
    expect(stats.agents['Agent-001']).toBeUndefined();
  });

  test('should update limit thresholds', () => {
    const limiter = new RateLimiter({
      per_agent_per_hour: 100
    });

    expect(limiter.limits.per_agent_per_hour).toBe(100);

    limiter.updateLimits({ per_agent_per_hour: 500 });
    expect(limiter.limits.per_agent_per_hour).toBe(500);
  });
});
