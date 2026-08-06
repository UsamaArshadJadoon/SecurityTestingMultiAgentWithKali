# Agent-0035: DNS Enumeration & Exploitation

## 🎯 Objectives

Comprehensive DNS enumeration and exploitation testing:
- DNS record enumeration (A, MX, TXT, NS, CAA, SOA)
- Zone transfer attacks (AXFR)
- Subdomain enumeration (passive + active)
- DNS rebinding attacks
- DNS spoofing and cache poisoning

## 📋 Scope & Dependencies

**Depends On**:
- Agent-001 (Reconnaissance)

**Tools Required**:
- `dig` / `nslookup`
- `dnsenum`
- `dnsrecon`
- `subfinder`
- `amass`
- `assetfinder`
- Custom Python scripts

## 🔍 Testing Techniques

### 1. DNS Record Enumeration
```bash
# Enumerate all DNS records
dig @8.8.8.8 target.com ANY
nslookup -type=ANY target.com

# Specific record types
dig @8.8.8.8 target.com A
dig @8.8.8.8 target.com MX
dig @8.8.8.8 target.com TXT
dig @8.8.8.8 target.com NS
dig @8.8.8.8 target.com CAA
dig @8.8.8.8 target.com SOA
```

### 2. Zone Transfer (AXFR)
```bash
# Attempt zone transfer
dig @ns1.target.com target.com AXFR
nslookup -type=AXFR target.com ns1.target.com

# Using dnsenum
dnsenum target.com
dnsrecon -d target.com -t axfr
```

### 3. Subdomain Enumeration
```bash
# Passive enumeration
subfinder -d target.com
amass enum -d target.com
assetfinder target.com

# Active brute force
dnsrecon -d target.com -t brt
wfuzz -c -w subdomains.txt -u "http://FUZZ.target.com"
```

### 4. DNS Rebinding
```bash
# Test if application trusts DNS responses
# Serve attacker's IP for first response, victim's IP for second
# Used to bypass same-origin policy
```

## 📊 Expected Findings

### Critical Findings
1. **Zone Transfer Allowed**
   - CVSS: 6.5 (Medium)
   - Full DNS zone exposed

2. **DNS Amplification DDoS Possible**
   - CVSS: 5.3 (Medium)
   - Open recursive resolver

### High Findings
3. **Sensitive Subdomains Enumerated**
   - Admin, staging, internal services exposed
   - CVSS: 6.5

4. **DNS Rebinding Vulnerability**
   - Same-origin bypass possible
   - CVSS: 7.5

## 🛡️ Remediation

### DNS Security Best Practices
```
- Disable zone transfers (AXFR)
- Implement DNSSEC
- Use private DNS servers for internal records
- Rate limit DNS queries
- Monitor for suspicious DNS activity
- Implement CAA records
```

## ✅ Success Criteria

- [ ] DNS records enumerated
- [ ] Zone transfer attempted
- [ ] Subdomains discovered
- [ ] Sensitive records identified
- [ ] Exploitation vectors documented
- [ ] Clear remediation provided

## 🔗 Related CVEs & References

- CWE-200: Exposure of Sensitive Information
- OWASP: Reconnaissance

---

**Priority**: HIGH  
**Tools**: dig, nslookup, dnsenum, subfinder, amass  
**Estimated Effort**: 2-3 hours
