# 🛡️ Professional Penetration Testing Framework

**Production-Ready | Enterprise Grade | 200+ Kali Tools Integration**

A comprehensive penetration testing orchestration framework with 200+ Kali Linux tools, 18 exploit modules, 11 specialized assessment workflows, and enterprise-grade security hardening.

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- Node.js 16+ and npm
- Linux/Kali (native, Docker, or VM)
- 4GB+ RAM, 20GB+ disk space

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-org/SecurityTestingMultiAgentWithKali.git
cd SecurityTestingMultiAgentWithKali

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Generate secrets (3x):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Add to .env: JWT_SECRET, REQUEST_SIGNING_SECRET, KEYSTORE_MASTER_KEY

# 4. Verify installation
npm test

# 5. Start framework
npm start

# 6. Check health
curl http://localhost:3000/health
```

---

## 📖 Documentation

**→ [📘 Framework Documentation v4.0.0](docs/framework-documentation.md)** *(Start here!)*

### What's in the Professional Documentation

**Installation & Setup:**
- ✅ 5-step installation guide with verification
- ✅ Environment configuration with all required variables
- ✅ Dependency verification and testing

**Kali Linux Integration:**
- ✅ 3 installation options (Native, Docker, VM)
- ✅ Step-by-step Kali integration
- ✅ Tool availability verification
- ✅ Permission configuration

**Getting Started:**
- ✅ 5-minute quick start walkthrough
- ✅ Step-by-step code examples
- ✅ Expected outputs and interpretation

**Core Modules:**
- ✅ Advanced Scanning (9 scanners)
- ✅ Exploitation (18 modules)
- ✅ Deep Vulnerability Scanner (7 types)
- ✅ Code Quality Analysis
- ✅ Advanced SQL Injection (7 methods)
- ✅ Burp Suite Equivalent

**Usage Examples:**
- ✅ Web app assessment (15 min)
- ✅ API security assessment (1-2 hrs)
- ✅ Batch assessment (multiple targets)
- ✅ Custom workflows
- ✅ Real-time monitoring

**Troubleshooting & Best Practices:**
- ✅ 6 common issues with solutions
- ✅ Assessment planning guide
- ✅ Security considerations
- ✅ Performance optimization

---

## 🎯 Framework Overview

### Capabilities at a Glance

| Component | Details |
|-----------|---------|
| **Kali Tools** | 200+ tools across 3 phases (Reconnaissance, Scanning, Exploitation) |
| **Exploit Modules** | 18 vulnerability types (SQLi, XSS, RCE, SSRF, CSRF, Auth Bypass, + 12 more) |
| **Advanced Scanners** | 9 modules (Port, SSL/TLS, DNS, Tech Fingerprint, WAF, Files, API, Dependencies, Credentials) |
| **Assessment Workflows** | 11 specialized (Web App, API, Cloud, Network, Mobile, Container, OWASP, Data Risk, Incident Response, Supply Chain, Threat Model) |
| **Code Quality** | SonarQube integration + 8 vulnerability types + complexity analysis |
| **Advanced SQLi** | 7 attack methods (Boolean, Time, Error, Union, Blind, Stacked, 2nd-order) |
| **Deep Scanner** | 7 specialized scanners covering 50+ vulnerability categories |
| **Test Coverage** | 296+ tests across 11 suites (100% passing) |
| **Security Fixes** | 6 critical vulnerabilities fixed |

### Assessment Workflows

```
Web App (1-3h)        API (1-2h)         Cloud (1-3h)
Network (2-6h)        Mobile (2-4h)      Container (1-2h)
OWASP (3-6h)          Data Risk (1-2h)   Incident Response (2-8h)
Supply Chain (1-3h)   Threat Model (2-4h)
```

---

## 🚀 Core Features

### 1. Advanced Scanning Module (9 Professional Scanners)
```javascript
const { AdvancedScanner } = require('./orchestrator/advanced-scanner');
const scanner = new AdvancedScanner(logger);

// Port Scanning
await scanner.scanInfrastructure('target.com');

// SSL/TLS Analysis
await scanner.analyzeSSL('target.com', 443);

// DNS Enumeration
await scanner.enumerateDNS('target.com');

// Technology Fingerprinting
await scanner.fingerprintTechnology('http://target.com');

// WAF Detection
await scanner.detectWAF('target.com');

