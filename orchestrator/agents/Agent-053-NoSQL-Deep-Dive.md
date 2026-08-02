# Agent-053-NoSQL-Deep-Dive: NoSQL Engine-Specific Injection & Misconfiguration Testing

## Overview
Deep, engine-specific offensive testing for MongoDB, Redis, Elasticsearch, and Cassandra that goes well beyond the generic "NoSQL operator injection" checks covered at the application layer by Agent-044 and the generic service-exposure checks covered by Agent-012C. Each of these engines has its own query language, wire protocol, and dangerous built-in feature set — MongoDB aggregation-pipeline and `$where` JavaScript execution, Redis's command set doubling as a scripting and file-write primitive, Elasticsearch's REST API exposing entire indices with no default authentication in many deployments, and Cassandra's CQL and Thrift interfaces accepting string-built queries from application code. Because these systems increasingly sit behind API gateways and microservices rather than a classic DBA-managed perimeter, misconfigurations here are routinely internet-reachable and lead directly to mass data exposure, unauthenticated RCE, or full cluster takeover. This agent's job is to fingerprint the exact engine and version, apply engine-native attack techniques, and prove impact through the specific dangerous feature each engine exposes.

## Tools Integrated
- NoSQLMap - automated MongoDB/CouchDB enumeration, injection, and exploitation scripting
- nmap NSE scripts (`mongodb-info`, `mongodb-databases`, `redis-info`, `cassandra-brute`) - engine fingerprinting and unauthenticated enumeration
- redis-cli - manual unauthenticated command execution, `CONFIG GET/SET`, `SLAVEOF`/`REPLICAOF` abuse, Lua `EVAL` scripting probes
- elasticsearch-py / raw `curl` against the REST API - index enumeration, `_search`, `_cat/indices`, `_scripts` stored-script abuse
- cqlsh / DataStax driver via Python (`cassandra-driver`) - authenticated and unauthenticated CQL session testing
- hydra / medusa (`mongodb`, `redis`, `cassandra` modules) - credential brute forcing against exposed engines
- Custom Python scripts using `pymongo` - automated `$where`/aggregation-pipeline injection fuzzing, BSON type-confusion payload generation, and unauthenticated `listDatabases`/`listCollections` enumeration
- Custom Python scripts using `redis-py` - scripted `CONFIG SET dir`/`CONFIG SET dbfilename` + `SET`/`SAVE` webshell or SSH-key write chains, `MODULE LIST`/`MODULE LOAD` probing, keyspace enumeration via `SCAN` (avoiding blocking `KEYS *` on production instances)
- Custom Python scripts against the Elasticsearch/OpenSearch REST API (`requests`/`elasticsearch-py`) - unauthenticated index discovery, mapping dumps, and stored-script RCE probing (`_scripts`, deprecated dynamic-scripting engines)
- Metasploit auxiliary modules (`mongodb_login`, `redis_command_execution`) - scripted exploitation of known engine misconfigurations

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint exact engine, version, and build flavor (MongoDB Community/Atlas-local, Redis OSS/Enterprise, Elasticsearch/OpenSearch fork, Cassandra/Scylla) via banner grab, wire-protocol handshake, and version-specific API responses
- Enumerate exposed ports and interfaces per engine: MongoDB 27017/27018/27019, Redis 6379/16379 (cluster bus), Elasticsearch/OpenSearch 9200/9300, Cassandra 9042 (CQL)/7000/7001 (gossip)/9160 (Thrift)
- Attempt unauthenticated connection first for every engine — confirm whether `--auth`/`requirepass`/`xpack.security.enabled`/`authenticator` is actually enforced rather than assumed
- Enumerate cluster topology exposure (MongoDB `replSetGetStatus`, Elasticsearch `_cluster/health` and `_nodes`, Cassandra `nodetool`-equivalent gossip info) to map the full cluster footprint from one exposed node
- Identify any REST/HTTP management surfaces layered on top (Mongo Express, RedisInsight, Kibana dev tools, Cassandra Reaper) that may expose engine access with weaker controls than the native port

