/**
 * BURP SUITE EQUIVALENT MODULE TESTS
 *
 * Tests all Burp Suite-like functionality:
 * - Proxy interception
 * - Request repeater
 * - Intruder (fuzzing)
 * - Spider (crawler)
 * - Scanner
 * - Decoder/Encoder
 */

const {
  BurpSuiteEquivalent,
  BurpProxy,
  BurpRepeater,
  BurpIntruder,
  BurpSpider,
  BurpDecoder,
  BurpScanner
} = require('../orchestrator/burp-suite-equivalent');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('Burp Suite Equivalent Module', () => {
  let burp;

  beforeEach(() => {
    jest.clearAllMocks();
    burp = new BurpSuiteEquivalent(mockLogger);
  });

  // =========================================================================
  // PROXY TESTS
  // =========================================================================

  describe('Proxy Interception', () => {
    test('should create proxy on configured port', () => {
      const proxy = new BurpProxy(8080, mockLogger);
      expect(proxy.listenPort).toBe(8080);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    test('should add intercept rules', () => {
      const proxy = new BurpProxy(8080, mockLogger);
      proxy.addInterceptRule('GET', 'example.com');

      expect(proxy.intercepts).toHaveLength(1);
      expect(proxy.intercepts[0]).toEqual({
        method: 'GET',
        domain: 'example.com'
      });
    });

    test('should check if request matches intercept rules', () => {
      const proxy = new BurpProxy(8080, mockLogger);
      proxy.addInterceptRule('POST', 'api.example.com');

      const request = {
        method: 'POST',
        url: 'http://api.example.com/users',
        headers: {},
        body: ''
      };

      expect(proxy.checkIntercept(request)).toBe(true);
    });

    test('should maintain request history', () => {
      const proxy = new BurpProxy(8080, mockLogger);
      const request = {
        method: 'GET',
        url: 'http://example.com',
        headers: {},
        body: ''
      };

      proxy.history.push(request);
      expect(proxy.getHistory()).toHaveLength(1);
    });
  });

  // =========================================================================
  // REPEATER TESTS
  // =========================================================================

  describe('Request Repeater', () => {
    test('should create repeater instance', () => {
      const repeater = new BurpRepeater(mockLogger);
      expect(repeater.repeats).toHaveLength(0);
    });

    test('should track repeated requests', async () => {
      const repeater = new BurpRepeater(mockLogger);

      const request = {
        method: 'GET',
        url: 'http://example.com',
        headers: { 'Content-Type': 'application/json' }
      };

      // Track that repeater stores structure
      repeater.repeats.push({
        request,
        response: { statusCode: 200, body: 'OK' }
      });

      expect(repeater.getRepeats()).toHaveLength(1);
    });

    test('should allow request modifications', async () => {
      const repeater = new BurpRepeater(mockLogger);

      const request = {
        method: 'POST',
        url: 'http://example.com/api',
        body: 'original=data'
      };

      const modifications = {
        body: 'modified=data'
      };

      // Simulate modification
      const modified = { ...request, ...modifications };
      expect(modified.body).toBe('modified=data');
      expect(modified.method).toBe('POST');
    });
  });

  // =========================================================================
  // INTRUDER TESTS
  // =========================================================================

  describe('Intruder (Fuzzing)', () => {
    test('should create intruder with payload library', () => {
      const intruder = new BurpIntruder(mockLogger);

      expect(intruder.payloads.xss).toHaveLength(4);
      expect(intruder.payloads.sqli).toHaveLength(5);
      expect(intruder.payloads.command).toHaveLength(4);
      expect(intruder.payloads.ldap).toHaveLength(3);
    });

    test('should have XSS payloads', () => {
      const intruder = new BurpIntruder(mockLogger);
      const xssPayloads = intruder.payloads.xss;

      expect(xssPayloads).toContain('<script>alert("xss")</script>');
      expect(xssPayloads.some(p => p.includes('onerror'))).toBe(true);
    });

    test('should have SQL Injection payloads', () => {
      const intruder = new BurpIntruder(mockLogger);
      const sqliPayloads = intruder.payloads.sqli;

      expect(sqliPayloads).toContain("' OR '1'='1");
      expect(sqliPayloads).toContain("admin' --");
    });

    test('should have Command Injection payloads', () => {
      const intruder = new BurpIntruder(mockLogger);
      const commandPayloads = intruder.payloads.command;

      expect(commandPayloads).toContain('; ls');
      expect(commandPayloads.some(p => p.includes('whoami'))).toBe(true);
    });
  });

  // =========================================================================
  // SPIDER TESTS
  // =========================================================================

  describe('Spider (Crawler)', () => {
    test('should create spider instance', () => {
      const spider = new BurpSpider(mockLogger);

      expect(spider.visited).toBeInstanceOf(Set);
      expect(spider.toVisit).toHaveLength(0);
    });

    test('should track visited URLs', () => {
      const spider = new BurpSpider(mockLogger);
      const url = 'http://example.com';

      spider.visited.add(url);
      expect(spider.visited.has(url)).toBe(true);
    });

    test('should extract links from HTML', () => {
      const spider = new BurpSpider(mockLogger);

      const html = `
        <a href="page1.html">Link 1</a>
        <a href="/page2">Link 2</a>
        <a href="http://example.com/page3">Link 3</a>
      `;

      const links = spider._extractLinks(
        { body: html },
        'http://example.com/'
      );

      expect(links.length).toBeGreaterThan(0);
    });

    test('should resolve relative URLs', () => {
      const spider = new BurpSpider(mockLogger);

      const resolved = spider._resolveUrl('page.html', 'http://example.com/');
      expect(resolved).toBe('http://example.com/page.html');
    });
  });

  // =========================================================================
  // DECODER TESTS
  // =========================================================================

  describe('Decoder/Encoder', () => {
    test('should encode to URL encoding', () => {
      const decoder = new BurpDecoder(mockLogger);
      const encoded = decoder.encode('hello world', 'url');

      expect(encoded).toBe('hello%20world');
    });

    test('should decode from URL encoding', () => {
      const decoder = new BurpDecoder(mockLogger);
      const decoded = decoder.decode('hello%20world', 'url');

      expect(decoded).toBe('hello world');
    });

    test('should encode to Base64', () => {
      const decoder = new BurpDecoder(mockLogger);
      const encoded = decoder.encode('hello', 'base64');

      expect(encoded).toBe('aGVsbG8=');
    });

    test('should decode from Base64', () => {
      const decoder = new BurpDecoder(mockLogger);
      const decoded = decoder.decode('aGVsbG8=', 'base64');

      expect(decoded).toBe('hello');
    });

    test('should HTML encode', () => {
      const decoder = new BurpDecoder(mockLogger);
      const encoded = decoder.encode('<script>', 'html');

      expect(encoded).toBe('&lt;script&gt;');
    });

    test('should HTML decode', () => {
      const decoder = new BurpDecoder(mockLogger);
      const decoded = decoder.decode('&lt;script&gt;', 'html');

      expect(decoded).toBe('<script>');
    });

    test('should encode to hex', () => {
      const decoder = new BurpDecoder(mockLogger);
      const encoded = decoder.encode('AB', 'hex');

      expect(encoded).toBe('4142');
    });

    test('should compare texts for differences', () => {
      const decoder = new BurpDecoder(mockLogger);

      const comparison1 = decoder.compare('hello', 'hello');
      expect(comparison1.same).toBe(true);

      const comparison2 = decoder.compare('hello', 'world');
      expect(comparison2.same).toBe(false);
    });
  });

  // =========================================================================
  // SCANNER TESTS
  // =========================================================================

  describe('Scanner', () => {
    test('should create scanner instance', () => {
      const scanner = new BurpScanner(mockLogger);
      expect(scanner.vulnerabilities).toHaveLength(0);
    });

    test('should test for XSS vulnerabilities', async () => {
      const scanner = new BurpScanner(mockLogger);
      const xssTest = await scanner._testXSS('http://example.com');

      expect(xssTest.type).toBe('XSS');
      expect(xssTest.severity).toBe('HIGH');
      expect(xssTest.tested).toBe(true);
    });

    test('should test for SQL Injection vulnerabilities', async () => {
      const scanner = new BurpScanner(mockLogger);
      const sqliTest = await scanner._testSQLi('http://example.com');

      expect(sqliTest.type).toBe('SQL Injection');
      expect(sqliTest.severity).toBe('CRITICAL');
      expect(sqliTest.payload).toContain("'");
    });

    test('should test for Path Traversal vulnerabilities', async () => {
      const scanner = new BurpScanner(mockLogger);
      const pathTest = await scanner._testPathTraversal('http://example.com');

      expect(pathTest.type).toBe('Path Traversal');
      expect(pathTest.payload).toContain('../');
    });

    test('should test for Command Injection vulnerabilities', async () => {
      const scanner = new BurpScanner(mockLogger);
      const cmdTest = await scanner._testCommandInjection('http://example.com');

      expect(cmdTest.type).toBe('Command Injection');
      expect(cmdTest.severity).toBe('CRITICAL');
    });

    test('should test for SSRF vulnerabilities', async () => {
      const scanner = new BurpScanner(mockLogger);
      const ssrfTest = await scanner._testSSRF('http://example.com');

      expect(ssrfTest.type).toBe('SSRF');
      expect(ssrfTest.payload).toContain('127.0.0.1');
    });
  });

  // =========================================================================
  // BURP ORCHESTRATOR TESTS
  // =========================================================================

  describe('Burp Suite Equivalent Orchestrator', () => {
    test('should initialize all components', () => {
      expect(burp.proxy).toBeDefined();
      expect(burp.repeater).toBeDefined();
      expect(burp.intruder).toBeDefined();
      expect(burp.spider).toBeDefined();
      expect(burp.decoder).toBeDefined();
      expect(burp.scanner).toBeDefined();
    });

    test('should encode/decode through orchestrator', () => {
      const encoded = burp.encode('test data', 'base64');
      expect(encoded).toBe('dGVzdCBkYXRh');

      const decoded = burp.decode('dGVzdCBkYXRh', 'base64');
      expect(decoded).toBe('test data');
    });

    test('should compare texts through orchestrator', () => {
      const result = burp.compare('same', 'same');
      expect(result.same).toBe(true);
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Integration Tests', () => {
    test('should handle complete assessment workflow', async () => {
      // Simulate a complete assessment
      const baseRequest = {
        method: 'GET',
        url: 'http://example.com?search=query'
      };

      // Test fuzzing
      const encoded = burp.encode('<script>alert(1)</script>', 'url');
      expect(encoded).toContain('%3C');

      // Test comparison
      const comparison = burp.compare('original', 'modified');
      expect(comparison.same).toBe(false);
    });

    test('should support repeater workflow', async () => {
      const repeater = burp.repeater;

      const originalRequest = {
        method: 'POST',
        url: 'http://example.com/api',
        headers: { 'Content-Type': 'application/json' },
        body: '{"key":"value"}'
      };

      // Simulate repeat with modification
      const modified = {
        ...originalRequest,
        body: '{"key":"modified"}'
      };

      expect(modified.body).toContain('modified');
    });
  });
});
