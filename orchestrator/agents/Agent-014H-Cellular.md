# Agent-014H-Cellular: Cellular

## Overview
SDR-based assessment of cellular RF exposure and baseband trust boundaries, covering rogue base station (IMSI-catcher class) susceptibility, protocol downgrade to legacy unencrypted/weakly-encrypted air interfaces (2G/GSM), and baseband handling of malformed signaling. This is the most legally constrained testing area in the wireless domain: unlike WiFi/BLE/RFID, transmitting on licensed cellular spectrum is regulated independently of client authorization, so scope here is frequently limited to passive/receive-only analysis or fully shielded (Faraday-enclosed) test environments using an isolated test SIM/core network. This agent quantifies whether in-scope devices can be silently downgraded to insecure air interfaces, tracked via IMSI disclosure, or fingerprinted, and whether test-network signaling reveals authentication or encryption weaknesses.

## Tools Integrated
- HackRF One / BladeRF / USRP (SDR hardware) — RF capture and, only in an authorized shielded test-network context, controlled transmission
- srsRAN / OpenAirInterface — open-source LTE/5G test core and eNB/gNB for isolated lab-based protocol testing
- YateBTS / OpenBTS — GSM test base station software for shielded-environment 2G protocol assessment
- gr-gsm — GNU Radio GSM signal decoding, downlink burst capture, and GSMTAP export
- Kalibrate-rtl (kal) — GSM base station frequency/channel scanning and clock offset calibration
- Wireshark (GSMTAP/LTE/NAS dissectors) — decoded signaling analysis of captured air-interface traffic
- SIMtrace / osmocom-bb — SIM-to-baseband interposer for handset-side signaling inspection
- A5/1 rainbow tables (Kraken/gr-gsm pipeline) — legacy GSM stream cipher key-recovery analysis in lab conditions
- QCSuper / Mobile Insight — baseband diagnostic log capture from Qualcomm-based test handsets for downgrade/attach analysis

## Testing Approach

### Phase 1: Initial Assessment
- Confirm written authorization explicitly covers RF transmission (not just reception) if any active base-station simulation is planned — this typically requires separate telecom regulator authorization (e.g., spectrum license or experimental license from the relevant national regulator) in addition to client sign-off, since cellular bands are licensed spectrum and unauthorized transmission is a regulatory violation independent of any contract
- Verify the test is conducted in a shielded (Faraday cage/RF-isolated) environment with an isolated test core network and test SIMs when any active/transmitting technique (rogue eNB/BTS) is in scope, to guarantee zero interference with live commercial networks or bystander devices
- Where transmission cannot be authorized, scope the engagement to passive RF monitoring only (downlink capture, broadcast channel decoding, no injected signaling)
- Confirm hardware scope: SDR model and frequency range coverage for the bands in use (GSM 900/1800, LTE bands), antenna specifications, and available shielded test space
- Identify in-scope device baseband/modem chipsets and supported RATs (2G/3G/4G/5G) to determine which downgrade paths are theoretically reachable

### Phase 2: Vulnerability Identification
- In passive mode, assess whether in-scope devices broadcast IMSI in cleartext during attach/paging procedures observable over the air, and how frequently TMSI reallocation occurs (infrequent reallocation aids tracking)
- Determine whether devices accept 2G/GSM fallback when a stronger network is artificially made unavailable (relevant only where an isolated test network can legally demonstrate this)
- Assess A5/0 (null cipher) or A5/1 (weak stream cipher) acceptance versus enforced A5/3/A5/4 in the test-network context, since A5/1 keystreams remain crackable with precomputed tables
- Evaluate whether devices/network enforce mutual authentication (AKA) versus legacy one-way GSM authentication that enables base-station impersonation
- Review baseband diagnostic logs (via osmocom-bb/QCSuper) for evidence of unauthenticated OTA (over-the-air) configuration acceptance or unexpected RAT downgrade attempts

### Phase 3: Exploitation & Validation
- Where authorized in a shielded lab with an isolated test core, stand up a controlled test BTS/eNB (YateBTS/srsRAN) and demonstrate a test device attaching and, if in scope, downgrading to a weaker air interface
- Capture the resulting air-interface traffic with gr-gsm/Wireshark and, for A5/1 sessions in the isolated lab, demonstrate keystream/key recovery feasibility using precomputed table lookups
- Where only passive authorization exists, validate findings via downlink broadcast channel decoding and cleartext IMSI/paging observation only — no injected signaling
- Document any successful forced-downgrade or authentication-bypass demonstration with full before/after RAT and cipher state captured in logs
- Explicitly record any technique that could NOT be legally validated due to spectrum/authorization constraints, and note it as a theoretical finding requiring carrier/regulator-coordinated testing

### Phase 4: Documentation
- Record RF environment details (shielded lab vs. passive field capture), SDR hardware/software versions, and exact authorization basis (client + regulator, where applicable) for every active test performed
- Capture decoded GSMTAP/NAS signaling logs as primary evidence, redacting any real subscriber identifiers captured incidentally
- Map findings to CWE-287 (improper authentication) and CWE-326 (inadequate encryption strength) as applicable
- Provide remediation scoped to network configuration (cipher enforcement, RAT lockdown) and device/baseband policy, distinguishing operator-side fixes from device-side fixes

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
- Decoded GSMTAP/NAS signaling captures (Wireshark) showing cipher/RAT negotiation
- SDR capture files (IQ recordings) of the relevant downlink/uplink exchange
- Baseband diagnostic logs (QCSuper/Mobile Insight/osmocom-bb) showing attach and downgrade behavior
- Documented authorization chain (client + regulator, where applicable) referenced against the specific active test performed
- Explicit record of shielded-environment controls in place during any active transmission test

## Remediation Guidance
- Disable 2G/GSM fallback where not operationally required, and enforce minimum acceptable cipher suite (A5/3 or better) at the network level
- Enforce mutual authentication (AKA) and reject legacy one-way authentication handshakes
- Shorten TMSI reallocation intervals and minimize scenarios where IMSI is transmitted in cleartext
- Deploy rogue base station detection capability (network-side or device-side) where risk profile warrants it
- Coordinate with the carrier/regulator on any systemic finding, since remediation of network-level cellular weaknesses is typically outside the client's direct control

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
