#!/usr/bin/env node

/**
 * DIFFERENTIAL REPORTER
 *
 * Compares findings between engagements to show progress:
 * - New findings discovered
 * - Fixed findings (no longer present)
 * - Re-discovered findings (fixed then found again)
 * - Status changes in existing findings
 */

const crypto = require('crypto');

class DifferentialReporter {
  /**
   * Generates differential report between two engagement results
   * @param {Array} oldFindings - Findings from previous engagement
   * @param {Array} newFindings - Findings from current engagement
   * @returns {object} Differential analysis
   */
  static generateDiffReport(oldFindings = [], newFindings = []) {
    const oldSigs = new Map();
    const newSigs = new Map();

    // Build signature maps
    oldFindings.forEach(f => {
      const sig = DifferentialReporter._signature(f);
      oldSigs.set(sig, f);
    });

    newFindings.forEach(f => {
      const sig = DifferentialReporter._signature(f);
      newSigs.set(sig, f);
    });

    // Find new findings
    const newFindingList = Array.from(newSigs.entries())
      .filter(([sig]) => !oldSigs.has(sig))
      .map(([, f]) => f);

    // Find fixed findings
    const fixedFindingList = Array.from(oldSigs.entries())
      .filter(([sig]) => !newSigs.has(sig))
      .map(([, f]) => f);

    // Find re-discovered findings
    const rediscovered = newFindingList.filter(nf => {
      const sig = DifferentialReporter._signature(nf);
      const old = oldSigs.get(sig);
      return old && (old.current_status === 'remediated' || old.current_status === 'verified');
    });

    // Find status changes
    const statusChanges = Array.from(newSigs.entries())
      .filter(([sig, nf]) => {
        const of = oldSigs.get(sig);
        return of && of.current_status !== nf.current_status;
      })
      .map(([, nf]) => ({
        finding: nf,
        old_status: oldSigs.get(DifferentialReporter._signature(nf)).current_status,
        new_status: nf.current_status
      }));

    return {
      summary: {
        previous_engagement: {
          total: oldFindings.length,
          by_severity: DifferentialReporter._groupBySeverity(oldFindings)
        },
        current_engagement: {
          total: newFindings.length,
          by_severity: DifferentialReporter._groupBySeverity(newFindings)
        },
        delta: newFindings.length - oldFindings.length
      },
      new_findings: {
        count: newFindingList.length,
        items: newFindingList
      },
      fixed_findings: {
        count: fixedFindingList.length,
        items: fixedFindingList
      },
      rediscovered_findings: {
        count: rediscovered.length,
        items: rediscovered
      },
      status_changes: {
        count: statusChanges.length,
        items: statusChanges
      },
      metrics: {
        remediation_rate: oldFindings.length > 0 ?
          ((fixedFindingList.length / oldFindings.length) * 100).toFixed(1) + '%' :
          '0%',
        rediscovery_rate: fixedFindingList.length > 0 ?
          ((rediscovered.length / fixedFindingList.length) * 100).toFixed(1) + '%' :
          '0%',
        new_rate: oldFindings.length > 0 ?
          ((newFindingList.length / oldFindings.length) * 100).toFixed(1) + '%' :
          '0%'
      }
    };
  }

  /**
   * Generates progress trend over multiple engagements
   * @param {Array<Array>} engagementSequence - Array of finding arrays chronologically
   * @returns {object} Trend analysis
   */
  static generateTrend(engagementSequence = []) {
    const trend = [];

    for (let i = 1; i < engagementSequence.length; i++) {
      const report = DifferentialReporter.generateDiffReport(
        engagementSequence[i - 1],
        engagementSequence[i]
      );

      trend.push({
        engagement: i,
        report
      });
    }

    return {
      engagements: engagementSequence.length,
      trend,
      overall_improvement: trend.length > 0 ?
        DifferentialReporter._calculateImprovement(trend) :
        'N/A'
    };
  }

  /**
   * Internal: Generate signature for finding
   * @private
   */
  static _signature(finding) {
    const key = `${finding.title}:${finding.affected_component}:${finding.severity}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Internal: Group findings by severity
   * @private
   */
  static _groupBySeverity(findings) {
    const groups = {};
    findings.forEach(f => {
      const sev = f.severity || 'Unknown';
      groups[sev] = (groups[sev] || 0) + 1;
    });
    return groups;
  }

  /**
   * Internal: Calculate overall improvement
   * @private
   */
  static _calculateImprovement(trend) {
    const first = trend[0];
    const last = trend[trend.length - 1];

    const firstTotal = first.report.summary.previous_engagement.total;
    const lastTotal = last.report.summary.current_engagement.total;

    const improvement = ((firstTotal - lastTotal) / firstTotal * 100);
    return improvement > 0 ? `${improvement.toFixed(1)}% improvement` : 'Regression';
  }
}

module.exports = {
  DifferentialReporter
};
