# Agent-042-IoT-Firmware-Analysis: IoT & Firmware Security Testing

## Overview
IoT and embedded firmware penetration testing focused on firmware extraction, static/dynamic firmware analysis, hardcoded secrets, and physical debug-interface exposure across consumer and industrial IoT devices. Embedded devices routinely ship with hardcoded credentials, private keys shared across an entire product line, and exposed UART/JTAG/SWD debug headers left enabled from the manufacturing process — any one of which can lead to full device compromise, credential reuse against the vendor's cloud backend, or firmware tampering that persists across reboots. Because these devices sit at the edge of a network and often bridge into wireless protocols (MQTT, CoAP, Zigbee, Z-Wave, BLE), a single compromised unit can become a pivot point into the broader network or an entire fleet if secrets are shared across devices. This agent covers the full chain from physical/firmware acquisition through static analysis to hardware-level exploitation and IoT-protocol abuse.

## Tools Integrated
- binwalk - firmware signature scanning, extraction, and entropy analysis for encryption/compression detection
- firmwalker - automated extracted-filesystem scanner for credentials, keys, and interesting config files
- firmware-mod-kit (FMK) - firmware unpacking/repacking for modification and re-flashing
- EMBA - automated firmware security analysis framework (SBOM generation, CVE correlation, static analysis)
- openocd - JTAG/SWD debugger interface for on-chip debugging and memory access
- minicom / picocom - serial/UART terminal interaction
- qemu / qemu-user (with firmadyne or FAT) - firmware emulation for dynamic analysis without hardware
- Logic analyzer + PulseView (sigrok) - identifying and decoding unknown serial/debug pinouts
- flashrom / chip-programmer tools (e.g., CH341A) - direct SPI/NAND flash chip reading and writing
- strings/grep/trufflehog/gitleaks - secret-pattern scanning across extracted filesystems and binaries
- Ghidra/IDA - reverse engineering extracted binaries for vulnerable logic and hardcoded logic bypasses
- MQTT-PWN / mqtt-spy - MQTT broker enumeration, topic sniffing, and authentication testing
- CoAPthon / coap-client - CoAP endpoint enumeration and testing
- KillerBee - Zigbee/802.15.4 packet capture, injection, and key extraction
- Z-Wave sniffer tooling (e.g., EZSync/Z-Force) - Z-Wave frame capture and downgrade-attack testing

## Testing Approach

### Phase 1: Initial Assessment
- Identify firmware acquisition vectors: vendor download portal, OTA update capture (MITM the update check/download), direct flash-chip dump (SPI/NAND via chip-programmer), or UART/JTAG memory dump
- Visually and electrically inspect the PCB for exposed headers (UART, JTAG, SWD), test points, and unpopulated component footprints; use a logic analyzer to identify unknown pinouts by voltage/protocol characteristics
- Extract firmware using binwalk (`binwalk -e`) and identify file system type (SquashFS, JFFS2, UBI, CramFS), bootloader (U-Boot, coreboot), and any compression/encryption via entropy analysis (`binwalk -E`)
- Run EMBA for an automated baseline pass: SBOM/component inventory, known-CVE correlation against identified library versions, and initial finding triage
- Fingerprint all network services the device exposes (web management UI, MQTT/CoAP broker, SSH/Telnet, proprietary protocols) via nmap and manual banner grabbing

### Phase 2: Vulnerability Identification
- Run firmwalker and manual `grep -r` passes across the extracted filesystem for hardcoded credentials, API keys, TLS private keys, and cloud-service tokens (AWS/Azure/GCP keys, MQTT broker credentials)
- Check whether the same private key or credential set is reused across firmware images for different device models/regions (indicates fleet-wide compromise potential, not single-device)
- Identify all listening network services in startup scripts (`/etc/init.d`, systemd units, busybox `inittab`) and cross-reference each binary against known CVEs (via EMBA/CVE correlation and manual version checks)
- Locate and test debug/diagnostic interfaces left enabled in production builds (telnet daemons, ADB, undocumented HTTP diagnostic endpoints, JTAG left unlocked)
- Check bootloader configuration (U-Boot environment) for the ability to interrupt boot, modify boot arguments (e.g., `init=/bin/sh`), or disable secure boot / signature verification
- Check for firmware update mechanism weaknesses: unsigned or unauthenticated OTA updates, updates served over plaintext HTTP, missing version rollback protection (allowing downgrade to a vulnerable firmware version)
- Test IoT protocol implementations for missing authentication/authorization (anonymous MQTT broker access, unauthenticated CoAP resources) and weak/no transport encryption

