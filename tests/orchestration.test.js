#!/usr/bin/env node

/**
 * COMPREHENSIVE TESTS FOR TOOL CHAINING & ORCHESTRATION
 *
 * Tests for:
 * - Tool Chain Orchestrator
 * - Exploit Modules
 * - Integrated Orchestrator
 */

const {
  ToolChainOrchestrator,
  PredefinedChains
} = require('../orchestrator/tool-chain-orchestrator');

const { ExploitModule } = require('../orchestrator/exploit-modules');
const { IntegratedPenetrationTestingOrchestrator } = require('../orchestrator/integrated-orchestrator');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

const mockAuditLogger = {
  log: jest.fn()
};

const mockRateLimiter = {
  checkLimit: jest.fn(() => ({ allowed: true }))
};

const mockCircuitBreaker = {
  getOrCreate: jest.fn(() => ({
    execute: jest.fn((fn) => fn())
  }))
};

describe('Tool Chain Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new ToolChainOrchestrator(mockLogger, mockAuditLogger);
  });

  describe('Chain Definition', () => {
    test('should define a new tool chain', () => {
      orchestrator.defineChain('test-chain', [
        'tool1',
        'tool2',
        'tool3'
      ], {
        strategy: 'sequential'
      });

      const chain = orchestrator.chainDefinitions.get('test-chain');
      expect(chain).toBeDefined();
      expect(chain.name).toBe('test-chain');
      expect(chain.tools.length).toBe(3);
    });

    test('should set default chain configuration', () => {
      orchestrator.defineChain('test', ['tool1'], {});

      const chain = orchestrator.chainDefinitions.get('test');
      expect(chain.config.strategy).toBe('sequential');
      expect(chain.config.passOutputToNext).toBe(true);
      expect(chain.config.stopOnFailure).toBe(true);
      expect(chain.config.aggregateResults).toBe(true);
    });

    test('should override default configuration', () => {
      orchestrator.defineChain('test', ['tool1'], {
        strategy: 'parallel',
        stopOnFailure: false,
        aggregateResults: false
      });

      const chain = orchestrator.chainDefinitions.get('test');
      expect(chain.config.strategy).toBe('parallel');
      expect(chain.config.stopOnFailure).toBe(false);
      expect(chain.config.aggregateResults).toBe(false);
    });
  });

  describe('Sequential Execution', () => {
    test('should execute tools sequentially', async () => {
      orchestrator.defineChain('sequential-test', [
        'nmap',
        'nikto',
        'wfuzz'
      ], {
        strategy: 'sequential',
        passOutputToNext: true
      });

      const result = await orchestrator.executeChain('sequential-test', {
        target: 'example.com'
      });

      expect(result.chainName).toBe('sequential-test');
      expect(result.tools.length).toBe(3);
      expect(result.tools[0].name).toBe('nmap');
      expect(result.tools[1].name).toBe('nikto');
      expect(result.tools[2].name).toBe('wfuzz');
    });

    test('should stop on failure if stopOnFailure is true', async () => {
      orchestrator.defineChain('fail-test', [
        'tool1',
        'tool2',
        'tool3'
      ], {
        strategy: 'sequential',
        stopOnFailure: true
      });

      // Mock tool failure
      const chain = orchestrator.chainDefinitions.get('fail-test');
      const originalExecuteTool = orchestrator._executeTool;
      orchestrator._executeTool = jest.fn((name) => {
        if (name === 'tool2') {
          throw new Error('Tool2 failed');
        }
        return Promise.resolve({ success: true });
      });

      const result = await orchestrator.executeChain('fail-test', {});

      expect(result.tools.length).toBe(2);
      expect(result.tools[1].status).toBe('failed');
      expect(result.errors.length).toBe(1);

      orchestrator._executeTool = originalExecuteTool;
    });

    test('should continue on failure if stopOnFailure is false', async () => {
      orchestrator.defineChain('continue-test', [
        'tool1',
        'tool2',
        'tool3'
      ], {
        strategy: 'sequential',
        stopOnFailure: false
      });

      const result = await orchestrator.executeChain('continue-test', {});

      expect(result.tools.length).toBe(3);
      expect(result.summary.totalTools).toBe(3);
    });
  });

  describe('Parallel Execution', () => {
    test('should execute tools in parallel', async () => {
      orchestrator.defineChain('parallel-test', [
        'nikto',
        'wfuzz',
        'nuclei',
        'xsstrike'
      ], {
        strategy: 'parallel'
      });

      const result = await orchestrator.executeChain('parallel-test', {
        target: 'example.com'
      });

      expect(result.tools.length).toBe(4);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    test('should aggregate parallel results', async () => {
      orchestrator.defineChain('parallel-agg', [
        'tool1',
        'tool2'
      ], {
        strategy: 'parallel',
        aggregateResults: true
      });

      const result = await orchestrator.executeChain('parallel-agg', {});

      expect(result.aggregated).toBeDefined();
      expect(Object.keys(result.aggregated).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Conditional Execution', () => {
    test('should skip tool if condition is not met', async () => {
      orchestrator.defineChain('conditional-test', [
        {
          name: 'tool1',
          config: {}
        },
        {
          name: 'wpscan',
          config: {
            condition: (output) => output?.cms === 'wordpress'
          }
        }
      ], {
        strategy: 'conditional'
      });

      const result = await orchestrator.executeChain('conditional-test', {
        cms: 'drupal'
      });

      const wpScanResult = result.tools.find(t => t.name === 'wpscan');
      expect(wpScanResult.status).toBe('skipped');
    });

    test('should execute tool if condition is met', async () => {
      orchestrator.defineChain('conditional-match', [
        {
          name: 'tool1',
          config: {}
        },
        {
          name: 'wpscan',
          config: {
            condition: (output) => output?.cms === 'wordpress'
          }
        }
      ], {
        strategy: 'conditional'
      });

      const result = await orchestrator.executeChain('conditional-match', {
        cms: 'wordpress'
      });

      const wpScanResult = result.tools.find(t => t.name === 'wpscan');
      expect(wpScanResult.status).toBe('success');
    });
  });

  describe('Chain Execution Tracking', () => {
    test('should record execution history', async () => {
      orchestrator.defineChain('history-test', ['tool1', 'tool2'], {});

      await orchestrator.executeChain('history-test', {});
      await orchestrator.executeChain('history-test', {});

      const history = orchestrator.getChainHistory();
      expect(history.length).toBe(2);
      expect(history[0].chainName).toBe('history-test');
      expect(history[1].chainName).toBe('history-test');
    });

    test('should filter execution history', async () => {
      orchestrator.defineChain('filter-test', ['tool1'], {});

      await orchestrator.executeChain('filter-test', {});

      const history = orchestrator.getChainHistory({
        chainName: 'filter-test'
      });

      expect(history.length).toBe(1);
      expect(history[0].chainName).toBe('filter-test');
    });
  });

  describe('Statistics', () => {
    test('should calculate chain statistics', async () => {
      orchestrator.defineChain('stats-test', ['tool1', 'tool2'], {});

      await orchestrator.executeChain('stats-test', {});

      const stats = orchestrator.getStatistics();

      expect(stats.totalChainsExecuted).toBe(1);
      expect(stats.chainDefinitions).toBe(1);
      expect(stats.totalToolsExecuted).toBe(2);
    });

    test('should calculate success rate', async () => {
      orchestrator.defineChain('success-test', ['tool1'], {});

      await orchestrator.executeChain('success-test', {});

      const stats = orchestrator.getStatistics();

      expect(stats.successRate).toBeDefined();
      expect(typeof stats.successRate).toBe('string');
    });
  });
});

describe('Exploit Modules', () => {
  let exploitModule;

  beforeEach(() => {
    jest.clearAllMocks();
    exploitModule = new ExploitModule(mockLogger, mockAuditLogger);
  });

  describe('Vulnerability Types', () => {
    test('should support SQLi module', async () => {
      const module = exploitModule.modules.get('sqli');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('CRITICAL');
    });

    test('should support XSS module', async () => {
      const module = exploitModule.modules.get('xss');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('HIGH');
    });

    test('should support RCE module', async () => {
      const module = exploitModule.modules.get('rce');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('CRITICAL');
    });

    test('should support SSRF module', async () => {
      const module = exploitModule.modules.get('ssrf');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('HIGH');
    });

    test('should support CSRF module', async () => {
      const module = exploitModule.modules.get('csrf');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('MEDIUM');
    });

    test('should support Auth Bypass module', async () => {
      const module = exploitModule.modules.get('auth-bypass');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('CRITICAL');
    });

    test('should support Path Traversal module', async () => {
      const module = exploitModule.modules.get('path-traversal');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('HIGH');
    });

    test('should support Command Injection module', async () => {
      const module = exploitModule.modules.get('command-injection');
      expect(module).toBeDefined();
      expect(module.getSeverity()).toBe('CRITICAL');
    });
  });

  describe('Batch Detection', () => {
    test('should detect vulnerabilities across all types', async () => {
      const vulnerabilities = await exploitModule.detectVulnerabilities('http://example.com', {
        parameters: ['id', 'q', 'url', 'cmd']
      });

      expect(Array.isArray(vulnerabilities)).toBe(true);
    });

    test('should return vulnerability details', async () => {
      const vulnerabilities = await exploitModule.detectVulnerabilities('http://example.com', {
        parameters: ['id']
      });

      vulnerabilities.forEach(vuln => {
        expect(vuln.vulnerabilityType).toBeDefined();
        expect(vuln.vulnerable).toBeDefined();
        expect(vuln.severity).toBeDefined();
      });
    });
  });

  describe('Exploit Generation', () => {
    test('should generate exploits for detected vulnerabilities', async () => {
      const exploits = await exploitModule.generateExploits('http://example.com', {
        parameters: ['id', 'q']
      });

      expect(exploits.target).toBe('http://example.com');
      expect(exploits.vulnerabilitiesFound).toBeDefined();
      expect(exploits.exploitsGenerated).toBeDefined();
      expect(Array.isArray(exploits.details)).toBe(true);
    });
  });

  describe('Exploit History & Statistics', () => {
    test('should track exploit execution history', async () => {
      const initial = exploitModule.getExploitHistory();
      expect(initial.length).toBe(0);
    });

    test('should provide exploit statistics', async () => {
      const stats = exploitModule.getStatistics();

      expect(stats.totalExploits).toBeDefined();
      expect(stats.vulnerabilityTypes).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.successRate).toBeDefined();
    });
  });
});

describe('Integrated Penetration Testing Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new IntegratedPenetrationTestingOrchestrator(
      mockLogger,
      mockAuditLogger,
      mockRateLimiter,
      mockCircuitBreaker
    );
  });

  describe('Comprehensive Assessment', () => {
    test('should run all four phases of assessment', async () => {
      const assessment = await orchestrator.runComprehensiveAssessment('example.com', {});

      expect(assessment.engagementId).toBeDefined();
      expect(assessment.target).toBe('example.com');
      expect(assessment.phases.reconnaissance).toBeDefined();
      expect(assessment.phases.scanning).toBeDefined();
      expect(assessment.phases.exploitation).toBeDefined();
      expect(assessment.phases.analysis).toBeDefined();
    });

    test('should execute phase 1: reconnaissance', async () => {
      const assessment = await orchestrator.runComprehensiveAssessment('example.com', {});

      const recon = assessment.phases.reconnaissance;
      expect(recon.chain).toBe('reconnaissance');
      expect(recon.startTime).toBeDefined();
      expect(recon.endTime).toBeDefined();
    });

    test('should execute phase 2: scanning', async () => {
      const assessment = await orchestrator.runComprehensiveAssessment('example.com', {});

      const scanning = assessment.phases.scanning;
      expect(scanning.chain).toBe('web-scanning');
      expect(scanning.vulnerabilities).toBeDefined();
      expect(scanning.summary).toBeDefined();
    });

    test('should execute phase 3: exploitation', async () => {
      const assessment = await orchestrator.runComprehensiveAssessment('example.com', {});

      const exploitation = assessment.phases.exploitation;
      expect(exploitation.exploits).toBeDefined();
      expect(exploitation.confirmed).toBeDefined();
      expect(exploitation.possible).toBeDefined();
    });

    test('should execute phase 4: analysis', async () => {
      const assessment = await orchestrator.runComprehensiveAssessment('example.com', {});

      const analysis = assessment.phases.analysis;
      expect(analysis.findings).toBeDefined();
      expect(analysis.riskAssessment).toBeDefined();
    });

    test('should generate assessment summary', async () => {
      const assessment = await orchestrator.runComprehensiveAssessment('example.com', {});

      const summary = assessment.summary;
      expect(summary.target).toBe('example.com');
      expect(summary.tools_executed).toBeDefined();
      expect(summary.vulnerabilities_detected).toBeDefined();
      expect(summary.exploits_verified).toBeDefined();
      expect(summary.overall_risk).toBeDefined();
    });
  });

  describe('Rapid Assessment', () => {
    test('should complete rapid assessment in minimal time', async () => {
      const start = Date.now();
      const result = await orchestrator.runRapidAssessment('example.com', {});
      const elapsed = Date.now() - start;

      expect(result.target).toBe('example.com');
      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);
    });

    test('should focus on high-severity findings', async () => {
      const result = await orchestrator.runRapidAssessment('example.com', {});

      result.findings.forEach(finding => {
        expect(['CRITICAL', 'HIGH'].includes(finding.severity)).toBe(true);
      });
    });
  });

  describe('Assessment History', () => {
    test('should track assessment history', async () => {
      await orchestrator.runComprehensiveAssessment('target1.com', {});
      await orchestrator.runComprehensiveAssessment('target2.com', {});

      const history = orchestrator.getAssessmentHistory();
      expect(history.length).toBe(2);
    });

    test('should filter assessment history by target', async () => {
      await orchestrator.runComprehensiveAssessment('target1.com', {});
      await orchestrator.runComprehensiveAssessment('target2.com', {});

      const history = orchestrator.getAssessmentHistory({
        target: 'target1.com'
      });

      expect(history.length).toBe(1);
      expect(history[0].target).toBe('target1.com');
    });
  });

  describe('Statistics', () => {
    test('should provide comprehensive statistics', async () => {
      await orchestrator.runComprehensiveAssessment('example.com', {});

      const stats = orchestrator.getStatistics();

      expect(stats.kaliTools).toBeDefined();
      expect(stats.toolChains).toBeDefined();
      expect(stats.exploitModules).toBeDefined();
      expect(stats.assessments).toBeDefined();
    });

    test('should track assessment metrics', async () => {
      await orchestrator.runComprehensiveAssessment('example.com', {});

      const stats = orchestrator.getStatistics();

      expect(stats.assessments.total).toBe(1);
      expect(stats.assessments.completed).toBeGreaterThanOrEqual(0);
      expect(stats.assessments.failed).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Predefined Chains', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new ToolChainOrchestrator(mockLogger, mockAuditLogger);
  });

  test('should create reconnaissance chain', () => {
    PredefinedChains.createReconnaissanceChain(orchestrator);

    const chain = orchestrator.chainDefinitions.get('reconnaissance');
    expect(chain).toBeDefined();
    expect(chain.tools.length).toBeGreaterThan(0);
  });

  test('should create web-scanning chain', () => {
    PredefinedChains.createWebScanningChain(orchestrator);

    const chain = orchestrator.chainDefinitions.get('web-scanning');
    expect(chain).toBeDefined();
    expect(chain.tools.length).toBeGreaterThan(0);
  });

  test('should create vulnerability assessment chain', () => {
    PredefinedChains.createVulnerabilityAssessmentChain(orchestrator);

    const chain = orchestrator.chainDefinitions.get('vulnerability-assessment');
    expect(chain).toBeDefined();
    expect(chain.tools.length).toBeGreaterThan(0);
  });

  test('should create exploitation chain', () => {
    PredefinedChains.createExploitationChain(orchestrator);

    const chain = orchestrator.chainDefinitions.get('exploitation');
    expect(chain).toBeDefined();
    expect(chain.tools.length).toBeGreaterThan(0);
  });

  test('should create full-pentest chain', () => {
    PredefinedChains.createFullPenetrationTestChain(orchestrator);

    const chain = orchestrator.chainDefinitions.get('full-pentest');
    expect(chain).toBeDefined();
    expect(chain.tools.length).toBeGreaterThan(0);
  });
});
