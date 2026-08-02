# Agent-014G-RFID-NFC: RFID NFC

## Overview
Physical-access-control and contactless-payment-adjacent assessment covering low-frequency (125 kHz) proximity cards, high-frequency (13.56 MHz) NFC/RFID tags, and the readers that trust them. This agent targets the cryptographic and protocol weaknesses in widely-deployed card technologies (Mifare Classic's Crypto-1 cipher, unencrypted EM4100/HID Prox formats, misconfigured DESFire/iCLASS deployments) to clone, emulate, or relay credentials that grant physical building access or logical system entry. Because a cloned badge is indistinguishable from the original at the reader, a successful clone or relay attack represents a direct, high-confidence proof of unauthorized physical access — arguably the most tangible impact category in the RF testing domain.

## Tools Integrated
- Proxmark3 (RDV4/Easy) — full LF/HF read, clone, emulate, and crypto-attack platform for badge/tag assessment
- libnfc / nfc-list / nfc-mfclassic — HF NFC tag interaction and Mifare Classic dump/restore
- mfoc / mfcuk — Mifare Classic Crypto-1 key recovery (nested/darkside attacks) from card sniffs
- Chameleon Mini/Ultra — portable multi-slot tag emulation for replay and access-control testing
- Flipper Zero — field-portable LF/HF read, clone, and emulate for rapid badge cloning validation
- MifareClassicTool / NFC Tools (Android) — mobile-assisted tag read/write/clone for field verification
- T5577/EM4305 writable tags — target media for LF badge cloning (HID Prox, EM4100, Indala)
- RFIDler — open hardware LF RFID research and protocol analysis
- Proxmark3 `hf mf` / `lf hid` / `lf indala` command sets — protocol-specific enumeration and attack scripts

## Testing Approach

### Phase 1: Initial Assessment
- Confirm written authorization explicitly names the physical premises, specific doors/readers/access points in scope, and permits possession/use of cloned or emulated credentials during the engagement window
- Verify rules of engagement address safe handling of any cloned badge (secure storage, destruction/return timeline) since a working physical clone is itself a sensitive artifact
- Confirm hardware scope: Proxmark3/Flipper/Chameleon availability, writable T5577/Mifare-compatible blank stock, and any reader-side logging/alerting the client wants preserved or disabled during testing
- Identify card technology in use per access point: LF 125 kHz (HID Prox, EM4100, Indala) vs. HF 13.56 MHz (Mifare Classic/Plus/DESFire, iCLASS, FeliCa, ISO 14443/15693)
- Passively read a sample badge (with authorization) to fingerprint UID format, sector layout, and ATQA/SAK values indicating chip type

### Phase 2: Vulnerability Identification
- Determine if LF badges use unencrypted, static UID formats (EM4100/HID Prox) with no rolling code or cryptographic authentication — trivially clonable by design
- Test Mifare Classic cards for default/well-known Crypto-1 sector keys and susceptibility to nested/darkside key-recovery attacks (mfoc/mfcuk)
- Check for iCLASS deployments still using the legacy/standard security level (known-vulnerable master key) versus iCLASS SE/Seos
- Assess whether readers enforce anti-cloning features (UID randomization support disabled, no mutual authentication, no rolling/dynamic codes)
- Evaluate susceptibility to relay attacks — can a card's signal be relayed in real time from the legitimate holder's pocket to a remote reader via proxmark3/Chameleon relay mode
- For NFC-enabled mobile/contactless deployments, check for missing application-layer authentication that would allow a cloned UID alone to grant access

### Phase 3: Exploitation & Validation
- Clone a target LF badge to a T5577 blank and present the clone to the physical reader, documenting successful access grant as definitive proof
- Recover Mifare Classic sector keys via mfoc/mfcuk nested attack, dump the full card, and write the dump to a Chameleon/magic card, then validate against the live reader
- Where relay conditions exist, demonstrate a live relay between a card in one location and a reader in another using two coupled Proxmark3/Chameleon devices
- For iCLASS legacy deployments, extract the card application data using the known master key and clone to a compatible blank
- Document any case where cloning failed due to mutual authentication/rolling codes, as this is evidence of a properly hardened control (negative finding)

### Phase 4: Documentation
- Record card technology, UID/sector data (redacted appropriately), and exact Proxmark3/libnfc command sequence used for read/crack/clone
- Capture reader response (granted/denied) as primary evidence of physical access impact
- Map findings to CWE-294 (authentication bypass by capture-replay) and CWE-326 (inadequate encryption strength) as applicable
- Provide remediation scoped to card technology migration, reader firmware, and anti-cloning feature enablement

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
- Proxmark3/libnfc console output showing UID read, key recovery, or full card dump
- Video or photo evidence of the cloned/emulated credential granting access at the physical reader
- Recovered sector keys and dumped card data (stored securely, redacted in the report)
- Command history for mfoc/mfcuk nested-attack runs showing recovered Crypto-1 keys
- Reader model/firmware identification supporting the technology-level finding

## Remediation Guidance
- Migrate from static-UID LF technologies (EM4100/HID Prox) and legacy Mifare Classic to mutual-authentication, rolling-code technologies (DESFire EV2/EV3, iCLASS SE/Seos)
- Rotate any Mifare Classic deployment off default/well-known Crypto-1 keys immediately, though full migration is the only durable fix
- Enable reader-side anti-cloning and relay-detection features (distance bounding, mutual authentication) where supported by hardware
- Implement multi-factor physical access (badge + PIN, or badge + biometric) for high-sensitivity doors as compensating control
- Audit and deprovision unused/orphaned badges regularly to shrink the cloneable credential population

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
