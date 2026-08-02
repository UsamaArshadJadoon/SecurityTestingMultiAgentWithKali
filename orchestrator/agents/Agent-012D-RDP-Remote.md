# Agent-012D-RDP-Remote: RDP Remote

## Overview
Targets Remote Desktop Protocol and adjacent remote-access services (RDP 3389, VNC 5900, WinRM 5985/5986) that provide direct interactive or command access to hosts. Weak authentication, missing Network Level Authentication (NLA), legacy security-layer support, and unpatched RDP services (BlueKeep-class flaws) can lead directly to unauthenticated remote code execution or credential-based full host takeover. Because these services grant an attacker a full interactive session or shell rather than partial application access, they are frequently the single highest-impact finding in an internal or externally-exposed engagement.

## Tools Integrated
- nmap (rdp-enum-encryption, rdp-ntlm-info, vnc-info NSE scripts) - protocol/version and NLA/encryption-level fingerprinting
- xfreerdp / rdesktop - manual RDP connection testing, NLA behavior validation, session interaction
- hydra / ncrack / medusa (rdp module) - credential brute force and password spraying
- CrackMapExec / NetExec (rdp/winrm modules) - credential validation, RDP status check, WinRM command execution
- RDPY / PyRDP - RDP protocol MITM and session recording for downgrade/credential-capture testing
- Metasploit (rdp_scanner, cve_2019_0708_bluekeep_rce, ms12_020_maxlen_rdp_dos) - vulnerability scanning and PoC exploitation
- Evil-WinRM - authenticated WinRM shell access and lateral-movement validation
- vncviewer / vncsnapshot - VNC authentication testing and screen-capture evidence

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint the RDP security layer and encryption level in use (RDP Security Layer vs TLS vs CredSSP/NLA) via `rdp-enum-encryption`
- Determine whether Network Level Authentication is enforced, i.e., whether the logon screen is reachable without prior credential negotiation
- Identify OS/build version from the RDP handshake to map against known RDP CVEs (BlueKeep CVE-2019-0708, the DejaBlue family)
- Enumerate adjacent remote-access services on the same host (WinRM, VNC, third-party remote-support agents) for a fuller attack-surface picture
- Inspect certificate/TLS configuration where RDP is set to use the TLS security layer

### Phase 2: Vulnerability Identification
- Missing NLA: confirm the target allows connection attempts to reach the logon screen without prior authentication, increasing exposure to brute force and unauthenticated RCE
- Weak/default/reused credential exposure via controlled, lockout-aware brute force or spray using usernames sourced from other enumeration agents (LDAP/SMB)
- Unpatched RDP service vulnerable to known pre-auth RCE (BlueKeep) or DoS (MS12-020) — perform a version-matched CVE check before any exploitation attempt
- VNC with no authentication or a weak/default password (common misconfiguration, including blank auth)
- WinRM (5985/5986) accepting Basic auth over unencrypted HTTP, or accepting the same weak/reused credentials as RDP
- Legacy protocol downgrade: server accepting the RDP Security Layer (RC4) instead of enforcing CredSSP/TLS, enabling MITM credential capture

### Phase 3: Exploitation & Validation
- If a BlueKeep/DejaBlue-class vulnerability is confirmed by version, run the Metasploit scanner module (non-exploitative check) first; only proceed to the RCE module with explicit authorization and in a controlled window given crash/DoS risk to the target
- Demonstrate credential compromise via successful authenticated login (xfreerdp/Evil-WinRM) using discovered or sprayed credentials, capturing session evidence (login screenshot, `whoami`/`hostname` output)
- Chain RDP/WinRM credential success into lateral-movement validation by confirming the same credentials grant access to additional hosts, demonstrating password-reuse impact
- For VNC, demonstrate unauthenticated screen access and capture a screenshot as proof without further interaction
- Where NLA is missing, document the increased exposure and, only where authorized, demonstrate an unauthenticated connection reaching the logon prompt as evidence

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

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
- xfreerdp/rdesktop session logs and screenshots showing successful authentication or unauthenticated logon-screen reachability
- nmap rdp-enum-encryption/rdp-ntlm-info output showing security layer, NLA status, and OS build
- Metasploit scanner output confirming a CVE-matched vulnerable version (prior to any exploit attempt)
- Brute-force/spray attempt logs showing successful credential pairs (redacted) and attempts-per-account respecting lockout policy
- WinRM/VNC session evidence (command output, screen captures) demonstrating access

## Remediation Guidance
- Enforce Network Level Authentication and require the CredSSP/TLS security layer; disable RDP Security Layer/RC4 fallback
- Apply current security patches immediately for any host vulnerable to BlueKeep/DejaBlue-class RCE
- Eliminate direct internet exposure of RDP/VNC/WinRM; require VPN or jump-host/bastion access with MFA
- Enforce strong, unique, non-reused credentials and account lockout policies across all remote-access services
- Enable WinRM over HTTPS only with strong authentication (Kerberos/Negotiate); disable Basic auth over HTTP
- Require strong authentication for VNC or disable it where remote-support tooling is not actively needed

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
