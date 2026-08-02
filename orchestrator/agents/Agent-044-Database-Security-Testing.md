# Agent-044: Database Security Testing

## Overview
Application-layer database security testing focused on SQL and NoSQL injection vulnerabilities arising from unsanitized user input reaching database queries, plus the database-side consequences once injection is confirmed. Unlike direct database-service testing (which targets network exposure and credentials on the engine itself), this agent targets the web/API layer where user input flows into SQL/NoSQL queries — consistently one of the most exploited and highest-impact vulnerability classes in application security, capable of leading to full data breach or complete server compromise via stacked queries and command-execution functions.

## Tools Integrated
- sqlmap - automated SQL injection detection, exploitation, and database takeover (`--dbs`, `--dump`, `--os-shell`, tunable `--level`/`--risk`)
- sqlninja - MSSQL-specific injection exploitation and OS command execution
- NoSQLMap - automated MongoDB/CouchDB injection testing and exploitation
- Burp Suite (Intruder, Scanner) - manual injection-point discovery and payload fuzzing
- mysql / psql / mongosh / sqlcmd CLI clients - manual verification of extracted access and query behavior
- hashcat / John the Ripper - offline cracking of extracted password hashes
- Burp Collaborator / custom OOB listeners - blind and out-of-band SQL injection confirmation

## Testing Approach

### Phase 1: Initial Assessment
- Map all application input points that could reach a database query: URL parameters, form fields, HTTP headers (User-Agent, X-Forwarded-For, Referer), cookies, JSON/XML API bodies, and file-upload metadata
- Identify the backend database technology via error messages, response timing, ORM fingerprints, and driver-specific syntax quirks (`sqlmap --fingerprint`)
- Distinguish SQL from NoSQL data layers (look for MongoDB-style JSON query bodies, GraphQL resolvers backed by a document store)
- Establish baseline application behavior (normal responses, error pages, response times) to later detect deviations caused by injected payloads
- Review any accessible API documentation/schema for parameter types and expected query structure

### Phase 2: Vulnerability Identification
- Error-based injection: submit quote/boolean payloads (`' OR '1'='1`, `" OR "1"="1`) and observe SQL error disclosure or logic changes
- Boolean-blind and time-based blind injection: use conditional true/false payloads and `SLEEP()`/`WAITFOR DELAY`/`pg_sleep()` to confirm injection where no visible output differs
- UNION-based injection: determine column count and data types to enable direct data extraction in the response
- Second-order injection: track payloads stored in one request that execute when reflected in a different, later query or page
- NoSQL operator injection: test `$ne`, `$gt`, `$where`, `$regex` injection in JSON bodies to bypass authentication or extract data (e.g., `{"username":{"$ne":null}}`)
- Stacked-query support check (safe, non-destructive probe) indicating multi-statement execution risk
- WAF/input-filter bypass technique testing (encoding, case manipulation, inline comments) where a filter is detected

### Phase 3: Exploitation & Validation
- Confirm injection with sqlmap against the identified parameter, starting at conservative `--level=1 --risk=1` and escalating only as needed
- Enumerate database metadata (`--dbs`, `--tables`, `--columns`) to map the full accessible schema
- Extract a limited, representative data sample (`--dump` with row limits) from a sensitive table to prove data exposure without exfiltrating the full dataset
- Where privileges allow, escalate to OS command execution (`sqlmap --os-shell`, MSSQL `xp_cmdshell`, PostgreSQL `COPY ... PROGRAM`) to demonstrate full server compromise, using a benign command (`whoami`/`id`) as proof
- For NoSQL, demonstrate authentication bypass via operator injection and, where applicable, use `$where`/server-side JS execution to prove command-execution-equivalent impact
- Chain extracted credentials/hashes (cracked offline) into a login attempt on the application or other in-scope services to demonstrate downstream account takeover

### Phase 4: Documentation
- Detailed finding documentation
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
- Attack Vector: typically Network for remote-facing injection points
- Attack Complexity: Low for straightforward injection, High where WAF bypass/blind timing is required
- Privileges Required: usually None for unauthenticated endpoints
- User Interaction: None
- Scope: Changed when injection crosses into OS command execution or full database compromise
- CIA Impacts: High confidentiality/integrity where data extraction or modification is demonstrated

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
- Exact injected payload and full HTTP request/response pair showing the vulnerable behavior
- sqlmap/NoSQLMap tool output logs showing the detection technique and confidence level
- Extracted schema listing (databases/tables/columns) and a redacted sample of dumped data
- Command-execution proof where OS-shell/xp_cmdshell/COPY PROGRAM escalation was achieved
- Screenshots of authentication bypass (NoSQL operator injection) showing unauthorized access granted

## Remediation Guidance
- Use parameterized queries/prepared statements exclusively; never concatenate user input into query strings
- Apply strict input validation and type enforcement at the API boundary, rejecting unexpected operators in JSON bodies (NoSQL)
- Enforce least-privilege database accounts per application function; remove access to dangerous stored procedures (`xp_cmdshell`, `COPY PROGRAM`) for application service accounts
- Disable detailed database error messages in production responses to remove fingerprinting/error-based injection feedback
- Deploy a Web Application Firewall as defense-in-depth (not a substitute for fixing the root cause) and enable database activity monitoring/alerting
- Add automated SAST/DAST injection testing to the CI/CD pipeline to catch regressions before deployment

## Success Criteria
✓ Injection vulnerability confirmed
✓ Database structure enumerated
✓ Data successfully extracted
✓ Clear exploitation proof
✓ Working code examples provided

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
