#!/usr/bin/env node

/**
 * FINDINGS VERSIONING
 *
 * Tracks finding status changes over time: discovered → approved → remediated → verified
 * Detects re-discovered findings that were previously fixed.
 */

const crypto = require('crypto');

class FindingsVersioning {
  /**
   * Creates or updates a finding with versioning
   * @param {object} finding - Finding data
   * @param {string} status - Current status (discovered, approved, in_remediation, remediated, verified, re_discovered, wontfix)
   * @returns {object} Finding with versioning metadata
   */
  static createVersionedFinding(finding, status = 'discovered') {
    const signature = crypto.createHash('sha256')
      .update(`${finding.title}:${finding.affected_component}:${finding.severity}`)
      .digest('hex');

    return {
      ...finding,
      finding_signature: signature,
      current_version: 1,
      current_status: status,
      versions: [
        {
          version: 1,
          status,
          timestamp: new Date().toISOString(),
          changed_by: finding.discovered_by,
          notes: 'Initial discovery'
        }
      ],
      status_history: [
        {
          status,
          timestamp: new Date().toISOString(),
          changed_by: finding.discovered_by
        }
      ]
    };
  }

  /**
   * Adds a new version/status change to finding
   * @param {object} finding - Existing versioned finding
   * @param {string} newStatus - New status
   * @param {string} changedBy - Who changed it (usually approver/remediator)
   * @param {string} notes - Optional notes
   * @returns {object} Updated finding
   */
  static updateFindingStatus(finding, newStatus, changedBy, notes = '') {
    const newVersion = finding.current_version + 1;

    finding.current_version = newVersion;
    finding.current_status = newStatus;

    finding.versions.push({
      version: newVersion,
      status: newStatus,
      timestamp: new Date().toISOString(),
      changed_by: changedBy,
      notes: notes || `Status changed to ${newStatus}`
    });

    finding.status_history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      changed_by: changedBy
    });

    // Detect re-discovery
    if (newStatus === 'discovered' && finding.versions.some(v => v.status === 'remediated')) {
      finding._re_discovered = true;
      finding._re_discovery_risk = 'HIGH';  // Finding was fixed but found again!
    }

    return finding;
  }

  /**
   * Gets finding timeline
   * @param {object} finding - Versioned finding
   * @returns {Array<object>} Timeline of all status changes
   */
  static getTimeline(finding) {
    return finding.versions.map(v => ({
      version: v.version,
      status: v.status,
      timestamp: v.timestamp,
      changed_by: v.changed_by,
      notes: v.notes
    }));
  }

  /**
   * Checks if finding was remediated then re-discovered
   * @param {object} finding - Versioned finding
   * @returns {boolean} True if re-discovered
   */
  static isRediscovered(finding) {
    const hasRemediated = finding.versions.some(v => v.status === 'remediated');
    const isNowDiscovered = finding.current_status === 'discovered' || finding.current_status === 're_discovered';
    return hasRemediated && isNowDiscovered;
  }

  /**
   * Gets remediation status
   * @param {object} finding - Versioned finding
   * @returns {object} Remediation info
   */
  static getRemediationStatus(finding) {
    const remediatedVersion = finding.versions.find(v => v.status === 'remediated');
    const approvedVersion = finding.versions.find(v => v.status === 'approved');

    return {
      was_approved: !!approvedVersion,
      approved_by: approvedVersion?.changed_by,
      approved_at: approvedVersion?.timestamp,
      was_remediated: !!remediatedVersion,
      remediated_at: remediatedVersion?.timestamp,
      is_rediscovered: this.isRediscovered(finding),
      days_since_remediation: remediatedVersion ?
        Math.floor((Date.now() - new Date(remediatedVersion.timestamp)) / 86400000) :
        null
    };
  }

  /**
   * Groups findings by status
   * @param {Array<object>} findings - Array of versioned findings
   * @returns {object} Findings grouped by current status
   */
  static groupByStatus(findings) {
    return findings.reduce((groups, finding) => {
      const status = finding.current_status;
      if (!groups[status]) groups[status] = [];
      groups[status].push(finding);
      return groups;
    }, {});
  }

  /**
   * Gets statistics about finding versions
   * @param {Array<object>} findings - Array of versioned findings
   * @returns {object} Statistics
   */
  static getStats(findings) {
    const rediscovered = findings.filter(f => this.isRediscovered(f));
    const remediated = findings.filter(f => f.versions.some(v => v.status === 'remediated'));
    const pending = findings.filter(f => f.current_status === 'discovered');

    return {
      total_findings: findings.length,
      currently_open: pending.length,
      remediated: remediated.length,
      re_discovered: rediscovered.length,
      re_discovery_rate: findings.length > 0 ?
        ((rediscovered.length / remediated.length) * 100).toFixed(1) + '%' :
        '0%',
      average_versions: Math.round(findings.reduce((sum, f) => sum + f.current_version, 0) / findings.length),
      status_distribution: this.groupByStatus(findings)
    };
  }
}

module.exports = {
  FindingsVersioning
};
