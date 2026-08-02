# Agent-031A-Extras: Extras

## Overview
Catch-all agent covering miscellaneous web application edge cases that don't warrant a dedicated specialist agent but are frequently exploitable in real engagements: HTTP Parameter Pollution (HPP), open redirects, CRLF/HTTP response splitting, clickjacking/UI redress, and host header injection. These issues are individually "minor" in isolation but are commonly chained into more severe attacks (open redirect into OAuth token theft, CRLF into cache poisoning or session fixation, HPP into WAF/validation bypass, clickjacking into unauthorized state-changing clicks). This agent exists specifically to catch the class of findings that fall through the cracks between larger specialist categories, ensuring full OWASP Testing Guide coverage without duplicating dedicated auth, injection, or session-management agents.

## Tools Integrated
- Burp Suite (Repeater, Intruder, and the "Param Miner" and "HTTP Request Smuggler" extensions) - HPP, CRLF, and header-injection discovery
- OpenRedireX - automated open-redirect parameter fuzzing
- CRLFuzz - CRLF injection scanner across query strings, headers, and path segments
- Clickjacking PoC generator (custom HTML `<iframe>` harness) - manual clickjacking validation
- curl / httpie with raw socket scripting - manual host header and header-injection testing
- nmap `http-headers` / `http-security-headers` NSE scripts - baseline security header enumeration
- ffuf - parameter and path fuzzing to surface duplicate-parameter and redirect-target candidates

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all redirect-capable parameters (`return_url`, `next`, `redirect`, `continue`, `callback`, `logout_url`) across the application
- Identify all endpoints reflecting user input into `Location`, `Set-Cookie`, or other response headers (CRLF candidates)
- Catalog every endpoint that accepts repeated query/body parameters of the same name (HPP candidates: `?id=1&id=2`)
- Capture baseline response headers (`X-Frame-Options`, `Content-Security-Policy: frame-ancestors`, `Set-Cookie` flags) across all pages, including error and login pages often missed by automated scanners
- Identify all logic that trusts the `Host`, `X-Forwarded-Host`, or `X-Forwarded-Proto` headers (password reset links, absolute URL generation, cache keys)

### Phase 2: Vulnerability Identification
- Test open redirect bypass techniques: protocol-relative URLs (`//evil.com`), backslash tricks (`/\evil.com`), whitelisted-domain suffix tricks (`target.com.evil.com`), double-encoding, and `@` userinfo tricks (`https://target.com@evil.com`)
- Inject CR/LF sequences (`%0d%0a`, raw `\r\n`, unicode-normalized variants) into parameters reflected in headers to attempt header injection, response splitting, or session fixation via injected `Set-Cookie`
- Send duplicate parameters with conflicting values across query string, body, and JSON to fingerprint which layer (WAF, app server, backend framework) wins — a classic WAF-bypass and validation-bypass vector
- Test array-style parameter pollution (`id=1&id[]=2`, `id=1,2`) against frameworks known to parse the last/first/array value differently between the validation layer and the business logic layer
- Test every page (not just the login page) for missing frame-busting protections and attempt a full clickjacking PoC with overlay-based UI redress on state-changing actions (fund transfer, password change, account deletion, consent/permission grants)
- Send crafted `Host`/`X-Forwarded-Host` headers to test for password-reset poisoning, cache poisoning, or SSRF-adjacent absolute-URL generation

### Phase 3: Exploitation & Validation
- Build a working open-redirect PoC chained into a realistic phishing or OAuth `redirect_uri`/token-leak scenario
- Demonstrate CRLF injection resulting in an attacker-controlled additional header or split response actually rendered by the browser or cached by an intermediary
- Demonstrate an HPP-driven bypass of an access control or input-validation check (e.g., WAF sees `id=1`, backend uses `id=2`, and the attacker reaches an unauthorized resource)
- Deliver a working clickjacking HTML PoC hosted locally that overlays the target's real UI and captures an unintended click leading to a real state change
- Validate host-header poisoning by confirming the poisoned link/cache entry is actually served back to a normal user or subsequent request

### Phase 4: Documentation
- Detailed finding documentation, including the exact bypass technique and encoding used
- CVSS 3.1 scoring reflecting the realistic chained impact, not just the isolated primitive
- OWASP/CWE mapping (CWE-601 Open Redirect, CWE-113 CRLF/HTTP Response Splitting, CWE-1021 Clickjacking, CWE-235 HPP)
- Remediation guidance specific to the framework/web-server in use
- Developer-actionable recommendations, including exact header/config changes

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
- Raw HTTP requests/responses showing the injected CRLF sequence, polluted parameters, or redirect chain with full headers
- Screen recording or sequential screenshots of the clickjacking overlay PoC capturing a real unintended action
- Captured proof that a poisoned Host header value was reflected into a generated link, cache entry, or email
- Side-by-side comparison of WAF/validation-layer parsing vs. backend parsing for the same HPP payload
- Browser dev-tools network tab evidence showing the injected header actually parsed by the browser or an intermediary proxy/cache

## Remediation Guidance
- Validate redirect targets against a strict allowlist of relative paths or fully-qualified trusted domains, never substring/suffix matching
- Reject or strip CR/LF characters (and their encoded equivalents) from any user input before it is placed into a response header
- Standardize parameter parsing so the validation layer and business logic layer use the identical first-value/last-value/array parsing rule, or explicitly reject duplicate parameters
- Send `X-Frame-Options: DENY` (or `SAMEORIGIN`) and a strict `Content-Security-Policy: frame-ancestors` on every response, including error pages, plus JS frame-busting as defense in depth
- Never trust `Host`/`X-Forwarded-Host` for security-relevant logic; use a server-side configured canonical hostname instead

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
