#!/usr/bin/env python3
"""
Generate Phase 1 Agent Specifications
Creates all critical API security and exploitation agents
"""

import os
import sys
from pathlib import Path

AGENTS_DIR = Path(__file__).parent.parent / "orchestrator" / "agents"

# Phase 1 Agent Specifications
PHASE1_AGENTS = {
    "003J-API-InputValidation": {
        "title": "API Input Validation & Injection Deep-Dive",
        "focus": "API payload injection, prototype pollution, command injection",
        "tools": "sqlmap, jq, burp-suite, nuclei, custom Python",
        "techniques": [
            "JSON/XML/Protocol Buffer injection",
            "Prototype pollution in Node.js",
            "Command injection through parameters",
            "LDAP/NoSQL injection via REST",
            "Type confusion attacks"
        ],
        "dependencies": ["Agent-001", "Agent-003A"],
        "priority": "CRITICAL"
    },
    "003K-API-ResponseHandling": {
        "title": "API Response Handling & Information Disclosure",
        "focus": "Error messages, sensitive data exposure, timing attacks",
        "tools": "curl, mitmproxy, jq, custom Python scripts",
        "techniques": [
            "Information disclosure in errors",
            "Sensitive data in responses",
            "Timing attacks on responses",
            "Response body size analysis"
        ],
        "dependencies": ["Agent-001", "Agent-003A"],
        "priority": "HIGH"
    },
    "003L-API-BusinessLogic": {
        "title": "API Business Logic Flaws",
        "focus": "Race conditions, workflow manipulation, amount abuse",
        "tools": "burp-suite, custom Python, multiburst",
        "techniques": [
            "API endpoint chaining",
            "Race conditions in transactions",
            "Workflow manipulation",
            "Double-spend attacks",
            "Amount/quantity manipulation"
        ],
        "dependencies": ["Agent-001", "Agent-003A"],
        "priority": "CRITICAL"
    },
    "003M-API-Documentation": {
        "title": "API Documentation & Specification Exposure",
        "focus": "Swagger/OpenAPI disclosure, endpoint enumeration",
        "tools": "nuclei, ffuf, wfuzz, graphql-voyager",
        "techniques": [
            "Swagger/OpenAPI spec disclosure",
            "API versioning issues",
            "Endpoint enumeration",
            "GraphQL introspection bypass"
        ],
        "dependencies": ["Agent-001", "Agent-003"],
        "priority": "HIGH"
    },
    "003N-API-Serialization": {
        "title": "API Serialization Vulnerabilities",
        "focus": "Deserialization in APIs, gadget chains",
        "tools": "ysoserial, frida, burp-suite",
        "techniques": [
            "Java deserialization",
            "Python pickle exploitation",
            "PHP object injection",
            "YAML deserialization",
            "Protocol buffer exploitation"
        ],
        "dependencies": ["Agent-001", "Agent-003A"],
        "priority": "CRITICAL"
    },
    "003O-API-Dependencies": {
        "title": "API Framework & Dependency Vulnerabilities",
        "focus": "Vulnerable libraries, framework exploits",
        "tools": "sonarqube, snyk, npm audit, pip-audit",
        "techniques": [
            "Framework vulnerabilities",
            "Dependency exploitation",
            "SCA analysis",
            "Plugin vulnerabilities"
        ],
        "dependencies": ["Agent-001", "Agent-003"],
        "priority": "HIGH"
    },
    "0015-TemplateLanguageSST I": {
        "title": "Template Language SSTI Exploitation",
        "focus": "Jinja2, Mako, Velocity, Freemarker SSTI to RCE",
        "tools": "tplmap, burp-suite, custom Python",
        "techniques": [
            "Jinja2/Mako SSTI",
            "Blind SSTI detection",
            "Template injection to RCE",
            "Filter bypass techniques"
        ],
        "dependencies": ["Agent-001", "Agent-002"],
        "priority": "CRITICAL"
    },
    "0017-PythonPickle": {
        "title": "Python Pickle Deserialization RCE",
        "focus": "Python pickle exploitation and RCE chains",
        "tools": "frida, custom Python, pickle analyzer",
        "techniques": [
            "Pickle deserialization RCE",
            "Gadget chain discovery",
            "Indirect object reference",
            "Django/Celery exploitation"
        ],
        "dependencies": ["Agent-001", "Agent-0013"],
        "priority": "HIGH"
    },
    "0018-PHPObjectInjection": {
        "title": "PHP Object Injection & POP Chains",
        "focus": "POP chain discovery and exploitation",
        "tools": "phpggc, burp-suite, custom analysis",
        "techniques": [
            "POP chain discovery",
            "Autoloader exploitation",
            "Magic method abuse",
            "__wakeup() bypass"
        ],
        "dependencies": ["Agent-001", "Agent-002"],
        "priority": "HIGH"
    },
    "0019-ExpressionLanguage": {
        "title": "Expression Language Injection",
        "focus": "Spring EL, OGNL, MVEL injection",
        "tools": "custom exploits, burp-suite",
        "techniques": [
            "Spring EL injection",
            "OGNL (Struts2) injection",
            "MVEL injection",
            "Bypass filter techniques"
        ],
        "dependencies": ["Agent-001", "Agent-002A"],
        "priority": "HIGH"
    },
    "0020-CommandInjectionVariants": {
        "title": "Command Injection Variants & Out-of-Band Exfiltration",
        "focus": "Blind command injection, DNS/HTTP exfiltration",
        "tools": "commix, custom payloads, burp-suite",
        "techniques": [
            "Blind command injection",
            "OOB exfiltration (DNS/HTTP)",
            "Metacharacter variations",
            "Windows vs Linux payloads"
        ],
        "dependencies": ["Agent-001", "Agent-002G"],
        "priority": "CRITICAL"
    },
    "0021-FileWriteRCE": {
        "title": "File Write to Remote Code Execution",
        "focus": "Config/code file write exploitation",
        "tools": "burp-suite, custom scripts",
        "techniques": [
            "web.config write",
            ".htaccess manipulation",
            "Log file poisoning",
            ".jsp/.php/.aspx upload"
        ],
        "dependencies": ["Agent-001", "Agent-002G"],
        "priority": "HIGH"
    },
    "0022-RaceConditionExploit": {
        "title": "Race Condition & TOCTOU Exploitation",
        "focus": "Concurrent request exploitation",
        "tools": "turbo-intruder, multiburst, custom Python",
        "techniques": [
            "TOCTOU race conditions",
            "Synchronization bypasses",
            "Transaction race conditions",
            "Business logic races"
        ],
        "dependencies": ["Agent-001", "Agent-003A"],
        "priority": "CRITICAL"
    },
    "0023-CryptographicExploits": {
        "title": "Cryptographic Attacks & Weaknesses",
        "focus": "Weak ciphers, oracle attacks, key derivation",
        "tools": "hashcat, john, paddingoracle",
        "techniques": [
            "Weak cipher detection",
            "Padding oracle attacks",
            "Chosen ciphertext attacks",
            "Key derivation weaknesses"
        ],
        "dependencies": ["Agent-001", "Agent-025"],
        "priority": "MEDIUM"
    },
    "0024-PrototypePollution": {
        "title": "Prototype Pollution Attacks",
        "focus": "JavaScript/Node.js prototype pollution",
        "tools": "nuclei, custom Node.js exploits",
        "techniques": [
            "Prototype pollution",
            "Gadget chain exploitation",
            "JSON.parse() abuse",
            "Framework-specific attacks"
        ],
        "dependencies": ["Agent-001", "Agent-003A"],
        "priority": "HIGH"
    },
}

