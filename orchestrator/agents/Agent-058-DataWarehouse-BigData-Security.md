# Agent-058-DataWarehouse-BigData-Security: Data Warehouse & Big Data Platform Security Testing

## Overview
Security testing for analytics-scale data platforms — Snowflake, BigQuery, Redshift, and Databricks, alongside self-managed Hadoop/Spark clusters — a category with a fundamentally different risk profile from transactional databases because these systems are purpose-built to make large volumes of data easy to share, query, and export across teams and organizations. Role-based access control misconfiguration here tends to be broader in blast radius than a typical OLTP database, since a single over-granted warehouse role can expose an entire organization's analytics data lake rather than one application's tables. Data-sharing and external-table features (Snowflake Secure Data Sharing, BigQuery authorized views/datasets shared externally, Redshift datashares, Databricks Unity Catalog external locations) are convenient exfiltration and unintended-exposure vectors precisely because they are designed to move data across trust boundaries. Cluster management interfaces (Hadoop NameNode/ResourceManager UIs, Spark master/worker UIs, unauthenticated YARN REST APIs) are a long-standing and still-common source of unauthenticated remote code execution. This agent targets these platform-specific risks and the query-export features that turn a read-only analytics role into a full data-exfiltration channel.

## Tools Integrated
- Snowflake Python connector (`snowflake-connector-python`) - scripted role/grant enumeration (`SHOW GRANTS TO ROLE`, `SHOW SHARES`) and query-history review for exfiltration-pattern detection
- Custom Python scripts using `google-cloud-bigquery` - dataset/table IAM-binding enumeration, authorized-view cross-project exposure checks, and `INFORMATION_SCHEMA` audit-log review for large/unusual export jobs
- Custom Python scripts using `boto3` (Redshift/Redshift Data API) - datashare enumeration, cluster public-accessibility checks, and `UNLOAD`-privilege audit for roles capable of exporting data to external storage
- Databricks REST API via `requests`/`databricks-sdk` - Unity Catalog external-location and storage-credential enumeration, cluster-policy review, and workspace-admin/permission audit
- nmap NSE scripts plus manual HTTP probing - unauthenticated exposure checks for Hadoop NameNode UI (50070/9870), ResourceManager UI (8088), YARN REST API, and Spark master/worker UI (8080/8081/4040)
- Custom Python scripts using `requests` - automated YARN REST API abuse testing (`POST /ws/v1/cluster/apps/new-application` followed by application submission) to confirm unauthenticated job-submission RCE on exposed ResourceManager instances
- hdfs CLI / WebHDFS REST API - unauthenticated read/write testing against exposed HDFS NameNode instances
- Metasploit auxiliary/exploit modules (`hadoop_jobtracker_security_bypass`, Spark unauthenticated RCE modules where applicable) - scripted exploitation of known unauthenticated cluster-management RCE paths
- Custom Python scripts correlating query-history/audit-log exports (Snowflake `QUERY_HISTORY`, BigQuery audit logs, Redshift `STL_QUERY`/`SVL_S3LOG`) - detecting large or anomalous `COPY`/`UNLOAD`/`EXPORT DATA` operations indicative of exfiltration via legitimate export features

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate warehouse/platform accounts, roles, and workspace structure (Snowflake account/database/schema hierarchy, BigQuery project/dataset structure, Redshift cluster/database structure, Databricks workspace/Unity Catalog metastore)
- Identify all configured data-sharing and external-access constructs: Snowflake shares, BigQuery authorized views and dataset-level IAM bindings granted to external principals, Redshift datashares, Databricks external locations and Delta Sharing configurations
- Enumerate cluster management interfaces reachable on the network for any self-managed Hadoop/Spark deployment in scope, distinguishing internet-reachable from internal-only exposure
- Map which roles/service accounts hold export-capable privileges (`COPY INTO`/`UNLOAD`/`EXPORT DATA OPTIONS`/`bq extract`) versus read-only query privileges
- Review query-history/audit-log retention and coverage to establish whether export activity is actually logged and for how long

### Phase 2: Vulnerability Identification
- RBAC over-grant: identify roles with account-/organization-wide `SELECT` or equivalent across all schemas/datasets rather than scoped to the specific datasets a team's function requires (e.g., a marketing-analytics role able to query finance or HR datasets)
- Public/external data sharing exposure: identify Snowflake shares, BigQuery datasets, or Redshift datashares configured with `allAuthenticatedUsers`/broad external-account access, or authorized views exposing underlying row-level data beyond the intended aggregate
- External-table/storage misconfiguration: identify external tables/storage credentials (Databricks Unity Catalog external locations, Redshift Spectrum external schemas, BigQuery external tables over cloud storage) pointing at buckets/containers with overly permissive access policies, allowing direct data access that bypasses the warehouse's own RBAC entirely
- Cluster management-interface exposure: confirm whether Hadoop NameNode/ResourceManager UIs, YARN REST APIs, or Spark master/worker UIs are reachable without authentication, and whether job submission or HDFS read/write is possible from an unauthenticated or unauthorized network position
- Query-export exfiltration channel: test whether a standard analyst-level role can invoke `COPY INTO <external stage>`, `UNLOAD`, or `EXPORT DATA` to move large datasets to attacker-reachable external storage (a location the tester controls, within scope) without triggering any alert or additional authorization step
- Notebook/cluster-policy gaps (Databricks/Spark): check whether cluster policies allow attaching arbitrary init scripts or unrestricted library installation, which can be abused to reach the underlying cloud credentials/instance-metadata service from a notebook session
- Audit-log gap analysis: confirm whether large export/`UNLOAD`/`COPY` operations are actually captured in the platform's audit log at a level of detail sufficient for post-incident investigation (source role, destination, row/byte count)

