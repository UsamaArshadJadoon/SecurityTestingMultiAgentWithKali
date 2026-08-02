# Agent-064-Webhook-Security: Webhook Security

## Overview
Testing the security of webhook subsystems — both outbound webhooks a target application sends to registered callback URLs, and inbound webhook receivers a target exposes for third-party services to call. Webhooks invert the normal client-server trust model: the receiving endpoint must authenticate an unsolicited inbound request instead of a user authenticating to a server, and this inversion is where most webhook implementations fail, either by skipping signature verification entirely, implementing it insecurely, or failing to handle retries and duplicate deliveries safely. Because webhook URL registration frequently accepts an arbitrary user-supplied destination, the feature is also a common and under-tested Server-Side Request Forgery vector reaching internal services and cloud metadata endpoints. Real-world impact ranges from forged webhook payloads triggering unauthorized state changes (fake payment confirmations, fake order fulfillment), to full internal network reconnaissance via SSRF, to financial/business-logic abuse from duplicate-delivery handling that isn't idempotent.

## Tools Integrated
- **Burp Suite** (Repeater/Intruder) — capturing, replaying, and tampering webhook payloads and signature headers
- **Custom Python scripts (hmac + hashlib + requests)** — computing valid and deliberately invalid HMAC signatures to test verification rigor, and scripting timestamp/nonce replay scenarios precisely
- **mitmproxy** — intercepting outbound webhook delivery traffic to inspect retry behavior, headers, and payload structure at the wire level
- **interactsh / Burp Collaborator** — out-of-band callback detection for confirming blind SSRF via webhook URL registration
- **ffuf** — enumerating predictable webhook receiver paths and probing for other tenants' accessible webhook endpoints
- **ngrok** (or an equivalent tunnel) — standing up a controlled, internet-reachable receiver to capture and inspect real outbound webhook deliveries including retries and headers

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every webhook-related feature: outbound webhook registration/subscription management (UI and API), inbound webhook receiver endpoints documented for third-party integrations (payment providers, CI/CD, chat platforms), and any webhook event-log/replay UI exposed to users
- Identify the documented signing scheme for outbound webhooks (header name such as `X-Signature`/`X-Hub-Signature-256`, algorithm, secret provisioning/rotation process) and for inbound receivers, identify what signature/verification scheme the target claims to enforce against third-party senders
- Stand up a controlled receiver (ngrok-backed) and register it as a webhook destination to capture a full legitimate delivery, including headers, retry attempts, and payload structure, as a baseline
- Document the retry/backoff policy if disclosed (max attempts, interval, what constitutes a "successful" delivery from the sender's perspective — e.g., any 2xx vs. a specific body)
- Catalog which fields in the webhook URL registration form are validated (scheme restriction, DNS resolution check, private-IP blocking) versus accepted as opaque user input

### Phase 2: Vulnerability Identification
- **Signature/HMAC validation bypass**: submit a webhook payload to the receiver with no signature header at all, an empty signature, or a signature computed with a guessed/default secret, and confirm whether the receiver processes it as genuine; also test for timing-unsafe string comparison (non-constant-time compare) on the signature check where response-time analysis is feasible
- **Replay-attack protection testing**: capture a legitimate, validly-signed webhook payload and resend it unmodified (and after a deliberate delay) to determine whether the receiver enforces a timestamp window or nonce/idempotency-key uniqueness, or accepts the identical payload indefinitely
- **SSRF via webhook URL registration**: register a webhook destination pointing at loopback addresses, internal RFC1918 ranges, and the cloud metadata endpoint (`169.254.169.254` and provider-specific metadata paths), and test redirect-based bypasses (register an allowed public URL that 30x-redirects to an internal address) to see whether the outbound webhook sender follows redirects without re-validating the destination
- **Webhook endpoint enumeration**: probe for predictable or sequential webhook receiver paths (`/webhooks/{id}`) with ffuf under a valid session to determine whether another tenant's webhook receiver/configuration is reachable or guessable
- **Retry/duplicate-delivery business-logic abuse**: deliberately trigger sender-side retries (close the receiving connection early, return a slow/ambiguous response, or return a non-2xx after the business action already completed) to determine whether the receiver's handling of the resulting duplicate delivery is idempotent, or whether it re-applies the business effect (double payment credit, duplicate order fulfillment, duplicate notification) each time

### Phase 3: Exploitation & Validation
- Craft and submit a forged webhook payload (no valid signature, or a signature computed with a leaked/guessed secret) directly to the receiver endpoint and confirm the backend performs the associated state change (e.g., marks an order paid, grants an entitlement) purely from the unauthenticated payload
- Capture a legitimate, previously-processed webhook payload and replay it after the original business action has already completed, confirming whether the effect (credit, fulfillment, notification) is applied a second time — quantify the exact business impact (e.g., account credited twice for one payment event)
- Register a webhook destination targeting the cloud metadata endpoint or an internal service, using interactsh/a controlled receiver to confirm out-of-band callback receipt, and where the response is reflected back to the registering user (echoed webhook test/preview feature), extract actual internal metadata/credentials through the SSRF
- Deliberately induce duplicate delivery (early connection close / ambiguous response code) and confirm the resulting business-logic double-application with before/after state evidence (e.g., ledger balance, order status) from two independent, non-replayed deliveries
- Chain a confirmed signature-bypass finding with the duplicate-delivery finding to show an attacker can forge unlimited webhook events and additionally exploit non-idempotent handling for compounding business impact

### Phase 4: Documentation
- Document each finding with the exact forged/replayed payload, the signature header value (or its absence) submitted, and the backend state change observed as a result
- Include the SSRF callback evidence (interactsh interaction log or captured internal response content) tied to the specific webhook URL registration field exploited
- Quantify duplicate-delivery business impact concretely (e.g., "$X credited twice," "order fulfilled 2x") rather than describing it only abstractly
- Map findings to OWASP API Security Top 10 (API8: Security Misconfiguration / SSRF) and relevant CWE categories in addition to CVSS

## Validation Requirements
✓ Real vulnerability confirmation
✓ Authentic tool output evidence
✓ Reproducible exploitation proof
✓ Clear technical documentation
✓ Developer-actionable remediation
✓ Business-logic impact from duplicate-delivery findings quantified with concrete before/after state evidence

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: Network
- Attack Complexity: Low for missing/bypassable signature verification; Medium for SSRF findings requiring redirect-based bypass of destination validation
- Privileges Required: None for unauthenticated forged-payload findings; Low where webhook URL registration requires an authenticated session
- Scope: Changed for SSRF findings reaching internal services/metadata endpoints outside the application's own security context
- CIA Impact: Integrity typically High for forged-payload and duplicate-delivery business-logic findings; Confidentiality High for SSRF findings that expose internal service or metadata responses

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
  "owasp_category": "A10:2021 - Server-Side Request Forgery",
  "cwe_id": "CWE-918",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Forged webhook payload request/response pair showing the backend state change triggered without valid signature verification
- Replay request/response pair showing duplicate business-logic effect application, with before/after state values
- interactsh/Collaborator interaction log confirming out-of-band callback from an internal/metadata-targeted webhook registration
- Captured legitimate baseline delivery (headers, payload, retry pattern) alongside the tampered/forged variant for direct comparison
- ffuf enumeration output showing accessible webhook receiver paths/configurations beyond the tester's own tenant

## Remediation Guidance
- Verify webhook payload signatures using a constant-time comparison against an HMAC computed with a per-tenant secret, and reject any request missing or failing signature verification before any business logic executes
- Enforce a timestamp or nonce on every webhook payload and reject deliveries outside a short validity window or with a previously-seen nonce/idempotency key, closing the replay-attack gap
- Validate and restrict webhook destination URLs at registration time (block loopback/private-IP/metadata-range resolution, disallow redirects during delivery, and re-validate the destination on every send rather than only at registration) to eliminate the SSRF vector
- Make webhook-triggered business logic idempotent by keying processing on a unique event/delivery ID, so retried or duplicated deliveries are detected and skipped rather than re-applied
- Avoid exposing predictable webhook receiver paths per tenant; scope and authenticate access to webhook configuration/logs so one tenant cannot enumerate or reach another's webhook endpoints

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided
✓ Business-logic and SSRF impact concretely quantified, not just theoretically described

## Dependency Flow
**Input:** Target scope, webhook registration/receiver endpoint inventory, previous agent findings (API Security, SSRF-relevant recon)
**Output:** Validated webhook findings with evidence
**Feeds:** Downstream agents (API Security, BOLA/BFLA Testing) and final penetration test report
