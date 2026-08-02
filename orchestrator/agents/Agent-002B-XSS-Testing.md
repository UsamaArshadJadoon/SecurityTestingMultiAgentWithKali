# Agent: Cross-Site Scripting

## Overview
Testing for reflected, stored, and DOM-based Cross-Site Scripting across every output context (HTML body, HTML attribute, JavaScript string, URL, CSS). Covers both classic server-rendered injection points and modern client-side taint flows (postMessage, location.hash, URL fragments feeding a dangerous DOM sink). A significant share of real-world XSS findings today originate not from a hand-crafted payload but from a vulnerable front-end library version with a known unescaped-output CVE, surfaced by dependency/static analysis — this agent is responsible for turning that static signal into a genuinely confirmed, exploitable finding. Impact ranges from session/credential theft and account takeover to full admin-panel compromise when stored payloads render in privileged views.

## Tools Integrated
- Burp Suite (Repeater, DOM Invader for client-side sink/source tracing)
- Dalfox (fast reflected/DOM XSS scanning with context-aware payloads)
- XSStrike (context analysis and WAF-bypass payload generation)
- retire.js / npm audit / dependency-check (client-side library version fingerprinting — a static lead, not a confirmed finding on its own)
- Playwright/Puppeteer (headless browser automation for authenticated, end-to-end dynamic confirmation of sinks and stored payload execution)
- BeEF (impact demonstration for confirmed stored XSS — session hijack, browser hooking)

## Testing Approach

### Phase 1: Initial Assessment
- Crawl the application (authenticated, per role) and catalog every reflection point where user input appears in a response
- Use DOM Invader / manual JS review to identify dangerous DOM sinks (`innerHTML`, `document.write`, `outerHTML`, `eval`, `location` assignment, `setTimeout`/`setInterval` with string args, unsafe `postMessage` handlers) and trace back to their sources
- Fingerprint client-side JavaScript libraries and versions (retire.js) and cross-reference against known-CVE unescaped-output/XSS advisories — treat any hit purely as a **static lead requiring dynamic confirmation**, never as a finding by itself
- Map the output context for each candidate injection point (raw HTML, quoted/unquoted attribute, JS string literal, URL parameter, CSS value) since the correct bypass payload depends entirely on context

### Phase 2: Vulnerability Identification
- Inject context-aware payloads and encoding-bypass variants (HTML tag breakouts, event-handler attributes, `javascript:` URIs, template-literal breakouts, polyglot payloads) tailored to each identified context
- Reflected XSS: test URL/query/form parameters for immediate, unencoded reflection in the response
- Stored XSS: submit payloads through persistence features (profile fields, comments, file metadata, support tickets) and verify execution when the content is later rendered — especially in views consumed by higher-privileged users (admin dashboards, moderation queues)
- DOM-based XSS: trace taint from source (`location.hash`, `document.URL`, `postMessage` data) to sink using DOM Invader/manual review, then confirm with a live payload
- **Mandatory dynamic confirmation rule for static-only leads:** when a candidate finding's only evidence is a static or dependency-analysis signal (e.g., a vulnerable library version matched to a known unescaped-output CVE, or a sink identified purely by source code/grep review), this phase is **not complete** until dynamic, end-to-end confirmation is attempted by actually driving the real authenticated application flow — via Playwright/browser automation or manual browser testing — to reach that code path with a live payload and observe real execution (console marker fires, alert box appears, DOM mutates unexpectedly, network exfiltration request fires). A CVE advisory, changelog entry, or static grep match is **never sufficient alone** to mark a finding `validated`.
- If the vulnerable code path cannot be reached through any real authenticated flow (feature gated behind an unavailable role, sink genuinely unreachable from any user-controllable input), do not silently close the finding as not-vulnerable — document it explicitly as "unable to reach sink via authenticated flow, static signal only" and flag it for manual re-test rather than marking it confirmed or dismissed
- Findings that remain static-only after a genuine confirmation attempt must be reported as "static-only / unconfirmed," distinct from both `validated` and dismissed findings

### Phase 3: Exploitation & Validation
- Build a minimal working PoC first (e.g., `alert(document.domain)` or a unique console marker) to prove execution, then escalate to real-impact payloads: session/cookie exfiltration via `fetch()`/`navigator.sendBeacon` to an attacker-controlled collector, in-page keylogging, or a credential-harvesting overlay injected into a login-adjacent page
- For stored XSS reaching a privileged view (admin panel, support agent console), demonstrate the full chain: attacker submits payload → privileged user views it → attacker's collector receives the privileged user's session token → attacker replays that token for account takeover
- Replay any exfiltrated session/cookie value against the live application to prove session hijacking end-to-end, not just that the token was captured
- Where a vulnerable-library finding was dynamically confirmed in Phase 2, capture the exact reachable trigger path (URL, input field, sequence of actions) so the PoC is independently reproducible without re-deriving it from the CVE advisory

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
- Static/dependency-analysis-only signals (vulnerable library CVEs, sink identification via source review alone) require dynamic, end-to-end confirmation through the real authenticated application flow before being marked `validated`, and must be explicitly labeled "static-only / unconfirmed" if that confirmation attempt is inconclusive rather than silently dismissed

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector Network; User Interaction usually Required for reflected/DOM XSS, None for stored XSS viewed automatically by other users
- Scope frequently Changed when the payload executes in a different security context than the vulnerable component (e.g., admin session)
- Confidentiality/Integrity impact typically High for session-hijack-capable findings; Availability generally None/Low unless chained further

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
- Browser screenshot/console capture showing payload execution (alert, console marker, or DOM mutation)
- Network capture of the exfiltration request reaching the attacker-controlled collector, including the stolen token/cookie value
- DOM snapshot before/after mutation for DOM-based findings
- For vulnerable-library findings: the static signal (retire.js/dependency scan output and CVE reference) paired with the dynamic PoC that proved the code path is actually reachable and exploitable
- Stored-payload persistence proof (view rendered from a second/privileged session, not just the submitting session)

## Remediation Guidance
- Apply context-aware output encoding at render time (HTML entity encoding, JS string escaping, URL encoding, CSS value escaping) matched to each specific sink
- Deploy a strict Content-Security-Policy (nonce- or hash-based, avoiding `unsafe-inline`) as a secondary control against injected script execution
- Use DOMPurify (or an equivalent vetted sanitizer) for any feature that must render user-supplied HTML, rather than hand-rolled filtering
- Avoid dangerous DOM sinks (`innerHTML`, `document.write`, `eval`) in favor of safe APIs (`textContent`, `setAttribute` with validated values)
- Upgrade any client-side library flagged with a known unescaped-output CVE, and re-run the dynamic confirmation flow afterward to verify the patched version actually closes the reachable path

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, crawl map and client-side library inventory from Agent-002 recon, previous agent findings
**Output:** Validated XSS findings with evidence, explicitly distinguishing dynamically-confirmed findings from any residual static-only/unconfirmed leads
**Feeds:** Downstream agents and final penetration test report