### Phase 3: Exploitation & Validation
- Demonstrate RBAC over-grant impact by authenticating with an intentionally lower-privileged test role/service account and querying data outside its intended scope, using a minimal non-destructive read as proof
- Demonstrate data-sharing exposure by accessing a share/authorized view/datashare from an external or unintended principal's credentials (where explicitly authorized) and confirming row-level (not just aggregate) data is reachable
- Demonstrate external-table bypass by accessing the underlying cloud storage location directly (bypassing the warehouse's SQL-layer RBAC entirely) using the storage credential/permissions discovered, proving that warehouse-level access controls provide a false sense of security
- Where a cluster management interface is unauthenticated, submit a benign YARN application or Spark job (e.g., a job that runs `whoami`/`id` and writes output to a scratch location) to prove full unauthenticated code-execution reach on the cluster, then clean up the submitted application
- Demonstrate the query-export exfiltration channel end-to-end: use a standard analyst role's `COPY`/`UNLOAD`/`EXPORT DATA` privilege to move a small, representative, redacted sample of sensitive data to a tester-controlled external location, proving the channel functions as a full data-exfiltration path — this directly extends the exfiltration-chain scenarios documented by Agent-034 into the data-warehouse layer
- Cross-reference any exposed cluster credentials or storage keys recovered here against cloud-account privilege-escalation potential (e.g., Spark-notebook access to instance metadata revealing broader cloud IAM credentials), flagging for follow-up against cloud-posture agents

### Phase 4: Documentation
- Detailed finding documentation covering the specific platform (Snowflake/BigQuery/Redshift/Databricks/Hadoop/Spark), the RBAC or sharing construct involved, and exact commands/API calls used
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
- Attack Vector: Network for exposed cluster-management interfaces and reachable external storage, Adjacent/Local for RBAC-escalation findings requiring an existing platform account
- Attack Complexity: Low for unauthenticated cluster-UI/YARN RCE, Medium/High for chained external-table-bypass or export-channel exfiltration scenarios
- Privileges Required: None for unauthenticated cluster-management findings, Low for standard-analyst-role export-channel abuse
- User Interaction: None
- Scope: Changed when a warehouse-level RBAC bypass reaches underlying cloud storage directly, or when cluster job submission reaches host-level code execution
- CIA Impacts: High confidentiality for data-sharing/export-channel findings; High integrity/availability for unauthenticated cluster job-submission findings

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
  "owasp_category": "A01:2021 - Broken Access Control",
  "cwe_id": "CWE-284",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Role/grant enumeration output (`SHOW GRANTS`, IAM dataset bindings, Unity Catalog permission listings) showing the over-privileged access path
- Data-sharing/external-table configuration export showing the exposed share, authorized view, or storage credential
- Proof of direct external-storage access bypassing warehouse-level RBAC, with a redacted sample of accessed data
- Cluster-management-interface screenshots/API responses showing unauthenticated reachability, plus job-submission output proving code-execution reach
- Query-history/audit-log excerpts showing the export operation used for the exfiltration-channel proof, and whether it was logged with sufficient detail

## Remediation Guidance
- Scope warehouse roles to the minimum schema/dataset access required per team/function; eliminate account-wide or organization-wide `SELECT`-equivalent grants
- Restrict data-sharing constructs (Snowflake shares, BigQuery dataset IAM, Redshift datashares, Delta Sharing) to explicitly named, reviewed external principals; disable any `allAuthenticatedUsers`/broad-audience sharing
- Ensure external-table/storage-credential permissions mirror the intended warehouse-level RBAC rather than granting broader direct storage access that bypasses it
- Require authentication on all cluster management interfaces (NameNode/ResourceManager UI, YARN REST API, Spark master/worker UI) and restrict them to an internal management network only
- Enable and monitor detailed audit logging for export operations (`COPY`/`UNLOAD`/`EXPORT DATA`), with alerting on unusually large or off-hours export volume, and apply data-loss-prevention controls on export destinations where feasible

## Success Criteria
✓ Platform-specific RBAC, sharing, or cluster-exposure vulnerability reproduced with real evidence
✓ Export/exfiltration channel demonstrated end-to-end using a representative, redacted sample
✓ Unauthenticated cluster-management RCE (where present) proven with a benign, cleaned-up job submission
✓ Findings clearly tied to the analytics/big-data platform layer rather than duplicating generic cloud or engine-level findings
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
