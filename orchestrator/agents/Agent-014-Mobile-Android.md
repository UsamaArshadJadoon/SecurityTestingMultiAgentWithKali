# Agent-014: Android Security Testing

## Overview
Comprehensive Android penetration testing agent covering APK reverse engineering, dynamic instrumentation, and exploitation of exported components (Activities, Services, Broadcast Receivers, Content Providers). Focuses on how Android's permission model, IPC surface, and app-level protections (root detection, SSL pinning, ProGuard/R8 obfuscation) can be defeated to expose sensitive data or hijack app functionality. Real-world impact ranges from theft of tokens/PII via insecure storage to full component hijacking through exported Activities/Intents or Frida-based bypass of client-side security logic. Testing covers both static bytecode analysis and dynamic on-device/emulator instrumentation.

## Tools Integrated
- **MobSF** - automated static/dynamic APK analysis
- **apktool** - APK decompilation to smali and resource extraction
- **jadx** / **jadx-gui** - Java source-level decompilation from DEX
- **Frida** / **frida-server** (on-device) - dynamic instrumentation and hooking
- **objection** - Frida-powered runtime exploration (root detection bypass, pinning bypass, storage dump)
- **adb (Android Debug Bridge)** - device/emulator communication, `am`/`pm` component invocation
- **drozer** - Android attack surface enumeration (exported components, IPC fuzzing)
- **Burp Suite** with mobile proxy configuration - HTTP/S interception
- **smali/baksmali** - bytecode-level patching and re-signing
- **apksigner** / **jarsigner** / **uber-apk-signer** - re-signing patched APKs
- **QARK** / **Androbugs** - additional static analysis for common misconfigurations
- **Genymotion** / **Android Studio AVD** - rooted emulator environments

## Testing Approach

### Phase 1: Initial Assessment
- Decompile the APK with `apktool d` for smali/resources and `jadx` for readable Java source
- Review `AndroidManifest.xml` for exported Activities/Services/Receivers/Providers (`android:exported="true"` or implicit export via intent-filters on API <31), requested permissions, and `debuggable`/`allowBackup` flags
- Identify `minSdkVersion`/`targetSdkVersion` to determine which exported-component defaults and platform mitigations apply
- Check for hardcoded secrets/API keys/tokens in decompiled source, resources (`res/values/strings.xml`), and `assets/`
- Inspect `network_security_config.xml` for cleartext traffic permissions and custom trust anchors
- Identify obfuscation level (ProGuard/R8) and whether class/method names remain meaningful, indicating reverse-engineering difficulty
- Enumerate native libraries (`lib/*.so`) for JNI-implemented crypto or anti-tamper logic requiring separate binary analysis (Ghidra/IDA)

### Phase 2: Vulnerability Identification
- Enumerate exported components with `drozer` (`app.package.attacksurface`, `app.activity.info`, `app.provider.info`) and confirm which can be invoked by any other installed app
- Test Content Providers for SQL injection and path traversal via `content://` URI manipulation (`app.provider.query`, `app.provider.download`)
- Check SharedPreferences (`/data/data/<pkg>/shared_prefs/*.xml`) and SQLite databases for unencrypted sensitive data
- Verify use of Android Keystore vs hardcoded/derived encryption keys for local crypto
- Assess `WebView` configuration: `setJavaScriptEnabled`, `addJavascriptInterface` exposure, `setAllowFileAccess`, and mixed-content handling
- Confirm SSL/TLS pinning implementation approach (OkHttp `CertificatePinner`, TrustManager customization) and whether it is client-side only and thus bypassable
- Identify root-detection and anti-Frida logic (checks for `su` binary, `Superuser.apk`, `RootBeer`, `ro.build.tags=test-keys`, Frida port/thread name scanning)

### Phase 3: Exploitation & Validation
- Deploy the APK to a rooted emulator/device and attach Frida (`frida-server`) for runtime hooking
- Use `objection explore` to bypass root detection (`android root disable`), disable SSL pinning (`android sslpinning disable`), and dump SharedPreferences/SQLite (`android hooking watch class`, `sqlite`)
- Invoke exported components directly via `adb shell am start/broadcast/startservice` or `drozer` modules to demonstrate unauthorized access without going through the app's own UI/auth flow
- Fuzz Content Provider URIs (`content query --uri`) for injection and unauthorized data access
- Hook crypto and auth-check methods (`Cipher.doFinal`, custom `isRooted()`/`checkAuth()` methods) with Frida `Java.use(...).implementation` overrides to force bypass
- Patch smali to neutralize root-detection/pinning checks, re-sign with `apksigner`, and reinstall to validate persistent bypass without live instrumentation
- Chain findings where applicable: root-detection bypass → SSL pinning bypass → exported component invocation → token/data exfiltration to demonstrate full compromise

### Phase 4: Documentation
- Document each finding with the exact `adb`/`drozer` command or Frida script used and its full output
- Reference specific manifest entries, smali methods, or decompiled Java classes involved
- Map findings to OWASP MASVS/MASTG control IDs in addition to CVSS/CWE
- Include APK version/build, device/emulator API level, and root method used for reproducibility

## Validation Requirements
- Real APK decompilation with source/smali evidence
- Device/emulator execution (rooted where required for bypass testing)
- Documented Frida/objection hooks with full console output
- Network capture evidence (Burp/pcap) for communication-related findings
- Reproducible exploitation steps including exact adb/drozer invocations

## CVSS Scoring
- Severity based on data confidentiality/integrity impact of the exposed component or data
- Attack Vector: typically Local or Adjacent Network (malicious co-installed app), elevated to Network when chained with backend replay
- Attack Complexity: Low for unprotected exported components; higher when defeating layered root/pinning checks
- Privileges Required: None for exported component abuse from another installed app
- User Interaction: None for background exploitation; Required if user must install a malicious companion app
- Scope: Changed when the exploit crosses from the vulnerable app into another app's data or backend systems
- CIA Impact: Variable based on data type exposed (PII, tokens, financial data)

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
- `jadx`/`apktool` decompiled output identifying the vulnerable class, method, or manifest entry
- Full `drozer`/`adb` command transcripts showing exported-component invocation and results
- Frida/objection console output showing bypassed root-detection/pinning checks and dumped storage
- `AndroidManifest.xml` and `network_security_config.xml` excerpts showing insecure configuration
- Captured network traffic (Burp/pcap) demonstrating cleartext transmission or pinning bypass

## Remediation Guidance
- Set `android:exported="false"` on components that do not require cross-app access, and add explicit permission checks/signature-level permissions where cross-app access is required
- Store sensitive data using Android Keystore-backed encryption (`EncryptedSharedPreferences`, `EncryptedFile`) rather than plaintext SharedPreferences/SQLite
- Implement certificate pinning via `Network Security Config` combined with runtime integrity checks resistant to common Frida bypass patterns
- Add layered, redundant root/tamper detection and pair it with server-side attestation (Play Integrity API) rather than relying on a single client-side check
- Enable and tune ProGuard/R8 obfuscation, and remove `android:debuggable`/`android:allowBackup` in release builds

## Success Criteria
✓ Successful APK decompilation
✓ Runtime API interception
✓ Data extraction proof
✓ Functional bypass demonstration
✓ Working code examples for fixes

## Dependency Flow
**Input:** Target APK, device/emulator access, previous agent findings
**Output:** Validated findings with drozer/Frida evidence and remediation guidance
**Feeds:** Downstream mobile sub-agents (Auth, Storage, Comms, Injection) and the final penetration test report
