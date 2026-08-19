# Tool Chaining & Orchestration Guide

## Overview

The enhanced penetration testing framework now includes:

1. **Tool Chain Orchestrator** - Auto-runs sequential tools with result aggregation
2. **Exploit Modules** - Custom vulnerability exploitation (SQLi, XSS, RCE, etc.)
3. **Integrated Orchestrator** - Unified interface for comprehensive testing

---

## Part 1: Tool Chain Orchestration

### What is Tool Chaining?

Tool chaining automatically runs multiple security tools in sequence or parallel, passing output from one tool as input to the next, and aggregating all results into a single report.

### Chain Strategies

#### 1. Sequential Strategy
Tools run one after another; output from Tool A becomes input for Tool B.

```javascript
orchestrator.defineChain('reconnaissance', [
  { name: 'nmap', config: { timeout: 300000 } },
  { name: 'theHarvester', config: { timeout: 120000 } },
  { name: 'amass', config: { timeout: 300000 } }
], {
  strategy: 'sequential',
  passOutputToNext: true,
  stopOnFailure: false,
  aggregateResults: true
});
```

**Best for:**
- Dependency-based workflows
- Progressive data gathering
- Output refinement through multiple tools

#### 2. Parallel Strategy
All tools run simultaneously; results aggregated at the end.

```javascript
orchestrator.defineChain('web-scanning', [
  { name: 'nikto', config: { timeout: 300000 } },
  { name: 'wfuzz', config: { timeout: 600000 } },
  { name: 'nuclei', config: { timeout: 600000 } },
  { name: 'burpsuite', config: { timeout: 900000 } }
], {
  strategy: 'parallel',
  stopOnFailure: false,
  aggregateResults: true
});
```

**Best for:**
- Independent scanning tools
- Faster overall execution
- Comprehensive coverage without dependencies

#### 3. Conditional Strategy
Run Tool B only if Tool A succeeds or meets specific criteria.

```javascript
orchestrator.defineChain('vulnerability-assessment', [
  { name: 'nmap', config: { timeout: 300000 } },
  { 
    name: 'wpscan', 
    config: { 
      timeout: 300000,
      condition: (output) => output?.cms === 'wordpress'
    } 
  },
  { name: 'sqlmap', config: { timeout: 600000 } }
], {
  strategy: 'conditional',
  passOutputToNext: true,
  aggregateResults: true
});
```

**Best for:**
- Dynamic workflows
- CMS-specific testing
- Resource optimization

### Predefined Chains

#### Reconnaissance Chain
Gathers passive intelligence from multiple sources.

```javascript
await chainOrchestrator.executeChain('reconnaissance', {
  target: 'example.com'
});
```

**Tools:** nmap, theHarvester, amass, whois, shodan
**Duration:** 1-10 minutes
**Output:** Domains, subdomains, emails, IPs, services

#### Web Scanning Chain
Parallel active vulnerability scanning.

```javascript
await chainOrchestrator.executeChain('web-scanning', {
  target: 'http://example.com'
});
```

**Tools:** nikto, wfuzz, nuclei, burpsuite
**Duration:** 10-60 minutes
**Output:** Vulnerabilities, misconfigurations, findings

#### Full Penetration Test Chain
Complete end-to-end assessment.

```javascript
await chainOrchestrator.executeChain('full-pentest', {
  target: 'example.com'
});
```

**Tools:** 7 tools across all phases
**Duration:** 1-6 hours
**Output:** Complete security assessment

### Custom Chain Definition

```javascript
const orchestrator = new ToolChainOrchestrator(logger, auditLogger);

// Define custom chain
orchestrator.defineChain('api-security', [
  { name: 'arjun', config: { timeout: 300000 } },      // Parameter discovery
  { name: 'graphql-playground', config: {} },           // API detection
  { name: 'nuclei', config: { timeout: 600000 } },      // Template scanning
  { name: 'sqlmap', config: { timeout: 600000 } }       // SQL injection
], {
  strategy: 'sequential',
  passOutputToNext: true,
  aggregateResults: true
});

// Execute chain
const result = await orchestrator.executeChain('api-security', {
  target: 'https://api.example.com'
});

console.log(result.summary);
// {
//   totalTools: 4,
//   successful: 4,
//   failed: 0,
//   successRate: '100%',
//   duration: 1823000
// }
```

### Chain Result Structure