def generate_agent_spec(agent_id: str, agent_info: dict) -> str:
    """Generate agent specification markdown"""

    template = f"""# Agent-{agent_id}: {agent_info['title']}

## 🎯 Objectives

{agent_info['focus']}

## 📋 Scope & Dependencies

**Depends On**:
{chr(10).join(f"- {dep}" for dep in agent_info['dependencies'])}

**Tools Required**:
- {agent_info['tools'].replace(', ', chr(10) + '- ')}

## 🔍 Testing Techniques

### Key Techniques
{chr(10).join(f"- {tech}" for tech in agent_info['techniques'])}

## 📊 Expected Findings

### Critical Findings
1. **Primary Vulnerability Type**
   - CVSS: 8.5+ (Critical)
   - Impact: System compromise / Data breach

### High Findings
2. **Secondary Vulnerability Type**
   - CVSS: 7.0-8.4 (High)
   - Impact: Significant security impact

## 🛡️ Remediation

### Key Fix Areas
- Input validation & sanitization
- Secure coding practices
- Library/framework updates
- Security configuration

## ✅ Success Criteria

- [ ] Vulnerability identified and confirmed
- [ ] Proof of concept created
- [ ] Clear evidence documented
- [ ] Remediation steps provided
- [ ] Code examples included
- [ ] CVSS score justified

## 🔗 Related References

- OWASP Top 10
- CWE Database
- MITRE ATT&CK
- CVE Database

---

**Priority**: {agent_info['priority']}
**Estimated Effort**: 2-3 hours implementation + testing
"""
    return template

def main():
    """Generate all Phase 1 agent specifications"""

    print("[*] Generating Phase 1 Agent Specifications...")
    print(f"[*] Output directory: {AGENTS_DIR}")

    created = 0
    for agent_id, agent_info in PHASE1_AGENTS.items():
        agent_file = AGENTS_DIR / f"Agent-{agent_id}.md"

        # Skip if already exists
        if agent_file.exists():
            print(f"[!] Skipping {agent_id} - already exists")
            continue

        # Generate spec
        spec = generate_agent_spec(agent_id, agent_info)

        # Write file
        agent_file.write_text(spec)
        print(f"[+] Created: Agent-{agent_id}.md")
        created += 1

    print(f"\n[✓] Successfully generated {created} Phase 1 agents")
    print("\nNext steps:")
    print("1. Review generated agents in orchestrator/agents/")
    print("2. Update Orchestrator.js with new agent registrations")
    print("3. Update DOCUMENTATION.md")
    print("4. Test agents against sample applications")
    print("5. Commit and push to GitHub")

if __name__ == "__main__":
    main()
