# Agent-007-AI-LLM: AI LLM

## Overview
AI/LLM application security testing targeting the OWASP Top 10 for LLM Applications: prompt injection (direct and indirect), sensitive data leakage through model output, insecure handling of model-generated output, training/RAG data poisoning, excessive agency in tool-calling/agentic setups, and system-prompt/instruction extraction. Unlike classic injection flaws, LLM vulnerabilities exploit the model's inability to reliably distinguish trusted instructions from untrusted data embedded in its context window — a malicious instruction hidden in a retrieved document, a user upload, or a web page the model reads can hijack its behavior even when the user-facing prompt looks benign. Impact ranges from system-prompt/IP disclosure and PII leakage from training or RAG data, to full account/data compromise when the LLM has tool-calling or agentic capabilities (sending emails, executing code, calling internal APIs) that an injected instruction can hijack. Because model behavior is probabilistic, this testing requires systematic, repeated probing rather than single-shot payloads, and every finding must be validated for reliable reproduction, not a one-off lucky jailbreak.

## Tools Integrated
- garak — automated LLM vulnerability scanner covering prompt injection, jailbreaks, data leakage, and toxic-output probes
- promptfoo — prompt injection/jailbreak regression testing and red-team test-case suites against target model endpoints
- Burp Suite (AI/LLM extensions, e.g., "Burp AI prompt injection" BApps) — intercepting and manipulating requests to LLM-backed application endpoints
- PyRIT (Python Risk Identification Toolkit) — Microsoft's automated adversarial probing framework for generative AI
- Rebuff / LLM Guard — testing whether prompt-injection defenses/guardrails can be bypassed
- Custom payload corpora (DAN-style jailbreaks, indirect injection via document/webpage/tool-output payloads, Unicode/encoding obfuscation payloads)
- mitmproxy/Burp — inspecting the raw API traffic to the underlying model provider to identify what context/system prompt/tool schema is actually being sent
- Manual red-teaming — multi-turn conversation probing that automated scanners miss (gradual context poisoning, persona-switching, multi-step social engineering of the model)

## Testing Approach

### Phase 1: Initial Assessment
- Map the full LLM application architecture: which model/provider is used, whether it's a raw chat interface, RAG pipeline, or agentic system with tool/function-calling, and what external data sources feed into the model's context (documents, web content, database records, user uploads)
- Identify every trust boundary where untrusted data enters the model's context window (user input, retrieved documents, third-party API responses, tool outputs, uploaded files) — these are the indirect prompt injection surface
- Determine what the model has access to and can act on: read-only Q&A vs. tool-calling capable of side effects (sending messages, modifying records, executing code, calling internal APIs) — the latter dramatically raises the severity ceiling ("excessive agency")
- Attempt to extract or infer the system prompt and any tool/function schema through direct questioning and indirect leakage techniques, to understand what guardrails and instructions are supposedly in place
- Establish what sensitive data could plausibly leak through the model (PII/PHI in training or RAG data, internal documents, credentials/API keys accidentally included in context, other users' conversation history)

### Phase 2: Vulnerability Identification
- Run garak/promptfoo automated probe suites to baseline common jailbreak, injection, and toxic-output vectors before manual deep-dives
- Test direct prompt injection: role-play/persona-override, instruction-override phrasing ("ignore previous instructions"), encoding obfuscation (base64/Unicode/leetspeak payloads), and multi-turn gradual jailbreaks that automated single-shot scanners miss
- Test indirect prompt injection by planting malicious instructions inside content the model will retrieve/read (a RAG document, an uploaded file, a web page, a tool's API response) and confirming whether the model executes the embedded instruction instead of treating it as inert data
- Probe for sensitive data leakage: ask the model to reveal system prompt contents, other users' data, training data verbatim recall, or internal configuration/API keys inadvertently placed in context
- Test insecure output handling: does the application render/execute model output unsanitized (stored XSS via model-generated HTML/markdown/JS, SSRF via model-suggested URLs the backend fetches, SQL/command injection if model output is passed to a query/shell without validation)
- If the model has tool-calling/agentic capability, attempt to manipulate it into invoking tools outside intended scope, with attacker-controlled parameters, or chaining tool calls to achieve an unintended side effect
- Test for excessive agency and missing human-in-the-loop confirmation on consequential actions (financial transactions, data deletion, external communications initiated autonomously)
- Check rate limiting and cost-abuse vectors (token-exhaustion/denial-of-wallet via oversized or recursive prompts)

### Phase 3: Exploitation & Validation
- Chain a successful indirect prompt injection through to a concrete impact: exfiltrate sensitive context data to an attacker-controlled endpoint, trigger an unauthorized tool call, or produce output that executes as stored XSS in the consuming application
- Demonstrate system-prompt/IP extraction with the verbatim leaked content as evidence, and show what guardrail bypass technique achieved it
- For agentic systems, demonstrate a full attack chain from injected instruction to real-world side effect (e.g., an email sent, a record modified, an internal API called) in a controlled manner that proves impact without causing lasting damage
- Re-run each successful jailbreak/injection at least 3-5 times across separate sessions to confirm reliability given LLM output non-determinism, and record the success rate rather than reporting a single lucky pass
- Validate insecure output handling findings by executing the full chain in a browser/consumer context (e.g., confirm the injected script actually fires when the model's markdown/HTML output is rendered)

### Phase 4: Documentation
- Record the exact prompt/payload sequence (including multi-turn context) required to reproduce each finding, since LLM exploits are often session/context-dependent
- Report the observed success rate across repeated attempts alongside the CVSS score, given the probabilistic nature of LLM behavior
- Map findings to the OWASP Top 10 for LLM Applications (e.g., LLM01 Prompt Injection, LLM02 Insecure Output Handling, LLM06 Sensitive Information Disclosure, LLM08 Excessive Agency) in addition to CWE/CVSS
- Provide remediation specific to LLM architecture: input/output guardrail placement, strict tool-calling schemas with parameter validation, human-in-the-loop gates for consequential actions, and context-window segregation between trusted instructions and untrusted retrieved content

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
- Full prompt/response transcript including any multi-turn context required to reproduce the finding
- garak/promptfoo scan output identifying which probe categories succeeded
- Success-rate data across repeated attempts (e.g., "7/10 sessions") given LLM output non-determinism
- Captured tool-call/function-call payloads showing an agentic system invoking an unintended action from injected content
- Screenshot or trace of leaked system prompt, sensitive context data, or rendered stored-XSS output resulting from unsanitized model output

## Remediation Guidance
- Input/output guardrail placement (e.g., prompt-injection detection layer, output sanitization before rendering)
- Strict tool/function-calling schemas with server-side parameter validation and human-in-the-loop confirmation for consequential actions
- Context segregation between trusted system instructions and untrusted retrieved/user-supplied content
- Output encoding/sanitization before rendering model output as HTML/markdown to prevent stored XSS
- Rate limiting and cost controls to mitigate token-exhaustion/denial-of-wallet abuse

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
