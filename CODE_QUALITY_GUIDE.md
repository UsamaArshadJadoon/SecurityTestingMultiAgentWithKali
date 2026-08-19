# Code Quality & Security Scanner - SonarQube Integration Guide

Professional-grade code analysis with static vulnerability detection, complexity analysis, and SonarQube integration.

## Features

### 1. Security Vulnerability Detection

Detects 8 vulnerability categories:

```javascript
const { CodeQualityScanner } = require('./orchestrator/code-quality-scanner');

const scanner = new CodeQualityScanner(logger);
const results = await scanner.scan('src/');

// Results include:
results.security.issues.forEach(issue => {
  console.log(`${issue.type}: ${issue.severity}`);
  console.log(`  File: ${issue.file}:${issue.line}`);
  console.log(`  Message: ${issue.message}`);
  console.log(`  Code: ${issue.code}`);
});
```

#### Vulnerability Types

**1. Hardcoded Secrets** (CRITICAL)
```javascript
// ❌ VULNERABLE
const apiKey = 'sk_live_abc123xyz789';
const password = 'admin123';

// ✅ SECURE
const apiKey = process.env.API_KEY;
const password = Buffer.from(process.env.PASSWORD, 'base64');
```

**2. SQL Injection** (CRITICAL)
```javascript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE id=${userId}`;

// ✅ SECURE
const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [userId]);
```

**3. XSS Vulnerabilities** (HIGH)
```javascript
// ❌ VULNERABLE
element.innerHTML = userInput;

// ✅ SECURE
element.textContent = userInput;
// or use DOMPurify
element.innerHTML = DOMPurify.sanitize(userInput);
```

**4. Path Traversal** (HIGH)
```javascript
// ❌ VULNERABLE
fs.readFile('./files/' + filename);

// ✅ SECURE
const path = require('path');
const filePath = path.join('./files/', filename);
if (!filePath.startsWith('./files/')) throw new Error('Invalid path');
fs.readFile(filePath);
```

**5. Command Injection** (CRITICAL)
```javascript
// ❌ VULNERABLE
exec(`command ${userInput}`);

// ✅ SECURE
execFile('command', [userInput]);
```

**6. Insecure Cryptography** (HIGH)
```javascript
// ❌ VULNERABLE
const hash = md5(password);

// ✅ SECURE
const hash = bcrypt.hashSync(password, 10);
```

**7. Insecure Random** (MEDIUM)
```javascript
// ❌ VULNERABLE
const token = Math.random().toString(36);

// ✅ SECURE
const token = crypto.randomBytes(32).toString('hex');
```

**8. Insecure Deserialization** (HIGH)
```javascript
// ❌ VULNERABLE
const obj = eval(userData);

// ✅ SECURE
const obj = JSON.parse(userData);
```

### 2. Code Complexity Analysis

Measures complexity across multiple dimensions:

```javascript
const results = await scanner._analyzeComplexity('src/');

console.log(`Lines of Code: ${results.metrics.lines_of_code}`);
console.log(`Functions: ${results.metrics.functions}`);
console.log(`Classes: ${results.metrics.classes}`);
console.log(`Cyclomatic Complexity: ${results.metrics.cyclomatic_complexity}`);
console.log(`Cognitive Complexity: ${results.metrics.cognitive_complexity}`);
console.log(`Maintainability Index: ${results.metrics.maintainability_index}`);

// Identify high-complexity functions
results.high_complexity_functions.forEach(func => {
  console.log(`Function: ${func.name}`);
  console.log(`  Cyclomatic: ${func.cyclomatic}`);
  console.log(`  Cognitive: ${func.cognitive}`);
  console.log(`  Severity: ${func.severity}`);
});
```

#### Thresholds

| Metric | Threshold | Status |
|--------|-----------|--------|
| Cyclomatic | 10 | Moderate complexity |
| Cognitive | 15 | High complexity |
| Maintainability | 80 | Good maintainability |

### 3. Code Duplication Detection

Identify repeated code blocks:

```javascript
const results = await scanner._detectDuplication('src/');

console.log(`Total Duplicated Lines: ${results.total_duplicated_lines}`);
console.log(`Duplication %: ${results.duplication_percentage}%`);

results.duplicated_blocks.forEach(block => {
  console.log(`Block: ${block.lines} lines, ${block.occurrences} occurrences`);
  console.log(`  Files: ${block.files.join(', ')}`);
  console.log(`  Severity: ${block.severity}`);
});
```

### 4. Test Coverage Analysis

Analyze test coverage by type:

```javascript
const results = await scanner._analyzeTestCoverage('src/');

console.log(`Overall Coverage: ${results.overall}%`);
console.log(`Line Coverage: ${results.line_coverage}%`);
console.log(`Branch Coverage: ${results.branch_coverage}%`);
console.log(`Function Coverage: ${results.function_coverage}%`);
console.log(`Statement Coverage: ${results.statement_coverage}%`);

