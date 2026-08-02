# Agent-001B: Active Network Discovery

## Overview
Active scanning sub-agent that takes the candidate host/subdomain list from Agent-001A and directly probes it — host discovery, full port scanning, service/version fingerprinting, and live web-asset enumeration — to confirm what is actually reachable and listening. This is the first point in the engagement where packets are sent to target-owned infrastructure, so it requires explicit rules-of-engagement authorization for active probing, agreed scan rates, and blackout windows before it runs. Its real-world value is converting "possibly exists" into "confirmed reachable": an exposed management interface, an unpatched service version, a dangling CNAME, or a tokenized link that is actually live and unauthenticated. Every confirmed live asset and service here becomes the concrete target list for Agent-002 (web), Agent-003 (API), and every vulnerability-specific exploitation agent that follows.

## Tools Integrated
- **nmap** - service/version fingerprinting (`-sV`), OS detection (`-O`), targeted NSE scripts (`--script vuln`, `default-creds`, `banner`)
- **masscan / zmap** - internet-scale port sweep across large CIDR ranges at high packet rates
- **naabu / rustscan** - fast initial port discovery, piped into nmap for deep service enumeration
- **dnsx / puredns** - active DNS resolution and wordlist-based subdomain brute forcing against the target's real nameservers
- **dnsrecon / fierce** - active zone transfer attempts (`dig axfr`), reverse DNS sweeps, and DNS cache snooping
- **httpx** - live web-asset probing (status code, title, tech stack, redirect chains, TLS info) at scale
- **gowitness / EyeWitness** - automated screenshotting of every confirmed live web asset for rapid visual triage
- **ffuf / gobuster** - virtual host discovery and directory/endpoint brute forcing against confirmed web hosts using SecLists wordlists
- **testssl.sh / sslyze / sslscan** - active TLS/cipher/protocol weakness analysis and certificate chain validation
- **Nuclei** - templated active scanning for known CVEs, exposed panels, and misconfigurations (`-t cves/ -t exposures/ -t misconfiguration/`)
- **WhatWeb / Wappalyzer** - active technology/CMS/framework fingerprinting via direct request
- **wafw00f** - WAF/IDS fingerprinting to calibrate stealth requirements for later exploitation phases
- **subjack / Nuclei takeover templates** - active confirmation of dangling CNAME / subdomain takeover candidates
- **searchsploit / vulners nmap script** - CVE correlation against confirmed service/version banners

## Testing Approach

### Phase 1: Initial Assessment
- Confirm active-scanning authorization explicitly covers the specific IP ranges/domains before sending a single packet, including agreed scan rate limits and blackout windows
- Import Agent-001A's passive candidate list (subdomains, hosts, legacy endpoints) as the initial active-scan target set
- Identify fragile or legacy hosts (e.g., known-sensitive production systems) requiring reduced scan intensity to avoid service disruption
- Exclude any explicitly out-of-scope hosts, including third-party-hosted assets (CDNs, SaaS platforms) not owned by the target

### Phase 2: Vulnerability Identification
- Host discovery: `nmap -sn` ping sweep; `masscan -p1-65535 --rate 10000` for large ranges; `rustscan` for a fast initial sweep piped into nmap for depth
- Full port scan on confirmed live hosts: `nmap -sS -sU -p- -T4 --min-rate 1000`
- Service/version fingerprinting and banner grabs: `nmap -sV -sC -oA output <target>`
- OS fingerprinting: `nmap -O`
- Active DNS zone transfer attempt: `dig axfr @ns1.target.com target.com`, `dnsrecon -d target.com -a`
- Active subdomain brute force with live resolution: dnsx/puredns against SecLists wordlists resolved directly through the target's authoritative nameservers
- Web probing on every open HTTP(S) port: `httpx -title -status-code -tech-detect -screenshot`
- Virtual host discovery via ffuf/gobuster vhost mode against bare IPs to reveal hostnames hidden behind wildcard DNS
- Active TLS/certificate analysis with testssl.sh/sslyze for weak protocols/ciphers, certificate chain issues, and SNI-based vhost harvesting
- Nuclei scan of all confirmed live hosts using cves/exposures/misconfiguration template sets
- Directory/endpoint brute forcing on discovered web apps for exposed admin panels, backup files, `.git` directories, and API documentation (Swagger/OpenAPI JSON)
- WAF/IDS fingerprinting with wafw00f to calibrate stealth/evasion requirements for downstream exploitation agents

