# Agent-052-Network-Device-Hardening: Network Device Hardening (Routers, Switches, Firewalls)

## Overview
Assesses the hardening posture of the network devices themselves — routers, switches, and firewalls — at the device-configuration level: SNMP community-string strength, default/vendor-shipped credentials, exposed and unencrypted management-plane protocols (Telnet, unencrypted HTTP admin UIs), and outdated firmware. These devices sit at every choke point the rest of the assessment depends on for its security assumptions, and they are frequently the least-monitored part of the estate — a device deployed years ago with a factory-default SNMP community string or Telnet left enabled "for convenience" gives an attacker read/write control over routing, VLAN configuration, and traffic mirroring, effectively subverting the network itself rather than any single application on it. This agent focuses specifically on the device's own management surface and firmware currency, distinct from the traffic-flow/segmentation questions covered elsewhere.

## Tools Integrated
- onesixtyone / snmpwalk / snmp-check — SNMP community-string brute-forcing and, once access is gained, full MIB-tree walking to extract device configuration, routing tables, and (on older/misconfigured devices) credentials
- nmap (with `snmp-*`, `telnet-*`, and vendor-specific NSE scripts) — service/version fingerprinting of management-plane protocols and detection of Telnet/unencrypted-HTTP admin interfaces
- hydra / medusa — credential brute-forcing against SSH, Telnet, and web-based device-admin login forms using vendor-default and common-weak-credential wordlists, rate-limited and scoped to avoid device lockout/instability
- yersinia — Layer 2 protocol-abuse testing (STP root-bridge takeover, CDP/DTP abuse) relevant to switch hardening beyond the segmentation-specific VLAN-hopping tests
- Nipper — automated configuration-file auditing for Cisco/Juniper/Fortinet/Palo Alto exported configs against hardening best practices (weak SNMP strings, Telnet enabled, missing ACLs on VTY lines)
- Custom Python (pysnmp) script to systematically test both SNMPv1/v2c community strings (public/private and a curated weak-string list) and SNMPv3 configuration strength (noAuthNoPriv vs authPriv) across every discovered device, and where read access succeeds, walk targeted MIB branches known to disclose further credentials or topology data (e.g. CISCO-CONFIG-COPY MIB, running-config-via-SNMP misconfigurations) — more targeted and safer than a blind full-tree walk on production infrastructure
- Custom Python (paramiko/telnetlib/requests) multi-protocol default-credential sweep that takes a single curated vendor-default-credential list and tests it consistently across SSH, Telnet, and HTTP(S) admin-UI login forms for every enumerated device, logging exactly which protocol/device/credential-pair combination succeeded — ensuring consistent methodology across heterogeneous device types rather than ad hoc per-device manual testing

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every network device in scope (routers, switches, firewalls) via the Infrastructure agent's port/service inventory plus any provided asset list, and fingerprint vendor/model/firmware version via SNMP sysDescr, SSH/Telnet banners, and HTTP admin-UI response signatures
- Identify which management protocols are actually exposed and from where: is SSH/HTTPS management reachable only from a dedicated management network, or from general workload/user VLANs as well
- Determine SNMP version in use per device (v1/v2c community-string-based versus v3 with authentication/encryption) as this fundamentally changes the applicable attack technique
- Correlate firmware versions against the Dependency Scanning agent's known-CVE data for each specific vendor/model/version combination in scope

### Phase 2: Vulnerability Identification
- Run the custom Python SNMP-testing script across every device to test default/weak community strings under v1/v2c and to assess v3 security-level configuration, escalating to a targeted MIB walk only on devices where read access is confirmed
- Run the custom Python multi-protocol default-credential sweep across SSH/Telnet/HTTP(S) admin interfaces for every device using the vendor-default-credential list, rate-limited per device to avoid triggering lockout or device instability on production infrastructure
- Confirm via nmap/manual banner-grab whether Telnet or unencrypted HTTP admin access is enabled at all, independent of whether credentials are weak — the presence of a plaintext management protocol is itself a finding given credential-sniffing risk on any network position with visibility to that traffic
- Review exported device configurations (via Nipper or manual review, where access is authorized) for missing VTY access-class ACLs, absent management-plane rate-limiting, and logging/AAA configuration gaps
- Run yersinia-based Layer 2 protocol-abuse tests (STP root-bridge takeover attempt, CDP information-disclosure capture) on accessible switch ports to assess Layer 2 management-plane resilience beyond credential/SNMP concerns

### Phase 3: Exploitation & Validation
- For a confirmed weak/default SNMP community string with write access (rare but high-impact), demonstrate a single non-destructive read-only configuration retrieval as PoC rather than attempting any write/reconfiguration action against production infrastructure
- For a confirmed default-credential success on any management protocol, demonstrate successful authentication and document the exact scope of administrative control obtained (full configuration read/write, reboot capability, traffic-mirroring/SPAN configuration access) without making persistent changes to the device
- For confirmed Telnet/unencrypted-HTTP exposure, frame the finding around credential-interception risk on the specific network segment where that traffic is visible, cross-referencing the Network-Segmentation agent's reachability findings to state precisely who could sniff those credentials
- For a firmware version matching a known high-severity CVE, validate via version/build fingerprint match and only proceed to live exploitation where explicitly authorized and scheduled within a safe maintenance window given the device's criticality to live traffic

### Phase 4: Documentation
- Document each finding with the exact device (vendor/model/firmware), management protocol/port, and specific weak-credential or exposed-service evidence
- Capture SNMP walk output, credential-sweep logs (protocol/device/credential-pair matched), and configuration-review excerpts as primary evidence
- Group findings by device class/vendor where the same root cause (e.g. a fleet-wide default SNMP string) spans many devices, to support a single centralized remediation rather than device-by-device fixes
- Map to CVSS/OWASP/CWE as usual, weighting devices with write-level management access or fleet-wide credential reuse as high severity given their network-wide blast radius

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
  "cwe_id": "CWE-798",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- SNMP community-string test results and, where read access succeeded, targeted MIB-walk output
- Multi-protocol default-credential sweep logs showing exact protocol/device/credential-pair matches
- nmap/banner-grab evidence confirming Telnet or unencrypted HTTP admin-interface exposure
- Nipper/manual configuration-review excerpts showing the specific missing ACL/AAA/logging control
- Firmware version/build fingerprint evidence correlated with known-CVE findings

## Remediation Guidance
- Replace all default/weak SNMP community strings with strong, unique values, or migrate to SNMPv3 with authPriv (authentication and encryption) across the device fleet
- Change all default vendor-shipped credentials immediately upon deployment and enforce a centralized AAA solution (TACACS+/RADIUS) rather than local device accounts
- Disable Telnet and unencrypted HTTP management interfaces fleet-wide; require SSH and HTTPS only, restricted to a dedicated management network via VTY access-class ACLs
- Apply firmware updates on a defined patch cadence, prioritizing any device/version combination with a known high-severity remote-management vulnerability
- Centralize logging and configuration-change auditing for all network devices so unauthorized management-plane access or configuration drift is detected quickly rather than discovered during a periodic assessment

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/network-engineer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, network-device inventory from Infrastructure agent, previous agent findings
**Output:** Validated findings with evidence, including the fleet-wide credential/SNMP exposure summary
**Feeds:** Network-Segmentation, VPN-Remote-Access, and Dependency Scanning agents; final penetration test report
