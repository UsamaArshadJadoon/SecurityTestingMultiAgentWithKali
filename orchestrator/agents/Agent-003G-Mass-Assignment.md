# Agent: Mass Assignment Vulnerability

## Overview
Mass assignment (excessive data binding) occurs when an API automatically binds client-supplied request fields directly onto an internal model or database record, letting an attacker set fields that were never meant to be client-writable — role, isAdmin, verified, accountBalance, price, ownerId. It is a framework-default problem: many ORMs and web frameworks bind whatever JSON keys are present unless the developer explicitly restricts them, so the vulnerability is often present on every create/update endpoint at once rather than one isolated route. This agent's job is to reconstruct the true object schema (including fields never intended to reach the client) and then systematically test whether any of those hidden fields are actually writable.

## Tools Integrated
- Burp Suite Param Miner extension — active hidden-parameter discovery against create/update requests
- Burp Autorize — comparing authenticated responses before/after field injection
- Arjun — parameter discovery from JS bundles, API docs, and wordlists, adapted here to request bodies rather than query strings
- nuclei (mass-assignment/ template family)
- Custom diffing scripts (json-diff / deepdiff) — comparing full backend object schema (from OpenAPI response schema, GraphQL types, or leaked ORM/model errors) against the fields accepted in request bodies

## Testing Approach

### Phase 1: Initial Assessment
- Obtain the full object schema for each resource: OpenAPI response schema (fields the API returns, which is often broader than what it accepts), GraphQL type definitions, or ORM/DB model details leaked via verbose error messages or API documentation
- Diff that full field list against the fields actually present in documented create/update request bodies to build a target list of "hidden" candidate fields (`role`, `isAdmin`, `verified`, `balance`, `price`, `discount`, `ownerId`, `status`, `permissions`, `accountTier`)
- Fingerprint the backend framework/ORM for known auto-binding defaults (e.g., unguarded Rails strong-parameters usage, Spring `@ModelAttribute`/`@RequestBody` bound directly to entities, .NET model binding without explicit `[Bind]` allowlists, Mongoose schemas without `strict: true`)
- Note every create, update (`PUT`/`PATCH`), and bulk/array endpoint per resource, since each may have independently inconsistent field-binding rules

### Phase 2: Vulnerability Identification
- Use Param Miner/Arjun against each create/update endpoint to actively confirm which hidden fields from the Phase 1 target list are accepted, injecting one at a time and diffing the response/subsequent `GET` for persistence
- Test nested-object mass assignment (e.g., `profile.role` vs. a top-level `role` field) since validation is sometimes applied only to top-level keys
- Test array/bulk endpoints for per-item mass assignment, since bulk-create/update paths often skip the single-object validation layer
- Test `PATCH` (partial update) separately from `PUT`, since partial-update handlers frequently have looser field validation than full-replace handlers
- Test type confusion on injected fields (`isAdmin` as the string `"true"` vs. boolean `true`; numeric role IDs instead of role names) to bypass naive value-based validation
- Test the same injected fields across alternate content-types (`application/x-www-form-urlencoded` vs. `application/json`) since validation middleware sometimes only covers one content-type

### Phase 3: Exploitation & Validation
- Build a PoC request that creates or updates a resource while including a privileged field (`"role":"admin"`, `"isAdmin":true`, `"price":0`, `"accountBalance":999999`) and confirm persistence via a follow-up authenticated `GET`
- Where the injected field is functionally meaningful, prove real impact by exercising the newly-granted capability directly (e.g., the now-"admin" account successfully calls an admin-only endpoint; the zero-priced item completes checkout)
- Chain with BOLA where a mass-assignable `ownerId`/`tenantId` field lets the attacker reassign an object's ownership to hijack another user's resource outright
- Document the exact before/after object state for each confirmed field

### Phase 4: Documentation
- Detailed finding documentation with the full schema-vs-accepted-fields comparison and the exact injected payload
- CVSS 3.1 scoring
- OWASP API Top 10 (API3) / CWE-915 mapping
- Remediation guidance covering allowlist binding and field-level authorization
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
- Full schema-vs-accepted-fields diff table used to derive the hidden-field target list
- Raw request containing the injected privileged field plus the follow-up response/`GET` proving persistence
- Functional proof of escalated privilege or business impact (e.g., successful call to an admin-only endpoint after field injection)
- Content-type bypass proof where validation only covered one request encoding
- Nested/array-endpoint results showing where per-item or per-field validation diverged

## Remediation Guidance
- Adopt allowlist (not denylist) field binding — explicit DTOs/serializers per operation specifying exactly which fields are client-settable
- Disable framework auto-binding defaults (enforce strong parameters, strict ORM schemas, explicit model-binding attributes) rather than relying on them being safe out of the box
- Apply the same allowlist consistently across all content-types and across single, bulk, and array endpoints
- Enforce field-level authorization so that even allowlisted privileged fields (e.g., `role`) can only be set by callers with the appropriate privilege
- Add automated regression tests asserting that unexpected/privileged fields are rejected or silently ignored on every create/update endpoint

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, resource/object schema inventory, previous agent findings
**Output:** Validated mass assignment findings with evidence
**Feeds:** Downstream agents and final penetration test report
