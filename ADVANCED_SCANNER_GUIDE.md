# Advanced Scanner Module - Professional-Grade Vulnerability Discovery

A comprehensive scanning framework providing professional-grade reconnaissance and vulnerability detection capabilities equivalent to commercial security testing tools.

## Features

### 1. **Port Scanner**
Network port detection and service identification.

```javascript
const { PortScanner } = require('./orchestrator/advanced-scanner');

const scanner = new PortScanner(logger);
const results = await scanner.scan('target.com', [80, 443, 22, 3306]);

// Results include:
// - port number
// - status (open/closed/filtered)
// - service identification (HTTP, HTTPS, SSH, MySQL, etc.)
```

**Capabilities:**
- Common port scanning (20+ predefined ports)
- Custom port range scanning
- Service identification
- Execution history tracking

### 2. **SSL/TLS Analyzer**
Certificate analysis and protocol security assessment.

```javascript
const { SSLAnalyzer } = require('./orchestrator/advanced-scanner');

const analyzer = new SSLAnalyzer(logger);
const results = await analyzer.analyze('target.com', 443);

// Results include:
// - Certificate information (subject, issuer, validity)
// - Supported protocols (SSLv3, TLSv1.0-1.3)
// - Cipher suites
// - Known vulnerabilities (Heartbleed, POODLE, etc.)
```

**Capabilities:**
- Certificate validity checking
- Protocol version detection
- Cipher strength analysis
- Vulnerability scanning (Heartbleed, BEAST, POODLE, CCS Injection)
- Certificate chain validation

### 3. **DNS Enumerator**
DNS reconnaissance and subdomain discovery.

```javascript
const { DNSEnumerator } = require('./orchestrator/advanced-scanner');

const enumerator = new DNSEnumerator(logger);
const results = await enumerator.enumerate('target.com');

// Results include:
// - A, AAAA, MX, NS, CNAME, SOA, TXT, SRV records
// - Discovered subdomains
// - DNSSEC, DKIM, DMARC configuration
```

**Capabilities:**
- Multiple DNS record type enumeration
- Subdomain brute-forcing (20+ common subdomains)
- Reverse DNS lookups
- DNSSEC validation
- SPF/DKIM/DMARC checking

### 4. **Technology Fingerprinting**
Identify web server, programming language, framework, and other technologies.

```javascript
const { TechnologyFingerprint } = require('./orchestrator/advanced-scanner');

const fingerprinter = new TechnologyFingerprint(logger);
const results = await fingerprinter.fingerprint('http://target.com');

// Results include:
// - Web server (Apache, Nginx, IIS, etc.)
// - Programming language (PHP, Java, Node.js, Python, etc.)
// - Framework detection (Express, Django, Spring, etc.)
// - CMS identification (WordPress, Joomla, Drupal)
// - JavaScript libraries (jQuery, Bootstrap, etc.)
// - HTTP headers and cookies
```

**Capabilities:**
- Web server identification
- Language and framework detection
- CMS recognition
- JavaScript library detection
- HTTP header analysis
- Cookie analysis
- Technology version detection

### 5. **WAF Detection**
Identify Web Application Firewalls and provide evasion guidance.

```javascript
const { WAFDetector } = require('./orchestrator/advanced-scanner');

const detector = new WAFDetector(logger);
const results = await detector.detect('target.com');

// Results include:
// - WAF detection status
// - Identified WAF product
// - Confidence level
// - Detection indicators
// - Evasion techniques
```

**Supported WAFs:**
- ModSecurity / NAXSI
- Cloudflare
- Akamai
- AWS WAF
- F5 BIG-IP
- Imperva
- Barracuda
- Sucuri
- Fortinet

**Capabilities:**
- Multiple WAF detection
- Evasion technique suggestions
- Header-based detection
- Response pattern analysis

### 6. **Sensitive File Scanner**
Discover exposed configuration files and credentials.

```javascript
const { SensitiveFileScanner } = require('./orchestrator/advanced-scanner');

const scanner = new SensitiveFileScanner(logger);
const results = await scanner.scan('http://target.com');

// Results include:
// - Found files and paths
// - HTTP status codes
// - Sensitive file flagging
// - Content preview (where applicable)
```

**Targets:**
- `.env`, `.env.local`, `.env.backup`
- `.git/config`, `.ssh/config`
- `.aws/credentials`, `.aws/config`
- `robots.txt`, `.htaccess`, `web.config`
- `config.php`, `config.xml`, `settings.py`
- `secrets.json`, `database.yml`
- Admin panels (`/wp-admin`, `/administrator`, `/admin.php`)