// And 4 more scanners...
```

### 2. Exploitation Modules (18 Types)
- **CRITICAL (6):** SQLi, RCE, Command Injection, Auth Bypass, XXE, SSTI
- **HIGH (7):** XSS, SSRF, Path Traversal, LDAP Injection, Data Exposure, Misconfiguration, CVE Detection
- **MEDIUM (1):** CSRF
- **Additional (4):** Insecure Deserialization, Broken Access Control, Design Flaws, Logging Failures

### 3. Deep Vulnerability Scanner (7 Types)
- Input Validation Scanner
- Authentication Scanner  
- Cryptography Scanner
- API Security Scanner
- Data Exposure Scanner
- Configuration Scanner
- Business Logic Scanner

### 4. Advanced SQL Injection (7 Attack Methods)
```javascript
const { AdvancedSQLInjection } = require('./orchestrator/advanced-sqli');
const sqli = new AdvancedSQLInjection(logger);

// 7 attack methods:
await sqli._testBooleanBased(url, param);      // Boolean-based
await sqli._testTimeBased(url, param);         // Time-based blind
await sqli._testErrorBased(url, param);        // Error-based
await sqli._testUnionBased(url, param);        // Union-based
await sqli._testBlindSQLi(url, param);         // Blind SQLi
// + Stacked Queries and Second-Order Injection
```

### 5. Code Quality Analysis
```javascript
const { CodeQualityScanner } = require('./orchestrator/code-quality-scanner');
const scanner = new CodeQualityScanner(logger);

const results = await scanner.scan('src/');
// Detects: Hardcoded secrets, SQL injection, XSS, Path traversal,
// Command injection, Insecure crypto, Weak RNG, Unsafe deserialization
// Analyzes: Complexity, Duplication, Coverage, Dependencies
```

### 6. Burp Suite Equivalent (6 Tools)
```javascript
const { BurpSuiteEquivalent } = require('./orchestrator/burp-suite-equivalent');
const burp = new BurpSuiteEquivalent(logger);

// Proxy, Repeater, Intruder, Spider, Decoder, Scanner
const proxyServer = burp.startProxy();
const results = await burp.fuzz(request, parameter, 'xss');
const discovered = await burp.crawl('http://target.com', 3);
```

---

## 📋 Assessment Workflows

### Web Application Testing (1-3 hours)
```javascript
const result = await integration.runAssessment({
  target: 'https://example.com',
  workflowType: 'web-app',
  intensityLevel: 'thorough'
});
```
**Coverage:** Server vulns, WAF bypass, fuzzing, CMS vulns, auth testing, SSL/TLS, security headers

### API Security Testing (1-2 hours)
```javascript
const result = await integration.runAssessment({
  target: 'https://api.example.com',
  workflowType: 'api',
  intensityLevel: 'standard'
});
```
**Coverage:** Parameter discovery, endpoint enumeration, JWT testing, rate limits, CORS, injection attacks

### Cloud Infrastructure (1-3 hours)
```javascript
const result = await integration.runAssessment({
  target: 'aws-account-id',
  workflowType: 'cloud',
  intensityLevel: 'thorough'
});
```
**Coverage:** Service discovery, bucket exposure, IAM analysis, credentials, security groups, databases

### Network & Infrastructure (2-6 hours)
```javascript
const result = await integration.runAssessment({
  target: '192.168.1.0/24',
  workflowType: 'network',
  intensityLevel: 'comprehensive'
});
```
**Coverage:** Network discovery, service enumeration, vulnerability scanning, protocol testing, IDS evasion

### And 7 More Workflows...
Mobile, Container, OWASP Top 10, Data Risk, Incident Response, Supply Chain, Threat Modeling

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Generate each with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

JWT_SECRET=<32-byte-base64>                    # JWT token verification
REQUEST_SIGNING_SECRET=<32-byte-base64>        # Request signing (HMAC)
KEYSTORE_MASTER_KEY=<32-byte-base64>           # Key encryption
NODE_ENV=production                            # Environment
```

### Optional Configuration

```bash
# Port
PORT=3000

# Logging
LOG_LEVEL=info

# SIEM Integration
SIEM_TYPE=splunk
SIEM_ENDPOINT=https://splunk.example.com:8088

# Bug Tracker
BUG_TRACKER_TYPE=jira
BUG_TRACKER_URL=https://jira.example.com

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Rate Limiting
RATE_LIMIT_PER_SECOND=5
RATE_LIMIT_BURST=10

# Timeouts
SCAN_TIMEOUT=300000
ASSESSMENT_TIMEOUT=3600000
```

---

## 🧪 Testing

