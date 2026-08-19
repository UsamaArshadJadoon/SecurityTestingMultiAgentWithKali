/**
 * VALIDATION GATE TESTS
 *
 * Comprehensive unit tests for the 4-layer validation gate:
 * 1. Format validation (JSON schema compliance)
 * 2. Evidence validation (proof of concept, request, response required)
 * 3. Technical accuracy (CVSS scoring, severity alignment)
 * 4. Remediation validation (description and effort required)
 */

const { validateFinding, validateAll, gate1Format, gate2Evidence, gate3Technical, gate4Remediation } = require('../orchestrator/validation-gate.js');

// ============================================================================
// TEST FIXTURES
// ============================================================================

const validFinding = {
  finding_id: 'FINDING-0001',
  title: 'SQL Injection in Login Form',
  description: 'The login form is vulnerable to SQL injection due to insufficient input sanitization.',
  severity: 'High',
  cvss_score: 7.5,
  cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
  affected_component: '/api/login',
  evidence: {
    proof_of_concept: 'Input "admin\' OR \'1\'=\'1" bypasses authentication',
    request: "POST /api/login HTTP/1.1\nHost: target.com\nContent-Type: application/json\n\n{\"username\":\"admin' OR '1'='1\",\"password\":\"test\"}",
    response: 'HTTP/1.1 200 OK\n\n{\"token\":\"abc123\",\"authenticated\":true}'
  },
  remediation: {
    description: 'Use parameterized queries (prepared statements) for all database operations.',
    vulnerable_code: 'query = "SELECT * FROM users WHERE username = \'" + input + "\'";',
    fixed_code: 'const stmt = db.prepare("SELECT * FROM users WHERE username = ?"); stmt.get(input);',
    effort: '2-4 hours'
  }
};

// ============================================================================
// GATE 1: FORMAT VALIDATION TESTS
// ============================================================================

describe('Gate 1: Format Validation', () => {
  test('should pass valid finding with all required fields', () => {
    const result = gate1Format(validFinding);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail finding missing required field (finding_id)', () => {
    const finding = { ...validFinding };
    delete finding.finding_id;
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should fail finding missing required field (title)', () => {
    const finding = { ...validFinding };
    delete finding.title;
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding missing required field (severity)', () => {
    const finding = { ...validFinding };
    delete finding.severity;
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with invalid finding_id format', () => {
    const finding = { ...validFinding, finding_id: 'INVALID-FORMAT' };
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with invalid severity level', () => {
    const finding = { ...validFinding, severity: 'Extreme' };
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with title too short', () => {
    const finding = { ...validFinding, title: 'Bad' };
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with title too long', () => {
    const finding = { ...validFinding, title: 'A'.repeat(200) };
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with invalid CVSS score (out of range)', () => {
    const finding = { ...validFinding, cvss_score: 11 };
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });

  test('should accept Info severity with score 0', () => {
    const finding = { ...validFinding, severity: 'Info', cvss_score: 0.0 };
    const result = gate1Format(finding);
    expect(result.passed).toBe(true);
  });
});

// ============================================================================
// GATE 2: EVIDENCE VALIDATION TESTS
// ============================================================================

describe('Gate 2: Evidence Validation', () => {
  test('should pass finding with complete evidence', () => {
    const result = gate2Evidence(validFinding);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail finding missing proof_of_concept', () => {
    const finding = { ...validFinding, evidence: { request: 'req', response: 'res' } };
    const result = gate2Evidence(finding);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('proof_of_concept'))).toBe(true);
  });

  test('should fail finding with empty proof_of_concept', () => {
    const finding = { ...validFinding, evidence: { ...validFinding.evidence, proof_of_concept: '' } };
    const result = gate2Evidence(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with placeholder proof_of_concept', () => {
    const finding = { ...validFinding, evidence: { ...validFinding.evidence, proof_of_concept: 'TODO' } };
    const result = gate2Evidence(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding missing request', () => {
    const finding = { ...validFinding, evidence: { proof_of_concept: 'poc', response: 'res' } };
    const result = gate2Evidence(finding);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('request'))).toBe(true);
  });

  test('should fail finding missing response', () => {
    const finding = { ...validFinding, evidence: { proof_of_concept: 'poc', request: 'req' } };
    const result = gate2Evidence(finding);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('response'))).toBe(true);
  });

  test('should reject placeholder values', () => {
    const placeholders = ['tbd', 'n/a', 'na', 'none', 'placeholder', 'xxx', 'tbc', 'TODO'];
    placeholders.forEach(placeholder => {
      const finding = { ...validFinding, evidence: { ...validFinding.evidence, proof_of_concept: placeholder } };
      const result = gate2Evidence(finding);
      expect(result.passed).toBe(false);
    });
  });
});

// ============================================================================
// GATE 3: TECHNICAL ACCURACY VALIDATION TESTS
// ============================================================================

