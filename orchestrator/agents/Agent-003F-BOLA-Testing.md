# Agent: Broken Object-Level Auth

## Overview
Broken Object-Level Authorization (BOLA/IDOR) is consistently ranked the #1 OWASP API risk because authentication is easy to get right while per-object authorization is easy to forget on any one of dozens of routes. This agent tests whether the API verifies that the authenticated caller actually owns or is entitled to the specific object referenced in the request — not just that the caller is logged in. The single most important methodological point is that true cross-tenant isolation can only be proven with two genuinely independent identities: testing with one account, or with two users who happen to belong to the same tenant/organization, can only ever demonstrate same-tenant IDOR. It cannot prove or disprove the more severe class of finding — cross-tenant data exposure — because same-tenant "shared" authorization boundaries are often intentionally looser than tenant boundaries. Treat the two-identity requirement below as a hard gate, not a nice-to-have.

## Tools Integrated
- Burp Suite Autorize extension — automated replay of one user's captured traffic under another user's session/token to flag authorization bypasses
- Burp Auth Analyzer — authorization-matrix comparison across roles and identities
- Postman (with separate environments/collections per test identity) — structured, repeatable cross-account request replay
- Custom Python scripts (requests/httpx) — systematic ID-swapping across two authenticated sessions, scripted in both directions
- ffuf — numeric/GUID ID-space sweeping under each identity's token to estimate enumeration blast radius
- nuclei (bola/idor-relevant templates) — fast baseline coverage before manual deep-dive

## Testing Approach

### Phase 1: Initial Assessment
- **Hard prerequisite / gate — do not proceed to Phase 2 without this in place:** provision at minimum two fully independent test identities before any object-level authorization testing begins. Ideally these are two separate tenants/organizations/accounts, each independently registered, not two user accounts created within the same tenant. If only a single identity or a single tenant is available, halt and escalate to request second-tenant provisioning rather than substituting a same-tenant second user — single-account or single-tenant testing can only prove same-tenant IDOR, never true cross-tenant isolation, and the two represent different severity classes with different remediation owners.
- Using each identity independently, create at least one object of every resource type the API exposes (records, files, orders, messages, invoices, comments, etc.), so Account A / Tenant A and Account B / Tenant B each own a distinct, known set of object IDs — do not clone or share objects between them.
- Enumerate every object-returning endpoint across the full API surface: list/detail GETs, export/download endpoints, search/filter endpoints, nested sub-resource endpoints, bulk endpoints, and admin/back-office endpoints — pulling this inventory from OpenAPI/GraphQL schema/gRPC reflection/traffic capture as available.
- Catalog the ID/reference scheme per object type (sequential integer, UUID, hashid, slug) since predictability directly affects both exploitability and severity.

### Phase 2: Vulnerability Identification
- For every object-returning endpoint cataloged in Phase 1, test **both directions**: Account A's session/token requesting Account B's object IDs, and Account B's session/token requesting Account A's object IDs. Never test only one direction — asymmetric authorization bugs (A can reach B's data but not vice versa, or vice versa) are common, and each direction is a separate, independently reportable finding.
- Configure Burp Autorize with both identities' sessions to automatically replay every captured request from A's traffic under B's token (and B's traffic under A's token), flagging any response that returns live data instead of a 403/404.
- Test across every relevant HTTP method per object: `GET` (read BOLA), `PUT`/`PATCH` (write BOLA — modifying another tenant's object), `DELETE` (destructive BOLA), and any action/state-transition endpoints (approve, cancel, share, assign).
- Test indirect object reference leakage: do list/search endpoints return other tenants' object IDs even where direct access to those IDs is otherwise blocked (enumeration via list responses)? Do nested resources reachable through an authorized parent object leak a child object ID belonging to the other tenant?
- Where IDs are sequential or otherwise guessable, sweep the ID space with ffuf/custom scripts under each identity's token to estimate how much of the object space is exposed, not just the single test object.
- Explicitly distinguish and separately record same-tenant IDOR (user vs. user inside one org, if tested) from true cross-tenant BOLA (Tenant A vs. Tenant B) — do not conflate the two in findings, since severity and remediation ownership differ.

### Phase 3: Exploitation & Validation
- Build a minimal, reproducible PoC (Python/curl) that, using only Account A's credentials, retrieves or modifies a specific object created by Account B — and the mirror PoC using only Account B's credentials against an object created by Account A. Both directions are required evidence, not optional.
- Chain confirmed BOLA with mass-assignment or broken-function-level-authorization findings where applicable (e.g., cross-tenant read access combined with a mass-assignment write path yielding full cross-tenant takeover of another organization's data).
- Quantify blast radius: attempt to enumerate the broader object ID space under each identity to estimate how many cross-tenant records are actually exposed, beyond the one object used for the initial PoC.

### Phase 4: Documentation
- Detailed finding documentation recording which identity/tenant performed each request, and explicitly stating whether the finding was validated in both directions (and, if only one direction, why)
- CVSS 3.1 scoring
- OWASP API Top 10 (API1) / CWE-639 mapping
- Remediation guidance targeting the data-access layer, not individual endpoints
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation
- Both directions of cross-tenant access (A→B and B→A) tested and recorded for every object-returning endpoint before a BOLA finding is closed out

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
- Paired request/response captures for each vulnerable endpoint: Account A reaching Account B's object, and Account B reaching Account A's object
- Autorize matrix output showing every endpoint tested and its pass/fail result per identity
- ID-enumeration sweep results with hit counts estimating total exposed-object blast radius
- Explicit record of both test identities/tenants used (account/tenant identifiers, never credentials) tying each PoC to its tested direction

## Remediation Guidance
- Enforce object-level authorization at the data-access layer (verify `resource.owner_id`/`resource.tenant_id` matches the caller's session/tenant on every read and write), never relying on obscurity of the ID scheme
- Add automated authorization-regression tests (Autorize-in-CI or equivalent contract tests) that run against every new object-returning endpoint before release
- Apply consistent multi-tenant data partitioning (row-level security or tenant-scoped query filters) rather than ad hoc per-endpoint checks that are easy to omit on a new route
- Log and alert on cross-tenant access attempts in production as a detective control alongside the preventive fix
- Re-verify fixes in both directions (A→B and B→A) before closing the finding, matching the testing methodology used to find it

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided
✓ Both access directions (A→B and B→A) validated for every affected endpoint

## Dependency Flow
**Input:** Target scope, two independently-provisioned test identities/tenants (hard prerequisite), object/endpoint inventory, previous agent findings
**Output:** Validated BOLA findings with evidence
**Feeds:** Downstream agents and final penetration test report
