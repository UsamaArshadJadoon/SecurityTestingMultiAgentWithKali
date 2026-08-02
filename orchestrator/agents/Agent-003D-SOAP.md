# Agent: SOAP Web Services

## Overview
SOAP services are XML-native end to end, which makes XML-specific attacks — XXE, XML signature wrapping, and WS-Security downgrade — the primary risk class rather than the JSON-oriented issues that dominate REST testing. These services are disproportionately common in legacy enterprise, financial, healthcare, and government integrations, often built on XML libraries that expand external entities by default and WS-Security implementations that validate signatures incorrectly. This agent focuses on WSDL-driven enumeration followed by XML-parser and WS-Security-specific exploitation, since a compromised SOAP endpoint frequently provides direct file-read/SSRF primitives that REST APIs rarely expose so directly.

## Tools Integrated
- SoapUI (or SoapUI Open Source) — WSDL-driven test generation and operation enumeration
- Burp Suite (with WSDL parsing / SOAP-aware extensions) — interception and manual manipulation
- wsdl2java / wsdl-viewer — offline WSDL parsing and complex-type analysis
- XXEinjector / oxml_xxe — automated XXE payload generation and delivery
- Burp Collaborator (or a custom OOB DNS/HTTP listener) — out-of-band confirmation of blind XXE
- testssl.sh — transport security assessment for the SOAP endpoint
- Custom Python (lxml/zeep) scripts — SOAPAction spoofing, XML signature wrapping (XSW) payload construction, and WS-Security token replay

## Testing Approach

### Phase 1: Initial Assessment
- Locate the WSDL (`?wsdl`, `?singleWsdl`, common paths, robots.txt, sitemap, linked client SDKs) and parse it with SoapUI/wsdl2java to enumerate every operation, binding, and complex type
- Identify the WS-Security policy in use (UsernameToken with PasswordText or PasswordDigest, X.509 signing, SAML assertions, WS-SecurityPolicy) and where it is enforced
- Determine SOAP version (1.1 vs 1.2) and transport (HTTP vs HTTPS) per endpoint/binding
- Check whether the WSDL discloses internal or undocumented operations not present in client-facing documentation or SDKs
- Fingerprint the SOAP stack/framework (Axis, WCF, CXF, Spring-WS) from fault formatting and namespace conventions, since default XML-parser entity-expansion behavior differs by stack

### Phase 2: Vulnerability Identification
- Inject XXE payloads into the SOAP body (external entity, parameter entity, and out-of-band via Collaborator/custom listener) — SOAP's XML-native body makes it a common blind spot for entity-expansion defenses that were only added to a JSON-facing layer
- Test XML Signature Wrapping (XSW) attacks against WS-Security-signed messages: relocate the signed content under an attacker-controlled wrapper element and see whether the server validates the signature against the wrong node
- Test WS-Security UsernameToken replay: reuse a captured nonce/timestamp/digest combination, and test whether `PasswordDigest` can be downgraded to `PasswordText`
- Test SOAPAction header spoofing to invoke an operation different from the one the body actually targets, checking for operation-routing confusion
- Test XPath injection where SOAP body parameters feed into backend XPath queries
- Test for verbose SOAP faults leaking stack traces, internal class names, or schema fragments
- Confirm whether transport security is enforced consistently (HTTP allowed alongside HTTPS, weak cipher support) via testssl.sh

### Phase 3: Exploitation & Validation
- Build a working XXE PoC that exfiltrates a server-side file or triggers an out-of-band interaction (Collaborator hit) confirming entity expansion, and where possible escalate to SSRF against an internal/metadata endpoint
- Construct a full XSW PoC: a validly signed SOAP envelope structurally rewritten so the signature still validates while the processed business content is attacker-controlled
- Demonstrate a WS-Security replay attack by resending a captured UsernameToken/timestamp within its (too generous) validity window
- Confirm SOAPAction spoofing by invoking an unintended operation and showing it executes with the wrong action header
- Where XPath injection is suspected, confirm with boolean-based or error-based payloads

### Phase 4: Documentation
- Detailed finding documentation with the full WSDL excerpt and crafted XML payload
- CVSS 3.1 scoring
- OWASP API Top 10 / CWE mapping (CWE-611 XXE, CWE-347 improper signature verification)
- Remediation guidance covering parser hardening and WS-Security policy correction
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring
- Severity: Based on impact level
- Attack Vector: Network
- Privileges: Varies by vulnerability
- User Interaction: Sometimes required
- Scope: Changed where applicable
- CIA Impact: Varies by finding

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
- Full WSDL dump enumerating operations, bindings, and complex types
- XXE payload plus out-of-band interaction log (Collaborator/listener hit) or in-band file-disclosure response
- Crafted XSW envelope alongside proof the signature validation was bypassed
- Captured WS-Security token and successful replay request/response
- SOAP fault responses showing internal stack traces or schema disclosure

## Remediation Guidance
- Disable DTD processing and external entity resolution in the XML parser by default (secure-by-default configuration, e.g., `disallow-doctype-decl`)
- Enforce WS-SecurityPolicy correctly: validate signatures over the canonicalized envelope structure actually processed, and enforce nonce/timestamp freshness to prevent replay
- Validate the SOAPAction header against the operation actually bound to the request body
- Replace legacy or unmaintained XML parsing libraries with hardened, entity-expansion-disabled alternatives
- Disable verbose SOAP fault detail in production and return generic fault messages instead

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, WSDL/SOAP endpoint(s), previous agent findings
**Output:** Validated SOAP findings with evidence
**Feeds:** Downstream agents and final penetration test report
