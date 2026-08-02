# Agent-055-ORM-QueryBuilder-Injection: ORM & Query-Builder Abstraction-Layer Injection Testing

## Overview
Targeted testing of injection vulnerabilities that arise specifically through Object-Relational Mapping frameworks and query builders — Hibernate/HQL and JPQL, Sequelize, TypeORM, Prisma, Django ORM, and Knex.js — as distinct from raw SQL injection covered by Agent-044. Developers routinely assume that "using an ORM" is equivalent to "safe from injection," but every one of these frameworks exposes raw-query escape hatches, dynamic filter/operator objects, and string-built identifier interpolation (table/column names, `ORDER BY` clauses) that bypass the framework's own parameterization and reintroduce classic injection risk in a form generic SQLi scanners often miss because the payload shape looks like application logic rather than a SQL fragment. HQL injection in Hibernate can reach the same catastrophic impact as SQL injection (data exfiltration, and in some configurations OS command execution via UDFs), while operator-injection in JavaScript ORMs (`Sequelize`/`TypeORM`) lets an attacker smuggle Mongo-style or SQL-comparison operators through a JSON body that the framework interprets as query logic instead of a literal value. This agent focuses specifically on the abstraction-layer attack surface these tools introduce.

## Tools Integrated
- sqlmap - effective for raw-query passthrough points once an ORM's `.raw()`/`.query()`/`createNativeQuery()` escape hatch is identified as the injection sink
- Burp Suite (Repeater, Intruder) - manual crafting and fuzzing of JSON request bodies to probe operator-injection in JS ORMs
- Custom Python scripts using `sqlalchemy` - introspecting application-side query-construction patterns via a local proxy/instrumented test harness to identify `text()`/raw-SQL usage inside otherwise-parameterized ORM code
- Custom Node.js/Python fuzzing harnesses - targeted payload generators for Sequelize (`$ne`, `$gt`, `$or`, `$regex` style operators embedded in JSON filter objects) and TypeORM (`find()`/`findOne()` `where` object operator injection)
- HQL/JPQL-specific payload sets (manual + Burp Intruder) - testing Hibernate `createQuery()`/`createNativeQuery()` string-concatenation sinks with HQL-specific syntax (`from User u where u.name = '` + input, alias/entity-name injection)
- Custom Python scripts using `requests` - automated differential-response testing (boolean/time-based) tailored to each ORM's error-message fingerprint (Sequelize `SequelizeDatabaseError`, TypeORM `QueryFailedError`, Prisma `PrismaClientKnownRequestError` codes) to confirm injection without needing engine-native error strings
- Static/source-assisted review (when source access is in scope) using `semgrep`-style pattern matching for known-dangerous ORM call signatures (`Model.sequelize.query(rawString)`, `entityManager.createNativeQuery(rawString)`, `db.$queryRawUnsafe(rawString)`, Django `.raw()`/`.extra()`) to prioritize dynamic testing targets
- Knex.js-specific probing scripts - testing `knex.raw()` interpolation points and identifier-binding (`??`) misuse where table/column names are built from user input

## Testing Approach

