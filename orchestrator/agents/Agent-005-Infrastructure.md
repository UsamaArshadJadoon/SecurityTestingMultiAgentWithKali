# Agent-005-Infrastructure: Network & Infrastructure Security Assessment

## Overview
Assesses the network and infrastructure layer supporting the target application — open ports and exposed services, TLS/certificate configuration, DNS hygiene, and default/misconfigured infrastructure components (default certificates, exposed management interfaces, unnecessary exposed services). This is the foundational layer other agents build on: an accurate service/port inventory here feeds the Protocol Services, Database, and Cloud agents, and TLS/DNS findings here are often the cheapest, highest-value fixes in the whole engagement.

## Tools Integrated
- nmap / masscan / rustscan — port scanning and service/version fingerprinting
- testssl.sh / sslscan / openssl s_client — TLS/cipher-suite and certificate analysis
- dnsrecon / dnsx / dig / whois — DNS record analysis, zone-transfer testing, subdomain/DNSSEC/CAA review
- wafw00f — WAF/CDN edge-layer fingerprinting
- Non-SNI TLS handshake probing (raw openssl s_client without -servername) to reveal default/self-signed certificates that disclose backend platform (e.g. default ingress-controller certificates)

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all in-scope hosts/IP ranges and perform full TCP/UDP port scans, not just common-port scans, to avoid missing non-standard service ports
- Fingerprint every discovered service's version for later correlation with the Dependency Scanning agent
- Perform DNS enumeration: A/AAAA/CNAME/MX/TXT records, zone-transfer attempts, DNSSEC chain validation, CAA record presence

### Phase 2: Vulnerability Identification
- Run testssl.sh/sslscan against every TLS-terminating endpoint, checking protocol versions (reject SSLv3/TLS1.0/1.1), cipher strength, certificate validity/chain, and known TLS vulnerabilities (Heartbleed, ROBOT, POODLE, etc.)
- Perform a non-SNI raw TLS handshake against each host to check for a default/self-signed certificate disclosing the underlying platform (a common ingress-controller/load-balancer default-configuration disclosure)
- Check DNSSEC chain-of-trust integrity (a signed zone with no DS record in the parent zone is a broken chain, not a working one) and confirm CAA records exist and correctly restrict issuance
- Identify any exposed administrative/management interface (orchestration dashboards, database ports, remote-access services) reachable from the tested network position

### Phase 3: Exploitation & Validation
- For confirmed TLS weaknesses, demonstrate the specific protocol/cipher downgrade or vulnerability with a minimal PoC request
- For exposed management interfaces, confirm reachability and authentication requirement without attempting credential guessing beyond what's separately authorized under the Authentication agent's scope
- Document exact port/service/version combinations backing every finding

### Phase 4: Documentation
- Document each finding with its exact host:port, service/version, and specific misconfiguration
- Map to CVSS/OWASP/CWE as usual
- Group low-severity DNS/TLS hygiene findings together for the client if numerous, since remediation is often a single registrar/DNS-dashboard change addressing several findings at once

## Validation Requirements
✓ Authentic vulnerability reproduction
✓ Real evidence from target system
✓ Reproducible exploitation steps
✓ Complete technical documentation
✓ Verified impact assessment
✓ Proper data organization for downstream agents

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: Network/Adjacent Network/Local/Physical
- Attack Complexity: Low/High
- Privileges Required: None/Low/High
- User Interaction: None/Required
- Scope: Unchanged/Changed
- CIA Impacts: High/Low/None

## Output Format
```json
{
  "finding_id": "FINDING-0001",
  "agent": "Agent-XXX",
  "title": "Vulnerability Title",
  "description": "Detailed vulnerability description",
  "severity": "Critical/High/Medium/Low",
  "cvss_score": 9.8,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "affected_component": "Component or endpoint",
  "evidence": {
    "proof_of_concept": "PoC explaining the vulnerability",
    "request": "HTTP request or command that triggers the vulnerability",
    "response": "Response showing the vulnerability",
    "screenshots": ["base64-encoded-screenshot"]
  },
  "remediation": {
    "description": "Remediation steps",
    "vulnerable_code": "Example vulnerable code",
    "fixed_code": "Example fixed code",
    "effort": "2-4 hours"
  },
  "owasp_category": "A03:2021 - Injection",
  "cwe_id": "CWE-89",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Full port/service/version inventory (nmap output)
- testssl.sh/sslscan output showing the exact protocol/cipher/certificate issue
- DNS record dumps showing the specific DNSSEC/CAA/zone-transfer finding
- Raw TLS handshake output showing any default-certificate disclosure

## Remediation Guidance
- Disable legacy TLS protocols/ciphers; enforce TLS 1.2+ with strong cipher suites only
- Replace default/self-signed certificates on any TLS-terminating component with a properly issued certificate for that hostname
- Complete the DNSSEC chain of trust (publish the DS record in the parent zone) or fully disable DNSSEC if not maintained
- Add a CAA record restricting certificate issuance to the organization's chosen CA(s)
- Close or restrict any unnecessarily exposed management/administrative interface to internal-only network access

## Success Criteria
✓ Complete port/service inventory produced for downstream agents
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/ops understanding
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence, plus a service/port inventory feeding downstream agents
**Feeds:** Protocol Services, Database, Cloud, and Dependency Scanning agents; final penetration test report
