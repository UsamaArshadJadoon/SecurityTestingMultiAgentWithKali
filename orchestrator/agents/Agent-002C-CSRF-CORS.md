# Agent: CSRF and CORS Testing

## Overview
Testing for Cross-Site Request Forgery (state-changing requests lacking adequate anti-forgery protection) and Cross-Origin Resource Sharing misconfiguration (overly permissive `Access-Control-Allow-Origin`/`Access-Control-Allow-Credentials` combinations that let an arbitrary origin read authenticated responses). The two are frequently chained: a CORS misconfiguration can itself function as a data-exfiltration primitive equivalent to CSRF, and a confirmed CSRF finding often compounds a separately-found CORS flaw into full account compromise. Impact spans unauthorized state changes performed on a victim's behalf (password/email change, funds transfer) to silent cross-origin theft of authenticated JSON responses.

## Tools Integrated
- Burp Suite (built-in CSRF PoC generator, Repeater for token-stripping tests, manual Origin header manipulation)
- OWASP ZAP (CORS and anti-CSRF token scan rules)
- Corsy / CORScanner (automated CORS misconfiguration detection across large endpoint sets)
- curl (precise header-level probing of preflight and actual CORS responses)
- Custom self-hosted HTML/JS PoC pages for real cross-origin exploitation demonstration

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all state-changing endpoints (POST/PUT/PATCH/DELETE forms and API calls) across every authenticated role
- Identify the CSRF protection mechanism in use, if any: synchronizer token, double-submit cookie, custom request header requirement, or none
- Enumerate every CORS-enabled endpoint by sending controlled `Origin` header probes across all API routes and recording the `Access-Control-Allow-Origin`/`-Allow-Credentials` response pairing
- Record default cookie `SameSite` attribute behavior across the session and any exceptions per endpoint

### Phase 2: Vulnerability Identification
- CSRF: test whether the token is validated at all by stripping the parameter, submitting an empty/malformed value, or reusing a token across sessions/users; test Referer/Origin header validation strength as a secondary defense; test SameSite bypass vectors (top-level navigation, sub-resource requests)
- CORS: send an arbitrary attacker-controlled `Origin` and a `null` origin on every enumerated endpoint; flag the critical combination of `Access-Control-Allow-Origin` reflecting the request's Origin together with `Access-Control-Allow-Credentials: true`
- Test wildcard (`*`) `Access-Control-Allow-Origin` misconfigured alongside credentialed requests (browsers block this combination, but check for the origin-reflection variant that achieves the same effect)
- Test subdomain/regex trust misconfigurations where the origin-validation logic can be satisfied by an attacker-registerable domain (e.g., a loose suffix match like `evil-victim.com` passing a check intended for `victim.com`)

### Phase 3: Exploitation & Validation
- Build a working cross-site auto-submitting HTML PoC for CSRF (hidden form with auto-submit JS, or a `fetch()`/`XMLHttpRequest` call with `credentials: 'include'` for CORS) that performs a genuine state change against the live target — e.g., change the victim's email or password — rather than a no-op request
- For confirmed CORS misconfiguration, host a PoC page that issues a credentialed cross-origin request and displays the exfiltrated authenticated JSON response content in the PoC itself
- Capture the full attack chain: victim visits attacker page while authenticated → forged/cross-origin request executes silently → resulting state change or data exfiltration is observed
- Where both a stored-injection finding (from Agent-002B) and a CORS misconfiguration exist, chain them to demonstrate automated, scaled session-token exfiltration from any victim who views the injected content

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
- Attack Vector Network; User Interaction typically Required for CSRF (victim must load the malicious page), often None for CORS exploited via injected content
- Privileges Required generally None for the attacker; the victim's own session privilege determines blast radius
- Confidentiality impact High for CORS data exfiltration; Integrity impact High for CSRF-driven state changes on sensitive actions

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
- The hosted PoC HTML/JS source plus a screenshot/recording of the executed cross-origin request
- Burp requests showing the state-changing request succeeding with the CSRF token stripped, reused, or otherwise bypassed
- Raw CORS preflight and actual response headers showing Origin reflection combined with `Allow-Credentials: true`
- Screenshot or capture of the victim-side state change (or exfiltrated data) resulting from a page hosted on a third-party origin

## Remediation Guidance
- Implement the synchronizer token pattern with server-side validation on every state-changing request, using a per-session (or ideally per-request) unpredictable token
- Set `SameSite=Strict` or `Lax` on session cookies as a baseline defense, with double-submit-cookie as defense-in-depth rather than a sole control
- Replace origin-reflection CORS logic with an explicit server-side allow-list of trusted origins; never combine a wildcard or reflected origin with `Access-Control-Allow-Credentials: true`
- Require a custom request header (e.g., `X-Requested-With`) on AJAX/API endpoints as an additional CSRF mitigation, since simple cross-origin form submissions can't set custom headers
- Require step-up re-authentication for highly sensitive state changes (password/email change, payment details) regardless of token validity

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, endpoint/session map from Agent-002 recon, previous agent findings
**Output:** Validated CSRF and CORS findings with evidence
**Feeds:** Downstream agents and final penetration test report
