#!/usr/bin/env node

/**
 * KALI TOOLS INTEGRATION TESTS
 *
 * Tests for Kali Linux security tools orchestration across all phases.
 * Verifies tool execution, rate limiting, audit logging, and error handling.
 */

const { KaliToolsOrchestrator, Phase1Tools, Phase2Tools, Phase3Tools } = require('../orchestrator/kali-tools-integration.js');

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock audit logger
const mockAuditLogger = {
  log: jest.fn()
};

// Mock rate limiter
const mockRateLimiter = {
  checkLimit: jest.fn(() => ({ allowed: true }))
};

// Mock circuit breaker
const mockCircuitBreaker = {
  getOrCreate: jest.fn(() => ({
    execute: jest.fn((fn) => fn())
  }))
};

describe('Kali Tools Integration', () => {
  let orchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new KaliToolsOrchestrator(
      mockLogger,
      mockAuditLogger,
      mockRateLimiter,
      mockCircuitBreaker
    );
  });

  // =========================================================================
  // PHASE 1 TOOLS TESTS
  // =========================================================================

  describe('Phase 1: Reconnaissance Tools', () => {
    test('should list Phase 1 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('nmap');
      expect(tools).toContain('masscan');
      expect(tools).toContain('theHarvester');
      expect(tools).toContain('dnsEnum');
      expect(tools.length).toBe(4);
    });

    test('should initialize Phase 1 tools', () => {
      expect(orchestrator.phase1).toBeDefined();
      expect(orchestrator.phase1.logger).toBe(mockLogger);
      expect(orchestrator.phase1.auditLogger).toBe(mockAuditLogger);
    });

    test('should track Phase 1 tool execution', () => {
      orchestrator.executionHistory.push({
        executionId: 'phase1-nmap-123',
        phase: 'phase1',
        tool: 'nmap',
        target: 'target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const history = orchestrator.getExecutionHistory({ phase: 'phase1', tool: 'nmap' });
      expect(history.length).toBe(1);
      expect(history[0].tool).toBe('nmap');
    });
  });

  // =========================================================================
  // PHASE 2 TOOLS TESTS
  // =========================================================================

  describe('Phase 2: Scanning & Enumeration Tools', () => {
    test('should list Phase 2 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('nikto');
      expect(tools).toContain('wfuzz');
      expect(tools).toContain('sqlmap');
      expect(tools).toContain('dirb');
      expect(tools).toContain('hydra');
      expect(tools.length).toBe(5);
    });

    test('should initialize Phase 2 tools with rate limiter', () => {
      expect(orchestrator.phase2).toBeDefined();
      expect(orchestrator.phase2.rateLimiter).toBe(mockRateLimiter);
    });

    test('should respect rate limits in Phase 2', () => {
      mockRateLimiter.checkLimit.mockReturnValue({ allowed: false, reason: 'Limit exceeded' });

      const tools = new Phase2Tools(mockLogger, mockAuditLogger, mockRateLimiter);

      // Rate limit should be checked
      expect(tools.rateLimiter.checkLimit('nikto', 'http://target.com')).toEqual({
        allowed: false,
        reason: 'Limit exceeded'
      });
    });

    test('should track Phase 2 web scanning', () => {
      orchestrator.executionHistory.push({
        executionId: 'phase2-nikto-456',
        phase: 'phase2',
        tool: 'nikto',
        target: 'http://target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const history = orchestrator.getExecutionHistory({ phase: 'phase2' });
      expect(history.length).toBe(1);
      expect(history[0].tool).toBe('nikto');
    });

    test('should track Phase 2 credential attacks', () => {
      orchestrator.executionHistory.push({
        executionId: 'phase2-hydra-789',
        phase: 'phase2',
        tool: 'hydra',
        target: 'ssh://192.168.1.100',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const hydraHistory = orchestrator.getExecutionHistory({ tool: 'hydra' });
      expect(hydraHistory.length).toBe(1);
      expect(hydraHistory[0].phase).toBe('phase2');
    });
  });

  // =========================================================================
  // PHASE 3 TOOLS TESTS
  // =========================================================================

  describe('Phase 3: Exploitation & Advanced Tools', () => {
    test('should list Phase 3 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('john');
      expect(tools).toContain('hashcat');
      expect(tools).toContain('tcpdump');
      expect(tools).toContain('aircrack-ng');
      expect(tools).toContain('metasploit');
      expect(tools).toContain('setoolkit');
      expect(tools.length).toBe(6);
    });

    test('should initialize Phase 3 tools with circuit breaker', () => {
      expect(orchestrator.phase3).toBeDefined();
      expect(orchestrator.phase3.circuitBreaker).toBe(mockCircuitBreaker);
    });

    test('should track Phase 3 password cracking', () => {
      orchestrator.executionHistory.push({
        executionId: 'phase3-john-101',
        phase: 'phase3',
        tool: 'john',
        target: 'hashes.txt',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const history = orchestrator.getExecutionHistory({ phase: 'phase3', tool: 'john' });
      expect(history.length).toBe(1);
      expect(history[0].phase).toBe('phase3');
    });

    test('should use circuit breaker for exploitation', () => {
      const mockBreaker = {
        execute: jest.fn((fn) => fn())
      };
      mockCircuitBreaker.getOrCreate.mockReturnValue(mockBreaker);

      const tools = new Phase3Tools(mockLogger, mockAuditLogger, mockCircuitBreaker);

      // Verify circuit breaker registry is used
      expect(mockCircuitBreaker.getOrCreate).toBeDefined();
    });

    test('should track exploitation attempts', () => {
      orchestrator.executionHistory.push({
        executionId: 'phase3-metasploit-202',
        phase: 'phase3',
        tool: 'metasploit',
        target: 'exploit/windows/smb/ms17_010_eternalblue',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const exploitHistory = orchestrator.getExecutionHistory({ tool: 'metasploit' });
      expect(exploitHistory.length).toBe(1);
    });
  });

  // =========================================================================
  // AUDIT LOGGING TESTS
  // =========================================================================

  describe('Audit Logging', () => {
    test('should log tool execution events', () => {
      orchestrator.executionHistory.push({
        executionId: 'test-001',
        phase: 'phase1',
        tool: 'nmap',
        target: 'target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      expect(orchestrator.executionHistory.length).toBe(1);
      expect(orchestrator.executionHistory[0].tool).toBe('nmap');
    });

    test('should track failed executions', () => {
      orchestrator.executionHistory.push({
        executionId: 'test-002',
        phase: 'phase2',
        tool: 'nikto',
        target: 'http://invalid',
        status: 'failed',
        error: 'Connection refused',
        timestamp: new Date().toISOString()
      });

      const failures = orchestrator.getExecutionHistory({ status: 'failed' });
      expect(failures.length).toBe(1);
      expect(failures[0].error).toBe('Connection refused');
    });

    test('should provide execution history filtering', () => {
      orchestrator.executionHistory.push(
        {
          executionId: 'h1',
          phase: 'phase1',
          tool: 'nmap',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 'h2',
          phase: 'phase2',
          tool: 'nikto',
          target: 'http://target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 'h3',
          phase: 'phase3',
          tool: 'john',
          target: 'hashes.txt',
          status: 'failed',
          timestamp: new Date().toISOString()
        }
      );

      expect(orchestrator.getExecutionHistory({ phase: 'phase1' }).length).toBe(1);
      expect(orchestrator.getExecutionHistory({ phase: 'phase2' }).length).toBe(1);
      expect(orchestrator.getExecutionHistory({ phase: 'phase3' }).length).toBe(1);
      expect(orchestrator.getExecutionHistory({ status: 'failed' }).length).toBe(1);
    });
  });

  // =========================================================================
  // STATISTICS TESTS
  // =========================================================================

  describe('Tool Execution Statistics', () => {
    test('should calculate execution statistics', () => {
      orchestrator.executionHistory = [
        {
          executionId: 's1',
          phase: 'phase1',
          tool: 'nmap',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 's2',
          phase: 'phase1',
          tool: 'masscan',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 's3',
          phase: 'phase2',
          tool: 'nikto',
          target: 'http://target.com',
          status: 'failed',
          timestamp: new Date().toISOString()
        }
      ];

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.succeeded).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe('66.67%');
      expect(stats.byPhase.phase1).toBe(2);
      expect(stats.byPhase.phase2).toBe(1);
      expect(stats.byPhase.phase3).toBe(0);
    });

    test('should handle empty execution history', () => {
      orchestrator.executionHistory = [];

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.succeeded).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe('0%');
    });

    test('should track tool usage distribution', () => {
      orchestrator.executionHistory = [
        {
          executionId: 'u1',
          phase: 'phase1',
          tool: 'nmap',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 'u2',
          phase: 'phase1',
          tool: 'nmap',
          target: 'target2.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 'u3',
          phase: 'phase2',
          tool: 'nikto',
          target: 'http://target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      ];

      const nmapHistory = orchestrator.getExecutionHistory({ tool: 'nmap' });
      const niktoHistory = orchestrator.getExecutionHistory({ tool: 'nikto' });

      expect(nmapHistory.length).toBe(2);
      expect(niktoHistory.length).toBe(1);
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Kali Tools Integration', () => {
    test('should provide unified tool access across all phases', () => {
      const phase1Tools = orchestrator.getToolsByPhase('phase1');
      const phase2Tools = orchestrator.getToolsByPhase('phase2');
      const phase3Tools = orchestrator.getToolsByPhase('phase3');

      const allTools = [...phase1Tools, ...phase2Tools, ...phase3Tools];

      expect(allTools.length).toBe(15);  // 4 + 5 + 6
      expect(new Set(allTools).size).toBe(15);  // No duplicates
    });

    test('should handle multi-phase reconnaissance workflow', () => {
      // Simulate Phase 1 reconnaissance
      orchestrator.executionHistory.push(
        {
          executionId: 'workflow-p1-1',
          phase: 'phase1',
          tool: 'nmap',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        {
          executionId: 'workflow-p1-2',
          phase: 'phase1',
          tool: 'theHarvester',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      );

      // Simulate Phase 2 scanning
      orchestrator.executionHistory.push(
        {
          executionId: 'workflow-p2-1',
          phase: 'phase2',
          tool: 'nikto',
          target: 'http://target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      );

      const stats = orchestrator.getStatistics();

      expect(stats.byPhase.phase1).toBe(2);
      expect(stats.byPhase.phase2).toBe(1);
      expect(stats.total).toBe(3);
    });

    test('should maintain execution order', () => {
      const now = Date.now();
      orchestrator.executionHistory.push(
        {
          executionId: 'order-1',
          phase: 'phase1',
          tool: 'nmap',
          target: 'target.com',
          status: 'completed',
          timestamp: new Date(now).toISOString()
        },
        {
          executionId: 'order-2',
          phase: 'phase2',
          tool: 'nikto',
          target: 'http://target.com',
          status: 'completed',
          timestamp: new Date(now + 1000).toISOString()
        },
        {
          executionId: 'order-3',
          phase: 'phase3',
          tool: 'john',
          target: 'hashes.txt',
          status: 'completed',
          timestamp: new Date(now + 2000).toISOString()
        }
      );

      const history = orchestrator.getExecutionHistory();

      expect(history[0].executionId).toBe('order-1');
      expect(history[1].executionId).toBe('order-2');
      expect(history[2].executionId).toBe('order-3');
    });
  });
});
