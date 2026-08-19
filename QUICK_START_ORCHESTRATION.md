# Quick Start: Tool Chaining & Orchestration

## What's New? 🚀

Your 200+ Kali tools framework now includes:

1. **Tool Chaining** - Auto-run tools sequentially, in parallel, or conditionally
2. **Exploit Modules** - Detect and exploit 8 vulnerability types
3. **Integrated Orchestrator** - Complete assessment workflow (4 phases)

---

## 5-Minute Setup

### 1. Initialize the Orchestrator

```javascript
const { IntegratedPenetrationTestingOrchestrator } = require(
  './orchestrator/integrated-orchestrator'
);

const orchestrator = new IntegratedPenetrationTestingOrchestrator(
  logger,
  auditLogger,
  rateLimiter,
  circuitBreaker
);
```

### 2. Run Comprehensive Assessment

```javascript
const result = await orchestrator.runComprehensiveAssessment('example.com', {
  intensityLevel: 'thorough'
});

console.log(result.summary);
// {
//   target: 'example.com',
//   tools_executed: 16,
//   vulnerabilities_detected: 5,
//   exploits_verified: 2,
//   overall_risk: 'CRITICAL'
// }
```

### 3. View Results

```javascript
// Vulnerabilities found in Phase 2
console.log(result.phases.scanning.vulnerabilities);
// [
//   { vulnerabilityType: 'sqli', severity: 'CRITICAL' },
//   { vulnerabilityType: 'xss', severity: 'HIGH' }
// ]

// Confirmed exploits from Phase 3
console.log(result.phases.exploitation.confirmed);
// [
//   { vulnerabilityType: 'sqli', status: 'confirmed' }
// ]

// Risk assessment from Phase 4
console.log(result.phases.analysis.riskAssessment);
// {
//   criticalVulnerabilities: 1,
//   highVulnerabilities: 1,
//   confirmedExploits: 1,
//   overallRisk: 'CRITICAL'
// }
```

---

## Common Workflows

### Workflow 1: Quick Security Check (5-15 minutes)

```javascript
// Run rapid assessment - focus on CRITICAL/HIGH findings only
const rapidCheck = await orchestrator.runRapidAssessment('example.com', {
  focusCritical: true
});

console.log(`Found ${rapidCheck.findings.length} high-severity issues`);
```

### Workflow 2: Full Penetration Test (2-6 hours)

```javascript
// Comprehensive assessment with all 4 phases
const fullAssessment = await orchestrator.runComprehensiveAssessment(
  'example.com',
  { intensityLevel: 'thorough' }
);

// Generate report
const report = {
  target: fullAssessment.target,
  vulnerabilities: fullAssessment.phases.scanning.vulnerabilities,
  confirmed: fullAssessment.phases.exploitation.confirmed,
  risk: fullAssessment.summary.overall_risk
};

saveToFile('pentest-report.json', report);
```

### Workflow 3: API Security Assessment (30-60 minutes)

```javascript
// Define API testing chain
orchestrator.toolChain.defineChain('api-security', [
  { name: 'arjun', config: { timeout: 300000 } },      // Parameter discovery
  { name: 'nuclei', config: { timeout: 600000 } },      // Template scanning
  { name: 'sqlmap', config: { timeout: 600000 } },      // SQL injection
  { name: 'postman', config: { timeout: 300000 } }      // API testing
], {
  strategy: 'sequential',
  passOutputToNext: true
});

// Run custom workflow
const apiAssessment = await orchestrator.runCustomWorkflow(
  'api-security',
  'https://api.example.com',
  { endpoints: ['/api/v1', '/api/v2'] }
);
```

### Workflow 4: Batch Target Assessment

```javascript
const targets = ['target1.com', 'target2.com', 'target3.com'];
const results = [];

for (const target of targets) {
  const assessment = await orchestrator.runRapidAssessment(target);
  results.push({
    target,
    findings: assessment.findings.length,
    risk: assessment.findings[0]?.severity || 'NONE'
  });
}

console.table(results);
```

---

## Vulnerability Types Supported

### CRITICAL Severity
- ✅ **SQLi** - SQL Injection
- ✅ **RCE** - Remote Code Execution
- ✅ **Auth Bypass** - Authentication Bypass
- ✅ **Command Injection** - OS Command Injection

### HIGH Severity
- ✅ **XSS** - Cross-Site Scripting
- ✅ **SSRF** - Server-Side Request Forgery
- ✅ **Path Traversal** - Directory Traversal

### MEDIUM Severity
- ✅ **CSRF** - Cross-Site Request Forgery

---

## Tool Chain Strategies

### Sequential (Dependency-Based)
```javascript
// Tools run one after another; output → input
orchestrator.toolChain.defineChain('sequential-workflow', [
  'tool1',  // Runs first
  'tool2',  // Uses output from tool1
  'tool3'   // Uses output from tool2
], {
  strategy: 'sequential',
  passOutputToNext: true
});
```

### Parallel (Fast Execution)
```javascript
// All tools run simultaneously
orchestrator.toolChain.defineChain('parallel-workflow', [
  'nikto',
  'wfuzz',
  'nuclei',
  'burpsuite'
], {
  strategy: 'parallel'
});
```

