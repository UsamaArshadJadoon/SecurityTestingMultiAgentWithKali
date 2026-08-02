# Agent-047-VPN-RemoteAccess: VPN & Remote Access Security

## Overview
Assesses every path an authorized remote user (or an attacker impersonating one) can use to reach the internal network from outside it: IPsec/OpenVPN/WireGuard VPN gateways, split-tunneling configurations, and remote-desktop/application-gateway products (RDP Gateway, Citrix, VPN web portals). This surface is disproportionately attractive to real attackers because it is designed to grant broad internal-network access from the public internet with only a credential check standing in the way — a single weak VPN credential or an unpatched gateway CVE routinely leads directly to full internal network access, bypassing every other perimeter control tested elsewhere in the engagement. This agent validates both the cryptographic/protocol configuration of the remote-access technology itself and the credential/session controls guarding entry through it.

## Tools Integrated
- nmap (with `ike-version`, `vpn-*` NSE scripts) — VPN gateway fingerprinting and IKE/IPsec version/transform enumeration
- ike-scan — IKEv1/IKEv2 handshake probing, aggressive-mode PSK hash capture, and transform-set enumeration against IPsec gateways
- hydra / medusa — credential brute-forcing against VPN portal login forms, RDP Gateway, Citrix StoreFront, and SSL-VPN web authentication endpoints (rate-limited and scoped to authorized accounts/test windows only)
- Hashcat / John the Ripper — offline cracking of captured IKE aggressive-mode PSK hashes and any recovered credential hashes
- OpenVPN/WireGuard config review tooling — manual/scripted review of `.ovpn`/`wg0.conf` files for weak cipher suites, missing `tls-auth`/`tls-crypt`, disabled certificate verification, or static/shared PSKs
- Scapy — crafting custom IKE/ISAKMP probe packets and raw UDP/500 traffic to test gateway behavior not exposed by ike-scan's standard modes
- Custom Python (paramiko/socket/requests) script to enumerate and fingerprint VPN portal/RDP-Gateway/Citrix login pages at scale across a target list, detect version banners, and test for username-enumeration timing/response differences no packaged scanner checks consistently
- rdesktop/xfreerdp/Citrix Workspace test clients — manual validation of RDP Gateway/Citrix session-based findings post-credential-validation

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate all remote-access entry points in scope: VPN gateway IP/port (UDP/500, UDP/4500 for IPsec; TCP/UDP/1194 default for OpenVPN; UDP/51820 default for WireGuard), RDP Gateway (TCP/443 or TCP/3391), Citrix (TCP/443), and any SSL-VPN web portal
- Fingerprint VPN gateway vendor/version via ike-scan and nmap NSE, and RDP Gateway/Citrix version via portal banners/response headers, for correlation with the Dependency Scanning agent's known-CVE data
- Where configuration files are provided/accessible (authorized configuration review), inventory the cipher suites, authentication method (PSK/certificate/EAP), and split-tunnel routing rules in use
- Identify the authentication flow for each portal (username/password only, certificate + password, MFA) since this determines which subsequent tests are meaningful versus redundant

### Phase 2: Vulnerability Identification
- Run ike-scan aggressive-mode probes against IPsec gateways to determine if aggressive mode is enabled (allowing PSK hash capture for offline cracking) versus main mode only
- Review OpenVPN/WireGuard configs for weak/deprecated ciphers (e.g. `BF-CBC`, missing `tls-auth`/`tls-crypt` HMAC firewall), disabled `remote-cert-tls`/peer verification, or reused static keys across multiple clients
- Test split-tunneling configuration: connect as an authorized test client and verify whether traffic to non-corporate destinations bypasses the tunnel by design, and whether that default routing could let a compromised remote endpoint pivot between the public internet and the internal network simultaneously
- Perform scoped, rate-limited credential testing (hydra/medusa within authorized test-account boundaries) against VPN portal, RDP Gateway, and Citrix login forms, and separately test for account-lockout absence and username-enumeration via response-timing/error-message differences using the custom Python enumeration script
- Check whether MFA is actually enforced for every remote-access path in scope, including any legacy/fallback authentication endpoint that might bypass the primary MFA-enforced flow

### Phase 3: Exploitation & Validation
- For a captured IKE aggressive-mode PSK hash, run an offline Hashcat/John crack attempt to demonstrate real-world crackability within a reasonable time/complexity budget, rather than treating hash capture alone as the finding
- For confirmed weak/absent authentication controls, demonstrate an actual successful authenticated session establishment using a test account, and document exactly what internal network access that session grants (chain into the Network-Segmentation agent's reachability testing from the newly established VPN/remote-desktop vantage point)
- For split-tunneling risks, demonstrate the specific scenario: with the tunnel active, show that an internet-sourced attack (e.g. a request from an untrusted network) can reach the test client while it simultaneously holds an active internal-network route
- For RDP Gateway/Citrix findings, validate whether successful authentication grants direct desktop/application access without additional internal segmentation, confirming or refuting a "VPN as network flattening" scenario

### Phase 4: Documentation
- Document each finding with the exact gateway/portal, protocol/version, specific weak configuration or credential issue, and the internal access it leads to
- Capture ike-scan/nmap output, config-file excerpts (redacted of live secrets), and credential-testing logs as primary evidence
- Where a successful authenticated session was established, document the full chain from remote-access entry point to whatever internal resource was reached, cross-referencing the Network-Segmentation agent's findings
- Map to CVSS/OWASP/CWE as usual, treating any full internal-network-reachable VPN compromise as Scope: Changed given the access granted well beyond the remote-access component itself

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
  "owasp_category": "A07:2021 - Identification and Authentication Failures",
  "cwe_id": "CWE-287",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- ike-scan/nmap output showing gateway version, mode (aggressive/main), and transform sets
- Captured PSK hash and offline cracking result (time/complexity to crack) where applicable
- Config-file excerpts showing weak cipher/missing HMAC firewall/disabled peer verification (secrets redacted)
- Credential-testing logs demonstrating lockout/enumeration weaknesses within authorized bounds
- Session-establishment evidence and the resulting internal-network reachability chain

## Remediation Guidance
- Disable IKEv1 aggressive mode; require IKEv2 with certificate-based authentication instead of pre-shared keys where feasible
- Enforce strong, current cipher suites for OpenVPN/WireGuard, enable `tls-crypt`/`tls-auth`, and eliminate static/shared per-client keys in favor of per-client certificates or keys
- Enforce MFA on every remote-access authentication path, including legacy/fallback endpoints, and eliminate any MFA-bypassing shortcut
- Restrict split-tunneling to only the specific destinations that require it, or disable it entirely for sessions with access to sensitive internal segments
- Apply network segmentation to VPN/remote-desktop entry points so a successful remote-access compromise does not grant flat access to the entire internal network

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/network-engineer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, remote-access entry-point inventory, authorized test-account credentials, previous agent findings
**Output:** Validated findings with evidence, including any established internal-network access chain
**Feeds:** Network-Segmentation, Authentication, and Network-Device-Hardening agents; final penetration test report