// Get recommendations
console.log(`\nRecommendations:`);
results.recommendations.forEach(rec => console.log(`- ${rec}`));
```

### 5. Dependency Vulnerability Scanning

Check for vulnerable packages:

```javascript
const results = await scanner._scanDependencies('package.json');

console.log(`Total Dependencies: ${results.total_dependencies}`);
console.log(`Direct: ${results.direct_dependencies}`);
console.log(`Transitive: ${results.transitive_dependencies}`);

console.log(`\nVulnerabilities:`);
results.vulnerabilities.forEach(vuln => {
  console.log(`${vuln.package}@${vuln.version}`);
  console.log(`  Issue: ${vuln.vulnerability}`);
  console.log(`  Severity: ${vuln.severity}`);
  console.log(`  CVE: ${vuln.cve}`);
  console.log(`  Fixed in: ${vuln.fixed_in}`);
});
```

## Complete Assessment Workflow

### Quick Scan
```javascript
const scanner = new CodeQualityScanner(logger);
const results = await scanner.scan('src/');

console.log(`Total Issues: ${results.summary.total_issues}`);
console.log(`  Critical: ${results.summary.critical}`);
console.log(`  High: ${results.summary.high}`);
console.log(`  Medium: ${results.summary.medium}`);
console.log(`  Low: ${results.summary.low}`);
```

### Detailed Security Assessment
```javascript
const scanner = new CodeQualityScanner(logger);
const results = await scanner.scan('src/');

// Extract security issues
const securityIssues = results.security.issues;

securityIssues.forEach(issue => {
  if (issue.severity === 'CRITICAL') {
    console.log(`⚠️  CRITICAL: ${issue.message}`);
    console.log(`   ${issue.file}:${issue.line}`);
    console.log(`   ${issue.code}`);
  }
});
```

### Complexity Analysis Workflow
```javascript
const results = await scanner.scan('src/');

if (results.complexity.metrics.cyclomatic_complexity > 10) {
  console.log(`❌ High cyclomatic complexity!`);
  console.log(`   Refactor these functions:`);
  results.complexity.high_complexity_functions.forEach(func => {
    console.log(`   - ${func.name} (complexity: ${func.cyclomatic})`);
  });
}

if (results.complexity.metrics.maintainability_index < 80) {
  console.log(`❌ Poor maintainability!`);
  console.log(`   Improve code documentation and structure`);
}
```

## SonarQube Integration

### Generate SonarQube Report
```javascript
const scanner = new CodeQualityScanner(logger);
const scanResults = await scanner.scan('src/');

const sonarReport = await scanner.generateSonarQubeReport(scanResults);

console.log(`Project: ${sonarReport.project_key}`);
console.log(`Timestamp: ${sonarReport.timestamp}`);
console.log(`\nMetrics:`);
console.log(`  Lines of Code: ${sonarReport.measures.ncloc}`);
console.log(`  Complexity: ${sonarReport.measures.complexity}`);
console.log(`  Coverage: ${sonarReport.measures.coverage}%`);
console.log(`  Violations: ${sonarReport.measures.violations}`);
```

### Push to SonarQube Server
```javascript
const report = await scanner.integrateSonarQube(
  'http://sonarqube.example.com:9000',
  'my-project-key',
  scanResults
);

console.log(`Report URL: ${report.report_url}`);
console.log(`Gate Status: ${report.metrics.gate_status}`);
console.log(`Quality Gate: ${report.metrics.quality_gate.name}`);

report.metrics.quality_gate.conditions.forEach(condition => {
  console.log(`${condition.metric}: ${condition.status}`);
});
```

### Quality Gate Configuration
```javascript
// Default Quality Gate Conditions:
// 1. Coverage > 80% (if failing = WARN)
// 2. Duplicated Lines < 3% (if failing = OK)
// 3. Violations = 0 (if failing = FAIL)
```

## Report Generation

### HTML Report
```javascript
const scanner = new CodeQualityScanner(logger);
const scanResults = await scanner.scan('src/');

const htmlReport = await scanner.generateHTMLReport(scanResults, 'report.html');

