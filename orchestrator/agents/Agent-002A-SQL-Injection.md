# Agent: SQL Injection Testing

## Overview
Deep-dive testing for SQL injection across error-based, UNION-based, boolean-blind, time-based blind, and out-of-band (OOB) techniques, plus second-order injection where a payload stored via one feature triggers in a different query later. Targets classic form/query parameters as well as JSON/XML API bodies, REST path segments, GraphQL variables, and HTTP headers that reach a query (X-Forwarded-For, User-Agent, Cookie). Real-world impact ranges from full database exfiltration and authentication bypass to operating-system command execution via database-specific stacked-query features (xp_cmdshell, INTO OUTFILE, COPY ... FROM PROGRAM).

## Tools Integrated
- sqlmap (tuned with --risk/--level, DBMS-specific tamper scripts for WAF/filter bypass)
- Burp Suite (Repeater for manual differential testing, Intruder for payload sweeps, Collaborator for OOB exfiltration)
- ghauri (fast blind/time-based injection engine as a sqlmap alternative for confirmation)
- jSQL Injection (GUI-driven confirmation and dumping)
- wafw00f (WAF fingerprinting to select tamper/encoding strategy before automated tooling)
- Custom Python (requests) scripts for precise timing-oracle measurement on blind findings

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every reachable injection surface: URL/GET params, POST body fields, JSON/XML API fields, cookies, custom headers, REST path segments, GraphQL query variables
- Fingerprint the database backend and version via banner leakage, error message wording, or DBMS-specific behavior (version(), @@version, banner())
- Detect WAF/filtering (wafw00f, response behavior on baseline probes) to choose appropriate tamper scripts and encoding before running noisy automated scans
- Map which parameters are reflected in error messages vs silently swallowed, informing whether error-based techniques are viable

### Phase 2: Vulnerability Identification
- Baseline probe with single/double quotes, backticks, and comment sequences (`'`, `"`, `` ` ``, `--`, `#`) and compare response diffs for SQL syntax error signatures
- Boolean-based blind: send paired `AND 1=1` / `AND 1=2` (or backend equivalents) and compare response length/content/status for a true/false differential
- Time-based blind: inject `SLEEP()`, `WAITFOR DELAY`, `pg_sleep()` and measure response latency deltas to establish a reliable timing oracle
- Error-based: use `extractvalue()`/`updatexml()` (MySQL), `CONVERT()` (MSSQL), or cast errors to leak data directly in error output
- UNION-based: determine column count via `ORDER BY` increment or `UNION SELECT NULL,NULL...`, then substitute known-type markers to map extractable columns
- Out-of-band: trigger DNS/HTTP callbacks via Collaborator/dnslog-style payloads where in-band/error channels are filtered or the DB supports OOB functions
- Second-order: inject in one feature (profile field, order note) and trigger the vulnerable query later in an unrelated feature (admin report, search) to catch stored injection

### Phase 3: Exploitation & Validation
- Run sqlmap with `--batch --risk=3 --level=5 --technique=BEUSTQ` against confirmed injectable parameters, tuning `--dbms` once fingerprinted
- Dump high-value tables (credential stores, session tables, PII) as PoC evidence, minimizing volume to what's needed to prove impact
- Attempt privileged execution paths where the DB account allows it: `xp_cmdshell` (MSSQL), `INTO OUTFILE` + web shell drop (MySQL with FILE privilege and writable web root), `COPY ... FROM PROGRAM` (PostgreSQL with superuser)
- Escalate from DB command execution to OS-level access, and pivot using any harvested application credentials against other in-scope services
- Re-confirm each exploitation path with a clean re-run to rule out scanner false positives

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector typically Network; Attack Complexity Low for straightforward injection, High for blind/OOB requiring specific conditions
- Privileges Required varies with whether the injectable endpoint is pre- or post-authentication
- Scope often Changed when database compromise enables OS command execution beyond the vulnerable component
- Confidentiality/Integrity impact typically High given direct data-layer access; Availability High where DoS-capable payloads are confirmed

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
- sqlmap/ghauri session logs and `--dump` output showing extracted schema/data
- Raw HTTP request/response pairs demonstrating the boolean or time-based differential
- Database banner/version extraction proof
- Sample of extracted rows (redacted to what's necessary to prove impact)
- Out-of-band interaction log (Collaborator/dnslog) for blind/OOB confirmations

## Remediation Guidance
- Use parameterized queries/prepared statements exclusively — never build SQL via string concatenation with user input
- Adopt ORM/query-builder APIs that bind parameters by default, reserving raw SQL for reviewed, parameterized exceptions
- Allow-list (not blacklist) any user input that must control identifiers, table names, or ORDER BY clauses, since these can't be parameterized normally
- Apply least-privilege database accounts per application component — disable dangerous features (xp_cmdshell, FILE privilege, PROGRAM execution) on accounts used by web-facing code
- Treat WAF/input-filtering as defense-in-depth only; it is not a substitute for parameterized queries

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, parameter map from Agent-002 recon, previous agent findings
**Output:** Validated SQL injection findings with evidence
**Feeds:** Downstream agents and final penetration test report
