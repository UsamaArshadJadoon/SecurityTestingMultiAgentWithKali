# Agent: Server-Side Template Injection

## Overview
Testing for Server-Side Template Injection (SSTI), where user-controlled input is embedded unsanitized into a template engine's rendering context rather than treated purely as data. Applies to any engine-driven rendering feature — Jinja2/Django templates, Twig, FreeMarker, Velocity, Smarty (server-side), and Handlebars/EJS/Pug or ERB where server-rendered. Severity ranges from information disclosure (template environment/variable leakage) to full remote code execution once expression evaluation can be escalated to object/class introspection and native code execution, since template languages routinely expose enough reflection capability to reach the underlying runtime.

## Tools Integrated
- tplmap (automated SSTI detection and exploitation across multiple engines)
- Burp Suite (Repeater/Intruder for manual probing and payload iteration)
- nuclei (SSTI detection templates for rapid triage across a target set)
- Engine-specific exploitation cheatsheets/payload chains (Jinja2 sandbox-escape chains, FreeMarker `Execute` utility chain, Twig `registerUndefinedFilterCallback` chain)
- Manual reverse-shell/command-execution payloads once an engine and injection point are confirmed

## Testing Approach

### Phase 1: Initial Assessment
- Identify every feature where user input might feed a server-rendered template rather than a plain string: email/notification templates, PDF/report generation, custom "preview" or "theme" features, error pages that echo input, dynamic page-title/metadata fields
- Fingerprint the likely template engine from stack/framework detection (response headers, error stack traces, default file extensions, known framework defaults)
- Note that different features within the same application may use different template engines (e.g., email templates vs. report generation), so each candidate injection point needs independent engine fingerprinting rather than assuming a single engine application-wide

### Phase 2: Vulnerability Identification
- Submit a universal SSTI detection polyglot (e.g., `${{<%[%'"}}%\` ) or engine-agnostic arithmetic probes (`{{7*7}}`, `${7*7}`, `#{7*7}`, `<%= 7*7 %>`) and check whether the response contains the evaluated result (`49`) rather than the literal string — this confirms template evaluation is occurring, not just string echo/reflection
- Narrow down the exact engine by testing engine-specific syntax differentiators once basic evaluation is confirmed
- Escalate from simple expression evaluation to object/class introspection appropriate to the confirmed engine, e.g., Jinja2 subclass traversal (`{{''.__class__.__mro__[1].__subclasses__()}}`) toward a sandbox-escape gadget, FreeMarker's `freemarker.template.utility.Execute` chain, or Twig's `_self.env.registerUndefinedFilterCallback('exec')` chain

### Phase 3: Exploitation & Validation
- Build the full remote-code-execution proof-of-concept for the confirmed engine (e.g., Jinja2 chain reaching `os.popen`/`subprocess`, Java-based engines reaching `Runtime.getRuntime().exec()`), capturing command output as evidence
- Where full RCE isn't achievable, obtain the strongest available impact: environment variable/secret disclosure, application source/config file read, or internal template-context object dumping
- Use confirmed command execution to read sensitive files/environment variables containing database credentials or API keys, and pivot using any harvested credentials to demonstrate downstream access
- Re-verify the exploitation chain works reliably (not a one-off) before documenting

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
- Attack Vector Network; Attack Complexity Low once the engine is confirmed, higher when sandbox-escape gadgets require engine-version-specific tuning
- Scope typically Changed when template execution reaches the underlying OS/runtime beyond the templating component
- Confidentiality/Integrity/Availability all High when RCE is confirmed

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
- Raw request/response showing arithmetic evaluation (`7*7` resolving to `49`) proving genuine template execution
- Command output captured from the RCE payload (e.g., `id`/`whoami` output) or a reverse-shell session transcript
- Identified template engine and the exact payload/gadget chain that achieved escalation
- Any sensitive file/environment variable content disclosed via the confirmed execution primitive (redacted appropriately)

## Remediation Guidance
- Never render user-controlled input as template *source* — treat all user input strictly as template *data*/variables passed into a pre-defined, developer-authored template
- Where dynamic rendering genuinely cannot be avoided, use the engine's sandboxed/logic-less execution mode (e.g., Jinja2 `SandboxedEnvironment`, Twig's sandbox extension) as defense-in-depth, not as the primary control
- Fully separate presentation templates from any user-supplied content; use variable interpolation only, never string-concatenated template construction
- Apply strict input validation/allow-listing wherever dynamic template selection or rendering is unavoidable
- Keep template engine libraries patched against known sandbox-escape CVEs, since sandbox bypasses are an ongoing cat-and-mouse category

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, rendering-feature map from Agent-002 recon, previous agent findings
**Output:** Validated SSTI findings with evidence
**Feeds:** Downstream agents and final penetration test report
