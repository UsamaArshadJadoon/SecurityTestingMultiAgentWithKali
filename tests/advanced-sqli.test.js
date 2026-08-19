/**
 * ADVANCED SQL INJECTION TESTS
 *
 * Tests comprehensive SQL injection detection and exploitation:
 * - Boolean-based detection
 * - Time-based detection
 * - Error-based extraction
 * - Union-based injection
 * - Blind SQL injection
 * - Data exfiltration
 * - Database fingerprinting
 */

const { AdvancedSQLInjection } = require('../orchestrator/advanced-sqli');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.setTimeout(20000);

describe('Advanced SQL Injection Module', () => {
  let sqli;

  beforeEach(() => {
    jest.clearAllMocks();
    sqli = new AdvancedSQLInjection(mockLogger);
  });

  // =========================================================================
  // PAYLOAD TESTS
  // =========================================================================

  describe('Payload Library', () => {
    test('should have boolean-based payloads', () => {
      expect(sqli.payloads.booleanBased).toBeDefined();
      expect(sqli.payloads.booleanBased.length).toBeGreaterThan(0);
      expect(sqli.payloads.booleanBased).toContain("' OR '1'='1");
    });

    test('should have time-based payloads', () => {
      expect(sqli.payloads.timeBased).toBeDefined();
      expect(sqli.payloads.timeBased.length).toBeGreaterThan(0);
      expect(sqli.payloads.timeBased[0]).toContain('SLEEP');
    });

    test('should have error-based payloads', () => {
      expect(sqli.payloads.errorBased).toBeDefined();
      expect(sqli.payloads.errorBased.length).toBeGreaterThan(0);
    });

    test('should have union-based payloads', () => {
      expect(sqli.payloads.unionBased).toBeDefined();
      expect(sqli.payloads.unionBased.length).toBeGreaterThan(0);
      expect(sqli.payloads.unionBased[0]).toContain('UNION');
    });

    test('should have blind SQL injection payloads', () => {
      expect(sqli.payloads.blindSQLi).toBeDefined();
      expect(sqli.payloads.blindSQLi.length).toBeGreaterThan(0);
    });

    test('should have stacked query payloads', () => {
      expect(sqli.payloads.stackedQueries).toBeDefined();
      expect(sqli.payloads.stackedQueries.length).toBeGreaterThan(0);
    });

    test('should have second-order payloads', () => {
      expect(sqli.payloads.secondOrder).toBeDefined();
      expect(sqli.payloads.secondOrder.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // DETECTION TESTS
  // =========================================================================

  describe('SQL Injection Detection', () => {
    test('should detect SQL injection vulnerability', async () => {
      const result = await sqli.detect('http://example.com/user.php', 'id');

      expect(result.url).toBe('http://example.com/user.php');
      expect(result.parameter).toBe('id');
      expect(result.severity).toBe('CRITICAL');
    });

    test('should test boolean-based injection', async () => {
      const result = await sqli._testBooleanBased('http://example.com', 'id');

      expect(result.vulnerable).toBeDefined();
      if (result.vulnerable) {
        expect(result.payloads).toBeDefined();
        expect(result.payloads.length).toBeGreaterThan(0);
      }
    });

    test('should test time-based injection', async () => {
      const result = await sqli._testTimeBased('http://example.com', 'id');

      expect(result.vulnerable).toBeDefined();
      if (result.vulnerable) {
        expect(result.timeDifference).toBeDefined();
        expect(result.timeDifference).toBeGreaterThanOrEqual(0);
      }
    });

    test('should test error-based injection', async () => {
      const result = await sqli._testErrorBased('http://example.com', 'id');

      expect(result.vulnerable).toBeDefined();
      if (result.vulnerable) {
        expect(result.database).toBeDefined();
      }
    });

    test('should test union-based injection', async () => {
      const result = await sqli._testUnionBased('http://example.com', 'id');

      expect(result.vulnerable).toBeDefined();
      if (result.vulnerable) {
        expect(result.columnCount).toBeDefined();
      }
    });

    test('should test blind SQL injection', async () => {
      const result = await sqli._testBlindSQLi('http://example.com', 'id');

      expect(result.vulnerable).toBeDefined();
      if (result.vulnerable) {
        expect(Array.isArray(result.extractedData)).toBe(true);
      }
    });
  });

  // =========================================================================
  // EXPLOITATION TESTS
  // =========================================================================

  describe('SQL Injection Exploitation', () => {
    test('should exploit union-based injection', async () => {
      const result = await sqli.exploit('http://example.com', 'id', 'union');

      expect(result.url).toBe('http://example.com');
      expect(result.parameter).toBe('id');
      expect(result.method).toBe('union');
      expect(result.success).toBe(true);
      expect(result.payload).toBeDefined();
      expect(Array.isArray(result.extracted)).toBe(true);
    });

    test('should exploit time-based injection', async () => {
      const result = await sqli.exploit('http://example.com', 'id', 'time-based');

      expect(result.method).toBe('time-based');
      expect(result.success).toBe(true);
    });

    test('should exploit boolean-based injection', async () => {
      const result = await sqli.exploit('http://example.com', 'id', 'boolean-based');

      expect(result.method).toBe('boolean-based');
      expect(result.success).toBe(true);
    });

    test('should exploit error-based injection', async () => {
      const result = await sqli.exploit('http://example.com', 'id', 'error-based');

      expect(result.method).toBe('error-based');
      expect(result.success).toBe(true);
      expect(result.extracted.length).toBeGreaterThan(0);
    });

    test('should handle unknown exploitation method', async () => {
      const result = await sqli.exploit('http://example.com', 'id', 'unknown');

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // DATA EXTRACTION TESTS
  // =========================================================================

  describe('Data Extraction', () => {
    test('should extract database information', async () => {
      const result = await sqli.getDatabase('http://example.com', 'id');

      expect(result.version).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.database).toBeDefined();
    });

    test('should extract table names', async () => {
      const result = await sqli.getTables('http://example.com', 'id', 'target_db');

      expect(result.database).toBe('target_db');
      expect(Array.isArray(result.tables)).toBe(true);
      expect(result.tables.length).toBeGreaterThan(0);
      expect(result.tables[0].name).toBeDefined();
      expect(result.tables[0].rows).toBeDefined();
    });

    test('should extract table structure', async () => {
      const result = await sqli.getTableStructure('http://example.com', 'id', 'users');

      expect(result.table).toBe('users');
      expect(Array.isArray(result.columns)).toBe(true);
      expect(result.columns.length).toBeGreaterThan(0);
      expect(result.columns[0].name).toBeDefined();
      expect(result.columns[0].type).toBeDefined();
    });

    test('should extract all data from table', async () => {
      const result = await sqli.extractAllData('http://example.com', 'id', 'target_db', 'users');

      expect(result.database).toBe('target_db');
      expect(result.table).toBe('users');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.total_rows).toBeDefined();
    });
  });

  // =========================================================================
  // DATABASE FINGERPRINTING TESTS
  // =========================================================================

  describe('Database Fingerprinting', () => {
    test('should have database signatures', () => {
      expect(sqli.databaseSignatures).toBeDefined();
      expect(sqli.databaseSignatures.mysql).toBeDefined();
      expect(sqli.databaseSignatures.mssql).toBeDefined();
      expect(sqli.databaseSignatures.postgresql).toBeDefined();
      expect(sqli.databaseSignatures.sqlite).toBeDefined();
    });

    test('should identify MySQL database', () => {
      const signatures = sqli.databaseSignatures.mysql;

      expect(signatures).toContain('You have an error in your SQL syntax');
      expect(signatures.length).toBeGreaterThan(0);
    });

    test('should identify MSSQL database', () => {
      const signatures = sqli.databaseSignatures.mssql;

      expect(signatures).toContain('Syntax error');
      expect(signatures.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SECOND-ORDER INJECTION TESTS
  // =========================================================================

  describe('Second-Order SQL Injection', () => {
    test('should detect second-order SQL injection', async () => {
      const result = await sqli.testSecondOrder('http://example.com', 'id');

      expect(result.vulnerable).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.payloads).toBeDefined();
      expect(Array.isArray(result.payloads)).toBe(true);
    });
  });

  // =========================================================================
  // REPORTING TESTS
  // =========================================================================

  describe('Report Generation', () => {
    test('should generate comprehensive report', async () => {
      const detectionResults = {
        url: 'http://example.com',
        parameter: 'id',
        vulnerable: true,
        methods: ['Boolean-based', 'Time-based'],
        database: 'MySQL',
        severity: 'CRITICAL',
        confidence: 75
      };

      const exploitResults = {
        method: 'union',
        success: true,
        extracted: [{ username: 'admin', password: 'admin123' }]
      };

      const report = await sqli.generateReport(detectionResults, exploitResults);

      expect(report.summary).toBeDefined();
      expect(report.summary.vulnerable).toBe(true);
      expect(report.summary.severity).toBe('CRITICAL');
      expect(report.detection).toBeDefined();
      expect(report.exploitation).toBeDefined();
      expect(Array.isArray(report.remediation)).toBe(true);
      expect(report.remediation.length).toBeGreaterThan(0);
    });

    test('should include remediation guidance', async () => {
      const detectionResults = {
        url: 'http://example.com',
        vulnerable: true,
        methods: ['Boolean-based'],
        severity: 'CRITICAL',
        confidence: 80
      };

      const report = await sqli.generateReport(detectionResults, {});

      expect(report.remediation).toContain('Use parameterized queries/prepared statements');
      expect(report.remediation).toContain('Input validation and sanitization');
      expect(report.remediation).toContain('Apply principle of least privilege to database accounts');
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Integration Tests', () => {
    test('should support complete assessment workflow', async () => {
      // Detect vulnerability
      const detection = await sqli.detect('http://example.com', 'id');
      expect(detection.url).toBeDefined();

      // Exploit vulnerability
      if (detection.vulnerable) {
        const exploitation = await sqli.exploit('http://example.com', 'id', 'union');
        expect(exploitation.success).toBe(true);

        // Extract database info
        const dbInfo = await sqli.getDatabase('http://example.com', 'id');
        expect(dbInfo.database).toBeDefined();

        // Extract tables
        const tables = await sqli.getTables('http://example.com', 'id', dbInfo.database);
        expect(tables.tables.length).toBeGreaterThan(0);

        // Generate report
        const report = await sqli.generateReport(detection, exploitation);
        expect(report.summary).toBeDefined();
      }
    });
  });
});
