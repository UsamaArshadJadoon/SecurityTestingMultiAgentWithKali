# Agent-011A-Rate-Limit: Rate Limit

## Overview
Tactical, per-endpoint rate-limit exploitation agent. Confirms whether throttling controls exist, are correctly scoped, and can be bypassed, by running a defined bounded burst against **every** endpoint in the engagement's discovered inventory — not a convenient sample. This agent supplies the exploitation-layer evidence that Agent-030-Rate-Limiting consolidates into platform-level findings. A prior lesson learned the hard way: testing stopped after 2-3 endpoints, missed a systemic gap, and required an entire separate follow-up round to sweep the rest of the surface. That mistake must not repeat — full-inventory coverage is a hard requirement of Phase 1/2 below, not an optional nicety.

## Tools Integrated
- Vegeta / k6 / autocannon / hey — scripted, precisely-rateable HTTP burst generation with repeatable parameters (count, concurrency, window)
- Custom Python asyncio/aiohttp burst runner driven off the master endpoint inventory (CSV/JSON), so every endpoint gets the identical defined burst automatically
- Burp Suite Intruder / Turbo Intruder — single-packet-race and low-latency parallel request delivery for TOCTOU/race-condition bypass testing
- curl loop / xargs -P for quick manual spot-checks and reproduction of scripted findings
- Postman/Newman collection runner — replaying the full discovered API collection with burst iteration counts
- Browser devtools / mitmproxy — passive header capture (X-RateLimit-*, RateLimit-*, Retry-After) during baseline recon

## Testing Approach

### Phase 1: Initial Assessment
- Pull the complete endpoint inventory handed off from recon/content-discovery and API-security agents (OpenAPI/Swagger spec, Burp site map, ffuf/gobuster output, Postman collection) and build ONE master list of every unique method + path + auth-state combination in scope, public/pre-auth and authenticated alike.
- Treat this inventory as complete before any burst testing starts. Do not sample 2-3 "representative" endpoints (e.g. just login) and extrapolate — that pattern has previously masked a systemic gap until a costly separate follow-up engagement was needed to sweep the remainder.
- Classify each endpoint by sensitivity/cost: auth (login, register, password reset, OTP/MFA verify/resend), business-critical (checkout, coupon redemption, search, export), expensive (report generation, third-party API proxies), generic CRUD — this drives triage priority in Phase 3, not testing order (every endpoint still gets tested).
- Passively capture existing rate-limit signals from a handful of exploratory single requests: X-RateLimit-Limit/Remaining/Reset, RateLimit-Policy (IETF draft), CF-RateLimit, WAF/CDN fingerprints (Cloudflare, Akamai, AWS WAF), API gateway identification (Kong, Apigee, AWS API Gateway) from response headers or error pages.
- Record a single-request baseline (latency, response shape) per endpoint for later burst comparison.

### Phase 2: Vulnerability Identification
- For EVERY endpoint in the Phase 1 inventory, run the defined small-burst methodology: 8-12 rapid sequential (or lightly concurrent, 4-6 parallel workers) requests within a short window (5-10 seconds) — well under any destructive/volumetric threshold. Never hand-test a subset; drive the burst runner off the full inventory file so coverage is mechanical, not judgment-based.
- Test both the authenticated and public/pre-auth variant of each endpoint (login, forgot-password, OTP verify/resend, signup, contact form, search, public API keys) — throttling frequently exists on one variant and not the other.
- For each burst, check for: HTTP 429, Retry-After header, X-RateLimit-*/RateLimit-* headers, CAPTCHA/challenge injection (reCAPTCHA/hCaptcha/Turnstile), account lockout or step-up auth, silent throttling (latency increase with no error), or a WAF block page.
- On any endpoint that DOES show a limit, attempt bypass: X-Forwarded-For/X-Real-IP/Forwarded header spoofing, User-Agent rotation, rotating between multiple valid tokens/API keys, path case/trailing-slash/encoding variation, HTTP method swap, batching multiple operations into one GraphQL/JSON-RPC call, and simultaneous parallel requests to catch a TOCTOU race window in the counter (e.g. redeem-coupon-twice, single-use-token reuse).
- Log every result in a running coverage matrix: endpoint, method, auth state, burst result, headers observed, bypass attempted, bypass result. Track coverage as a count/percentage against the master inventory — an incomplete sweep is an incomplete phase.

### Phase 3: Exploitation & Validation
- Build a minimal, single-command reproducible PoC (one Vegeta/k6/curl-loop invocation) for each confirmed-unthrottled endpoint that a developer can re-run to verify.
- Assess business impact per gap: credential-stuffing/brute-force feasibility (login/OTP), price/inventory scraping, spam via notification-triggering endpoints, coupon/discount enumeration, quota/free-tier abuse, expensive-operation cost amplification.
- Escalation gate: once the full-inventory sweep is complete, aggregate results. If unthrottled or bypassable behavior is confirmed on MORE THAN ONE endpoint — especially spanning different route groups/controllers — do not report N separate isolated low/medium findings. Escalate to one SYSTEMIC finding ("no centralized rate-limiting middleware/gateway policy enforced across the API"), citing every affected endpoint as supporting evidence for that single architectural finding.
- State the scope boundary explicitly: this is bounded small-burst validation of throttling presence/bypass only. It does not attempt sustained high-volume flooding, distributed/botnet simulation, or resource-exhaustion — that is Agent-011B-DoS-Attacks' distinct, separately-authorized scope.

### Phase 4: Documentation
- Report inventory coverage explicitly ("X of X discovered endpoints tested, 100%") alongside the exact burst parameters used (count, concurrency, window), so the sweep is auditable and reproducible.
- Where the systemic pattern applies, file ONE finding with the full list of affected endpoints in the evidence/affected_component fields rather than duplicate per-endpoint entries.
- Map to OWASP API4:2023 (Unrestricted Resource Consumption), CWE-770/CWE-799 as applicable; aim remediation guidance at the architectural fix (gateway/middleware layer), not per-endpoint patches.

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
- Full burst-tool output (status codes, timings, headers) for every tested endpoint, not just the ones that failed
- Coverage matrix showing 100% of the discovered endpoint inventory tested, with pass/fail per entry
- Captured 429/Retry-After/X-RateLimit-* headers (or their documented absence) as raw HTTP request/response traces
- Bypass-technique attempts and results (header-spoofing requests, race-condition timing evidence)
- Screenshots/logs of CAPTCHA presence or absence on brute-forceable auth/OTP endpoints

## Remediation Guidance
- Enforce rate limiting centrally at the API gateway/reverse-proxy/WAF layer (Kong, NGINX limit_req, Envoy, AWS API Gateway usage plans, Cloudflare Rate Limiting) rather than per-route application code
- Key limits by authenticated user ID/API key first, falling back to IP + fingerprint only for pre-auth endpoints, since IP-only limiting is trivially bypassed
- Use an atomic counter store (e.g. Redis INCR/Lua script) to close the TOCTOU race windows identified during bypass testing
- Standardize the 429 + Retry-After response contract across all endpoints so client SDKs can implement consistent backoff
- Prioritize remediation order: pre-auth sensitive endpoints (login, OTP, password reset) first, then business-critical/cost-sensitive endpoints, then general CRUD

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, complete endpoint inventory from recon/content-discovery and API-security agents, previous agent findings
**Output:** Validated findings with evidence, including the full endpoint coverage matrix
**Feeds:** Agent-030-Rate-Limiting (systemic consolidation), downstream agents, and final penetration test report