### Phase 3: Exploitation & Validation
- Correlate confirmed service/version banners against known CVEs (searchsploit, vulners nmap script) to validate exploitability, then hand off to the relevant specialist exploitation agent rather than exploiting at this stage
- Confirm unauthenticated management interfaces (exposed Jenkins, phpMyAdmin, Elasticsearch, Kibana, Redis, RDP/VNC without auth) using a single benign, non-destructive authenticated-check request
- Actively verify subdomain-takeover candidates from passive recon by confirming the dangling CNAME resolves and the target cloud resource is genuinely unclaimed
- Chain findings for handoff: an expired/weak TLS cert plus an exposed admin panel plus default credentials becomes a prioritized target package for the agent handling that specific vulnerability class
- Re-verify tokenized/guest/shared-link endpoints surfaced during passive recon by directly requesting them to confirm reachability and absence of authentication

### Phase 4: Documentation
- Retain nmap output in XML, normal, and grepable formats for every scanned host
- Retain masscan/rustscan raw output and gowitness/EyeWitness screenshots of every live web asset
- Retain testssl.sh/sslyze TLS reports and Nuclei scan JSON output
- Document confirmed live/open findings distinctly from unconfirmed passive candidates, with the exact command used to verify each

## Validation Requirements
- Confirmed active hosts (responded to direct probing, not just passive inference)
- Verified open ports and service versions via direct banner grab
- Network topology and reachable service map documented
- Device/host OS identified where fingerprinting succeeds
- Every finding reproducible with the exact scan command and timestamp recorded

## CVSS Scoring
- Severity: Informational baseline, escalating per confirmed exposure (e.g., unauthenticated management interface, critical CVE match)
- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: Low-Medium (higher when confirmed unauthenticated services or known-exploitable versions are found)

## Output Format
```json
{
  "finding_id": "FINDING-0001",
  "agent": "Agent-001B",
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
- nmap output in XML, normal, and grepable formats
- masscan/rustscan raw scan output and timing logs
- Service banner captures and OS-fingerprint results
- gowitness/EyeWitness screenshots of confirmed live web assets
- testssl.sh/sslyze TLS/cipher analysis reports
- Nuclei scan JSON output for confirmed CVE/misconfiguration matches

## Remediation Guidance
- Close all unnecessary open ports and disable unused/legacy services
- Place management interfaces (Jenkins, Kibana, database admin tools, RDP/VNC) behind VPN or bastion with MFA, never exposed directly to the internet
- Apply network segmentation and explicit ingress/egress firewall rules per service tier
- Patch identified out-of-date service versions matched to known CVEs
- Suppress verbose banners/version disclosure in service and web server configuration
- Enforce modern TLS configuration (disable deprecated protocols/ciphers) per findings from active certificate analysis

## Success Criteria
✓ Complete host inventory of confirmed-live assets
✓ All active services identified with version confidence
✓ Network topology and reachable entry points mapped
✓ Subdomain-takeover and unauthenticated-interface candidates actively confirmed or ruled out
✓ Potential entry points prioritized for downstream exploitation agents

## Dependency Flow
**Input:** Passive candidate list from Agent-001A, explicit active-scanning authorization and scope
**Output:** Verified live host/service/version inventory with confirmed reachable entry points
**Feeds:** Agent-001 (aggregated attack surface map), Agent-002 (web pentest), Agent-003 (API security), and all vulnerability-specific exploitation agents
