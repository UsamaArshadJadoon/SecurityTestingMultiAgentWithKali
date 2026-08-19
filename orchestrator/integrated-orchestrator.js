#!/usr/bin/env node

/**
 * INTEGRATED PENETRATION TESTING ORCHESTRATOR
 *
 * Combines:
 * - 200+ Kali tools (KaliToolsUltraMaximumOrchestrator)
 * - Tool chaining & workflow automation (ToolChainOrchestrator)
 * - Vulnerability exploitation (ExploitModule)
 *
 * Provides unified interface for comprehensive security testing
 */

const { KaliToolsUltraMaximumOrchestrator } = require('./kali-tools-ultra-maximum');
const { ToolChainOrchestrator, PredefinedChains } = require('./tool-chain-orchestrator');
const { ExploitModule } = require('./exploit-modules');

class IntegratedPenetrationTestingOrchestrator {
  constructor(logger, auditLogger, rateLimiter, circuitBreaker) {
    this.logger = logger;
    this.auditLogger = auditLogger;

    // Initialize sub-orchestrators
    this.kaliTools = new KaliToolsUltraMaximumOrchestrator(logger, auditLogger, rateLimiter, circuitBreaker);
    this.toolChain = new ToolChainOrchestrator(logger, auditLogger);
    this.exploitModule = new ExploitModule(logger, auditLogger);

    // Initialize predefined chains
    PredefinedChains.createReconnaissanceChain(this.toolChain);
    PredefinedChains.createWebScanningChain(this.toolChain);
    PredefinedChains.createVulnerabilityAssessmentChain(this.toolChain);
    PredefinedChains.createExploitationChain(this.toolChain);
    PredefinedChains.createFullPenetrationTestChain(this.toolChain);

    this.engagementResults = [];
  }

  /**
   * AUTOMATED SECURITY ASSESSMENT WORKFLOW
   *
   * Phase 1: Reconnaissance (Passive Intelligence)
   * Phase 2: Vulnerability Scanning (Active Detection)
   * Phase 3: Exploit Development (Verification)
   * Phase 4: Analysis & Reporting (Result Aggregation)
   */
  async runComprehensiveAssessment(target, options = {}) {
    const engagementId = `engagement-${Date.now()}`;

    this.logger.info(`[ENGAGEMENT] Starting comprehensive assessment: ${target}`);
    this.auditLogger.log('ASSESSMENT_STARTED', { engagementId, target });

    const engagement = {
      engagementId,
      target,
      startTime: new Date(),
      phases: {},
      findings: [],
      vulnerabilities: [],
      summary: {}
    };

    try {
      // PHASE 1: RECONNAISSANCE
      engagement.phases.reconnaissance = await this._phase1_reconnaissance(target, options);

      // PHASE 2: VULNERABILITY SCANNING
      engagement.phases.scanning = await this._phase2_scanning(target, options);

      // PHASE 3: EXPLOITATION
      engagement.phases.exploitation = await this._phase3_exploitation(target, options);

      // PHASE 4: ANALYSIS
      engagement.phases.analysis = this._phase4_analysis(engagement);

      engagement.endTime = new Date();
      engagement.duration = engagement.endTime - engagement.startTime;
      engagement.summary = this._generateSummary(engagement);

      this.engagementResults.push(engagement);
      this.auditLogger.log('ASSESSMENT_COMPLETED', { engagementId, duration: engagement.duration });

      return engagement;
    } catch (error) {
      engagement.error = error.message;
      engagement.endTime = new Date();
      this.engagementResults.push(engagement);
      this.auditLogger.log('ASSESSMENT_FAILED', { engagementId, error: error.message });
      throw error;
    }
  }

  /**
   * PHASE 1: RECONNAISSANCE - Passive Intelligence Gathering
   */
  async _phase1_reconnaissance(target, options = {}) {
    this.logger.info('[PHASE 1] Reconnaissance - Starting intelligence gathering');

    const result = {
      chain: 'reconnaissance',
      startTime: new Date(),
      tools: [],
      data: {}
    };

    try {
      // Execute reconnaissance chain
      const chainResult = await this.toolChain.executeChain('reconnaissance', {
        target,
        ...options
      });

      result.chainExecution = chainResult;
      result.tools = chainResult.tools;
      result.data = chainResult.aggregated;

      // Extract intelligence
      const intelligence = {
        domains: [],
        subdomains: [],
        emails: [],
        ips: [],
        services: [],
        technologies: []
      };

      result.intelligence = intelligence;
      result.endTime = new Date();

      this.logger.info(`[PHASE 1] Completed: ${result.tools.length} tools executed`);
      return result;
    } catch (error) {
      this.logger.error(`[PHASE 1] Failed: ${error.message}`);
      result.error = error.message;
      result.endTime = new Date();
      return result;
    }
  }

