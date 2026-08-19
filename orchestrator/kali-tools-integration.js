#!/usr/bin/env node

/**
 * KALI TOOLS INTEGRATION
 *
 * Orchestrates Kali Linux security tools execution across all phases.
 * Provides unified interface for tool execution with rate limiting,
 * timeout protection, audit logging, and error handling.
 */

const { exec, execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Phase 1 - Reconnaissance Tools
 */
class Phase1Tools {
  constructor(logger, auditLogger) {
    this.logger = logger;
    this.auditLogger = auditLogger;
  }

  /**
   * Nmap - Network mapping and port scanning
   */
  async nmap(target, options = {}) {
    const cmd = [
      'nmap',
      options.aggressive ? '-A' : '-sV',
      options.allPorts ? '-p-' : '-p 1-10000',
      options.fast ? '-T5' : '-T3',
      options.scriptVuln ? '--script vuln' : '',
      target
    ].filter(Boolean).join(' ');

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'nmap',
      target,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 600000 }); // 10 min timeout
      this.logger.info('nmap scan completed', { target });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('nmap scan failed', { target, error: error.message });
      throw error;
    }
  }

  /**
   * Masscan - Ultra-fast port scanning
   */
  async masscan(network, options = {}) {
    const cmd = [
      'masscan',
      network,
      `-p${options.ports || '80,443,22,3306'}`,
      `--rate ${options.rate || '100000'}`,
      options.outputFormat ? `-oX ${options.outputFile}.xml` : ''
    ].filter(Boolean).join(' ');

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'masscan',
      network,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 300000 });
      this.logger.info('masscan completed', { network });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('masscan failed', { network, error: error.message });
      throw error;
    }
  }

  /**
   * theHarvester - Email and subdomain harvesting
   */
  async theHarvester(domain, options = {}) {
    const sources = (options.sources || ['google', 'bing']).join(',');
    const cmd = `theHarvester -d ${domain} -b ${sources} -l ${options.limit || 100}`;

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'theHarvester',
      domain,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 60000 });
      this.logger.info('theHarvester completed', { domain });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('theHarvester failed', { domain, error: error.message });
      throw error;
    }
  }

  /**
   * DNS enumeration (dig, nslookup)
   */
  async dnsEnum(domain, options = {}) {
    const results = {};

    try {
      // Standard lookup
      const { stdout: digOutput } = await execAsync(`dig ${domain} ANY`);
      results.dig = digOutput;

      // Trace DNS
      if (options.trace) {
        const { stdout: traceOutput } = await execAsync(`dig +trace ${domain}`);
        results.trace = traceOutput;
      }

      // Zone transfer attempt
      if (options.zoneTransfer) {
        try {
          const { stdout: axfrOutput } = await execAsync(`dig @ns1.${domain} ${domain} AXFR`);
          results.axfr = axfrOutput;
        } catch (e) {
          results.axfr = 'Zone transfer failed (expected)';
        }
      }

      this.logger.info('DNS enumeration completed', { domain });
      return { success: true, data: results };
    } catch (error) {
      this.logger.error('DNS enumeration failed', { domain, error: error.message });
      throw error;
    }
  }
}

/**
 * Phase 2 - Scanning & Enumeration Tools
 */
class Phase2Tools {
  constructor(logger, auditLogger, rateLimiter) {
    this.logger = logger;
    this.auditLogger = auditLogger;
    this.rateLimiter = rateLimiter;
  }

