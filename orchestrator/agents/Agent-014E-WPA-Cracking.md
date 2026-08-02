# Agent-014E-WPA-Cracking: WPA Cracking

## Overview
Deep-dive offline/online cracking of WPA/WPA2/WPA3 pre-shared-key and enterprise handshakes captured from in-scope wireless networks. This agent focuses specifically on turning captured cryptographic material — 4-way handshakes, PMKIDs, and WPA3 SAE exchanges — into recovered passphrases or session keys, and on identifying the weak-KDF, weak-passphrase, and protocol-downgrade conditions that make cracking feasible. A successful crack yields full network access, enabling lateral movement into internal VLANs, VoIP, IoT, and management networks that trust the wireless segment. Because WPA-PSK security is entirely a function of passphrase entropy and legacy protocol support, the real business impact here is quantifying how many minutes/hours/GPU-days stand between an attacker in the parking lot and the internal network.

## Tools Integrated
- aircrack-ng — handshake/PMKID capture validation and dictionary attacks against .cap/.hccapx files
- hashcat (modes 22000/2500, 22001 PMKID, 4800/12010 for WPA-Enterprise MSCHAPv2) — GPU-accelerated offline cracking
- hcxdumptool / hcxpcapngtool — PMKID extraction without client interaction, handshake-to-hashcat conversion
- John the Ripper — mask/rule-based password cracking as a hashcat alternative
- cowpatty / pyrit — legacy WPA-PSK cracking and precomputed PMK rainbow tables
- crunch / maskprocessor / CeWL — custom wordlist and mask generation from OSINT-derived candidate terms
- Wireshark / tshark — EAPOL frame inspection, 4-way handshake integrity verification
- Dragonslayer / Dragondrain (WPA3 SAE) — dragonblood-class side-channel and DoS testing against SAE handshake
- eaphammer — WPA-Enterprise (802.1X/EAP) rogue AP credential harvesting to feed offline cracking

## Testing Approach

### Phase 1: Initial Assessment
- Confirm written authorization explicitly covers the physical premises, building floors/areas, and RF spectrum in range of the target SSIDs — wireless signal does not respect property lines, so authorization must address adjacent/neighboring space bleed
- Verify the engagement's rules of engagement authorize active packet injection and (if applicable) client deauthentication, since handshake capture often requires forcing a reauthentication
- Confirm hardware scope: monitor-mode-capable adapter with injection support (e.g., chipsets supported by aircrack-ng/hcxdumptool), external antenna gain, and GPU cracking rig availability/specs
- Passively identify target BSSIDs, ESSIDs, channel/band (2.4/5/6 GHz), and negotiated security (WPA2-PSK, WPA2-Enterprise, WPA3-SAE, transition mode) via airodump-ng/kismet before any active technique
- Establish a baseline of connected client MACs and vendor OUIs to plan targeted vs. broadcast deauth

### Phase 2: Vulnerability Identification
- Determine whether PMKID capture is possible (clientless attack against RSN PMKID in the first EAPOL frame) — flags AP as vulnerable to fully passive key-recovery attempts
- Assess passphrase strength indicators: SSID naming conventions suggesting default/vendor PSKs, organizational patterns suitable for targeted wordlists/rules
- Check for WPA/WPA2 mixed-mode or WPA-TKIP fallback still enabled alongside WPA2/WPA3, indicating weaker cipher acceptance
- For WPA3 networks, test for transition-mode downgrade to WPA2 and dragonblood-class SAE implementation flaws (timing/cache side channels, group downgrade)
- For WPA2/WPA3-Enterprise, evaluate EAP method (PEAP/TTLS vs. weak EAP-MD5/LEAP) and certificate validation behavior against rogue AP impersonation

### Phase 3: Exploitation & Validation
- Capture a valid 4-way handshake via airodump-ng, forcing reauthentication with a targeted aireplay-ng deauth burst against an associated client if not observed passively
- Extract PMKID via hcxdumptool where supported, convert with hcxpcapngtool to hashcat 22000 format
- Run staged dictionary attacks (common lists, breach corpora, organization-derived wordlists from CeWL/OSINT) followed by rule-based mutation (best64, OneRuleToRuleThemAll) and mask attacks for known passphrase patterns
- For WPA-Enterprise, stand up eaphammer/hostapd-wpe rogue AP to capture MSCHAPv2 handshakes from misconfigured clients that skip certificate validation, then crack offline with hashcat mode 4800/5500
- Validate the recovered PSK/credential by performing a live association to the target network and confirming DHCP lease/internal connectivity — this is the definitive proof of exploitability, not just a hash crack

### Phase 4: Documentation
- Record capture method (passive vs. deauth-assisted vs. PMKID), tool versions, and exact hashcat/aircrack command lines used
- Log time-to-crack and compute cost (wordlist size, mask complexity, GPU hardware) to substantiate real-world attacker feasibility
- Map findings to CWE-521 (weak password requirements) and CWE-757 (selection of less-secure algorithm) as applicable
- Provide developer/network-owner-actionable remediation tied to the specific weakness observed (PMKID exposure, weak PSK, TKIP fallback, EAP misconfiguration)

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
- Captured handshake/PMKID file (.cap/.pcapng) and its hashcat/hccapx conversion
- Exact cracking command line, wordlist/rule/mask used, and elapsed time-to-crack
- Screenshot or log of successful association to the target network using the recovered credential
- EAPOL frame captures (Wireshark) demonstrating handshake integrity and cipher suite negotiated
- hashcat/aircrack-ng session output showing recovered key material

## Remediation Guidance
- Migrate to WPA3-SAE (or WPA2/WPA3 transition disabled if not needed) and disable WPA-TKIP fallback
- Enforce high-entropy PSKs (20+ random characters) or move to WPA2/WPA3-Enterprise with certificate-validated EAP-TLS
- Disable PMKID-vulnerable roaming features where not required, or patch AP firmware addressing PMKID exposure
- For enterprise networks, enforce client-side RADIUS server certificate validation to prevent rogue AP credential harvesting
- Rotate PSK immediately following any confirmed compromise and monitor for unauthorized associations

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
