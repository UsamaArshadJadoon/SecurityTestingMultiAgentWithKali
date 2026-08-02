# Agent-060-PWA-ServiceWorker-Security: PWA / Service Worker Security

## Overview
Testing the security of Progressive Web App service workers, their caching layers, manifest configuration, and the Push API integration that lets a PWA behave like a native app. A service worker is a long-lived, privileged script that intercepts network requests, controls what is served offline, and persists across sessions — bugs here (cache poisoning, an over-broad registration scope, or an update mechanism that can be hijacked) grant an attacker durable control over what a victim's browser renders long after the attacker's initial network position is gone. Offline caches (Cache Storage, IndexedDB) are also a frequently overlooked place where tokens, PII, or full API responses are stored unencrypted on-disk with no server-side expiry, readable by anything with local device or DevTools access. This agent covers cache-poisoning and scope abuse, manifest/scope security, offline-cache data exposure, service-worker update/hijack attacks, and Push API abuse, with real-world impact ranging from persistent stored XSS that survives a single MITM window to full account/session data exposure from local storage.

## Tools Integrated
- **Chrome DevTools (Application panel) / Chrome DevTools Protocol via Playwright** — inspecting registered service workers, Cache Storage contents, IndexedDB, and manifest parsing errors
- **Burp Suite / mitmproxy** — intercepting and tampering service worker script (`sw.js`) delivery, manifest (`manifest.webmanifest`) delivery, and cached resource responses to test cache-poisoning and MITM-hijack scenarios
- **Lighthouse (PWA audit category)** — baseline automated checks for manifest correctness, HTTPS enforcement, and service worker registration hygiene
- **Custom Python scripts (requests + mitmproxy addon scripting)** — scripted man-in-the-middle response substitution during first-load service worker installation to test persistence of a poisoned cache after the MITM position is lost
- **pywebpush** — crafting and sending Web Push protocol messages directly against a captured push subscription endpoint to test VAPID key/subscription validation
- **Workbox source inspection** (where Workbox is used) — reviewing configured caching strategies (`CacheFirst`, `NetworkFirst`, `StaleWhileRevalidate`) for routes that should never be cached (auth endpoints, personalized API responses)

## Testing Approach

### Phase 1: Initial Assessment
- Locate the registered service worker script, its registration scope, and the manifest file; confirm whether the scope is broader than necessary (e.g., registered at `/` when the app only needs `/app/`)
- Enumerate all Cache Storage cache names and their contents via DevTools/CDP, flagging any cached response containing auth tokens, session identifiers, or personal data
- Inspect IndexedDB/localStorage usage alongside the service worker for offline data persistence of sensitive fields
- Review the caching strategy applied per route (Workbox config or hand-rolled `fetch` handler) to identify which strategy (cache-first, network-first, stale-while-revalidate) is applied to authenticated/personalized endpoints versus static assets
- Review the service worker update mechanism: `skipWaiting()`/`clients.claim()` usage, version-check logic, and whether updates are fetched over a pinned/verified channel
- Capture and review the Push API subscription flow (VAPID public key delivery, subscription endpoint registration) end-to-end

### Phase 2: Vulnerability Identification
- **Cache poisoning**: using a MITM position (mitmproxy) during the service worker's install/first-load phase, substitute a malicious response for a cached resource (e.g., a core JS asset) and confirm whether the poisoned response persists in Cache Storage and continues to be served to the victim even after the MITM position is removed — a "sleeper" persistence attack
- **Scope/manifest security**: test whether the service worker's registration scope allows it to intercept requests for paths/subdomains it should not control, and review manifest fields (`start_url`, `scope`, `related_applications`) for open-redirect or trust-boundary issues
- **Offline-cache sensitive-data exposure**: confirm whether authenticated API responses (profile data, tokens, financial/PII fields) are stored in Cache Storage or IndexedDB without expiry, encryption, or clearing on logout, remaining readable after the user signs out
- **Service worker update/hijack attacks**: test whether an attacker with a transient MITM position can push a malicious service worker update that is silently activated (`skipWaiting`) without user awareness, and whether that update persists control after the network position is lost
- **Push notification API abuse**: test whether push subscription endpoints or VAPID key handling allow a third party to send spoofed notifications (missing server-side authentication on the push-send endpoint), and whether notification click-actions can be abused for phishing/redirect via unvalidated `data` payloads

