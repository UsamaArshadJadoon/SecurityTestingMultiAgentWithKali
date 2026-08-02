# Agent-020-Defense-Evasion-AV-EDR: Detection-Coverage Assessment (Purple Team)

## Overview
Assesses whether the client's own endpoint detection and response (EDR) tooling and security monitoring would actually generate an alert when a documented, publicly-cataloged MITRE ATT&CK technique is executed in a controlled test. This is a purple-team / detection-coverage exercise, not an offensive evasion toolkit: the deliverable is a clear, technique-by-technique table answering "would your monitoring have caught this?" so the client's security operations team can close specific, named detection gaps. Every technique simulated here is drawn from MITRE ATT&CK's own public documentation and executed via a defender-built simulation framework, in coordination with the client's security/detection team, never as a stealth exercise against an unaware operations team unless the engagement's rules of engagement explicitly call for that (a true "detection blind-spot" test, still fully authorized and time-boxed).

## Tools Integrated
- Atomic Red Team — a defender-maintained, open-source library of small, discrete tests mapped directly to individual MITRE ATT&CK technique IDs, purpose-built for organizations to validate their own detection coverage
- MITRE CALDERA — an open-source adversary-emulation platform used by defenders to run structured, repeatable ATT&CK-mapped scenarios
- The client's own EDR/SIEM console (read access, coordinated with the client's security team) to check whether each simulated technique produced a corresponding alert
- Sysmon / native OS audit logging configuration review, to assess whether the underlying telemetry needed for detection is even being collected before testing whether it's being alerted on

## Testing Approach

### Phase 1: Initial Assessment
- Confirm with the client's security team which detection tooling is deployed (EDR vendor, SIEM, log aggregation) and agree on the coordination model for this exercise (announced purple-team session vs. authorized blind-spot test, per the rules of engagement)
- Select a representative set of MITRE ATT&CK techniques relevant to the client's actual environment and threat model, prioritizing techniques most commonly seen in real intrusions against similar organizations
- Confirm baseline telemetry collection is active (e.g., process-creation logging, network-connection logging) — a missing detection is a different finding than a missing rule on top of existing telemetry

### Phase 2: Vulnerability Identification
- Execute each selected Atomic Red Team test in sequence, in a controlled and time-boxed manner, recording the exact technique ID and command executed
- For each test, check the client's EDR/SIEM console (or have the client's team check, per the agreed coordination model) for a corresponding alert within a reasonable window
- Identify which techniques produced no alert at all versus which produced a delayed or low-fidelity alert

### Phase 3: Exploitation & Validation
- Re-run any technique that produced no alert a second time to rule out a transient monitoring outage rather than a genuine coverage gap
- Where possible, identify the specific missing detection rule/analytic that would have caught the technique, referencing the vendor's or SIEM's own rule-authoring documentation
- Document exact timestamps of each test execution so the client can independently cross-reference their own logs

### Phase 4: Documentation
- Produce a technique-by-technique coverage table: ATT&CK ID, technique name, executed (yes/no), detected (yes/no), time-to-detect if detected
- Prioritize remediation by technique prevalence in real-world intrusions, not just by how easy the technique was to simulate
- Frame each gap as a specific, actionable detection-engineering task, not a generic "improve monitoring" recommendation

## Validation Requirements
✓ Every technique simulated is drawn from public MITRE ATT&CK documentation, executed via a defender-built simulation tool
✓ Coordination model (announced vs. authorized blind-spot) agreed with the client before execution
✓ Real evidence of execution and of the client's monitoring response (or lack thereof)
✓ Reproducible steps referencing the exact Atomic Red Team test ID used
✓ Complete technical documentation

## CVSS Scoring
- This agent typically does not produce traditional CVSS-scored vulnerability findings; instead it produces a detection-coverage gap report
- Where a specific, severe detection gap is found (e.g., zero visibility into a high-impact technique class), score it using CVSS 3.1 with Scope: Changed to reflect the monitoring/detection system impact, using Attack Vector/Complexity/Privileges appropriate to the simulated technique

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
- The full technique-by-technique coverage table (ATT&CK ID, executed, detected, time-to-detect)
- Exact Atomic Red Team test IDs and execution timestamps for every technique run
- Screenshots or exports of the client's EDR/SIEM console showing (or failing to show) the corresponding alert
- Confirmation of the coordination model used for this exercise

## Remediation Guidance
- For each undetected technique, recommend the specific detection rule/analytic needed (referencing the EDR/SIEM vendor's own documentation where possible)
- Recommend enabling baseline telemetry (e.g., Sysmon with a solid configuration) where missing, before layering detection rules on top
- Recommend periodic re-running of this same technique set (regression testing for detection coverage) as tooling and rules evolve
- Prioritize closing gaps for techniques most prevalent in real-world intrusions against similar organizations

## Success Criteria
✓ Representative technique set executed and each result (detected/undetected) clearly documented
✓ Real evidence collected from both the execution side and the client's monitoring console
✓ No production disruption caused by the testing itself
✓ Remediation is actionable and specific to the exact missing detection, not generic advice

## Dependency Flow
**Input:** Target scope, client's detection-tooling inventory, agreed coordination model
**Output:** A technique-by-technique detection-coverage report
**Feeds:** Final penetration test report; client's security operations / detection-engineering team