### Phase 3: Exploitation & Validation
- Demonstrate working extraction and unpacking of the firmware filesystem with the actual hardcoded credential or key recovered and clearly displayed
- Gain an interactive shell via UART (often root, no authentication) or via bootloader interruption (`init=/bin/sh` boot argument injection) and demonstrate command execution on the live device
- Where JTAG/SWD is exposed and unlocked, demonstrate memory read/write via openocd sufficient to dump firmware or bypass a software-only authentication check
- Demonstrate that a recovered device credential or key is valid against the vendor's cloud backend or a second physical unit (proving fleet-wide impact, without accessing systems outside authorized scope)
- Demonstrate practical exploitation of an identified IoT-protocol weakness (e.g., subscribing to another device's MQTT topic and reading/injecting messages, replaying a captured Zigbee/Z-Wave command)
- Where an unsigned OTA mechanism was identified, demonstrate a crafted-firmware or downgrade PoC accepted by the device's update process (in a lab/authorized device only)

### Phase 4: Documentation
- Detailed finding documentation including the exact acquisition method, extraction command output, and file path of any recovered secret
- CVSS 3.1 scoring reflecting physical/adjacent-network access vector and device/fleet-wide compromise impact
- OWASP/CWE mapping (CWE-798 Use of Hard-coded Credentials, CWE-1244 Internal Asset Exposed to Unsafe Debug Access, CWE-494 Download of Code Without Integrity Check)
- Remediation guidance covering secure boot, debug-interface lockdown, and update-signing
- Developer/hardware-team-actionable recommendations distinguishing firmware-level fixes from PCB/manufacturing-process fixes

## Validation Requirements
✓ Authentic vulnerability reproduction
✓ Real evidence from target system
✓ Reproducible exploitation steps
✓ Complete technical documentation
✓ Verified impact assessment
✓ Proper data organization for downstream agents

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: typically Physical (for hardware debug interfaces) or Adjacent Network (for wireless protocols); Network for cloud/OTA-related findings
- Attack Complexity: Low/High
- Privileges Required: often None (default/hardcoded access)
- User Interaction: None
- Scope: frequently Changed (single device compromise enabling network or fleet-wide impact)
- CIA Impacts: High/Low/None, with Critical device-control scenarios common

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
- binwalk/EMBA extraction logs and directory listings of the unpacked filesystem
- Exact file path and redacted excerpt of any recovered hardcoded credential, private key, or API token
- UART/JTAG session transcripts or screen recordings showing the interactive shell obtained
- Logic analyzer captures or annotated PCB photos identifying the exploited debug header/pinout
- Network captures (Wireshark/KillerBee) of the exploited IoT protocol exchange (MQTT/CoAP/Zigbee/Z-Wave)

## Remediation Guidance
- Implement firmware signing and enforce secure boot so unsigned or tampered images are rejected at the bootloader level
- Remove or physically disable debug interfaces (UART/JTAG/SWD) in production units, or gate them behind a challenge-response unlock mechanism
- Eliminate hardcoded credentials and shared keys; provision per-device unique credentials/keys at manufacturing time via a secure provisioning process
- Encrypt firmware images at rest and in transit, and require signed, integrity-checked OTA updates with rollback/downgrade protection
- Enforce authentication and transport encryption (TLS/DTLS) on all IoT protocol interfaces (MQTT, CoAP) and disable anonymous access

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