### Phase 3: Exploitation & Validation
- Demonstrate the full cache-poisoning persistence chain: MITM injects a malicious script into the cached asset during install, then remove the MITM position entirely and reload the victim's browser to prove the malicious script still executes purely from the poisoned local cache
- Extract and document actual sensitive values (tokens, PII) recovered directly from Cache Storage/IndexedDB via a Playwright `browser_evaluate` call against `caches.open()`/`indexedDB.open()`, post-logout, to prove the data outlives the authenticated session
- Push a crafted service worker update during a transient MITM window and confirm activation (`clients.claim()`) grants continued control of subsequent page loads with no further network position required
- Where the push-send endpoint lacks authentication, send a spoofed push notification to a test subscription and capture the notification rendering with attacker-controlled content
- Chain a confirmed cache-poisoning or SW-hijack finding with a credential-harvesting overlay to demonstrate realistic account-takeover impact

### Phase 4: Documentation
- Document each finding with the Cache Storage/IndexedDB snapshot (before/after), the exact poisoned resource and its persistence proof, and the service worker script diff (legitimate vs. hijacked version)
- Include screenshots of the spoofed push notification or persisted malicious content rendering after the MITM position was removed
- Map findings to relevant OWASP MASVS-equivalent web/PWA guidance and CWE categories in addition to CVSS
- Clearly note the exact attack window required (transient MITM vs. no network position needed) since this materially affects exploitability and severity

## Validation Requirements
✓ Real vulnerability confirmation
✓ Authentic tool output evidence
✓ Reproducible exploitation proof, including persistence-after-MITM-removed confirmation where claimed
✓ Clear technical documentation
✓ Developer-actionable remediation

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: Network (MITM-dependent findings) or Adjacent Network depending on the attacker position required
- Attack Complexity: High for findings requiring a MITM position during first install; Low for findings exploitable via unauthenticated push-send endpoints
- Scope: frequently Changed for confirmed cache-poisoning/SW-hijack findings, since the impact persists beyond the original vulnerable request/response context
- Confidentiality Impact: High for offline-cache sensitive-data exposure findings; Integrity Impact: High for cache-poisoning/SW-hijack findings

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
  "owasp_category": "A05:2021 - Security Misconfiguration",
  "cwe_id": "CWE-524",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Cache Storage/IndexedDB content dumps (before and after logout) showing persisted sensitive data
- Service worker script diff showing the legitimate version versus the MITM-injected/hijacked version
- Reload-after-MITM-removed screenshot/network trace proving poisoned-cache persistence independent of ongoing network position
- Captured push notification screenshot showing spoofed/attacker-controlled content and sender endpoint
- mitmproxy/Burp transcripts of the manifest and service worker script delivery showing the substitution point

## Remediation Guidance
- Never cache responses containing authentication tokens, session data, or personalized/sensitive API output; explicitly exclude such routes from any `CacheFirst`/`StaleWhileRevalidate` strategy and use `NetworkOnly` instead
- Clear Cache Storage and IndexedDB entries on logout and enforce short, explicit expiry (`Cache-Control`/custom TTL logic) for anything cached for offline use
- Scope service worker registration as narrowly as possible (`scope` matching only the paths the app actually needs) and serve the service worker script only over HTTPS with integrity verification (subresource integrity or signed update manifests) to resist MITM injection during install
- Require explicit, server-verified versioning before activating a new service worker (`skipWaiting`) rather than activating unconditionally, and monitor/alert on unexpected service worker script changes
- Authenticate the push-send endpoint server-side and validate VAPID key ownership so third parties cannot send notifications to arbitrary subscribers

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided
✓ Persistence-after-attacker-position-removed explicitly demonstrated where claimed

## Dependency Flow
**Input:** Target scope, PWA manifest and service worker script location, previous agent findings (client-side recon)
**Output:** Validated PWA/service worker findings with evidence
**Feeds:** Downstream agents (XSS Testing, Session Management) and final penetration test report
