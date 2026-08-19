#!/usr/bin/env node

/**
 * RATE LIMITING
 *
 * Prevents finding ingestion DoS attacks by enforcing rate limits.
 * Tracks findings per agent, per engagement, and by size.
 */

class RateLimiter {
  constructor(options = {}) {
    // Default limits
    this.limits = {
      per_agent_per_hour: options.per_agent_per_hour || 1000,
      per_engagement_per_hour: options.per_engagement_per_hour || 10000,
      max_finding_size_bytes: options.max_finding_size_bytes || 10 * 1024 * 1024, // 10MB
      max_findings_per_batch: options.max_findings_per_batch || 1000,
      burst_size: options.burst_size || 50  // Allow burst of 50 findings at once
    };

    // Tracking: agent → [timestamps]
    this.agentMetrics = new Map();
    // Tracking: engagement → [timestamps]
    this.engagementMetrics = new Map();
    // Tracking: rejected attempts
    this.rejections = [];
  }

  /**
   * Checks if a finding ingestion would violate rate limits
   * @param {object} finding - Finding to check
   * @param {string} agentName - Name of agent submitting finding
   * @param {string} engagementName - Name of engagement
   * @returns {object} {allowed: boolean, reason?: string, details: object}
   */
  checkRate(finding, agentName, engagementName) {
    // Check 1: Individual finding size
    const findingSize = JSON.stringify(finding).length;
    if (findingSize > this.limits.max_finding_size_bytes) {
      return {
        allowed: false,
        reason: `FINDING_TOO_LARGE`,
        details: {
          size_bytes: findingSize,
          limit_bytes: this.limits.max_finding_size_bytes,
          exceeded_by: findingSize - this.limits.max_finding_size_bytes
        }
      };
    }

    // Check 2: Agent rate limit (per hour)
    const agentFindings = this._getRecentFindings(this.agentMetrics, agentName);
    if (agentFindings.length >= this.limits.per_agent_per_hour) {
      return {
        allowed: false,
        reason: `AGENT_RATE_LIMIT_EXCEEDED`,
        details: {
          agent: agentName,
          findings_this_hour: agentFindings.length,
          limit: this.limits.per_agent_per_hour
        }
      };
    }

    // Check 3: Engagement rate limit (per hour)
    const engagementFindings = this._getRecentFindings(this.engagementMetrics, engagementName);
    if (engagementFindings.length >= this.limits.per_engagement_per_hour) {
      return {
        allowed: false,
        reason: `ENGAGEMENT_RATE_LIMIT_EXCEEDED`,
        details: {
          engagement: engagementName,
          findings_this_hour: engagementFindings.length,
          limit: this.limits.per_engagement_per_hour
        }
      };
    }

    // All checks passed
    return {
      allowed: true,
      details: {
        agent_usage: `${agentFindings.length}/${this.limits.per_agent_per_hour}`,
        engagement_usage: `${engagementFindings.length}/${this.limits.per_engagement_per_hour}`
      }
    };
  }

  /**
   * Records a finding ingestion for rate limit tracking
   * @param {string} agentName - Agent name
   * @param {string} engagementName - Engagement name
   */
  recordFinding(agentName, engagementName) {
    const now = Date.now();

    if (!this.agentMetrics.has(agentName)) {
      this.agentMetrics.set(agentName, []);
    }
    this.agentMetrics.get(agentName).push(now);

    if (!this.engagementMetrics.has(engagementName)) {
      this.engagementMetrics.set(engagementName, []);
    }
    this.engagementMetrics.get(engagementName).push(now);

    // Clean old entries (older than 1 hour)
    this._cleanOldMetrics();
  }

  /**
   * Records a rejected finding attempt
   * @param {string} agentName - Agent name
   * @param {string} reason - Rejection reason
   * @param {object} details - Additional details
   */
  recordRejection(agentName, reason, details) {
    this.rejections.push({
      agent: agentName,
      reason,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gets recent findings within the time window (1 hour)
   * @private
   */
  _getRecentFindings(metricsMap, key) {
    if (!metricsMap.has(key)) return [];

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recent = metricsMap.get(key).filter(timestamp => timestamp > oneHourAgo);

    // Update map with only recent
    metricsMap.set(key, recent);
    return recent;
  }

  /**
   * Cleans up old metrics entries
   * @private
   */
  _cleanOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [key, timestamps] of this.agentMetrics) {
      const recent = timestamps.filter(t => t > oneHourAgo);
      if (recent.length === 0) {
        this.agentMetrics.delete(key);
      } else {
        this.agentMetrics.set(key, recent);
      }
    }

    for (const [key, timestamps] of this.engagementMetrics) {
      const recent = timestamps.filter(t => t > oneHourAgo);
      if (recent.length === 0) {
        this.engagementMetrics.delete(key);
      } else {
        this.engagementMetrics.set(key, recent);
      }
    }
  }

  /**
   * Gets rate limit statistics
   * @returns {object} Current usage statistics
   */
  getStats() {
    const stats = {
      agents: {},
      engagements: {},
      rejections_total: this.rejections.length,
      rejections_by_reason: {},
      limits: this.limits
    };

    for (const [agent, timestamps] of this.agentMetrics) {
      stats.agents[agent] = {
        findings_this_hour: timestamps.length,
        limit: this.limits.per_agent_per_hour,
        usage_percent: ((timestamps.length / this.limits.per_agent_per_hour) * 100).toFixed(1) + '%',
        approaching_limit: timestamps.length > this.limits.per_agent_per_hour * 0.8
      };
    }

    for (const [engagement, timestamps] of this.engagementMetrics) {
      stats.engagements[engagement] = {
        findings_this_hour: timestamps.length,
        limit: this.limits.per_engagement_per_hour,
        usage_percent: ((timestamps.length / this.limits.per_engagement_per_hour) * 100).toFixed(1) + '%',
        approaching_limit: timestamps.length > this.limits.per_engagement_per_hour * 0.8
      };
    }

    this.rejections.forEach(r => {
      stats.rejections_by_reason[r.reason] = (stats.rejections_by_reason[r.reason] || 0) + 1;
    });

    return stats;
  }

  /**
   * Resets rate limit tracking (useful for testing)
   */
  reset() {
    this.agentMetrics.clear();
    this.engagementMetrics.clear();
    this.rejections = [];
  }

  /**
   * Checks if an agent is approaching their rate limit
   * @param {string} agentName - Agent to check
   * @returns {boolean} True if usage > 80% of limit
   */
  isApproachingLimit(agentName) {
    const recent = this._getRecentFindings(this.agentMetrics, agentName);
    return recent.length > this.limits.per_agent_per_hour * 0.8;
  }

  /**
   * Updates rate limit thresholds
   * @param {object} newLimits - New limit values
   */
  updateLimits(newLimits) {
    this.limits = { ...this.limits, ...newLimits };
  }
}

/**
 * Creates a new rate limiter instance
 * @param {object} options - Configuration options
 * @returns {RateLimiter} Rate limiter instance
 */
function createRateLimiter(options = {}) {
  return new RateLimiter(options);
}

module.exports = {
  RateLimiter,
  createRateLimiter
};