// Report includes:
// - Summary statistics
// - Security issues table
// - Complexity metrics
// - Test coverage breakdown
// - Dependency vulnerabilities
```

### Console Report
```javascript
function printReport(results) {
  console.log('═══════════════════════════════════════════');
  console.log('    Code Quality & Security Report');
  console.log('═══════════════════════════════════════════');
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Issues: ${results.summary.total_issues}`);
  console.log(`   🔴 Critical: ${results.summary.critical}`);
  console.log(`   🟠 High: ${results.summary.high}`);
  console.log(`   🟡 Medium: ${results.summary.medium}`);
  console.log(`   🟢 Low: ${results.summary.low}`);
  
  console.log(`\n🔒 Security:`);
  console.log(`   Issues Found: ${results.security.issues.length}`);
  
  console.log(`\n📈 Complexity:`);
  console.log(`   Cyclomatic: ${results.complexity.metrics.cyclomatic_complexity}`);
  console.log(`   Cognitive: ${results.complexity.metrics.cognitive_complexity}`);
  
  console.log(`\n✅ Coverage:`);
  console.log(`   Overall: ${results.coverage.overall}%`);
  
  console.log(`\n📦 Dependencies:`);
  console.log(`   Vulnerabilities: ${results.dependencies.total_vulnerabilities}`);
}
```

## Security Patterns Reference

### Hardcoded Secrets Patterns
```regex
password\s*=\s*["']([^"']+)["']
api[_-]?key\s*=\s*["']([^"']+)["']
secret\s*=\s*["']([^"']+)["']
token\s*=\s*["']([^"']+)["']
```

### SQL Injection Patterns
```regex
query\s*=\s*["'`].*[+\s].*\$|%|@|var
execute\s*\(\s*query\s*[\+\s]
SELECT.*FROM.*WHERE.*\+
```

### XSS Patterns
```regex
innerHTML\s*=\s*
document\.write\s*\(
eval\s*\(
dangerouslySetInnerHTML
```

### Command Injection Patterns
```regex
exec\s*\(\s*["`']
system\s*\(\s*["`']
spawn\s*\(\s*["`']
\$\{.*\}
```

## Testing

```bash
# Run code quality scanner tests
npm test -- tests/code-quality-scanner.test.js

# Run specific test group
npm test -- tests/code-quality-scanner.test.js -t "Security"

# With verbose output
npm test -- tests/code-quality-scanner.test.js --verbose

# Run with coverage
npm run test:coverage
```

## Best Practices

### 1. Regular Scanning
```bash
# Scan on every commit
git hooks/pre-commit: npm run scan

# Daily scans
cron: 0 2 * * * npm run scan:all
```

### 2. Fix High/Critical Issues First
```bash
# Sort by severity
results.issues.sort((a, b) => {
  const severity = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return severity[a.severity] - severity[b.severity];
});
```

### 3. Maintain Minimum Coverage
```bash
// Minimum 80% test coverage requirement
if (results.coverage.overall < 80) {
  throw new Error('Test coverage below minimum threshold');
}
```

### 4. Monitor Complexity Trends
```bash
// Track complexity over time
const trend = {
  timestamp: new Date(),
  cyclomatic: results.complexity.metrics.cyclomatic_complexity,
  cognitive: results.complexity.metrics.cognitive_complexity,
  maintainability: results.complexity.metrics.maintainability_index
};
```

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Code Quality Scan
  run: |
    npm run scan
    npm run sonarqube-push
```

### GitLab CI
```yaml
code_quality:
  script:
    - npm run scan
    - npm run sonarqube-push
```

### Jenkins
```groovy
stage('Code Quality') {
  steps {
    sh 'npm run scan'
    sh 'npm run sonarqube-push'
  }
}
```

## Performance Tuning

| Scan Type | Time | Size Limit |
|-----------|------|-----------|
| Security | 30-60s | 100k LOC |
| Complexity | 20-40s | 200k LOC |
| Coverage | 30-60s | All |
| Duplication | 20-30s | 100k LOC |
| Dependencies | 10-20s | All |

## Troubleshooting

### Issue: "SonarQube connection failed"
```javascript
// Check credentials and connectivity
const report = await scanner.integrateSonarQube(
  'http://sonarqube:9000',  // Verify URL
  'project-key',
  results
);
```

### Issue: "Too many false positives"
```javascript
// Adjust complexity thresholds
scanner.complexityThresholds.cyclomatic = 15;  // More lenient
scanner.complexityThresholds.cognitive = 20;
```

### Issue: "Coverage reports not matching"
```javascript
// Ensure consistent test runner and coverage tool
// Use same istanbul/nyc configuration
// Verify include/exclude patterns match
```

## Advanced Usage

### Custom Pattern Detection
```javascript
const customPatterns = {
  customVuln: [/dangerous_pattern/g],
  logging: [/console\.log/g]
};

// Merge with existing patterns
Object.assign(scanner.securityPatterns, customPatterns);
```

### Batch Scanning
```javascript
async function scanMultipleProjects(projects) {
  const results = {};
  for (const project of projects) {
    results[project] = await scanner.scan(project);
  }
  return results;
}
```

## Test Coverage

- ✅ 50+ test cases
- ✅ Security detection (8 vulnerability types)
- ✅ Complexity analysis
- ✅ Duplication detection
- ✅ Coverage analysis
- ✅ Dependency scanning
- ✅ SonarQube integration
- ✅ Report generation
- ✅ Integration workflows

## Support & Resources

- **Documentation**: See docs/framework-documentation.md
- **Test Suite**: tests/code-quality-scanner.test.js
- **SonarQube**: https://www.sonarqube.org/
- **Integration**: See Tool Integration Layer

## License

Apache 2.0 - See LICENSE file
