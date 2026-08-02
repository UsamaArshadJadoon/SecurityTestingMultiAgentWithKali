# Agent-032-WebSocket: WebSocket

## Overview
Message-level and connection-lifecycle WebSocket security testing, complementary to the handshake/CSWSH-focused Agent-003E. This agent assumes the connection is already established and focuses on what happens to individual frames and the long-lived session over time: message replay, in-transit tampering, sequencing/state-desync attacks, and abuse of connection lifecycle events (reconnect, idle timeout, multiplexed channel takeover). WebSocket applications frequently implement authentication only at handshake time and then implicitly trust every subsequent frame, making them vulnerable to replayed actions, out-of-order message injection, and stale-session reuse — issues invisible to a pure handshake/origin audit. Real-world impact includes replaying a privileged action (fund transfer, chat-admin command) captured from a legitimate session, desynchronizing server-side state machines by sending messages out of expected order, and hijacking reconnection tokens to resume another user's session.

## Tools Integrated
- Burp Suite (WebSockets history tab, "Burp WebSocket Turbo Intruder" / "WSSiP" extensions) - frame interception, replay, and fuzzing
- OWASP ZAP WebSocket panel - passive/active frame analysis and break-point tampering
- websocat - scriptable CLI WebSocket client for manual replay and crafted frame sequences
- wscat - lightweight interactive WebSocket session testing
- mitmproxy with a WebSocket addon script - programmatic frame capture, replay, and mutation at scale
- Custom Python (websockets/asyncio library) - automated replay harnesses, race-condition frame flooding, and reconnect-token abuse scripts
- Frida (for native/mobile WebSocket clients) - runtime hooking of message serialization to capture pre-encryption frame content

## Testing Approach

### Phase 1: Initial Assessment
- Capture a full legitimate session's frame sequence (connect, auth message if any, business messages, disconnect/reconnect) to establish the expected state machine
- Identify whether messages carry any anti-replay primitive (nonce, monotonic sequence number, timestamp, per-message signature) or rely solely on the transport being "already authenticated"
- Determine reconnection/session-resumption behavior: does the server issue a reusable resume token, and does it validate the token's origin/binding to the original connection?
- Map multiplexed channels/rooms/topics within a single socket (Socket.IO namespaces, custom channel IDs) and note authorization checks per channel vs. per connection
- Identify idle-timeout and heartbeat/ping-pong behavior, and what happens to session state when a client goes silent and later resumes

### Phase 2: Vulnerability Identification
- Replay a captured privileged message frame verbatim against a live connection (same session and a different session) to test for missing anti-replay controls
- Tamper with message fields in-flight (Burp/mitmproxy intercept) — user IDs, room IDs, amounts, command types — to test whether the server re-validates authorization per message or only trusted the handshake
- Send messages out of the expected sequence (e.g., "submit payment" before "select amount", or a chat "delete" before a "create") to find state-machine desync bugs
- Flood the connection with rapid duplicate or near-duplicate messages to test for race conditions in server-side state updates (double-spend style issues over WebSocket)
- Abuse reconnection: capture a resume/session token and reuse it from a different IP/client/origin to test session-binding enforcement
- Test cross-channel/cross-room message injection — send a frame addressed to a channel the authenticated user was never authorized to join
- Send oversized, malformed, or deeply nested JSON frames to probe for parser DoS or crashes in the message-handling layer
- Test whether closing and rapidly reopening connections resets rate limits, authorization checks, or anti-automation controls that were only enforced at connect time

### Phase 3: Exploitation & Validation
- Demonstrate a working replay attack: capture one legitimate privileged action and successfully re-trigger its effect (verified via a subsequent state read) without re-authenticating
- Demonstrate a state-desync exploit where sending frames out of order produces an inconsistent or attacker-favorable server state (e.g., item added to cart twice, balance updated incorrectly)
- Demonstrate successful cross-session or cross-channel message injection with observable impact on another user's session or a restricted channel
- Demonstrate reconnect-token reuse from an unauthorized context resuming a victim's live session
- Quantify race-condition impact with repeated trials to establish reliability of the exploit (not a one-off timing fluke)

### Phase 4: Documentation
- Detailed finding documentation, including the full captured frame sequence and the exact replay/tamper/reorder technique used
- CVSS 3.1 scoring reflecting integrity/availability impact of message-level attacks
- OWASP/CWE mapping (CWE-294 Authentication Bypass by Capture-replay, CWE-362 Race Condition, CWE-841 Improper Enforcement of Behavioral Workflow)
- Remediation guidance covering per-message authorization and anti-replay design
- Developer-actionable recommendations with concrete message-schema changes

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
- Full captured WebSocket frame logs (both directions) for the original session and the replayed/tampered session
- Burp/ZAP WebSocket history export showing intercepted and modified frames alongside server responses
- Timing/sequence diagrams or annotated logs showing the out-of-order message sequence that triggered desync
- Before/after server-state snapshots (via a legitimate read channel or admin view) proving replay or tamper impact
- Screen recordings for real-time race-condition or reconnect-hijack demonstrations

## Remediation Guidance
- Require per-message authorization checks server-side, never relying solely on handshake-time authentication for the life of the connection
- Include a monotonic sequence number or single-use nonce in each message and reject frames that are replayed or received out of order
- Bind resume/reconnection tokens to the original connection's client fingerprint/IP and enforce single-use or short-lived tokens
- Enforce per-channel authorization checks on every message, not just at channel-join time
- Apply server-side rate limiting and idempotency keys on state-changing messages to eliminate race-condition windows

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
