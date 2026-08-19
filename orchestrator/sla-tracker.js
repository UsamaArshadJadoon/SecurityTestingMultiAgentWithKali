#!/usr/bin/env node

/**
 * SLA TRACKER - Finding Workflow Accountability
 *
 * Tracks SLA compliance: discovery→approval→remediation→verification
 * Ensures findings move through workflow within target times.
 */

class SLATracker {
  constructor(config = {}) {
    this.slaConfig = {
      discovery_to_approval: config.discovery_to_approval || 3,  // days
      approval_to_remediation: config.approval_to_remediation || 10,  // days
      remediation_to_verification: config.remediation_to_verification || 5  // days
    };
    this.findings = new Map();
  }

  /**
   * Track SLA for finding
   * @param {object} finding - Finding object
   * @returns {object} SLA status
   */
  trackFinding(finding) {
    const status = {
      finding_id: finding.finding_id,
      discovered_at: finding.created_at || new Date().toISOString(),
      approved_at: finding.approved_at || null,
      remediated_at: finding.remediated_at || null,
      verified_at: finding.verified_at || null,
      sla: this._calculateSLAStatus(finding)
    };

    this.findings.set(finding.finding_id, status);
    return status;
  }

  /**
   * Get SLA report
   * @returns {object} SLA compliance metrics
   */
  getSLAReport() {
    const report = {
      total_findings: this.findings.size,
      sla_met: 0,
      sla_missed: 0,
      by_stage: {
        discovery_to_approval: { met: 0, missed: 0, breach_rate: 0 },
        approval_to_remediation: { met: 0, missed: 0, breach_rate: 0 },
        remediation_to_verification: { met: 0, missed: 0, breach_rate: 0 }
      },
      findings_at_risk: []
    };

    this.findings.forEach((finding) => {
      // Check each SLA stage
      if (finding.sla.discovery_to_approval) {
        if (finding.sla.discovery_to_approval.breached) {
          report.by_stage.discovery_to_approval.missed++;
        } else {
          report.by_stage.discovery_to_approval.met++;
        }
      }

      if (finding.sla.approval_to_remediation) {
        if (finding.sla.approval_to_remediation.breached) {
          report.by_stage.approval_to_remediation.missed++;
        } else {
          report.by_stage.approval_to_remediation.met++;
        }
      }

      if (finding.sla.remediation_to_verification) {
        if (finding.sla.remediation_to_verification.breached) {
          report.by_stage.remediation_to_verification.missed++;
        } else {
          report.by_stage.remediation_to_verification.met++;
        }
      }

      // Identify at-risk findings
      if (finding.sla.discovery_to_approval?.on_track === false) {
        report.findings_at_risk.push({
          finding_id: finding.finding_id,
          stage: 'discovery_to_approval',
          days_overdue: -finding.sla.discovery_to_approval.days_remaining
        });
      }
    });

    // Calculate breach rates
    report.by_stage.discovery_to_approval.breach_rate = this._calculateBreachRate(
      report.by_stage.discovery_to_approval.met,
      report.by_stage.discovery_to_approval.missed
    );
    report.by_stage.approval_to_remediation.breach_rate = this._calculateBreachRate(
      report.by_stage.approval_to_remediation.met,
      report.by_stage.approval_to_remediation.missed
    );
    report.by_stage.remediation_to_verification.breach_rate = this._calculateBreachRate(
      report.by_stage.remediation_to_verification.met,
      report.by_stage.remediation_to_verification.missed
    );

    report.overall_sla_compliance = this._calculateCompliance(report);

    return report;
  }

