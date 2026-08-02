# Agent: Session Management

## Overview
Testing for session management flaws spanning weak token generation/predictability, session fixation, insufficient timeout and invalidation, insecure cookie attribute configuration, and JSON Web Token (JWT)-specific attacks (algorithm confusion, signature stripping, weak-secret brute force) wherever JWTs are used as bearer/session tokens. Impact ranges from session prediction/hijacking to full authentication bypass and privilege escalation when a forged or manipulated token is accepted by the application.

## Tools Integrated
- Burp Suite (Sequencer for token randomness/entropy analysis, Repeater for manipulation testing, JWT-focused extensions)
- jwt_tool (JWT structural analysis, alg-confusion testing, claim tampering, automated attack modes)
- hashcat / jwt-cracker (offline brute-forcing of weak JWT HMAC signing secrets)
- OWASP ZAP (session management scan rules)
- curl / custom scripts (systematic cookie attribute inspection across every endpoint that sets a cookie)

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all session-establishing endpoints: login, SSO/OAuth callback, password reset completion, "remember me" flows, API token issuance
- Classify the token type in use per flow: opaque server-side session identifier, JWT, or a custom signed token scheme
- Capture full cookie attribute sets (`Secure`, `HttpOnly`, `SameSite`, `Domain`, `Path`, expiry) for every session-bearing cookie
- Map logout behavior and both idle and absolute session timeout enforcement

### Phase 2: Vulnerability Identification
- Run Burp Sequencer against a large sample of captured tokens to test for insufficient entropy or predictable structure
- Test session fixation: confirm whether a pre-authentication session identifier is accepted and reused post-authentication rather than regenerated
- Test concurrent session handling and whether logout genuinely invalidates the session server-side (not just clearing the client cookie)
- Test idle-timeout and absolute-session-lifetime enforcement by holding a token past expected expiry and re-using it
- For JWTs: use jwt_tool to test acceptance of `alg: none`, RS256-to-HS256 key-confusion (using the known public key as the HMAC secret), signature stripping, and `kid` header injection/path traversal; brute-force weak HMAC secrets offline with hashcat where feasible

### Phase 3: Exploitation & Validation
- Build a session-fixation PoC: attacker pre-sets a known session identifier, victim authenticates using it, attacker reuses the same identifier to access the victim's authenticated session
- Demonstrate JWT forgery impact: craft a token with a modified privilege claim (e.g., `role: admin`) using a confirmed bypass (alg confusion, cracked secret, or signature-check omission) and show the server accepting it and granting elevated access
- Demonstrate full account takeover via predicted or reused token/session-ID replay from a different client/IP without triggering any re-authentication challenge
- Where Agent-002B has confirmed an XSS finding, chain it to demonstrate the realistic end-to-end path from script execution to actual session-token theft and reuse

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector Network; Attack Complexity Low for straightforward fixation/weak-secret findings, High where timing/race conditions are involved
- Privileges Required None for pre-auth session fixation; Scope Changed where a forged token grants access beyond the vulnerable authentication component
- Confidentiality/Integrity impact High for confirmed account-takeover chains

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
- Burp Sequencer entropy analysis output demonstrating token predictability
- Before/after session-identifier comparison proving fixation (same ID pre- and post-authentication)
- The forged JWT alongside its decoded header/payload/signature and the server's response accepting it
- Screenshot/log of a successful privileged action performed using a forged or reused token
- Full cookie attribute dump per session-bearing endpoint

## Remediation Guidance
- Regenerate the session identifier on every privilege-level change (post-login, post-privilege-escalation, post-password-change)
- Enforce `Secure`, `HttpOnly`, and `SameSite=Strict`/`Lax` on all session cookies
- Generate session identifiers using a cryptographically secure random source with sufficient entropy (128+ bits)
- Invalidate sessions server-side on logout, not merely by clearing the client-side cookie
- Enforce both a short idle timeout and an absolute session lifetime; for JWTs, pin the expected signing algorithm server-side (reject unexpected `alg` values), use strong per-environment signing keys with regular rotation, and re-validate authorization server-side rather than trusting client-editable claims

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, authentication flow map from Agent-002 recon, previous agent findings
**Output:** Validated session management findings with evidence
**Feeds:** Downstream agents and final penetration test report
