# Agent-030-Rate-Limiting: Rate Limiting

## Overview
Owns the end-to-end rate-limiting control assessment across the entire application/API surface: a systematic, inventory-driven sweep of every discovered endpoint — public and authenticated — to determine whether throttling exists, is scoped correctly, and is enforced consistently at every layer (client, application middleware, API gateway, CDN/WAF). This agent consolidates the per-endpoint exploitation evidence produced by Agent-011A-Rate-Limit into a platform-level verdict. The single most important discipline here: rate-limit testing must never stop after checking a small, convenient sample of endpoints. A prior engagement learned this the hard way — testing only 2-3 endpoints missed a systemic gap that then required an entire separate follow-up round to sweep the rest of the API surface. This agent exists to make that failure mode structurally impossible: Phase 1/2 require a complete inventory and 100% coverage before any conclusion is drawn.

## Tools Integrated
- k6 / Vegeta / Artillery — scripted per-endpoint burst scenarios defined in code and driven off the master endpoint inventory, for repeatable full-surface sweeps
- Postman/Newman — replaying the entire discovered API collection with burst iteration counts across every request in the collection
- Burp Suite Turbo Intruder — precise, low-latency parallel delivery for cross-instance and race-condition validation
- Custom Python orchestration script tying the burst runner to the recon/API-security agents' inventory output (OpenAPI spec, Burp site map, ffuf/gobuster results) so no endpoint is tested from memory or by hand-picking
- API gateway/config review tooling — `kubectl` for Kong/Istio/Envoy config export, AWS CLI for API Gateway usage-plan and WAF rate-based-rule inspection, where infrastructure access is in scope
- autocannon / hey — lightweight secondary burst tools for cross-checking results from the primary runner

## Testing Approach

### Phase 1: Initial Assessment
- **Mandatory first step:** ingest the complete endpoint inventory produced by recon/content-discovery and API-security agents (OpenAPI/Swagger spec, Postman collection, Burp site map, ffuf/gobuster output) and produce ONE master endpoint list covering every unique method + path + auth-state combination in scope. This master list is the unit of work for the rest of the engagement — Phase 2 is not complete until every entry has a recorded result.
- Explicitly reject partial-sample testing. Testing only a handful of "representative" endpoints (e.g. just the login form) and extrapolating to the rest of the API is the exact failure mode that previously caused a systemic rate-limiting gap to go undetected until a costly separate follow-up engagement was required to sweep the remainder. This agent's scope is not complete until every inventory entry has been tested.
- Segment the inventory by the control layer expected to apply: CDN/WAF edge (Cloudflare/Akamai rate rules), API gateway (Kong/Apigee/AWS API Gateway/NGINX), application middleware (framework-level limiter), and business-logic-specific throttles (OTP resend cooldown, password-reset cooldown) — a gap may exist at one layer but not another, so the layer matters for triage even though every endpoint still gets tested.
- Passively recon existing controls with a handful of exploratory single calls: response headers (X-RateLimit-*/RateLimit-*/Retry-After), gateway/CDN fingerprints, and any accessible infrastructure-as-code/config (Kong plugins, NGINX `limit_req` zones, AWS WAF rate-based rules) to predict where enforcement is likely present versus absent ahead of the full sweep.

### Phase 2: Vulnerability Identification
- Execute the bounded small-burst methodology (8-12 rapid requests per endpoint, scripted via k6/Vegeta/custom async client — see Agent-011A-Rate-Limit for exact per-endpoint technique) against **every** entry in the master inventory, both authenticated and public/pre-auth variants, recording status codes, headers, and timing for each.
- Track coverage explicitly as a running count/percentage (e.g. "142/142 discovered endpoints tested"). Incomplete coverage is an incomplete phase, not a shippable interim result — do not proceed to Phase 3 conclusions on a partial sweep.
- For endpoints behind multiple accounts/tenants/API keys, verify whether limits are correctly scoped per-user/per-key versus accidentally shared/global (one tenant's burst affecting another's headroom), or accidentally IP-only (trivially bypassed via proxy rotation).
- In distributed/multi-instance deployments, test whether the rate-limit counter is centralized (e.g. Redis-backed) or per-instance-local — a classic gap where parallel requests spread across load-balanced instances never trip any single instance's local counter, multiplying the effective allowed rate by the instance count.
- Validate consistency of the throttling response contract across the inventory: does every throttled endpoint return 429 + Retry-After, or do some silently drop requests, degrade performance, or return a generic 500 instead?