describe('Gate 3: Technical Accuracy Validation', () => {
  test('should pass finding with valid CVSS score and matching severity', () => {
    const result = gate3Technical(validFinding);
    expect(result.passed).toBe(true);
  });

  test('should fail finding with invalid CVSS score (negative)', () => {
    const finding = { ...validFinding, cvss_score: -1 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with CVSS score out of range', () => {
    const finding = { ...validFinding, cvss_score: 10.5 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with invalid CVSS vector', () => {
    const finding = { ...validFinding, cvss_vector: 'INVALID' };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with CVSS version mismatch', () => {
    const finding = { ...validFinding, cvss_vector: 'CVSS:2.0/AV:N/AC:L' };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with mismatched severity and CVSS score (High severity but Low score)', () => {
    const finding = { ...validFinding, severity: 'High', cvss_score: 3.0 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should pass finding with Info severity and 0 score', () => {
    const finding = { ...validFinding, severity: 'Info', cvss_score: 0 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(true);
  });

  test('should validate Critical severity (9.0-10.0)', () => {
    const finding = { ...validFinding, severity: 'Critical', cvss_score: 9.5 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(true);
  });

  test('should fail Critical severity with Low CVSS score', () => {
    const finding = { ...validFinding, severity: 'Critical', cvss_score: 2.0 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should validate Medium severity (4.0-6.9)', () => {
    const finding = { ...validFinding, severity: 'Medium', cvss_score: 5.5 };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(true);
  });

  test('should reject placeholder description', () => {
    const finding = { ...validFinding, description: 'todo' };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });

  test('should reject short description', () => {
    const finding = { ...validFinding, description: 'Bad' };
    const result = gate3Technical(finding);
    expect(result.passed).toBe(false);
  });
});

// ============================================================================
// GATE 4: REMEDIATION VALIDATION TESTS
// ============================================================================

describe('Gate 4: Remediation Validation', () => {
  test('should pass finding with complete remediation', () => {
    const result = gate4Remediation(validFinding);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail finding missing remediation description', () => {
    const finding = { ...validFinding, remediation: { effort: '2-4 hours' } };
    const result = gate4Remediation(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with placeholder remediation', () => {
    const finding = { ...validFinding, remediation: { ...validFinding.remediation, description: 'TBD' } };
    const result = gate4Remediation(finding);
    expect(result.passed).toBe(false);
  });

  test('should fail finding with invalid effort value', () => {
    const finding = { ...validFinding, remediation: { ...validFinding.remediation, effort: 'forever' } };
    const result = gate4Remediation(finding);
    expect(result.passed).toBe(false);
  });

  test('should pass with "0 hours" effort for informational finding', () => {
    const finding = { ...validFinding, remediation: { ...validFinding.remediation, effort: '0 hours' } };
    const result = gate4Remediation(finding);
    expect(result.passed).toBe(true);
  });

  test('should accept effort with additional context', () => {
    const finding = { ...validFinding, remediation: { ...validFinding.remediation, effort: '2-4 hours (plus a firewall rule change)' } };
    const result = gate4Remediation(finding);
    expect(result.passed).toBe(true);
  });

  test('should validate all valid effort prefixes', () => {
    const validEfforts = ['0 hours', '1-2 hours', '2-4 hours', '4-8 hours', '1-3 days', '3+ days'];
    validEfforts.forEach(effort => {
      const finding = { ...validFinding, remediation: { ...validFinding.remediation, effort } };
      const result = gate4Remediation(finding);
      expect(result.passed).toBe(true);
    });
  });
});

// ============================================================================
// FULL PIPELINE TESTS
// ============================================================================

describe('Full Validation Pipeline', () => {
  test('should pass completely valid finding', () => {
    const result = validateFinding(validFinding);
    expect(result.valid).toBe(true);
    expect(result.failedAt).toBe(null);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail at Gate 1 and report gate 1 errors', () => {
    const finding = { ...validFinding, finding_id: 'BAD' };
    const result = validateFinding(finding);
    expect(result.valid).toBe(false);
    expect(result.failedAt).toBe('Format');
  });

  test('should fail at Gate 2 even if Gate 1 passes', () => {
    const finding = { ...validFinding, evidence: {} };
    const result = validateFinding(finding);
    expect(result.valid).toBe(false);
    expect(result.failedAt).toBe('Evidence');
  });

  test('should fail at Gate 3 if CVSS mismatch', () => {
    const finding = { ...validFinding, severity: 'Low', cvss_score: 8.5 };
    const result = validateFinding(finding);
    expect(result.valid).toBe(false);
    expect(result.failedAt).toBe('Technical Accuracy');
  });

  test('should fail at Gate 4 if effort missing', () => {
    const finding = { ...validFinding, remediation: { description: 'Fix it' } };
    const result = validateFinding(finding);
    expect(result.valid).toBe(false);
    expect(result.failedAt).toBe('Remediation');
  });

  test('should validate array of findings', () => {
    const findings = [validFinding, validFinding];
    const result = validateAll(findings);
    expect(result.validated).toHaveLength(2);
    expect(result.rejected).toHaveLength(0);
  });

  test('should reject invalid findings in batch', () => {
    const badFinding = { ...validFinding, finding_id: 'BAD' };
    const findings = [validFinding, badFinding];
    const result = validateAll(findings);
    expect(result.validated).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].failedAt).toBe('Format');
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge Cases', () => {
  test('should handle findings with optional fields', () => {
    const finding = { ...validFinding };
    delete finding.affected_component;
    const result = validateFinding(finding);
    expect(result.valid).toBe(true);
  });

  test('should handle finding with null evidence object', () => {
    const finding = { ...validFinding, evidence: null };
    const result = validateFinding(finding);
    expect(result.valid).toBe(false);
  });

  test('should handle very long descriptions (within limit)', () => {
    const finding = { ...validFinding, description: 'A'.repeat(5000) };
    const result = validateFinding(finding);
    expect(result.valid).toBe(true);
  });

  test('should reject description exceeding max length', () => {
    const finding = { ...validFinding, description: 'A'.repeat(6001) };
    const result = validateFinding(finding);
    expect(result.valid).toBe(false);
  });

  test('should handle all severity levels', () => {
    const severities = ['Critical', 'High', 'Medium', 'Low', 'Info'];
    severities.forEach(severity => {
      const finding = { ...validFinding, severity, cvss_score: 5.5 };
      // Don't validate score matching for this test, just check structure
      expect(gate1Format(finding).passed).toBe(severity === 'Medium');
    });
  });
});
