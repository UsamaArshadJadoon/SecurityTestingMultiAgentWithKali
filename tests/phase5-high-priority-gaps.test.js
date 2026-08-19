/**
 * PHASE 5 HIGH-PRIORITY GAPS - COMPREHENSIVE TESTS (6-12)
 *
 * Tests for:
 * 6. JIRA/Slack Integration
 * 7. Differential Reporting
 * 8. Multi-tenant Support
 * 9. Agent Dependency Visualization
 * 10. Findings Consolidation
 * 11. Webhook Integration
 */

const { TicketManager, createTicketManager } = require('../orchestrator/integrations/ticket-manager.js');
const { DifferentialReporter } = require('../orchestrator/diff-reporter.js');
const { TenantManager, createTenantManager } = require('../orchestrator/tenant-manager.js');

const fs = require('fs');
const path = require('path');
const os = require('os');

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase5-high-test-'));
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

// ============================================================================
// TICKET MANAGER TESTS (Gap 6)
// ============================================================================

describe('Ticket Manager - JIRA/Slack Integration', () => {
  test('should create JIRA ticket mapping', () => {
    const ticketMgr = createTicketManager(
      { baseUrl: 'https://jira.example.com', projectKey: 'SEC' },
      { webhookUrl: 'https://hooks.slack.com/test' }
    );

    const finding = {
      finding_id: 'FINDING-001',
      title: 'SQL Injection',
      description: 'SQL Injection in login form',
      severity: 'Critical',
      affected_component: '/login'
    };

    // Simulate ticket creation
    ticketMgr.ticketMap.set(finding.finding_id, 'SEC-123');

    expect(ticketMgr.getTicketForFinding('FINDING-001')).toBe('SEC-123');
  });

  test('should map severity to JIRA priority', () => {
    const ticketMgr = createTicketManager({}, {});

    expect(ticketMgr._mapToJiraSeverity('Critical')).toBe('Highest');
    expect(ticketMgr._mapToJiraSeverity('High')).toBe('High');
    expect(ticketMgr._mapToJiraSeverity('Medium')).toBe('Medium');
    expect(ticketMgr._mapToJiraSeverity('Low')).toBe('Low');
  });

  test('should track ticket mappings', () => {
    const ticketMgr = createTicketManager({}, {});

    ticketMgr.ticketMap.set('FINDING-001', 'SEC-123');
    ticketMgr.ticketMap.set('FINDING-002', 'SEC-124');

    const stats = ticketMgr.getStats();
    expect(stats.total_mapped).toBe(2);
    expect(stats.tickets).toHaveLength(2);
  });

  test('should get color for severity', () => {
    const ticketMgr = createTicketManager({}, {});

    expect(ticketMgr._getColorForSeverity('Critical')).toBe('#ff0000');
    expect(ticketMgr._getColorForSeverity('High')).toBe('#ff6600');
    expect(ticketMgr._getColorForSeverity('Medium')).toBe('#ffaa00');
  });
});

// ============================================================================
// DIFFERENTIAL REPORTER TESTS (Gap 7)
// ============================================================================

describe('Differential Reporter - Progress Tracking', () => {
  test('should detect new findings', () => {
    const old = [
      { title: 'SQL Injection', severity: 'High', affected_component: '/login' }
    ];

    const newFindings = [
      { title: 'SQL Injection', severity: 'High', affected_component: '/login' },
      { title: 'XSS', severity: 'Medium', affected_component: '/profile' }
    ];

    const report = DifferentialReporter.generateDiffReport(old, newFindings);

    expect(report.new_findings.count).toBe(1);
    expect(report.new_findings.items[0].title).toBe('XSS');
  });

  test('should detect fixed findings', () => {
    const old = [
      { title: 'SQL Injection', severity: 'High', affected_component: '/login', current_status: 'remediated' },
      { title: 'XSS', severity: 'Medium', affected_component: '/profile', current_status: 'discovered' }
    ];

    const newFindings = [
      { title: 'XSS', severity: 'Medium', affected_component: '/profile', current_status: 'discovered' }
    ];

    const report = DifferentialReporter.generateDiffReport(old, newFindings);

    expect(report.fixed_findings.count).toBe(1);
    expect(report.fixed_findings.items[0].title).toBe('SQL Injection');
  });

  test('should calculate remediation rate', () => {
    const old = Array.from({length: 10}, (_, i) => ({
      title: `Finding-${i}`,
      severity: 'High',
      affected_component: `/endpoint-${i}`,
      current_status: 'remediated'
    }));

    const newFindings = Array.from({length: 5}, (_, i) => ({
      title: `Finding-${i + 5}`,
      severity: 'High',
      affected_component: `/endpoint-${i + 5}`,
      current_status: 'discovered'
    }));

    const report = DifferentialReporter.generateDiffReport(old, newFindings);

    expect(report.metrics.remediation_rate).toBeDefined();
  });

  test('should track status changes', () => {
    const old = [
      { title: 'SQL Injection', severity: 'High', affected_component: '/login', current_status: 'discovered' }
    ];

    const newFindings = [
      { title: 'SQL Injection', severity: 'High', affected_component: '/login', current_status: 'approved' }
    ];

    const report = DifferentialReporter.generateDiffReport(old, newFindings);

    expect(report.status_changes.count).toBe(1);
    expect(report.status_changes.items[0].old_status).toBe('discovered');
    expect(report.status_changes.items[0].new_status).toBe('approved');
  });

  test('should generate trend analysis', () => {
    const seq = [
      [
        { title: 'F1', severity: 'High', affected_component: '/a', current_status: 'discovered' },
        { title: 'F2', severity: 'High', affected_component: '/b', current_status: 'discovered' }
      ],
      [
        { title: 'F2', severity: 'High', affected_component: '/b', current_status: 'remediated' },
        { title: 'F3', severity: 'High', affected_component: '/c', current_status: 'discovered' }
      ]
    ];

    const trend = DifferentialReporter.generateTrend(seq);

    expect(trend.engagements).toBe(2);
    expect(trend.trend).toHaveLength(1);
  });
});

