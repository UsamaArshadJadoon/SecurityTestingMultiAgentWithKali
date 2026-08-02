# Agent-011B-DoS-Attacks: DoS Attacks

## Overview
Assesses application and infrastructure resilience to denial-of-service conditions using controlled, **non-destructive** techniques only. This agent proves or disproves DoS-class weaknesses (protocol-level, algorithmic-complexity, and business-logic) at minimal proof-of-concept scale. It does **not** authorize sustained volumetric flooding, distributed/botnet-style attacks, or resource-exhaustion testing against production or production-adjacent systems — that is a categorically distinct activity requiring its own explicit written authorization, a defined maintenance window, and advance notice to hosting/CDN/ISP providers. If the rules of engagement do not explicitly cover volumetric/DDoS-style testing, this agent's exploitation phase stays PoC-only and, where possible, targets a non-production/staging instance.

## Tools Integrated
- slowhttptest — Slowloris, Slow POST, and Slow Read PoC runs configured at a small connection count (tens, not thousands)
- Custom single-payload scripts (Python/curl) to reproduce ReDoS (catastrophic-backtracking regex) and decompression/entity-expansion behavior with one crafted input at a time
- hping3 — targeted, low-volume protocol-behavior probing only (not flood generation)
- k6 / Vegeta / Artillery — used strictly at PoC scale (a handful of requests) to observe behavior, never scaled up to attack-volume
- Wireshark / tcpdump — connection-state and resource-timeline observation during PoC runs
- Server/infra monitoring (APM, cloud provider metrics, `top`/`htop`, container stats) for before/after resource-consumption evidence
- Recognition-only awareness of flood tooling (LOIC, GoldenEye, MHDDoS) for detection/defense discussion — not for use against any target in this engagement

## Testing Approach

### Phase 1: Initial Assessment
- Confirm the written scope explicitly authorizes DoS-category testing, and separately confirm whether it authorizes volumetric/resource-exhaustion testing against production infrastructure. If volumetric testing is not explicitly named, treat exploitation as PoC-only / theoretical, ideally against a staging or non-production replica.
- Map the DoS-relevant architecture: reverse proxies/load balancers/CDN in front of the target (Cloudflare, Akamai, AWS ALB/CloudFront), visible timeout and connection-limit behavior, WAF presence, and autoscaling posture — inferred from headers, TLS fingerprints, and error pages.
- From the API/endpoint inventory (shared with the rate-limit agents), flag algorithmically expensive candidates: regex-heavy validation/search fields, recursive or deeply-nestable JSON/XML parsing, file/image/PDF/report generation, archive upload/decompression endpoints, and GraphQL without depth/complexity limiting.
- Record a resource baseline (CPU, memory, response latency, open connections) under normal single-user load wherever a staging environment or monitoring access is available, so any PoC's effect can be measured relative to that baseline rather than guessed.

### Phase 2: Vulnerability Identification
- Protocol layer: test Slowloris (slow header trickle), Slow POST (slow body trickle), and Slow Read (shrunk TCP receive window) using slowhttptest capped at a small connection count sufficient to observe worker/connection-slot exhaustion trends, without saturating the target.
- Algorithmic complexity: test for ReDoS in input-validation regexes (patterns like `(a+)+$`, nested quantifiers) with a **single** crafted malicious input per candidate field, observing CPU time growth — not repeated submission.
- Resource amplification: test decompression/expansion behavior (zip bomb, gzip bomb, XML entity expansion / billion-laughs, XXE) using a small-ratio staged payload to confirm whether size/ratio ceilings exist, without submitting a full-scale bomb to a live system.
- GraphQL/API-specific: test query depth, field aliasing, and request batching abuse at a small N (5-10 aliased/nested operations) to confirm absence of cost/depth limiting, not maximal N.
- Business-logic DoS: verify whether a third party can cheaply lock a victim out of their own account (e.g. triggering account lockout via repeated failed logins using only the victim's known username/email) — this requires only a handful of requests, not volume, and is a DoS vector distinct from raw flooding.
- Explicitly rule out of scope for this phase: sustained multi-minute/hour floods, multi-source/botnet-simulated traffic, and bandwidth-saturation testing against production or production-adjacent infrastructure, unless a separate written authorization specifically names volumetric/DDoS testing.

### Phase 3: Exploitation & Validation
- For each confirmed weakness, capture before/after resource metrics at PoC scale as sufficient proof: one Slowloris connection tying up a worker/thread, one ReDoS payload producing a measurable multi-second CPU spike, one bounded decompression payload expanding disproportionately relative to its input size.
- Prefer validating against a non-production/staging replica; if only production is reachable, keep PoC scale conservative and stop at the first clear degradation signal (error-rate uptick, latency spike, connection/worker exhaustion) rather than pushing toward an actual outage.
- Document any "stopped early" or "not scaled further" decision explicitly as a deliberate testing-boundary choice, not an incomplete result — under-testing here is the correct, authorized behavior, not a gap.
- Note where true large-scale DDoS/volumetric resilience (CDN scrubbing capacity, autoscaling under real load) would need to be validated: via a coordinated, separately-scoped load test conducted with the hosting/CDN provider's advance knowledge, not as part of this agent's default run.

### Phase 4: Documentation
- Label each finding by category — protocol-level (Slowloris/Slow POST/Slow Read), algorithmic complexity (ReDoS/expansion), business-logic DoS (lockout abuse), or architectural (no connection/timeout limiting, no autoscaling headroom) — since each has a different remediation owner and fix.
- Record the exact bounded scale used for every PoC (connection count, payload size/ratio, request count, target environment: staging vs production) so the finding is reproducible without needing to re-run at higher, riskier scale.
- Map to OWASP API4:2023 (Unrestricted Resource Consumption), CWE-400 (Uncontrolled Resource Consumption), CWE-770, CWE-835 (infinite loop) as applicable.

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
- Before/after resource metrics (CPU, memory, response latency, open connection count) captured at bounded PoC scale
- slowhttptest/tooling output showing connection-hold behavior at the specific (small) connection count used
- Single-payload ReDoS/decompression-ratio proof: exact input, processing time, and payload size vs. expanded size
- Explicit record of testing boundaries observed (max connections/requests used, target environment: staging vs production)
- Monitoring/dashboard screenshots showing degradation onset where accessible, timestamped against the PoC run

## Remediation Guidance
- Tune timeouts and connection limits at the reverse proxy/load balancer (NGINX client_header_timeout/client_body_timeout, mod_reqtimeout, ALB idle timeout) to close Slowloris/Slow POST/Slow Read windows
- Redesign flagged input-validation regexes to remove catastrophic-backtracking patterns (avoid nested quantifiers; use possessive quantifiers, atomic groups, or a linear-time engine such as RE2)
- Enforce decompression-ratio and size ceilings, and stream/validate before fully expanding uploaded archives or XML; disable external entity expansion (XXE) outright
- Apply GraphQL query cost analysis plus depth, alias, and batch limiting at the schema/gateway level
- Rate-limit or CAPTCHA-gate lockout-triggering actions so a third party cannot cheaply DoS a victim's account via repeated failed logins

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