### 7. **API Endpoint Discovery**
Discover and analyze API endpoints and specifications.

```javascript
const { APIEndpointDiscovery } = require('./orchestrator/advanced-scanner');

const discovery = new APIEndpointDiscovery(logger);
const results = await discovery.discover('http://target.com');

// Results include:
// - Discovered endpoints
// - HTTP methods
// - Response status codes
// - Authentication requirements
```

**Advanced Features:**
```javascript
// Analyze OpenAPI specification
const openapi = await discovery.analyzeOpenAPI('http://target.com/openapi.json');

// Results include:
// - API title and version
// - All endpoints
// - Authentication methods
// - Identified vulnerabilities (missing auth, etc.)
```

### 8. **Dependency Scanner**
Identify vulnerable packages in dependencies.

```javascript
const { DependencyScanner } = require('./orchestrator/advanced-scanner');

const scanner = new DependencyScanner(logger);
const results = await scanner.scan('package.json');

// Results include:
// - Vulnerable packages
// - Vulnerability descriptions
// - Severity levels (CRITICAL, HIGH, MEDIUM)
// - CVE identifiers
// - Fixed versions
```

**Capabilities:**
- Npm/Node.js package analysis
- Vulnerability database integration
- Version comparison
- Fix recommendations
- Severity classification

### 9. **Credential Tester**
Test for default credentials on login endpoints.

```javascript
const { CredentialTester } = require('./orchestrator/advanced-scanner');

const tester = new CredentialTester(logger);
const results = await tester.testDefaults('http://target.com/login');

// Results include:
// - Tested credentials
// - Success/failure status
// - Valid credentials found (if any)
```

**Default Credentials:**
- admin / admin
- admin / password
- admin / 123456
- root / root
- root / password
- admin / admin123

## Comprehensive Scanning

### Full Target Assessment

```javascript
const { AdvancedScanner } = require('./orchestrator/advanced-scanner');

const scanner = new AdvancedScanner(logger, auditLogger);

// Run all scans in parallel
const results = await scanner.runComprehensiveScan('target.com');

// Results structure:
// {
//   target: 'target.com',
//   timestamp: Date,
//   scans: {
//     portScan: { ... },
//     sslAnalysis: { ... },
//     dnsEnum: { ... },
//     fingerprint: { ... },
//     wafDetection: { ... },
//     sensitiveFiles: { ... },
//     apiEndpoints: { ... }
//   }
// }
```

## Integration with Framework

### Tool Integration Layer

```javascript
const { ToolIntegrationLayer } = require('./orchestrator/tool-integration-layer');

const integration = new ToolIntegrationLayer(logger, auditLogger, rateLimiter, circuitBreaker);

// Run advanced scans through the framework
const infrastructureScan = await integration.scanInfrastructure('target.com');
const sslAnalysis = await integration.analyzeSSL('target.com', 443);
const dnsEnum = await integration.enumerateDNS('target.com');
const fingerprint = await integration.fingerprintTechnology('http://target.com');
const wafDetection = await integration.detectWAF('target.com');
const sensitiveFiles = await integration.discoverSensitiveFiles('http://target.com');
const apiEndpoints = await integration.discoverAPIEndpoints('http://target.com');
const dependencies = await integration.scanDependencies('package.json');
const credentials = await integration.testCredentials('http://target.com/login');
```

### Complete Assessment Workflow

```javascript
const assessment = async (target) => {
  const scanner = new AdvancedScanner(logger, auditLogger);

  // Phase 1: Infrastructure Reconnaissance
  const infra = await scanner.scanInfrastructure(target);
  console.log(`Found ${infra.length} open ports`);

  // Phase 2: SSL/TLS Security
  const ssl = await scanner.analyzeSSL(target, 443);
  console.log(`TLS Version: ${ssl.analysis.protocols}`);

  // Phase 3: Domain Intelligence
  const dns = await scanner.enumerateDNS(target);
  console.log(`Found ${dns.subdomains.length} subdomains`);

  // Phase 4: Technology Stack
  const tech = await scanner.fingerprintTechnology(`https://${target}`);
  console.log(`Server: ${tech.detected.webServer}`);
  console.log(`Framework: ${tech.detected.framework}`);

  // Phase 5: WAF Detection
  const waf = await scanner.detectWAF(target);
  if (waf.wafDetected) {
    console.log(`WAF Detected: ${waf.detectedWAF}`);
    console.log(`Evasion Techniques:`, waf.evasionTechniques);
  }

  // Phase 6: Sensitive File Discovery
  const files = await scanner.discoverSensitiveFiles(`https://${target}`);
  console.log(`Found ${files.filesFound.length} sensitive files`);

  // Phase 7: API Discovery
  const apis = await scanner.discoverAPIEndpoints(`https://${target}`);
  console.log(`Found ${apis.endpoints.length} API endpoints`);

  // Phase 8: Dependency Vulnerabilities
  const deps = await scanner.scanDependencies('package.json');
  console.log(`Found ${deps.summary.critical} critical vulnerabilities`);

  // Phase 9: Credential Testing
  const creds = await scanner.testCredentials(`https://${target}/login`);
  if (creds.validCredentials.length > 0) {
    console.log('Valid credentials found!');
  }
};