### Conditional (Smart Execution)
```javascript
// Run tools based on previous results
orchestrator.toolChain.defineChain('smart-workflow', [
  'nmap',                    // Run first
  {
    name: 'wpscan',
    config: {
      // Only run if WordPress detected
      condition: (output) => output?.services?.includes('WordPress')
    }
  },
  {
    name: 'droopescan',
    config: {
      // Only run if Drupal detected
      condition: (output) => output?.services?.includes('Drupal')
    }
  }
], {
  strategy: 'conditional',
  passOutputToNext: true
});
```

---

## Getting Statistics

```javascript
// Overall statistics
const stats = orchestrator.getStatistics();
console.log(stats);
// {
//   kaliTools: { toolsExecuted: 145, successRate: '92.1%', ... },
//   toolChains: { chainsExecuted: 12, averageDuration: 450000, ... },
//   exploitModules: { exploitAttempts: 34, confirmationRate: '73.5%', ... },
//   assessments: {
//     total: 8,
//     completed: 7,
//     failed: 1,
//     avgDuration: 1200000
//   }
// }

// Assessment history
const history = orchestrator.getAssessmentHistory({
  target: 'example.com',
  status: 'completed'
});
console.log(`Completed ${history.length} assessments on example.com`);

// Chain execution details
const chainStats = orchestrator.toolChain.getStatistics();
console.log(`Success rate across all chains: ${chainStats.successRate}`);
```

---

## Advanced: Custom Exploit Module

```javascript
// Detect all vulnerabilities at once
const vulns = await orchestrator.exploitModule.detectVulnerabilities(
  'http://example.com',
  { parameters: ['id', 'q', 'url', 'cmd'] }
);

// Generate and verify exploits
const exploits = await orchestrator.exploitModule.generateExploits(
  'http://example.com',
  { parameters: ['id', 'q'] }
);

console.log(`Found ${exploits.exploitsGenerated} exploitable vulnerabilities`);

// Get exploit history
const history = orchestrator.exploitModule.getExploitHistory({
  vulnerabilityType: 'sqli'
});
```

---

## Test Everything

```bash
# Run orchestration tests
npm run test:orchestration

# Run all tests including chains
npm run test:chains

# Run complete test suite
npm run test:all --coverage
```

---

## Key Statistics After Running

| Metric | Value |
|--------|-------|
| **Kali Tools Available** | 200+ |
| **Tool Chain Strategies** | 3 (Sequential, Parallel, Conditional) |
| **Predefined Chains** | 5 |
| **Vulnerability Types** | 8 |
| **Assessment Phases** | 4 |
| **Test Cases** | 100+ |

---

## Integration Points

### With Your Existing Code

```javascript
// Existing Kali tools still work exactly the same
const kaliTools = orchestrator.kaliTools;
const nmap = await kaliTools.executeTool('phase1', 'nmap', 'example.com');

// New tool chaining built on top
const chainResult = await orchestrator.toolChain.executeChain('reconnaissance', {
  target: 'example.com'
});

// New exploit modules independent
const exploitResult = await orchestrator.exploitModule.exploit(
  'sqli',
  'http://example.com?id=1'
);

// All integrated into unified assessment
const assessment = await orchestrator.runComprehensiveAssessment('example.com');
```

### Backward Compatible ✅
- All 200+ Kali tools unchanged
- All existing tests pass
- All security fixes already applied
- Drop-in replacement for your current code

---

## Performance Characteristics

| Workflow | Duration | Tools | Tools/Min |
|----------|----------|-------|-----------|
| **Rapid** | 5-15 min | ~8 | 0.5-1.6 |
| **Standard** | 30-60 min | ~12 | 0.2-0.4 |
| **Comprehensive** | 2-6 hours | ~16 | 0.04-0.13 |
| **Full Pentest** | 4-8 hours | ~50+ | 0.1-0.2 |

---

## Troubleshooting

### Chain Not Executing
```javascript
// Check if chain is defined
if (!orchestrator.toolChain.chainDefinitions.has('my-chain')) {
  console.error('Chain not found - define it first');
}

// Check for errors
const history = orchestrator.toolChain.getChainHistory();
console.log(history[0].errors);
```

### Vulnerability Not Detected
```javascript
// Provide more parameters to test
const vulns = await orchestrator.exploitModule.detectVulnerabilities(
  target,
  {
    parameters: [
      'id', 'user', 'search', 'query', 'q', 'cmd', 'exec',
      'url', 'fetch', 'download', 'proxy', 'path'
    ]
  }
);
```

### Assessment Takes Too Long
```javascript
// Use rapid assessment instead
const quick = await orchestrator.runRapidAssessment(target);

// Or customize chain timeout
orchestrator.toolChain.defineChain('fast-scan', [
  { name: 'nikto', config: { timeout: 60000 } },  // 1 minute
  { name: 'nuclei', config: { timeout: 120000 } } // 2 minutes
], {
  strategy: 'parallel'
});
```

---

## Next Steps

1. **Run Your First Assessment** → See ORCHESTRATION_GUIDE.md
2. **Define Custom Chains** → Create workflow for your use case
3. **Review Exploit Modules** → Understand vulnerability detection
4. **Integrate with Your Tools** → Adapt to your pipeline

---

## Support

- 📖 **Full Guide**: See `ORCHESTRATION_GUIDE.md`
- 🧪 **Test Examples**: See `tests/orchestration.test.js`
- 💻 **Code**: See `orchestrator/` directory

Your penetration testing framework is now **production-ready** with full orchestration and automation! 🎉
