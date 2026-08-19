# Burp Suite Equivalent - Web Security Testing Module

A comprehensive Burp Suite-like framework component that provides similar functionality without requiring commercial licensing.

## Features

### 1. **Proxy Interception**
Intercept and analyze HTTP/HTTPS traffic with configurable rules.

```javascript
const { BurpProxy } = require('./orchestrator/burp-suite-equivalent');

const proxy = new BurpProxy(8080, logger);
proxy.addInterceptRule('POST', 'api.example.com');
const server = proxy.start();
```

**Capabilities:**
- Listen on configurable port
- Intercept requests matching rules
- Request/response history tracking
- Forward traffic to target servers

### 2. **Request Repeater**
Resend HTTP requests with modifications for testing and debugging.

```javascript
const { BurpRepeater } = require('./orchestrator/burp-suite-equivalent');

const repeater = new BurpRepeater(logger);

const response = await repeater.repeatRequest(
  originalRequest,
  { body: 'modified payload' }
);
```

**Capabilities:**
- Modify request headers, body, method
- Track request/response pairs
- Support multiple encoding formats
- Automated response analysis

### 3. **Intruder (Fuzzing)**
Automated payload injection for vulnerability testing.

```javascript
const { BurpIntruder } = require('./orchestrator/burp-suite-equivalent');

const intruder = new BurpIntruder(logger);

const results = await intruder.fuzz(
  baseRequest,
  'search_parameter',
  'xss',  // payload type
  'url'   // injection target
);
```

**Payload Types:**
- **XSS**: 4 JavaScript injection payloads
- **SQLi**: 5 SQL injection payloads
- **Command**: 4 command injection payloads
- **LDAP**: 3 LDAP injection payloads

**Targets:**
- `url` - Query string parameters
- `body` - POST body parameters

### 4. **Spider (Crawler)**
Automatically discover web application URLs and endpoints.

```javascript
const { BurpSpider } = require('./orchestrator/burp-suite-equivalent');

const spider = new BurpSpider(logger);

const discovered = await spider.crawl(
  'http://example.com',
  3  // max depth
);
```

**Capabilities:**
- Breadth-first URL discovery
- Configurable crawl depth
- Automatic link extraction from HTML
- URL normalization and deduplication

### 5. **Decoder/Encoder**
Convert between multiple encoding formats.

```javascript
const { BurpDecoder } = require('./orchestrator/burp-suite-equivalent');

const decoder = new BurpDecoder(logger);

// Encoding
decoder.encode('hello world', 'url');      // hello%20world
decoder.encode('data', 'base64');          // ZGF0YQ==
decoder.encode('<script>', 'html');        // &lt;script&gt;
decoder.encode('test', 'hex');             // 74657374

// Decoding
decoder.decode('hello%20world', 'url');    // hello world
decoder.decode('ZGF0YQ==', 'base64');      // data
decoder.decode('&lt;script&gt;', 'html');  // <script>

// Comparison
const diff = decoder.compare(text1, text2);
if (diff.same) console.log('Identical');
else console.log('Different at position', diff.firstDifference);
```

**Supported Formats:**
- URL encoding/decoding
- Base64 encoding/decoding
- HTML entity encoding/decoding
- Hexadecimal encoding/decoding

### 6. **Scanner**
Identify common web vulnerabilities.

```javascript
const { BurpScanner } = require('./orchestrator/burp-suite-equivalent');

const scanner = new BurpScanner(logger);

const vulnerabilities = await scanner.scan('http://example.com');
```

**Tested Vulnerabilities:**
- XSS (Cross-Site Scripting) - HIGH
- SQLi (SQL Injection) - CRITICAL
- Path Traversal - HIGH
- Command Injection - CRITICAL
- SSRF (Server-Side Request Forgery) - HIGH

## Complete Example

### Full Assessment Workflow