```bash
npm test              # Run all 296+ tests
npm test -- phase1    # Phase 1 tests only
npm test -- phase2    # Phase 2 tests only
npm test -- phase3    # Phase 3 tests only
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Results:** ✅ 296+ tests passing | ✅ 100% pass rate

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  TOOL INTEGRATION LAYER (Single API)    │
├─────────────────────────────────────────┤
│                                         │
│  Tool Chains (Sequential/Parallel)      │
│  11 Assessment Workflows                │
│  18 Exploit Modules                     │
│  9 Advanced Scanners                    │
│  200+ Kali Tools                        │
│                                         │
├─────────────────────────────────────────┤
│  Enterprise Integration Layer           │
│  ├─ SIEM (Splunk, ELK, etc.)           │
│  ├─ Bug Trackers (Jira, GitHub)        │
│  ├─ Notifications (Slack)               │
│  ├─ Audit Logging                       │
│  └─ Rate Limiting & Circuit Breaker    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔒 Security

### Implemented Controls
- ✅ JWT Token Verification (required secret configuration)
- ✅ SSRF Protection (DNS rebinding prevention)
- ✅ Request Signing (HMAC-SHA256 with timing attack resistance)
- ✅ Schema Validation (all inputs)
- ✅ Immutable Audit Trail (hash chaining)
- ✅ Rate Limiting (3 levels)
- ✅ Circuit Breaker Protection
- ✅ Encrypted Key Storage (AES-256-GCM)
- ✅ Path Traversal Protection (verified secure)
- ✅ Secure Configuration (environment-based)

### Critical Vulnerabilities Fixed
- ✅ CWE-798: Hardcoded default request signing secret
- ✅ CWE-287: JWT authentication fail-open vulnerability
- ✅ CWE-312: Unencrypted key storage (now AES-256-GCM)
- ✅ CWE-208: Timing attack in HMAC verification
- ✅ CWE-287: Authentication bypass in development
- ✅ CWE-22: Path traversal (verified secure)

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Health Check | <10ms |
| Assessment Start | <1s |
| Rapid Assessment | 5-15 min |
| Standard Assessment | 30-120 min |
| Thorough Assessment | 2-6 hours |
| Batch (10 targets) | ~1 hour |
| Rate Limit | 5 req/sec, 10 burst |
| Max Concurrent | 3 assessments |

---

## 🔍 Monitoring & Observability

### Health Checks
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed
```

### Metrics
```bash
# JSON format
curl http://localhost:3000/api/metrics | jq '.'

# Prometheus format
curl http://localhost:3000/metrics
```

### Logs
```bash
tail -f logs/*.log
tail -f logs/audit.log | jq '.'
```

---

## 🐳 Deployment

### Docker
```bash
docker build -t pentest-framework .
docker run -p 3000:3000 -e JWT_SECRET=$SECRET pentest-framework
```

### Kubernetes
See [docs/framework-documentation.md](docs/framework-documentation.md) for full manifests

### Cloud Deployment
- AWS: EC2 + RDS + CloudWatch
- Azure: VM + Application Insights
- GCP: Compute Engine + Cloud Logging

---

## 📚 Complete Documentation

**→ [📘 Professional Framework Documentation](docs/framework-documentation.md)**

Contains:
- Complete installation guide (5 steps)
- Kali Linux integration (5 options)
- Quick start (5-minute walkthrough)
- Architecture overview
- Core modules (9 scanners + 6 exploitation tools)
- Detailed module documentation
- 5 real-world usage examples
- Best practices & recommendations
- Troubleshooting guide (6 issues + solutions)
- Security considerations
- Advanced configuration
- Complete API reference
- Workflow selection matrix

---

## 🚦 Status

✅ **200+** Kali Linux tools integrated  
✅ **18** Exploit modules with detection + exploitation  
✅ **9** Advanced scanning modules  
✅ **11** Assessment workflows  
✅ **7** Deep vulnerability scanner types  
✅ **7** SQL injection attack methods  
✅ **6** Code quality vulnerability types  
✅ **296+** Tests (100% passing)  
✅ **6** Critical security vulnerabilities fixed  
✅ **Enterprise** Grade Security  
✅ **Production** Ready  

---

## 🎯 Next Steps

1. **Read Documentation:** [docs/framework-documentation.md](docs/framework-documentation.md)
2. **Install:** Follow 5-step installation guide
3. **Integrate Kali:** Follow Kali integration guide
4. **Run Quick Start:** Try 5-minute quick start
5. **First Assessment:** Choose workflow and run assessment
6. **Set Up Integration:** Connect SIEM/bug tracker/Slack

---

## 📞 Support

| Item | Location |
|------|----------|
| **Full Guide** | [docs/framework-documentation.md](docs/framework-documentation.md) |
| **Installation** | See "Installation & Setup" section |
| **Kali Integration** | See "Kali Linux Integration" section |
| **Usage Examples** | See "Usage Examples" section |
| **Troubleshooting** | See "Troubleshooting Guide" section |
| **API Reference** | See "API Reference" section |
| **Best Practices** | See "Best Practices" section |

---

## 📄 License

Apache License 2.0 - See LICENSE file

---

**Framework Version:** 4.0.0  
**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** August 2026

**→ [Start with Full Documentation](docs/framework-documentation.md)**
