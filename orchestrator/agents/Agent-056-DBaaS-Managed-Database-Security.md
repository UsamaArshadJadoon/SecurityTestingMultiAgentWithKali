# Agent-056-DBaaS-Managed-Database-Security: Managed Database Service (DBaaS) Configuration Security Review

## Overview
API-level and control-plane security review of managed database offerings — AWS RDS/Aurora, Azure SQL Database/Cosmos DB, GCP Cloud SQL/Firestore, and MongoDB Atlas — targeting misconfigurations that exist specifically because a cloud provider manages the underlying infrastructure. This is distinct from generic cloud-provider security agents, which assess IAM, storage, and compute posture broadly but do not go deep on database-service-specific settings, and distinct from Agent-012C/Agent-044, which test the engine and query layer rather than the managed control plane. A single misconfigured "publicly accessible" flag on an RDS instance or an open Cosmos DB firewall rule can expose an entire production database to the internet despite every application-layer control being sound, and these settings are configured through cloud APIs/consoles rather than database credentials — meaning traditional database testing tools never see them. This agent uses each provider's own SDK and CLI to audit network exposure, identity-based database authentication, encryption-at-rest configuration, and backup/snapshot exposure at the service-configuration level.

## Tools Integrated
- AWS CLI (`aws rds describe-db-instances`, `describe-db-clusters`, `describe-db-snapshots`) - RDS/Aurora configuration and public-accessibility enumeration
- Custom Python scripts using `boto3` - automated audit of `PubliclyAccessible`, `StorageEncrypted`, `IAMDatabaseAuthenticationEnabled`, security-group ingress rules, and snapshot/backup ACLs across all RDS/Aurora instances in an account
- Azure CLI (`az sql server show`, `az cosmosdb show`, `az sql db show-connection-string`) - Azure SQL/Cosmos DB firewall, TLS-minimum-version, and public-network-access configuration review
- Custom Python scripts using `azure-mgmt-sql` / `azure-mgmt-cosmosdb` - scripted enumeration of firewall rule sets (checking for `0.0.0.0-255.255.255.255` allow-all rules), Azure AD authentication enforcement, and Cosmos DB key-rotation status
- GCP CLI (`gcloud sql instances describe`, `gcloud firestore databases describe`) - Cloud SQL authorized-networks and Firestore security-rules review
- Custom Python scripts using `google-cloud-sql` / `google-cloud-firestore` admin SDKs - automated check of `requireSsl`, authorized network CIDR breadth, IAM database authentication (Cloud SQL IAM auth), and Firestore security-rule permissiveness
- MongoDB Atlas Administration API via `requests`/official Atlas Python SDK - project-level IP access-list review, database-user privilege scope, and encryption-at-rest (customer-managed KMS) configuration audit
- ScoutSuite / Prowler (database-specific rule sets) - baseline automated misconfiguration scanning across AWS/Azure/GCP as a first-pass triage before targeted manual/API review
- nmap - confirming actual network reachability of any instance flagged as "publicly accessible" by the API, to validate the control-plane setting against real-world exposure

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every managed database instance/cluster/serverless database in scope across the relevant cloud accounts using each provider's list/describe API
- For each instance, pull its network configuration: public-accessibility flag, VPC/subnet placement, security-group/firewall/authorized-network rules, and private-endpoint/private-link usage
- Identify the authentication model in use: native database credentials only, versus IAM-database-authentication/Azure AD/Cloud SQL IAM auth integration
- Pull encryption configuration: encryption-at-rest enabled/disabled, KMS/CMK key used (provider-managed vs. customer-managed), and minimum TLS version enforced for in-transit connections
- Enumerate automated backup/snapshot configuration: retention window, encryption status, and any manually shared or public snapshots/backups