  /**
   * Get findings approaching SLA deadline
   * @param {number} warningDays - Days before deadline to warn
   * @returns {Array} At-risk findings
   */
  getAtRiskFindings(warningDays = 1) {
    const atRisk = [];

    this.findings.forEach((finding) => {
      // Check each stage
      const stages = ['discovery_to_approval', 'approval_to_remediation', 'remediation_to_verification'];

      stages.forEach(stage => {
        if (finding.sla[stage]) {
          const slaStage = finding.sla[stage];
          if (slaStage.days_remaining <= warningDays && !slaStage.breached) {
            atRisk.push({
              finding_id: finding.finding_id,
              stage,
              days_remaining: slaStage.days_remaining,
              deadline: slaStage.deadline,
              priority: slaStage.days_remaining <= 0 ? 'CRITICAL' : 'HIGH'
            });
          }
        }
      });
    });

    return atRisk;
  }

  /**
   * Internal: Calculate SLA status
   * @private
   */
  _calculateSLAStatus(finding) {
    const sla = {};
    const now = new Date();

    // Discovery to Approval
    if (finding.approved_at) {
      const discoveredDate = new Date(finding.created_at);
      const approvedDate = new Date(finding.approved_at);
      const daysTaken = Math.floor((approvedDate - discoveredDate) / (24 * 60 * 60 * 1000));
      const targetDays = this.slaConfig.discovery_to_approval;

      sla.discovery_to_approval = {
        target: `${targetDays} days`,
        actual: `${daysTaken} days`,
        breached: daysTaken > targetDays,
        days_remaining: targetDays - daysTaken,
        deadline: new Date(discoveredDate.getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString(),
        on_track: daysTaken <= targetDays
      };
    } else if (finding.created_at) {
      const discoveredDate = new Date(finding.created_at);
      const daysSinceDiscovery = Math.floor((now - discoveredDate) / (24 * 60 * 60 * 1000));
      const targetDays = this.slaConfig.discovery_to_approval;

      sla.discovery_to_approval = {
        target: `${targetDays} days`,
        actual: 'In progress',
        breached: daysSinceDiscovery > targetDays,
        days_remaining: targetDays - daysSinceDiscovery,
        deadline: new Date(discoveredDate.getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString(),
        on_track: daysSinceDiscovery <= targetDays
      };
    }

    // Approval to Remediation
    if (finding.remediated_at && finding.approved_at) {
      const approvedDate = new Date(finding.approved_at);
      const remediatedDate = new Date(finding.remediated_at);
      const daysTaken = Math.floor((remediatedDate - approvedDate) / (24 * 60 * 60 * 1000));
      const targetDays = this.slaConfig.approval_to_remediation;

      sla.approval_to_remediation = {
        target: `${targetDays} days`,
        actual: `${daysTaken} days`,
        breached: daysTaken > targetDays,
        on_track: daysTaken <= targetDays
      };
    }

    // Remediation to Verification
    if (finding.verified_at && finding.remediated_at) {
      const remediatedDate = new Date(finding.remediated_at);
      const verifiedDate = new Date(finding.verified_at);
      const daysTaken = Math.floor((verifiedDate - remediatedDate) / (24 * 60 * 60 * 1000));
      const targetDays = this.slaConfig.remediation_to_verification;

      sla.remediation_to_verification = {
        target: `${targetDays} days`,
        actual: `${daysTaken} days`,
        breached: daysTaken > targetDays,
        on_track: daysTaken <= targetDays
      };
    }

    return sla;
  }

  /**
   * Internal: Calculate breach rate
   * @private
   */
  _calculateBreachRate(met, missed) {
    const total = met + missed;
    if (total === 0) return 0;
    return ((missed / total) * 100).toFixed(1);
  }

  /**
   * Internal: Calculate overall compliance
   * @private
   */
  _calculateCompliance(report) {
    const stages = ['discovery_to_approval', 'approval_to_remediation', 'remediation_to_verification'];
    let totalMet = 0;
    let totalMissed = 0;

    stages.forEach(stage => {
      totalMet += report.by_stage[stage].met;
      totalMissed += report.by_stage[stage].missed;
    });

    if (totalMet + totalMissed === 0) return '0%';
    return (((totalMet) / (totalMet + totalMissed)) * 100).toFixed(1) + '%';
  }
}

function createSLATracker(config) {
  return new SLATracker(config);
}

module.exports = {
  SLATracker,
  createSLATracker
};
