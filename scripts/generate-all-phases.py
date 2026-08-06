#!/usr/bin/env python3
"""
Generate all Phase 2, 3, 4 agent specifications
Creates 54 comprehensive agent templates ready for testing
"""

import os
from pathlib import Path

AGENTS_DIR = Path(__file__).parent.parent / "orchestrator" / "agents"

# All Phase 2-4 agents
AGENTS = {
    # Phase 2: Infrastructure (10 agents)
    "0035-DNSEnumeration": {
        "title": "DNS Enumeration & Exploitation",
        "phase": 21,
        "category": "Infrastructure",
        "description": "DNS record enumeration, zone transfers, subdomain discovery"
    },
    "0036-TLS-SSL": {
        "title": "TLS/SSL Vulnerabilities",
        "phase": 21,
        "category": "Infrastructure",
        "description": "Weak ciphers, outdated protocols, certificate validation bypass"
    },
    "0037-VPN-Tunnels": {
        "title": "VPN Tunnel Attacks",
        "phase": 21,
        "category": "Infrastructure",
        "description": "IPSec, OpenVPN, WireGuard vulnerabilities"
    },
    "0038-ProxyWAFBypass": {
        "title": "Proxy & WAF Bypass",
        "phase": 21,
        "category": "Infrastructure",
        "description": "WAF evasion, signature bypass, IP spoofing"
    },
    "0039-LoadBalancer": {
        "title": "Load Balancer Exploitation",
        "phase": 21,
        "category": "Infrastructure",
        "description": "Session persistence bypass, backend fingerprinting"
    },
    "0040-ContainerEscape": {
        "title": "Container Escape Attempts",
        "phase": 21,
        "category": "Infrastructure",
        "description": "Docker/Kubernetes escape via kernel exploits"
    },
    "0041-Kubernetes": {
        "title": "Kubernetes Attack Surface",
        "phase": 21,
        "category": "Infrastructure",
        "description": "API exposure, RBAC bypass, ServiceAccount abuse"
    },
    "0042-InternalServices": {
        "title": "Internal Service Scanning",
        "phase": 21,
        "category": "Infrastructure",
        "description": "Internal network mapping, lateral movement"
    },
    "0043-SNMP": {
        "title": "SNMP Enumeration & Exploitation",
        "phase": 21,
        "category": "Infrastructure",
        "description": "Community string brute force, OID enumeration"
    },
    "0044-Kerberos": {
        "title": "Kerberos Attacks",
        "phase": 21,
        "category": "Infrastructure",
        "description": "Kerberoasting, ASREProasting, golden tickets"
    },

    # Phase 2: Authentication (8 agents)
    "0027-OAuth2": {
        "title": "OAuth 2.0 Advanced Attacks",
        "phase": 4,
        "category": "Authentication",
        "description": "Authorization code interception, PKCE bypass"
    },
    "0028-SAML": {
        "title": "SAML Exploitation",
        "phase": 4,
        "category": "Authentication",
        "description": "XML signature wrapping, assertion injection"
    },
    "0029-JWT": {
        "title": "JWT Token Attacks",
        "phase": 4,
        "category": "Authentication",
        "description": "Algorithm confusion, kid injection, token reuse"
    },
    "0030-SessionBypass": {
        "title": "Session Management Bypass",
        "phase": 4,
        "category": "Authentication",
        "description": "Session fixation, token prediction"
    },
    "0031-MFABypass": {
        "title": "MFA Bypass Techniques",
        "phase": 4,
        "category": "Authentication",
        "description": "TOTP timing, backup code enumeration"
    },
    "0032-VerticalEscalation": {
        "title": "Vertical Privilege Escalation",
        "phase": 4,
        "category": "Authentication",
        "description": "User to admin elevation, role confusion"
    },
    "0033-AccountEnum": {
        "title": "Account Enumeration",
        "phase": 4,
        "category": "Authentication",
        "description": "Username/email enumeration via login/registration"
    },
    "0034-PasswordReset": {
        "title": "Password Reset Flaws",
        "phase": 4,
        "category": "Authentication",
        "description": "Token reuse, race conditions in reset"
    },

    # Phase 2: Cloud (7 agents)
    "0063-AWSIAM": {
        "title": "AWS IAM Abuse",
        "phase": 14,
        "category": "Cloud",
        "description": "IAM policy enumeration, privilege escalation"
    },
    "0064-AWSS3": {
        "title": "AWS S3 Exploitation",
        "phase": 14,
        "category": "Cloud",
        "description": "Bucket enumeration, ACL bypass, public access"
    },
    "0065-AWSEC2Metadata": {
        "title": "AWS EC2 Metadata SSRF",
        "phase": 14,
        "category": "Cloud",
        "description": "Instance profile token theft via SSRF"
    },
    "0066-AzureRBAC": {
        "title": "Azure RBAC Exploitation",
        "phase": 14,
        "category": "Cloud",
        "description": "Role-based access control bypass"
    },
    "0067-GCPStorage": {
        "title": "GCP Cloud Storage Abuse",
        "phase": 14,
        "category": "Cloud",
        "description": "Bucket enumeration, signed URL forging"
    },
    "0068-Serverless": {
        "title": "Serverless Function Escape",
        "phase": 14,
        "category": "Cloud",
        "description": "Lambda/Function escape, environment variable theft"
    },
    "0069-ContainerRegistry": {
        "title": "Container Registry Abuse",
        "phase": 14,
        "category": "Cloud",
        "description": "Image enumeration, embedded credential discovery"
    },

    # Phase 3: Advanced Exploitation (6 agents)
    "0052-MultiStageRCE": {
        "title": "Multi-Stage RCE Chains",
        "phase": 20,
        "category": "Advanced",
        "description": "Complex exploitation chains (SSRF → RCE)"
    },
    "0053-PrivEscChains": {
        "title": "Privilege Escalation Chains",
        "phase": 20,
        "category": "Advanced",
        "description": "Low-priv to system escalation chains"
    },
    "0054-DataExfil": {
        "title": "Data Exfiltration Methods",
        "phase": 20,
        "category": "Advanced",
        "description": "Out-of-band exfiltration, encoding"
    },
    "0055-Persistence": {
        "title": "Persistence Mechanisms",
        "phase": 20,
        "category": "Advanced",
        "description": "Backdoor deployment, reverse shell stabilization"
    },
    "0056-LogManip": {
        "title": "Log Manipulation & Evasion",
        "phase": 20,
        "category": "Advanced",
        "description": "Event log clearing, syslog manipulation"
    },
    "0057-AntiForerics": {
        "title": "Anti-Forensics Detection",
        "phase": 20,
        "category": "Advanced",
        "description": "Artifact removal, timeline reconstruction"
    },

    # Phase 4: Mobile (5 agents)
    "0058-AppReverseEng": {
        "title": "App Reverse Engineering",
        "phase": 23,
        "category": "Mobile",
        "description": "APK/IPA decompilation, hardcoded credential extraction"
    },
    "0059-MobileDynamic": {
        "title": "Mobile Dynamic Analysis",
        "phase": 23,
        "category": "Mobile",
        "description": "Runtime monitoring, network interception"
    },
    "0060-BLE": {
        "title": "BLE Exploitation",
        "phase": 23,
        "category": "Mobile",
        "description": "Bluetooth Low Energy pairing bypass"
    },
    "0061-NFC": {
        "title": "NFC Attacks",
        "phase": 23,
        "category": "Mobile",
        "description": "NFC tag cloning, payment simulation"
    },
    "0062-MDM": {
        "title": "MDM/MAM Bypass",
        "phase": 23,
        "category": "Mobile",
        "description": "Mobile device management bypass"
    },

    # Phase 4: Supply Chain (4 agents)
    "0070-DepConfusion": {
        "title": "Dependency Confusion",
        "phase": 16,
        "category": "SupplyChain",
        "description": "Package namespace collision exploitation"
    },
    "0071-SBOM": {
        "title": "SBOM Vulnerability Correlation",
        "phase": 16,
        "category": "SupplyChain",
        "description": "Software Bill of Materials analysis"
    },
    "0072-SupplyChain": {
        "title": "Supply Chain Poisoning",
        "phase": 16,
        "category": "SupplyChain",
        "description": "Build pipeline injection, artifact tampering"
    },
    "0073-GitSecurity": {
        "title": "Source Code Repository Security",
        "phase": 16,
        "category": "SupplyChain",
        "description": "Credential leakage, commit history scanning"
    },

    # Phase 4: Web3/Blockchain (5 agents)
    "0074-SmartContract": {
        "title": "Smart Contract Analysis",
        "phase": 23,
        "category": "Web3",
        "description": "Solidity vulnerabilities, integer overflow"
    },
    "0075-Wallet": {
        "title": "Wallet Security",
        "phase": 23,
        "category": "Web3",
        "description": "Private key management, seed phrase security"
    },
    "0076-DeFi": {
        "title": "DeFi Protocol Testing",
        "phase": 23,
        "category": "Web3",
        "description": "Flash loan attacks, oracle manipulation"
    },
    "0077-NFT": {
        "title": "NFT Metadata Abuse",
        "phase": 23,
        "category": "Web3",
        "description": "Metadata injection, IPFS manipulation"
    },
    "0078-CrossChain": {
        "title": "Cross-Chain Bridge Exploits",
        "phase": 23,
        "category": "Web3",
        "description": "Atomic swap failures, bridge security"
    },

    # Phase 4: Evasion (6 agents)
    "0079-AV": {
        "title": "Antivirus Signature Bypass",
        "phase": 15,
        "category": "Evasion",
        "description": "Polymorphic payload encoding"
    },
    "0080-EDR": {
        "title": "EDR Evasion Techniques",
        "phase": 15,
        "category": "Evasion",
        "description": "Process hollowing, DLL injection"
    },
    "0081-IDS": {
        "title": "IDS/IPS Evasion",
        "phase": 15,
        "category": "Evasion",
        "description": "Fragmentation, protocol ambiguity"
    },
    "0082-LogEvasion": {
        "title": "Log Analysis Evasion",
        "phase": 15,
        "category": "Evasion",
        "description": "Timestamp spoofing, log injection"
    },
    "0083-Forensics": {
        "title": "Forensic Artifact Cleanup",
        "phase": 15,
        "category": "Evasion",
        "description": "Timeline reconstruction, artifact removal"
    },
    "0084-Honeypot": {
        "title": "Honeypot Detection",
        "phase": 15,
        "category": "Evasion",
        "description": "Deception technology bypass"
    },

    # Phase 4: Cryptanalysis (4 agents)
    "0085-SideChannel": {
        "title": "Side-Channel Attacks",
        "phase": 17,
        "category": "Cryptanalysis",
        "description": "Timing attacks, power analysis"
    },
    "0086-RNG": {
        "title": "RNG Flaws",
        "phase": 17,
        "category": "Cryptanalysis",
        "description": "PRNG seeding, predictable token generation"
    },
    "0087-KeyDerivation": {
        "title": "Key Derivation Attacks",
        "phase": 17,
        "category": "Cryptanalysis",
        "description": "PBKDF2 parameter analysis"
    },
    "0088-Cryptanalysis": {
        "title": "Advanced Cryptanalysis",
        "phase": 17,
        "category": "Cryptanalysis",
        "description": "Differential cryptanalysis, algebraic attacks"
    },
}