```javascript
{
  executionId: 'chain-reconnaissance-1726234567',
  chainName: 'reconnaissance',
  startTime: '2024-09-13T10:30:00Z',
  endTime: '2024-09-13T10:45:00Z',
  duration: 900000,
  tools: [
    {
      name: 'nmap',
      status: 'success',
      timestamp: '2024-09-13T10:30:15Z',
      outputSize: 15234,
      result: { /* nmap output */ }
    },
    {
      name: 'theHarvester',
      status: 'success',
      timestamp: '2024-09-13T10:32:45Z',
      outputSize: 8234,
      result: { /* emails, domains */ }
    }
  ],
  aggregated: {
    nmap: [{ timestamp: '...', data: {} }],
    theHarvester: [{ timestamp: '...', data: {} }]
  },
  summary: {
    totalTools: 2,
    successful: 2,
    failed: 0,
    successRate: '100.00%',
    totalErrors: 0,
    aggregatedFindings: 2,
    duration: 900000
  }
}
```

---

## Part 2: Exploit Modules

### Supported Vulnerability Types

#### 1. SQL Injection (SQLi)
**Severity:** CRITICAL
**Module:** `SQLiExploit`

```javascript
const result = await exploitModule.exploit('sqli', 'http://example.com/products?id=1', {
  parameters: ['id', 'search', 'user']
});

// Result:
// {
//   status: 'confirmed',
//   detected: {
//     vulnerable: true,
//     evidence: [
//       {
//         parameter: 'id',
//         payload: "' OR '1'='1",
//         indicator: 'SQL error detected'
//       }
//     ]
//   },
//   exploitation: {
//     exploited: true,
//     techniques: [
//       { technique: 'UNION-based injection', success: true, data: '...' }
//     ]
//   },
//   verification: {
//     verified: true,
//     method: 'UNION-based data extraction'
//   }
// }
```

**Detection Methods:**
- Error-based detection (SQL syntax errors)
- Time-based blind SQLi (SLEEP/BENCHMARK)
- UNION-based injection
- Boolean-based blind SQLi

#### 2. Cross-Site Scripting (XSS)
**Severity:** HIGH
**Module:** `XSSExploit`

```javascript
const result = await exploitModule.exploit('xss', 'http://example.com/search?q=test', {
  parameters: ['q', 'comment', 'message']
});

// Result includes:
// - Reflected XSS detection
// - Event handler injection (onerror, onload)
// - DOM manipulation payloads
// - Cookie stealing vectors
```

**Payload Types:**
- Script tag injection
- Event handler injection
- DOM-based XSS
- Cookie/credential stealing

#### 3. Remote Code Execution (RCE)
**Severity:** CRITICAL
**Module:** `RCEExploit`

```javascript
const result = await exploitModule.exploit('rce', 'http://example.com/exec?cmd=id', {
  parameters: ['cmd', 'exec', 'system']
});

// Result includes:
// - Command execution verification
// - Output analysis
// - System information retrieval
// - Reverse shell options
```

**Exploitation Vectors:**
- Direct command execution
- Code evaluation (eval, exec)
- Serialization flaws
- Template injection

#### 4. Server-Side Request Forgery (SSRF)
**Severity:** HIGH
**Module:** `SSRFExploit`

```javascript
const result = await exploitModule.exploit('ssrf', 'http://example.com/fetch?url=test', {
  parameters: ['url', 'fetch', 'download']
});

// Result includes:
// - Internal service discovery
// - AWS metadata access
// - Database enumeration
```

**Accessible Resources:**
- Internal services (Redis, MongoDB)
- Cloud metadata endpoints
- Private networks
- Local file access

#### 5. Cross-Site Request Forgery (CSRF)
**Severity:** MEDIUM
**Module:** `CSRFExploit`

```javascript
const result = await exploitModule.exploit('csrf', 'http://example.com/transfer', {});

// Result includes:
// - CSRF token detection
// - Payload generation
// - Exploitation vector
```

#### 6. Authentication Bypass
**Severity:** CRITICAL
**Module:** `AuthBypassExploit`

```javascript
const result = await exploitModule.exploit('auth-bypass', 'http://example.com/login', {
  username: 'admin'
});

// Result includes:
// - Default credentials
// - SQLi bypass techniques
// - Session fixation vectors
```

#### 7. Path Traversal
**Severity:** HIGH
**Module:** `PathTraversalExploit`

```javascript
const result = await exploitModule.exploit('path-traversal', 'http://example.com/file?path=', {});

// Result includes:
// - Accessible files
// - Directory traversal patterns
// - Sensitive data paths
```

