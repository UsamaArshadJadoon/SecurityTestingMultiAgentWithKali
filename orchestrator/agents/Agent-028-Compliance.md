# Agent-028-Compliance: Compliance

## Overview
Compliance and regulatory-alignment assessment that translates control frameworks (GDPR, PCI-DSS, HIPAA, SOC 2, ISO 27001) into concrete, testable technical checks rather than a paperwork exercise. This agent verifies that the controls an auditor would sign off on actually hold up under adversarial testing — encryption of cardholder/PHI data at rest and in transit, access-control and least-privilege enforcement, audit logging integrity, data retention/deletion mechanics, and breach-notification-relevant safeguards. A pentest-informed compliance review catches the gap that document-only audits miss: a control that reads correctly in a policy binder but is misconfigured, disabled, or trivially bypassed in the running system. Because regulatory failures carry direct legal, financial (fines, card-brand penalties), and contractual consequences, findings must tie each technical gap explicitly to the specific control ID it violates so the business impact is unambiguous to non-technical stakeholders.

## Tools Integrated
- OpenSCAP / SCAP Security Guide — automated technical control benchmarking against CIS/DISA STIG baselines
- Chef InSpec — compliance-as-code checks mapped directly to PCI-DSS, HIPAA, and CIS control IDs
- Prowler / ScoutSuite / Steampipe — cloud configuration auditing against CIS Benchmarks, PCI-DSS, and SOC 2-relevant control sets (AWS/Azure/GCP)
- Nessus / OpenVAS (compliance/audit policy mode) — credentialed scans against PCI-DSS ASV and CIS benchmark policies
- ZAP / Burp Suite — technical verification of encryption-in-transit, session handling, and access-control claims underlying compliance controls
- testssl.sh — verifying PCI-DSS-mandated TLS configuration (no early TLS, approved cipher suites)
- Data discovery/DLP tooling (e.g., regex-based PAN/PII scanners, ggshield, custom scripts) — locating unencrypted cardholder data, PHI, or PII outside approved storage
- Manual evidence review — IAM policy exports, audit log samples, encryption-at-rest configuration, retention/deletion job configuration, BAA/DPA-relevant data flow diagrams

## Testing Approach

### Phase 1: Initial Assessment
- Identify which regulatory frameworks are in scope for this engagement (GDPR, PCI-DSS, HIPAA, SOC 2, ISO 27001) and pull the specific control set/requirement numbers that apply to the target's data flows
- Map data flows: where regulated data (cardholder data, PHI, personal data) enters, is processed, is stored, and exits the system, identifying every component that falls in scope for the relevant framework (e.g., PCI-DSS cardholder data environment boundary)
- Collect the technical baseline: encryption configuration for data at rest/in transit, IAM/RBAC policy exports, logging/SIEM configuration, backup and retention policies, third-party/subprocessor list
- Cross-reference the client's control narrative or SOC 2/prior-audit documentation (if provided) against what is actually observable in the environment to flag discrepancies early
- Confirm scope boundary and any segmentation claims (e.g., network segmentation reducing PCI-DSS scope) with actual network/access testing rather than accepting the diagram as fact

### Phase 2: Vulnerability Identification
- Test encryption-at-rest and in-transit claims technically: verify database/disk encryption is actually enabled (not just "supported"), confirm TLS is enforced (no plaintext fallback) for every regulated data path
- Verify access control implementation matches least-privilege/need-to-know requirements — test for excessive permissions, shared/generic accounts, missing MFA on privileged/remote access (PCI-DSS Req 8, HIPAA Access Control)
- Audit logging: confirm security-relevant events (auth, access to regulated data, admin actions) are actually logged, logs are tamper-evident/centralized, and retention meets the framework's minimum (e.g., PCI-DSS 12-month retention)
- Test data subject rights mechanics for GDPR: verify "delete my data" / data export functionality actually purges or exports data completely, including backups and downstream systems, rather than soft-deleting
- Check for regulated data appearing outside its authorized boundary — cardholder data or PHI in logs, error messages, debug endpoints, analytics events, or unencrypted backups
- Validate vendor/third-party data-sharing controls against DPA/BAA requirements — unauthenticated or overly permissive APIs exposing regulated data to subprocessors
- Review session and account management against framework-specific requirements (password complexity, session timeout, account lockout thresholds specified by PCI-DSS/HIPAA)

### Phase 3: Exploitation & Validation
- Where a control gap enables actual data exposure (e.g., cardholder data retrievable via an unauthenticated endpoint), demonstrate real extraction of a masked/redacted sample to prove impact without exfiltrating full regulated datasets
- Chain access-control weaknesses to show unauthorized access to regulated data by a lower-privileged or external-facing role, evidencing the specific control failure (e.g., PCI-DSS Req 7 least privilege)
- Confirm logging gaps by executing a representative sensitive action and showing it does not appear in the audit trail, proving detection/response controls would fail during a real incident
- Validate data retention/deletion failures by executing a deletion/export request end-to-end and confirming data persists in a downstream store, cache, or backup beyond the permitted window
- Reproduce each finding a second time to rule out environmental flukes before it is attributed to a specific control failure

### Phase 4: Documentation
- Map every finding to the exact control ID/requirement number it violates (e.g., "PCI-DSS Req 3.4", "HIPAA §164.312(a)(1)", "GDPR Art. 32", "SOC 2 CC6.1") in addition to standard CWE/OWASP mapping
- State the compliance consequence explicitly (potential fine exposure, audit finding severity, card-brand penalty risk, breach-notification trigger) alongside the technical CVSS score
- Note whether the gap represents a full control failure or a partial/compensating-control situation, since auditors weigh these differently
- Provide remediation framed both as a technical fix and as the specific compliance evidence needed to satisfy the control going forward (e.g., what artifact an auditor would need to see)

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
- Control-by-control mapping table showing each finding against its specific regulatory requirement ID
- OpenSCAP/InSpec/Prowler scan output showing pass/fail status per benchmark control
- Screenshots or exports of IAM policies, encryption configuration, and logging configuration as observed (not as documented)
- Sample regulated data (masked/redacted cardholder data, PHI, PII) demonstrating exposure without exfiltrating full datasets
- Timestamped proof that an executed sensitive action does or does not appear in the audit log/SIEM

## Remediation Guidance
- Specific technical fix mapped to the exact control ID it restores compliance with
- Compensating control suggestions where a full technical fix requires longer-term architectural change
- Evidence/artifact guidance describing what an auditor would need to see to consider the control satisfied
- Data retention/deletion process fixes covering all downstream stores (backups, caches, replicas, third-party processors)
- Estimated remediation effort and note on regulatory deadline/risk exposure if left unresolved

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
