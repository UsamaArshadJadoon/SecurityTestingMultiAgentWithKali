# Agent-0010-File-Upload-RCE: File Upload RCE

## Overview
File upload functionality (avatars, documents, CSV/spreadsheet import, CMS themes/plugins, report attachments) is a high-value target because it hands the attacker partial control over server-side storage and, in the worst case, lets them place an executable script directly into a web-servable directory. Full impact ranges from stored webshell RCE to path-traversal writes outside the intended upload directory, ZIP-slip archive extraction attacks, and stored XSS/XXE via uploaded SVG or Office document formats. Critically, the absence of server-side extension/content-type/magic-byte validation is itself a genuine finding (CWE-434) even when no live code-execution path can be proven in the current environment — a missing defense-in-depth control must never be dismissed as N/A just because RCE wasn't achieved. This agent's methodology therefore requires testing bypass techniques at minimum against dangerous-extension blocking and content/type verification, and documenting the gap either way.

## Tools Integrated
- Burp Suite Professional with the Upload Scanner extension for automated bypass permutation
- ffuf / fuxploider for extension and endpoint fuzzing
- ExifTool and ImageMagick for crafting magic-byte-valid polyglot files (e.g., GIF89a-prefixed PHP, EXIF-embedded payloads)
- PHPGGC / webshell payload sets (PHP, JSP, ASPX) for post-upload execution proof
- evilarc / zip-slip PoC generators for archive path-traversal testing
- `file` / TrID for magic-byte and file-signature identification against declared Content-Type

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all upload features (avatar/profile image, document/report attachment, CSV/data import, CMS theme/plugin upload, message attachments) and identify the backend language/stack for each (PHP, ASP.NET, JSP, Node)
- Determine where uploaded files are stored and whether that storage location is web-servable/executable (same origin, subdomain, or object storage with public read)
- Capture the client-side allowed-extension/MIME list from JS/HTML to understand what the developer intended to block, since client-side checks are trivially bypassed
- Identify whether uploaded files are ever re-processed (thumbnail generation, virus scan, format conversion) which may introduce separate exploitable parsers (e.g., ImageMagick)

### Phase 2: Vulnerability Identification
- Test direct upload of dangerous extensions (`.php`, `.phtml`, `.pht`, `.phar`, `.asp`, `.aspx`, `.jsp`, `.jspx`, `.exe`, `.sh`, `.asa`, `.cer`, `.config`) to establish the baseline blocklist
- Test double-extension bypass (`shell.php.jpg`, `shell.asp;.jpg` IIS semicolon trick, `shell.php%00.jpg` legacy null-byte) and case-variation bypass (`shell.PHP`, `shell.pHp`) against naive blocklist filters
- Test MIME-type spoofing: upload a dangerous extension while declaring `Content-Type: image/png` or `image/jpeg` in the multipart request, to confirm whether the server trusts the client-supplied header instead of inspecting actual content
- Test magic-byte/content mismatch: prepend a valid file signature (`GIF89a;`, JPEG `FFD8FF` header bytes, PNG signature) before an executable payload body, and separately build true polyglot files (valid-GIF+PHP) to see whether the server validates file signature against the declared/extension type at all
- Test SVG/XML-based image upload for embedded XXE or stored XSS (`<script>` inside SVG), and ZIP/archive upload for zip-slip path traversal on extraction
- Test filename-field path traversal (`../../` sequences in the multipart filename) to attempt writing outside the intended upload directory, and test `.htaccess`/`web.config` upload where handler-mapping misconfiguration could grant new file types execution rights
- **Baseline requirement regardless of RCE outcome:** always test and explicitly record results for (1) a dangerous extension disguised via allowed MIME type or double extension, and (2) a content/magic-byte mismatch against the declared file type — document any bypass of either check as a defense-in-depth defect even if no execution sink is subsequently found

### Phase 3: Exploitation & Validation
- Where a bypass succeeds and the storage location is executable, upload a webshell using the confirmed bypass technique, request it directly, and capture command execution output (`id`/`whoami`) as RCE proof
- Where a bypass succeeds but no execution sink exists in the current environment (e.g., object storage serves files with forced `Content-Disposition: attachment` or non-executable handler mapping), still document the finding: the file was accepted and stored despite violating extension/MIME/magic-byte checks, with reproducible request/response evidence — score this appropriately lower (defense-in-depth/CWE-434) rather than closing it as not applicable
- Where RCE is achieved, chain further: read local configuration/secrets via the webshell, attempt lateral movement, and confirm blast radius
- Verify reproducibility by repeating the exact bypass sequence and confirming consistent results before finalizing severity

### Phase 4: Documentation
- Document each tested bypass category (extension, MIME, magic-byte, path traversal, archive extraction) with pass/fail status even where no single category alone achieved RCE
- CVSS 3.1 scoring reflecting either confirmed RCE (Critical) or confirmed-but-unexploited validation gap (Medium, per CWE-434) — never marked N/A when a validation bypass was reproducibly demonstrated
- OWASP (A04:2021 Insecure Design / A03:2021 for content-based injection) / CWE-434 mapping
- Remediation guidance covering both the immediate bypass and the underlying missing validation layer
- Developer-actionable recommendations including exact validation order (extension allowlist → MIME re-check → magic-byte verification) that should be enforced server-side

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
- HTTP request/response showing the exact bypass technique (extension, MIME, magic-byte) that resulted in the file being accepted and stored
- Hex dump comparison of actual file magic bytes versus the declared Content-Type/extension for every tested mismatch case
- Webshell command execution output or reverse-shell screenshot where RCE was achieved
- Stored file path/URL confirmation demonstrating the upload succeeded even absent execution
- Archive-extraction (zip-slip) or path-traversal filename evidence where applicable

## Remediation Guidance
- Enforce a strict server-side allowlist of permitted extensions (never a blocklist), applied after all normalization/decoding is complete
- Re-verify declared MIME type server-side via content inspection rather than trusting the client-supplied `Content-Type` header
- Validate the file's actual magic bytes/signature match the declared and allowed file type before persisting it
- Store uploaded files outside the webroot under randomized, non-executable names, and disable script execution for the upload directory at the web-server configuration level
- Re-encode/re-process images and sanitize document formats (strip active content from SVG/Office XML) before serving them back to users

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
