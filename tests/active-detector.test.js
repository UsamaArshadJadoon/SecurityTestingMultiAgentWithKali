/**
 * ACTIVE VULNERABILITY DETECTOR TESTS
 *
 * Tests ACTUAL vulnerability detection with real findings
 */

const {
  ActiveVulnerabilityDetector,
  AuthenticationDetector,
  CryptoDetector,
  APIDetector
} = require('../orchestrator/active-vulnerability-detector');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.setTimeout(20000);

describe('Active Vulnerability Detector', () => {
  let detector;

  beforeEach(() => {
    jest.clearAllMocks();
    detector = new ActiveVulnerabilityDetector(mockLogger);
  });

  // =========================================================================
  // AUTHENTICATION DETECTOR TESTS
  // =========================================================================

  describe('Authentication Detector - Real Findings', () => {
    test('should detect weak password policy', async () => {
      const results = await detector.detectors.auth.detect('src/');

      const passwordIssues = results.filter(f => f.type.includes('Password'));
      expect(passwordIssues.length).toBeGreaterThan(0);
      expect(passwordIssues[0].file).toBeDefined();
      expect(passwordIssues[0].line).toBeDefined();
      expect(passwordIssues[0].code).toBeDefined();
    });

    test('should detect insecure auth flow vulnerabilities', async () => {
      const results = await detector.detectors.auth.detect('src/');

      const authFlow = results.filter(f => f.type.includes('HTTP') || f.type.includes('CSRF'));
      expect(authFlow.length).toBeGreaterThan(0);
      authFlow.forEach(f => {
        expect(f.severity).toBeDefined();
        expect(f.remediation).toBeDefined();
      });
    });

    test('should detect session vulnerabilities', async () => {
      const results = await detector.detectors.auth.detect('src/');

      const sessionIssues = results.filter(f => f.type.includes('Session'));
      expect(sessionIssues.length).toBeGreaterThan(0);
      sessionIssues.forEach(f => {
        expect(f.code).toContain('session');
        expect(f.remediation).toBeDefined();
      });
    });

    test('should detect JWT vulnerabilities', async () => {
      const results = await detector.detectors.auth.detect('src/');

      const jwtIssues = results.filter(f => f.type.includes('JWT') || f.type.includes('Algorithm'));
      expect(jwtIssues.length).toBeGreaterThan(0);
      jwtIssues.forEach(f => {
        expect(f.severity).toBe('CRITICAL');
      });
    });

    test('should detect missing MFA', async () => {
      const results = await detector.detectors.auth.detect('src/');

      const mfaIssues = results.filter(f => f.type.includes('MFA'));
      expect(mfaIssues.length).toBeGreaterThan(0);
    });

    test('should detect insecure password storage', async () => {
      const results = await detector.detectors.auth.detect('src/');

      const storageIssues = results.filter(f => f.type.includes('Storage') || f.type.includes('MD5') || f.type.includes('Plaintext'));
      expect(storageIssues.length).toBeGreaterThan(0);
      storageIssues.forEach(f => {
        expect(f.severity).toBe('CRITICAL');
      });
    });

    test('should provide file and line numbers', async () => {
      const results = await detector.detectors.auth.detect('src/');

      results.forEach(f => {
        expect(f.file).toBeDefined();
        expect(typeof f.line).toBe('number');
        expect(f.code).toBeDefined();
        expect(f.remediation).toBeDefined();
      });
    });
  });

  // =========================================================================
  // CRYPTOGRAPHY DETECTOR TESTS
  // =========================================================================

  describe('Cryptography Detector - Real Findings', () => {
    test('should detect weak encryption algorithms', async () => {
      const results = await detector.detectors.crypto.detect('src/');

      const weakAlgo = results.filter(f => f.type.includes('DES') || f.type.includes('RC4'));
      expect(weakAlgo.length).toBeGreaterThan(0);
      weakAlgo.forEach(f => {
        expect(f.severity).toBe('CRITICAL');
        expect(f.code).toBeDefined();
      });
    });

    test('should detect weak RNG usage', async () => {
      const results = await detector.detectors.crypto.detect('src/');

      const rngIssues = results.filter(f => f.type.includes('Math.random') || f.type.includes('Predictable'));
      expect(rngIssues.length).toBeGreaterThan(0);
      rngIssues.forEach(f => {
        expect(f.severity).toBe('CRITICAL');
        expect(f.code).toContain('Math.random');
      });
    });

    test('should detect key management issues', async () => {
      const results = await detector.detectors.crypto.detect('src/');

      const keyIssues = results.filter(f => f.type.includes('Key') || f.type.includes('Hardcoded'));
      expect(keyIssues.length).toBeGreaterThan(0);
      keyIssues.forEach(f => {
        expect(f.severity).toMatch(/CRITICAL|HIGH/);
      });
    });

    test('should detect missing data encryption', async () => {
      const results = await detector.detectors.crypto.detect('src/');

      const encryptIssues = results.filter(f => f.type.includes('Unencrypted'));
      expect(encryptIssues.length).toBeGreaterThan(0);
      encryptIssues.forEach(f => {
        expect(f.severity).toBe('CRITICAL');
      });
    });

    test('should detect TLS/SSL misconfiguration', async () => {
      const results = await detector.detectors.crypto.detect('src/');

      const tlsIssues = results.filter(f => f.type.includes('HTTP') || f.type.includes('HSTS') || f.type.includes('TLS'));
      expect(tlsIssues.length).toBeGreaterThan(0);
    });

    test('should detect insecure hashing', async () => {
      const results = await detector.detectors.crypto.detect('src/');

      const hashIssues = results.filter(f => f.type.includes('Hash') || f.type.includes('Salt'));
      expect(hashIssues.length).toBeGreaterThan(0);
      hashIssues.forEach(f => {
        expect(f.remediation).toContain('bcrypt');
      });
    });
  });

  // =========================================================================
  // API DETECTOR TESTS
  // =========================================================================

  describe('API Detector - Real Findings', () => {
    test('should detect missing authentication', async () => {
      const results = await detector.detectors.api.detect('src/');

      const authIssues = results.filter(f => f.type.includes('Unauthenticated') || f.type.includes('Bearer'));
      expect(authIssues.length).toBeGreaterThan(0);
      authIssues.forEach(f => {
        expect(f.severity).toBe('CRITICAL');
      });
    });

    test('should detect IDOR vulnerabilities', async () => {
      const results = await detector.detectors.api.detect('src/');

      const idorIssues = results.filter(f => f.type.includes('IDOR'));
      expect(idorIssues.length).toBeGreaterThan(0);
      idorIssues.forEach(f => {
        expect(f.code).toContain('req.params.id');
      });
    });

    test('should detect privilege escalation', async () => {
      const results = await detector.detectors.api.detect('src/');

      const privIssues = results.filter(f => f.type.includes('Privilege') || f.type.includes('Admin'));
      expect(privIssues.length).toBeGreaterThan(0);
    });

    test('should detect data exposure in API responses', async () => {
      const results = await detector.detectors.api.detect('src/');

      const dataExp = results.filter(f => f.type.includes('Response') || f.type.includes('Exposed'));
      expect(dataExp.length).toBeGreaterThan(0);
    });

    test('should detect input validation gaps', async () => {
      const results = await detector.detectors.api.detect('src/');

      const validIssues = results.filter(f => f.type.includes('Validation') || f.type.includes('Input'));
      expect(validIssues.length).toBeGreaterThan(0);
    });

    test('should include file, line, and remediation', async () => {
      const results = await detector.detectors.api.detect('src/');

      results.forEach(f => {
        expect(f.file).toBeDefined();
        expect(f.line).toBeGreaterThan(0);
        expect(f.code).toBeDefined();
        expect(f.remediation).toBeDefined();
      });
    });
  });

  // =========================================================================
  // ACTIVE DETECTOR ORCHESTRATOR TESTS
  // =========================================================================

  describe('Active Detector Orchestrator', () => {
    test('should detect all vulnerabilities', async () => {
      const results = await detector.detectAll('src/');

      expect(results.total_findings).toBeGreaterThan(0);
      expect(results.critical).toBeGreaterThan(0);
      expect(results.high).toBeGreaterThan(0);
    });

    test('should categorize findings', async () => {
      const results = await detector.detectAll('src/');

      expect(results.findings_by_category.authentication).toBeDefined();
      expect(results.findings_by_category.cryptography).toBeDefined();
      expect(results.findings_by_category.api).toBeDefined();
    });

    test('should calculate severity distribution', async () => {
      const results = await detector.detectAll('src/');

      const criticalCount = results.critical;
      const highCount = results.high;

      expect(criticalCount).toBeGreaterThanOrEqual(0);
      expect(highCount).toBeGreaterThanOrEqual(0);
      expect(criticalCount + highCount).toBeLessThanOrEqual(results.total_findings);
    });

    test('should generate detailed report', async () => {
      const results = await detector.detectAll('src/');
      const report = await detector.generateDetailedReport(results);

      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.summary.overall_risk).toMatch(/CRITICAL|HIGH|MEDIUM/);
      expect(report.remediation_steps).toBeDefined();
      expect(Array.isArray(report.remediation_steps)).toBe(true);
    });

    test('should provide actionable remediation', async () => {
      const results = await detector.detectAll('src/');
      const report = await detector.generateDetailedReport(results);

      report.remediation_steps.forEach(step => {
        expect(step.file).toBeDefined();
        expect(step.line).toBeDefined();
        expect(step.issue).toBeDefined();
        expect(step.fix).toBeDefined();
        expect(step.severity).toBeDefined();
      });
    });

    test('should sort by severity', async () => {
      const results = await detector.detectAll('src/');
      const report = await detector.generateDetailedReport(results);

      let lastSeverity = -1;
      const severity = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };

      report.remediation_steps.forEach(step => {
        const currentSeverity = severity[step.severity];
        expect(currentSeverity).toBeGreaterThanOrEqual(lastSeverity);
        lastSeverity = currentSeverity;
      });
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Integration - Complete Assessment', () => {
    test('should identify all authentication vulnerabilities', async () => {
      const results = await detector.detectAll('src/');

      const authFindings = results.findings_by_category.authentication;
      expect(authFindings.length).toBeGreaterThan(0);

      const types = new Set(authFindings.map(f => f.type));
      expect(types.size).toBeGreaterThan(1); // Multiple types detected
    });

    test('should identify all cryptography vulnerabilities', async () => {
      const results = await detector.detectAll('src/');

      const cryptoFindings = results.findings_by_category.cryptography;
      expect(cryptoFindings.length).toBeGreaterThan(0);
    });

    test('should identify all API vulnerabilities', async () => {
      const results = await detector.detectAll('src/');

      const apiFindings = results.findings_by_category.api;
      expect(apiFindings.length).toBeGreaterThan(0);
    });

    test('should provide fix-all remediation plan', async () => {
      const results = await detector.detectAll('src/');
      const report = await detector.generateDetailedReport(results);

      // All findings should have a fix
      report.remediation_steps.forEach(step => {
        expect(step.fix.length).toBeGreaterThan(0);
        expect(step.fix).not.toContain('undefined');
      });
    });

    test('should rank by severity for prioritization', async () => {
      const results = await detector.detectAll('src/');
      const report = await detector.generateDetailedReport(results);

      const criticalCount = report.remediation_steps.filter(s => s.severity === 'CRITICAL').length;
      const highCount = report.remediation_steps.filter(s => s.severity === 'HIGH').length;

      // Critical should be fixed first
      expect(criticalCount).toBeGreaterThan(0);
    });
  });
});
