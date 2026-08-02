# Agent-017-Secrets-Harvesting: Exposed Secrets Discovery

## Overview
Assesses whether credentials, API keys, encryption keys, or other secrets are discoverable in places they should never be reachable from — client-side bundles, public repositories, configuration files served over HTTP, error messages, or comments — and, when found, what they actually grant access to. This agent focuses on discovery and impact assessment of ALREADY-EXPOSED secrets rather than active credential-cracking; a secret sitting in a public JS bundle or an old commit is a documentation-and-remediation problem, not something that needs brute-forcing to prove.

## Tools Integrated
- Static secret-scanning tools (trufflehog, gitleaks, git-secrets) run against client-side bundles, public repositories, and any accessible configuration/backup files
- Standard browser devtools / bundle-analysis techniques to search minified JavaScript for hard-coded keys, tokens, or passphrases
- Git-history mining (reused from the Git Forensics agent) to check whether a secret was ever committed and later "removed," since removal from HEAD does not remove it from history

## Testing Approach

### Phase 1: Initial Assessment
- Inventory every client-accessible artifact that could contain secrets: JS/CSS bundles, source maps, mobile app binaries, public repositories, exposed .env/.git/backup files, error pages, and API responses
- Confirm whether any of these artifacts are indexed/cached publicly (search engines, web archives) beyond the live site itself

### Phase 2: Vulnerability Identification
- Scan every in-scope artifact for patterns matching API keys, private keys, database connection strings, hard-coded passwords, or signing secrets
- For any secret found, determine what it actually grants: is it a scoped, low-privilege key, or does it grant broad account/infrastructure access
- Check whether the same secret appears in git history even if absent from the current live version

### Phase 3: Exploitation & Validation
- For any exposed secret, perform only the minimal read-only check needed to confirm it is live and to establish its actual privilege scope (e.g., a single authenticated metadata call) — never use an exposed secret to access, modify, or exfiltrate real production data beyond what's needed to prove the secret is valid
- Document the exact location the secret was found and exactly how a real attacker would discover it (the same steps you just took)

### Phase 4: Documentation
- Document the secret's type, where it was found, and precisely what access it grants — without including the actual secret value in the report (reference its location/hash instead)
- Map to CVSS/OWASP/CWE as usual
- Frame remediation around immediate rotation of the exposed secret and root-causing why it ended up client-accessible in the first place

## Validation Requirements
✓ Authentic discovery from a real, reachable artifact — not a hypothetical
✓ Secret value itself is never included in report text (redacted/referenced by location only)
✓ Minimal validation only — no use of an exposed secret beyond confirming it is live and scoping its privilege
✓ Reproducible discovery steps
✓ Complete technical documentation

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
- The exact file/location/commit where the secret was found (with the secret value itself redacted in the report)
- The result of the minimal read-only check confirming the secret is live and its privilege scope
- Confirmation of whether the secret also appears in git history independent of the current live version

## Remediation Guidance
- Rotate the exposed secret immediately, regardless of its apparent privilege scope
- Move all secrets to environment-injected, server-side-only configuration — never bundle secrets into client-shipped code
- Purge secrets from git history (not just from HEAD) using history-rewriting tools, and treat any historically-committed secret as compromised
- Add automated secret-scanning to the CI/CD pipeline to catch this class of exposure before it ships

## Success Criteria
✓ Exposed secret authentically located in a real, reachable artifact
✓ Privilege scope of the secret accurately established via minimal validation only
✓ Secret value never disclosed in the report itself
✓ Remediation is actionable and addresses both immediate rotation and root cause

## Dependency Flow
**Input:** Target scope, client-side bundle/repository access from Reconnaissance and Source Code Disclosure agents
**Output:** Validated findings with evidence, secret values redacted
**Feeds:** Lateral Movement / Data Exfiltration agents (as a credential input, where in scope) and final penetration test report
