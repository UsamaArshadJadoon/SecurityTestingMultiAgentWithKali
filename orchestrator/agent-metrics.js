#!/usr/bin/env node

/**
 * AGENT METRICS - Performance & Quality Tracking
 *
 * Measures agent effectiveness: findings/hour, false positive rate, quality score.
 * Identifies under-performing agents and justifies resource allocation.
 */

class AgentMetrics {
  constructor() {
    this.agentStats = new Map();
  }

  /**
   * Track agent performance
   * @param {string} agentName - Agent identifier
   * @param {object} results - Execution results
   * @returns {object} Performance metrics
   */
  trackPerformance(agentName, results) {
    const metrics = {
      agent: agentName,
      findings_discovered: results.findings || 0,
      findings_per_hour: (results.findings || 0) / (results.duration_hours || 1),
      unique_findings: results.unique || 0,
      false_positives: results.false_positives || 0,
      false_positive_rate: ((results.false_positives || 0) / (results.findings || 1)) * 100,
      average_severity: results.avg_severity || 'Unknown',
      execution_time_hours: results.duration_hours || 0,
      success_rate: results.success ? 100 : 0,
      quality_score: this._calculateQualityScore(results),
      timestamp: new Date().toISOString()
    };

    // Store in history
    if (!this.agentStats.has(agentName)) {
      this.agentStats.set(agentName, []);
    }
    this.agentStats.get(agentName).push(metrics);

    return metrics;
  }

  /**
   * Get agent statistics
   * @param {string} agentName - Agent name
   * @returns {object} Agent stats with trends
   */
  getAgentStats(agentName) {
    const history = this.agentStats.get(agentName) || [];

    if (history.length === 0) {
      return null;
    }

    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;

    return {
      agent: agentName,
      latest: latest,
      trend: previous ? {
        quality_score_change: latest.quality_score - previous.quality_score,
        findings_per_hour_change: latest.findings_per_hour - previous.findings_per_hour,
        fp_rate_change: latest.false_positive_rate - previous.false_positive_rate
      } : null,
      execution_count: history.length,
      average_quality: (history.reduce((sum, h) => sum + h.quality_score, 0) / history.length).toFixed(1)
    };
  }

  /**
   * Rank agents by performance
   * @param {Array<string>} agentNames - Agents to rank
   * @returns {Array} Ranked agents
   */
  rankAgents(agentNames) {
    const ranked = agentNames.map(name => {
      const stats = this.getAgentStats(name);
      return {
        agent: name,
        quality_score: stats?.latest?.quality_score || 0,
        findings_per_hour: stats?.latest?.findings_per_hour || 0,
        rank: 0
      };
    });

    // Sort by quality score (descending)
    ranked.sort((a, b) => b.quality_score - a.quality_score);

    // Assign ranks
    ranked.forEach((item, index) => {
      item.rank = index + 1;
    });

    return ranked;
  }

  /**
   * Identify under-performing agents
   * @param {number} threshold - Quality score threshold (0-100)
   * @returns {Array} Under-performing agents
   */
  getUnderPerformingAgents(threshold = 50) {
    const underPerforming = [];

    this.agentStats.forEach((history, agentName) => {
      const latest = history[history.length - 1];
      if (latest.quality_score < threshold) {
        underPerforming.push({
          agent: agentName,
          quality_score: latest.quality_score,
          issue: this._diagnoseIssue(latest),
          recommendation: this._getRecommendation(latest)
        });
      }
    });

    return underPerforming;
  }

  /**
   * Get all agent metrics
   * @returns {object} All metrics
   */
  getAllMetrics() {
    const allMetrics = {};

    this.agentStats.forEach((history, agentName) => {
      allMetrics[agentName] = {
        latest: history[history.length - 1],
        execution_count: history.length,
        history: history
      };
    });

    return allMetrics;
  }

  /**
   * Internal: Calculate quality score
   * @private
   */
  _calculateQualityScore(results) {
    // Quality = (findings * uniqueness * (1 - fp_rate)) - time_penalty
    const findings = results.findings || 0;
    const uniqueness = (results.unique || 0) / Math.max(findings, 1);
    const fpRate = Math.min((results.false_positives || 0) / Math.max(findings, 1), 1);
    const accuracy = 1 - fpRate;
    const timePenalty = Math.max(0, (results.duration_hours || 0) - 2) * 5;

    const score = (findings * uniqueness * accuracy * 10) - timePenalty;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Internal: Diagnose issue
   * @private
   */
  _diagnoseIssue(metrics) {
    if (metrics.findings_per_hour < 5) {
      return 'Low finding discovery rate';
    }
    if (metrics.false_positive_rate > 20) {
      return 'High false positive rate';
    }
    if (metrics.success_rate < 80) {
      return 'Low success rate';
    }
    return 'Unknown issue';
  }

  /**
   * Internal: Get recommendation
   * @private
   */
  _getRecommendation(metrics) {
    if (metrics.false_positive_rate > 20) {
      return 'Improve finding validation or reduce detection sensitivity';
    }
    if (metrics.findings_per_hour < 5) {
      return 'Optimize agent speed or expand test scope';
    }
    return 'Review agent configuration and execution';
  }
}

function createAgentMetrics() {
  return new AgentMetrics();
}

module.exports = {
  AgentMetrics,
  createAgentMetrics
};
