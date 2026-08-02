# Agent-0013-Deserialization-RCE: Deserialization RCE

## Overview
Insecure deserialization occurs when an application reconstructs objects from untrusted serialized data (session cookies, hidden form fields, API parameters, cache entries, or message-queue payloads) without validating or restricting which classes/types can be instantiated. Because deserialization can trigger arbitrary constructors, magic methods (`__wakeup`/`__destruct` in PHP, `readObject` in Java, `__reduce__` in Python pickle), or property setters as a side effect of object construction, an attacker who controls the serialized blob and can identify a suitable "gadget chain" in the application's dependencies can achieve remote code execution without needing any other vulnerability. This affects Java (Commons Collections, Spring, Groovy gadget chains), .NET (ViewState, BinaryFormatter/JSON.NET `TypeNameHandling`), PHP (POP chains via `phpggc`), Python (`pickle`/`yaml.load`), and Node (`node-serialize`/`funcster`). This agent covers safe detection (OOB callback) before escalating to full RCE payloads, since naive testing can crash the application.

## Tools Integrated
- ysoserial (Java gadget chain generator: CommonsCollections1-7, Spring1/2, Groovy1, ROME, Jdk7u21, Hibernate1/2)
- ysoserial.net for .NET (BinaryFormatter, ViewState via `--generator=ViewState` when `machineKey` is known or default)
- phpggc for PHP POP-chain gadget generation against common framework/library classes
- marshalsec for Java JNDI/RMI-related deserialization gadget research
- Burp Suite with the Java Deserialization Scanner / Freddy extension for automated detection
- Interactsh/interact.sh for safe out-of-band confirmation prior to sending a destructive RCE payload

## Testing Approach

### Phase 1: Initial Assessment
- Identify likely serialized-data sinks: session cookies, hidden form fields, API request parameters, cache/session storage backends, message-queue payloads
- Recognize serialization format signatures: Java (`rO0AB` base64 prefix or `0xACED` magic bytes), .NET ViewState (`__VIEWSTATE` parameter), PHP `serialize()` format (`O:8:"ClassName"`), Python pickle opcode markers, Node `_$$ND_FUNC$$_` (funcster) markers
- Fingerprint the language/framework and enumerate loaded libraries/dependency versions (via verbose error stack traces, actuator/management endpoints, or dependency-confusion probing) to select a plausible gadget chain
- For .NET specifically, determine whether ViewState MAC validation and encryption are enabled, and whether the `machineKey` is default, leaked, or derivable

### Phase 2: Vulnerability Identification
- Send a deliberately malformed serialized payload first to trigger a verbose deserialization error that may reveal class names and library versions without risking a crash
- Use a safe out-of-band detection payload (DNS/HTTP callback gadget, e.g., ysoserial `URLDNS` or a JNDI lookup gadget) via each candidate gadget chain to confirm deserialization occurs before attempting a full RCE payload
- Systematically test candidate gadget chains against the identified library set (Java: CommonsCollections1-7, Spring, Groovy, ROME, Jdk7u21, Hibernate; select based on confirmed classpath dependencies)
- For .NET, if `machineKey` is known/default or MAC validation is disabled, forge a ViewState payload with ysoserial.net targeting the confirmed gadget (e.g., `ObjectStateFormatter`, `LosFormatter`)
- For PHP, identify autoloaded classes with exploitable magic methods (`__wakeup`, `__destruct`, `__toString`) reachable from the application's dependencies, then generate a POP chain with phpggc
- For Python, identify any `pickle.loads()` or `yaml.load()` (without `SafeLoader`) call reachable with user-controlled input
- For Node, identify `node-serialize`/`funcster`-style unserialize calls on user-controlled input

### Phase 3: Exploitation & Validation
- Escalate the confirmed OOB detection payload to a full gadget-chain RCE payload (command execution or reverse shell), capturing command output as proof
- Where applicable, demonstrate ViewState forgery leading to RCE on .NET targets, or a PHPGGC POP chain achieving file write (webshell) or direct command execution on PHP targets
- Capture concrete command-execution evidence: `id`/`whoami` output, or an interactive reverse-shell callback to a controlled listener
- Assess blast radius: because the same vulnerable library is typically shared across multiple endpoints, confirm and document whether the same gadget chain applies to other identified serialization sinks

### Phase 4: Documentation
- Document the serialized payload (base64), the exact tool/command used to generate it (ysoserial/ysoserial.net/phpggc invocation), and the resulting execution evidence
- CVSS 3.1 scoring — typically Critical given unauthenticated RCE potential; adjust Privileges Required/Attack Complexity based on whether the sink requires authentication or a specific gadget is version-dependent
- OWASP (A08:2021 Software and Data Integrity Failures) / CWE-502 mapping
- Remediation guidance including the specific vulnerable library/version identified
- Developer-actionable recommendations covering both the immediate fix and safe-deserialization architecture

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
- Serialized payload bytes (base64-encoded) submitted to the target sink
- Exact gadget-generation command used (ysoserial/ysoserial.net/phpggc invocation and gadget chain name)
- Out-of-band callback interaction log confirming deserialization prior to full RCE escalation
- Command execution output or reverse-shell session screenshot demonstrating RCE
- Identified vulnerable library name and version supporting the exploited gadget chain

## Remediation Guidance
- Never deserialize untrusted data using native/binary serialization formats; prefer JSON or another data-only format with strict schema validation
- Where native deserialization is unavoidable, enforce allowlist-based deserialization filters (Java `ObjectInputFilter`, .NET custom `SerializationBinder` allowlist)
- Enable ViewState MAC validation and encryption with a unique, non-default `machineKey` per application/environment
- Upgrade or remove libraries known to contain exploitable gadget chains once a specific vulnerable version is identified
- Use safe-by-default loaders where the language provides them (`yaml.safe_load`, avoiding `pickle` entirely for untrusted input)

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
