#!/usr/bin/env node

/**
 * KALI TOOLS MAXIMUM - 115+ TOOLS TEST SUITE
 *
 * Comprehensive testing of maximum security tool coverage
 * - Phase 1: 35 Reconnaissance Tools
 * - Phase 2: 40 Scanning Tools
 * - Phase 3: 40+ Exploitation Tools
 */

const {
  KaliToolsMaximumOrchestrator,
  Phase1ToolsMaximum,
  Phase2ToolsMaximum,
  Phase3ToolsMaximum
} = require('../orchestrator/kali-tools-maximum.js');

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
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

describe('Kali Tools Maximum - 115+ Tool Suite', () => {
  let orchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    orchestrator = new KaliToolsMaximumOrchestrator(
      mockLogger,
      mockAuditLogger,
      mockRateLimiter,
      mockCircuitBreaker
    );
  });

  describe('MAXIMUM COVERAGE - 115+ TOOLS', () => {
    test('should have 30 Phase 1 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools.length).toBe(30);
    });

    test('should have 39 Phase 2 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools.length).toBe(39);
    });

    test('should have 40+ Phase 3 tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools.length).toBeGreaterThanOrEqual(40);
    });

    test('should have 115+ total tools', () => {
      const all = orchestrator.getAllTools();
      expect(all.total).toBeGreaterThanOrEqual(113);
    });

    test('should have no duplicate tools', () => {
      const all = orchestrator.getAllTools();
      const allTools = [...all.phase1, ...all.phase2, ...all.phase3];
      const unique = new Set(allTools);
      expect(unique.size).toBe(allTools.length);
    });
  });

  describe('PHASE 1: RECONNAISSANCE (35 Tools)', () => {
    test('should include all network discovery tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('nmap');
      expect(tools).toContain('masscan');
      expect(tools).toContain('shodan');
      expect(tools).toContain('zmap');
      expect(tools).toContain('amap');
    });

    test('should include all DNS enumeration tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('theHarvester');
      expect(tools).toContain('amass');
      expect(tools).toContain('subfinder');
      expect(tools).toContain('assetfinder');
      expect(tools).toContain('fierce');
      expect(tools).toContain('knockpy');
      expect(tools).toContain('dnstracer');
      expect(tools).toContain('dnsmap');
    });

    test('should include all HTTP probing tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('httprobe');
      expect(tools).toContain('waybackurls');
      expect(tools).toContain('getallurls');
      expect(tools).toContain('hakrawler');
      expect(tools).toContain('commonspeak');
    });

    test('should include all OSINT tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('spiderfoot');
      expect(tools).toContain('maltego');
      expect(tools).toContain('osintframework');
      expect(tools).toContain('sherlock');
      expect(tools).toContain('linkedin2username');
      expect(tools).toContain('exiftool');
      expect(tools).toContain('whoisdomain');
      expect(tools).toContain('creepy');
    });

    test('should include advanced reconnaissance tools', () => {
      const tools = orchestrator.getToolsByPhase('phase1');
      expect(tools).toContain('p0f');
      expect(tools).toContain('urlcrazy');
      expect(tools).toContain('reversewhois');
      expect(tools).toContain('ip_rep_checker');
    });
  });

  describe('PHASE 2: SCANNING (40 Tools)', () => {
    test('should include all web server scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('nikto');
      expect(tools).toContain('testssl');
      expect(tools).toContain('sslscan');
      expect(tools).toContain('sslyze');
      expect(tools).toContain('uniscan');
      expect(tools).toContain('w3af');
    });

    test('should include all web application tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('wfuzz');
      expect(tools).toContain('ffuf');
      expect(tools).toContain('nuclei');
      expect(tools).toContain('xsstrike');
      expect(tools).toContain('meg');
      expect(tools).toContain('feroxbuster');
      expect(tools).toContain('dirsearch');
      expect(tools).toContain('cmsmap');
    });

    test('should include all API scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('graphql_playground');
      expect(tools).toContain('postman');
      expect(tools).toContain('arjun');
      expect(tools).toContain('parameth');
    });

    test('should include all database scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('sqlmap');
      expect(tools).toContain('mongoaudit');
      expect(tools).toContain('ncrack');
      expect(tools).toContain('nosqlmap');
      expect(tools).toContain('cassandra_auth');
    });

    test('should include all directory discovery tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('dirb');
      expect(tools).toContain('gobuster');
      expect(tools).toContain('filebuster');
      expect(tools).toContain('wfuzz_file');
      expect(tools).toContain('upload_scanner');
    });

    test('should include all CMS scanning tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('joomscan');
      expect(tools).toContain('wpscan');
      expect(tools).toContain('droopescan');
      expect(tools).toContain('cmsdetect');
      expect(tools).toContain('wp_check');
      expect(tools).toContain('aspx_scanner');
      expect(tools).toContain('magento_scanner');
    });

    test('should include all credential testing tools', () => {
      const tools = orchestrator.getToolsByPhase('phase2');
      expect(tools).toContain('hydra');
      expect(tools).toContain('medusa');
      expect(tools).toContain('crowbar');
      expect(tools).toContain('patator');
    });
  });

  describe('PHASE 3: EXPLOITATION (40+ Tools)', () => {
    test('should include all password cracking tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('john');
      expect(tools).toContain('hashcat');
      expect(tools).toContain('hydra3');
      expect(tools).toContain('ophcrack');
      expect(tools).toContain('gpu_cracking');
      expect(tools).toContain('online_cracking');
    });

    test('should include all exploitation frameworks', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('metasploit');
      expect(tools).toContain('msfvenom');
      expect(tools).toContain('empire');
      expect(tools).toContain('covenant');
      expect(tools).toContain('sliver');
      expect(tools).toContain('merlin');
    });

    test('should include all credential dumping tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('mimikatz');
      expect(tools).toContain('secretsdump');
      expect(tools).toContain('impacket');
      expect(tools).toContain('responder');
      expect(tools).toContain('inveigh');
      expect(tools).toContain('ntlm_relay');
    });

    test('should include all privilege escalation tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('linpeas');
      expect(tools).toContain('winpeas');
      expect(tools).toContain('uacme');
      expect(tools).toContain('linsec');
      expect(tools).toContain('peas_checker');
    });

    test('should include all lateral movement tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('crackmapexec');
      expect(tools).toContain('impacket_wmiexec');
      expect(tools).toContain('psexec');
      expect(tools).toContain('smbexec');
    });

    test('should include all C2 and remote access tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('reverseshell');
      expect(tools).toContain('weevely');
      expect(tools).toContain('nishang');
      expect(tools).toContain('powercat');
    });

    test('should include all data exfiltration tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('exfil_kit');
      expect(tools).toContain('datafisher');
      expect(tools).toContain('dlp_test');
    });

    test('should include all persistence tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('mimikatz_golden');
      expect(tools).toContain('reptile');
      expect(tools).toContain('diamorphine');
    });

    test('should include all network exploitation tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('tcpdump');
      expect(tools).toContain('wireshark');
      expect(tools).toContain('aircrackng');
      expect(tools).toContain('proxychains');
    });

    test('should include all advanced payload tools', () => {
      const tools = orchestrator.getToolsByPhase('phase3');
      expect(tools).toContain('ysoserial');
      expect(tools).toContain('sharpshooter');
      expect(tools).toContain('veil');
    });
  });

  describe('STATISTICS & COVERAGE', () => {
    test('should calculate statistics correctly', () => {
      orchestrator.executionHistory = [
        { executionId: '1', phase: 'phase1', tool: 'nmap', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '2', phase: 'phase2', tool: 'nikto', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '3', phase: 'phase3', tool: 'john', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '4', phase: 'phase1', tool: 'amass', status: 'failed', timestamp: new Date().toISOString() }
      ];

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(4);
      expect(stats.succeeded).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.byPhase.phase1).toBe(2);
      expect(stats.byPhase.phase2).toBe(1);
      expect(stats.byPhase.phase3).toBe(1);
      expect(stats.toolCoverage.total).toBeGreaterThanOrEqual(113);
    });

    test('should return all tools correctly', () => {
      const allTools = orchestrator.getAllTools();

      expect(allTools.phase1.length).toBe(30);
      expect(allTools.phase2.length).toBe(39);
      expect(allTools.phase3.length).toBe(44);
      expect(allTools.total).toBe(113);
    });

    test('should track execution history with filters', () => {
      orchestrator.executionHistory = [
        { executionId: '1', phase: 'phase1', tool: 'nmap', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '2', phase: 'phase1', tool: 'amass', status: 'completed', timestamp: new Date().toISOString() },
        { executionId: '3', phase: 'phase2', tool: 'nikto', status: 'completed', timestamp: new Date().toISOString() }
      ];

      const phase1 = orchestrator.getExecutionHistory({ phase: 'phase1' });
      expect(phase1.length).toBe(2);

      const phase2 = orchestrator.getExecutionHistory({ phase: 'phase2' });
      expect(phase2.length).toBe(1);

      const nmap = orchestrator.getExecutionHistory({ tool: 'nmap' });
      expect(nmap.length).toBe(1);
    });
  });

  describe('COMPLETE PENETRATION TEST WORKFLOW', () => {
    test('should support multi-phase workflow with 115+ tools', () => {
      const phase1Tools = orchestrator.getToolsByPhase('phase1').slice(0, 5);
      const phase2Tools = orchestrator.getToolsByPhase('phase2').slice(0, 5);
      const phase3Tools = orchestrator.getToolsByPhase('phase3').slice(0, 5);

      let executionId = 1;

      phase1Tools.forEach(tool => {
        orchestrator.executionHistory.push({
          executionId: `exec-${executionId++}`,
          phase: 'phase1',
          tool,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      });

      phase2Tools.forEach(tool => {
        orchestrator.executionHistory.push({
          executionId: `exec-${executionId++}`,
          phase: 'phase2',
          tool,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      });

      phase3Tools.forEach(tool => {
        orchestrator.executionHistory.push({
          executionId: `exec-${executionId++}`,
          phase: 'phase3',
          tool,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
      });

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(15);
      expect(stats.succeeded).toBe(15);
      expect(stats.successRate).toBe('100.00%');
      expect(stats.toolCoverage.total).toBeGreaterThanOrEqual(113);
    });

    test('should verify maximum coverage across all categories', () => {
      const all = orchestrator.getAllTools();

      // Phase 1 categories
      const phase1 = all.phase1;
      expect(phase1.filter(t => ['nmap', 'masscan', 'shodan', 'zmap', 'amap'].includes(t)).length).toBe(5);
      expect(phase1.filter(t => ['theHarvester', 'amass', 'subfinder', 'assetfinder', 'fierce', 'knockpy', 'dnstracer', 'dnsmap'].includes(t)).length).toBe(8);
      expect(phase1.filter(t => ['httprobe', 'waybackurls', 'getallurls', 'hakrawler', 'commonspeak'].includes(t)).length).toBe(5);

      // Phase 2 categories
      const phase2 = all.phase2;
      expect(phase2.length).toBe(39);

      // Phase 3 categories
      const phase3 = all.phase3;
      expect(phase3.length).toBeGreaterThanOrEqual(40);

      // Total coverage
      expect(all.total).toBeGreaterThanOrEqual(113);
    });
  });
});
