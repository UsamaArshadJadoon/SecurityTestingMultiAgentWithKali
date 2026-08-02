# Agent-059-WebAuthn-Passkey-Security: WebAuthn / FIDO2 Passkey Security

## Overview
Testing the security of FIDO2/WebAuthn passkey implementations across registration (attestation) and authentication (assertion) ceremonies, plus the surrounding account-recovery and fallback-auth flows that determine whether passkeys actually raise the security bar or merely add a UX veneer over a weaker legacy path. Passkeys are increasingly deployed as a phishing-resistant, passwordless replacement for passwords, but server-side implementation bugs — accepting self-attestation without policy checks, failing to validate the relying party ID/origin binding, or silently permitting downgrade to SMS OTP/email magic-link on any client hiccup — can quietly erase every security benefit the protocol promises. This agent focuses specifically on server-side ceremony validation and auth-method fallback logic, since the browser/authenticator side of WebAuthn is implemented by the platform and is rarely the exploitable layer. Real-world impact ranges from full credential-registration hijack (an attacker binds their own authenticator to a victim account) to complete authentication bypass via a downgrade path that was never meant to be reachable once a passkey was enrolled.

## Tools Integrated
- **python-fido2** (Yubico's `fido2` library) — scripted, protocol-correct CTAP2/WebAuthn client for crafting registration/authentication ceremonies outside the browser, forging attestation statements, and fuzzing challenge/origin/RP ID fields
- **Burp Suite** (Repeater/Proxy, with WebAuthn-aware extensions where available) — intercepting and replaying `navigator.credentials.create()`/`.get()` request-response pairs and the server-side ceremony verification calls
- **Chromium virtual authenticator via CDP (`WebAuthn.enable`, driven through Playwright)** — emulating hardware authenticators (including "invalid"/none-attestation ones) without physical security keys, for genuine end-to-end ceremony automation
- **Custom Python scripts (requests + cryptography + fido2)** — replaying captured `clientDataJSON`/`attestationObject`/`authenticatorData` with tampered fields (origin, RP ID hash, flags byte, sign count) to test server-side verification rigor
- **mitmproxy** — inspecting the full registration/authentication ceremony traffic including any custom pre-flight or challenge-issuance endpoints
- **jwt_tool** — where WebAuthn assertions are exchanged for session JWTs, checking the downstream token issuance for its own weaknesses
- **Playwright** — driving genuine authenticated registration/login flows for dynamic confirmation of any Phase 2 finding

## Testing Approach

### Phase 1: Initial Assessment
- Map every WebAuthn-touching endpoint: challenge/options generation (`/webauthn/register/options`, `/webauthn/login/options`), ceremony verification (`/webauthn/register/verify`, `/webauthn/login/verify`), credential management (list/rename/delete registered authenticators), and any account-recovery or fallback-auth endpoint reachable when a passkey ceremony fails or is unavailable
- Identify the relying party configuration in use: RP ID value, allowed origins, attestation conveyance preference (`none`/`indirect`/`direct`/`enterprise`), user verification requirement (`required`/`preferred`/`discouraged`), and resident-key/discoverable-credential policy
- Enumerate every fallback/downgrade path reachable from a passkey-protected account: "lost your passkey" links, SMS/email OTP options still enabled post-enrollment, backup codes, password fields not disabled after passkey-only accounts are created
- Capture a full legitimate registration and authentication ceremony (challenge issuance through verification) with Burp/mitmproxy to serve as the baseline for tampering in Phase 2
- Confirm whether credential IDs, user handles, or challenge values are predictable, sequentially issued, or reused across ceremonies

### Phase 2: Vulnerability Identification
- **Attestation validation bypass**: submit registration ceremonies with self-attestation, `none` attestation, or a forged/untrusted attestation certificate chain (crafted via python-fido2) and confirm whether the server enforces any attestation trust policy it claims to require, or silently accepts anything with a well-formed structure
- **Challenge/replay weaknesses**: reuse a previously consumed challenge, submit a stale challenge past its expected TTL, or replay a captured `authenticatorData`/signature pair against the assertion-verify endpoint to test for missing challenge single-use enforcement
- **Origin/RP ID validation flaws**: tamper `clientDataJSON.origin` to a look-alike or attacker-controlled domain and tamper the RP ID hash inside `authenticatorData` to test whether the server actually recomputes and compares both fields rather than trusting client-supplied metadata
- **Sign counter regression**: replay an assertion with a sign counter lower than or equal to the last recorded value to test whether counter-rollback detection (a key clone-detection control) is actually implemented
- **Credential ID enumeration**: probe the login-options endpoint with guessed/sequential user handles or credential IDs to determine whether the server leaks which accounts have passkeys registered, or leaks credential ID lists pre-authentication, aiding targeted attacks
- **Authenticator downgrade / fallback abuse**: on an account that has enrolled a passkey, attempt every legacy auth path (password, SMS OTP, security question, magic link) to confirm whether any remain silently reachable, and whether they are enforced with equal or weaker assurance than the passkey itself
- **User verification bypass**: attempt authentication ceremonies with the UV flag deliberately unset in `authenticatorData` against endpoints that claim to require user verification (e.g., step-up for sensitive actions), to test whether the server actually inspects the flags byte

### Phase 3: Exploitation & Validation
- Build a minimal Python PoC (fido2 + requests) that completes a full registration ceremony using a forged/self-signed attestation statement and confirm the resulting credential is accepted and usable for subsequent login — proving attestation policy is not enforced end-to-end
- Chain a discovered origin-validation gap with a phishing-style relay: demonstrate that a ceremony initiated on an attacker-controlled origin is accepted by the relying party, defeating the core phishing-resistance guarantee of WebAuthn
- Where a fallback/downgrade path was found reachable post-enrollment, complete a full account takeover using only the weaker fallback method (e.g., SMS OTP interception or magic-link reuse) despite a passkey being enrolled, and document that the passkey provided no effective additional assurance
- Replay a captured assertion with an artificially incremented-then-reused sign counter to confirm whether clone detection actually locks the account or merely logs a warning
- Chain confirmed credential ID enumeration with the fallback-downgrade finding to show a full unauthenticated-to-authenticated path against a target account

### Phase 4: Documentation
- Document each finding with the exact ceremony fields tampered (origin, RP ID hash, attestation object, sign counter) and the corresponding server response proving acceptance
- Map findings to WebAuthn/FIDO2 specification requirements (W3C Level 2/3, CTAP2) that were violated, in addition to CVSS/CWE
- Clearly distinguish "protocol-level" bypasses (attestation/origin/counter) from "business-logic" bypasses (fallback/downgrade reachability), since remediation owners differ
- Include the raw base64url-encoded `clientDataJSON`/`attestationObject`/`authenticatorData` values used in each PoC so findings are independently replayable

## Validation Requirements
✓ Authentic vulnerability reproduction using protocol-correct WebAuthn ceremonies
✓ Real evidence from target system (captured and tampered ceremony payloads)
✓ Reproducible exploitation steps runnable via the provided Python PoC
✓ Complete technical documentation of which server-side check was missing or insufficient
✓ Verified impact assessment distinguishing protocol bypass from fallback-path abuse
✓ Proper data organization for downstream agents

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: typically Network (registration/assertion endpoints are network-reachable)
- Attack Complexity: Low for missing origin/challenge checks, High for attacks requiring a convincing phishing relay
- Privileges Required: None for pre-auth findings (enumeration, downgrade), Low where an existing session is needed to tamper a ceremony
- User Interaction: Required where a victim must complete part of a ceremony (phishing-relay scenarios), None for pure server-side validation gaps
- Scope: Changed where a WebAuthn bypass leads directly to account takeover of a different security context
- CIA Impact: Confidentiality/Integrity typically High for full authentication bypass findings

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
  "owasp_category": "A07:2021 - Identification and Authentication Failures",
  "cwe_id": "CWE-287",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Full request/response capture of the tampered registration or authentication ceremony alongside the original legitimate baseline
- Decoded (base64url) `clientDataJSON`, `attestationObject`, and `authenticatorData` structures showing the specific field that was accepted despite being invalid
- Sign-counter sequence log demonstrating rollback/reuse acceptance
- Screenshots/session evidence of successful login via a forged credential or fallback downgrade path
- Python PoC script output showing the full ceremony completing end-to-end

## Remediation Guidance
- Enforce and verify the configured attestation conveyance policy server-side (validate the attestation certificate chain against a trusted metadata service such as the FIDO Metadata Service) rather than accepting any well-formed attestation object
- Recompute and strictly compare both the RP ID hash and the `clientDataJSON.origin` against an allowlist on every ceremony — never trust client-supplied origin values implicitly
- Enforce single-use, time-bound challenges tied server-side to the specific ceremony session, and reject any assertion whose sign counter does not strictly increase
- Disable or equally harden every fallback authentication path once a user has enrolled a passkey, or require step-up re-verification before any fallback method can be used to access a passkey-protected account
- Avoid leaking passkey-enrollment status or credential ID lists in pre-authentication responses; return uniform responses regardless of enrollment state

## Success Criteria
✓ Vulnerability authentically reproduced via protocol-correct ceremony tampering
✓ Real evidence collected from target system
✓ Complete exploitation path documented, including any fallback-downgrade chain
✓ Technical details sufficiently detailed for developer understanding
✓ Impact clearly demonstrated (account takeover or phishing-resistance defeat)
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, relying party configuration details, previous agent findings (authentication/session-management recon)
**Output:** Validated WebAuthn/passkey findings with evidence
**Feeds:** Downstream agents (Authentication Testing, Session Management) and final penetration test report