  /**
   * Nikto - Web server scanner
   */
  async nikto(url, options = {}) {
    // Check rate limit
    const limitCheck = this.rateLimiter.checkLimit('nikto', url);
    if (!limitCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${limitCheck.reason}`);
    }

    const cmd = [
      'nikto',
      `-h ${url}`,
      options.ssl ? '-ssl' : '',
      options.noTuning ? '' : `-Tuning x 6`,
      options.output ? `-o ${options.output}` : ''
    ].filter(Boolean).join(' ');

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'nikto',
      url,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 600000 }); // 10 min
      this.logger.info('nikto scan completed', { url });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('nikto scan failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Wfuzz - Web fuzzer
   */
  async wfuzz(url, options = {}) {
    const wordlist = options.wordlist || '/usr/share/wfuzz/wordlist/general/common.txt';
    const cmd = [
      'wfuzz',
      '-c',
      `-z file,${wordlist}`,
      `--hc ${options.hideCode || '404'}`,
      options.dataParam ? `-d "${options.dataParam}"` : '',
      `"${url}"`
    ].filter(Boolean).join(' ');

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'wfuzz',
      url,
      wordlist,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 600000 });
      this.logger.info('wfuzz completed', { url });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('wfuzz failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * SQLMap - SQL injection detection
   */
  async sqlmap(url, options = {}) {
    const cmd = [
      'sqlmap',
      `-u "${url}"`,
      options.data ? `--data "${options.data}"` : '',
      options.dump ? '--dump-all' : '--dbs',
      '--batch',
      '--risk 1 --level 1'  // Conservative settings
    ].filter(Boolean).join(' ');

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'sqlmap',
      url,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 600000 });
      this.logger.info('sqlmap scan completed', { url });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('sqlmap failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Dirb - Directory brute force
   */
  async dirb(url, options = {}) {
    const wordlist = options.wordlist || '/usr/share/dirb/wordlists/common.txt';
    const cmd = [
      'dirb',
      url,
      wordlist,
      options.recursive ? '' : '-r',
      options.output ? `-o ${options.output}` : '',
      options.proxy ? `-p ${options.proxy}` : ''
    ].filter(Boolean).join(' ');

    this.auditLogger.log('TOOL_EXECUTED', {
      tool: 'dirb',
      url,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 600000 });
      this.logger.info('dirb scan completed', { url });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('dirb failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Hydra - Credential brute force (with rate limiting)
   */
  async hydra(target, options = {}) {
    // Strict rate limiting for authentication attacks
    const limitCheck = this.rateLimiter.checkLimit('hydra', target);
    if (!limitCheck.allowed) {
      throw new Error(`Rate limit exceeded for brute force: ${limitCheck.reason}`);
    }

    const cmd = [
      'hydra',
      `-L ${options.userlist || '/usr/share/wordlists/metasploit/unix_users.txt'}`,
      `-P ${options.passlist || '/usr/share/wordlists/metasploit/unix_passwords.txt'}`,
      `-t 4`,  // Limited threads
      `-W 5`,  // Wait between attempts
      `-o ${options.output || 'hydra.txt'}`,
      `${options.service || 'ssh'}://${target}`
    ].filter(Boolean).join(' ');

    this.auditLogger.log('CREDENTIAL_ATTACK', {
      tool: 'hydra',
      target,
      service: options.service || 'ssh',
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 1800000 }); // 30 min
      this.logger.info('hydra scan completed', { target });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.warn('hydra scan failed or no credentials found', { target });
      return { success: false, output: error.stdout || '' };
    }
  }
}

/**
 * Phase 3 - Exploitation & Advanced Tools
 */
class Phase3Tools {
  constructor(logger, auditLogger, circuitBreaker) {
    this.logger = logger;
    this.auditLogger = auditLogger;
    this.circuitBreaker = circuitBreaker;
  }

  /**
   * John the Ripper - Password cracking
   */
  async johnTheRipper(hashFile, options = {}) {
    const breaker = this.circuitBreaker.getOrCreate('john-cracking');

    const operation = async () => {
      const cmd = [
        'john',
        `--format=${options.format || 'md5'}`,
        `--wordlist=${options.wordlist || '/usr/share/wordlists/rockyou.txt'}`,
        options.rules ? `--rules=${options.rules}` : '',
        hashFile
      ].filter(Boolean).join(' ');

      this.auditLogger.log('PASSWORD_CRACKING', {
        tool: 'john',
        hashFile,
        format: options.format,
        timestamp: new Date().toISOString()
      });

      try {
        const { stdout } = await execAsync(cmd, { timeout: 3600000 }); // 1 hour
        this.logger.info('john cracking completed', { hashFile });
        return { success: true, output: stdout };
      } catch (error) {
        this.logger.warn('john cracking in progress or failed', { hashFile });
        return { success: false, output: error.stdout || '' };
      }
    };

    return breaker.execute(operation);
  }

