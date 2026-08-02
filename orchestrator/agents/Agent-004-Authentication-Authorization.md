# Agent-004-Authentication-Authorization: Authentication Authorization

## Overview
Deep assessment of authentication and authorization controls: login and session mechanics, role/permission enforcement, and the token formats (JWT, opaque session IDs, API keys) that bind identity to every subsequent request. Broken authentication leads directly to account takeover; broken authorization leads to horizontal and vertical privilege escalation even when authentication itself is flawless — so this agent treats the two as a single attack surface rather than testing "can I log in" and "can I access X" separately. Findings here are frequently critical-severity because a single missing server-side check (an authz gate, a signature validation, a revocation check) can compromise every account on the platform. This agent is the generalist entry point; Agent-004A drills into individual flow state machines and Agent-024 drills into OAuth/OIDC/SAML/JWT protocol internals.

## Tools Integrated
- **Burp Suite** (Repeater, Intruder, Sequencer for token/session-ID randomness analysis) with **Autorize** and **Auth Analyzer** extensions for automated authorization-matrix diffing across roles
- **jwt_tool** — algorithm confusion (`alg:none`, RS256→HS256), signature stripping, claim tampering, and secret brute-forcing (`-C`/`-d` against wordlists)
- **hydra** / **ncrack** — credential brute-force and account-lockout/rate-limit behavior validation against login and MFA endpoints
- **ffuf** — endpoint and parameter discovery for hidden admin/authz-sensitive routes
- **OWASP ZAP** — authenticated vs. unauthenticated diffing, forced browsing
- Custom Python/`requests` timing-harness scripts — statistical response-time comparison for enumeration and timing-oracle testing (many-sample averaging to filter network jitter)
- **hashcat** (mode 16500) — offline JWT HMAC secret cracking when a wordlist attack via jwt_tool is inconclusive

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every authentication-adjacent endpoint: login, logout, registration, password reset/account recovery, MFA enrollment/verification, token refresh, SSO/federation callbacks, "remember me"
- Identify the session/token model in use (JWT vs. opaque session ID vs. hybrid) and map how each is issued, refreshed, and invalidated
- **MANDATORY, first pass — not deferred:** run full JWT deep-claims analysis with jwt_tool on every token type observed (access, ID, refresh, reset): `alg:none` acceptance, RS256→HS256 key-confusion (public key reused as HMAC secret), weak/hardcoded/default signing secrets, `exp`/`nbf`/`iat` enforcement, `aud`/`iss` restriction, and any PII or sensitive data sitting in unencrypted (base64-only) claims
- **MANDATORY, first pass — not deferred:** run credential/token entropy analysis with Burp Sequencer on session tokens and password-reset/account-recovery tokens (length, character-set, sequential/predictable patterns), and confirm rate-limiting exists on login, password-reset-request, and MFA-verify endpoints
- Establish a role/permission baseline (roles, scopes, entitlements) to test authorization against in Phase 2

### Phase 2: Vulnerability Identification
- Broken object/function-level authorization: horizontal (user A accessing user B's resources) and vertical (low-priv user reaching admin functions) privilege escalation via Autorize-driven request replay across roles
- Missing server-side authorization checks on API endpoints that only enforce restrictions in the UI/client
- JWT algorithm-confusion and signature-bypass attempts flagged in Phase 1, now exploited against real protected endpoints
- MFA bypass vectors: response-manipulation (`"mfa_required": false` toggling), missing rate limiting on OTP submission, backup-code reuse, direct navigation past the MFA step
- Password-reset/account-recovery flow abuse — **explicitly test for a response-time side channel that distinguishes valid from invalid identifiers (timing-based account enumeration), even when response bodies/status codes are byte-identical**; also check for reset-token reuse, missing expiry, and lack of invalidation of prior tokens on new request
- Session fixation, missing session invalidation on logout/password-change, and stale-token acceptance after revocation
- CSRF/CORS misconfiguration on authentication and account-management endpoints

### Phase 3: Exploitation & Validation
- Build working privilege-escalation PoCs (captured requests showing role A performing role B's restricted action)
- Forge a JWT using the confirmed weakness (`alg:none`, cracked/hardcoded secret, or key-confusion) and use it to access a protected resource as an arbitrary or elevated identity
- Demonstrate session/token reuse after logout or password change to prove invalidation is broken
- Statistically validate any timing oracle (repeated-sample mean/variance comparison, not a single measurement) before reporting it as exploitable enumeration
- Chain findings where applicable — e.g., predictable reset token + timing-confirmed valid email → full account takeover

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
- Decoded JWT header/payload/signature (before and after tampering), plus the jwt_tool command/output that produced the forged token
- Burp Sequencer entropy reports for session IDs and password-reset/account-recovery tokens (character-set/bit-strength estimate)
- Timing-oracle measurement table: mean/variance of response times for valid vs. invalid identifiers across N samples, with the statistical method used
- Side-by-side authorization-matrix requests (same request, different role/session) showing the privilege-escalation delta
- Session/token replay proof showing acceptance after logout, password change, or stated expiry

## Remediation Guidance
- Enforce authorization checks server-side on every request (never trust client-side role hiding); adopt a centralized policy/authz layer over ad hoc per-endpoint checks
- Pin JWT verification to a single expected algorithm and key type; never accept `alg:none` or an algorithm the server didn't explicitly configure for that key
- Use high-entropy signing secrets (256-bit minimum for HMAC) or asymmetric keys, and rotate/revoke refresh tokens on logout, password change, and suspected compromise
- Make login, password-reset, and MFA-verify endpoints constant-time and response-identical regardless of whether the identifier exists, and apply per-account/per-IP rate limiting
- Invalidate server-side session/token state immediately on logout and password change rather than relying solely on client-side token deletion

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
