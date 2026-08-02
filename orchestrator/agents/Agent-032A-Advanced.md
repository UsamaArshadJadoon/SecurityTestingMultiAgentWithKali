# Agent-032A-Advanced: Advanced

## Overview
Catch-all agent for advanced, timing- and state-dependent web application techniques that require careful methodology rather than simple request/response fuzzing: web cache poisoning/deception, race conditions (TOCTOU) in business logic, and prototype pollution in JavaScript-based backends and frontends. These classes are individually complex enough to warrant a dedicated bucket, but not large enough in most engagements to justify their own specialist agent per the primary taxonomy. Impact from this class is frequently severe and stored: a single successful cache-poisoning payload can serve malicious content to every subsequent visitor, a race condition in a coupon/withdrawal endpoint can be exploited for unlimited financial gain, and prototype pollution can escalate to remote code execution in Node.js applications or client-side XSS in frontend frameworks.

## Tools Integrated
- Param Miner (Burp extension) - automated unkeyed-input discovery for cache poisoning
- Burp Suite Turbo Intruder - single-packet/last-byte-sync race condition exploitation
- race-the-web / racepwn - standalone race-condition testing tools for concurrent request submission
- server-timing-attack / custom asyncio+HTTP2 scripts - single-connection multiplexed race condition delivery for maximum precision
- CacheHunter / lightweight custom Python cache-probe scripts - cache-key and cache-behavior fingerprinting across CDN/reverse-proxy layers
- ppmap / prototype-pollution-scanner - automated client-side and server-side prototype pollution gadget discovery
- Node.js REPL + custom gadget-chain scripts - manual verification of prototype pollution to RCE gadget chains (e.g., via `child_process` or template engines)

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all caching layers in front of the application (CDN, reverse proxy, application-level cache) and identify cache-control headers, `Vary` header configuration, and cache-key composition
- Identify all endpoints performing check-then-act sequences prone to race conditions: balance/coupon redemption, inventory decrement, single-use token consumption, account creation/uniqueness checks
- Map all client-side and server-side code paths that recursively merge/clone user-controlled JSON into objects (`Object.assign`, `_.merge`, `$.extend`, custom deep-merge utilities) — prototype pollution candidates
- Fingerprint the CDN/proxy vendor (via headers, error pages, behavior) to select known unkeyed-header and cache-key quirks relevant to that vendor
- Establish a timing baseline for target endpoints to calibrate race-condition delivery windows

### Phase 2: Vulnerability Identification
- Test cache poisoning via unkeyed headers (`X-Forwarded-Host`, `X-Forwarded-Scheme`, `X-Original-URL`) and unkeyed query parameters reflected into cached responses
- Test cache deception by requesting sensitive authenticated pages with a cacheable-looking suffix (`/account/settings/nonexistent.css`) to see if a shared cache stores the private response
- Send parallel/concurrent identical requests (single-packet technique, HTTP/2 multiplexing, or Turbo Intruder) against check-then-act endpoints to detect exploitable race windows
- Test multi-step workflows for time-of-check-to-time-of-use gaps (e.g., apply the same discount code N times before the "already used" flag commits)
- Fuzz JSON/query-string keys with `__proto__`, `constructor.prototype`, and `prototype` path segments against every endpoint that merges user input into server-side objects
- Test client-side JavaScript for DOM-based prototype pollution via URL fragment/query parameters parsed into merge utilities, and check whether pollution reaches a dangerous sink (`innerHTML`, `eval`, template rendering)
- Chain discovered prototype pollution with known gadget chains for the identified framework/template engine to attempt RCE or stored XSS

### Phase 3: Exploitation & Validation
- Demonstrate a working cache-poisoning PoC where a crafted request causes a malicious response (e.g., injected script, attacker-controlled redirect) to be served to a subsequent unauthenticated victim request
- Demonstrate a working cache-deception PoC where a victim's authenticated private data is retrieved from cache by an unauthenticated attacker
- Demonstrate a reliable race-condition exploit with a quantified success rate across repeated trials (e.g., N of M concurrent requests succeeded, resulting in duplicated effect)
- Demonstrate prototype pollution escalated to a concrete impact: RCE (via gadget chain execution), stored/DOM XSS, or authorization bypass (e.g., polluting an `isAdmin` default)
- Confirm exploitability is deterministic/reproducible, not a lab-only timing artifact, by re-running the exploit multiple times

### Phase 4: Documentation
- Detailed finding documentation including exact unkeyed input, race window, or pollution gadget chain used
- CVSS 3.1 scoring reflecting the class of impact (stored/shared for cache poisoning, integrity for races, potentially critical for RCE via prototype pollution)
- OWASP/CWE mapping (CWE-444 HTTP Request Smuggling/cache issues, CWE-362 Race Condition, CWE-1321 Prototype Pollution)
- Remediation guidance specific to the caching vendor, concurrency model, or merge utility involved
- Developer-actionable recommendations including exact code/config fixes

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
- Two-request PoC (poisoning request + subsequent victim-perspective request) showing the poisoned response actually served from cache, including cache-status headers
- Concurrent-request logs/timing captures (Turbo Intruder output or equivalent) showing the exact race window and number of successful duplicate effects
- Before/after state snapshots proving race-condition impact (e.g., balance/inventory values before and after the concurrent burst)
- Full gadget-chain trace for prototype pollution, from injection point through polluted prototype property to the triggered dangerous sink
- Cache-key/vary-header configuration evidence supporting the root-cause explanation

## Remediation Guidance
- Include all headers/parameters that influence response content in the cache key, or strip/normalize them before the origin processes the request
- Explicitly mark authenticated/private responses as `Cache-Control: private, no-store` and validate cache rules against exact path matching, not suffix-based static-asset heuristics
- Use atomic database operations (row-level locks, `SELECT ... FOR UPDATE`, atomic increment/decrement, unique constraints) instead of check-then-act application logic for balances, coupons, and single-use tokens
- Use safe merge utilities that explicitly block `__proto__`/`constructor`/`prototype` keys, or switch to `Object.create(null)` / `Map` for user-controlled data structures
- Freeze built-in prototypes (`Object.freeze(Object.prototype)`) as defense in depth where the runtime and application allow it

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