#### 8. Command Injection
**Severity:** CRITICAL
**Module:** `CommandInjectionExploit`

```javascript
const result = await exploitModule.exploit('command-injection', 'http://example.com/exec?cmd=', {
  parameters: ['cmd', 'command']
});

// Result includes:
// - Command execution verification
// - System access confirmation
// - Reverse shell payloads
```

### Batch Vulnerability Detection

```javascript
const vulnerabilities = await exploitModule.detectVulnerabilities('http://example.com', {
  parameters: ['id', 'q', 'url', 'cmd']
});

// Returns: [
//   {
//     vulnerabilityType: 'sqli',
//     vulnerable: true,
//     severity: 'CRITICAL',
//     evidence: [...]
//   },
//   {
//     vulnerabilityType: 'xss',
//     vulnerable: true,
//     severity: 'HIGH',
//     evidence: [...]
//   },
//   {
//     vulnerabilityType: 'rce',
//     vulnerable: true,
//     severity: 'CRITICAL',
//     evidence: [...]
//   }
// ]
```

### Generate Exploits

```javascript
const exploits = await exploitModule.generateExploits('http://example.com', {
  parameters: ['id', 'q', 'url']
});

// Result:
// {
//   target: 'http://example.com',
//   vulnerabilitiesFound: 3,
//   exploitsGenerated: 3,
//   details: [
//     {
//       exploitId: 'exploit-sqli-...',
//       vulnerabilityType: 'sqli',
//       status: 'confirmed',
//       severity: 'CRITICAL'
//     },
//     // ... more exploits
//   ]
// }
```

---

## Part 3: Integrated Penetration Testing

### Comprehensive Assessment Workflow

```javascript
const orchestrator = new IntegratedPenetrationTestingOrchestrator(
  logger,
  auditLogger,
  rateLimiter,
  circuitBreaker
);

const assessment = await orchestrator.runComprehensiveAssessment('example.com', {
  intensityLevel: 'thorough',
  testDuration: '4hours'
});

// Phases executed:
// ✅ Phase 1: Reconnaissance (Passive Intelligence)
// ✅ Phase 2: Vulnerability Scanning (Active Detection)
// ✅ Phase 3: Exploitation (Verification)
// ✅ Phase 4: Analysis (Aggregation & Reporting)
```

### Assessment Result Structure

```javascript
{
  engagementId: 'engagement-1726234567',
  target: 'example.com',
  startTime: '2024-09-13T10:00:00Z',
  endTime: '2024-09-13T14:30:00Z',
  duration: 16200000,
  
  phases: {
    reconnaissance: {
      chain: 'reconnaissance',
      tools: 5,
      intelligence: {
        domains: ['example.com', 'www.example.com'],
        subdomains: ['api.example.com', 'mail.example.com'],
        emails: ['admin@example.com'],
        ips: ['192.0.2.1'],
        services: ['Apache 2.4.41', 'OpenSSH 7.4'],
        technologies: ['WordPress 5.9', 'PHP 7.4']
      }
    },
    scanning: {
      chain: 'web-scanning',
      tools: 4,
      vulnerabilities: [
        {
          vulnerabilityType: 'sqli',
          vulnerable: true,
          severity: 'CRITICAL'
        },
        {
          vulnerabilityType: 'xss',
          vulnerable: true,
          severity: 'HIGH'
        }
      ],
      summary: {
        critical: 1,
        high: 1,
        medium: 0
      }
    },
    exploitation: {
      exploits: [
        {
          vulnerabilityType: 'sqli',
          status: 'confirmed',
          severity: 'CRITICAL'
        }
      ],
      summary: {
        confirmed: 1,
        possible: 0
      }
    },
    analysis: {
      findings: [
        { category: 'intelligence', count: 23 },
        { category: 'vulnerabilities', count: 2 },
        { category: 'exploitable', count: 1 }
      ],
      riskAssessment: {
        criticalVulnerabilities: 1,
        highVulnerabilities: 1,
        mediumVulnerabilities: 0,
        confirmedExploits: 1,
        overallRisk: 'CRITICAL'
      }
    }
  },
  
  summary: {
    target: 'example.com',
    duration: 16200000,
    status: 'completed',
    tools_executed: 16,
    vulnerabilities_detected: 2,
    exploits_verified: 1,
    overall_risk: 'CRITICAL'
  }
}
```

### Rapid Assessment (Quick High-Priority Check)

