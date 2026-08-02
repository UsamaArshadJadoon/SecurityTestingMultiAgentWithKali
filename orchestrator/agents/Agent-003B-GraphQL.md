# Agent: GraphQL Testing

## Overview
GraphQL collapses an entire API surface into a single endpoint, which shifts the attack surface from "which route exists" to "which query/mutation/field combination is authorized." This agent targets the GraphQL-specific failure classes: introspection-driven schema disclosure, denial-of-service via deeply nested or circular queries, batching/aliasing abuse that bypasses per-request rate limits, and field-level authorization gaps where a query is authorized at the top level but leaks unauthorized nested objects. These issues are frequently invisible to REST-oriented scanners and require GraphQL-aware tooling and manual query crafting.

## Tools Integrated
- InQL (Burp Suite extension) — introspection-driven query/mutation/subscription enumeration and auto-generated test queries
- graphql-cop — automated scanner for common GraphQL misconfigurations (introspection, batching, field suggestions, CSRF)
- clairvoyance — schema reconstruction via field-suggestion brute-forcing when introspection is disabled
- graphql-voyager — visual schema mapping to identify object relationships and reachable nested types
- Altair GraphQL Client / GraphiQL — manual query and mutation crafting
- nuclei (graphql/ template family)
- Custom Python scripts (gql/requests) for scripted batching, aliasing, and depth-attack payload generation

## Testing Approach

### Phase 1: Initial Assessment
- Send a full introspection query (`__schema`, `__type`) against the discovered endpoint(s) (`/graphql`, `/graphiql`, `/playground`, `/v1/graphql`)
- If introspection is disabled, run clairvoyance to reconstruct the schema from field-suggestion error messages
- Use InQL to auto-generate the complete list of queries, mutations, and subscriptions with their argument types
- Fingerprint the GraphQL engine (Apollo Server, Hasura, Graphene, graphql-yoga) from error formatting and default paths, since default protections (e.g., depth limiting) vary by engine
- Map every query/mutation that returns an object or list of objects — this list feeds mandatory BOLA testing regardless of what this agent finds directly

### Phase 2: Vulnerability Identification
- Test query depth/complexity DoS with deeply nested queries and circular fragment spreads; measure response time/CPU impact versus a baseline query
- Test aliasing and batching abuse: send hundreds/thousands of aliased copies of a rate-limited mutation (e.g., login, password reset, coupon redemption) in a single HTTP request to see if per-HTTP-request rate limiting is bypassed
- Confirm whether introspection is exposed in the production environment (info disclosure of the entire API surface, including admin-only types)
- Test resolver-argument injection (SQL/NoSQL) where GraphQL variables are concatenated into backend queries
- Test for verbose GraphQL error responses leaking stack traces, resolver file paths, or internal schema fragments
- Test field-level authorization specifically: a query authorized at the top-level object may still resolve nested fields/objects belonging to another user or tenant — walk every nested relationship in the schema, not just top-level types
- Test persisted-query/allowlist bypass if the client is expected to only send pre-registered queries
- Test subscription authentication and whether a subscription channel enforces the same authorization as its query equivalent

### Phase 3: Exploitation & Validation
- Craft and execute a PoC deeply-nested/circular query with measured timing/resource comparison against baseline to prove DoS impact
- Build a scripted batched-alias PoC that executes a rate-limited sensitive mutation (e.g., password reset or discount code redemption) far beyond its intended per-minute limit inside one HTTP call
- Use InQL-generated queries to reach and exfiltrate a nested object belonging to another user/tenant, proving field-level BOLA
- Where resolver injection is suspected, confirm with a targeted payload and demonstrate data exfiltration or boolean-based confirmation
- Chain introspection-disclosed admin/internal types into unauthorized data access if reachable

### Phase 4: Documentation
- Detailed finding documentation with the exact GraphQL query/mutation and full response
- CVSS 3.1 scoring
- OWASP API Top 10 / CWE mapping
- Remediation guidance covering schema, query-cost, and resolver-level fixes
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
- Full introspection query response dump and InQL-generated schema map
- Batched-alias-abuse request showing N logical operations bypassing rate limiting inside one HTTP call
- Timing/resource metrics for the deep-query/circular-fragment DoS proof
- Resolver-injection payload and response demonstrating data exfiltration
- Nested-field BOLA query/response pair showing cross-user/tenant object exposure

## Remediation Guidance
- Disable introspection in production environments
- Implement query depth and cost/complexity limiting (e.g., graphql-depth-limit, graphql-cost-analysis) tuned to real query patterns
- Enforce rate limiting per logical operation, not per HTTP request, to close aliasing/batching bypasses
- Apply field-level authorization directives/resolvers so nested objects re-check ownership, not just the top-level query
- Sanitize and parameterize all resolver inputs identically to REST equivalents
- Adopt a persisted-query allowlist for production clients where feasible

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, GraphQL endpoint(s), previous agent findings
**Output:** Validated GraphQL findings with evidence
**Feeds:** Downstream agents and final penetration test report