await assessment('target.com');
```

## API Reference

### AdvancedScanner

#### Methods

- `runComprehensiveScan(target)` - Run all scanners in parallel
- `scanInfrastructure(host)` - Port scanning
- `analyzeSSL(host, port)` - SSL/TLS certificate analysis
- `enumerateDNS(domain)` - DNS enumeration
- `fingerprintTechnology(url)` - Technology detection
- `detectWAF(host)` - WAF detection
- `discoverSensitiveFiles(url)` - File discovery
- `discoverAPIEndpoints(url)` - API endpoint discovery
- `scanDependencies(packageJsonPath)` - Dependency vulnerability scanning
- `testCredentials(loginUrl)` - Credential testing

## Configuration

### Environment Variables

```bash
# Timeout settings
SCAN_TIMEOUT=30000           # Per-scan timeout
COMPREHENSIVE_TIMEOUT=120000 # Full assessment timeout

# Rate limiting
SCAN_RATE_LIMIT=10           # Scans per minute

# Verbosity
SCAN_VERBOSE=false           # Detailed logging
```

## Command-Line Usage

```bash
# Run advanced scanner tests
npm test -- tests/advanced-scanner.test.js

# Run specific scanner tests
npm test -- tests/advanced-scanner.test.js -t "Port Scanner"
npm test -- tests/advanced-scanner.test.js -t "SSL Analyzer"

# With coverage
npm run test:coverage
```

## Test Coverage

- ✅ 50+ test cases
- ✅ Port scanner (5 tests)
- ✅ SSL/TLS analyzer (6 tests)
- ✅ DNS enumerator (5 tests)
- ✅ Technology fingerprinting (7 tests)
- ✅ WAF detection (5 tests)
- ✅ File scanner (3 tests)
- ✅ API discovery (5 tests)
- ✅ Dependency scanner (3 tests)
- ✅ Credential tester (3 tests)
- ✅ Orchestrator (8 tests)
- ✅ Integration tests (2 tests)

## Security Considerations

1. **Legal Compliance**: Only scan systems you have authorization to test
2. **Rate Limiting**: Implement rate limiting to avoid overwhelming target systems
3. **Data Handling**: Securely handle discovered credentials and sensitive information
4. **Logging**: Enable audit logging for compliance and incident investigation
5. **Network Isolation**: Isolate scanning operations from production systems

## Performance Characteristics

| Operation | Typical Time |
|-----------|-------------|
| Port scan (20 ports) | 2-5 seconds |
| SSL analysis | 1-2 seconds |
| DNS enumeration (20 subdomains) | 2-3 seconds |
| Technology fingerprinting | 1-2 seconds |
| WAF detection | 1-2 seconds |
| File discovery (20 files) | 2-3 seconds |
| API discovery (15 endpoints) | 1-2 seconds |
| Comprehensive scan | 15-20 seconds |

## Advantages Over Commercial Tools

✅ **Cost**: No licensing fees  
✅ **Integration**: Built into penetration testing framework  
✅ **Customization**: Extend with custom scanners  
✅ **Automation**: Fully scriptable and programmable  
✅ **Speed**: Parallel scanning operations  
✅ **Logging**: Complete audit trails  

## Next Steps

1. **Run Comprehensive Scan**: `scanner.runComprehensiveScan('target.com')`
2. **Analyze Results**: Review discovered vulnerabilities and configurations
3. **Exploit Findings**: Use exploit modules to test vulnerabilities
4. **Generate Report**: Export results for stakeholder review
5. **Remediate Issues**: Work with development/operations teams

## Support

For issues or feature requests, consult the framework documentation at `docs/framework-documentation.md`.

## License

Apache 2.0 - See LICENSE file