```javascript
const rapidResult = await orchestrator.runRapidAssessment('example.com', {
  focusCritical: true,
  maxDuration: 30 * 60 * 1000 // 30 minutes
});

// Fast execution focusing only on CRITICAL and HIGH severity findings
// Result: { target, findings, duration }
```

### Custom Workflow Execution

```javascript
// Define custom workflow
const customChain = await orchestrator.runCustomWorkflow(
  'api-security',
  'https://api.example.com',
  { 
    endpoints: ['/api/users', '/api/products'],
    authentication: 'Bearer token123'
  }
);
```

---

## Part 4: Execution Flow Examples

### Example 1: Complete Assessment

```javascript
// Initialize orchestrator
const orchestrator = new IntegratedPenetrationTestingOrchestrator(
  logger, auditLogger, rateLimiter, circuitBreaker
);

// Run comprehensive assessment
const result = await orchestrator.runComprehensiveAssessment('vulnerable-app.local', {
  scope: 'full',
  intensityLevel: 'thorough'
});

// Analyze results
console.log('Overall Risk:', result.summary.overall_risk);          // CRITICAL
console.log('Vulnerabilities:', result.phases.scanning.summary);    // { critical: 3, high: 5 }
console.log('Confirmed Exploits:', result.phases.exploitation.summary); // { confirmed: 2 }

// Generate report
const report = generateReport(result);
```

### Example 2: API Security Testing

```javascript
// Define API testing chain
orchestrator.toolChain.defineChain('api-test', [
  { name: 'arjun' },              // Parameter discovery
  { name: 'nuclei' },             // Template scanning
  { name: 'sqlmap' },             // SQL injection
  { name: 'postman' }             // API documentation
], {
  strategy: 'sequential',
  passOutputToNext: true
});

// Execute API testing
const apiAssessment = await orchestrator.runCustomWorkflow(
  'api-test',
  'https://api.example.com',
  { endpoints: ['/api/v1', '/api/v2'] }
);
```

### Example 3: Batch Target Assessment

```javascript
const targets = ['target1.com', 'target2.com', 'target3.com'];

for (const target of targets) {
  const assessment = await orchestrator.runRapidAssessment(target);
  
  if (assessment.findings.length > 0) {
    console.log(`⚠️  ${target}: ${assessment.findings.length} issues found`);
  }
}
```

---

## Part 5: Statistics & Reporting

### Get Overall Statistics

```javascript
const stats = orchestrator.getStatistics();

// Returns:
// {
//   kaliTools: {
//     toolsExecuted: 145,
//     successRate: '92.1%',
//     ...
//   },
//   toolChains: {
//     chainsExecuted: 12,
//     averageDuration: 450000,
//     ...
//   },
//   exploitModules: {
//     exploitAttempts: 34,
//     confirmationRate: '73.5%',
//     ...
//   },
//   assessments: {
//     total: 8,
//     completed: 7,
//     failed: 1,
//     avgDuration: 1200000
//   }
// }
```

### Assessment History

```javascript
const history = orchestrator.getAssessmentHistory({
  target: 'example.com',
  status: 'completed'
});

// Returns array of past assessments with full details
```

---

## Part 6: Best Practices

### Chain Design

1. **Start with reconnaissance** - Gather intelligence before active testing
2. **Use parallel chains for independent tools** - Faster execution
3. **Conditional chains for resource optimization** - Run specific tools based on findings
4. **Always aggregate results** - Unified view of findings

### Exploit Module Usage

1. **Batch detection first** - Identify all vulnerabilities before exploitation
2. **Verify each finding** - Don't rely on detection alone
3. **Use appropriate payloads** - Match target environment
4. **Document evidence** - Keep proof of vulnerability

### Assessment Workflow

1. **Phase 1: Reconnaissance** - Baseline intelligence
2. **Phase 2: Scanning** - Active detection
3. **Phase 3: Exploitation** - Verification
4. **Phase 4: Analysis** - Risk assessment & reporting

---

## Summary

The integrated orchestration system provides:

✅ **200+ Security Tools** - Comprehensive Kali Linux integration
✅ **Tool Chaining** - Automated sequential/parallel execution
✅ **Exploit Modules** - 8 vulnerability types with detection & exploitation
✅ **Unified Workflow** - Complete assessment from reconnaissance to analysis
✅ **Result Aggregation** - Single report with all findings
✅ **Metrics & History** - Track execution and findings over time

This enables professional penetration testing with minimal manual intervention while maximizing coverage and accuracy.
