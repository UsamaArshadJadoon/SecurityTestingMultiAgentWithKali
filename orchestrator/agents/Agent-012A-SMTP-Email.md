# Agent-012A-SMTP-Email: SMTP Email

## Overview
Specialized testing of SMTP mail-transport infrastructure — mail servers, relays, and submission gateways — where misconfiguration has outsized real-world impact. Open relays let attackers abuse the organization's mail infrastructure for spam and phishing, leading to IP/domain blacklisting. Weak or plaintext authentication exposes mailbox credentials to interception, and missing STARTTLS enforcement or certificate validation allows on-path attackers to read or alter mail in transit. Missing/weak SPF, DKIM, and DMARC records enable domain spoofing that directly powers business email compromise (BEC) and targeted phishing. Username enumeration via VRFY/EXPN/RCPT TO also feeds precision credential-stuffing and spray campaigns against the mail platform.

## Tools Integrated
- swaks (Swiss Army Knife for SMTP) - manual protocol interaction, STARTTLS testing, AUTH testing, header/envelope injection
- smtp-user-enum - VRFY/EXPN/RCPT TO based username enumeration
- nmap (smtp-commands, smtp-open-relay, smtp-enum-users, smtp-vuln-cve2010-4344, smtp-ntlm-info NSE scripts) - fingerprinting and scripted misconfiguration checks
- Metasploit (auxiliary/scanner/smtp/smtp_version, smtp_enum, smtp_relay) - version detection and relay testing
- hydra / medusa (smtp module) - SMTP AUTH brute force and credential spraying
- testssl.sh / sslscan - STARTTLS/implicit-TLS configuration, cipher, and certificate validation
- dig / dnsrecon - SPF, DKIM, DMARC, and MX record enumeration
- Wireshark / tcpdump - capturing plaintext AUTH LOGIN/PLAIN credential exchanges

## Testing Approach

### Phase 1: Initial Assessment
- Banner-grab ports 25/465/587 (`swaks --to test@target --server host -q`) to fingerprint MTA vendor/version (Exim, Postfix, Exchange, sendmail)
- Enumerate ESMTP extensions via `EHLO` response (AUTH mechanisms offered, STARTTLS, PIPELINING, 8BITMIME, SIZE)
- DNS reconnaissance: MX records, SPF record strength (`~all` vs `-all` vs missing), DKIM selectors, DMARC policy (`p=none/quarantine/reject`)
- Enumerate every exposed submission port (25 relay, 587 submission, 465 implicit TLS) since each may be configured differently
- Inspect the STARTTLS/465 certificate for expiry, weak cipher suites, and hostname mismatch

### Phase 2: Vulnerability Identification
- Open relay test: attempt `MAIL FROM:<external>` / `RCPT TO:<external>` relay to an outside domain without authentication (nmap `smtp-open-relay`, manual swaks probe)
- Username/account enumeration via `VRFY`, `EXPN`, and response-code/timing differences on `RCPT TO` for valid vs invalid recipients
- STARTTLS stripping/downgrade check and plaintext AUTH LOGIN/PLAIN exposure when TLS is not enforced before authentication
- Weak/default credential testing against AUTH (hydra/medusa smtp module), respecting lockout thresholds
- SPF/DKIM/DMARC misconfiguration enabling spoofing of the organization's domain (missing record, permissive `+all`, no DMARC enforcement)
- Header/CRLF injection in envelope or header fields enabling BCC injection or relay abuse
- Version-matched CVE check against the fingerprinted MTA (e.g., known Exim RCE chains, Exchange transport-related CVEs)

### Phase 3: Exploitation & Validation
- Demonstrate open relay by successfully delivering a message to an external mailbox through the target with a spoofed envelope sender, capturing the full SMTP transcript as evidence
- Chain enumeration into spraying: use validated usernames from VRFY/EXPN/RCPT TO to drive a low-and-slow, lockout-aware password spray against SMTP AUTH (and any shared-credential webmail endpoint)
- If plaintext AUTH is accepted, capture a credential exchange via packet capture to prove interception risk
- If SPF/DMARC is absent or permissive, send a spoofed test message that reaches an inbox unflagged, demonstrating phishing/BEC impact
- Validate any identified CVE with a safe, non-destructive PoC (version confirmation plus a benign command/response check, never a destructive payload)

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

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
- Full SMTP session transcripts (EHLO/AUTH/MAIL FROM/RCPT TO/DATA) showing the vulnerable exchange
- Captured relay proof-of-delivery (message headers showing external-to-external relay through the target)
- SPF/DKIM/DMARC record dumps (`dig TXT` output) and spoofed message delivery evidence
- Enumerated valid username list with the technique that produced it (VRFY/EXPN/RCPT TO)
- Packet capture excerpts showing plaintext credentials, redacted appropriately

## Remediation Guidance
- Disable open relay: restrict RCPT TO relaying to authenticated users/authorized networks only
- Enforce STARTTLS/mandatory TLS on submission ports and disable AUTH PLAIN/LOGIN over unencrypted sessions
- Disable or rate-limit VRFY/EXPN; return uniform responses for RCPT TO to prevent enumeration
- Publish and enforce strict SPF (`-all`), DKIM signing, and DMARC (`p=reject`) with reporting/monitoring
- Apply MTA vendor security patches and disable legacy or unauthenticated relay features
- Add SMTP AUTH lockout/rate-limiting and alert on password-spray patterns

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
