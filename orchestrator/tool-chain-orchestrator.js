#!/usr/bin/env node

/**
 * TOOL CHAINING & ORCHESTRATION ENGINE
 *
 * Auto-runs sequential tools, aggregates results, and optimizes test coverage
 * Supports:
 * - Sequential tool chains (output passes to next tool)
 * - Parallel execution with result aggregation
 * - Conditional chains (run tool B only if tool A succeeds)
 * - Result filtering and transformation
 * - Failure recovery and fallback chains
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

class ToolChainOrchestrator {
  constructor(logger, auditLogger) {
    this.logger = logger;
    this.auditLogger = auditLogger;
    this.chainDefinitions = new Map();
    this.executionResults = [];
    this.chainHistory = [];
    this.vulnerabilityCache = new Map();
  }

  /**
   * Define a tool chain workflow
   * @param {string} chainName - Unique chain identifier
   * @param {Array} tools - Array of tools to execute in sequence
   * @param {Object} config - Chain configuration
   */
  defineChain(chainName, tools, config = {}) {
    this.chainDefinitions.set(chainName, {
      name: chainName,
      tools,
      config: {
        strategy: config.strategy || 'sequential', // sequential, parallel, conditional
        passOutputToNext: config.passOutputToNext !== false,
        stopOnFailure: config.stopOnFailure !== false,
        aggregateResults: config.aggregateResults !== false,
        timeout: config.timeout || 600000,
        retryFailed: config.retryFailed || false,
        ...config
      }
    });
  }

  /**
   * Execute a defined tool chain
   * @param {string} chainName - Name of chain to execute
   * @param {Object} context - Input context (target, options, etc.)
   * @returns {Object} Aggregated results from all tools
   */
  async executeChain(chainName, context = {}) {
    const chain = this.chainDefinitions.get(chainName);
    if (!chain) throw new Error(`Chain '${chainName}' not defined`);

    const executionId = `chain-${chainName}-${Date.now()}`;
    const chainResults = {
      executionId,
      chainName,
      startTime: new Date(),
      tools: [],
      aggregated: {},
      errors: [],
      summary: {}
    };

    this.logger.info(`[CHAIN] Starting: ${chainName}`);
    this.auditLogger.log('CHAIN_STARTED', { chainName, executionId, context });

    try {
      if (chain.config.strategy === 'sequential') {
        await this._executeSequential(chain, context, chainResults);
      } else if (chain.config.strategy === 'parallel') {
        await this._executeParallel(chain, context, chainResults);
      } else if (chain.config.strategy === 'conditional') {
        await this._executeConditional(chain, context, chainResults);
      }

      chainResults.endTime = new Date();
      chainResults.duration = chainResults.endTime - chainResults.startTime;
      chainResults.summary = this._summarizeResults(chainResults);

      this.chainHistory.push(chainResults);
      this.auditLogger.log('CHAIN_COMPLETED', {
        chainName,
        executionId,
        tools: chainResults.tools.length,
        duration: chainResults.duration
      });

      return chainResults;
    } catch (error) {
      chainResults.endTime = new Date();
      chainResults.error = error.message;
      this.chainHistory.push(chainResults);
      this.auditLogger.log('CHAIN_FAILED', { chainName, executionId, error: error.message });
      throw error;
    }
  }

  /**
   * Execute tools sequentially, passing output to next tool
   */
  async _executeSequential(chain, context, chainResults) {
    let previousOutput = context;

    for (const toolDef of chain.tools) {
      const toolName = typeof toolDef === 'string' ? toolDef : toolDef.name;
      const toolConfig = typeof toolDef === 'string' ? {} : toolDef.config || {};

      try {
        this.logger.info(`  [TOOL] ${toolName}`);

        // Prepare input: use previous output or context
        const toolInput = chain.config.passOutputToNext && previousOutput
          ? this._prepareInput(previousOutput, toolConfig.inputTransform)
          : context;

        const result = await this._executeTool(toolName, toolInput, toolConfig);

        chainResults.tools.push({
          name: toolName,
          status: 'success',
          timestamp: new Date(),
          outputSize: this._getSize(result),
          result
        });

        previousOutput = result;

        // Aggregate results
        if (chain.config.aggregateResults) {
          this._aggregateResult(chainResults.aggregated, toolName, result);
        }

      } catch (error) {
        chainResults.tools.push({
          name: toolName,
          status: 'failed',
          timestamp: new Date(),
          error: error.message
        });

        chainResults.errors.push({ tool: toolName, error: error.message });

        if (chain.config.stopOnFailure) {
          this.logger.warn(`  [CHAIN] Stopping: ${toolName} failed`);
          break;
        }

        if (chain.config.retryFailed) {
          this.logger.info(`  [RETRY] Retrying ${toolName}`);
          // Retry once
          try {
            const result = await this._executeTool(toolName, context, toolConfig);
            chainResults.tools[chainResults.tools.length - 1].status = 'success';
            chainResults.tools[chainResults.tools.length - 1].result = result;
            previousOutput = result;
          } catch (retryError) {
            this.logger.error(`  [RETRY FAILED] ${toolName}: ${retryError.message}`);
          }
        }
      }
    }
  }

  /**
   * Execute tools in parallel and aggregate results
   */
  async _executeParallel(chain, context, chainResults) {
    const promises = chain.tools.map(toolDef => {
      const toolName = typeof toolDef === 'string' ? toolDef : toolDef.name;
      const toolConfig = typeof toolDef === 'string' ? {} : toolDef.config || {};

      return this._executeTool(toolName, context, toolConfig)
        .then(result => ({
          name: toolName,
          status: 'success',
          result,
          timestamp: new Date()
        }))
        .catch(error => ({
          name: toolName,
          status: 'failed',
          error: error.message,
          timestamp: new Date()
        }));
    });

    const results = await Promise.allSettled(promises);

    results.forEach(promiseResult => {
      if (promiseResult.status === 'fulfilled') {
        const toolResult = promiseResult.value;
        chainResults.tools.push({
          name: toolResult.name,
          status: toolResult.status,
          timestamp: toolResult.timestamp,
          ...(toolResult.result && { outputSize: this._getSize(toolResult.result) }),
          ...(toolResult.error && { error: toolResult.error })
        });

        if (toolResult.status === 'success' && chain.config.aggregateResults) {
          this._aggregateResult(chainResults.aggregated, toolResult.name, toolResult.result);
        } else if (toolResult.status === 'failed') {
          chainResults.errors.push({ tool: toolResult.name, error: toolResult.error });
        }
      }
    });
  }

  /**
   * Execute tools conditionally based on previous results
   */
  async _executeConditional(chain, context, chainResults) {
    let previousOutput = context;

    for (const toolDef of chain.tools) {
      const toolName = typeof toolDef === 'string' ? toolDef : toolDef.name;
      const toolConfig = typeof toolDef === 'string' ? {} : toolDef.config || {};
      const condition = toolConfig.condition;

      // Check if we should execute this tool
      // Merge context with previous output for condition evaluation
      const conditionInput = {
        ...context,
        ...previousOutput
      };

      if (condition && !condition(conditionInput)) {
        this.logger.info(`  [SKIP] ${toolName} (condition not met)`);
        chainResults.tools.push({
          name: toolName,
          status: 'skipped',
          reason: 'condition not met',
          timestamp: new Date()
        });
        continue;
      }

      try {
        this.logger.info(`  [TOOL] ${toolName}`);
        const toolInput = chain.config.passOutputToNext && previousOutput
          ? this._prepareInput(previousOutput, toolConfig.inputTransform)
          : context;

        const result = await this._executeTool(toolName, toolInput, toolConfig);

        chainResults.tools.push({
          name: toolName,
          status: 'success',
          timestamp: new Date(),
          outputSize: this._getSize(result),
          result
        });

        previousOutput = result;

        if (chain.config.aggregateResults) {
          this._aggregateResult(chainResults.aggregated, toolName, result);
        }

      } catch (error) {
        chainResults.tools.push({
          name: toolName,
          status: 'failed',
          timestamp: new Date(),
          error: error.message
        });

        chainResults.errors.push({ tool: toolName, error: error.message });

        if (chain.config.stopOnFailure) break;
      }
    }
  }

  /**
   * Execute a single tool with validated input
   */
  async _executeTool(toolName, input, config = {}) {
    try {
      // Tool execution logic - simplified for chain orchestration
      // In practice, this would call the actual tool implementation
      const timeout = config.timeout || 300000;

      // Simulate tool execution with timeout
      return await Promise.race([
        this._runToolSimulation(toolName, input, config),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool ${toolName} timeout`)), timeout)
        )
      ]);
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Simulate tool execution (replace with actual tool calls)
   */
  async _runToolSimulation(toolName, input, config) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          tool: toolName,
          success: true,
          data: {
            findings: [],
            metadata: {
              timestamp: new Date(),
              toolVersion: '1.0',
              ...config
            }
          }
        });
      }, 100);
    });
  }

  /**
   * Aggregate results from multiple tools
   */
  _aggregateResult(aggregated, toolName, result) {
    if (!aggregated[toolName]) {
      aggregated[toolName] = [];
    }
    aggregated[toolName].push({
      timestamp: new Date(),
      data: result
    });
  }

  /**
   * Prepare input for next tool in chain
   */
  _prepareInput(output, transform) {
    if (transform && typeof transform === 'function') {
      return transform(output);
    }
    return output;
  }

  /**
   * Get size of data structure for metrics
   */
  _getSize(data) {
    if (typeof data === 'string') return data.length;
    if (typeof data === 'object') return JSON.stringify(data).length;
    return 0;
  }

  /**
   * Summarize chain execution results
   */
  _summarizeResults(chainResults) {
    const toolCount = chainResults.tools.length;
    const successful = chainResults.tools.filter(t => t.status === 'success').length;
    const failed = chainResults.tools.filter(t => t.status === 'failed').length;
    const skipped = chainResults.tools.filter(t => t.status === 'skipped').length;

    return {
      totalTools: toolCount,
      successful,
      failed,
      skipped,
      successRate: toolCount > 0 ? `${(successful / toolCount * 100).toFixed(2)}%` : 'N/A',
      totalErrors: chainResults.errors.length,
      duration: chainResults.duration,
      aggregatedFindings: Object.keys(chainResults.aggregated).length
    };
  }

  /**
   * Get execution history
   */
  getChainHistory(filter = {}) {
    return this.chainHistory.filter(chain => {
      if (filter.chainName && chain.chainName !== filter.chainName) return false;
      if (filter.status && chain.error && filter.status !== 'failed') return false;
      if (filter.status && !chain.error && filter.status !== 'success') return false;
      return true;
    });
  }

  /**
   * Get statistics across all chains
   */
  getStatistics() {
    return {
      totalChainsExecuted: this.chainHistory.length,
      chainDefinitions: this.chainDefinitions.size,
      averageDuration: this.chainHistory.length > 0
        ? this.chainHistory.reduce((sum, c) => sum + (c.duration || 0), 0) / this.chainHistory.length
        : 0,
      totalToolsExecuted: this.chainHistory.reduce((sum, c) => sum + c.tools.length, 0),
      successRate: this._calculateSuccessRate(),
      mostUsedChain: this._getMostUsedChain(),
      recentChains: this.chainHistory.slice(-10)
    };
  }

  _calculateSuccessRate() {
    const successful = this.chainHistory.filter(c => !c.error).length;
    return this.chainHistory.length > 0 ? `${(successful / this.chainHistory.length * 100).toFixed(2)}%` : 'N/A';
  }

  _getMostUsedChain() {
    const chainCounts = {};
    this.chainHistory.forEach(c => {
      chainCounts[c.chainName] = (chainCounts[c.chainName] || 0) + 1;
    });
    return Object.entries(chainCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }
}

/**
 * PREDEFINED TOOL CHAINS FOR COMMON WORKFLOWS
 */
class PredefinedChains {
  static createReconnaissanceChain(orchestrator) {
    orchestrator.defineChain('reconnaissance', [
      { name: 'nmap', config: { timeout: 300000 } },
      { name: 'theHarvester', config: { timeout: 120000 } },
      { name: 'amass', config: { timeout: 300000 } },
      { name: 'whois', config: { timeout: 30000 } },
      { name: 'shodan', config: { timeout: 60000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      stopOnFailure: false,
      aggregateResults: true
    });
  }

  static createWebScanningChain(orchestrator) {
    orchestrator.defineChain('web-scanning', [
      { name: 'nikto', config: { timeout: 300000 } },
      { name: 'wfuzz', config: { timeout: 600000 } },
      { name: 'nuclei', config: { timeout: 600000 } },
      { name: 'burpsuite', config: { timeout: 900000 } }
    ], {
      strategy: 'parallel',
      stopOnFailure: false,
      aggregateResults: true
    });
  }

  static createVulnerabilityAssessmentChain(orchestrator) {
    orchestrator.defineChain('vulnerability-assessment', [
      { name: 'nmap', config: { timeout: 300000 } },
      { name: 'nikto', config: { timeout: 300000 } },
      { name: 'wpscan', config: { timeout: 300000, condition: (out) => out?.cms === 'wordpress' } },
      { name: 'sqlmap', config: { timeout: 600000 } },
      { name: 'xsstrike', config: { timeout: 300000 } }
    ], {
      strategy: 'conditional',
      passOutputToNext: true,
      aggregateResults: true
    });
  }

  static createExploitationChain(orchestrator) {
    orchestrator.defineChain('exploitation', [
      { name: 'metasploit', config: { timeout: 1200000 } },
      { name: 'hashcat', config: { timeout: 3600000 } },
      { name: 'john', config: { timeout: 3600000 } }
    ], {
      strategy: 'sequential',
      stopOnFailure: false,
      aggregateResults: true
    });
  }

  static createFullPenetrationTestChain(orchestrator) {
    orchestrator.defineChain('full-pentest', [
      { name: 'nmap', config: { timeout: 300000 } },
      { name: 'theHarvester', config: { timeout: 120000 } },
      { name: 'nikto', config: { timeout: 300000 } },
      { name: 'wfuzz', config: { timeout: 600000 } },
      { name: 'nuclei', config: { timeout: 600000 } },
      { name: 'sqlmap', config: { timeout: 600000 } },
      { name: 'metasploit', config: { timeout: 1200000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      stopOnFailure: false,
      aggregateResults: true
    });
  }
}

module.exports = {
  ToolChainOrchestrator,
  PredefinedChains
};
