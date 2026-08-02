# Agent-010E-Cleanup: Post-Engagement Cleanup & Revert Verification

## Overview
Ensures that every test account, role change, uploaded file, created record, or configuration change made anywhere during the engagement by any other agent is independently identified, reverted, and re-verified before the engagement is considered complete. This is not an optional housekeeping step — an engagement that finds real vulnerabilities but leaves behind an escalated test account or an un-reverted config change has itself introduced a new risk. This agent's job is to catch that failure mode before final sign-off.

## Tools Integrated
- A running inventory (maintained across the whole engagement) of every test account created, every role/permission change made, every record/file uploaded, and every configuration toggled by any other agent
- The application's own admin/audit UI, used to independently confirm each item's current state
- Fresh, unauthenticated or freshly-re-authenticated sessions (never reusing a session that was active during the original change) to verify reverts actually took effect

## Testing Approach

### Phase 1: Initial Assessment
- Collect the complete list of test artifacts and state changes reported by every other agent across the engagement (test accounts created, roles/permissions modified, records/files uploaded, configuration values changed)
- Cross-reference this list against what each originating agent claims it already reverted, to find any gap between "claimed reverted" and "independently verified reverted"

### Phase 2: Vulnerability Identification
- For each item in the inventory, identify whether it has actually been reverted or still exists in its modified/escalated state
- Flag any item where the only evidence of revert is a UI-level action within the same session that made the change, rather than independent confirmation from a fresh session

### Phase 3: Exploitation & Validation
- For every item still outstanding, revert it now: restore original role/permissions, delete created test accounts/records/files, restore original configuration values
- Re-verify each revert using a completely fresh, newly-authenticated session — not the session that performed the original change — confirming the state matches the pre-engagement baseline
- If any item cannot be reverted (e.g., a third-party system was touched, or revert access has expired), document this explicitly and escalate to the client immediately rather than closing the engagement silently

### Phase 4: Documentation
- Produce a complete revert-verification ledger: every item changed during the engagement, its original state, its revert action, and independent confirmation evidence
- This ledger is a required attachment to the final report, not an internal-only artifact

## Validation Requirements
✓ Every test artifact/state change made during the engagement is accounted for
✓ Every revert is independently confirmed via a fresh session, not the session that made the change
✓ Any item that could not be reverted is explicitly escalated and documented, never silently left
✓ Complete technical documentation of the full revert ledger

## CVSS Scoring
- Not applicable in the traditional sense — this agent does not produce vulnerability findings scored via CVSS. Any unreverted artifact discovered here should instead be raised as an immediate operational risk item to the client, separate from the standard findings list, since it represents active residual risk introduced by the engagement itself.

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
- The complete inventory of test artifacts/changes collected from every other agent
- Independent, fresh-session confirmation for every revert (screenshot or API response showing pre-engagement baseline state restored)
- Explicit escalation record for any item that could not be reverted

## Remediation Guidance
- This agent generates no client-facing remediation guidance of its own — its output is the assurance that the engagement left no residual risk behind
- If systemic gaps in the client's own account-deprovisioning or config-rollback tooling made cleanup harder than expected, note this as an observation for the client's operational hygiene, separate from the standard findings list

## Success Criteria
✓ 100% of test artifacts/changes from the entire engagement are accounted for in the ledger
✓ Every revert is independently confirmed via a fresh session
✓ Zero outstanding un-reverted items at engagement close, or explicit client sign-off obtained for any exception
✓ Ledger is complete, dated, and attached to the final report

## Dependency Flow
**Input:** Consolidated list of test artifacts/state changes from every other agent across the engagement
**Output:** A verified, evidenced revert ledger — a gating requirement before the final report can be issued
**Feeds:** Final penetration test report; blocks report finalization if incomplete
