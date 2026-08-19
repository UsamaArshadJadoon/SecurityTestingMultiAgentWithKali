# Test Suite Documentation

## Overview

Comprehensive test suite for the penetration testing orchestration framework covering:

- **Phase Integration Tests** — 3 integration test suites for critical phases
- **Orchestration Tests** — Core tool orchestration, chain execution, exploit modules
- **Kali Tools Tests** — 3 test suites for 56-113+ integrated Kali tools

**Total**: 196+ test cases across 8 test suites with 100% passing rate

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

### Run Specific Test Suite
```bash
npm run test:phase1      # Phase 1 integration tests
npm run test:phase2      # Phase 2 integration tests
npm run test:phase3      # Phase 3 integration tests
npm run test:orchestration # Tool chain & orchestration tests
npm run test:kali:expanded # Kali tools (expanded) tests
npm run test:kali:maximum  # Kali tools (maximum) tests
```

## Test Structure

### Phase 1 Integration Tests (20+ tests)

Tests critical foundation components:
- Request context propagation
- Health check endpoint
- Graceful shutdown
- Database rate limiting
- Structured logging
- Request signing
- Circuit breaker
- Error handling

**Key Coverage**:
- ✅ Context flows through entire request lifecycle
- ✅ Health checks report accurate database pool status
- ✅ Graceful shutdown closes connections properly
- ✅ Rate limiting enforces per-user/per-tenant limits

### Phase 2 Integration Tests (20+ tests)

Tests performance optimization features:
- Database connection pooling
- Prometheus metrics export
- Request timeout protection
- Configuration validation
- Bulk operations
- Deduplication
- Request signing

**Key Coverage**:
- ✅ Connection pool maintains min/max connections
- ✅ Metrics accurately track operations
- ✅ Timeouts prevent hanging requests
- ✅ Configuration validates on startup

### Phase 3 Integration Tests (25+ tests)

Tests enterprise features:
- Schema validation
- API versioning
- Circuit breaker patterns
- Endpoint rate limiting
- Feature flags
- Performance benchmarking
- Audit logging

**Key Coverage**:
- ✅ Schema validation rejects invalid payloads
- ✅ API versioning routes to correct handler
- ✅ Circuit breaker opens after threshold
- ✅ Feature flags support user allowlisting and rollouts
- ✅ Performance benchmarks track metrics
- ✅ Audit logging captures all events

### Orchestration Tests (44+ tests)

Tests tool chain orchestration and exploit modules:

**Tool Chain Orchestrator**:
- Chain definition and configuration
- Sequential, parallel, and conditional execution
- Execution history tracking
- Statistics calculation
- Predefined chains (reconnaissance, scanning, vulnerability assessment, exploitation, full pentest)

**Exploit Modules** (18 modules):
- SQLi, XSS, RCE, SSRF, CSRF, Auth Bypass
- LDAP Injection, XXE, SSTI, Insecure Deserialization
- Broken Access Control, Sensitive Data Exposure
- Security Misconfiguration, Known Vulnerabilities
- And 4 more vulnerability types

**Integrated Orchestration**:
- Multi-phase assessments (reconnaissance → scanning → exploitation → analysis)
- Rapid vs. comprehensive assessments
- Statistics aggregation across phases

**Key Coverage**:
- ✅ Tool chains execute in correct order/concurrency
- ✅ Conditional execution evaluates context properly
- ✅ Exploit modules detect and exploit vulnerabilities
- ✅ Statistics accurately reflect execution results

### Kali Tools Expanded Tests (35+ tests)

Tests 56 integrated Kali tools across 3 phases:

**Phase 1** (18 tools):
- Network discovery (nmap, masscan, shodan)
- DNS enumeration (theHarvester, amass, subfinder)
- OSINT (spiderfoot, maltego, exiftool)

**Phase 2** (19 tools):
- Web server scanning (nikto, testssl, sslscan)
- Web app testing (wfuzz, ffuf, nuclei, xsstrike)
- Database scanning (sqlmap, mongoaudit)
- Directory brute-forcing (dirb, gobuster)
- CMS scanning (joomscan, wpscan)

**Phase 3** (19 tools):
- Password cracking (john, hashcat, hydra)
- Exploitation frameworks (metasploit, empire)
- Credential dumping (mimikatz, secretsdump)
- Network exploitation (tcpdump, wireshark, aircrackng)

**Key Coverage**:
- ✅ All 56 tools are available and callable
- ✅ Tools organized by phase correctly
- ✅ Tool execution tracks in history
- ✅ Statistics calculated accurately