  /**
   * PHASE 2: SCANNING - Active Vulnerability Detection
   */
  async _phase2_scanning(target, options = {}) {
    this.logger.info('[PHASE 2] Vulnerability Scanning - Active detection');

    const result = {
      chain: 'web-scanning',
      startTime: new Date(),
      vulnerabilities: [],
      tools: [],
      data: {}
    };

    try {
      // Execute web scanning chain
      const chainResult = await this.toolChain.executeChain('web-scanning', {
        target,
        ...options
      });

      result.chainExecution = chainResult;
      result.tools = chainResult.tools;

      // Detect vulnerabilities
      const vulnerabilities = await this.exploitModule.detectVulnerabilities(target, options);
      result.vulnerabilities = vulnerabilities;

      result.summary = {
        totalVulnerabilities: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
        medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length
      };

      result.endTime = new Date();

      this.logger.info(`[PHASE 2] Completed: ${vulnerabilities.length} vulnerabilities detected`);
      return result;
    } catch (error) {
      this.logger.error(`[PHASE 2] Failed: ${error.message}`);
      result.error = error.message;
      result.endTime = new Date();
      return result;
    }
  }

  /**
   * PHASE 3: EXPLOITATION - Vulnerability Verification
   */
  async _phase3_exploitation(target, options = {}) {
    this.logger.info('[PHASE 3] Exploitation - Vulnerability verification');

    const result = {
      startTime: new Date(),
      exploits: [],
      confirmed: [],
      possible: []
    };

    try {
      // Generate and verify exploits
      const exploitResults = await this.exploitModule.generateExploits(target, options);

      result.exploits = exploitResults.details || [];
      result.confirmed = result.exploits.filter(e => e.status === 'confirmed');
      result.possible = result.exploits.filter(e => e.status === 'possible');

      result.summary = {
        exploitsGenerated: result.exploits.length,
        confirmed: result.confirmed.length,
        possible: result.possible.length,
        confirmationRate: result.exploits.length > 0
          ? `${(result.confirmed.length / result.exploits.length * 100).toFixed(2)}%`
          : 'N/A'
      };

      result.endTime = new Date();

      this.logger.info(`[PHASE 3] Completed: ${result.confirmed.length} confirmed, ${result.possible.length} possible`);
      return result;
    } catch (error) {
      this.logger.error(`[PHASE 3] Failed: ${error.message}`);
      result.error = error.message;
      result.endTime = new Date();
      return result;
    }
  }

  /**
   * PHASE 4: ANALYSIS - Result Aggregation & Insights
   */
  _phase4_analysis(engagement) {
    this.logger.info('[PHASE 4] Analysis - Aggregating findings');

    const analysis = {
      startTime: new Date(),
      findings: [],
      riskAssessment: {}
    };

    // Aggregate all findings
    const allFindings = [];

    if (engagement.phases.reconnaissance?.intelligence) {
      allFindings.push({
        category: 'intelligence',
        data: engagement.phases.reconnaissance.intelligence
      });
    }

    if (engagement.phases.scanning?.vulnerabilities) {
      allFindings.push({
        category: 'vulnerabilities',
        data: engagement.phases.scanning.vulnerabilities
      });
    }

    if (engagement.phases.exploitation?.confirmed) {
      allFindings.push({
        category: 'exploitable',
        data: engagement.phases.exploitation.confirmed
      });
    }

    analysis.findings = allFindings;

    // Risk Assessment
    analysis.riskAssessment = {
      criticalVulnerabilities: engagement.phases.scanning?.summary?.critical || 0,
      highVulnerabilities: engagement.phases.scanning?.summary?.high || 0,
      mediumVulnerabilities: engagement.phases.scanning?.summary?.medium || 0,
      confirmedExploits: engagement.phases.exploitation?.summary?.confirmed || 0,
      overallRisk: this._calculateRisk(
        engagement.phases.scanning?.summary,
        engagement.phases.exploitation?.summary
      )
    };

    analysis.endTime = new Date();

    this.logger.info('[PHASE 4] Completed: Analysis finished');
    return analysis;
  }