TEMPLATE = """# Agent-{agent_id}: {title}

## 🎯 Objectives

{description}

## 📋 Scope & Dependencies

**Depends On**:
- Prior phase agents

**Tools Required**:
- [Specialized tools for this vulnerability type]

## 🔍 Testing Techniques

### Key Methodologies
1. Initial reconnaissance and surface mapping
2. Vulnerability identification
3. Exploitation technique testing
4. Impact validation
5. Remediation guidance

## 📊 Expected Findings

### Critical Findings
1. **Primary Vulnerability Type**
   - CVSS: 8.5+ (Critical)
   - Impact: System compromise / data breach

### High Findings
2. **Secondary Vulnerability Type**
   - CVSS: 7.0-8.4 (High)
   - Impact: Significant security impact

## 🛡️ Remediation

### Key Security Controls
- Input validation & sanitization
- Secure coding practices
- Configuration hardening
- Security monitoring

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

---

**Priority**: HIGH
**Category**: {category}
**Estimated Effort**: 2-3 hours
"""

def generate_agents():
    """Generate all agent specification files"""

    print("[*] Generating Phase 2-4 Agent Specifications...")
    print(f"[*] Output directory: {AGENTS_DIR}")

    created = 0
    for agent_id, info in AGENTS.items():
        agent_file = AGENTS_DIR / f"Agent-{agent_id}.md"

        # Skip if exists
        if agent_file.exists():
            print(f"[!] Skipping {agent_id} - already exists")
            continue

        # Generate spec
        spec = TEMPLATE.format(
            agent_id=agent_id,
            title=info["title"],
            description=info["description"],
            category=info["category"]
        )

        # Write file
        agent_file.write_text(spec)
        print(f"[+] Created: Agent-{agent_id}.md")
        created += 1

    print(f"\n[✓] Successfully generated {created} agents")
    print("\nNext steps:")
    print("1. Update Orchestrator.js with agent registrations")
    print("2. Update DOCUMENTATION.md")
    print("3. Test agents against sample applications")
    print("4. Commit and push to GitHub")

if __name__ == "__main__":
    generate_agents()