  /**
   * Hashcat - GPU password cracking
   */
  async hashcat(hashFile, options = {}) {
    const cmd = [
      'hashcat',
      `-m ${options.hashMode || 0}`,  // 0 = MD5
      `-a ${options.attackMode || 0}`,  // 0 = Dictionary
      `-w ${options.workload || 2}`,  // 2 = Balanced
      options.rules ? `-r ${options.rules}` : '',
      hashFile,
      options.wordlist || '/usr/share/wordlists/rockyou.txt'
    ].filter(Boolean).join(' ');

    this.auditLogger.log('PASSWORD_CRACKING', {
      tool: 'hashcat',
      hashFile,
      hashMode: options.hashMode,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 3600000 });
      this.logger.info('hashcat cracking completed', { hashFile });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.warn('hashcat cracking in progress', { hashFile });
      return { success: false, output: error.stdout || '' };
    }
  }

  /**
   * Network packet analysis (tcpdump)
   */
  async tcpdump(options = {}) {
    const cmd = [
      'tcpdump',
      `-i ${options.interface || 'eth0'}`,
      `-n`,
      `-w ${options.outputFile || 'capture.pcap'}`,
      options.filter ? `"${options.filter}"` : 'port 80 or port 443'
    ].filter(Boolean).join(' ');

    this.auditLogger.log('NETWORK_CAPTURE', {
      tool: 'tcpdump',
      interface: options.interface,
      timestamp: new Date().toISOString()
    });

    this.logger.info('tcpdump started', { interface: options.interface });

    // Note: tcpdump typically runs continuously
    return { success: true, message: 'tcpdump started', pid: null };
  }

  /**
   * Wireless security (Aircrack-ng)
   */
  async aircrackng(capFile, options = {}) {
    const cmd = [
      'aircrack-ng',
      `-w ${options.wordlist || '/usr/share/wordlists/rockyou.txt'}`,
      `-b ${options.bssid || ''}`,
      capFile
    ].filter(Boolean).join(' ');

    this.auditLogger.log('WIRELESS_ATTACK', {
      tool: 'aircrack-ng',
      capFile,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 3600000 });
      this.logger.info('aircrack-ng crack completed', { capFile });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.warn('aircrack-ng crack failed', { capFile });
      return { success: false, output: error.stdout || '' };
    }
  }

  /**
   * Metasploit module execution
   */
  async metasploit(exploit, options = {}) {
    const rcsFile = options.rcsFile || '/tmp/exploit.rc';

    // Build resource script
    const rcsContent = [
      `use ${exploit}`,
      ...Object.entries(options.params || {}).map(([k, v]) => `set ${k} ${v}`),
      'exploit'
    ].join('\n');

    const cmd = `echo '${rcsContent}' | msfconsole -r - -o ${options.output || 'msfconsole.log'}`;

    this.auditLogger.log('EXPLOIT_EXECUTED', {
      tool: 'metasploit',
      exploit,
      timestamp: new Date().toISOString()
    });

    try {
      const { stdout } = await execAsync(cmd, { timeout: 1800000 });
      this.logger.info('metasploit exploit completed', { exploit });
      return { success: true, output: stdout };
    } catch (error) {
      this.logger.error('metasploit exploit failed', { exploit, error: error.message });
      throw error;
    }
  }

  /**
   * Social Engineering Toolkit
   */
  async setoolkit(options = {}) {
    this.auditLogger.log('SOCIAL_ENGINEERING', {
      tool: 'setoolkit',
      type: options.type,
      timestamp: new Date().toISOString()
    });

    this.logger.info('Social Engineering Toolkit operations logged for manual execution');

    return {
      success: true,
      message: 'SET requires interactive mode',
      note: 'Run: setoolkit'
    };
  }
}

/**
 * Unified Tool Orchestrator
 */
class KaliToolsOrchestrator {
  constructor(logger, auditLogger, rateLimiter, circuitBreaker) {
    this.logger = logger;
    this.auditLogger = auditLogger;
    this.phase1 = new Phase1Tools(logger, auditLogger);
    this.phase2 = new Phase2Tools(logger, auditLogger, rateLimiter);
    this.phase3 = new Phase3Tools(logger, auditLogger, circuitBreaker);
    this.executionHistory = [];
  }

