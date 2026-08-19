#!/usr/bin/env node

/**
 * AUDIT LOGGER
 *
 * Structured JSON logging for orchestration events.
 * Writes JSONL (JSON Lines) format to audit.jsonl for compliance and debugging.
 *
 * Events include: agent execution, finding validation, state changes, errors
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(engagementPath) {
    this.engagementPath = engagementPath;
    this.auditFile = path.join(engagementPath, 'audit.jsonl');
    this.ensureAuditFileExists();
  }

  ensureAuditFileExists() {
    if (!fs.existsSync(path.dirname(this.auditFile))) {
      fs.mkdirSync(path.dirname(this.auditFile), { recursive: true });
    }
    if (!fs.existsSync(this.auditFile)) {
      fs.writeFileSync(this.auditFile, '');
    }
  }

  /**
   * Writes an audit log entry to the audit trail.
   * @param {string} level - Log level: 'info', 'warn', 'error', 'debug'
   * @param {string} event - Event type (e.g., 'agent-started', 'finding-validated')
   * @param {object} details - Additional context
   */
  log(level, event, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      details,
      engagement: path.basename(this.engagementPath),
      pid: process.pid
    };

    try {
      fs.appendFileSync(this.auditFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error(`⚠️  Failed to write audit log: ${error.message}`);
    }
  }

  /**
   * Convenience methods for common log levels
   */
  info(event, details) {
    this.log('info', event, details);
  }

  warn(event, details) {
    this.log('warn', event, details);
  }

  error(event, details) {
    this.log('error', event, details);
  }

  debug(event, details) {
    this.log('debug', event, details);
  }

  /**
   * Log agent execution start
   */
  agentStarted(agentName, timeout, phase) {
    this.info('agent-started', {
      agent: agentName,
      timeout_seconds: timeout,
      phase,
      started_at: new Date().toISOString()
    });
  }

  /**
   * Log agent execution completion
   */
  agentCompleted(agentName, findings, duration) {
    this.info('agent-completed', {
      agent: agentName,
      findings_count: findings,
      duration_ms: duration,
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Log agent execution failure
   */
  agentFailed(agentName, error, duration) {
    this.error('agent-failed', {
      agent: agentName,
      error_message: error.message,
      error_stack: error.stack,
      duration_ms: duration,
      failed_at: new Date().toISOString()
    });
  }

  /**
   * Log finding validation
   */
  findingValidated(findingId, agent, gate) {
    this.info('finding-validated', {
      finding_id: findingId,
      discovered_by: agent,
      final_gate: gate,
      validated_at: new Date().toISOString()
    });
  }

  /**
   * Log finding rejection
   */
  findingRejected(findingId, agent, failedGate, errors) {
    this.warn('finding-rejected', {
      finding_id: findingId,
      discovered_by: agent,
      failed_at_gate: failedGate,
      rejection_reasons: errors,
      rejected_at: new Date().toISOString()
    });
  }

  /**
   * Log finding deduplication
   */
  findingDeduped(findingId, agent, originalFindingId, duplicateCount) {
    this.info('finding-deduped', {
      finding_id: findingId,
      discovered_by: agent,
      original_finding_id: originalFindingId,
      duplicate_number: duplicateCount,
      deduped_at: new Date().toISOString()
    });
  }

  /**
   * Log state save
   */
  stateSaved(completedPhases, completedAgents) {
    this.debug('state-saved', {
      phases: completedPhases,
      agents: completedAgents,
      saved_at: new Date().toISOString()
    });
  }

  /**
   * Log state save failure
   */
  stateSaveFailed(error) {
    this.error('state-save-failed', {
      error_message: error.message,
      failed_at: new Date().toISOString()
    });
  }

  /**
   * Log phase completion
   */
  phaseCompleted(phaseNum, findings, duration) {
    this.info('phase-completed', {
      phase: phaseNum,
      findings_total: findings,
      duration_ms: duration,
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Log orchestration start
   */
  orchestrationStarted(engagementName) {
    this.info('orchestration-started', {
      engagement: engagementName,
      started_at: new Date().toISOString()
    });
  }

  /**
   * Log orchestration completion
   */
  orchestrationCompleted(totalFindings, totalDuration) {
    this.info('orchestration-completed', {
      total_findings: totalFindings,
      total_duration_ms: totalDuration,
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Reads and parses the audit log
   * @param {number} limit - Max entries to read (default: all)
   * @returns {Array<object>} Parsed audit entries
   */
  readAuditLog(limit = null) {
    try {
      const content = fs.readFileSync(this.auditFile, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.length > 0);
      const entries = lines.map(line => JSON.parse(line));
      return limit ? entries.slice(-limit) : entries;
    } catch (error) {
      console.error(`⚠️  Failed to read audit log: ${error.message}`);
      return [];
    }
  }

  /**
   * Gets audit statistics
   * @returns {object} Stats including event counts by type
   */
  getStats() {
    const entries = this.readAuditLog();
    const stats = {
      total_events: entries.length,
      events_by_level: {},
      events_by_type: {},
      timeline: {
        first_event: entries.length > 0 ? entries[0].timestamp : null,
        last_event: entries.length > 0 ? entries[entries.length - 1].timestamp : null
      }
    };

    entries.forEach(entry => {
      stats.events_by_level[entry.level] = (stats.events_by_level[entry.level] || 0) + 1;
      stats.events_by_type[entry.event] = (stats.events_by_type[entry.event] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Creates a new audit logger instance
 * @param {string} engagementPath - Path to engagement directory
 * @returns {AuditLogger} Logger instance
 */
function createAuditLogger(engagementPath) {
  return new AuditLogger(engagementPath);
}

module.exports = {
  AuditLogger,
  createAuditLogger
};
