/**
 * PHASE 5 CRITICAL GAPS - COMPREHENSIVE TESTS
 *
 * Tests for:
 * 1. Key rotation & secure storage
 * 2. Agent resume capability
 * 3. Findings versioning
 * 4. Findings archive
 * 5. Database backend
 */

const { KeyManager, createKeyManager } = require('../orchestrator/key-manager.js');
const { AgentCheckpoint, createCheckpointManager } = require('../orchestrator/agent-checkpoint.js');
const { FindingsVersioning } = require('../orchestrator/findings-versioning.js');
const { FindingsArchiver, createArchiveManager } = require('../orchestrator/findings-archive.js');
const { JSONFindingsDatabase } = require('../orchestrator/findings-database.js');

const fs = require('fs');
const path = require('path');
const os = require('os');

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase5-test-'));
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

// ============================================================================
// KEY MANAGER TESTS (Gap 1)
// ============================================================================

describe('Key Manager - Key Rotation & Secure Storage', () => {
  test('should generate encryption keys', () => {
    const keyMgr = createKeyManager(path.join(testDir, 'keys'));
    const key = keyMgr.generateKey('test-key', 90);

    expect(key.key_id).toBeDefined();
    expect(key.key).toBeDefined();
    expect(key.status).toBe('active');
    expect(key.algorithm).toBe('aes-256-gcm');
  });

  test('should validate key format', () => {
    const keyMgr = createKeyManager(path.join(testDir, 'keys'));
    const key = keyMgr.generateKey('test', 90);

    expect(KeyManager.isValidKey(key.key)).toBe(true);
    expect(KeyManager.isValidKey('invalid')).toBe(false);
  });

  test('should rotate keys', () => {
    const keyMgr = createKeyManager(path.join(testDir, 'keys'));
    const oldKey = keyMgr.generateKey('test', 90);
    const rotation = keyMgr.rotateKey(oldKey.key_id);

    expect(rotation.old_key_id).toBe(oldKey.key_id);
    expect(rotation.new_key_id).toBeDefined();
    expect(rotation.reencryption_required).toBe(true);
    expect(keyMgr.getKey(oldKey.key_id).status).toBe('rotated');
  });

  test('should detect keys needing rotation', () => {
    const keyMgr = createKeyManager(path.join(testDir, 'keys'));
    const key = keyMgr.generateKey('test', 1);  // Expires in 1 day

    const needsRotation = keyMgr.getKeysNeedingRotation();
    expect(needsRotation.length).toBeGreaterThan(0);
  });

  test('should get key statistics', () => {
    const keyMgr = createKeyManager(path.join(testDir, 'keys'));
    keyMgr.generateKey('key1', 90);
    keyMgr.generateKey('key2', 90);

    const stats = keyMgr.getStats();
    expect(stats.total_keys).toBe(2);
    expect(stats.active_keys).toBe(2);
    expect(stats.active_key_id).toBeDefined();
  });
});

// ============================================================================
// AGENT CHECKPOINT TESTS (Gap 2)
// ============================================================================

