# Agent-014B-Mobile-Storage: Mobile Storage

## Overview
Specialized agent for on-device/local mobile storage security, covering everything an app persists to disk: Keychain (iOS) and Keystore-backed storage (Android), SharedPreferences/NSUserDefaults, SQLite/Realm/Core Data databases, cache and temp files, logs, and device backups. Focuses on identifying where sensitive data (credentials, tokens, PII, financial data, health data) is stored unencrypted, weakly encrypted, or with overly permissive accessibility, and whether that data survives into backups or is recoverable after app deletion. Real-world impact includes full data disclosure from a lost/stolen device, a local malware/rooted-device attacker, or a restored iTunes/iCloud/adb backup, without needing to defeat the app's network security at all.

## Tools Integrated
- **MobSF** - automated static/dynamic storage analysis
- **objection** - `ios nsuserdefaults get` / `ios keychain dump` / `android hooking watch` / SQLite exploration
- **adb** (`adb backup`, `adb shell run-as`, `adb pull`) - extracting Android app data directories and backups
- **libimobiledevice** / **idevicebackup2** - extracting and parsing iOS device/iTunes backups
- **DB Browser for SQLite** - inspecting extracted `.db`/`.sqlite`/Realm files for plaintext sensitive data
- **plutil** / **Passionfruit** - iOS plist inspection
- **Frida** - hooking file I/O and crypto APIs (`SecItemAdd`, `Cipher`, `NSKeyedArchiver`) to capture data pre-encryption
- **strings** / **binwalk** - scanning cache/log files and app binaries for leaked secrets
- **APKLab** / **jadx** - static review of storage-related code paths

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every local storage location the app writes to: Keychain/Keystore, SharedPreferences/NSUserDefaults, app-private SQLite/Realm/Core Data files, external/shared storage (Android `getExternalFilesDir`), cache directories, and log files
- Pull the full app data directory (`adb shell run-as <pkg> ls -la /data/data/<pkg>` + `adb pull`, or a jailbroken `/var/mobile/Containers/Data/Application/<uuid>`) for offline analysis
- Statically identify which classes/methods write to each storage location and whether encryption wrappers (`EncryptedSharedPreferences`, `SQLCipher`, Keychain APIs) are used versus raw file writes
- Check manifest/plist flags controlling backup behavior (`android:allowBackup`, `android:fullBackupContent`, iOS `NSFileProtectionComplete` / `do not backup` attribute usage)
- Identify third-party SDKs (analytics, crash reporters, ad networks) that may independently cache sensitive data outside the app's own storage logic

### Phase 2: Vulnerability Identification
- Open extracted SharedPreferences XML / NSUserDefaults plist files directly and check for tokens, passwords, PII, or API keys stored in cleartext
- Open extracted SQLite/Realm databases with DB Browser and check whether sensitive columns are encrypted (SQLCipher) or plaintext, and whether the encryption key itself is derivable from the binary or hardcoded
- Assess Keychain item accessibility attributes (`kSecAttrAccessibleAlways` and similar overly permissive classes) and unnecessary keychain-access-group sharing
- Assess Android Keystore usage — is the actual encryption key stored in the Keystore (hardware-backed) or is a static/derived key embedded in code protecting an otherwise "encrypted" database?
- Check cache directories, crash logs, and `Log.d`/`NSLog`/`print` statements (via `adb logcat` / device console) for sensitive data leaked at runtime
- Verify whether sensitive data (session tokens, cached credentials) survives an `adb backup` or iOS device backup and can be restored to a different device to hijack the session
- Check clipboard usage for sensitive fields (e.g. OTP/password auto-copied) that other apps could read

### Phase 3: Exploitation & Validation
- Perform a full `adb backup` (or use `idevicebackup2` on iOS if backup encryption is off/weak) and parse the resulting archive to extract and demonstrate recovery of sensitive data without root/jailbreak
- Use Frida to hook file-write and crypto APIs (`Cipher.doFinal`, `SecItemAdd`, `NSKeyedArchiver.archivedData`) to capture the plaintext value immediately before it is persisted, proving what is actually stored regardless of claimed encryption
- Use `objection`'s SQLite module or DB Browser to directly query extracted databases and display recovered plaintext credentials/PII as PoC
- Demonstrate that a hardcoded/derivable encryption key allows offline decryption of the "encrypted" database using a small script built from the recovered key
- Restore an extracted backup/token to a second device or emulator and confirm the session remains valid (session/device binding bypass)
- Chain findings where relevant: weak Keystore/Keychain protection → local data extraction → session restoration on attacker-controlled device

### Phase 4: Documentation
- Document each finding with the exact file path, extracted content excerpt (redacted where necessary), and the extraction method used (adb pull, backup, jailbreak)
- Reference the specific storage API/class responsible and whether an encrypted alternative was available but unused
- Map to OWASP MASVS (MSTG-STORAGE series) in addition to CVSS/CWE
- Include device/OS version and root/jailbreak state required for extraction, for accurate risk framing

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
- Extracted file/database excerpts (redacted) showing plaintext sensitive data
- Frida hook output capturing plaintext values pre-encryption/pre-storage
- `adb backup`/device backup archive contents demonstrating data recoverability
- Keychain/Keystore attribute dumps showing overly permissive accessibility settings
- Screenshots of DB Browser/objection sessions displaying recovered credentials or PII

## Remediation Guidance
- Use platform secure storage correctly: Keychain with `WhenUnlockedThisDeviceOnly` (iOS) and Keystore-backed `EncryptedSharedPreferences`/`EncryptedFile` (Android) instead of plaintext files
- Never derive or hardcode database encryption keys in the binary; generate keys via hardware-backed Keystore/Secure Enclave and never export them
- Disable backup of sensitive data (`android:allowBackup="false"` or exclude specific files; iOS `isExcludedFromBackup` on sensitive files) or ensure backups are encrypted end-to-end
- Strip verbose logging of sensitive data from release builds and scrub third-party SDK logging
- Bind sensitive tokens to device identity where feasible so a restored backup/token cannot be reused on a different device

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