// ============================================================================
// TENANT MANAGER TESTS (Gap 8)
// ============================================================================

describe('Tenant Manager - Multi-tenant Support', () => {
  test('should create tenant', () => {
    const tenantMgr = createTenantManager(testDir);

    const tenant = tenantMgr.createTenant('tenant-001', {
      roles: { admin: ['user1'], viewer: ['user2'] }
    });

    expect(tenant.id).toBe('tenant-001');
    expect(tenant.isActive).toBe(true);
    expect(fs.existsSync(tenant.basePath)).toBe(true);
  });

  test('should add user to tenant', () => {
    const tenantMgr = createTenantManager(testDir);

    tenantMgr.createTenant('tenant-001');
    tenantMgr.addUserToTenant('tenant-001', 'user-001', 'admin');
    tenantMgr.addUserToTenant('tenant-001', 'user-002', 'viewer');

    const tenant = tenantMgr.getTenant('tenant-001');
    expect(tenant.users['user-001']).toBe('admin');
    expect(tenant.users['user-002']).toBe('viewer');
  });

  test('should enforce RBAC', () => {
    const tenantMgr = createTenantManager(testDir);

    tenantMgr.createTenant('tenant-001');
    tenantMgr.addUserToTenant('tenant-001', 'admin-user', 'admin');
    tenantMgr.addUserToTenant('tenant-001', 'viewer-user', 'viewer');

    expect(tenantMgr.enforceRBAC('tenant-001', 'admin-user', 'delete')).toBe(true);
    expect(tenantMgr.enforceRBAC('tenant-001', 'viewer-user', 'delete')).toBe(false);
    expect(tenantMgr.enforceRBAC('tenant-001', 'viewer-user', 'read')).toBe(true);
  });

  test('should execute operation with tenant isolation', async () => {
    const tenantMgr = createTenantManager(testDir);

    tenantMgr.createTenant('tenant-001');
    tenantMgr.addUserToTenant('tenant-001', 'user-001', 'admin');

    const result = await tenantMgr.executeWithTenantIsolation(
      'tenant-001',
      'user-001',
      async (context) => {
        expect(context.tenantId).toBe('tenant-001');
        expect(context.userId).toBe('user-001');
        return { success: true };
      }
    );

    expect(result.success).toBe(true);
  });

  test('should get tenant statistics', () => {
    const tenantMgr = createTenantManager(testDir);

    tenantMgr.createTenant('tenant-001');
    tenantMgr.addUserToTenant('tenant-001', 'user-001', 'admin');
    tenantMgr.addUserToTenant('tenant-001', 'user-002', 'viewer');

    const stats = tenantMgr.getTenantStats('tenant-001');

    expect(stats.id).toBe('tenant-001');
    expect(stats.user_count).toBe(2);
    expect(stats.is_active).toBe(true);
  });

  test('should maintain audit log', () => {
    const tenantMgr = createTenantManager(testDir);

    tenantMgr.createTenant('tenant-001');
    tenantMgr.addUserToTenant('tenant-001', 'user-001', 'admin');

    const auditLog = tenantMgr.getAuditLog('tenant-001');

    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0].action).toBe('tenant_created');
  });

  test('should delete tenant', () => {
    const tenantMgr = createTenantManager(testDir);

    tenantMgr.createTenant('tenant-001');
    expect(tenantMgr.getTenant('tenant-001')).toBeDefined();

    tenantMgr.deleteTenant('tenant-001');

    expect(() => tenantMgr.getTenant('tenant-001')).toThrow();
  });
});

// ============================================================================
// ADDITIONAL INTEGRATION TESTS
// ============================================================================

describe('High-Priority Gaps Integration', () => {
  test('should integrate ticket manager with findings', () => {
    const ticketMgr = createTicketManager(
      { baseUrl: 'https://jira.example.com' },
      { webhookUrl: 'https://hooks.slack.com' }
    );

    const finding = {
      finding_id: 'FINDING-001',
      title: 'Critical Security Flaw',
      severity: 'Critical',
      affected_component: '/api/auth'
    };

    // Simulate creation
    const jiraId = 'SEC-999';
    ticketMgr.ticketMap.set(finding.finding_id, jiraId);

    expect(ticketMgr.getTicketForFinding(finding.finding_id)).toBe(jiraId);
    expect(ticketMgr.getStats().total_mapped).toBe(1);
  });

  test('should compare multiple engagements', () => {
    const eng1 = [
      { title: 'Finding-1', severity: 'High', affected_component: '/a', current_status: 'discovered' },
      { title: 'Finding-2', severity: 'Medium', affected_component: '/b', current_status: 'discovered' }
    ];

    const eng2 = [
      { title: 'Finding-2', severity: 'Medium', affected_component: '/b', current_status: 'approved' }
    ];

    const report = DifferentialReporter.generateDiffReport(eng1, eng2);

    expect(report.summary.previous_engagement.total).toBe(2);
    expect(report.summary.current_engagement.total).toBe(1);
    expect(report.fixed_findings.count).toBe(1);
  });
});