describe('Agent Checkpoint - Resume Capability', () => {
  test('should save agent checkpoint', () => {
    const checkpoint = createCheckpointManager(path.join(testDir, 'checkpoints'));

    checkpoint.saveCheckpoint('Agent-001', {
      findings_discovered: 10,
      phase: 2,
      last_tested_endpoint: '/api/users'
    });

    expect(checkpoint.hasCheckpoint('Agent-001')).toBe(true);
  });

  test('should load agent checkpoint', () => {
    const checkpoint = createCheckpointManager(path.join(testDir, 'checkpoints'));

    checkpoint.saveCheckpoint('Agent-001', {
      findings_discovered: 10,
      phase: 2,
      last_tested_endpoint: '/api/users'
    });

    const loaded = checkpoint.loadCheckpoint('Agent-001');
    expect(loaded.findings_discovered).toBe(10);
    expect(loaded.agent).toBe('Agent-001');
  });

  test('should clear checkpoint after completion', () => {
    const checkpoint = createCheckpointManager(path.join(testDir, 'checkpoints'));
    checkpoint.saveCheckpoint('Agent-001', { findings_discovered: 5 });

    expect(checkpoint.hasCheckpoint('Agent-001')).toBe(true);
    checkpoint.clearCheckpoint('Agent-001');
    expect(checkpoint.hasCheckpoint('Agent-001')).toBe(false);
  });

  test('should calculate time savings from resume', () => {
    const checkpoint = createCheckpointManager(path.join(testDir, 'checkpoints'));

    checkpoint.saveCheckpoint('Agent-001', {
      tested_endpoints: Array.from({length: 50}, (_, i) => `/endpoint-${i}`)
    });

    const savings = checkpoint.calculateTimeSavings('Agent-001', 5000);
    expect(savings.endpoints_skipped).toBe(50);
    expect(savings.time_saved_ms).toBe(250000);
  });

  test('should get checkpoint statistics', () => {
    const checkpoint = createCheckpointManager(path.join(testDir, 'checkpoints'));

    checkpoint.saveCheckpoint('Agent-001', { findings_discovered: 10 });
    checkpoint.saveCheckpoint('Agent-002', { findings_discovered: 5 });

    const stats = checkpoint.getStats();
    expect(stats.total_checkpoints).toBe(2);
    expect(stats.agents_with_checkpoints).toHaveLength(2);
  });
});

// ============================================================================
// FINDINGS VERSIONING TESTS (Gap 3)
// ============================================================================

describe('Findings Versioning - Change Tracking', () => {
  test('should create versioned finding', () => {
    const finding = FindingsVersioning.createVersionedFinding({
      title: 'SQL Injection',
      affected_component: '/login',
      severity: 'High',
      discovered_by: 'Agent-001'
    }, 'discovered');

    expect(finding.current_version).toBe(1);
    expect(finding.current_status).toBe('discovered');
    expect(finding.versions).toHaveLength(1);
  });

  test('should update finding status', () => {
    const finding = FindingsVersioning.createVersionedFinding({
      title: 'SQL Injection',
      affected_component: '/login',
      severity: 'High',
      discovered_by: 'Agent-001'
    });

    FindingsVersioning.updateFindingStatus(finding, 'approved', 'reviewer-001', 'Approved for remediation');

    expect(finding.current_version).toBe(2);
    expect(finding.current_status).toBe('approved');
    expect(finding.versions).toHaveLength(2);
  });

  test('should detect re-discovered findings', () => {
    const finding = FindingsVersioning.createVersionedFinding({
      title: 'SQL Injection',
      affected_component: '/login',
      severity: 'High',
      discovered_by: 'Agent-001'
    });

    FindingsVersioning.updateFindingStatus(finding, 'remediated', 'dev-001');
    FindingsVersioning.updateFindingStatus(finding, 'discovered', 'Agent-002');

    expect(FindingsVersioning.isRediscovered(finding)).toBe(true);
    expect(finding._re_discovered).toBe(true);
  });

  test('should get remediation status', () => {
    const finding = FindingsVersioning.createVersionedFinding({
      title: 'Test',
      affected_component: '/test',
      severity: 'Medium',
      discovered_by: 'Agent-001'
    });

    FindingsVersioning.updateFindingStatus(finding, 'approved', 'rev');
    FindingsVersioning.updateFindingStatus(finding, 'remediated', 'dev');

    const status = FindingsVersioning.getRemediationStatus(finding);
    expect(status.was_approved).toBe(true);
    expect(status.was_remediated).toBe(true);
    expect(status.is_rediscovered).toBe(false);
  });

  test('should get finding timeline', () => {
    const finding = FindingsVersioning.createVersionedFinding({
      title: 'Test',
      affected_component: '/test',
      severity: 'Medium',
      discovered_by: 'Agent-001'
    });

    FindingsVersioning.updateFindingStatus(finding, 'approved', 'rev');
    const timeline = FindingsVersioning.getTimeline(finding);

    expect(timeline).toHaveLength(2);
    expect(timeline[0].status).toBe('discovered');
    expect(timeline[1].status).toBe('approved');
  });
});

