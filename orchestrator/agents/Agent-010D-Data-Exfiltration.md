# Agent-010D-Data-Exfiltration: Data Exposure & Exfiltration-Path Risk Assessment

## Overview
Assesses whether sensitive data reachable from a confirmed access point could realistically leave the environment undetected, and whether any monitoring would notice if it did. This agent's deliverable is a clear answer to two questions for the client: "what sensitive data is reachable from this access level?" and "would an unusual bulk export or unusual outbound destination ever be flagged?" It documents exposure and detection gaps — it does not perform bulk extraction of real user data, and only ever works with data the engagement's own test accounts legitimately created or that is explicitly in scope to view.

## Tools Integrated
- The application's own export/reporting/API features, used exactly as an authorized user would use them, to determine what volume and sensitivity of data is reachable
- Network egress/allowlist review (reused from CSP/CORS testing agents) to identify approved outbound destinations that could double as a covert exfiltration channel if their trust is misplaced
- Standard traffic-analysis tooling (already used by the Infrastructure agent) to confirm whether unusual outbound data volume would be visible to existing monitoring

## Testing Approach

### Phase 1: Initial Assessment
- Identify every bulk-data-access surface available at the current access level (export endpoints, reporting APIs, search/list endpoints with high page-size limits, database-adjacent admin tooling)
- Identify every outbound destination the environment trusts (CSP connect-src allowlist, permitted webhook targets, third-party integrations) as a potential disguised exfiltration channel
- Confirm what data-loss-prevention, egress monitoring, or anomaly detection is claimed to exist, if any

### Phase 2: Vulnerability Identification
- Identify any bulk-export or high-volume list/search endpoint that lacks rate limiting or pagination caps, meaning a large volume of records could be pulled quickly
- Identify any already-approved outbound destination (from CSP/webhook allowlists) whose owner/security posture would make it a plausible disguised exfiltration channel for stolen data
- Identify whether sensitive fields (PII, secrets, financial data) are included in exports/logs by default without redaction

### Phase 3: Exploitation & Validation
- Where scope permits, demonstrate the volume/rate at which data could be pulled using only the engagement's own test data and test accounts (e.g., time how long a full-catalog export takes and whether it is throttled or logged)
- Do not exfiltrate real user/customer data at any point; if a gap is found against production-adjacent real data, document the gap without extracting the data itself
- Confirm whether the demonstration activity produced any alert, log entry, or rate-limit response

### Phase 4: Documentation
- Document exactly what data category was reachable, at what volume/rate, and whether it was logged or alerted on
- Map to CVSS/OWASP/CWE as usual
- Frame remediation around egress monitoring, export rate-limiting, and default field-level redaction

## Validation Requirements
✓ Authentic vulnerability reproduction, using only engagement-owned test data
✓ No extraction of real user/customer data at any point
✓ Real evidence from target system
✓ Reproducible steps
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
- The exact export/list endpoint tested, the volume/rate achieved, using only test data
- Confirmation of whether any alert, log entry, or throttling response occurred
- The specific outbound-allowlist entry identified as a plausible disguised exfiltration channel, if any
- Screenshots of the relevant export/reporting UI

## Remediation Guidance
- Rate-limit and paginate bulk-export/list endpoints, and alert on unusually large or rapid exports
- Apply default field-level redaction for sensitive data in exports/logs unless explicitly needed
- Periodically review outbound allowlists (CSP connect-src, webhook destinations) for continued business justification
- Implement egress/DLP monitoring for anomalous outbound data volume

## Success Criteria
✓ Data-exposure surface and its volume/rate authentically demonstrated using only engagement-owned data
✓ Real evidence collected from target system
✓ No real user/customer data extracted
✓ Technical details sufficiently detailed for developer/ops understanding
✓ Remediation is actionable and addresses monitoring/detection gaps, not just the specific endpoint found

## Dependency Flow
**Input:** Target scope, access level from earlier agents, CSP/allowlist findings from Web/API agents
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
