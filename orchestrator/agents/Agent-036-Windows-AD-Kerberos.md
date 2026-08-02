# Agent-036-Windows-AD-Kerberos: Active Directory & Kerberos Configuration Assessment

## Overview
Assesses a Windows Active Directory environment for the well-documented misconfiguration classes that BloodHound and the broader AD-security community have cataloged for years — weak service-account passwords exposed via standard Kerberos ticket requests, excessive or misconfigured delegation rights, and privilege-escalation paths created by accumulated ACL misconfigurations. The goal is to produce a prioritized, attack-path-mapped view of the domain so the client's identity/infrastructure team can close the highest-impact paths first, not to demonstrate a full domain compromise for its own sake.

## Tools Integrated
- BloodHound / SharpHound — domain-relationship collection and attack-path graph analysis, the standard tool for visualizing AD privilege-escalation paths
- PingCastle — automated AD security posture scoring against known hardening benchmarks
- ldapsearch / ldapdomaindump — directory enumeration and ACL/delegation review
- Impacket's example scripts — used read-only for enumeration (e.g., listing SPNs, querying domain trusts) rather than for credential attacks against production systems
- hashcat — offline cracking-speed assessment of any password hash obtained through an already-authorized, in-scope technique, used to characterize password-policy strength rather than to gain new access

## Testing Approach

### Phase 1: Initial Assessment
- Confirm the exact domain/OU scope in scope for this assessment and the credential level the assessment starts from (e.g., a standard low-privilege domain user, matching a realistic phished-credential starting point)
- Collect the domain relationship graph via SharpHound/BloodHound: users, groups, computers, sessions, ACLs, delegation configuration, trust relationships
- Run PingCastle (or equivalent) for an automated baseline posture score against known hardening benchmarks

### Phase 2: Vulnerability Identification
- Identify accounts with Service Principal Names set (Kerberoastable) and accounts with pre-authentication disabled (AS-REP roastable) — these expose ticket material that can be cracked offline to test password strength
- Identify excessive or misconfigured delegation (unconstrained delegation on non-DC hosts, unnecessary constrained/resource-based delegation) that creates privilege-escalation paths
- Use BloodHound's path-finding to identify the shortest attack path from a standard low-privilege user to Domain Admin (or equivalent tier-0 access), and identify which single ACL/delegation/group-membership fix would break the most paths at once

### Phase 3: Exploitation & Validation
- Where explicitly authorized, request Kerberos service tickets for Kerberoastable accounts and test the cracking speed of the resulting hash against a standard wordlist/rule set, to characterize password strength — not to gain persistent access
- Demonstrate the highest-value privilege-escalation path identified by BloodHound with the minimal action necessary to prove each step of the chain is real, using only the pre-agreed test account
- Confirm no persistent changes (no new group memberships, no modified ACLs, no created accounts) were left behind at the end of testing

### Phase 4: Documentation
- Document each finding as a specific graph edge/path (e.g., "User X has GenericAll over Group Y, which is a member of Domain Admins") rather than a generic narrative
- Prioritize remediation by how many attack paths a single fix would close, using BloodHound's own path-counting to justify priority order
- Map to CVSS/OWASP/CWE as usual

## Validation Requirements
✓ Testing confined to the agreed domain/OU scope and starting credential level
✓ Real evidence from target system
✓ No persistent changes left in the domain after testing
✓ Reproducible steps
✓ Complete technical documentation, referencing the exact BloodHound graph edges involved

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
- The BloodHound attack-path graph/export showing the specific edges involved in each finding
- PingCastle (or equivalent) posture score and the specific benchmark items failed
- Cracking-speed characterization for any Kerberoastable/AS-REP-roastable account tested, with the actual password value never included in the report
- Confirmation that no persistent domain changes remain after testing

## Remediation Guidance
- Rotate and strengthen passwords for any Kerberoastable/AS-REP-roastable service account; prefer Group Managed Service Accounts (gMSA) where supported
- Remove unconstrained delegation wherever not strictly required; scope constrained/resource-based delegation as tightly as possible
- Remediate the highest-path-count ACL misconfigurations first, using BloodHound's own path analysis to prioritize
- Implement a tiered administration model (tier 0/1/2) to prevent lower-tier compromise from reaching domain-wide privilege
- Monitor for Kerberoasting/AS-REP-roasting indicators (unusual volume of service-ticket requests) at the domain-controller logging level

## Success Criteria
✓ Domain relationship graph collected and analyzed
✓ Highest-value privilege-escalation path(s) identified and, where authorized, demonstrated with minimal action
✓ No persistent domain changes left behind
✓ Remediation prioritized by attack-path impact, not just individual finding severity

## Dependency Flow
**Input:** Target scope, starting credential level, domain relationship data
**Output:** Validated findings with evidence, prioritized by attack-path impact
**Feeds:** Post-exploitation/privilege-escalation agents and final penetration test report