  /**
   * RAPID VULNERABILITY ASSESSMENT
   * Focuses on high-value vulnerabilities only
   */
  async runRapidAssessment(target, options = {}) {
    this.logger.info(`[RAPID ASSESSMENT] Starting: ${target}`);

    const result = {
      target,
      startTime: new Date(),
      findings: []
    };

    try {
      // Fast reconnaissance
      const recon = await this.toolChain.executeChain('reconnaissance', { target });

      // Parallel vulnerability scanning
      const scanning = await this.toolChain.executeChain('web-scanning', { target });

      // Quick exploitation
      const vulnerabilities = await this.exploitModule.detectVulnerabilities(target, options);
      result.findings = vulnerabilities.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH');

      result.endTime = new Date();
      result.duration = result.endTime - result.startTime;

      this.logger.info(`[RAPID ASSESSMENT] Completed: ${result.findings.length} high-severity findings`);
      return result;
    } catch (error) {
      this.logger.error(`[RAPID ASSESSMENT] Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * CUSTOM WORKFLOW EXECUTION
   */
  async runCustomWorkflow(workflowName, target, options = {}) {
    this.logger.info(`[CUSTOM WORKFLOW] Executing: ${workflowName} on ${target}`);

    try {
      const result = await this.toolChain.executeChain(workflowName, {
        target,
        ...options
      });

      return result;
    } catch (error) {
      this.logger.error(`[CUSTOM WORKFLOW] Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * TOOL & CHAIN STATISTICS
   */
  getStatistics() {
    return {
      kaliTools: this.kaliTools.getStatistics(),
      toolChains: this.toolChain.getStatistics(),
      exploitModules: this.exploitModule.getStatistics(),
      assessments: {
        total: this.engagementResults.length,
        completed: this.engagementResults.filter(e => !e.error).length,
        failed: this.engagementResults.filter(e => e.error).length,
        avgDuration: this.engagementResults.length > 0
          ? this.engagementResults.reduce((sum, e) => sum + (e.duration || 0), 0) / this.engagementResults.length
          : 0
      }
    };
  }

  /**
   * ASSESSMENT HISTORY
   */
  getAssessmentHistory(filter = {}) {
    return this.engagementResults.filter(engagement => {
      if (filter.target && engagement.target !== filter.target) return false;
      if (filter.status && engagement.error && filter.status !== 'failed') return false;
      if (filter.status && !engagement.error && filter.status !== 'completed') return false;
      return true;
    });
  }

  /**
   * RISK CALCULATION
   */
  _calculateRisk(scanSummary, exploitSummary) {
    let risk = 0;

    if (!scanSummary) return 'UNKNOWN';

    // Critical vulnerabilities = 40% weight
    risk += (scanSummary.critical || 0) * 40;

    // High vulnerabilities = 30% weight
    risk += (scanSummary.high || 0) * 30;

    // Medium vulnerabilities = 20% weight
    risk += (scanSummary.medium || 0) * 20;

    // Confirmed exploits = additional 50% weight
    if (exploitSummary?.confirmed) {
      risk += exploitSummary.confirmed * 50;
    }

    if (risk >= 300) return 'CRITICAL';
    if (risk >= 100) return 'HIGH';
    if (risk >= 50) return 'MEDIUM';
    if (risk > 0) return 'LOW';
    return 'NONE';
  }

  /**
   * SUMMARY GENERATION
   */
  _generateSummary(engagement) {
    return {
      target: engagement.target,
      duration: engagement.duration,
      status: engagement.error ? 'failed' : 'completed',
      tools_executed: (engagement.phases.reconnaissance?.tools?.length || 0)
        + (engagement.phases.scanning?.tools?.length || 0),
      vulnerabilities_detected: engagement.phases.scanning?.vulnerabilities?.length || 0,
      exploits_verified: engagement.phases.exploitation?.confirmed?.length || 0,
      overall_risk: engagement.phases.analysis?.riskAssessment?.overallRisk || 'UNKNOWN'
    };
  }
}

module.exports = {
  IntegratedPenetrationTestingOrchestrator
};