// ============================================================================
// FINDINGS ARCHIVE TESTS (Gap 4)
// ============================================================================

describe('Findings Archive - Backup & Retention', () => {
  test('should archive old findings', () => {
    const archiver = createArchiveManager(
      path.join(testDir, 'archive'),
      path.join(testDir, 'current')
    );

    // Create old finding file
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);

    const currentDir = path.join(testDir, 'current');
    fs.mkdirSync(currentDir, { recursive: true });

    const findingPath = path.join(currentDir, 'FINDING-0001.json');
    fs.writeFileSync(findingPath, JSON.stringify({ finding_id: 'FINDING-0001', severity: 'High' }));

    // Manually set old timestamp
    fs.utimesSync(findingPath, oldDate, oldDate);

    const result = archiver.archiveOlderThan(90);
    expect(result.archived_count).toBeGreaterThan(0);
  });

  test('should search across all findings', () => {
    const archiver = createArchiveManager(
      path.join(testDir, 'archive'),
      path.join(testDir, 'current')
    );

    // Create current finding
    const currentDir = path.join(testDir, 'current');
    fs.mkdirSync(currentDir, { recursive: true });
    fs.writeFileSync(
      path.join(currentDir, 'FINDING-0001.json'),
      JSON.stringify({ finding_id: 'FINDING-0001', severity: 'High' })
    );

    const results = archiver.queryAcrossAll({ severity: 'High' });
    expect(results.length).toBeGreaterThan(0);
  });

  test('should get archive statistics', () => {
    const archiver = createArchiveManager(
      path.join(testDir, 'archive'),
      path.join(testDir, 'current')
    );

    const stats = archiver.getStats();
    expect(stats.archived_findings).toBeGreaterThanOrEqual(0);
    expect(stats.total_size_mb).toBeDefined();
  });
});

// ============================================================================
// DATABASE BACKEND TESTS (Gap 5)
// ============================================================================

describe('Findings Database - Storage Backend', () => {
  test('should create finding in database', async () => {
    const db = new JSONFindingsDatabase(path.join(testDir, 'db'));

    const finding = { finding_id: 'FINDING-0001', title: 'SQL Injection', severity: 'High' };
    await db.create(finding);

    const retrieved = await db.read('FINDING-0001');
    expect(retrieved.title).toBe('SQL Injection');
  });

  test('should update finding', async () => {
    const db = new JSONFindingsDatabase(path.join(testDir, 'db'));

    const finding = { finding_id: 'FINDING-0001', title: 'Test', severity: 'High' };
    await db.create(finding);
    await db.update('FINDING-0001', { severity: 'Critical' });

    const updated = await db.read('FINDING-0001');
    expect(updated.severity).toBe('Critical');
  });

  test('should query findings', async () => {
    const db = new JSONFindingsDatabase(path.join(testDir, 'db'));

    await db.create({ finding_id: 'F-1', severity: 'High' });
    await db.create({ finding_id: 'F-2', severity: 'Low' });

    const high = await db.query({ severity: 'High' });
    expect(high).toHaveLength(1);
  });

  test('should count findings', async () => {
    const db = new JSONFindingsDatabase(path.join(testDir, 'db'));

    await db.create({ finding_id: 'F-1', severity: 'High' });
    await db.create({ finding_id: 'F-2', severity: 'High' });

    const count = await db.count({ severity: 'High' });
    expect(count).toBe(2);
  });

  test('should get database statistics', async () => {
    const db = new JSONFindingsDatabase(path.join(testDir, 'db'));

    await db.create({ finding_id: 'F-1', severity: 'High' });
    await db.create({ finding_id: 'F-2', severity: 'Low' });

    const stats = await db.getStats();
    expect(stats.total_findings).toBe(2);
    expect(stats.by_severity.High).toBe(1);
    expect(stats.by_severity.Low).toBe(1);
  });
});
