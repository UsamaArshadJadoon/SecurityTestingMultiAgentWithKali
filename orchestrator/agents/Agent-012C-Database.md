# Agent-012C-Database: Database

## Overview
Direct network-level testing of database engines (MySQL, PostgreSQL, MSSQL, Oracle, MongoDB, Redis, Elasticsearch) that are reachable over the network — this is engine and service exposure testing, distinct from application-layer SQL/NoSQL injection. Databases directly reachable from untrusted networks with weak or default credentials, or with no authentication at all, represent a direct path to full data compromise, ransomware staging, or remote code execution via engine-specific features such as `xp_cmdshell`, `COPY ... PROGRAM`, MongoDB server-side JavaScript, or Redis `MODULE LOAD`. Misconfigured database exposure is one of the most common root causes of large-scale breaches disclosed publicly.

## Tools Integrated
- nmap (ms-sql-info, mysql-info, mongodb-info, redis-info NSE scripts) - service and version fingerprinting
- native clients (mysql, psql, sqlcmd/mssql-cli, sqlplus, mongosh, redis-cli) - direct authenticated/unauthenticated interaction
- Metasploit auxiliary modules (mssql_login, mysql_login, postgres_login, mongodb_login) - per-engine credential brute force
- hydra / medusa (mysql, mssql, postgres, mongodb modules) - credential brute forcing
- NoSQLMap - MongoDB/CouchDB specific enumeration and attack automation
- redis-cli - unauthenticated access testing and `CONFIG SET` abuse for webshell/SSH-key write RCE chains
- CrackMapExec / NetExec (mssql module) - domain-credential validation against MSSQL and `xp_cmdshell` execution
- impacket-mssqlclient - Windows-auth MSSQL access and command execution chains
- odat.py / tnscmd10g - Oracle TNS listener enumeration and exploitation

## Testing Approach

### Phase 1: Initial Assessment
- Discover standard and non-standard database ports (3306, 5432, 1433, 1521, 27017, 6379, 9200, 5984)
- Fingerprint version/build via native protocol handshake or NSE scripts to identify unpatched engine versions
- Attempt an unauthenticated connection first — many engines/deployments ship no-auth-by-default (Redis, older MongoDB, Elasticsearch)
- Enumerate exposed management/admin interfaces (Adminer, phpMyAdmin, RedisInsight, Mongo Express) alongside the raw engine port
- Check for transport encryption on the database wire protocol

### Phase 2: Vulnerability Identification
- Default/weak credential testing per engine (`sa`/blank, `root`/`root`, `postgres`/`postgres`) via targeted brute force respecting lockout policy
- Anonymous/no-auth access: connect without credentials and attempt to list databases/collections/keys (`SHOW DATABASES`, `db.adminCommand({listDatabases:1})`, `KEYS *`)
- Excessive privilege check: authenticated low-privilege accounts able to read/write across all databases instead of scoped access
- Dangerous feature enablement: `xp_cmdshell` availability on MSSQL, `COPY ... PROGRAM` on PostgreSQL, server-side JavaScript execution on MongoDB, Redis `MODULE LOAD` or `CONFIG SET dir`/`dbfilename` webshell write path
- Sensitive data exposure at rest without encryption — check for cleartext PII/credentials in reachable tables/collections
- Backup/snapshot exposure (world-readable `.bak` files, mongodump artifacts, RDB/AOF files reachable over the network)

### Phase 3: Exploitation & Validation
- Demonstrate unauthenticated data access by pulling a representative, non-destructive sample from a sensitive table/collection as evidence, then stop
- Chain default-credential access into a privilege check, then into an engine-specific command execution PoC (e.g., enable and invoke `xp_cmdshell 'whoami'` on MSSQL, or use Redis `CONFIG SET dir`/`CONFIG SET dbfilename` plus module/key write to prove an RCE path) in a controlled, reversible manner
- For internet-reachable MongoDB/Redis, demonstrate the full chain from network reachability to data read to (only if explicitly authorized) write, illustrating ransomware/data-wipe risk
- Confirm whether compromised database credentials are reused elsewhere, chaining into credential-reuse findings from other agents
- Confirm privilege escalation from a low-privilege database account to OS-level command execution where dangerous features are enabled

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
- Connection transcripts (client commands and engine responses) proving unauthenticated/default-credential access
- Sample data extract demonstrating sensitive data exposure (redacted/minimized per scope rules)
- Proof of dangerous-feature exploitation (e.g., command output from xp_cmdshell/COPY PROGRAM/module load)
- Configuration dump showing bind-address, authentication settings, and privilege grants
- Network scan output confirming external/internal reachability of the database port

## Remediation Guidance
- Bind database services to localhost/internal management networks only; remove public exposure
- Enforce strong, unique credentials per engine and disable default accounts (`sa`, `root` with blank password)
- Disable dangerous features by default (`xp_cmdshell`, `COPY PROGRAM`, server-side JS eval) unless explicitly required and access-controlled
- Enforce authentication on all engines (Redis `requirepass`/ACLs, MongoDB auth enabled) and enable TLS for wire traffic
- Apply least-privilege database roles/grants per application; eliminate shared superuser accounts
- Patch to the current stable release and monitor for CVEs affecting the identified engine version

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
