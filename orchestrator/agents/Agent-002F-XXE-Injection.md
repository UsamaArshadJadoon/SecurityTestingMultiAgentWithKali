# Agent: XML External Entity Injection

## Overview
Testing for XML External Entity (XXE) injection, where an XML parser configured to resolve external entities and/or process DOCTYPE declarations allows an attacker to read local files, perform Server-Side Request Forgery (SSRF), or trigger denial-of-service (billion-laughs/quadratic-blowup expansion). Affects any endpoint that parses XML directly or indirectly — SOAP APIs, file-upload features accepting XML/SVG/DOCX/XLSX (all of which are XML-based container formats), RSS/config import features, and SAML authentication assertions. Impact ranges from local configuration/credential file disclosure to internal network pivoting via SSRF.

## Tools Integrated
- Burp Suite (manual entity payload crafting, Collaborator for out-of-band exfiltration)
- nuclei (XXE detection templates)
- OXML_XXE (embedding XXE payloads into Office Open XML documents for upload-based testing)
- SAML Raider (SAML-specific XXE and assertion manipulation)
- Custom Python harness (lxml/expat) for confirming parser behavior directly against isolated test payloads
- curl (raw payload delivery and header/content-type manipulation)

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every XML-consuming input across the application: SOAP endpoints, file-upload features accepting XML/SVG/DOCX/XLSX/RSS, config-import features, SAML SSO assertion endpoints
- Confirm the underlying XML parser/library in use via error message wording or framework fingerprinting, since remediation and exploitability depend heavily on the specific parser's default settings
- Check whether JSON-only endpoints can be coerced into accepting an XML `Content-Type` instead, opening an unexpected XXE surface

### Phase 2: Vulnerability Identification
- Submit a basic external entity payload referencing a local file (`file:///etc/passwd` or `C:\Windows\win.ini`) and check whether the content is reflected directly in the response (in-band)
- Where no in-band reflection occurs, test out-of-band exfiltration using parameter entities and an externally-hosted DTD that reads the target file and sends its content via an HTTP/FTP request to a Burp Collaborator/interactsh listener
- Test SSRF via an external entity pointing at an internal-only service or a cloud metadata endpoint
- Test denial-of-service payloads (billion laughs / quadratic blowup) only where DoS testing is explicitly within the authorized rules of engagement, given the availability impact
- Test XInclude-based injection as an alternative technique where `DOCTYPE` declarations specifically are filtered but XInclude processing remains enabled

### Phase 3: Exploitation & Validation
- Where in-band reflection isn't available, exfiltrate sensitive local files (application configuration containing database credentials, private keys, `/etc/passwd`) via the multi-step OOB technique: define an external parameter entity that reads the target file, then a second entity that sends its content to the attacker-controlled Collaborator endpoint
- Demonstrate SSRF pivot impact by reaching an internal-only admin interface or cloud instance-metadata endpoint and capturing the returned internal data
- Use any credentials or secrets extracted via XXE to demonstrate further access (e.g., authenticate directly to a database or internal API with the harvested credentials)
- Re-confirm the exact payload and delivery path work reliably before documenting

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
- Attack Vector Network; Attack Complexity Low for in-band disclosure, High for blind/OOB chains requiring an external listener
- Scope frequently Changed when file disclosure or SSRF reaches resources outside the vulnerable parsing component
- Confidentiality impact High for file disclosure/SSRF; Availability High when DoS-capable entity expansion is confirmed

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
- Raw request containing the entity payload alongside the response showing disclosed file content
- Collaborator/interactsh interaction log showing the out-of-band callback carrying exfiltrated data
- SSRF proof showing internal service/metadata content reached and returned or exfiltrated via the external entity
- Identified parser/library name and version supporting targeted remediation guidance

## Remediation Guidance
- Disable DTD processing and external entity resolution entirely at the parser configuration level (e.g., disable `SUPPORTING_EXTERNAL_ENTITIES` in Java XML factories, disable `resolveEntities`/enable `NOENT` restrictions in libxml2-based parsers, use `defusedxml` in Python instead of the standard library's XML modules)
- Prefer data formats that don't support entities (JSON) wherever XML is not strictly required by the integration
- Keep XML parsing libraries patched, since safe-by-default behavior has changed across versions of many popular parsers
- Apply least-privilege to the application process's filesystem and network access so that any residual parser misconfiguration has minimal blast radius
- For file-upload features accepting Office/XML-based formats, apply the same external-entity restrictions to any XML parsing performed on uploaded document contents, not just top-level API request bodies

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, XML-consuming endpoint map from Agent-002 recon, previous agent findings
**Output:** Validated XXE findings with evidence
**Feeds:** Downstream agents and final penetration test report