### Phase 3: Exploitation & Validation
- Aggregate Phase 2 results across the full inventory — this is the decisive analytical step of the engagement. If unthrottled or inconsistently-throttled behavior appears on **more than one** endpoint, particularly spanning multiple route groups, controllers, or the gateway/application boundary, escalate from N isolated per-endpoint issues to **one systemic/platform-architecture finding** (e.g. "no centralized rate-limiting middleware/gateway policy is enforced across the API; throttling exists only incidentally on a small subset of routes").
- Frame remediation for a systemic finding at the architecture level — fix once, centrally — rather than recommending endpoint-by-endpoint patches. This reframing is the key deliverable that changes how engineering scopes the fix, and is the direct lesson from the prior engagement where isolated framing led to an incomplete first pass.
- Retain individual endpoint-level findings only where a gap is genuinely isolated (e.g. a single business-critical endpoint lacking a control that is otherwise consistently applied elsewhere) — that is a targeted gap, not systemic, and should stay a separate, appropriately-scoped finding.
- State explicitly in every report: this methodology used small, bounded per-endpoint bursts (8-12 requests) to test for the presence and correctness of throttling controls. It is categorically distinct from volumetric/DoS flood testing (see Agent-011B-DoS-Attacks) and did not attempt sustained high-volume or distributed flooding against the target; that remains out of scope unless separately authorized.

### Phase 4: Documentation
- Deliver the full coverage matrix (every inventory endpoint, tested status, result) as a standalone artifact alongside the narrative findings, so the coverage claim is independently verifiable and no endpoint was silently skipped.
- Produce the systemic finding (where applicable) as the headline result with the full affected-endpoint list as supporting evidence, plus any genuinely isolated findings reported separately.
- Map to OWASP API4:2023 (Unrestricted Resource Consumption), CWE-770/CWE-799; aim remediation guidance at centralized, gateway/middleware-level enforcement.

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
- Full coverage matrix artifact: every discovered endpoint, method, auth state, burst result, and headers observed
- Raw scripted-burst tool output (k6/Vegeta/custom script logs) for the complete inventory sweep, retained as reproducible evidence
- Comparative evidence supporting the systemic-vs-isolated classification (e.g. a side-by-side table of unthrottled endpoints across different controllers)
- Distributed-counter test evidence (parallel requests across load-balanced instances) wherever a multi-instance bypass was identified
- Gateway/WAF/CDN configuration excerpts (where accessible) corroborating the absence or misconfiguration of centralized rules

## Remediation Guidance
- Implement a single centralized rate-limiting policy at the gateway/edge layer (API gateway plugin, WAF rate-based rule, or shared middleware) applied by default to all routes, rather than relying on ad hoc per-route implementations
- Use a centralized, atomic counter store (e.g. Redis with a Lua-scripted INCR+EXPIRE) so limits are correctly enforced across all backend instances in a distributed deployment
- Key limits by authenticated identity (user ID/API key) first, with IP/device fingerprint as a secondary layer for pre-auth requests, and verify tenant/key scoping is correct in multi-tenant systems
- Standardize the throttling response contract (429 status, Retry-After, RateLimit-* headers) across every route so client SDKs can implement consistent backoff
- Re-test the full endpoint inventory after remediation to confirm the fix is genuinely platform-wide and not just applied to the previously-flagged sample

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, complete endpoint inventory from recon/content-discovery and API-security agents, per-endpoint exploitation evidence from Agent-011A-Rate-Limit, previous agent findings
**Output:** Validated findings with evidence, including the full endpoint coverage matrix and the systemic-vs-isolated classification
**Feeds:** Downstream agents and final penetration test report