### Kali Tools Maximum Tests (32+ tests)

Tests 113 integrated Kali tools with expanded coverage:

**Coverage**:
- Phase 1: 30 reconnaissance tools
- Phase 2: 39 scanning/enumeration tools
- Phase 3: 44 exploitation/post-exploitation tools

**Key Coverage**:
- ✅ All 113 tools integrated and callable
- ✅ No duplicate tools across phases
- ✅ Full penetration test workflows supported
- ✅ Multi-phase assessment coverage complete

### Test Execution Summary

| Suite | Tests | Focus | Status |
|-------|-------|-------|--------|
| Phase 1 Integration | 20+ | Foundation | ✅ PASS |
| Phase 2 Integration | 20+ | Performance | ✅ PASS |
| Phase 3 Integration | 25+ | Enterprise | ✅ PASS |
| Orchestration | 44+ | Tool chains & exploits | ✅ PASS |
| Kali Tools Expanded | 35+ | 56 tools | ✅ PASS |
| Kali Tools Maximum | 32+ | 113 tools | ✅ PASS |
| Other Integration | 20+ | Specialized | ✅ PASS |
| **Total** | **196+** | **All systems** | **✅ PASS** |

## Test Coverage Goals

The test suite targets 75%+ coverage across all metrics:
- **Lines:** 75%+
- **Branches:** 70%+
- **Functions:** 75%+
- **Statements:** 75%+

Current enforcement: Tests fail if coverage falls below these thresholds.

## Key Testing Patterns

### 1. Phase Integration Pattern
```javascript
describe('Phase 3: Advanced Features', () => {
  test('should support feature flags', () => {
    const flag = new FeatureFlag('feature', { enabled: true });
    flag.allowUser('user1');
    expect(flag.isEnabledForUser('user1')).toBe(true);
  });
});
```

### 2. Orchestration Pattern
```javascript
test('should execute tools sequentially', async () => {
  const orchestrator = new ToolChainOrchestrator(logger, auditLogger);
  orchestrator.defineChain('test', ['tool1', 'tool2'], {});
  const result = await orchestrator.executeChain('test', {});
  expect(result.tools).toHaveLength(2);
});
```

### 3. Exploit Module Pattern
```javascript
test('should detect SQL injection vulnerability', async () => {
  const exploit = new SQLiExploit(logger, auditLogger);
  const detected = await exploit.detect('http://example.com?id=1');
  expect(detected.vulnerable).toBe(true);
});
```

## Debugging Tests

### Run Single Test File
```bash
npx jest tests/orchestration.test.js
```

### Run Single Test Suite
```bash
npx jest -t "Tool Chain Orchestrator"
```

### Run with Verbose Output
```bash
npx jest --verbose
```

### Generate HTML Coverage Report
```bash
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## Adding New Tests

When adding new functionality to the framework:

1. **Write tests first** (TDD approach)
2. **Follow existing patterns** (use fixtures, describe blocks)
3. **Test both happy path and edge cases**
4. **Include security-relevant scenarios**
5. **Ensure coverage stays above 75%**
6. **Update this README** with new test descriptions

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
- Use `run_in_background: false` if needed for sequential execution

### Environment Variables Missing
- Set `JWT_SECRET`, `REQUEST_SIGNING_SECRET`, `KEYSTORE_MASTER_KEY`
- Use `jest.setup.js` which is automatically loaded for configuration

### State File Conflicts in Tests
- Each test uses isolation to prevent conflicts
- Cleanup happens in `afterEach()` block
- Never leave test artifacts in the working directory

### Port Conflicts
- Tests use different ports or ephemeral ports
- Ensure no other services are running on required ports

## Maintenance

- Review and update tests when orchestration changes
- Keep test utilities in sync with framework schema
- Run coverage reports before releases
- Document any expected test failures (e.g., platform-specific)
- Update test counts as new test suites are added

## Related Files

- `docs/framework-documentation.md` — Framework documentation
- `jest.config.js` — Jest configuration
- `jest.setup.js` — Test environment setup
- `orchestrator/` — Framework implementation
- `server.js` — Main application entry point

## Environment Variables for Testing

```bash
# Required for tests
JWT_SECRET=test-secret
REQUEST_SIGNING_SECRET=test-secret
KEYSTORE_MASTER_KEY=test-secret
NODE_ENV=test
LOG_LEVEL=error
```

These are automatically set by `jest.setup.js` for all tests.
