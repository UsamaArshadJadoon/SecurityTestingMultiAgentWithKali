# Agent-0012-XXE-Injection: XXE Injection

## Overview
XML External Entity (XXE) injection arises when an application parses attacker-supplied XML with a parser configured to resolve external entities and/or DOCTYPE declarations. Impact includes arbitrary local file disclosure, SSRF pivoted through the XML parser (including reaching cloud metadata endpoints), and denial of service via entity-expansion attacks. Because many modern APIs appear JSON-only on the surface, testers must also check whether the same endpoint quietly accepts an XML body, and whether file-upload formats built on XML (SVG, DOCX/XLSX/PPTX "Office Open XML", RSS) are separately vulnerable even when the primary API is not. This agent covers in-band, error-based, and fully blind out-of-band XXE across both direct API endpoints and XML-based document upload formats.

## Tools Integrated
- Burp Suite Professional with curated XXE payload snippets and the Collaborator client for OOB confirmation
- Interactsh/interact.sh for out-of-band DNS/HTTP exfiltration confirmation
- XXEinjector for automated blind/OOB XXE exploitation and file exfiltration
- docem / oxml_xxe for generating XXE-laden DOCX/XLSX/PPTX and other Office Open XML polyglot documents
- SoapUI or raw curl/Burp Repeater for SOAP/WSDL-based XXE testing

## Testing Approach

### Phase 1: Initial Assessment
- Identify every endpoint that accepts XML directly (SOAP APIs, XML-RPC, SAML assertions, RSS/Atom import) as well as endpoints that accept alternate content types but may still parse XML if `Content-Type` is switched
- Identify file-upload features that accept XML-based formats even when the application is otherwise JSON/REST (SVG avatar/image upload, DOCX/XLSX/PPTX report or template upload)
- Fingerprint the underlying XML parser library from error messages or stack traces (libxml2, Java JAXP/Xerces, .NET `XmlDocument`/`XmlReader`, Python `lxml`/`xml.etree`) to select the correct hardening/bypass expectations
- Determine whether verbose error messages are returned (enabling error-based exfiltration) or the parser fails silently (requiring OOB technique)

### Phase 2: Vulnerability Identification
- Test classic in-band XXE with a local DTD referencing `/etc/passwd` or `C:\Windows\win.ini` and confirm the file content is reflected in the response
- Test blind/OOB XXE using an external DTD hosted on an attacker-controlled server combined with parameter entities, exfiltrating multi-line file content via an HTTP request to an interactsh/Collaborator listener (bypassing the single-line limitation of direct in-body reflection)
- Test error-based XXE where the parser's own error message is coerced into containing the target file's content (useful when OOB egress is blocked)
- Test SSRF-through-XXE by pointing an external entity at an internal URL or cloud metadata endpoint and observing the resulting request/response
- Test parameter-entity smuggling to bypass simple "no DOCTYPE" filters (`<!DOCTYPE` string stripped) by using nested parameter entities defined via an externally-hosted DTD, and test `XInclude` as an alternative injection vector when direct `DOCTYPE` declarations are blocked
- Test XXE in alternate file formats accepted via upload: SVG (`<image>`/`<script>` or embedded `DOCTYPE`), and Office Open XML documents (DOCX/XLSX/PPTX) via `[Content_Types].xml` or relationship-file injection ("Office XXE")
- Carefully bound entity-expansion (billion-laughs/quadratic-blowup) tests to a controlled, low-iteration count to demonstrate the DoS vector without risking an actual service crash

### Phase 3: Exploitation & Validation
- Build and execute the full OOB exfiltration chain: external DTD retrieves the target file and sends its content via parameter entity to the attacker-controlled listener, capturing complete multi-line file content as evidence
- Demonstrate SSRF-through-XXE reaching an internal service or cloud metadata endpoint, capturing the retrieved response
- Where upload-based XXE (SVG/Office) is confirmed, demonstrate the same file-read/SSRF impact through the document-upload path specifically, since this is often a separate finding from the primary API
- Document the bounded DoS demonstration (payload used and controlled iteration count) without executing an uncontrolled expansion against the live target

### Phase 4: Documentation
- Document the raw XML payload sent, the external DTD content (if OOB-based), and the exact interaction/response evidence
- CVSS 3.1 scoring reflecting file-read, SSRF, or DoS impact as confirmed
- OWASP (A05:2021 Security Misconfiguration) / CWE-611 mapping
- Remediation guidance specific to the fingerprinted parser/library and its safe-configuration API
- Developer-actionable recommendations including the exact parser flag/setting to change

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
- Raw XML payload and external DTD (if OOB-based) submitted to the target
- Interactsh/Collaborator interaction log showing exfiltrated file content or SSRF callback
- Error-based response excerpt showing leaked file content where applicable
- Confirmation of the vulnerable upload format (SVG/DOCX/XLSX) with the specific injected file component
- Bounded DoS payload and observed resource-consumption evidence (controlled, non-destructive)

## Remediation Guidance
- Disable DTD processing and external entity resolution in the XML parser configuration (e.g., `disallow-doctype-decl` in Java, `libxml_disable_entity_loader`/`LIBXML_NOENT` avoidance in PHP, setting `XmlResolver = null` in .NET, using `defusedxml` in Python)
- Prefer a data format that doesn't support entities (JSON) wherever XML isn't strictly required by an integration partner
- Apply the same hardened parser configuration to any XML-based document-upload processing pipeline (SVG sanitization, Office document re-processing), not just the primary API surface
- Validate and allowlist uploaded document formats, stripping active/executable content before storage or rendering
- Keep the XML parsing library patched to current versions with known XXE-related CVEs remediated

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