### Phase 2: Vulnerability Identification
- Public accessibility: flag any instance with `PubliclyAccessible=true` (RDS/Aurora), a Cosmos DB/Cloud SQL firewall rule spanning an overly broad CIDR (including `0.0.0.0/0`), or an Atlas IP access list containing `0.0.0.0/0`
- Validate the flag against reality: attempt an actual network connection from outside the cloud account's private network to confirm the instance is truly reachable, not just flagged
- IAM-database-auth gaps: identify instances where IAM/Azure AD/Cloud SQL IAM authentication is available but not enforced, leaving long-lived static database passwords as the only authentication path (removing MFA, conditional access, and centralized credential rotation benefits)
- Encryption-at-rest gaps: identify instances with encryption disabled entirely, or using provider-managed keys where policy requires customer-managed KMS keys with defined rotation
- In-transit encryption gaps: identify instances not enforcing TLS/SSL for client connections (`rds.force_ssl` off, Cosmos DB/Cloud SQL allowing non-SSL connections)
- Automated-backup exposure: identify manually shared snapshots (RDS snapshot shared with another AWS account or "public"), backup storage buckets with overly permissive access policies, or Atlas cloud-backup access not scoped to authorized project members
- Database-user/API-key scope in DBaaS control planes: review Atlas database-user and API-key privilege scope for over-broad project/organization-level access instead of per-cluster least privilege
- Default/weak master credentials: check whether the DBaaS-generated or admin-set master password meets complexity requirements and has been rotated since provisioning

### Phase 3: Exploitation & Validation
- Where an instance is confirmed both API-flagged and network-reachable as public, attempt an authenticated connection using any credentials obtained through other in-scope findings (e.g., leaked credentials from Agent-024, or defaults) to prove the exposure is exploitable, not just theoretical
- For IAM-auth gaps, demonstrate that the static database password path remains fully functional even where IAM auth is configured, proving the weaker path is not actually disabled
- For shared/public snapshot findings, demonstrate (where explicitly authorized) that a snapshot/backup can be restored or accessed from an unauthorized account/project to prove real data exposure, using a minimal non-destructive verification and then reverting/removing any test resources created
- For Atlas/Cosmos DB/Cloud SQL API-key or database-user over-scoping, demonstrate the actual reachable scope by authenticating with the discovered credential and enumerating databases/collections beyond the intended single-application scope
- Chain a confirmed public + weakly-authenticated DBaaS instance into the full data-exfiltration scenario documented by Agent-034, and flag any recovered master credentials for cross-service credential-reuse testing
- Where encryption-at-rest is disabled or using a weak key-management posture, hand off to Agent-057 for the deeper key-management-specific validation rather than duplicating that testing here

### Phase 4: Documentation
- Detailed finding documentation including cloud account/project identifiers (generic placeholders only), instance identifiers, and the exact API call/response demonstrating the misconfiguration
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
- Attack Vector: Network for confirmed publicly reachable instances
- Attack Complexity: Low where public access plus weak/default credentials are combined, High where exploitation requires chaining a separately-obtained credential
- Privileges Required: None for unauthenticated public exposure findings, Low where valid but over-scoped credentials are used
- User Interaction: None
- Scope: Changed where a single over-scoped API key/database user grants access across multiple databases/projects
- CIA Impacts: High confidentiality for confirmed public+credentialed data access; Medium/High integrity and availability for backup/snapshot exposure findings

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
  "cwe_id": "CWE-284",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Full API response payloads (`describe-db-instances`, `az cosmosdb show`, Atlas Admin API cluster/project responses) showing the exact misconfigured setting
- Network-reachability proof (nmap/connection attempt output) confirming a flagged-public instance is genuinely reachable from outside the trust boundary
- Authenticated-access proof showing data reachable through the exposed instance, redacted per scope rules
- Snapshot/backup sharing configuration export showing unauthorized account/project access
- Screenshot or CLI output of IAM-auth/encryption-at-rest/TLS-enforcement settings as configured at time of test

## Remediation Guidance
- Disable public accessibility on all managed database instances; require access exclusively through VPC peering, private endpoints/private link, or bastion/jump-host patterns
- Restrict firewall/security-group/authorized-network rules and Atlas IP access lists to specific, documented CIDR ranges — remove any `0.0.0.0/0`-equivalent rule
- Enforce IAM-database-authentication (or Azure AD/Cloud SQL IAM auth) as the sole authentication path where supported, disabling static-password fallback for human access
- Enable encryption-at-rest with customer-managed KMS keys and a defined rotation schedule; enforce TLS-only client connections at the service configuration level
- Review and remove any manually shared or public snapshots/backups; restrict backup access to explicitly authorized accounts/projects only, and scope DBaaS API keys/database users to least-privilege, per-cluster access

## Success Criteria
✓ Managed-service misconfiguration confirmed via provider API/CLI output, not assumption
✓ Public-accessibility findings validated against real network reachability
✓ Exploitable impact demonstrated where authorized (data access, cross-account backup access)
✓ Findings clearly scoped to the DBaaS control-plane layer, not duplicating engine-level or generic cloud-posture findings
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