### Phase 2: Vulnerability Identification
- MongoDB operator/pipeline injection: fuzz JSON bodies for `$where`, `$function`, `$expr`, `$regex` ReDoS, and aggregation `$lookup`/`$graphLookup` injection that reaches across collections the application never intended to expose
- MongoDB server-side JS: test whether `db.eval()`/`$where`/`mapReduce` JavaScript execution is enabled, which can be escalated to host command execution on older/misconfigured deployments
- Redis unauthenticated command execution: confirm `PING`/`INFO`/`CONFIG GET *` succeed with no `AUTH`; test `EVAL`/`EVALSHA` Lua sandbox escape and `FUNCTION LOAD` on Redis 7.x
- Redis RCE-via-config chain: probe `CONFIG SET dir` and `CONFIG SET dbfilename` writability to determine if an attacker can write a cron file, authorized_keys entry, or webshell via `SAVE`/`BGSAVE`
- Elasticsearch open-index exposure: enumerate all indices via `_cat/indices?v` and `_search` without credentials; check for PII/credentials/logs sitting in default-open indices; test deprecated dynamic scripting (`inline`/`groovy` scripting on old versions) for RCE
- Elasticsearch API abuse: test `_snapshot` repository registration to an attacker-controlled path/bucket as a data-exfiltration or backdoor-persistence vector
- Cassandra CQL injection: identify application code building CQL via string concatenation (`SELECT * FROM users WHERE name = '` + input); test batch-statement and `ALLOW FILTERING` injection to bypass intended query scoping
- Cassandra auth bypass: test default `cassandra`/`cassandra` credentials and anonymous Thrift/CQL access; check whether `PasswordAuthenticator` is actually configured versus `AllowAllAuthenticator`

### Phase 3: Exploitation & Validation
- MongoDB: chain confirmed `$where`/`mapReduce` JS execution into host command execution PoC (benign command such as `id`/`whoami` via `run_program`/legacy exec paths) where the deployment allows it; otherwise demonstrate full unauthenticated collection dump as the impact ceiling
- Redis: execute the `CONFIG SET dir`/`dbfilename` + `SET`/`SAVE` chain end-to-end in a reversible way (write a uniquely-named benign marker file to a scratch path) to prove file-write-to-RCE, then remove the artifact
- Elasticsearch: pull a redacted sample from an open index to prove data exposure; if dynamic scripting is enabled, execute a benign script (`ctx._source` no-op or `System.getProperty` read) to prove code-execution reach without altering data
- Cassandra: prove CQL injection by extracting rows outside the intended query scope (e.g., another tenant's keyspace/table) using a crafted `ALLOW FILTERING`/`UNION`-equivalent technique appropriate to CQL
- Chain findings into higher-impact scenarios documented by Agent-034 (data exfiltration pathways): treat any confirmed unauthenticated read as a candidate for the full exfiltration chain, and any confirmed RCE/config-write as a candidate for lateral movement into the host OS and adjacent services
- Where credentials are recovered (Redis `CONFIG GET requirepass` misconfig, Cassandra system tables), test reuse against other in-scope services per Agent-024/credential-reuse findings

### Phase 4: Documentation
- Detailed finding documentation per engine (MongoDB/Redis/Elasticsearch/Cassandra) with exact commands/queries used
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
- Attack Vector: typically Network for internet/intranet-reachable engine ports
- Attack Complexity: Low for unauthenticated-by-default findings, High where scripting-engine sandbox escape is required
- Privileges Required: None for unauthenticated access, Low where default credentials were used
- User Interaction: None
- Scope: Changed when engine access escalates to host command execution
- CIA Impacts: High confidentiality where full index/collection/keyspace dumps are demonstrated; High integrity/availability where write-based RCE or `FLUSHALL`-class destructive commands are proven reachable

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
  "owasp_category": "A05:2021 - Security Misconfiguration",
  "cwe_id": "CWE-943",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Full command/query transcripts per engine (redis-cli session log, mongosh/pymongo session output, raw Elasticsearch REST requests, cqlsh session) showing the exploited behavior
- Redacted data samples proving unauthenticated read access to a collection/index/keyspace
- Configuration dumps (`CONFIG GET *`, `_cluster/settings`, `describe cluster`) showing the absence or weakness of authentication/authorization controls
- Proof-of-write artifact evidence for Redis config-write RCE chains, captured before cleanup
- Cluster topology output showing the blast radius reachable from a single exposed node

## Remediation Guidance
- Enable and enforce native authentication on every engine (MongoDB `--auth`/SCRAM, Redis `requirepass`/ACLs, Elasticsearch/OpenSearch security plugin, Cassandra `PasswordAuthenticator` + `CassandraAuthorizer`)
- Disable dangerous scripting features by default (MongoDB server-side JS/`$where`/`mapReduce`, Elasticsearch dynamic/inline scripting, Redis `FUNCTION`/`EVAL` restricted via ACL categories) unless explicitly required and access-scoped
- Restrict `CONFIG SET`/administrative commands via Redis ACLs (`--no-CONFIG`, disable `SAVE`/`BGSAVE`/`MODULE` for application-facing users) to remove the file-write-to-RCE chain
- Bind all engines to internal/management network segments only; never expose native database ports directly to the public internet
- Apply least-privilege, per-tenant role scoping (MongoDB role-based access control, Elasticsearch index-level security, Cassandra keyspace-level permissions) instead of shared superuser/root accounts

## Success Criteria
✓ Engine and version accurately fingerprinted
✓ Engine-specific vulnerability class confirmed with working PoC
✓ Impact demonstrated at the appropriate ceiling (data read, config write, or RCE) without unauthorized destructive action
✓ Clear exploitation proof with reversible artifacts only
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
