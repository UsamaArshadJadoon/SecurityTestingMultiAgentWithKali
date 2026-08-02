# Agent-049-Email-Infrastructure-Hardening: Mail Server & MTA Infrastructure Hardening

## Overview
Assesses the mail transfer infrastructure itself — the MTAs, DNS-based anti-spoofing records, and inter-server transport security — rather than application-level SMTP abuse (form-based email injection, notification-abuse business logic) which is covered elsewhere. A single misconfigured or unenforced DMARC policy, an accidentally open relay, or an unpatched Exim/Postfix/Exchange instance can turn the organization's own domain into a phishing platform impersonating itself, or hand an attacker direct access to send mail as any internal user. This agent validates that anti-spoofing controls are not just published but actually enforced by receiving mail systems, that no MTA in scope will relay third-party mail, and that mail transport between servers is encrypted rather than assumed to be.

## Tools Integrated
- swaks (Swiss Army Knife for SMTP) — scripted, precise SMTP transaction crafting for open-relay testing, STARTTLS enforcement testing, and envelope/header manipulation
- nmap (with `smtp-*` NSE scripts: smtp-open-relay, smtp-commands, smtp-enum-users) — MTA service fingerprinting, open-relay detection, and command-support enumeration
- dig / dnsrecon / MXToolbox-equivalent CLI checks — SPF/DKIM/DMARC record retrieval and syntax validation, MX record and reverse-DNS (PTR) consistency checks
- testssl.sh / openssl s_client -starttls smtp — STARTTLS/TLS configuration testing on the SMTP transport itself, including opportunistic-TLS downgrade testing
- Custom Python (smtplib + socket) script to perform exhaustive open-relay testing across every combination of authenticated/unauthenticated states and envelope-sender/recipient domain pairs (internal-to-external, external-to-external, external-to-internal) — more thorough than a single-shot relay check, since some MTAs relay only specific domain-pair combinations
- Custom Python (dnspython) script to query SPF/DKIM/DMARC records across every declared sending domain and subdomain in scope, parse the policy strictness (`-all` vs `~all` vs `?all`, DMARC `p=reject` vs `p=quarantine` vs `p=none`), and flag every domain with a missing or non-enforcing policy — including subdomains that inherit no explicit policy and are therefore spoofable by default
- Custom Python spoofed-mail-delivery test harness (smtplib) that sends a controlled test message with a forged From/envelope-sender to an authorized test mailbox and inspects the receiving system's Authentication-Results header to empirically confirm whether SPF/DKIM/DMARC enforcement actually rejects/quarantines the spoof, rather than trusting the published record alone

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every MTA in scope (MX records plus any additional outbound-only or internal relay hosts identified via the Infrastructure agent's port/service inventory) and fingerprint software/version via SMTP banner and command-support behavior
- Retrieve SPF, DKIM (for every selector in use), and DMARC records for the primary domain and every subdomain/sending-service domain in scope
- Confirm PTR (reverse DNS) records exist and resolve consistently for every outbound-mail-sending IP, since many receiving systems use PTR mismatch as a spam signal
- Identify whether STARTTLS is advertised on port 25/587/465 for each MTA and whether a TLS-transport policy (MTA-STS, DANE/TLSA) is published

### Phase 2: Vulnerability Identification
- Run the custom Python open-relay test harness against every MTA across the full matrix of sender/recipient domain combinations and authentication states, cross-validated with nmap's smtp-open-relay script and manual swaks probes
- Run the custom Python SPF/DKIM/DMARC policy script across every domain/subdomain, flagging: missing SPF records, SPF using `~all`/`?all` instead of `-all` in a mature deployment, missing or misconfigured DKIM selectors, and DMARC policies set to `p=none` (monitoring-only, providing no actual enforcement) rather than `p=quarantine`/`p=reject`
- Test STARTTLS behavior with openssl s_client/testssl.sh: confirm the MTA does not silently accept a STARTTLS-stripping downgrade, and check certificate validity on the mail-transport TLS endpoint (self-signed/expired certs undermine MTA-STS/DANE even if published)
- Send the controlled spoofed-mail test via the Python harness to an authorized test mailbox with a forged envelope-sender for each in-scope domain, and inspect the Authentication-Results header on delivery to empirically confirm whether SPF/DKIM/DMARC failure actually results in rejection/quarantine versus silent delivery to the inbox
- Check MTA version against known CVEs (correlated with the Dependency Scanning agent) for unpatched Postfix/Exim/Sendmail/Exchange remote-execution or authentication-bypass vulnerabilities

### Phase 3: Exploitation & Validation
- For a confirmed open relay, send a single controlled test message from the tested MTA to an authorized external test mailbox impersonating an arbitrary third-party sender domain, demonstrating the relay's capability without abusing it for actual spam/phishing volume
- For a confirmed non-enforcing DMARC policy, demonstrate the concrete spoofing scenario: an email purporting to be from the organization's own domain that a standard receiving mail provider would deliver to an inbox rather than quarantine/reject, using the Authentication-Results evidence from Phase 2
- For a confirmed unpatched MTA version with a known high-severity CVE, validate exploitability in a controlled, non-destructive manner appropriate to the specific CVE (version/banner confirmation at minimum; live exploitation only where explicitly authorized)
- Chain a confirmed open-relay or spoofing gap into business-impact framing: capability for external phishing-as-the-organization, or internal-user impersonation for business-email-compromise style attacks

### Phase 4: Documentation
- Document each finding with the exact MTA host, SMTP transcript (swaks/Python harness raw session log), and — for policy findings — the exact DNS record content retrieved
- Capture the Authentication-Results header evidence for every spoofing-enforcement test as primary proof of real-world (non-)enforcement
- Group DNS-record hygiene findings (SPF/DKIM/DMARC) by domain for efficient remediation, since a single organization may have dozens of sending subdomains needing individual policy attention
- Map to CVSS/OWASP/CWE as usual, treating open relay and non-enforcing DMARC as high-impact findings given their organization-wide phishing/impersonation blast radius

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
  "owasp_category": "A05:2021 - Security Misconfiguration",
  "cwe_id": "CWE-290",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Raw SMTP session transcripts (swaks/custom Python harness) demonstrating open-relay behavior
- DNS record dumps (SPF/DKIM/DMARC) for every domain/subdomain tested, with policy-strictness annotated
- Authentication-Results headers from delivered spoofed test messages proving actual enforcement (or lack thereof)
- STARTTLS/certificate evidence from testssl.sh/openssl s_client against each MTA
- MTA version/banner evidence correlated with known-CVE findings

## Remediation Guidance
- Disable relaying for any sender/recipient domain pair not explicitly authorized; restrict relay to authenticated, known internal senders only
- Publish SPF with a hard-fail (`-all`) qualifier, valid DKIM selectors for every sending service, and a DMARC policy set to `p=quarantine` or `p=reject` (not `p=none`) once alignment is confirmed via monitoring reports
- Apply an explicit DMARC/SPF policy to every subdomain, including non-sending subdomains, to close the default-spoofable-subdomain gap
- Enforce STARTTLS (reject plaintext delivery where feasible) and publish/maintain MTA-STS and/or DANE TLSA records with valid, current certificates on the mail-transport endpoint
- Patch MTA software to current stable versions on a regular cadence and subscribe to vendor security advisories for the specific mail-server product in use

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/mail-admin understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, MX/MTA inventory from Infrastructure agent, authorized external test mailbox, previous agent findings
**Output:** Validated findings with evidence, including per-domain SPF/DKIM/DMARC enforcement status
**Feeds:** Dependency Scanning and Infrastructure agents; final penetration test report
