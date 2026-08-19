#!/usr/bin/env node

/**
 * PII / SECRETS MASKING
 *
 * Detects and masks personally identifiable information (PII) and secrets
 * in findings before storage/reporting.
 *
 * Patterns detected:
 * - Email addresses (name@domain.com)
 * - API keys (api_key=..., API-KEY: ...)
 * - Passwords (password=..., passwd: ...)
 * - Bearer tokens (Bearer eyJhbGc...)
 * - Database credentials (user:password@host)
 * - Credit card numbers
 * - Social security numbers
 * - AWS access keys (AKIA...)
 * - Private keys (-----BEGIN RSA PRIVATE KEY-----)
 */

class PIIMasker {
  constructor(options = {}) {
    this.maskReplacement = options.maskReplacement || '[REDACTED]';
    this.detectOnly = options.detectOnly || false; // If true, only detect but don't mask

    // Patterns to detect and mask
    this.patterns = {
      email: {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL_REDACTED]',
        category: 'email'
      },
      apiKey: {
        pattern: /(api[_-]?key|api[_-]?secret|api[_-]?token)\s*[:=]\s*([a-zA-Z0-9\-_.!@#$%^&*]+)/gi,
        replacement: '$1=[API_KEY_REDACTED]',
        category: 'api_key'
      },
      bearerToken: {
        pattern: /(Bearer|bearer|authorization|Authorization)\s+([a-zA-Z0-9\-_.~+/]+=*)/g,
        replacement: '$1 [TOKEN_REDACTED]',
        category: 'bearer_token'
      },
      password: {
        pattern: /(password|passwd|pwd|secret)\s*[:=]\s*([a-zA-Z0-9\-_.!@#$%^&*]+)/gi,
        replacement: '$1=[PASSWORD_REDACTED]',
        category: 'password'
      },
      awsAccessKey: {
        pattern: /AKIA[0-9A-Z]{16}/g,
        replacement: '[AWS_KEY_REDACTED]',
        category: 'aws_access_key'
      },
      creditCard: {
        pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        replacement: '[CREDIT_CARD_REDACTED]',
        category: 'credit_card'
      },
      ssn: {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[SSN_REDACTED]',
        category: 'ssn'
      },
      databaseUrl: {
        pattern: /(postgres|mysql|mongodb):\/\/([^:]+):([^@]+)@([^/]+)/gi,
        replacement: '$1://[USER]:[PASSWORD]@$4',
        category: 'database_url'
      },
      privateKey: {
        pattern: /-----BEGIN [A-Z]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z]+ PRIVATE KEY-----/g,
        replacement: '[PRIVATE_KEY_REDACTED]',
        category: 'private_key'
      },
      ipAddress: {
        pattern: /\b(?:10|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // Private IPs only
        replacement: '[IP_REDACTED]',
        category: 'private_ip'
      }
    };
  }

  /**
   * Detects PII/secrets in a string without modifying it
   * @param {string} text - Text to scan
   * @returns {Array<object>} Detections: {category, match, position}
   */
  detect(text) {
    if (!text || typeof text !== 'string') return [];

    const detections = [];
    Object.entries(this.patterns).forEach(([key, config]) => {
      const matches = [...text.matchAll(new RegExp(config.pattern.source, 'g'))];
      matches.forEach(match => {
        detections.push({
          category: config.category,
          matched_text: match[0].substring(0, 20) + (match[0].length > 20 ? '...' : ''),
          position: match.index,
          length: match[0].length
        });
      });
    });

    return detections;
  }

  /**
   * Masks PII/secrets in a string
   * @param {string} text - Text to mask
   * @returns {object} {masked_text, detections_count, detections}
   */
  maskString(text) {
    if (!text || typeof text !== 'string') {
      return { masked_text: text, detections_count: 0, detections: [] };
    }

    const detections = this.detect(text);
    let masked = text;

    if (!this.detectOnly && detections.length > 0) {
      Object.entries(this.patterns).forEach(([key, config]) => {
        masked = masked.replace(config.pattern, config.replacement);
      });
    }

    return {
      masked_text: masked,
      detections_count: detections.length,
      detections
    };
  }

  /**
   * Recursively masks PII in a finding object
   * @param {object} finding - Finding to mask
   * @returns {object} Masked finding with metadata
   */
  maskFinding(finding) {
    const allDetections = [];
    const maskedFinding = JSON.parse(JSON.stringify(finding)); // Deep copy

    const processValue = (obj, path = '') => {
      if (typeof obj === 'string') {
        const result = this.maskString(obj);
        if (result.detections_count > 0) {
          result.detections.forEach(d => {
            allDetections.push({
              ...d,
              field: path
            });
          });
        }
        return result.masked_text;
      } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
          obj[key] = processValue(obj[key], `${path}.${key}`.replace(/^\./, ''));
        }
      }
      return obj;
    };

    processValue(maskedFinding);

    return {
      ...maskedFinding,
      _pii_masking: {
        was_masked: allDetections.length > 0,
        total_detections: allDetections.length,
        detections_by_category: this._groupBy(allDetections, 'category'),
        masked_at: new Date().toISOString(),
        fields_affected: [...new Set(allDetections.map(d => d.field))]
      }
    };
  }

  /**
   * Helper: Group array by property
   */
  _groupBy(arr, prop) {
    return arr.reduce((groups, item) => {
      const category = item[prop];
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {});
  }

  /**
   * Gets statistics about PII detection across findings
   * @param {Array<object>} findings - Findings to analyze
   * @returns {object} Statistics
   */
  getStats(findings) {
    const allDetections = [];
    const categoryCounts = {};

    findings.forEach(finding => {
      const detections = this.detect(JSON.stringify(finding));
      allDetections.push(...detections);
      detections.forEach(d => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
      });
    });

    return {
      total_findings_scanned: findings.length,
      total_pii_detections: allDetections.length,
      findings_with_pii: findings.filter(f => this.detect(JSON.stringify(f)).length > 0).length,
      detections_by_category: categoryCounts,
      highest_risk_category: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
    };
  }
}

/**
 * Creates a new PII masker instance
 * @param {object} options - Configuration options
 * @returns {PIIMasker} Masker instance
 */
function createPIIMasker(options = {}) {
  return new PIIMasker(options);
}

module.exports = {
  PIIMasker,
  createPIIMasker
};
