# Agent-038: Wireless WiFi Security Testing

## Overview
Broad-spectrum WiFi penetration testing agent covering the full attack surface of an 802.11 deployment: network discovery and encryption enumeration, WPS exploitation, rogue AP/evil-twin impersonation, captive-portal bypass, enterprise 802.1X/EAP relay attacks, and post-connection MITM. Where Agent-014E focuses narrowly on cracking captured WPA handshakes, this agent owns the end-to-end wireless assessment — finding every SSID in range, characterizing its security posture, and chaining the weakest link (WPS, open enterprise onboarding, unpatched clients) into a foothold on the internal network. Given how many organizations still run guest, IoT, and legacy WPS-enabled APs alongside their primary corporate SSID, this agent typically surfaces the highest-impact, lowest-effort path into an otherwise well-defended network.

## Tools Integrated
- aircrack-ng suite (airmon-ng, airodump-ng, aireplay-ng, airbase-ng) — monitor mode, discovery, packet injection, and AP impersonation
- hashcat / pixiewps — GPU-accelerated PSK cracking and WPS PIN offline brute force (Pixie Dust attack)
- reaver / bully — online WPS PIN brute-force attacks against vulnerable AP implementations
- hostapd-wpe / eaphammer — rogue enterprise AP for 802.1X/EAP credential harvesting and MITM
- Wifiphisher — automated evil-twin/captive-portal phishing framework for credential and PSK harvesting
- bettercap — post-association MITM, ARP/DNS spoofing, and traffic manipulation
- Kismet — passive wireless IDS-style discovery, client/AP correlation, and rogue AP detection
- mdk4 — deauthentication, disassociation, and beacon-flood testing for DoS/robustness checks
- Wireshark / tshark — 802.11 management/control frame analysis and handshake/EAPOL validation

## Testing Approach

### Phase 1: Initial Assessment
- Confirm written authorization explicitly covers the physical premises and RF footprint of every SSID to be tested — wireless signal propagates beyond office boundaries into shared floors, parking areas, and neighboring tenants, so scope must be unambiguous about coverage area, not just network names
- Confirm rules of engagement explicitly authorize active techniques with operational impact: deauthentication/disassociation floods, rogue AP/evil-twin broadcasting, and captive-portal impersonation, since these can disrupt legitimate users and may be picked up by wireless IDS
- Confirm hardware scope: monitor-mode and injection-capable wireless adapters (dual-band 2.4/5 GHz, ideally 6 GHz for WiFi 6E), sufficient antenna gain for the test area, and a device to host rogue AP/captive-portal services
- Enumerate all in-range SSIDs, BSSIDs, channels/bands, and encryption types (Open, WEP, WPA/WPA2-PSK, WPA2/3-Enterprise, WPA3-SAE) via airodump-ng/Kismet before any active engagement
- Map connected client population per AP (MAC/OUI, probe requests revealing previously-joined SSIDs) to plan targeted association and rogue AP decoy strategy

### Phase 2: Vulnerability Identification
- Flag any AP still broadcasting WEP or fully open (unauthenticated) encryption, and any WPA/WPA2 mixed-mode accepting TKIP fallback
- Check WPS status per AP (enabled/locked/rate-limited) — WPS-enabled APs without proper lockout are vulnerable to Pixie Dust (offline) or brute-force (online) PIN recovery, yielding the PSK directly
- Identify clients broadcasting probe requests for known/previously-associated SSIDs, indicating susceptibility to evil-twin/KARMA-style automatic association
- For enterprise SSIDs, determine EAP method in use and whether clients validate the RADIUS server certificate — unvalidated EAP-PEAP/TTLS clients are vulnerable to credential harvesting via a rogue AP with a self-signed cert
- Check captive-portal implementations (guest WiFi) for bypass via MAC spoofing of already-authenticated clients, or DNS/HTTP tunneling that circumvents the portal walled-garden
- Assess network segmentation: does the guest/IoT SSID reach internal/corporate VLANs once associated, and is client isolation enforced

### Phase 3: Exploitation & Validation
- Capture the 4-way handshake or PMKID (deauth-assisted or passive) and crack via hashcat/aircrack-ng dictionary and rule-based attacks to recover the PSK
- Where WPS is enabled, run pixiewps (offline, seconds-to-minutes) or reaver/bully (online brute force) to recover the WPS PIN and derive the PSK
- Stand up a Wifiphisher/hostapd-wpe rogue AP cloning the target SSID to harvest PSK entry attempts or, for enterprise networks, capture MSCHAPv2 credentials from clients that skip certificate validation
- Test captive-portal bypass techniques (MAC spoofing of an authenticated client, DNS tunneling) and confirm whether internet/internal access is granted without legitimate authentication
- Following successful association (via cracked PSK, WPS PIN, or portal bypass), use bettercap to perform ARP/DNS spoofing and confirm interception of live traffic or credentials as proof of post-connection impact
- Validate any client-isolation/segmentation gaps by attempting to reach internal-network hosts/services from the guest or IoT SSID

### Phase 4: Documentation
- Record per-SSID security posture (encryption type, WPS status, EAP method, segmentation) as a baseline inventory alongside specific exploited weaknesses
- Capture exact tool command lines, capture files, and elapsed time for each successful technique (handshake crack, WPS PIN recovery, portal bypass)
- Map findings to CWE-287 (improper authentication), CWE-1188 (insecure default configuration, e.g., WPS enabled by default), and CWE-923 (improper restriction of communication channel, e.g., missing client isolation)
- Provide remediation prioritized by exploited path (WPS disablement, PSK rotation, EAP certificate pinning, segmentation enforcement)

## Validation Requirements
- Authorized network testing
- Captured handshake proof
- Cracked password verification
- Working WiFi connection
- Reproducible attack steps

## CVSS Scoring
- Severity: Network access and potential lateral movement
- Attack Vector: Adjacent network (wireless range)
- Privileges: None
- User Interaction: None for passive attacks
- Scope: Changed (network access gained)
- CIA Impact: High (traffic interception)

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
- Captured handshake/PMKID file and successful crack output (aircrack-ng/hashcat session log)
- pixiewps/reaver/bully console output showing recovered WPS PIN and derived PSK
- Rogue AP harvest logs showing captured PSK entry attempts or MSCHAPv2 credentials
- bettercap MITM session logs demonstrating intercepted post-connection traffic or credentials
- Screenshot/log of successful captive-portal bypass and resulting network access

## Remediation Guidance
- Use WPA3 encryption (if supported)
- Implement strong pre-shared keys (20+ characters)
- Disable WPS entirely
- Configure WPA2 with AES encryption
- Implement MAC filtering and enforce client isolation on guest/IoT SSIDs

## Success Criteria
✓ Network discovery evidence
✓ Handshake capture
✓ Successful password crack
✓ Network access proof
✓ Full attack documentation

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
