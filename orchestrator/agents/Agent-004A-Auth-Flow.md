# Agent-004A: Authentication Flow Testing

## Overview
Focused testing of the authentication *flows* themselves — the multi-step state machines behind login, logout, session renewal, password reset/account recovery, and MFA enrollment/verification — as opposed to the protocol internals (covered by Agent-024) or the broader authorization surface (covered by Agent-004). Flow-level bugs are state bugs: a step that can be skipped, replayed, or reordered (completing a password reset without owning the account, reaching a post-MFA page without ever submitting an OTP, reusing a session ID issued pre-login) that produce account takeover even when every individual component is otherwise well-implemented. Because these flows are exactly where account-recovery and enumeration abuse concentrate, this agent gives password-reset/account-recovery testing dedicated depth, including response-timing analysis that is easy to skip in a surface-level login test.

## Tools Integrated
- **Burp Suite** (Repeater for step-skipping/replay, Sequencer for token randomness, Turbo Intruder for high-precision timing measurement) with **Autorize** for session/role-state diffing across flow steps
- **jwt_tool** — deep-claims analysis of any token minted mid-flow (session, password-reset, MFA-challenge, "remember me" token)
- **hydra** / **ncrack** — login and MFA brute-force testing to validate lockout/rate-limit thresholds under realistic attack volume
- Custom Python/`requests` timing-harness (many-sample mean/variance comparison, sequential + randomized ordering to control for server warm-up and network jitter) — purpose-built for the mandatory timing-oracle checks below
- **OWASP ZAP** — authenticated flow-state diffing, forced browsing past flow gates
- Postman/Newman — scripted, ordered replay of a full flow (request chaining) to test step-skipping and out-of-order submission

## Testing Approach

### Phase 1: Initial Assessment
- Map the complete state machine for every flow in scope: login, logout, session renewal/refresh, password reset/account recovery, MFA enrollment, MFA verification, "remember me"/persistent session, and concurrent-session handling — document every state transition and the check that's supposed to gate it
- Identify every token issued mid-flow (session cookie/JWT, password-reset token, MFA challenge token, remember-me token) and which step is supposed to invalidate or rotate it
- **MANDATORY, first pass — not deferred:** run password-reset/account-recovery token entropy and format analysis via Burp Sequencer (length, character set, sequential/timestamp-derived patterns, predictability) before any deeper flow testing begins
- **MANDATORY, first pass — not deferred:** run JWT deep-claims analysis (jwt_tool) on every token minted during these flows — `alg:none`, RS256→HS256 key confusion, weak/hardcoded secrets, `exp`/`aud`/`iss` enforcement, sensitive data in unencrypted claims — since a flow-issued token with a signing flaw is just as exploitable as one issued at protocol level
- **MANDATORY, first pass — not deferred:** stand up the timing-harness and baseline response times for login, password-reset-request, and MFA-verify endpoints against known-valid vs. known-invalid identifiers, across enough samples to be statistically meaningful — this runs alongside initial mapping, not as a follow-up round

### Phase 2: Vulnerability Identification
- Session fixation: confirm the session identifier issued pre-authentication is rotated (not merely re-authorized) on successful login
- Flow step-skipping: attempt to reach the post-MFA or post-reset state by direct navigation, replaying an earlier step's response, or reordering requests via Postman/Repeater
- Logout/password-change verification: confirm the server-side session/token is actually invalidated, not just cleared client-side, and that other active sessions are revoked on password change
- Password-reset/account-recovery abuse: token reuse across multiple reset attempts, missing expiry, failure to invalidate prior tokens on a new request, and — **explicitly** — a response-time side channel that distinguishes valid from invalid identifiers (timing-based account enumeration) even when response bodies and status codes are identical
- MFA implementation gaps: missing rate limiting on OTP submission (brute-forceable 6-digit codes), backup-code reuse, weak OTP entropy/short validity windows, and bypass via direct navigation past the challenge
- Account lockout and brute-force behavior under hydra/ncrack-driven load: confirm thresholds are enforced per-account and per-IP, and aren't bypassable via header spoofing (`X-Forwarded-For` rotation) or case/unicode variation of the identifier

### Phase 3: Exploitation & Validation
- Demonstrate full account takeover via a predicted or reused password-reset token, chained with the timing-oracle-confirmed valid identifier where applicable
- Demonstrate a working session-fixation exploit (attacker sets/knows the session ID pre-auth, victim authenticates, attacker reuses the same ID)
- Statistically validate the timing oracle with a documented sample size and mean-difference/confidence measure — not a single-request anecdote — before reporting it as exploitable
- Demonstrate an MFA-skip exploit (direct navigation, response tampering, or replay) resulting in full authenticated access without ever satisfying the second factor
- Demonstrate that a "logged out" or password-changed session/token is still accepted by the server, proving invalidation is broken

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
- Full flow-state diagram annotated with the exact step where the gating check failed
- Burp Sequencer entropy report for password-reset/account-recovery tokens
- Timing-harness output: raw per-request timings, computed mean/variance for valid vs. invalid identifiers, and the sample size used
- Session/token replay proof (request/response pair) showing acceptance after logout, password change, or expiry
- Decoded JWT (header/payload/signature) for any flow-issued token found to have a signing or claims weakness

## Remediation Guidance
- Rotate the session identifier on every privilege transition (pre-auth → authenticated, authenticated → MFA-verified), never merely re-authorize the existing one
- Make password-reset-request, login, and MFA-verify endpoints constant-time and response-identical regardless of identifier validity, and rate-limit them per-account and per-IP
- Invalidate password-reset tokens after first use and on issuance of a new one; enforce short, non-negotiable expiry windows
- Invalidate server-side session/token state immediately and for all active sessions on logout and password change, not just the requesting session
- Enforce MFA server-side as a hard gate on every subsequent request until satisfied, rather than a client-side redirect after a "step 1 passed" flag

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
