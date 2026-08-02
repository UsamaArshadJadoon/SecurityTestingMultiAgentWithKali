# Agent-024-OAuth-SAML-JWT: OAuth SAML JWT

## Overview
Protocol-level assessment of OAuth 2.0, OpenID Connect, SAML, and the JWTs that carry identity between them. This is the deepest layer of authentication testing: a flaw here (a forgeable ID token, a signature-wrapping bypass in a SAML assertion, a missing `aud`/`iss` check) doesn't just compromise one account — it can compromise every relying party trusting that identity provider, or every service trusting that token issuer, in a single exploit chain. Because these protocols are implemented independently by every client and library, the same specification is routinely misimplemented in exploitable ways (algorithm confusion, XML signature wrapping, redirect_uri bypass), which is why this agent tests the protocol mechanics directly rather than just the login UI. Findings routinely reach Critical severity because impact scales with every application federated to the compromised IdP/token issuer.

## Tools Integrated
- **jwt_tool** — the primary instrument: `alg:none` acceptance, RS256→HS256 key-confusion forgery (signing with the IdP's public key as an HMAC secret), signature stripping/tampering, and automated claim-manipulation scans
- **hashcat** (mode 16500) / jwt_tool `-C`/`-d` — offline brute-force and dictionary cracking of weak/hardcoded HMAC signing secrets
- **SAML Raider** (Burp extension) — XML Signature Wrapping (XSW) attack generation, certificate/signature manipulation, assertion replay
- **oidc-debugger** — walking and validating the OIDC authorization-code/implicit/hybrid flows and inspecting ID token claims live
- **oauth2-utils** — scripted authorization-code, client-credentials, and device-code flow testing, PKCE verifier/challenge manipulation
- **Burp Suite** (Repeater, Sequencer, Autorepeater) — `state`/`nonce`/authorization-code entropy analysis and replay testing
- `openssl` / `python-jose` or `PyJWT` scripting — crafting custom-signed tokens and validating JWKS key material by hand

## Testing Approach

### Phase 1: Initial Assessment
- Discover and fingerprint the protocol surface: `.well-known/openid-configuration`, JWKS endpoint, SAML metadata (IdP and SP), supported OAuth grant types/flows in use (authorization code, implicit, hybrid, client credentials, device code)
- Inventory every JWT in play (access token, ID token, refresh token, and any custom app-issued token) and how each is verified server-side
- **MANDATORY, first pass — not deferred:** run full JWT deep-claims analysis with jwt_tool on every token type: `alg:none` acceptance, RS256→HS256 key-confusion using a harvested public key/certificate, weak or hardcoded HMAC secrets (wordlist via jwt_tool, then hashcat mode 16500 if inconclusive), server-side enforcement of `exp`/`nbf`/`iat`, `aud` restricted to the intended service, `iss` matching the expected issuer exactly, and any PII/sensitive data present in unencrypted (base64-only) claims — flag if it should be a JWE instead of a plain JWS
- **MANDATORY, first pass — not deferred:** assess access/ID/refresh token lifetime appropriateness, and explicitly test refresh-token rotation and revocation behavior (does a rotated-out refresh token still work? is a refresh token invalidated on logout, password change, or explicit revocation?); also run entropy analysis on `state`, `nonce`, and authorization-code values via Burp Sequencer, and confirm rate limiting / check for a timing side channel on the token endpoint and any account-identifier-linked flows (e.g., account-linking, email-based lookup) it exposes
- Map SAML assertion structure (signed elements, `NotOnOrAfter`, `Audience`, `InResponseTo`, `OneTimeUse`) against what the SP actually validates

### Phase 2: Vulnerability Identification
- Redirect URI validation bypass (partial match, open redirect, subdomain takeover potential) enabling authorization-code/token theft
- Missing or predictable `state` parameter (CSRF on the OAuth callback) and missing PKCE on public/native/SPA clients
- SAML XML Signature Wrapping (XSW variants 1–8), signature-exclusion or "None" binding acceptance, and assertion replay due to missing `OneTimeUse`/expiry enforcement
- IdP/audience confusion and mix-up attacks when multiple issuers or relying parties share infrastructure
- OAuth scope escalation, `client_secret` exposure in SPA/mobile bundles, and confused-deputy patterns via the token exchange
- JWKS handling flaws: missing `kid` pinning, `jku`/`x5u` header injection to attacker-controlled key sets, key confusion flagged in Phase 1 now exploited end-to-end

### Phase 3: Exploitation & Validation
- Forge an `alg:none` or key-confused token and use it to authenticate as an arbitrary or elevated identity against a real protected endpoint
- Crack a weak/hardcoded HMAC secret and mint a fully valid, arbitrary-claims access or ID token
- Execute a SAML XSW attack to impersonate a different user's assertion and gain that user's session
- Replay a captured OAuth authorization code or refresh token after its intended single-use/rotation point to prove revocation is broken
- Bypass PKCE or `redirect_uri` validation to steal an authorization code end-to-end, chaining into full account takeover where possible

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
- Decoded JWT header/payload before and after tampering, alongside the exact jwt_tool/hashcat command and output used to forge or crack the token
- SAML Raider XSW attack proof (original vs. wrapped assertion XML, plus the resulting impersonated session)
- Burp Sequencer entropy reports for `state`, `nonce`, and authorization-code values
- Full OIDC discovery document (`.well-known/openid-configuration`) and JWKS response, annotated with the specific misconfiguration exploited
- Refresh-token rotation/revocation test log showing the token, the revocation-triggering action, and the subsequent (successful or failed) reuse attempt

## Remediation Guidance
- Enforce a strict server-side algorithm allowlist per key (reject `alg:none` and any algorithm the verifying key wasn't explicitly issued for); never reuse an RSA public key as an HMAC secret
- Use high-entropy signing secrets (256-bit minimum) or asymmetric keys, validate `exp`/`nbf`/`aud`/`iss` on every verification, and keep sensitive data out of unencrypted JWT claims (use JWE if it must travel in the token)
- Require PKCE for all public/native/SPA clients and validate `redirect_uri` via exact allowlist match, not substring or prefix matching
- Sign and validate the entire SAML assertion (not just a sub-element) to close XML Signature Wrapping vectors, and enforce `OneTimeUse`/expiry to prevent replay
- Implement short-lived access tokens paired with rotating refresh tokens backed by a real revocation list, invalidated on logout, password change, and rotation

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
