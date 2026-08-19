#!/usr/bin/env node

/**
 * FINDING DEDUPLICATION
 *
 * Prevents duplicate findings from multiple agents discovering the same vulnerability.
 * Uses SHA-256 signature of finding title + affected component + CVSS score.
 *
 * When duplicates are found, keeps the first discovered and tracks count in metadata.
 */

const crypto = require('crypto');

/**
 * Generates a unique signature for a finding based on its core attributes.
 * Two findings with the same signature are considered duplicates.
 * @param {object} finding - The finding object
 * @returns {string} SHA-256 hash signature
 */
function generateFindingSignature(finding) {
  const signatureData = [
    finding.title?.trim() || '',
    finding.affected_component?.trim() || '',
    finding.cvss_score?.toString() || '',
    finding.severity?.trim() || ''
  ].join('::');

  return crypto.createHash('sha256').update(signatureData).digest('hex');
}

/**
 * Tracks deduplicated findings across the entire engagement.
 */
class DeduplicationTracker {
  constructor() {
    this.signatures = new Map();  // signature → original finding
    this.duplicates = new Map();  // signature → [duplicate findings]
    this.counts = new Map();      // signature → count (1 + duplicates)
  }

  /**
   * Checks if a finding is a duplicate.
   * @param {object} finding - Finding to check
   * @returns {object} {isDuplicate: boolean, signature: string, originalFinding?: object, count?: number}
   */
  checkDuplicate(finding) {
    const signature = generateFindingSignature(finding);

    if (this.signatures.has(signature)) {
      // Duplicate found
      const originalFinding = this.signatures.get(signature);
      const count = this.counts.get(signature) + 1;
      this.counts.set(signature, count);

      if (!this.duplicates.has(signature)) {
        this.duplicates.set(signature, []);
      }
      this.duplicates.get(signature).push({
        ...finding,
        discovered_by_duplicate: finding.discovered_by,
        timestamp_duplicate: finding.timestamp
      });

      return {
        isDuplicate: true,
        signature,
        originalFinding,
        count,
        duplicateNumber: count - 1
      };
    }

    // First occurrence
    this.signatures.set(signature, finding);
    this.counts.set(signature, 1);

    return {
      isDuplicate: false,
      signature,
      count: 1
    };
  }

  /**
   * Gets deduplication statistics.
   * @returns {object} Stats including unique findings, duplicate count, discovery patterns
   */
  getStats() {
    const totalSignatures = this.signatures.size;
    const totalDuplicates = Array.from(this.counts.values()).reduce((a, b) => a + b, 0) - totalSignatures;
    const duplicatePatterns = Array.from(this.duplicates.entries()).map(([sig, dups]) => ({
      signature: sig,
      finding_title: this.signatures.get(sig).title,
      original_agent: this.signatures.get(sig).discovered_by,
      discovered_again_by: dups.map(d => d.discovered_by_duplicate),
      total_occurrences: dups.length + 1
    }));

    return {
      unique_findings: totalSignatures,
      total_duplicates: totalDuplicates,
      deduplication_rate: totalSignatures > 0 ? ((totalDuplicates / (totalSignatures + totalDuplicates)) * 100).toFixed(1) + '%' : '0%',
      duplicate_patterns: duplicatePatterns
    };
  }

  /**
   * Marks a finding as approved (move it past deduplication check).
   * @param {string} signature - Finding signature
   */
  approveFinding(signature) {
    if (this.signatures.has(signature)) {
      const finding = this.signatures.get(signature);
      finding.deduplication_status = 'approved';
      finding.deduplication_approved_at = new Date().toISOString();
    }
  }

  /**
   * Merges deduplication data into a finding object for storage.
   * @param {object} finding - Finding to enhance
   * @param {object} deduplicationResult - Result from checkDuplicate()
   * @returns {object} Enhanced finding with deduplication metadata
   */
  enhanceFinding(finding, deduplicationResult) {
    return {
      ...finding,
      deduplication_signature: deduplicationResult.signature,
      deduplication_status: deduplicationResult.isDuplicate ? 'duplicate' : 'unique',
      deduplication_count: deduplicationResult.count,
      deduplication_duplicate_number: deduplicationResult.isDuplicate ? deduplicationResult.duplicateNumber : null,
      deduplication_original_finding_id: deduplicationResult.isDuplicate
        ? deduplicationResult.originalFinding.finding_id
        : null
    };
  }
}

/**
 * Creates a new deduplication tracker instance.
 * @returns {DeduplicationTracker} Tracker instance
 */
function createDeduplicationTracker() {
  return new DeduplicationTracker();
}

module.exports = {
  generateFindingSignature,
  DeduplicationTracker,
  createDeduplicationTracker
};
