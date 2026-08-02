# Agent-0011-Path-Traversal-LFI: Path Traversal LFI

## Overview
Path traversal and local file inclusion vulnerabilities occur when user input controls, directly or indirectly, a filesystem path or include target without proper canonicalization and boundary enforcement. Impact spans arbitrary local file read (source code, configuration files, SSH keys, cloud credentials) to full remote code execution when an LFI is chained with a writable/attacker-influenced file (log poisoning, session-file poisoning, or PHP wrapper abuse). Because language-specific wrapper/stream handlers (PHP `php://filter`, `phar://`, `expect://`) dramatically expand impact beyond simple `../` sequences, this class requires both generic path-traversal fuzzing and stack-specific wrapper abuse testing. This agent covers detection, encoding-based filter bypass, and full LFI-to-RCE exploitation chains.

## Tools Integrated
- Burp Suite Intruder with curated path-traversal payload lists (PayloadsAllTheThings traversal wordlists)
- ffuf / wfuzz for parameter and path fuzzing with recursive traversal depth
- DotDotPwn for automated traversal fuzzing across protocols
- kadimus / fimap for LFI detection and exploitation automation
- php_filter_chain_generator.py for PHP `php://filter` chain-based RCE without requiring file upload
- Custom log/session poisoning scripts to inject payloads into User-Agent/Referer or PHP session files for inclusion

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate parameters that reference a filename, template, page, or path (`file=`, `page=`, `template=`, `lang=`, `download=`, `path=`, `doc=`, `include=`)
- Fingerprint OS (path separator conventions, case sensitivity) and application language/framework, since wrapper-based exploitation (PHP streams) is stack-specific
- Determine how the application resolves the supplied path (concatenation with a base directory, direct filesystem call, template-engine include) and whether any extension is auto-appended
- Identify writable/attacker-influenced files that could serve as an RCE vector if included (access logs, session files, uploaded files, `/proc/self/environ`)

### Phase 2: Vulnerability Identification
- Test basic traversal sequences (`../../../../etc/passwd`, `..\..\..\..\windows\win.ini`) and confirm via known sensitive-file content in the response
- Apply encoding bypasses against naive filters: single/double URL encoding (`%2e%2e%2f`, `%252e%252e%252f`), overlong UTF-8 encoding, and non-recursive-filter bypass (`....//....//` to defeat a single-pass `str_replace('../','')`)
- Test legacy null-byte truncation (`file.php%00.jpg`) on outdated PHP versions where an expected extension is appended server-side
- Abuse PHP stream wrappers where applicable: `php://filter/convert.base64-encode/resource=config.php` to exfiltrate source code without execution, `php://input` (requires `allow_url_include`), `phar://` for object-injection triggering, `data://text/plain;base64,...`, `expect://` for direct command execution
- Test LFI-to-RCE chains: log poisoning (inject a PHP payload via `User-Agent`/`Referer`, then include the access log path), PHP session-file poisoning (control `PHPSESSID`-referenced session file content, then include `/var/lib/php/sessions/sess_<id>`), and PHP filter-chain RCE (iconv-based chain achieving code execution without any writable file dependency)
- Probe for OS-specific sensitive files as confirmation targets (`/etc/passwd`, `/etc/shadow` where permissions allow, `win.ini`, `web.config`, application `.env` files, `id_rsa`/cloud credential files)

### Phase 3: Exploitation & Validation
- Build the full LFI-to-RCE chain (log or session poisoning, or filter-chain generator) through to confirmed command execution, capturing command output as proof
- Use `php://filter` base64 source-code extraction to pull application source, review it for further embedded secrets (database credentials, API keys) that expand the finding's impact
- Where file read (not RCE) is the ceiling, extract and redact sensitive configuration/credential files to demonstrate concrete impact rather than a generic "passwd file read"
- Verify reproducibility of the full chain and document any environment-specific prerequisites (log location, session save path, PHP configuration flags like `allow_url_include`)

### Phase 4: Documentation
- Document the traversal/wrapper matrix tested (technique vs. result) alongside the successful chain
- CVSS 3.1 scoring, with RCE chains scored as Critical and pure file-read findings scored per sensitivity of exposed data
- OWASP (A01:2021 Broken Access Control / A03:2021 Injection) / CWE-22 (and CWE-98 for PHP file inclusion) mapping
- Remediation guidance addressing both input validation and PHP configuration hardening where relevant
- Developer-actionable recommendations including exact canonicalization logic to apply at the vulnerable call site

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
- Raw traversal request/response showing retrieved sensitive file content
- Base64-decoded source-code extraction demonstrating secrets/credentials exposure via `php://filter`
- Full log/session-poisoning chain evidence: injected payload, inclusion request, and resulting command execution output
- Traversal/wrapper technique matrix documenting what was tested and the outcome of each
- Redacted copies of any sensitive configuration or key material retrieved

## Remediation Guidance
- Canonicalize the resolved path and verify it remains within the intended base directory (realpath comparison) before any filesystem operation
- Replace raw path/filename input with an indexed allowlist (map user-supplied IDs to server-controlled file paths) rather than accepting a path at all
- Disable dangerous PHP configuration where not required (`allow_url_include=Off`, `allow_url_fopen=Off`)
- Run the application under least-privilege filesystem permissions so even a successful traversal cannot reach sensitive OS files
- Avoid exposing raw filesystem or include-engine APIs to user-controlled input; use application-level abstractions with strict validation instead

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
</content>
