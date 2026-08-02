# Agent-009-Request-Smuggling: Request Smuggling

## Overview
HTTP Request Smuggling (desync attacks) exploits disagreements between a front-end component (CDN, load balancer, reverse proxy) and a back-end origin server over where one HTTP request ends and the next begins on a reused connection. When Content-Length and Transfer-Encoding are both present, malformed, or interpreted differently by each hop, an attacker can smuggle a hidden request that gets prepended to another user's traffic. Real-world impact includes response queue poisoning to hijack another user's session/cookies, cache poisoning at a shared proxy, front-end ACL/WAF bypass by smuggling requests directly to the back end, and reflected-XSS-at-scale via poisoned cached responses. This class is highly connection- and infrastructure-specific, so testing must map the exact proxy chain before crafting desync payloads.

## Tools Integrated
- Burp Suite Professional with the HTTP Request Smuggler extension and Turbo Intruder (single-packet-attack scripts for timing-safe probing)
- smuggler.py (defparam/nccgroup) for automated CL.TE/TE.CL/TE.TE differential probing
- h2csmuggler / h2c smuggling tooling for HTTP/2-to-HTTP/1.1 downgrade desync testing
- Raw socket tools: netcat, socat, curl `--http1.0`/`--http1.1` for manually crafted ambiguous requests
- Custom Python (hyper/httpx at raw-socket level) scripts to control exact byte-level framing of chunked bodies

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint every hop in the request path (CDN, WAF, load balancer, reverse proxy, origin) via `Via`/`Server`/`X-Cache` headers, TLS certificate differences, and behavioral fingerprinting
- Determine whether front-end and back-end connections are reused/pooled (keep-alive) — smuggling requires a persistent connection the attacker's hidden request can piggyback on
- Identify HTTP protocol versions in use at each hop (HTTP/1.0, 1.1, 2) and whether the front end downgrades HTTP/2 to HTTP/1.1 towards the origin
- Note any components known to be permissive in parsing (obsolete proxy/server versions, custom middleware) as likely desync points

### Phase 2: Vulnerability Identification
- Test CL.TE: send a request with both `Content-Length` and `Transfer-Encoding: chunked` where the front end honors Content-Length and the back end honors chunked encoding (or vice versa for TE.CL)
- Test TE.TE via header obfuscation to get one hop to ignore the `Transfer-Encoding` header entirely: `Transfer-Encoding: xchunked`, `Transfer-Encoding : chunked` (space before colon), duplicated `Transfer-Encoding` headers, tab/`\r`/`\n` injected into the header name or value
- Use Burp's differential-response timing technique: send an ambiguous request that should cause the back end to hang waiting for more data if smuggling is possible, and measure response delay as a reliable non-destructive signal
- Test HTTP/2-downgrade smuggling (H2.TE, H2.CL, 0.CL) — front end terminates HTTP/2 and translates to HTTP/1.1 for the origin, so a smuggled Content-Length/Transfer-Encoding value in an HTTP/2 pseudo-header or the request body can desync the downgrade
- Confirm each finding with a non-destructive single-packet attack (Turbo Intruder) before attempting any request that could affect other users' live traffic

### Phase 3: Exploitation & Validation
- Build a response-queue-poisoning PoC: smuggle a request so the *next* real client's request receives a response intended for the smuggled request, capturing another session's cookies/tokens as evidence (only within an isolated/authorized test window, never against real production users without explicit authorization)
- Demonstrate front-end control bypass: smuggle a request that reaches an internal-only path or bypasses a WAF rule that only inspects the front-end-visible request line
- Demonstrate cache poisoning at a shared proxy by smuggling a request whose malicious response gets cached and served to subsequent requesters for a shared cache key
- Chain smuggling with a reflected XSS or open redirect payload delivered via the poisoned/prepended request to show full client-side impact

### Phase 4: Documentation
- Document the exact byte-level raw request/response pair and which specific header ambiguity (CL.TE/TE.CL/TE.TE/H2 downgrade) enabled the desync
- CVSS 3.1 scoring with Scope: Changed when the smuggled request accesses another user's session or bypasses a security control enforced by a different component
- OWASP (A05:2021 misconfiguration or A03:2021 injection framing depending on root cause) / CWE-444 mapping
- Remediation guidance specific to the identified proxy/origin pairing and versions
- Developer-actionable recommendations including exact header-normalization or connection-handling configuration changes

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
- Raw byte-level HTTP request/response pairs showing the exact CL/TE header ambiguity exploited
- Turbo Intruder single-packet-attack timing evidence proving the desync without destructive side effects
- Captured poisoned response content (another session's data) collected only within authorized test scope
- Proxy/origin chain map (software + version at each hop) supporting root-cause attribution
- Cache-poisoning evidence showing the malicious response served from cache to a subsequent request

## Remediation Guidance
- Disable connection reuse/keep-alive between the front-end proxy and back-end origin, or terminate and re-establish a clean connection per logical request
- Standardize the entire proxy chain on HTTP/2 (or HTTP/1.1 with strict, matching parsers) end-to-end to eliminate downgrade-related ambiguity
- Configure all hops to reject any request containing both `Content-Length` and `Transfer-Encoding`, or with malformed/duplicated framing headers, with an immediate 400
- Keep proxy and origin server software patched to current versions with known smuggling CVEs remediated
- Use a single, consistent HTTP implementation/library across the request path where feasible to remove parser-disagreement as a root cause

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
</content>
