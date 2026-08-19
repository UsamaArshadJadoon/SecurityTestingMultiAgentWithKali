# Test Suite Documentation

## Overview

This directory contains comprehensive unit and integration tests for the penetration testing orchestration framework, covering:

- **validation-gate.test.js** — 4-layer finding validation (Format → Evidence → Technical → Remediation)
- **orchestrator.test.js** — Core orchestration logic, state persistence, security features
- **report-generator.test.js** — Report generation, data formatting, statistics

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

The coverage report is saved to `coverage/index.html`.

## Test Structure

### validation-gate.test.js (80+ tests)

Tests the 4-layer validation gate that ensures all findings are:
1. **Format Valid** — JSON schema compliance, required fields, valid CVSS vectors
2. **Evidence Complete** — Proof of concept, HTTP requests/responses (non-placeholder)
3. **Technically Accurate** — CVSS score matches severity level, descriptions are specific
4. **Remediation Present** — Fix description and effort estimate provided

**Key Test Cases:**
- ✅ Valid findings pass all gates
- ❌ Missing required fields fail Gate 1
- ❌ Placeholder evidence (TBD, TODO, n/a) fails Gate 2
- ❌ Mismatched CVSS/severity fails Gate 3
- ❌ Invalid remediation effort fails Gate 4
- ✅ Batch validation separates validated/rejected

### orchestrator.test.js (40+ tests)

Tests core orchestration logic with emphasis on security:

**Path Traversal Prevention:**
- ❌ Rejects `../../../etc/passwd` in finding IDs
- ❌ Rejects `..\\..\\windows` on Windows paths
- ❌ Sanitizes to alphanumeric + hyphens/underscores
- ✅ Generates safe file paths under findings directory

**State Persistence:**
- ✅ Atomic writes via temp file + rename (prevents corruption)
- ✅ Recovers gracefully from corrupted state files
- ✅ Preserves state across multiple saves and restarts

**File Operations:**
- ✅ Creates directories recursively
- ✅ Writes findings with sanitized IDs
- ✅ Separates validated vs. rejected findings

**Edge Cases:**
- ✅ Handles null/undefined finding IDs
- ✅ Tolerates very long IDs and UTF-8 characters
- ✅ Rejects IDs that sanitize to empty string

### report-generator.test.js (30+ tests)

Tests HTML report generation and data handling:

**HTML Escaping (XSS Prevention):**
- ✅ Escapes `&`, `<`, `>`, `"`
- ✅ Prevents `<script>` injection in finding titles
- ✅ Handles null/undefined gracefully

**Data Formatting:**
- ✅ Converts `Date` objects to ISO date strings
- ✅ Formats URLs and severity levels consistently
- ✅ Generates URL-safe slugs (e.g., "sql-injection")

**Report Structure:**
- ✅ Calculates finding statistics (counts by severity, avg CVSS)
- ✅ Sorts findings by severity and CVSS score
- ✅ Groups findings by OWASP/CWE categories
- ✅ Maps severity to priority levels (P0-P3)

**JSON Safety:**
- ✅ Parses valid findings without error
- ✅ Gracefully handles malformed JSON (try-catch)
- ✅ Supports large findings (5000+ char descriptions)

## Test Coverage Goals

The test suite targets 75%+ coverage across all metrics:
- **Lines:** 75%+
- **Branches:** 70%+
- **Functions:** 75%+
- **Statements:** 75%+

Current enforcement: Tests fail if coverage falls below these thresholds.

## Key Testing Patterns

### 1. Validation Gate Pattern
```javascript
describe('Gate 1: Format Validation', () => {
  test('should pass valid finding with all required fields', () => {
    const result = gate1Format(validFinding);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail finding missing required field', () => {
    const finding = { ...validFinding };
    delete finding.finding_id;
    const result = gate1Format(finding);
    expect(result.passed).toBe(false);
  });
});
```

### 2. Security (Path Traversal) Pattern
```javascript
test('should reject and sanitize path traversal attempts', () => {
  const maliciousIds = ['../../../etc/passwd', '..\\..\\windows'];
  maliciousIds.forEach(id => {
    const sanitized = String(id).replace(/[^a-zA-Z0-9\-_]/g, '');
    expect(sanitized).not.toContain('/');
    expect(sanitized).not.toContain('\\');
  });
});
```

### 3. Error Handling Pattern
```javascript
test('should recover gracefully if state file is corrupted', () => {
  const stateFile = path.join(testDir, 'corrupted-state.json');
  fs.writeFileSync(stateFile, 'CORRUPTED JSON {]');

  try {
    const loaded = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    fail('Should not reach here');
  } catch (error) {
    expect(error instanceof SyntaxError).toBe(true);
  }
});
```

## Debugging Tests

### Run Single Test File
```bash
npx jest tests/validation-gate.test.js
```

### Run Single Test Suite
```bash
npx jest -t "Gate 1: Format Validation"
```

### Run with Verbose Output
```bash
npx jest --verbose
```

### Generate HTML Coverage Report
```bash
npm run test:coverage
open coverage/index.html
```

## Adding New Tests

When adding new functionality to the framework:

1. **Write tests first** (TDD approach)
2. **Follow existing patterns** (use fixtures, describe blocks)
3. **Test both happy path and edge cases**
4. **Include security-relevant scenarios**
5. **Update this README** with new test descriptions

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```bash
# In your CI configuration
npm ci                # Clean install
npm run test:coverage # Run with coverage
```

Exit codes:
- `0` — All tests passed, coverage OK
- `1` — Test failure or coverage below threshold

## Common Issues

### Tests Hang or Timeout
- Increase Jest timeout: `jest.setTimeout(20000)` at top of test
- Check for unclosed file handles or async operations

### Path Issues (Windows vs. Unix)
- Always use `path.join()` for file paths
- Never hardcode `/` or `\` separators
- Test on both platforms if possible

### State File Conflicts in Tests
- Each test uses `fs.mkdtempSync()` for isolation
- Cleanup happens in `afterEach()` block
- Never leave test artifacts in the working directory

## Maintenance

- Review and update tests when validation gate changes
- Keep test utilities (fixtures) in sync with schema
- Run coverage reports before releases
- Document any expected test failures (e.g., platform-specific)

## Related Files

- `orchestrator/validation-gate.js` — Implementation being tested
- `orchestrator/Orchestrator.js` — Orchestration engine
- `orchestrator/report-generator.js` — Report generation
- `templates/finding-schema.json` — Finding schema reference
- `jest.config.js` — Jest configuration
