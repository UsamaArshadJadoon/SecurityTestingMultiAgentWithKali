# Agent-022: CI/CD Pipeline Security Testing

## Overview
Targets the live CI/CD control plane — Jenkins, GitLab CI, GitHub Actions/Enterprise Server, TeamCity, CircleCI, Bamboo, Argo CD — as a first-class target rather than an afterthought behind the web application. A compromised CI/CD system gives an attacker code execution on every downstream deployment, credentials to every integrated cloud account, and a trusted signing identity for shipped artifacts; this is consistently the highest-leverage single target in enterprise environments (see the 2020 SolarWinds and 2023 3CX build-server compromises). This agent enumerates exposed pipeline interfaces, exploits authentication and authorization weaknesses in the orchestrator itself, harvests credentials from job configuration/build history/environment variables, and validates pivot potential from build agents into internal networks and cloud accounts. It is complementary to, and distinct from, pipeline-as-code/configuration review — this agent tests the running system, not just the pipeline definitions.

## Tools Integrated
- jenkins-cli / Jenkins REST API — job enumeration and script console access
- Groovy script console payloads — unauthenticated/authenticated RCE on Jenkins masters
- gitlab-api (python-gitlab) — CI/CD variable enumeration, runner registration abuse
- github-cli (gh) + GitHub REST/GraphQL API — Actions run log inspection, OIDC trust review
- docker / skopeo / crane — registry enumeration and image layer extraction
- trufflehog / gitleaks — secret scanning of build logs, job configs, and artifact contents
- semgrep — SAST scan of pipeline definition files pulled from the target
- trivy / grype — vulnerability scanning of built container images
- ffuf / nmap — discovery of exposed CI dashboards, agent ports (e.g., Jenkins JNLP 50000), and API endpoints
- Burp Suite — intercepting webhook and API traffic between the SCM and the CI system

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint the CI/CD platform and exact version (`/login`, `/api/json` on Jenkins; `/-/health` on GitLab; instance metadata/response headers) to map to known CVEs
- Enumerate exposed interfaces: Jenkins on default 8080/50000, GitLab Runner API, self-hosted GitHub Actions runner dashboards, Argo CD UI
- Check for anonymous/unauthenticated read access to job lists, build history, and console output
- Identify the authentication mechanism in use (local accounts, SSO/SAML, API tokens) and test for default credentials (`admin`/`admin`, `admin`/`password`)
- Map organizational structure: folders/projects/groups, multibranch pipelines, shared libraries, and which jobs deploy to production

### Phase 2: Vulnerability Identification
- Test for unauthenticated or under-privileged access to the Jenkins Script Console (`/script`) — a direct path to RCE via Groovy
- Check for known unauthenticated RCEs relevant to the fingerprinted version (Jenkins CLI arg-file-read CVE-2024-23897, GitLab unauthenticated RCE via ExifTool CVE-2021-22205, TeamCity auth-bypass CVE-2024-27198)
- Review RBAC/project permissions for horizontal privilege escalation (a low-privilege contributor triggering a privileged production pipeline)
- Search build console output and archived logs for leaked secrets (API keys, cloud credentials, SSH private keys echoed by `env`/`printenv` or a misconfigured debug step)
- Enumerate CI/CD variables and test masked/protected-variable bypass techniques (masking bypass via string splitting or re-encoding, or triggering a build on an unprotected branch/MR to read a "protected" variable)
- Check webhook secret validation — can a crafted webhook payload trigger a job without a valid signature?

### Phase 3: Exploitation & Validation
- Execute a proof-of-concept Groovy/script-console payload demonstrating command execution on the CI master/build agent, capturing `id`/`hostname`/`whoami` output as evidence
- Harvest discovered credentials and validate them against their target systems (cloud CLI `sts get-caller-identity`, registry login, SCM token scope check) strictly within authorized scope, stopping at confirmation
- Demonstrate pivot potential from the build agent into the internal network (agents often sit inside the VPC/VPN with routes unavailable externally) via reachability tests to internal-only hosts
- Test artifact/container registry access controls: pull private images and check for push access that would allow poisoning a production image tag
- Validate whether compromised CI credentials can push a modified pipeline definition that executes on the next merge, chaining into supply-chain code execution

### Phase 4: Documentation
- Document the exact unauthenticated/under-authenticated path used to reach each finding, with full request/response or CLI transcript
- Map every credential discovered to its blast radius (which cloud account, which registry, which production system)
- Score each finding independently — a leaked read-only token differs sharply in severity from a leaked cloud admin key
- Provide a pipeline-by-pipeline remediation list rather than a single generic fix

## Validation Requirements
- Real pipeline access
- Authenticated testing
- Documented credential discovery
- Exploitation proof
- Clear remediation path

## CVSS Scoring
- Severity: Code execution in deployment
- Attack Vector: Network (CI/CD interface)
- Privileges: May be low (developer)
- User Interaction: None
- Scope: Changed (deployment infrastructure)
- CIA Impact: Critical (code injection)

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
- Script console / RCE proof-of-concept output (`id`, `hostname`, environment dump)
- Captured CI/CD variable values with secrets redacted in the report but type/scope retained for verification
- Build console log excerpts showing credential leakage
- Screenshots of unauthenticated dashboard/job access
- Registry pull/push proof (image manifest digests, `docker pull`/`push` transcript)

## Remediation Guidance
- Implement dedicated secrets management (HashiCorp Vault, AWS Secrets Manager, Sealed Secrets) instead of static CI variables
- Enforce least-privilege service accounts scoped per pipeline/job, not shared broad-access credentials
- Disable or restrict the Jenkins Script Console to admin-only with audit logging enabled
- Mask and protect sensitive CI/CD variables, and restrict protected variables to protected branches/tags only
- Require artifact signing (Sigstore/cosign) and verify signatures at deploy time
- Patch the CI/CD platform to the latest version and subscribe to vendor security advisories

## Success Criteria
✓ Pipeline structure mapped
✓ Credentials discovered
✓ Artifact access demonstrated
✓ Deployment impact shown
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
