/**
 * CODE QUALITY & SECURITY SCANNER TESTS
 *
 * Tests comprehensive code analysis:
 * - Security vulnerability detection
 * - Complexity analysis
 * - Code duplication detection
 * - Test coverage analysis
 * - Dependency vulnerability scanning
 * - SonarQube integration
 * - Report generation
 */

const { CodeQualityScanner } = require('../orchestrator/code-quality-scanner');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.setTimeout(20000);

describe('Code Quality & Security Scanner', () => {
  let scanner;

  beforeEach(() => {
    jest.clearAllMocks();
    scanner = new CodeQualityScanner(mockLogger);
  });

  // =========================================================================
  // SECURITY PATTERN TESTS
  // =========================================================================

  describe('Security Pattern Detection', () => {
    test('should have hardcoded secrets patterns', () => {
      expect(scanner.securityPatterns.hardcodedSecrets).toBeDefined();
      expect(Array.isArray(scanner.securityPatterns.hardcodedSecrets)).toBe(true);
      expect(scanner.securityPatterns.hardcodedSecrets.length).toBeGreaterThan(0);
    });

    test('should have SQL injection patterns', () => {
      expect(scanner.securityPatterns.sqlInjection).toBeDefined();
      expect(Array.isArray(scanner.securityPatterns.sqlInjection)).toBe(true);
    });

    test('should have XSS vulnerability patterns', () => {
      expect(scanner.securityPatterns.xssVulnerabilities).toBeDefined();
      expect(Array.isArray(scanner.securityPatterns.xssVulnerabilities)).toBe(true);
      expect(scanner.securityPatterns.xssVulnerabilities[0].toString()).toContain('innerHTML');
    });

    test('should have path traversal patterns', () => {
      expect(scanner.securityPatterns.pathTraversal).toBeDefined();
      expect(scanner.securityPatterns.pathTraversal.length).toBeGreaterThan(0);
    });

    test('should have command injection patterns', () => {
      expect(scanner.securityPatterns.commandInjection).toBeDefined();
      expect(scanner.securityPatterns.commandInjection.length).toBeGreaterThan(0);
    });

    test('should have insecure crypto patterns', () => {
      expect(scanner.securityPatterns.insecureCrypto).toBeDefined();
      expect(scanner.securityPatterns.insecureCrypto.length).toBeGreaterThan(0);
    });

    test('should have insecure random patterns', () => {
      expect(scanner.securityPatterns.insecureRandom).toBeDefined();
      expect(scanner.securityPatterns.insecureRandom.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // COMPLEXITY THRESHOLD TESTS
  // =========================================================================

  describe('Complexity Thresholds', () => {
    test('should define cyclomatic complexity threshold', () => {
      expect(scanner.complexityThresholds.cyclomatic).toBeDefined();
      expect(scanner.complexityThresholds.cyclomatic).toBeGreaterThan(0);
      expect(scanner.complexityThresholds.cyclomatic).toBe(10);
    });

    test('should define cognitive complexity threshold', () => {
      expect(scanner.complexityThresholds.cognitive).toBeDefined();
      expect(scanner.complexityThresholds.cognitive).toBeGreaterThan(0);
      expect(scanner.complexityThresholds.cognitive).toBe(15);
    });

    test('should define maintainability index threshold', () => {
      expect(scanner.complexityThresholds.maintainability).toBeDefined();
      expect(scanner.complexityThresholds.maintainability).toBeGreaterThan(0);
      expect(scanner.complexityThresholds.maintainability).toBe(80);
    });
  });

  // =========================================================================
  // SCANNING TESTS
  // =========================================================================

  describe('Code Scanning', () => {
    test('should scan source code', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.path).toBe('src/app.js');
      expect(results.timestamp).toBeDefined();
      expect(results.summary).toBeDefined();
    });

    test('should return summary statistics', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.summary.total_issues).toBeDefined();
      expect(results.summary.critical).toBeDefined();
      expect(results.summary.high).toBeDefined();
      expect(results.summary.medium).toBeDefined();
      expect(results.summary.low).toBeDefined();
    });

    test('should detect security issues', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.security).toBeDefined();
      expect(Array.isArray(results.security.issues)).toBe(true);
    });

    test('should analyze code complexity', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.complexity).toBeDefined();
      expect(results.complexity.metrics).toBeDefined();
      expect(results.complexity.metrics.lines_of_code).toBeDefined();
      expect(results.complexity.metrics.cyclomatic_complexity).toBeDefined();
    });

    test('should detect code duplication', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.duplication).toBeDefined();
      expect(results.duplication.total_duplicated_lines).toBeDefined();
      expect(results.duplication.duplication_percentage).toBeDefined();
    });

    test('should analyze test coverage', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.coverage).toBeDefined();
      expect(results.coverage.overall).toBeDefined();
      expect(results.coverage.line_coverage).toBeDefined();
      expect(results.coverage.branch_coverage).toBeDefined();
      expect(results.coverage.function_coverage).toBeDefined();
    });

    test('should scan dependencies', async () => {
      const results = await scanner.scan('src/app.js');

      expect(results.dependencies).toBeDefined();
      expect(results.dependencies.total_dependencies).toBeDefined();
      expect(results.dependencies.vulnerabilities).toBeDefined();
      expect(Array.isArray(results.dependencies.vulnerabilities)).toBe(true);
    });
  });

  // =========================================================================
  // SECURITY ISSUE TESTS
  // =========================================================================

  describe('Security Issue Detection', () => {
    test('should detect hardcoded secrets', async () => {
      const results = await scanner._scanSecurity('src/app.js');

      expect(results.issues).toBeDefined();
      expect(Array.isArray(results.issues)).toBe(true);

      const secretIssues = results.issues.filter(i => i.type === 'hardcoded_secrets');
      expect(secretIssues.length).toBeGreaterThan(0);
    });

    test('should detect SQL injection vulnerabilities', async () => {
      const results = await scanner._scanSecurity('src/app.js');

      const sqlIssues = results.issues.filter(i => i.type === 'sql_injection');
      expect(sqlIssues.length).toBeGreaterThan(0);
    });

    test('should detect XSS vulnerabilities', async () => {
      const results = await scanner._scanSecurity('src/app.js');

      const xssIssues = results.issues.filter(i => i.type === 'xss');
      expect(xssIssues.length).toBeGreaterThan(0);
    });

    test('should detect insecure cryptography', async () => {
      const results = await scanner._scanSecurity('src/app.js');

      const cryptoIssues = results.issues.filter(i => i.type === 'insecure_crypto');
      expect(cryptoIssues.length).toBeGreaterThan(0);
    });

    test('should report issue details', async () => {
      const results = await scanner._scanSecurity('src/app.js');

      if (results.issues.length > 0) {
        const issue = results.issues[0];
        expect(issue.type).toBeDefined();
        expect(issue.severity).toBeDefined();
        expect(issue.message).toBeDefined();
        expect(issue.line).toBeDefined();
        expect(issue.file).toBeDefined();
        expect(issue.code).toBeDefined();
      }
    });
  });

  // =========================================================================
  // COMPLEXITY ANALYSIS TESTS
  // =========================================================================

  describe('Complexity Analysis', () => {
    test('should provide complexity metrics', async () => {
      const results = await scanner._analyzeComplexity('src/app.js');

      expect(results.metrics.lines_of_code).toBeDefined();
      expect(results.metrics.functions).toBeDefined();
      expect(results.metrics.classes).toBeDefined();
      expect(results.metrics.cyclomatic_complexity).toBeDefined();
      expect(results.metrics.cognitive_complexity).toBeDefined();
      expect(results.metrics.maintainability_index).toBeDefined();
    });

    test('should identify high complexity functions', async () => {
      const results = await scanner._analyzeComplexity('src/app.js');

      expect(results.high_complexity_functions).toBeDefined();
      expect(Array.isArray(results.high_complexity_functions)).toBe(true);

      if (results.high_complexity_functions.length > 0) {
        const func = results.high_complexity_functions[0];
        expect(func.name).toBeDefined();
        expect(func.cyclomatic).toBeDefined();
        expect(func.cognitive).toBeDefined();
      }
    });

    test('should flag complexity threshold violations', async () => {
      const results = await scanner._analyzeComplexity('src/app.js');

      expect(Array.isArray(results.issues)).toBe(true);
      // Should have issues for high complexity
      const complexityIssues = results.issues.filter(i => i.metric === 'cyclomatic_complexity');
      if (results.metrics.cyclomatic_complexity > scanner.complexityThresholds.cyclomatic) {
        expect(complexityIssues.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // DUPLICATION TESTS
  // =========================================================================

  describe('Code Duplication Detection', () => {
    test('should detect duplicated code', async () => {
      const results = await scanner._detectDuplication('src/app.js');

      expect(results.total_duplicated_lines).toBeDefined();
      expect(results.duplication_percentage).toBeDefined();
      expect(Array.isArray(results.duplicated_blocks)).toBe(true);
    });

    test('should identify duplicate code blocks', async () => {
      const results = await scanner._detectDuplication('src/app.js');

      if (results.duplicated_blocks.length > 0) {
        const block = results.duplicated_blocks[0];
        expect(block.lines).toBeDefined();
        expect(block.occurrences).toBeDefined();
        expect(Array.isArray(block.files)).toBe(true);
        expect(block.severity).toBeDefined();
      }
    });
  });

  // =========================================================================
  // TEST COVERAGE TESTS
  // =========================================================================

  describe('Test Coverage Analysis', () => {
    test('should analyze test coverage', async () => {
      const results = await scanner._analyzeTestCoverage('src/app.js');

      expect(results.overall).toBeDefined();
      expect(results.line_coverage).toBeDefined();
      expect(results.branch_coverage).toBeDefined();
      expect(results.function_coverage).toBeDefined();
      expect(results.statement_coverage).toBeDefined();
    });

    test('should identify uncovered files', async () => {
      const results = await scanner._analyzeTestCoverage('src/app.js');

      expect(Array.isArray(results.uncovered_files)).toBe(true);

      if (results.uncovered_files.length > 0) {
        const file = results.uncovered_files[0];
        expect(file.file).toBeDefined();
        expect(file.coverage).toBeDefined();
      }
    });

    test('should provide coverage recommendations', async () => {
      const results = await scanner._analyzeTestCoverage('src/app.js');

      expect(Array.isArray(results.recommendations)).toBe(true);
      expect(results.recommendations.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // DEPENDENCY SCANNING TESTS
  // =========================================================================

  describe('Dependency Vulnerability Scanning', () => {
    test('should scan dependencies', async () => {
      const results = await scanner._scanDependencies('package.json');

      expect(results.total_dependencies).toBeDefined();
      expect(results.direct_dependencies).toBeDefined();
      expect(results.transitive_dependencies).toBeDefined();
      expect(results.vulnerabilities).toBeDefined();
    });

    test('should identify vulnerable packages', async () => {
      const results = await scanner._scanDependencies('package.json');

      expect(Array.isArray(results.vulnerabilities)).toBe(true);

      if (results.vulnerabilities.length > 0) {
        const vuln = results.vulnerabilities[0];
        expect(vuln.package).toBeDefined();
        expect(vuln.version).toBeDefined();
        expect(vuln.vulnerability).toBeDefined();
        expect(vuln.severity).toBeDefined();
        expect(vuln.cve).toBeDefined();
        expect(vuln.fixed_in).toBeDefined();
      }
    });

    test('should count vulnerability severity levels', async () => {
      const results = await scanner._scanDependencies('package.json');

      expect(results.critical).toBeDefined();
      expect(results.high).toBeDefined();
      expect(results.medium).toBeDefined();
      expect(results.total_vulnerabilities).toBeDefined();
    });
  });

  // =========================================================================
  // SONARQUBE INTEGRATION TESTS
  // =========================================================================

  describe('SonarQube Integration', () => {
    test('should generate SonarQube-compatible report', async () => {
      const scanResults = {
        summary: { total_issues: 10, critical: 1, high: 3 },
        security: { issues: [] },
        complexity: { metrics: { lines_of_code: 5000, cyclomatic_complexity: 8.5, cognitive_complexity: 12 } },
        coverage: { overall: 75 },
        duplication: { duplication_percentage: 2.5 },
        dependencies: { total_dependencies: 50, total_vulnerabilities: 2 }
      };

      const report = await scanner.generateSonarQubeReport(scanResults);

      expect(report.project_key).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.measures).toBeDefined();
    });

    test('should convert issues to SonarQube format', async () => {
      const issues = [
        { type: 'hardcoded_secrets', severity: 'CRITICAL', file: 'config.js', line: 42 },
        { type: 'sql_injection', severity: 'CRITICAL', file: 'db.js', line: 156 }
      ];

      const converted = scanner._convertToSonarFormat(issues);

      expect(Array.isArray(converted)).toBe(true);
      expect(converted[0].key).toBeDefined();
      expect(converted[0].component).toBeDefined();
      expect(converted[0].rule).toBeDefined();
      expect(converted[0].severity).toBeDefined();
    });

    test('should integrate with SonarQube server', async () => {
      const report = await scanner.integrateSonarQube(
        'http://sonarqube.example.com',
        'my-project',
        {}
      );

      expect(report.status).toBe('success');
      expect(report.project_key).toBe('my-project');
      expect(report.report_url).toContain('http://sonarqube.example.com');
      expect(report.metrics).toBeDefined();
    });
  });

  // =========================================================================
  // REPORT GENERATION TESTS
  // =========================================================================

  describe('Report Generation', () => {
    test('should generate HTML report', async () => {
      const scanResults = {
        summary: { total_issues: 10, critical: 1, high: 3, medium: 4, low: 2 },
        security: { issues: [] },
        complexity: { metrics: { lines_of_code: 5000 } },
        coverage: { overall: 75, line_coverage: 70 },
        dependencies: { total_dependencies: 50 }
      };

      const html = await scanner.generateHTMLReport(scanResults, 'report.html');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Code Quality & Security Report');
      expect(html).toContain('10');
      expect(html).toContain('75');
    });

    test('should include all sections in HTML report', async () => {
      const scanResults = {
        summary: { total_issues: 0, critical: 0, high: 0, medium: 0, low: 0 },
        security: { issues: [] },
        complexity: { metrics: { lines_of_code: 1000 } },
        coverage: { overall: 80, line_coverage: 80, branch_coverage: 75, function_coverage: 85 },
        dependencies: { total_dependencies: 10 }
      };

      const html = await scanner.generateHTMLReport(scanResults, 'report.html');

      expect(html).toContain('Security Issues');
      expect(html).toContain('Complexity Metrics');
      expect(html).toContain('Test Coverage');
      expect(html).toContain('Dependency Vulnerabilities');
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Integration Tests', () => {
    test('should support complete scan workflow', async () => {
      const results = await scanner.scan('src/');

      expect(results.path).toBe('src/');
      expect(results.summary.total_issues).toBeDefined();
      expect(results.security).toBeDefined();
      expect(results.complexity).toBeDefined();
      expect(results.duplication).toBeDefined();
      expect(results.coverage).toBeDefined();
      expect(results.dependencies).toBeDefined();
    });

    test('should calculate total issues correctly', async () => {
      const results = await scanner.scan('src/');

      const total = results.summary.critical + results.summary.high +
                   results.summary.medium + results.summary.low;

      expect(total).toBe(results.summary.total_issues);
    });
  });
});