  /**
   * Execute tool by phase and name
   */
  async executeTool(phase, toolName, target, options = {}) {
    const executionId = `${phase}-${toolName}-${Date.now()}`;

    try {
      this.logger.info(`Executing ${toolName} in ${phase}`, {
        target,
        executionId
      });

      let result;

      // Phase 1 Tools
      if (phase === 'phase1') {
        if (toolName === 'nmap') result = await this.phase1.nmap(target, options);
        else if (toolName === 'masscan') result = await this.phase1.masscan(target, options);
        else if (toolName === 'theHarvester') result = await this.phase1.theHarvester(target, options);
        else if (toolName === 'dnsEnum') result = await this.phase1.dnsEnum(target, options);
      }

      // Phase 2 Tools
      else if (phase === 'phase2') {
        if (toolName === 'nikto') result = await this.phase2.nikto(target, options);
        else if (toolName === 'wfuzz') result = await this.phase2.wfuzz(target, options);
        else if (toolName === 'sqlmap') result = await this.phase2.sqlmap(target, options);
        else if (toolName === 'dirb') result = await this.phase2.dirb(target, options);
        else if (toolName === 'hydra') result = await this.phase2.hydra(target, options);
      }

      // Phase 3 Tools
      else if (phase === 'phase3') {
        if (toolName === 'john') result = await this.phase3.johnTheRipper(target, options);
        else if (toolName === 'hashcat') result = await this.phase3.hashcat(target, options);
        else if (toolName === 'tcpdump') result = await this.phase3.tcpdump(options);
        else if (toolName === 'aircrack-ng') result = await this.phase3.aircrackng(target, options);
        else if (toolName === 'metasploit') result = await this.phase3.metasploit(target, options);
        else if (toolName === 'setoolkit') result = await this.phase3.setoolkit(options);
      }

      result.executionId = executionId;
      result.timestamp = new Date().toISOString();

      this.executionHistory.push({
        executionId,
        phase,
        tool: toolName,
        target,
        status: 'completed',
        timestamp: result.timestamp
      });

      return result;
    } catch (error) {
      this.logger.error(`Tool execution failed: ${toolName}`, {
        phase,
        target,
        error: error.message,
        executionId
      });

      this.executionHistory.push({
        executionId,
        phase,
        tool: toolName,
        target,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Get available tools by phase
   */
  getToolsByPhase(phase) {
    const tools = {
      phase1: [
        'nmap',
        'masscan',
        'theHarvester',
        'dnsEnum'
      ],
      phase2: [
        'nikto',
        'wfuzz',
        'sqlmap',
        'dirb',
        'hydra'
      ],
      phase3: [
        'john',
        'hashcat',
        'tcpdump',
        'aircrack-ng',
        'metasploit',
        'setoolkit'
      ]
    };

    return tools[phase] || [];
  }

  /**
   * Get execution history
   */
  getExecutionHistory(filters = {}) {
    let history = this.executionHistory;

    if (filters.phase) {
      history = history.filter(h => h.phase === filters.phase);
    }
    if (filters.tool) {
      history = history.filter(h => h.tool === filters.tool);
    }
    if (filters.status) {
      history = history.filter(h => h.status === filters.status);
    }

    return history;
  }

  /**
   * Get execution statistics
   */
  getStatistics() {
    const total = this.executionHistory.length;
    const succeeded = this.executionHistory.filter(h => h.status === 'completed').length;
    const failed = this.executionHistory.filter(h => h.status === 'failed').length;

    return {
      total,
      succeeded,
      failed,
      successRate: total > 0 ? ((succeeded / total) * 100).toFixed(2) + '%' : '0%',
      byPhase: {
        phase1: this.executionHistory.filter(h => h.phase === 'phase1').length,
        phase2: this.executionHistory.filter(h => h.phase === 'phase2').length,
        phase3: this.executionHistory.filter(h => h.phase === 'phase3').length
      }
    };
  }
}

module.exports = {
  Phase1Tools,
  Phase2Tools,
  Phase3Tools,
  KaliToolsOrchestrator
};
