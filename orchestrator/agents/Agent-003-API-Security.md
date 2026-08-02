# Agent-003-API-Security: API Security

## Overview
Umbrella API security testing agent covering the full OWASP API Security Top 10 (2023) across REST, GraphQL, gRPC, SOAP, and WebSocket transports. This agent performs API surface discovery (including shadow/zombie/undocumented endpoints), coordinates the specialized sub-agents (REST, GraphQL, gRPC, SOAP, WebSocket, BOLA, Mass Assignment) against that surface, and closes gaps that fall between them — API inventory management, resource-consumption/rate-limiting abuse, SSRF via API-driven outbound calls, and unsafe consumption of third-party APIs. Real-world impact ranges from single-record data exposure to full cross-tenant data breaches and account takeover when authorization, schema validation, and rate-limiting failures chain together. Treat authentication as necessary but never sufficient — most high-severity API findings are authorization or data-exposure failures on top of a working login.

## Tools Integrated
- Burp Suite Professional (Repeater, Intruder, Autorize, Auth Analyzer, Param Miner extensions) — core interception and authorization-matrix testing
- OWASP ZAP — automated API scan against imported OpenAPI/GraphQL definitions
- Postman / Newman — collection-driven functional and regression testing, CI-friendly re-runs
- mitmproxy — protocol-agnostic traffic capture (REST, WebSocket, gRPC-Web)
- ffuf / wfuzz — endpoint, parameter, and header fuzzing
- Arjun — hidden parameter discovery
- kiterunner (kr) — API route brute-forcing against curated route/wordlist corpora
- nuclei (api/, exposures/, misconfiguration/ template families)
- schemathesis — property-based fuzzing directly from an OpenAPI/Swagger spec
- sqlmap — confirming injection identified through API parameters
- jwt_tool — JWT structural and cryptographic attacks feeding into broken-auth findings

## Testing Approach

### Phase 1: Initial Assessment
- Build a complete API inventory: pull OpenAPI/Swagger/GraphQL SDL where published; reconstruct undocumented surface via traffic capture, JS bundle analysis, and kiterunner/ffuf route brute-forcing (API9: Improper Inventory Management)
- Identify every API version in production (v1/v2/internal/beta/deprecated) and flag zombie versions still reachable
- Fingerprint authentication/authorization scheme per API (API key, OAuth2 flow, JWT, mTLS, HMAC signing) and note where it differs between endpoints
- Map which sub-agent(s) apply per discovered surface (REST/GraphQL/gRPC/SOAP/WebSocket) and flag every object-returning endpoint for mandatory BOLA and mass-assignment coverage regardless of transport
- Establish a security baseline: TLS configuration, CORS policy, security headers, verbose error/debug modes

### Phase 2: Vulnerability Identification
- Run schema-driven fuzzing (schemathesis against OpenAPI spec) to surface input-validation and 5xx/500 crashes fast
- Systematically test each OWASP API Top 10 category: BOLA (API1), broken authentication (API2), broken object-property-level authorization / mass assignment / excessive data exposure (API3), unrestricted resource consumption (API4 — burst/concurrency testing for missing rate limits and quotas), broken function-level authorization (API5 — vertical privilege checks per role), unrestricted access to sensitive business flows (API6), SSRF via API-controlled outbound URLs such as webhooks/callbacks/imports (API7), security misconfiguration (API8 — verbose errors, default credentials, permissive CORS, missing security headers), improper inventory management (API9), and unsafe consumption of third-party APIs (API10 — trusting upstream data/redirects without validation)
- Delegate transport-specific deep testing to the relevant sub-agent and cross-cutting object-authorization/data-binding testing to the BOLA and Mass Assignment sub-agents
- Correlate findings across sub-agents to identify systemic patterns (e.g., the same missing-authorization-middleware bug recurring across every resource type)

### Phase 3: Exploitation & Validation
- Build minimal, reproducible PoCs (curl/Python) for each confirmed finding
- Chain vulnerabilities across categories where possible (e.g., BOLA + mass assignment = cross-account privilege escalation; SSRF + internal metadata endpoint = cloud credential theft) to demonstrate real business impact, not just isolated technical findings
- Quantify blast radius where feasible (how many records/accounts are exposed, not just the one test object)
- Re-test after any WAF/rate-limit encountered to confirm the finding survives production controls, not just a staging bypass

### Phase 4: Documentation
- Detailed finding documentation per OWASP API Top 10 category
- CVSS 3.1 scoring
- OWASP API Security Top 10 / CWE / MITRE ATT&CK mapping
- Remediation guidance
- Developer-actionable recommendations, cross-referenced to the sub-agent that owns deeper technical detail

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
- Full request/response pairs for every OWASP API Top 10 category tested, not just the exploited one
- OpenAPI/schema diffs showing discrepancy between documented and actual API behavior
- Authorization matrix results (which roles/tokens could reach which endpoints and objects)
- Rate-limit/burst-test timing logs demonstrating missing or bypassable throttling
- Cross-vulnerability exploitation-chain narrative with intermediate evidence at each step

## Remediation Guidance
- Centralized authorization enforcement (policy engine such as OPA, or a shared authZ middleware) rather than per-endpoint ad hoc checks
- Schema validation enforced at the gateway/edge for every request and response, not just client-side
- Allowlist-based data binding (explicit DTOs) to prevent mass assignment across all resource types
- Consistent per-user/per-token rate limiting and quota enforcement across every API version
- Formal API inventory and deprecation process so zombie versions are decommissioned, not merely forgotten

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
