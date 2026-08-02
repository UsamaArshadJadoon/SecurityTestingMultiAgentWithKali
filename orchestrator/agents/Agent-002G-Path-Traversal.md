# Agent: Path Traversal and LFI

## Overview
Testing for path/directory traversal and Local File Inclusion (LFI) where user-controlled input reaches filesystem path construction — file download/preview endpoints, template/include parameters, log viewers, static-asset serving, and report/export features. Impact ranges from arbitrary local file read (source code, configuration, credential files) to full remote code execution when traversal is chained with file upload, log poisoning, or language-specific stream wrappers (e.g., PHP's `php://` wrappers).

## Tools Integrated
- Burp Suite (Intruder with curated traversal payload lists, Repeater for manual encoding-bypass testing)
- ffuf / feroxbuster (endpoint and parameter discovery to surface candidate file-serving features)
- dotdotpwn (automated directory-traversal fuzzing across protocols)
- wfuzz (parameterized traversal payload sweeps)
- Custom encoding-bypass payload generator (double URL encoding, overlong UTF-8, legacy null-byte injection)

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every endpoint that accepts a filename- or path-like parameter: file download, avatar/image serving, template "include" parameters, log viewers, report export, legacy `?page=`/`?file=`-style inclusion patterns
- Fingerprint the underlying OS and stack (Windows vs. Linux path semantics, presence of a PHP runtime with stream-wrapper support) to select the correct payload dialect and escalation techniques

### Phase 2: Vulnerability Identification
- Submit baseline traversal payloads: `../../../../etc/passwd` (Linux) and `..\..\..\..\windows\win.ini` (Windows), checking the response for disclosed file content
- Test filter/normalization bypass techniques where the baseline payload is blocked or sanitized: URL encoding (`%2e%2e%2f`), double URL encoding (`%252e%252e%252f`), overlong UTF-8 encoding, legacy null-byte injection (`%00`, effective on unpatched PHP < 5.3.4), absolute path injection, and path-truncation tricks
- On confirmed PHP stacks, test stream-wrapper abuse: `php://filter/convert.base64-encode/resource=` to read source files without execution, `php://input` for payload injection, and `zip://`/`phar://` wrappers where file-upload combined with inclusion is possible

### Phase 3: Exploitation & Validation
- Escalate confirmed file-read access into the highest achievable impact: read application source code to uncover further hardcoded secrets, or read configuration files containing database/API credentials
- Where the stack allows it, escalate LFI to remote code execution via log poisoning (inject a PHP payload into a request header such as `User-Agent` or `Referer` that gets logged by the web server, then include the log file to execute it), session-file poisoning, or a `php://filter` chain
- Where only read access is achievable, extract and demonstrate downstream impact from high-value files (e.g., use extracted database credentials to authenticate directly against the database, or private keys to access another in-scope system)
- Document exactly which encoding/normalization bypass succeeded per endpoint, since filtering behavior often differs across parameters even within the same application

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector Network; Attack Complexity Low for unfiltered traversal, higher where an encoding/normalization bypass was required
- Scope frequently Changed when file disclosure or LFI-to-RCE reaches data/execution beyond the vulnerable component
- Confidentiality impact High for file disclosure; Integrity/Availability High where RCE is confirmed via log/wrapper chains

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
- Raw request/response pairs showing disclosed file content for each successful bypass technique
- A record of which encoding/normalization bypasses succeeded versus were blocked, per endpoint
- Extracted credential/secret file content (redacted to what's necessary to prove impact)
- Command output or reverse-shell transcript where log-poisoning or a stream-wrapper chain achieved RCE

## Remediation Guidance
- Never construct filesystem paths directly from user input — map user-supplied identifiers to a server-side allow-list of permitted files/paths instead of passing raw input to filesystem APIs
- Canonicalize the resolved path (e.g., `realpath`) and verify it still falls within the intended base directory *after* resolution, not by pattern-matching the raw input beforehand
- Run the serving process with least-privilege filesystem access (chroot/container isolation) so a bypass has minimal blast radius
- Disable dangerous PHP stream wrappers and `allow_url_include` where dynamic file inclusion isn't required by the application
- Avoid logging unsanitized user input into any file that is ever passed to an `include()`/inclusion mechanism, to close off log-poisoning-based LFI-to-RCE chains

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, file-handling endpoint map from Agent-002 recon, previous agent findings
**Output:** Validated path traversal/LFI findings with evidence
**Feeds:** Downstream agents and final penetration test report