### Phase 1: Initial Assessment
- Identify the backend framework and ORM/query builder in use via response headers, error-message fingerprints, stack traces (if verbose errors are exposed), and framework-specific default behaviors (Prisma's structured error codes, TypeORM's `QueryFailedError` format, Sequelize's dialect-specific error wrapping)
- Enumerate all endpoints accepting structured filter/sort/pagination input (`?sort=`, `?filter[field]=`, JSON body `where` objects, GraphQL resolver arguments) since these are the most common operator-injection entry points in JS ORMs
- Identify any endpoints whose behavior suggests a raw-query escape hatch is in use: dynamic sorting (`ORDER BY` driven by user input), dynamic table/column selection (multi-tenant or "search across fields" features), or report-generation/export features that often bypass the ORM's query builder entirely
- Map input types expected by each parameter (string vs. object) — endpoints that silently accept a JSON object where a scalar is expected are prime candidates for operator injection
- Baseline normal application responses and timing for later differential comparison

### Phase 2: Vulnerability Identification
- HQL/JPQL injection: submit single-quote and HQL-comment payloads into inputs suspected of reaching `createQuery()`/string-concatenated HQL, distinguishing HQL error signatures (`QuerySyntaxException`, `could not resolve property`) from native SQL errors — HQL injection can still reach `EXEC`-equivalent behavior via native-query fallback or second-order SQL injection when HQL results are used to build a subsequent raw query
- Sequelize/TypeORM operator injection: submit JSON bodies substituting an object for an expected scalar (e.g., `{"password": {"$ne": null}}` equivalent Sequelize `Op.ne`, `Op.gt`, `Op.like` keys, or TypeORM `Raw()`/`MoreThan()`-style operators reachable via a poorly validated query-string-to-`where`-object mapping layer) to test for authentication bypass or unintended data disclosure
- Prisma/Django ORM edge cases: test `$queryRawUnsafe`/`.extra()`/`.raw()` call sites for string-built input; test Django ORM's `__` lookup-injection surface where user input controls the lookup type itself (e.g., a user-supplied field name reaching `filter(**{user_input: value})`) rather than just the value
- Knex.js raw/identifier injection: test `knex.raw()` string-interpolation points and confirm whether identifier-safe binding (`??`) is actually used for dynamic table/column names versus naive string concatenation
- Dynamic `ORDER BY`/sort-parameter injection: since parameterized queries cannot bind identifiers, test whether user-controlled sort fields are validated against an allow-list or passed through to raw SQL/HQL construction
- Mass-assignment-adjacent operator smuggling: test whether nested/array-style query parameters (`filter[$where]=...`, `filter[$or][]=...`) are parsed into the ORM's native operator objects due to permissive body-parsing middleware
- Blind/time-based confirmation tailored to the abstraction layer: use dialect-appropriate sleep functions reached through the ORM's raw-query path (`pg_sleep()`, `SLEEP()`, `WAITFOR DELAY`) since the ORM itself does not change the underlying engine's capabilities once a raw string reaches it

### Phase 3: Exploitation & Validation
- For confirmed raw-query passthrough sinks, hand off to sqlmap or manual exploitation identical in depth to Agent-044, since once the ORM boundary is broken the underlying engine-level techniques (UNION extraction, stacked queries, `xp_cmdshell`/`COPY PROGRAM`) apply directly — treat this as the escalation path rather than duplicating that testing here
- For operator injection, demonstrate authentication bypass (login endpoint accepting an operator object instead of a password string) or unintended row disclosure (returning all records instead of the intended filtered set) as the primary proof, using a benign, non-destructive read
- For HQL injection, extract a limited data sample via crafted HQL to prove reach beyond the intended entity, and test whether the same input flows into a native-query fallback for full SQL-level impact
- For dynamic-identifier injection (`ORDER BY`, Knex `??` misuse, Django lookup-injection), prove that arbitrary column/table names or lookup operators can be substituted, changing query semantics beyond what the application intends
- Chain any confirmed ORM-boundary break into the same downstream exfiltration and privilege-escalation scenarios documented by Agent-034 and Agent-054 — an operator-injection auth bypass, for instance, should be evaluated for what account/tenant scope it grants access to, not just treated as a standalone finding
- Where source access is available, confirm root cause by pointing to the exact vulnerable call site (raw-query call, unsafe `where`-object construction, unvalidated sort-field pass-through)

### Phase 4: Documentation
- Detailed finding documentation identifying the specific ORM/query-builder call site and abstraction-layer bypass technique
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

## Validation Requirements
✓ Authentic vulnerability reproduction
✓ Real evidence from target system
✓ Reproducible exploitation steps
✓ Complete technical documentation
✓ Verified impact assessment
✓ Proper data organization for downstream agents

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: Network for remote-facing endpoints
- Attack Complexity: Low for direct operator-injection bypass, High where blind/time-based confirmation through the abstraction layer is required
- Privileges Required: usually None for unauthenticated login/filter endpoints
- User Interaction: None
- Scope: Changed when the ORM boundary break reaches raw SQL/HQL execution or cross-tenant data access
- CIA Impacts: High confidentiality where data disclosure or auth bypass is proven; High integrity where write-path operator injection is demonstrated

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
- Exact JSON request body/HQL-triggering payload and the corresponding raw HTTP request/response pair
- ORM-specific error-message excerpts or behavioral diffs confirming the injection point (framework name and version where identifiable)
- Extracted data sample or authentication-bypass proof (session/token obtained via operator injection)
- Source-code call-site reference where source access was available (file/line of the vulnerable raw-query or unsafe filter construction)
- Fuzzing harness output log showing the operator/payload set tested and which succeeded

## Remediation Guidance
- Never pass raw, string-concatenated user input to `.raw()`/`createNativeQuery()`/`$queryRawUnsafe()`/`knex.raw()` — always use the framework's parameter-binding placeholders even inside raw-query escape hatches
- Strictly validate the shape of user input before it reaches ORM filter construction: reject object/array input where a scalar is expected, and reject unknown operator keys via an explicit allow-list
- Allow-list dynamic sort/filter field names and table/column identifiers against a fixed set of application-known values rather than passing user input directly into identifier positions
- For Django, avoid `**{user_input: value}`-style dynamic lookup construction; validate the lookup key against a fixed set of permitted field names
- Add ORM-aware SAST rules (e.g., semgrep patterns for known-dangerous call signatures) to CI to catch raw-query and unsafe filter-construction regressions before merge

## Success Criteria
✓ Specific ORM/query-builder and vulnerable call pattern identified
✓ Abstraction-layer bypass technique confirmed with working PoC
✓ Impact demonstrated (data disclosure, auth bypass, or full SQL/HQL-level access)
✓ Clear distinction drawn from raw SQL injection findings to avoid duplicate reporting
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
