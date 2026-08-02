# Agent-019: AWS Cloud Security Testing

## Overview
Agent-019 performs a broad AWS security posture assessment across accounts, identities, and core services — the reconnaissance-and-configuration-review counterpart to the deeper Agent-021 AWS Exploitation agent. It focuses on IAM policy hygiene, S3/storage exposure, EC2 and instance-metadata risk, and organization/account-level misconfiguration (CloudTrail, GuardDuty, Config, SCPs). Because AWS's permission model is additive and cross-service (IAM policies, resource policies, SCPs, and trust policies all interact), a single overprivileged role or public resource policy can expose an entire account, so this agent prioritizes finding the highest-leverage misconfigurations rather than exhaustively cataloguing every service. Findings feed directly into Agent-021 for active exploitation and privilege-escalation validation.

## Tools Integrated
- aws-cli — direct AWS API enumeration and validation of discovered access
- Prowler — AWS security best-practice and CIS/PCI/HIPAA benchmark scanning
- ScoutSuite — multi-service AWS configuration auditing and risk visualization
- Cloudsplaining — IAM policy analysis for privilege escalation and overly permissive actions
- PMapper (Principal Mapper) — IAM privilege-escalation path graphing across users/roles
- enumerate-iam — unauthenticated/low-privilege IAM permission enumeration via API error probing
- CloudMapper — AWS network and account visualization (VPC/subnet/security group mapping)
- Pacu — AWS exploitation framework for post-enumeration escalation and lateral movement
- S3Scanner / bucket-stream — public S3 bucket discovery and permission testing
- WeirdAAL — AWS attack library for service-specific recon modules

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate AWS accounts, organizations, and regions in scope; identify whether AWS Organizations/SCPs are in use
- Enumerate IAM users, roles, groups, and identity providers (SAML/OIDC federation, IAM Identity Center)
- Discover EC2 instances, Auto Scaling Groups, and Lambda functions across all in-scope regions (not just default region)
- Map S3 buckets, RDS/DynamoDB/Redshift databases, and their exposure surface
- Establish a baseline of CloudTrail, GuardDuty, AWS Config, and Security Hub coverage/status

### Phase 2: Vulnerability Identification
- Run Prowler and ScoutSuite for broad CIS AWS Foundations Benchmark and best-practice coverage
- Run Cloudsplaining/PMapper against collected IAM policies to identify privilege-escalation paths (e.g., `iam:PassRole` + `ec2:RunInstances`, `iam:CreatePolicyVersion`, `iam:AttachUserPolicy`, `sts:AssumeRole` on overly permissive trust policies)
- Identify wildcard resource/action policies (`"Action": "*"`, `"Resource": "*"`), unused/stale access keys, and users without MFA enforced
- Check S3 buckets for public ACLs/bucket policies, disabled Block Public Access, missing default encryption (SSE-S3/KMS), and permissive CORS configuration
- Check EC2 security groups for `0.0.0.0/0` ingress on management ports (22, 3389, database ports) and verify Instance Metadata Service version (IMDSv1 vs IMDSv2 enforcement, hop-limit for containers)
- Check for insecure cross-account trust relationships (wildcard principals, missing `sts:ExternalId` condition) and third-party role assumption risk

### Phase 3: Exploitation & Validation
- Validate discovered credentials/roles with `aws sts get-caller-identity` and enumerate effective permissions via `enumerate-iam` where explicit `iam:GetPolicy` access is unavailable
- Demonstrate privilege escalation paths identified by PMapper/Cloudsplaining using Pacu modules (e.g., `iam__privesc_scan`)
- Retrieve temporary credentials from an EC2 instance profile via the metadata service (`http://169.254.169.254/latest/meta-data/iam/security-credentials/`) where IMDSv1 is enabled and reachable (e.g., via SSRF)
- Demonstrate real access to exposed S3 objects/RDS snapshots as proof of data exposure, without exfiltrating sensitive data beyond what is needed for evidence
- Confirm cross-account assumption where a trust policy is overly permissive

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping (map IAM privilege escalation to MITRE ATT&CK Cloud, e.g., T1078.004, T1548.005)
- Remediation guidance
- Developer-actionable recommendations

## Validation Requirements
✓ Authorized AWS testing scope confirmed (account IDs, regions, IAM boundary)
✓ Real AWS account/API access used for verification, not assumptions from policy JSON alone
✓ Confirmed permission issues backed by actual API responses
✓ Documented exploitation path from initial access to impact
✓ Working proof-of-concept for any claimed privilege escalation

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: typically Network (AWS public API)
- Attack Complexity: Low/High depending on required pre-conditions
- Privileges Required: None/Low/High (often Low — a single compromised/leaked key)
- User Interaction: None
- Scope: often Changed given multi-service blast radius
- CIA Impacts: up to Critical where full account compromise is achievable

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
- Prowler/ScoutSuite report output flagging specific failed checks with resource ARNs
- `aws sts get-caller-identity` and IAM policy JSON showing the effective permission set
- PMapper/Cloudsplaining privilege-escalation graph or path output
- Screenshots or CLI output demonstrating public S3 object access or metadata credential retrieval
- CloudTrail excerpts confirming the exact API calls exercised during testing

## Remediation Guidance
- Apply least-privilege IAM policies; remove wildcard actions/resources and enforce permission boundaries
- Enforce MFA for all IAM users and require IMDSv2 (`HttpTokens: required`) on all EC2 instance profiles
- Enable and centralize CloudTrail, GuardDuty, and AWS Config across all accounts/regions
- Enable S3 Block Public Access at the account level and default encryption on all buckets
- Restrict cross-account trust policies to specific principals with `sts:ExternalId` conditions; remove wildcard principals

## Success Criteria
✓ Successful AWS account/service enumeration across all in-scope regions
✓ IAM permission and privilege-escalation issues documented with reproducible paths
✓ Unauthorized access demonstrated with real evidence
✓ Clear exploitation chain from misconfiguration to impact
✓ Developer-actionable, AWS-specific fixes provided

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Agent-021 AWS Exploitation and the final penetration test report