```javascript
const {
  BurpSuiteEquivalent
} = require('./orchestrator/burp-suite-equivalent');

// Initialize Burp
const burp = new BurpSuiteEquivalent(logger, auditLogger);

// 1. Start proxy
const proxyServer = burp.startProxy();

// 2. Crawl application
const crawlResults = await burp.crawl('http://target.com', 2);
console.log(`Found ${crawlResults.length} pages`);

// 3. Scan for vulnerabilities
const vulns = await burp.scan('http://target.com');
vulns.forEach(v => {
  console.log(`${v.type}: ${v.severity}`);
});

// 4. Test specific parameters
const request = {
  method: 'GET',
  url: 'http://target.com/search?q=test'
};

const fuzzyResults = await burp.fuzz(request, 'q', 'xss');
fuzzyResults.forEach(result => {
  if (result.reflectionFound) {
    console.log(`XSS found: ${result.payload}`);
  }
});

// 5. Repeat requests with modifications
const modified = await burp.repeatRequest(request, {
  url: request.url + '&admin=true'
});

// 6. Encode payloads
const encoded = burp.encode('<script>alert(1)</script>', 'url');
console.log(`Encoded: ${encoded}`);
```

## Integration with Framework

```javascript
const { ToolIntegrationLayer } = require('./orchestrator/tool-integration-layer');
const { BurpSuiteEquivalent } = require('./orchestrator/burp-suite-equivalent');

const integration = new ToolIntegrationLayer(logger, auditLogger, rateLimiter, circuitBreaker);
const burp = new BurpSuiteEquivalent(logger, auditLogger);

// Run web assessment with Burp
const results = await integration.runAssessment({
  target: 'http://example.com',
  workflowType: 'web-app',  // Includes Burp testing
  intensityLevel: 'thorough'
});
```

## API Reference

### BurpSuiteEquivalent

#### Methods
- `startProxy()` - Start HTTP proxy server
- `repeatRequest(request, modifications)` - Resend modified request
- `fuzz(request, parameter, payloadType, target)` - Fuzz a parameter
- `crawl(url, depth)` - Spider/crawl application
- `encode(text, type)` - Encode text to format
- `decode(text, type)` - Decode text from format
- `compare(text1, text2)` - Compare two texts
- `scan(url)` - Scan for vulnerabilities
- `runFullAssessment(targetUrl)` - Run complete assessment

## Command-Line Usage

```bash
# Run Burp tests
npm test -- tests/burp-suite-equivalent.test.js

# Run specific test suite
npm test -- tests/burp-suite-equivalent.test.js -t "Proxy"

# With coverage
npm run test:coverage
```

## Test Coverage

- ✅ 34 test cases
- ✅ Proxy interception (4 tests)
- ✅ Request repeater (3 tests)
- ✅ Intruder/fuzzing (4 tests)
- ✅ Spider/crawler (4 tests)
- ✅ Decoder/encoder (8 tests)
- ✅ Scanner (5 tests)
- ✅ Integration tests (2 tests)
- ✅ Orchestrator tests (4 tests)

## Advantages Over Commercial Burp

✅ **Open Source** - Full control and transparency  
✅ **Integrated** - Part of penetration testing framework  
✅ **Customizable** - Extend with additional modules  
✅ **No Licensing** - Unlimited concurrent use  
✅ **Fast** - Lightweight Node.js implementation  
✅ **Scriptable** - Full programmatic API  

## Comparison with Commercial Burp Suite

| Feature | Burp Equivalent | Commercial Burp |
|---------|-----------------|-----------------|
| Proxy | ✅ | ✅ |
| Repeater | ✅ | ✅ |
| Intruder | ✅ | ✅ |
| Spider | ✅ | ✅ |
| Scanner | ✅ | ✅ (Advanced) |
| Decoder | ✅ | ✅ |
| Collaboration | ✗ | ✅ |
| Advanced Scanner | ✗ | ✅ |
| Extensions | Partial | ✅ |
| API | ✅ | ✅ |

## Next Steps

1. **Integrate** into assessment workflows
2. **Extend** with additional payload types
3. **Connect** to SIEM for centralized logging
4. **Automate** with scheduled scans
5. **Report** vulnerabilities to bug tracking system

## Support

For issues or feature requests, open an issue in the repository.

## License

Apache 2.0 - See LICENSE file
