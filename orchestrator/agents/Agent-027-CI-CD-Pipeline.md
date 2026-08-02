# Agent-027-CI-CD-Pipeline: CI CD Pipeline

## Overview
Examines CI/CD pipelines as software supply-chain attack surface at the configuration layer — the YAML/Groovy/HCL pipeline-as-code definitions, third-party Action/plugin/Orb dependencies, and trust boundaries between pull requests and pipeline execution. This is a config-and-trust-boundary review, complementary to live CI/CD infrastructure testing: the focus here is Poisoned Pipeline Execution (PPE), malicious third-party GitHub Actions, unsafe use of `pull_request_target`, unpinned action references, and self-hosted runner privilege boundaries — the exact class of issue behind incidents like the 2021 Codecov bash-uploader compromise and repeated "compromised popular Action" supply-chain incidents. This agent reviews pipeline definitions as code and validates exploitability by crafting real, scoped test PRs/commits against a branch within scope.

## Tools Integrated
- semgrep with CI/CD-specific rulesets (`p/github-actions`, custom Jenkinsfile rules) — static analysis of pipeline definitions
- gh (GitHub CLI) + GitHub Actions REST/GraphQL API — workflow run inspection, permissions/OIDC trust review
- GitLab CI Lint API (`/ci/lint`) — pipeline YAML validation and `include:` chain resolution
- Zizmor — GitHub Actions workflow security auditing (untrusted input injection, unpinned actions)
- actionlint — GitHub Actions workflow linting for logic and security issues
- gitleaks / trufflehog — secret scanning of pipeline definitions and inline job scripts
- OpenSSF Scorecard — supply-chain risk scoring of the repo and its Action dependencies
- cosign / Sigstore — artifact/action signature and SLSA provenance verification
- docker/buildkit — build-cache and multi-stage build inspection for injected build args/secrets

## Testing Approach

### Phase 1: Initial Assessment
- Pull every pipeline definition file (`.github/workflows/*.yml`, `.gitlab-ci.yml` plus all `include:` targets, `Jenkinsfile`, `.circleci/config.yml`, `azure-pipelines.yml`) and build a full trigger map (push, pull_request, pull_request_target, schedule, workflow_dispatch, repository_dispatch)
- Enumerate every third-party Action/plugin/Orb dependency and its pinning method (tag vs. commit SHA vs. floating `@main`/`@v1`)
- Identify which workflows run on fork PRs and under what trigger — this determines whether an untrusted external contributor's code can influence pipeline execution
- Map which jobs have write permissions to the repo, access to `secrets.*`, or run on self-hosted runners
- Baseline current branch protection rules, required status checks, and CODEOWNERS enforcement

### Phase 2: Vulnerability Identification
- Identify Poisoned Pipeline Execution (PPE) candidates: workflows that check out and execute fork-PR code while having access to secrets (the classic `pull_request_target` + explicit checkout of `github.event.pull_request.head.sha` antipattern)
- Flag unpinned third-party actions (`uses: some/action@v3` or `@main` instead of a full commit SHA) — a compromised upstream tag or branch executes in your pipeline with your secrets
- Check for script injection via untrusted `${{ github.event.* }}` expression interpolation directly into `run:` shell steps (template-injection-to-RCE in Actions)
- Review self-hosted runner usage on public repositories — a single fork-PR-triggered workflow run can achieve arbitrary code execution on infrastructure the organization controls
- Look for artifact/cache poisoning: can a lower-privilege job write to a cache/artifact later consumed by a higher-privilege job in the same pipeline?
- Check for missing or weak branch protection allowing direct pushes to `main`/release branches, bypassing pipeline security gates entirely
- Audit OIDC trust policies (AWS/GCP/Azure federated identity via GitHub Actions) for overly broad `sub` claim conditions (e.g., trusting `repo:org/*` instead of a specific branch/environment)

### Phase 3: Exploitation & Validation
- On a test branch/fork within scope, submit a proof-of-concept PR that exploits an identified `pull_request_target` + checkout misconfiguration to demonstrate exfiltration of a scoped secret to a controlled, authorized endpoint only
- Demonstrate script injection by crafting a PR title/branch name/issue comment containing a shell metacharacter payload that executes in a vulnerable `run:` step, capturing command output as evidence
- For unpinned actions, document the theoretical blast radius (current permissions/secrets scope granted to that action) without actually compromising the upstream project
- Validate self-hosted runner isolation by attempting network reachability from a fork-PR-triggered job to internal-only resources
- Confirm whether a lower-trust job could push a modified artifact that a later deploy job would trust without integrity verification

### Phase 4: Documentation
- Document each pipeline file, exact line/step, and trigger condition that creates the exposure
- Provide the proof-of-concept PR/commit diff and the resulting workflow run logs
- Map trust-boundary violations explicitly: which untrusted input reaches which privileged execution context
- Include OpenSSF Scorecard delta and SLSA provenance level assessment as supporting risk context

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
- Full workflow/pipeline YAML excerpt showing the vulnerable trigger + step combination
- Proof-of-concept PR/commit diff and the resulting pipeline run log demonstrating exploitation
- Captured secret value or reachability proof (redacted in the report, retained securely and only within authorized scope)
- Action dependency pinning audit (tag vs. SHA reference table) for all third-party actions in scope
- OpenSSF Scorecard / Zizmor / actionlint tool output supporting each finding

## Remediation Guidance
- Pin all third-party actions/plugins/orbs to a full commit SHA, never a mutable tag or branch
- Replace `pull_request_target` with `pull_request` where secrets aren't needed, or add an explicit approval gate (`environment:` protection rules) before untrusted code runs with secret access
- Never interpolate `${{ github.event.* }}` directly into `run:` shell steps — pass through an intermediate environment variable instead
- Restrict self-hosted runners to private repos only, or use ephemeral/isolated runners per job for public repos
- Scope OIDC trust policies tightly to a specific `repo:org/repo:ref:refs/heads/main` and `environment:` claim, never a wildcard subject
- Enforce branch protection with required reviews and status checks on all deployment-triggering branches

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
