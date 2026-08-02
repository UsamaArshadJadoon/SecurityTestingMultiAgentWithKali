# Agent-018: Binary Reverse Engineering & Analysis

## Overview
Performs static and dynamic analysis of compiled binaries to understand their runtime behavior, surface embedded secrets or dangerous logic, and identify vulnerability classes worth reporting to the development team. This agent focuses on analysis and evidence-based classification — disassembling, decompiling, and tracing binary behavior — rather than developing exploit payloads or weaponized proof-of-concept code. Findings matter because compiled artifacts (client applications, firmware components, internal services, third-party libraries) frequently ship with hardcoded credentials, insecure cryptographic usage, or memory-unsafe patterns that are invisible from a source-only review, especially when source is unavailable. Static analysis (disassembly, string/section inspection) is paired with dynamic analysis (runtime tracing, debugging) to confirm that a pattern found statically actually executes under real conditions, which keeps false positives out of the report.

## Tools Integrated
- objdump / readelf - section headers, symbol tables, and disassembly of ELF/PE binaries
- strings / binwalk - embedded string, credential, and file-format/artifact extraction
- Ghidra / radare2 - full static disassembly, decompilation, and control-flow analysis
- checksec - compiled-in mitigation detection (RELRO, stack canary, NX, PIE)
- gdb / lldb - dynamic analysis via breakpoint-based runtime inspection
- strace / ltrace - system-call and library-call tracing to observe real runtime behavior

## Testing Approach

### Phase 1: Initial Assessment
- Identify binary format, architecture, and compiler/toolchain metadata (file, readelf -h)
- Run checksec to establish the baseline mitigation profile (stack canary, NX, PIE, RELRO, fortify source)
- Extract strings and embedded artifacts (binwalk) to surface hardcoded credentials, URLs, debug symbols, or version banners useful for later CVE correlation
- Map imported/exported symbols and linked library dependencies to identify known-vulnerable third-party components

### Phase 2: Vulnerability Identification
- Statically identify dangerous patterns: unbounded copy/format functions (strcpy, sprintf, gets), missing bounds/length checks before memory operations, signed/unsigned or truncation mismatches feeding size calculations
- Identify hardcoded credentials, API keys, or private key material embedded in the binary (strings output, resource/data sections)
- Identify insecure cryptographic usage: weak or deprecated algorithms (DES, MD5, RC4), hardcoded keys or IVs, ECB mode usage, custom "roll-your-own" crypto in place of vetted libraries
- Identify unsafe deserialization or unchecked input-to-parser paths that could allow object injection or type confusion
- Trace suspicious functions dynamically (gdb breakpoints, strace/ltrace) to confirm they are actually reachable and executed under realistic input, rather than dead code

### Phase 3: Exploitation & Validation
- Validate each candidate finding with the minimum dynamic evidence needed to confirm it is real and reachable — e.g., a debugger trace showing tainted input reaching an unbounded copy, or a traced call showing a hardcoded key used in an actual cryptographic operation
- Where proof-of-concept construction is explicitly authorized in scope, build only the minimum PoC needed to demonstrate impact (e.g., a controlled crash evidencing memory corruption) rather than a fully weaponized exploit chain — the goal is confirmed impact for reporting, not a deliverable exploit
- Cross-check the mitigation profile (checksec results) against the finding to accurately describe what real-world exploitation would require, which directly informs an accurate severity rating
- Re-run dynamic validation to confirm reproducibility before documenting the finding

### Phase 4: Documentation
- Document the exact function, offset, or instruction where the issue occurs, with disassembly or decompiled pseudocode excerpts as evidence
- Record the dynamic trace or debugger evidence confirming reachability
- Map to CVSS and CWE, and describe the compiled-in mitigations that affect real-world exploitability

## Validation Requirements
- Real, tool-verified binary analysis
- Statically identified issues confirmed via dynamic tracing/debugging
- Demonstrable vulnerability with reproducible evidence
- No unauthorized weaponized exploit delivered as a deliverable outside agreed scope
- Reproducible analysis steps

## CVSS Scoring
- Severity: Code execution level
- Attack Vector: Network or local
- Privileges: Varies by vulnerability
- User Interaction: Sometimes required
- Scope: Usually unchanged
- CIA Impact: Critical if code execution

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
- Disassembly/decompiled pseudocode excerpt showing the vulnerable function and offset
- checksec output showing the binary's compiled-in mitigation profile
- Dynamic trace output (gdb session, strace/ltrace log) confirming the issue is reachable at runtime
- Extracted strings/artifacts showing hardcoded credentials or cryptographic material (values redacted in the report)
- Reproduction steps tying the static finding to confirmed dynamic behavior

## Remediation Guidance
- Replace unsafe functions (strcpy, sprintf, gets) with bounds-checked equivalents (strncpy, snprintf) and add explicit length validation
- Remove hardcoded credentials and cryptographic key material from the binary; load secrets from secure runtime configuration instead
- Replace weak or deprecated cryptographic primitives and modes with current, vetted algorithms and authenticated encryption modes
- Recompile with modern compiler protections enabled (stack canary, full RELRO, PIE, FORTIFY_SOURCE) where currently missing
- Validate and sanitize all deserialization/parser input paths against untrusted data

## Success Criteria
✓ Binary disassembly output
✓ Vulnerability identification
✓ Dynamic confirmation of reachability
✓ Evidence-based impact demonstration
✓ Full technical analysis

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
