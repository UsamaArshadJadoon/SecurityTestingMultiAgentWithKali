# Agent-011C-Resource-Abuse: Resource Abuse

## Overview
Tests for abuse of application and infrastructure resources through legitimate-looking but disproportionate usage patterns — unbounded pagination/limit parameters, expensive query or file-processing operations, missing per-user/tenant quotas, and cost-amplifying calls to metered third-party services ("denial of wallet"). This is distinct from Agent-011B-DoS-Attacks, which covers raw protocol/connection-level and algorithmic-complexity denial-of-service; this agent focuses on feature-level and business-logic resource abuse, and from Agent-011A-Rate-Limit/Agent-030-Rate-Limiting, which cover request-frequency throttling rather than per-request resource disproportion. All PoCs here demonstrate impact at minimal, bounded scale — proving disproportion does not require exhausting real storage, draining a real budget, or crashing a service.

## Tools Integrated
- Burp Suite Repeater/Intruder — parameter tampering on limit/size/range/pagination fields
- Custom scripts (Python/curl) to sweep pagination, batch-size, and date-range parameters for accepted out-of-bound values
- InQL / GraphQL Cop — GraphQL query cost, depth, and alias/batching analysis
- ffuf — parameter discovery for undocumented size/limit/format query parameters
- File/media fuzzers and crafted payloads — oversized-pixel-dimension images, nested/zip-bomb archives, polyglot files that trigger expensive re-encoding
- Cloud cost/usage dashboards (e.g. billing/usage consoles, API-key usage dashboards for metered third parties) for denial-of-wallet impact correlation

## Testing Approach

### Phase 1: Initial Assessment
- From the discovered endpoint inventory (shared with recon/API-security and rate-limit agents), build a complete list of resource-intensive operations: file upload/download, report/export/PDF generation, image/video processing or thumbnailing, wildcard/regex search, bulk/batch operations, third-party API proxying (SMS/email/geocoding/payment calls that incur a paid upstream cost), webhook/notification dispatch.
- For each, identify every client-controllable limit parameter: page size/limit/offset, max results, file size, batch/array length, query depth/nesting, date range — and record its default value and whether any server-side ceiling is currently visible.
- Confirm the billing/cost model in scope where known (pay-per-invocation functions, pay-per-request third-party APIs) to flag denial-of-wallet candidates specifically, since these cause direct financial harm distinct from availability harm.
- Treat this as a complete inventory sweep, not a spot-check of the one obvious upload/export feature — the same full-coverage discipline used for rate-limit testing applies here, since a missing quota check is just as likely to be systemic across every list/export endpoint as it is to be isolated.

### Phase 2: Vulnerability Identification
- For each resource-intensive endpoint, test whether client-supplied limit/size parameters can be inflated beyond intended bounds: `page_size=100000`, `limit=-1`, a batch array with thousands of entries, an unbounded date range, or a deeply nested/aliased GraphQL query — and confirm whether the server enforces its own ceiling regardless of the requested value.
- Test file/media handling for decompression and dimension bombs: small-file-size images with enormous decoded pixel dimensions, deeply nested archives, and polyglot files that trigger expensive re-processing pipelines.
- Test for missing per-user/per-tenant quota enforcement: storage quotas, API-call quotas, concurrent export/report-job limits, and active session/device counts — attempt to exceed documented or expected quotas and observe whether enforcement exists.
- Test asynchronous/background-job abuse: submit several concurrent expensive jobs (report generation, bulk export, transcode) from a single account to check whether job-queue concurrency is capped per user.
- Test cost-amplifying call patterns to metered third-party services (OTP/SMS send, email send, geocoding, payment-processor calls) specifically for financial-impact framing, in addition to any availability angle already covered by rate-limit testing.
- Test algorithmic amplification via legitimate features: unbounded-row CSV/export generation, "select all" bulk actions without pagination, and recursive/nested object expansion in API responses triggerable by a single request (N+1-style amplification).

### Phase 3: Exploitation & Validation
- For each confirmed unbounded parameter or missing quota, build a minimal single-request PoC demonstrating disproportionate resource consumption relative to a normal request, capturing response time and, where observable, backend resource impact (memory spike, processing duration, output size).
- For denial-of-wallet candidates, calculate and document an estimated cost-per-abuse-request and a projected cost at a modest, still-bounded repetition rate (e.g. "N requests/hour x $cost/request = $X/day") to make financial impact concrete without actually running the abuse at volume.
- Cross-reference with rate-limit findings: if a resource-abuse vector is also unthrottled by request frequency, call out the combination explicitly — unbounded parameter plus no rate limit compounds severity and should be reported as one combined finding rather than duplicated across agents.
- Confirm impact is demonstrated at minimal/bounded scale only; this agent does not need to actually exhaust storage, drain a real budget, or crash a service to prove the vulnerability.

### Phase 4: Documentation
- Document each finding with the specific unbounded parameter/feature, the disproportion observed (e.g. "one request produced a multi-GB response" or "one call triggers dozens of downstream paid API calls"), and whether it compounds with a rate-limiting gap.
- Map to OWASP API4:2023 (Unrestricted Resource Consumption), CWE-770, CWE-400; where financial impact is the primary harm, label the business-impact section explicitly as cost/financial impact, distinct from availability impact.
- Provide developer-actionable remediation targeted at server-side enforcement rather than client-side trust.

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
- Single-request PoC and response showing disproportionate resource consumption (size, time, or downstream call count) versus a normal baseline request
- Resource/cost monitoring screenshots or exports (memory graphs, cloud billing/usage dashboards) correlated to the PoC timestamp where accessible
- Parameter-tampering request/response pairs showing accepted out-of-bound values (e.g. `limit=100000` returning all records)
- Full inventory of resource-intensive endpoints tested with pass/fail per quota/limit control
- Estimated cost-per-abuse-request calculation for any denial-of-wallet candidate

## Remediation Guidance
- Enforce server-side hard ceilings on every client-suppliable size/limit/range parameter regardless of the client-requested value — never trust a client-supplied limit or page size
- Apply per-user/per-tenant quotas (storage, concurrent jobs, calls to metered third parties) enforced atomically server-side, with alerting on threshold breaches
- Validate media files by decoded dimensions/decompressed size before processing, not just upload file size, to prevent decompression/pixel-dimension bombs
- Apply GraphQL query cost analysis plus depth/complexity limits to prevent single-request amplification
- Add circuit breakers/budget alarms around calls to metered third-party services to cap financial exposure even if functional limits are bypassed

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
