#!/usr/bin/env node

/**
 * CROSS-ENGAGEMENT DEDUPLICATION
 *
 * Identifies same findings across different engagements/clients.
 * Prevents duplicate remediation work and enables knowledge sharing.
 */

const crypto = require('crypto');

class CrossEngagementDedup {
  constructor(database) {
    this.db = database;
    this.deduplicationMap = new Map();
  }

  /**
   * Check if finding is duplicate of historical finding
   * @param {object} newFinding - Finding to check
   * @returns {object} Deduplication result
   */
  checkAgainstHistoricalFindings(newFinding) {
    // Generate signature for matching
    const signature = this._generateSignature(newFinding);

    // Query historical findings with similar signatures
    const historicalMatches = this.db.query({
      title_similar: newFinding.title,
      severity: newFinding.severity
    });

    const similarFindings = historicalMatches
      .filter(f => {
        const historicalSig = this._generateSignature(f);
        return this._calculateSimilarity(signature, historicalSig) > 0.75;
      })
      .map(f => ({
        finding_id: f.finding_id,
        engagement_id: f.engagement_id || 'unknown',
        title: f.title,
        severity: f.severity,
        first_found: f.created_at,
        remediation_status: f.current_status,
        remediation_notes: f.remediation_notes,
        remediation_by: f.remediated_by,
        similarity_score: this._calculateSimilarity(signature, this._generateSignature(f))
      }))
      .sort((a, b) => b.similarity_score - a.similarity_score);

    this.deduplicationMap.set(newFinding.finding_id, {
      similar_findings: similarFindings,
      is_likely_duplicate: similarFindings.length > 0 && similarFindings[0].similarity_score > 0.85
    });

    return {
      finding_id: newFinding.finding_id,
      signature,
      is_duplicate: similarFindings.length > 0,
      duplicate_count: similarFindings.length,
      similar_findings: similarFindings,
      recommendation: this._getRecommendation(similarFindings),
      benefit: this._calculateBenefit(similarFindings)
    };
  }

  /**
   * Get dedup statistics
   * @returns {object} Statistics
   */
  getStats() {
    let duplicatesFound = 0;
    let duplicatesByStatus = {};
    let totalSimilarFindings = 0;

    this.deduplicationMap.forEach((dedup) => {
      if (dedup.is_likely_duplicate) {
        duplicatesFound++;
      }

      if (dedup.similar_findings.length > 0) {
        totalSimilarFindings += dedup.similar_findings.length;

        dedup.similar_findings.forEach(f => {
          const status = f.remediation_status;
          duplicatesByStatus[status] = (duplicatesByStatus[status] || 0) + 1;
        });
      }
    });

    return {
      findings_checked: this.deduplicationMap.size,
      duplicates_found: duplicatesFound,
      total_similar_findings: totalSimilarFindings,
      duplicates_by_remediation_status: duplicatesByStatus,
      duplicate_rate: this.deduplicationMap.size > 0 ?
        ((duplicatesFound / this.deduplicationMap.size) * 100).toFixed(1) + '%' :
        '0%'
    };
  }

  /**
   * Get deduplication for finding
   * @param {string} findingId - Finding ID
   * @returns {object} Dedup info
   */
  getDedup(findingId) {
    return this.deduplicationMap.get(findingId);
  }

  /**
   * Internal: Generate signature
   * @private
   */
  _generateSignature(finding) {
    const key = `${finding.title}:${finding.affected_component}:${finding.severity}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Internal: Calculate similarity (Levenshtein distance)
   * @private
   */
  _calculateSimilarity(sig1, sig2) {
    if (sig1 === sig2) return 1.0;

    // Simplified similarity based on string distance
    const distance = this._levenshteinDistance(sig1, sig2);
    const maxLength = Math.max(sig1.length, sig2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Internal: Levenshtein distance
   * @private
   */
  _levenshteinDistance(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Internal: Get recommendation
   * @private
   */
  _getRecommendation(similarFindings) {
    if (similarFindings.length === 0) {
      return 'This is a new finding';
    }

    const best = similarFindings[0];

    if (best.remediation_status === 'remediated' || best.remediation_status === 'verified') {
      return `Use solution from ${best.finding_id} (${best.engagement_id}) - already fixed`;
    }

    if (best.remediation_status === 'approved') {
      return `Coordinate remediation with ${best.finding_id} - same issue in multiple clients`;
    }

    return `Check if same root cause as ${best.finding_id} from ${best.engagement_id}`;
  }

  /**
   * Internal: Calculate benefit
   * @private
   */
  _calculateBenefit(similarFindings) {
    if (similarFindings.length === 0) {
      return { effort_saved_hours: 0, reuse_potential: 'none' };
    }

    const best = similarFindings[0];

    if (best.remediation_status === 'remediated') {
      return {
        effort_saved_hours: 4,  // Can reuse solution
        reuse_potential: 'high',
        reason: 'Solution already tested and deployed'
      };
    }

    if (best.remediation_status === 'approved') {
      return {
        effort_saved_hours: 2,  // Can coordinate
        reuse_potential: 'medium',
        reason: 'Can coordinate across teams'
      };
    }

    return {
      effort_saved_hours: 0,
      reuse_potential: 'low'
    };
  }
}

function createCrossEngagementDedup(database) {
  return new CrossEngagementDedup(database);
}

module.exports = {
  CrossEngagementDedup,
  createCrossEngagementDedup
};
