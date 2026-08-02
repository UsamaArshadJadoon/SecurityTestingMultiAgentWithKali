# Agent: REST API Security Testing

## Overview
Deep-dive testing of RESTful HTTP APIs against the OWASP API Security Top 10, focused on the failures that automated scanners routinely miss: verb tampering, hidden parameters, inconsistent authorization between documented and undocumented routes, and mass-assignment-style excessive data binding. REST APIs are the most common enterprise API style and the most common source of BOLA and broken-function-level-authorization findings because authorization logic is frequently duplicated (or forgotten) per route handler. This agent assumes REST semantics (resource + HTTP verb + status code) and tests specifically for places where that contract is inconsistently enforced.

## Tools Integrated
- Burp Suite (Repeater, Intruder, Autorize, Auth Analyzer, Param Miner) — manual and matrix-based authorization testing
- Postman / Newman — spec-driven functional regression and collection replay
- ffuf — endpoint, path, and parameter fuzzing (`FUZZ` in path segments, query strings, headers)
- wfuzz — multi-point fuzzing (headers + body + params simultaneously)
- Arjun — hidden/undocumented parameter discovery from JS bundles, docs, and wordlists
- kiterunner (kr) — API route brute-forcing against curated OpenAPI/route wordlists to surface undocumented endpoints
- schemathesis — property-based fuzzing driven directly from an OpenAPI/Swagger spec
- jwt_tool — JWT `alg:none`, key-confusion, and signature-stripping attacks
- sqlmap — confirming injection once a vulnerable parameter is identified

## Testing Approach

### Phase 1: Initial Assessment
- Obtain or reconstruct the OpenAPI/Swagger spec; where absent, rebuild the route map via traffic capture and kiterunner/ffuf brute-forcing against common API wordlists
- Enumerate all API versions in production (`/v1/`, `/v2/`, `/api/internal/`, `/beta/`) and note any deprecated version still reachable
- Identify the auth scheme per route (API key header, Bearer JWT, OAuth2 flow, HMAC signature) — inconsistency between routes is itself a finding
- Map full CRUD surface per resource (list, detail, create, update, delete, bulk) and flag every object-returning route for BOLA/mass-assignment follow-up
- Note undocumented, beta, or admin-prefixed endpoints discovered but absent from the published spec

### Phase 2: Vulnerability Identification
- Run Arjun against each endpoint to surface hidden parameters, then re-test with those parameters included
- Test HTTP verb tampering per resource (does `PUT`/`PATCH`/`DELETE` enforce the same authorization as `GET`? does an unsupported verb fall through to a default-allow handler?)
- Test mass assignment by adding extra JSON fields (`role`, `isAdmin`, `verified`, `price`) to create/update bodies and diffing the persisted object via a follow-up `GET`
- Test excessive data exposure (API3) by comparing the full backend object shape (from schema/error leakage) against the fields actually intended for the client
- Test resource consumption/rate limiting (API4) with Turbo Intruder-style burst requests against expensive or sensitive endpoints (password reset, export, search)
- Test SSRF in any API-controlled URL parameter (webhook registration, import-by-URL, avatar-by-URL) by pointing it at an internal/metadata address
- Run jwt_tool against bearer tokens for `alg:none`, weak HMAC secret brute-force, and `kid` header injection
- Test pagination/sort/filter parameters for injection (SQL/NoSQL) and for object-enumeration via predictable IDs
- Run schemathesis against the OpenAPI spec to catch input-validation crashes and undocumented status codes fast

### Phase 3: Exploitation & Validation
- Build a minimal curl/Python PoC for each confirmed finding, showing the exact request that triggers it and the response that proves impact
- Chain verb tampering with missing function-level authorization to demonstrate vertical privilege escalation (e.g., a standard user issuing an admin-only `DELETE`)
- Demonstrate BOLA concretely by swapping an object ID in an authenticated request and retrieving/modifying another account's resource
- Confirm any suspected injection with sqlmap using the exact vulnerable parameter and request template captured from Burp
- Where mass assignment is confirmed, follow through to a functional privilege check (e.g., the injected `role:"admin"` field actually unlocks an admin-only route)

### Phase 4: Documentation
- Detailed finding documentation with exact request/response evidence
- CVSS 3.1 scoring
- OWASP API Top 10 / CWE mapping
- Remediation guidance with vulnerable vs. fixed request/handler examples
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
- Arjun/ffuf output showing discovered hidden parameters and undocumented routes
- Side-by-side JSON diffs proving excessive data exposure or mass-assignment persistence
- Verb-tampering request/response pairs showing inconsistent authorization across `GET`/`PUT`/`PATCH`/`DELETE`
- Burst/timing logs demonstrating missing or bypassable rate limiting
- jwt_tool output for any token-forgery or signature-bypass finding

## Remediation Guidance
- Enforce schema validation (request and response) at the gateway or framework middleware layer for every route
- Apply an explicit allowlist of client-settable fields per operation instead of binding request bodies directly to internal models
- Centralize authorization checks per object, not per endpoint, so every verb on a resource is covered consistently
- Apply per-user/per-token rate limiting and quotas on expensive or sensitive operations
- Strip verbose stack traces, framework version banners, and debug endpoints from production responses

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, OpenAPI/route inventory, previous agent findings
**Output:** Validated REST API findings with evidence
**Feeds:** Downstream agents and final penetration test report
