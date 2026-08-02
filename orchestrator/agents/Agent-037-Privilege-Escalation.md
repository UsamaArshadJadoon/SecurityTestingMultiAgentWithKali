# Agent-037-Privilege-Escalation: Privilege Escalation

## Overview
Tests whether an authenticated, low-privilege application user can obtain functionality or data reserved for a higher-privileged role (vertical escalation) or another user's account (horizontal escalation) because the server fails to independently re-check authorization on each request. This class of weakness is common wherever access control is enforced only in client-side UI logic, or trusted from a client-supplied parameter (role, user ID, tenant ID) rather than validated server-side against the authenticated session. It matters because broken authorization routinely leads to account takeover, tenant data exposure, or administrative function abuse, and it is consistently one of the most impactful and most frequently found web application weaknesses (OWASP A01:2021 – Broken Access Control). The objective is to map every role/permission boundary, confirm any bypass safely with minimal footprint, and deliver findings that let engineering implement consistent, server-side authorization.

## Tools Integrated
- Burp Suite Professional with the Autorize extension — automatically replays captured requests under a lower-privileged session token to detect missing server-side authorization checks
- Burp Suite Repeater/Intruder — manual parameter tampering (role, user ID, object ID, tenant ID) and systematic ID/role enumeration
- OWASP ZAP — access-control and forced-browsing scanning as a complementary automated pass
- AuthMatrix (Burp extension) — permission-matrix-driven testing that compares expected vs. actual access across every role x endpoint combination
- Scripted checks (Postman/Newman or Python + requests) — repeatable, multi-account regression testing against the documented permission matrix

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate application roles, the intended permission matrix, and every distinct privilege boundary (admin vs. standard user, tenant A vs. tenant B, owner vs. non-owner)
- Map all endpoints/functions/UI actions to the role(s) that should be permitted to invoke them
- Establish one authenticated session per role/tenant so requests can be replayed cross-role
- Identify where authorization appears to be enforced only client-side (hidden buttons/menus, role checks in front-end code) versus validated server-side

### Phase 2: Vulnerability Identification
- Use Autorize (or equivalent) to replay every captured low-privilege request pattern and flag any response that returns higher-privileged data or succeeds against a higher-privileged endpoint
- Manually test vertical escalation: can a standard user invoke admin-only endpoints/actions by calling the API directly, altering a role parameter, or bypassing a client-side-only check?
- Manually test horizontal escalation: can a user access or modify another user's/tenant's objects by altering an ID (IDOR-style) in the request?
- Check for mass-assignment issues where a request body accepts a `role`/`isAdmin`/`permissions` field the server should ignore or re-validate
- Classify each finding by root cause: missing server-side check, client-side-only enforcement, insecure direct object reference, or mass assignment

### Phase 3: Exploitation & Validation
- Confirm impact with the minimum action necessary to prove the boundary is broken (e.g., a single read of restricted data, or one benign state change) rather than the most damaging action available
- Capture the exact request/response pair proving the low-privilege session obtained a high-privilege result, including both session tokens/cookies involved
- **Immediately after any live demonstration that changes state (a role change, a data write, an account modification), perform an explicit revert step and independently verify it from a fresh authenticated session** — log in again as the affected account, rather than reusing the demonstration session, and confirm the role/permissions/data have returned to their original state
- Record this revert confirmation — the follow-up request/response showing restored state — as required evidence; the finding is not considered validated until the revert is confirmed independently
- Never demonstrate escalation against another real user's live data or account; use only test accounts provisioned for the engagement

### Phase 4: Documentation
- Document the specific endpoint(s), the missing or flawed server-side check, and the exact request modification that triggered the bypass
- Assign CVSS 3.1 scoring and map to OWASP A01:2021/A04:2021 and the relevant CWE (e.g., CWE-862 Missing Authorization, CWE-863 Incorrect Authorization, CWE-284 Improper Access Control)
- Attach the Autorize/permission-matrix comparison output showing which endpoints failed authorization checks
- Provide developer-actionable remediation describing exactly where a server-side check must be added

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
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output (nmap, burpsuite, etc.)
- Configuration file excerpts
- Database dumps (if applicable)

## Remediation Guidance
- Specific fix recommendations
- Code examples for developers
- Configuration changes needed
- Best practices to implement
- Estimated effort to fix
- Compliance considerations

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
