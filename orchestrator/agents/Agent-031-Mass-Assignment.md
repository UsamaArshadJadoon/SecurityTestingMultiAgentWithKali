# Agent-031-Mass-Assignment: Mass Assignment

## Overview
Advanced mass assignment and excessive data binding testing focused on nested-object, array-based, and deeply-embedded parameter injection that basic single-field mass assignment checks (covered by Agent-003G) typically miss. Modern frameworks (Rails strong params, Django REST serializers, Spring `@RequestBody` binding, Mongoose schemas, GraphQL input types) often allowlist top-level fields correctly but still blindly bind nested objects, arrays of objects, or polymorphic sub-resources supplied in the same payload. This agent targets privilege-escalation-via-JSON scenarios: injecting `role`, `isAdmin`, `permissions[]`, `organizationId`, or `price` fields inside nested arrays, sub-documents, or bulk/batch array payloads where allowlists are not recursively applied. Real-world impact ranges from privilege escalation and IDOR-via-relationship-injection to price/quantity tampering in e-commerce order arrays and unauthorized field writes in bulk PATCH/PUT operations.

## Tools Integrated
- Burp Suite Repeater/Intruder (with Autorize and AuthMatrix extensions) - manual and automated nested-field injection
- Arjun - hidden parameter discovery for nested and array-indexed keys
- Param Miner (Burp extension) - discovers unlinked/unbound parameters at any JSON depth
- Postman/Newman - scripted batch/array payload variants across collection runs
- mitmproxy with custom addon scripts - programmatic JSON body mutation and array expansion
- graphql-cop / InQL - nested input-type mass assignment testing for GraphQL mutations
- Custom Python (requests + jsonpath-ng) - automated recursive key injection at every JSON path
- json-diff tooling - comparing request vs. response object graphs to spot silently-accepted extra fields

## Testing Approach

### Phase 1: Initial Assessment
- Map all endpoints accepting JSON/XML bodies with nested objects or arrays (user profiles, order line items, bulk updates, GraphQL input objects)
- Fingerprint the backend framework/ORM (Rails, Django, Spring, Mongoose, Prisma, Hibernate) to infer default binding behavior
- Collect full object schemas by diffing full-privilege vs. low-privilege API responses (fields present in GET but absent from allowed POST/PUT fields are injection candidates)
- Identify bulk/batch endpoints (`POST /items/bulk`, `PATCH /users` with array body) where each array element may bind independently
- Enumerate relationship/foreign-key fields (`organizationId`, `ownerId`, `parentId`, `accountId`) embedded in nested sub-objects

### Phase 2: Vulnerability Identification
- Inject privileged fields at every nesting level, not just top-level: `{"profile":{"role":"admin"}}`, `{"address":{"userId":2}}`, `{"items":[{"price":0.01}]}`
- Test array-of-objects payloads where only the first element is validated but subsequent elements bind raw (`items[0]` sanitized, `items[1..n]` not)
- Test polymorphic/discriminator fields (`type`, `__t`, `kind`) that switch schema validation and may expose a less-restricted sibling schema
- Probe GraphQL nested input types and `input` objects for fields absent from the documented schema but still accepted by the resolver
- Test PATCH-with-array-of-diffs and JSON Merge Patch / JSON Patch (RFC 6902) endpoints for `add`/`replace` operations targeting protected paths (`/role`, `/permissions/0`)
- Check whether array index manipulation (`items[999]`, negative indices, sparse arrays) triggers different validation code paths
- Test file-upload-plus-metadata endpoints where a nested JSON metadata blob rides alongside multipart data and bypasses the JSON-body allowlist

### Phase 3: Exploitation & Validation
- Build a working PoC that escalates privilege or tampers with protected state purely through nested/array injection (e.g., self-registration payload with `{"account":{"role":"admin"}}` resulting in an admin account)
- Chain a nested mass-assignment bypass with a subsequent read (GET `/me` or admin panel access) to prove the injected field was persisted and is authoritative
- Demonstrate cross-tenant impact where a nested `organizationId`/`tenantId` field lets one tenant's object bind into another tenant's collection
- Validate that the injected field survives serialization round-trips (not just accepted, but actually stored/enforced)
- Reproduce with minimal payload (isolate exactly which nested key/array position triggers the bypass) for clean developer reporting

### Phase 4: Documentation
- Detailed finding documentation with the exact JSON path (e.g., `$.order.items[1].price`) that was exploitable
- CVSS 3.1 scoring reflecting privilege escalation or integrity impact
- OWASP/CWE mapping (CWE-915 Improperly Controlled Modification of Dynamically-Determined Object Attributes)
- Remediation guidance tailored to the identified framework's binding mechanism
- Developer-actionable recommendations including exact allowlist/serializer changes

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
- Full JSON request/response pairs showing the exact nested path or array index that was injected and accepted
- Before/after object state (GET response before request, GET response after, diffed) proving persistence
- Framework/ORM identification evidence (stack traces, error messages, response headers) supporting the root-cause hypothesis
- Screenshots of resulting privilege escalation (e.g., admin panel access after nested-role injection)
- Tool output from Arjun/Param Miner showing discovered unbound nested keys

## Remediation Guidance
- Enforce allowlist-based serializers/DTOs recursively at every nesting level, not just top-level attributes (e.g., strong parameters applied per-nested-model in Rails, explicit nested serializers in DRF)
- Reject unknown fields at any depth (`additionalProperties: false` in JSON Schema validation, `@JsonIgnoreProperties(ignoreUnknown = false)` equivalents) rather than silently dropping or silently accepting them
- Validate array elements individually and consistently — do not special-case index 0 differently from subsequent elements
- Apply schema validation before ORM binding so that untrusted nested keys never reach the model layer
- Add automated contract tests that assert protected fields (`role`, `isAdmin`, `price`, `organizationId`) cannot be set via public write endpoints at any nesting depth

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
