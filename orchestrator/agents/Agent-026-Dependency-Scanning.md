# Agent-026-Dependency-Scanning: Dependency Scanning

## Overview
Software Composition Analysis (SCA) engagement focused on identifying known-vulnerable open-source and third-party dependencies across the application's full dependency tree — direct and transitive — including outdated packages, unmaintained/abandoned libraries, and dependencies with disclosed CVEs left unpatched in production. Modern applications routinely ship more third-party code by volume than first-party code, and a single vulnerable transitive dependency (e.g., Log4Shell, CVE-2021-44228) can grant remote code execution regardless of how secure the application's own code is. This agent goes beyond generating a raw scanner report — it validates that flagged vulnerabilities are actually reachable and exploitable in the application's runtime context, separating real risk from scanner noise.

## Tools Integrated
- OWASP Dependency-Check — CVE-mapped SCA for Java/.NET/Node/Python/Ruby dependency manifests
- Snyk (CLI/SCM integration) — dependency, container, and IaC vulnerability scanning with fix PRs
- Trivy — filesystem/image/repo scanning against NVD, GHSA, and vendor advisories
- grype — vulnerability matching against generated SBOMs
- retire.js — client-side JavaScript library vulnerability detection
- npm audit / yarn audit / pnpm audit — Node.js ecosystem native scanners
- pip-audit / safety — Python dependency vulnerability scanning
- OWASP Dependency-Track — continuous SBOM-based vulnerability monitoring
- Syft / CycloneDX / SPDX tooling — SBOM generation for full dependency inventory
- GitHub Dependabot / GitLab Dependency Scanning — platform-native SCA baselines

## Testing Approach

### Phase 1: Initial Assessment
- Inventory every manifest/lockfile in the codebase (package-lock.json, yarn.lock, requirements.txt, Pipfile.lock, pom.xml, go.sum, Gemfile.lock, composer.lock) — scanners silently skip manifests they don't recognize
- Generate a full SBOM (CycloneDX or SPDX format) covering both direct and transitive dependencies
- Identify the runtime versions and package managers in use to select correct scanner configuration
- Baseline against internal component allow/deny lists or policy-as-code rules if provided
- Note vendored/copy-pasted third-party code not tracked by any package manager — often missed entirely by SCA tools

### Phase 2: Vulnerability Identification
- Run OWASP Dependency-Check / Snyk / Trivy / grype across the SBOM and cross-reference results to reduce false positives
- For every flagged CVE, pull the actual advisory (NVD, GHSA, vendor bulletin) and confirm the affected version range matches precisely — scanners frequently over-flag on loose version matching
- Prioritize by EPSS score and CISA KEV (Known Exploited Vulnerabilities) listing rather than raw CVSS alone
- Check for typosquatting and dependency-confusion risk (internal package names not reserved on public registries, private packages resolvable from public npm/PyPI)
- Flag abandoned/unmaintained packages (no commits in 2+ years, single maintainer, deprecated flag set) even absent an active CVE
- Review license-compliance issues surfaced alongside vulnerability data (GPL contamination, etc.) as a secondary finding where in scope

### Phase 3: Exploitation & Validation
- For each critical/high finding, determine reachability: is the vulnerable function/class/API actually invoked by the application's code paths, or is the vulnerable module dead-imported?
- Build a minimal proof-of-concept demonstrating the vulnerable dependency behavior in the actual application context (e.g., trigger the deserialization/injection/prototype-pollution primitive through a real application input)
- Where a public PoC/exploit exists (Metasploit module, ExploitDB, GHSA PoC), adapt and run it against the confirmed vulnerable version in a controlled environment
- Confirm the patched version resolves the issue by re-running the same PoC against an upgraded dependency in a sandboxed branch
- Chain a vulnerable-dependency finding with an application-layer entry point where possible to demonstrate full end-to-end impact, not just "vulnerable library present"

### Phase 4: Documentation
- Document CVE ID, affected package and exact version, fixed version, and reachability analysis for every finding
- Map each finding to CWE and, where applicable, the specific advisory identifier (GHSA-xxxx, CVE-YYYY-NNNNN)
- Include an SBOM excerpt showing the dependency chain from the direct dependency down to the vulnerable transitive package
- Provide the exact upgrade command per ecosystem (`npm audit fix`, `bundle update <gem> --conservative`, `mvn versions:use-latest-releases`)

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
- Full SBOM export (CycloneDX/SPDX) showing the dependency chain to the vulnerable package
- Scanner output (Dependency-Check/Snyk/Trivy JSON reports) cross-referenced against the public advisory
- Reachability proof: call-stack trace or code excerpt showing the vulnerable function is invoked by application code
- Working proof-of-concept exploit request/response or command transcript against the confirmed version
- Before/after PoC results demonstrating the fixed version remediates the issue

## Remediation Guidance
- Exact upgrade path and target version per affected package, validated to not break dependent code (flag semver-major bumps)
- Recommend automated dependency-update tooling (Dependabot, Renovate) wired into CI to prevent recurrence
- Suggest pinning/lockfile enforcement to prevent unreviewed transitive upgrades
- Where no fix is available, recommend a compensating control (WAF rule, feature flag disabling the vulnerable code path, vendoring a patched fork)
- Recommend SBOM generation plus continuous SCA monitoring (Dependency-Track) as an ongoing control, not a one-time scan

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
