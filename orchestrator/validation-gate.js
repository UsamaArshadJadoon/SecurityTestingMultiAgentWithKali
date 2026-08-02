#!/usr/bin/env node

/**
 * VALIDATION GATE
 *
 * Real, deterministic implementation of the framework's 4-layer validation
 * (Format -> Evidence -> Technical Accuracy -> Remediation) against a single
 * finding object. Used by Orchestrator.js before a finding is considered
 * validated and handed to the next agent or the final report — a finding
 * that fails any gate is rejected, not silently dropped.
 *
 * This only checks structure/completeness/internal consistency; it cannot
 * (and does not try to) verify that a finding's claims are factually true
 * against the live target — that verification is the dispatching agent's
 * job before it ever writes the finding JSON.
 */

const path = require('path');
const Ajv = require('ajv');

const schema = require(path.join(__dirname, '..', 'templates', 'finding-schema.json'));
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date-time', true); // accept any string; timestamp format isn't security-relevant here
const validateSchema = ajv.compile(schema);

const CVSS_SEVERITY_RANGES = {
  Critical: [9.0, 10.0],
  High: [7.0, 8.9],
  Medium: [4.0, 6.9],
  Low: [0.1, 3.9],
  Info: [0.0, 0.0],
};

const VALID_EFFORTS = ['1-2 hours', '2-4 hours', '4-8 hours', '1-3 days', '3+ days'];

function isPlaceholder(str) {
  if (str === undefined || str === null) return true;
  const s = String(str).trim().toLowerCase();
  if (s.length < 10) return true;
  return ['todo', 'tbd', 'n/a', 'na', 'none', 'placeholder', 'xxx', 'tbc'].includes(s);
}

// ---- Gate 1: Format ----
function gate1Format(finding) {
  const ok = validateSchema(finding);
  const errors = ok ? [] : (validateSchema.errors || []).map(e => `${e.instancePath || '(root)'} ${e.message}`);
  return { gate: 'Format', passed: ok, errors };
}

// ---- Gate 2: Evidence ----
function gate2Evidence(finding) {
  const errors = [];
  const ev = finding.evidence || {};
  if (isPlaceholder(ev.proof_of_concept)) errors.push('evidence.proof_of_concept is missing, too short, or placeholder text');
  if (isPlaceholder(ev.request)) errors.push('evidence.request is missing, too short, or placeholder text');
  if (isPlaceholder(ev.response)) errors.push('evidence.response is missing, too short, or placeholder text');
  return { gate: 'Evidence', passed: errors.length === 0, errors };
}

// ---- Gate 3: Technical Accuracy ----
function gate3Technical(finding) {
  const errors = [];
  const score = finding.cvss_score;
  const sev = finding.severity;

  if (typeof score !== 'number' || score < 0 || score > 10) {
    errors.push('cvss_score must be a number between 0 and 10');
  }
  if (!/^CVSS:3\.1\//.test(finding.cvss_vector || '')) {
    errors.push('cvss_vector must be a valid CVSS 3.1 vector string (e.g. CVSS:3.1/AV:N/AC:L/...)');
  }
  const range = CVSS_SEVERITY_RANGES[sev];
  if (range && typeof score === 'number' && sev !== 'Info' && (score < range[0] || score > range[1])) {
    errors.push(`severity "${sev}" does not match cvss_score ${score} (expected ${range[0]}-${range[1]} for ${sev})`);
  }
  if (isPlaceholder(finding.description)) {
    errors.push('description is missing, too short, or placeholder text — impact must be specific, not vague');
  }
  return { gate: 'Technical Accuracy', passed: errors.length === 0, errors };
}

// ---- Gate 4: Remediation ----
function gate4Remediation(finding) {
  const errors = [];
  const rem = finding.remediation || {};
  if (isPlaceholder(rem.description)) {
    errors.push('remediation.description is missing, too short, or placeholder text');
  }
  if (!VALID_EFFORTS.includes(rem.effort)) {
    errors.push(`remediation.effort must be one of: ${VALID_EFFORTS.join(', ')}`);
  }
  return { gate: 'Remediation', passed: errors.length === 0, errors };
}

/**
 * Runs all 4 gates in order against a single finding. Stops reporting
 * further gates once one fails (matches the framework's "gate" model —
 * a finding is rejected at the first gate it fails), but always returns
 * the full gate-by-gate detail for logging.
 */
function validateFinding(finding) {
  const gates = [gate1Format(finding), gate2Evidence(finding), gate3Technical(finding), gate4Remediation(finding)];
  const failed = gates.find(g => !g.passed);
  return {
    valid: !failed,
    failedAt: failed ? failed.gate : null,
    errors: failed ? failed.errors : [],
    gates,
  };
}

/**
 * Validates an array of findings, splitting them into validated/rejected.
 * Each rejected entry carries the original finding plus the gate/reasons
 * it failed, so nothing is silently dropped — it's logged as rejected.
 */
function validateAll(findings) {
  const validated = [];
  const rejected = [];
  findings.forEach(finding => {
    const result = validateFinding(finding);
    if (result.valid) {
      validated.push({ ...finding, validation_status: 'validated' });
    } else {
      rejected.push({ finding, failedAt: result.failedAt, errors: result.errors });
    }
  });
  return { validated, rejected };
}

module.exports = { validateFinding, validateAll, gate1Format, gate2Evidence, gate3Technical, gate4Remediation };
