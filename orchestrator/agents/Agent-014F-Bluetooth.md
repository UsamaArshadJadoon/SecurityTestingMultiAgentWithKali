# Agent-014F-Bluetooth: Bluetooth

## Overview
Targeted assessment of Bluetooth Classic (BR/EDR) and Bluetooth Low Energy (BLE) devices in range, covering pairing/bonding weaknesses, GATT service exposure, and known protocol-level exploit classes such as BlueBorne, KNOB, and BIAS. BLE has become the de facto wireless interface for medical devices, industrial sensors, wearables, access-control tokens, and IoT peripherals, so an unauthenticated GATT characteristic or a downgraded pairing negotiation can translate directly into PII disclosure, device cloning, or unauthorized actuation (unlocking, disabling, reconfiguring). This agent enumerates the RF-visible attack surface of every discoverable and connectable device, then validates whether sniffed traffic, replayed writes, or forced re-pairing can extract secrets or manipulate device state.

## Tools Integrated
- bettercap (ble.enum, ble.write, hid module) — BLE GATT enumeration, characteristic read/write fuzzing, and BLE/HID hijacking
- gattacker / GATTack.io — BLE MITM proxying and characteristic manipulation
- Ubertooth One + ubertooth-btle/kismet — passive BLE/Classic sniffing and advertising channel following
- btlejack — BLE connection following, jamming, and hijacking of active links
- hcitool / bluetoothctl / sdptool — Classic Bluetooth discovery, SDP service enumeration, and device fingerprinting
- l2ping / rfcomm / obexftp — L2CAP-layer probing and legacy OBEX/RFCOMM service abuse
- CryptoWall/KNOB & BIAS PoC scripts — encryption key entropy downgrade and authentication bypass testing on Classic BR/EDR
- Wireshark (with Bluetooth HCI/BTLE dissectors) — protocol-level traffic analysis of captured HCI snoop logs
- spooftooph — Bluetooth device identity cloning/spoofing for impersonation testing
- nRF Connect / nRF Sniffer — mobile-assisted GATT exploration and Nordic-based BLE packet capture

## Testing Approach

### Phase 1: Initial Assessment
- Confirm written authorization explicitly covers the physical premises and RF range in which Bluetooth/BLE devices will be scanned, since Classic BR/EDR and BLE advertising can be received well beyond the room containing the device
- Verify rules of engagement authorize active pairing attempts, connection hijacking/jamming (btlejack), and any HID injection tests, as these can disrupt in-use devices (e.g., medical or access-control hardware)
- Confirm hardware scope: Bluetooth 5.0+ capable adapter, Ubertooth One or nRF52840 dongle for sniffing, and any device-specific companion app/dongle needed to interact with the target
- Passively scan for discoverable/advertising devices (hcitool scan, bettercap ble.recon), recording MAC/UUID, device name, manufacturer data, and advertised services
- Identify pairing/bonding requirements (Just Works, Passkey Entry, Numeric Comparison, Out-of-Band) and Bluetooth version/LE Secure Connections support per device

### Phase 2: Vulnerability Identification
- Enumerate GATT services/characteristics for read/write/notify permissions without authentication, flagging any characteristic that exposes configuration, firmware update, or sensitive data without a bonded/encrypted link
- Test pairing method for downgrade to "Just Works" (no MITM protection) when a stronger method should be enforced, and check for legacy pairing (pre-Secure-Connections) fallback
- Assess Classic BR/EDR link-key entropy for KNOB (Key Negotiation of Bluetooth) susceptibility — can the negotiated key length be forced down to 1 byte
- Check for BIAS (Bluetooth Impersonation AttackS) conditions: does the device skip mutual authentication and accept a spoofed previously-bonded identity
- Look for BlueBorne-class conditions on out-of-date Bluetooth stacks (L2CAP/SDP parsing, unauthenticated RCE surface) via version fingerprinting
- Assess whether advertising data leaks static identifiers (non-randomized MAC, serial numbers) enabling tracking/profiling

### Phase 3: Exploitation & Validation
- Force or observe a pairing/bonding event and capture it with Ubertooth/HCI snoop, attempting key/PIN recovery where legacy pairing or weak PINs are used
- Connect to exposed GATT characteristics without prior bonding and attempt unauthorized reads (data disclosure) and writes (state change, e.g., unlock/actuate/reconfigure) using bettercap or gatttool
- Where KNOB/BIAS conditions are present, execute the negotiation-downgrade or impersonation PoC against a live paired session and demonstrate traffic decryption or spoofed reconnection
- Use btlejack to hijack an active BLE connection and inject or alter characteristic writes mid-session, validating impact (e.g., forced command execution)
- For HID-class BLE/Classic devices (keyboards, presenters), attempt keystroke injection via bettercap's HID module to demonstrate command execution on the paired host

### Phase 4: Documentation
- Record device identifiers (MAC, name, manufacturer data), firmware/stack version if obtainable, and exact pairing method observed
- Capture full HCI snoop / Ubertooth pcap of the vulnerable exchange as primary evidence
- Map findings to CWE-322 (key exchange without entity authentication), CWE-294 (authentication bypass by capture-replay), or CWE-863 (incorrect authorization) as applicable
- Provide remediation scoped to firmware/stack update, pairing policy enforcement, or GATT permission hardening

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
- HCI snoop / Ubertooth pcap of the pairing exchange or exploited GATT transaction
- GATT service/characteristic enumeration output showing missing authentication requirements
- Before/after device state proof (e.g., unlocked/actuated) from an unauthorized write
- KNOB/BIAS PoC script output showing forced key-length downgrade or spoofed reconnection
- Device fingerprint data (MAC, name, manufacturer data, stack version)

## Remediation Guidance
- Enforce LE Secure Connections and reject legacy/Just-Works pairing for characteristics that expose sensitive functions
- Apply vendor firmware/stack updates addressing KNOB, BIAS, and BlueBorne-class CVEs
- Restrict GATT characteristic permissions to require bonded, encrypted links for any read/write with security impact
- Randomize BLE advertising MAC addresses and avoid leaking static serials/identifiers in advertisement data
- Disable unused Classic BR/EDR services (SDP/OBEX/RFCOMM) and unnecessary discoverability

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
