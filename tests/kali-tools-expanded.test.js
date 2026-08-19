#!/usr/bin/env node

/**
 * KALI TOOLS EXPANDED - 54 TOOLS TEST SUITE
 *
 * Comprehensive testing of all 54 security tools across 3 phases
 * - Phase 1: 18 Reconnaissance tools
 * - Phase 2: 18 Scanning tools
 * - Phase 3: 18 Exploitation tools
 */

const {
  KaliToolsExpandedOrchestrator,
  Phase1ToolsExpanded,
  Phase2ToolsExpanded,
  Phase3ToolsExpanded
} = require('../orchestrator/kali-tools-expanded.js');

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

describe('Kali Tools Expanded - 54 Tool Suite', () => {
  let orchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new KaliToolsExpandedOrchestrator(
      mockLogger,
      mockAuditLogger,
      mockRateLimiter,
      mockCircuitBreaker
    );
  });

  // =========================================================================
  // PHASE 1: RECONNAISSANCE TOOLS (18 Tools)
  // =========================================================================

  describe('Phase 1: Reconnaissance Tools (18 Total)', () => {
    test('should have exactly 18 Phase 1 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools.length).toBe(18);
    });

    test('should include network discovery tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('nmap');
      expect(tools).toContain('masscan');
      expect(tools).toContain('shodan');
      expect(tools).toContain('zmap');
    });

    test('should include DNS enumeration tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('theHarvester');
      expect(tools).toContain('amass');
      expect(tools).toContain('subfinder');
      expect(tools).toContain('assetfinder');
      expect(tools).toContain('dnsEnum');
      expect(tools).toContain('fierce');
    });

    test('should include HTTP probing tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('httprobe');
      expect(tools).toContain('waybackurls');
      expect(tools).toContain('commonspeak');
    });

    test('should include OSINT tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('spiderfoot');
      expect(tools).toContain('knockpy');
      expect(tools).toContain('whoisdomain');
      expect(tools).toContain('reversewhois');
      expect(tools).toContain('linkedin_enum');
    });

    test('Phase 1 tools should have proper initialization', () => {
      expect(orchestrator.phase1).toBeDefined();
      expect(orchestrator.phase1.logger).toBe(mockLogger);
      expect(orchestrator.phase1.auditLogger).toBe(mockAuditLogger);
    });

    test('should track Phase 1 reconnaissance executions', () => {
      orchestrator.executionHistory.push({
        executionId: 'p1-001',
        phase: 'phase1',
        tool: 'nmap',
        target: 'target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const history = orchestrator.getExecutionHistory({ phase: 'phase1' });
      expect(history.length).toBe(1);
      expect(history[0].tool).toBe('nmap');
    });
  });

  // =========================================================================
  // PHASE 2: SCANNING & ENUMERATION TOOLS (18 Tools)
  // =========================================================================

  describe('Phase 2: Scanning & Enumeration Tools (18 Total)', () => {
    test('should have exactly 18 Phase 2 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools.length).toBe(18);
    });

    test('should include web server scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('nikto');
      expect(tools).toContain('testssl');
      expect(tools).toContain('sslscan');
      expect(tools).toContain('sslyze');
    });

    test('should include web application scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('wfuzz');
      expect(tools).toContain('ffuf');
      expect(tools).toContain('nuclei');
      expect(tools).toContain('xsstrike');
    });

    test('should include database scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('sqlmap');
      expect(tools).toContain('mongoaudit');
      expect(tools).toContain('ncrack');
    });

    test('should include directory discovery tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('dirb');
      expect(tools).toContain('gobuster');
      expect(tools).toContain('parameth');
    });

    test('should include CMS scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('joomscan');
      expect(tools).toContain('wpscan');
      expect(tools).toContain('droopescan');
    });

    test('should include credential testing tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('hydra');
      expect(tools).toContain('medusa');
    });

    test('Phase 2 tools should have rate limiting', () => {
      expect(orchestrator.phase2).toBeDefined();
      expect(orchestrator.phase2.rateLimiter).toBe(mockRateLimiter);
    });

    test('should track Phase 2 scanning executions', () => {
      orchestrator.executionHistory.push({
        executionId: 'p2-001',
        phase: 'phase2',
        tool: 'nikto',
        target: 'http://target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const history = orchestrator.getExecutionHistory({ phase: 'phase2', tool: 'nikto' });
      expect(history.length).toBe(1);
    });
  });

  // =========================================================================
  // PHASE 3: EXPLOITATION & ADVANCED TOOLS (18 Tools)
  // =========================================================================

  describe('Phase 3: Exploitation & Advanced Tools (18 Total)', () => {
    test('should have exactly 18 Phase 3 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools.length).toBe(18);
    });

    test('should include password cracking tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('john');
      expect(tools).toContain('hashcat');
      expect(tools).toContain('hydra3');
      expect(tools).toContain('ophcrack');
    });

    test('should include exploitation frameworks', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('metasploit');
      expect(tools).toContain('msfvenom');
      expect(tools).toContain('empire');
    });

    test('should include credential dumping tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('mimikatz');
      expect(tools).toContain('secretsdump');
      expect(tools).toContain('impacket');
      expect(tools).toContain('responder');
    });

    test('should include browser exploitation tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('beef');
      expect(tools).toContain('xsstrike3');
    });

    test('should include network exploitation tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('tcpdump');
      expect(tools).toContain('wireshark');
      expect(tools).toContain('aircrackng');
      expect(tools).toContain('proxychains');
    });

    test('should include post-exploitation tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('reverseshell');
      expect(tools).toContain('ysoserial');
    });

    test('Phase 3 tools should have circuit breaker', () => {
      expect(orchestrator.phase3).toBeDefined();
      expect(orchestrator.phase3.circuitBreaker).toBe(mockCircuitBreaker);
    });

    test('should track Phase 3 exploitation executions', () => {
      orchestrator.executionHistory.push({
        executionId: 'p3-001',
        phase: 'phase3',
        tool: 'metasploit',
        target: 'exploit/windows/smb/ms17_010',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const history = orchestrator.getExecutionHistory({ phase: 'phase3' });
      expect(history.length).toBe(1);
    });
  });

  // =========================================================================
  // 100% COVERAGE TESTS
  // =========================================================================

  describe('100% Tool Coverage', () => {
    test('should have 54 total tools across all phases', () => {
      const allTools = orchestrator.getAllTools();
      expect(allTools.total).toBe(54);
      expect(allTools.phase1.length).toBe(18);
      expect(allTools.phase2.length).toBe(18);
      expect(allTools.phase3.length).toBe(18);
    });

    test('should have no duplicate tools across phases', () => {
      const p1 = orchestrator.getToolsByPhase('phase1');
      const p2 = orchestrator.getToolsByPhase('phase2');
      const p3 = orchestrator.getToolsByPhase('phase3');

      const allTools = [...p1, ...p2, ...p3];
      const uniqueTools = new Set(allTools);

      expect(uniqueTools.size).toBe(54);
    });

    test('should cover all reconnaissance categories in Phase 1', () => {
      const tools = orchestrator.getToolsByPhase('phase1');

      // Network Discovery
      const networkTools = tools.filter(t => ['nmap', 'masscan', 'shodan', 'zmap'].includes(t));
      expect(networkTools.length).toBe(4);

      // DNS & Subdomains
      const dnsTools = tools.filter(t => ['theHarvester', 'amass', 'subfinder', 'assetfinder', 'dnsEnum', 'fierce'].includes(t));
      expect(dnsTools.length).toBe(6);

      // HTTP Probing
      const httpTools = tools.filter(t => ['httprobe', 'waybackurls', 'commonspeak'].includes(t));
      expect(httpTools.length).toBe(3);

      // OSINT
      const osintTools = tools.filter(t => ['spiderfoot', 'knockpy', 'whoisdomain', 'reversewhois', 'linkedin_enum'].includes(t));
      expect(osintTools.length).toBe(5);

      expect(networkTools.length + dnsTools.length + httpTools.length + osintTools.length).toBe(18);
    });

    test('should cover all scanning categories in Phase 2', () => {
      const tools = orchestrator.getToolsByPhase('phase2');

      // Web Server Scanning
      const webServerTools = tools.filter(t => ['nikto', 'testssl', 'sslscan', 'sslyze'].includes(t));
      expect(webServerTools.length).toBe(4);

      // Web Application Scanning
      const webAppTools = tools.filter(t => ['wfuzz', 'ffuf', 'nuclei', 'xsstrike'].includes(t));
      expect(webAppTools.length).toBe(4);

      // Database Scanning
      const dbTools = tools.filter(t => ['sqlmap', 'mongoaudit', 'ncrack'].includes(t));
      expect(dbTools.length).toBe(3);

      // Directory Discovery
      const dirTools = tools.filter(t => ['dirb', 'gobuster', 'parameth'].includes(t));
      expect(dirTools.length).toBe(3);

      // CMS Scanning
      const cmsTools = tools.filter(t => ['joomscan', 'wpscan', 'droopescan'].includes(t));
      expect(cmsTools.length).toBe(3);

      // Credentials
      const credTools = tools.filter(t => ['hydra', 'medusa'].includes(t));
      expect(credTools.length).toBe(2);

      const totalCoverage = webServerTools.length + webAppTools.length + dbTools.length +
                           dirTools.length + cmsTools.length + credTools.length;
      expect(totalCoverage).toBe(18);
    });

    test('should cover all exploitation categories in Phase 3', () => {
      const tools = orchestrator.getToolsByPhase('phase3');

      // Password Cracking
      const crackTools = tools.filter(t => ['john', 'hashcat', 'hydra3', 'ophcrack'].includes(t));
      expect(crackTools.length).toBe(4);

      // Exploitation Frameworks
      const exploitTools = tools.filter(t => ['metasploit', 'msfvenom', 'empire'].includes(t));
      expect(exploitTools.length).toBe(3);

      // Credential Dumping
      const dumpTools = tools.filter(t => ['mimikatz', 'secretsdump', 'impacket', 'responder'].includes(t));
      expect(dumpTools.length).toBe(4);

      // Browser Exploitation
      const browserTools = tools.filter(t => ['beef', 'xsstrike3'].includes(t));
      expect(browserTools.length).toBe(2);

      // Network Exploitation
      const netTools = tools.filter(t => ['tcpdump', 'wireshark', 'aircrackng', 'proxychains'].includes(t));
      expect(netTools.length).toBe(4);

      // Post-Exploitation
      const postExploitTools = tools.filter(t => ['reverseshell', 'ysoserial'].includes(t));
      expect(postExploitTools.length).toBe(2);

      const totalCoverage = crackTools.length + exploitTools.length + dumpTools.length +
                           browserTools.length + netTools.length + postExploitTools.length;
      expect(totalCoverage).toBe(18);
    });
  });

  // =========================================================================
  // STATISTICS & REPORTING
  // =========================================================================

  describe('Statistics & Reporting', () => {
    test('should calculate correct statistics with no executions', () => {
      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.succeeded).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe('0%');
      expect(stats.toolCoverage.total).toBe(54);
    });

    test('should calculate statistics with mixed executions', () => {
      orchestrator.executionHistory = [
        // Phase 1
        { executionId: '1', phase: 'phase1', tool: 'nmap', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '2', phase: 'phase1', tool: 'amass', status: 'completed', timestamp: new Date().toISOString() },

        // Phase 2
        { executionId: '3', phase: 'phase2', tool: 'nikto', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '4', phase: 'phase2', tool: 'sqlmap', status: 'failed', timestamp: new Date().toISOString() },

        // Phase 3
        { executionId: '5', phase: 'phase3', tool: 'john', status: 'completed', timestamp: new Date().toISOString() }
      ];

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(5);
      expect(stats.succeeded).toBe(4);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe('80.00%');
      expect(stats.byPhase.phase1).toBe(2);
      expect(stats.byPhase.phase2).toBe(2);
      expect(stats.byPhase.phase3).toBe(1);
      expect(stats.toolCoverage.total).toBe(54);
    });

    test('should return all tools correctly', () => {
      const allTools = orchestrator.getAllTools();

      expect(allTools.phase1).toHaveLength(18);
      expect(allTools.phase2).toHaveLength(18);
      expect(allTools.phase3).toHaveLength(18);
      expect(allTools.total).toBe(54);
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Full Penetration Test Workflow', () => {
    test('should execute multi-phase reconnaissance workflow', () => {
      // Simulate Phase 1
      orchestrator.executionHistory.push({
        executionId: 'workflow-1',
        phase: 'phase1',
        tool: 'nmap',
        target: 'target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      orchestrator.executionHistory.push({
        executionId: 'workflow-2',
        phase: 'phase1',
        tool: 'amass',
        target: 'target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      // Simulate Phase 2
      orchestrator.executionHistory.push({
        executionId: 'workflow-3',
        phase: 'phase2',
        tool: 'nikto',
        target: 'http://target.com',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      // Simulate Phase 3
      orchestrator.executionHistory.push({
        executionId: 'workflow-4',
        phase: 'phase3',
        tool: 'john',
        target: 'hashes.txt',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(4);
      expect(stats.succeeded).toBe(4);
      expect(stats.byPhase.phase1).toBe(2);
      expect(stats.byPhase.phase2).toBe(1);
      expect(stats.byPhase.phase3).toBe(1);
    });

    test('should handle complex multi-phase workflow with different tools', () => {
      const phase1Tools = orchestrator.getToolsByPhase('phase1').slice(0, 3);
      const phase2Tools = orchestrator.getToolsByPhase('phase2').slice(0, 3);
      const phase3Tools = orchestrator.getToolsByPhase('phase3').slice(0, 3);

      // Simulate execution of sample tools
      let executionId = 1;
      phase1Tools.forEach(tool => {
        orchestrator.executionHistory.push({
          executionId: `exec-${executionId++}`,
          phase: 'phase1',
          tool,
          target: 'target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      });

      phase2Tools.forEach(tool => {
        orchestrator.executionHistory.push({
          executionId: `exec-${executionId++}`,
          phase: 'phase2',
          tool,
          target: 'http://target.com',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      });

      phase3Tools.forEach(tool => {
        orchestrator.executionHistory.push({
          executionId: `exec-${executionId++}`,
          phase: 'phase3',
          tool,
          target: 'target',
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      });

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(9);
      expect(stats.succeeded).toBe(9);
      expect(stats.successRate).toBe('100.00%');
      expect(stats.byPhase.phase1).toBe(3);
      expect(stats.byPhase.phase2).toBe(3);
      expect(stats.byPhase.phase3).toBe(3);
    });
  });
});
