# Agent: WebSocket Security

## Overview
WebSocket connections are long-lived and stateful, which means authorization decisions made correctly at handshake time are frequently never re-checked for the life of the connection — letting a client swap object/user identifiers mid-session and pull another user's data through an otherwise "authenticated" socket. Because the WebSocket handshake relies on ambient browser credentials (cookies) without an equivalent to CSRF tokens, cross-site WebSocket hijacking (CSWSH) remains common wherever Origin validation is skipped. This agent covers handshake-level hijacking, per-message authorization gaps, message-payload injection, and flood-based denial of service.

## Tools Integrated
- Burp Suite WebSockets tab / WebSocket-aware Turbo Intruder — interception, manual message replay, and scripted flooding
- OWASP ZAP WebSocket support — automated passive/active scanning of WS traffic
- wscat / websocat — CLI clients for manual handshake and message crafting
- mitmproxy — WebSocket flow interception and modification
- Custom Python (websocket-client / asyncio) scripts — scripted CSWSH PoC pages, message-flood scripts, and mid-session ID-swap testing
- nc (netcat) — raw handshake-level testing when a client library obscures the underlying HTTP Upgrade request

## Testing Approach

### Phase 1: Initial Assessment
- Identify every WebSocket endpoint (`ws://`, `wss://`) via application crawl, JS bundle analysis, and Burp's WebSocket history
- Capture the initial HTTP Upgrade handshake and record where the auth token lives (cookie, query string, first post-connect message) plus the `Origin` and `Sec-WebSocket-Protocol` headers sent
- Enumerate the message schema by interacting with the application and logging every JSON/binary message shape observed in both directions
- Determine whether authorization is validated only once at handshake time or re-checked on every inbound message — this determines whether mid-session BOLA testing is in scope

### Phase 2: Vulnerability Identification
- Test Cross-Site WebSocket Hijacking (CSWSH): connect to the target socket from an attacker-controlled origin using the victim's ambient cookies and confirm whether the handshake is accepted despite a missing/permissive `Origin` check
- Test per-message authorization: after a normal authenticated connection, send a message referencing a different user/object ID and check whether the server re-validates ownership or trusts the handshake-time identity for the rest of the session
- Replay and tamper with captured messages via wscat/websocat to test server-side input validation independent of any client-side checks
- Flood the connection with high-frequency messages to test for missing rate limiting/backpressure handling (DoS)
- Test message-payload injection (SQL/NoSQL/command injection) since WebSocket message handlers often bypass the middleware stack applied to REST routes
- Confirm whether `ws://` (unencrypted) is accepted anywhere the app should enforce `wss://`, exposing tokens/messages in transit

### Phase 3: Exploitation & Validation
- Host a minimal cross-origin HTML/JS PoC page that opens a WebSocket to the target using the victim browser's ambient session and exfiltrates a real authenticated message, proving CSWSH end to end
- Script a message-flood PoC and measure concrete server-side impact (latency increase, dropped connections, error-rate spike) to substantiate a DoS finding
- Demonstrate an object-ID swap mid-session that retrieves or modifies another user's data over the same already-authenticated socket
- Capture and replay a tampered message that achieves an unauthorized state change (e.g., completing an action on behalf of another user)

### Phase 4: Documentation
- Detailed finding documentation with the full handshake capture and message traces
- CVSS 3.1 scoring
- OWASP API Top 10 / CWE mapping
- Remediation guidance covering Origin validation, per-message authorization, and rate limiting
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring
- Severity: Based on impact level
- Attack Vector: Network
- Privileges: Varies by vulnerability
- User Interaction: Sometimes required
- Scope: Changed where applicable
- CIA Impact: Varies by finding

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
- Full handshake capture (headers, `Origin`, cookies/tokens used to authenticate the Upgrade request)
- Working CSWSH PoC page plus captured cross-origin data exfiltration
- Message-flood timing/impact metrics demonstrating DoS
- Tampered-message replay showing an authorization bypass mid-session
- Evidence of protocol downgrade (`ws://` accepted where `wss://` should be enforced)

## Remediation Guidance
- Validate the `Origin` header against an explicit allowlist, and use a dedicated, non-ambient auth token for the WebSocket handshake rather than relying solely on cookies
- Enforce authorization checks on every inbound message, not only at connection time
- Implement per-connection and per-message rate limiting/backpressure handling
- Enforce `wss://` exclusively, with no plaintext fallback listener
- Validate and sanitize every message payload server-side to the same standard as equivalent REST endpoints

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, WebSocket endpoint(s), previous agent findings
**Output:** Validated WebSocket findings with evidence
**Feeds:** Downstream agents and final penetration test report
