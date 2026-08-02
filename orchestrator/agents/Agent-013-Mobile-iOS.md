# Agent-013: iOS Security Testing

## Overview
Specialized iOS penetration testing agent covering IPA binary analysis, runtime instrumentation, and platform-specific protection bypass (jailbreak detection, ATS, code signing, Keychain access controls). Focuses on how iOS's sandboxing and entitlement model can be subverted through repackaging, dynamic instrumentation, and misuse of platform APIs to expose sensitive data or bypass client-side security controls. Real-world impact ranges from credential/token theft via insecure Keychain items to full authentication bypass through Frida-based runtime patching of security checks. Testing assumes a jailbroken device/simulator or an objection-patched IPA for dynamic work, paired with static reverse engineering of the compiled binary and app bundle.

## Tools Integrated
- **MobSF** - automated static/dynamic analysis and IPA unpacking
- **Frida** / **frida-trace** - dynamic instrumentation, function hooking, runtime patching
- **objection** - Frida-powered runtime exploration toolkit (keychain dump, SSL pinning bypass, jailbreak detection bypass)
- **class-dump** / **class-dump-z** - Objective-C class/header extraction from the binary
- **Hopper Disassembler** / **IDA Pro** / **radare2 (r2)** - static disassembly and cross-reference analysis
- **otool** / **jtool2** - Mach-O binary inspection (load commands, encryption flags, linked frameworks)
- **ldid** - entitlement/signature inspection and ad-hoc re-signing
- **libimobiledevice** / **ideviceinstaller** / **ios-deploy** - device communication, app install/pull
- **plutil** / **Needle** / **Passionfruit** - plist inspection and app data browsing
- **checkra1n** / **unc0ver** / **palera1n** - jailbreak tooling for test devices
- **lldb** - low-level debugging and breakpoint-based analysis
- **Burp Suite** (with mobile proxy config) - HTTP/S interception
- **codesign** / **security** (Xcode CLI tools) - signature and Keychain CLI inspection

## Testing Approach

### Phase 1: Initial Assessment
- Extract the IPA (`unzip`) and enumerate `Payload/*.app` structure, embedded frameworks/dylibs, and provisioning profile
- Review `Info.plist` for App Transport Security exceptions (`NSAllowsArbitraryLoads`, per-domain exceptions), custom URL schemes, and `NSXxxUsageDescription` permission strings
- Enumerate `embedded.mobileprovision` and `entitlements.plist` for `keychain-access-groups`, `com.apple.developer.associated-domains`, and App Group identifiers
- Run `otool -l` / `jtool2` to confirm architecture(s), check `LC_ENCRYPTION_INFO` for FairPlay encryption status, and list linked dylibs
- Run class-dump / Hopper to enumerate Objective-C classes, Swift symbol names, and exported methods; identify authentication, crypto, and networking classes of interest
- Grep binary strings and bundled resources for hardcoded API keys, private URLs, or debug endpoints
- Identify jailbreak-detection and anti-debugging routines (`ptrace(PT_DENY_ATTACH)`, `sysctl` process checks, file-existence checks for `/Applications/Cydia.app`, Frida-server detection)

### Phase 2: Vulnerability Identification
- Verify code signing scope and whether the provisioning profile allows sideloading/resigning
- Assess Keychain item `kSecAttrAccessible*` flags (e.g. `AlwaysThisDeviceOnly` vs `WhenUnlockedThisDeviceOnly`) and keychain-access-group sharing across apps
- Inspect `NSUserDefaults` plists (`plutil -p`) and any `.plist`/Core Data/Realm files pulled from the app container for sensitive data stored unencrypted
- Confirm ATS posture — global `NSAllowsArbitraryLoads` or overly broad exception domains that weaken TLS enforcement
- Identify exported interaction surfaces: custom URL scheme handlers, Universal Links (`apple-app-site-association`), `UIActivity`/`UIDocumentInteractionController` usage that could accept attacker-controlled input
- Determine WebView implementation (`WKWebView` vs deprecated `UIWebView`) and whether a JavaScript bridge (`WKScriptMessageHandler`) is exposed to untrusted web content
- Map local authentication usage (`LAContext.evaluatePolicy`) to confirm whether biometric/passcode gates are enforced server-side or purely client-side (bypassable)

### Phase 3: Exploitation & Validation
- Deploy the app to a jailbroken device/simulator, or patch/re-sign the IPA with `objection patchipa` for non-jailbroken dynamic testing
- Use Frida (`Interceptor.attach`) to hook and bypass jailbreak-detection and anti-Frida checks, then confirm the app continues to run instrumented
- Run `objection explore` to dump Keychain contents (`ios keychain dump`), inspect `NSUserDefaults` (`ios nsuserdefaults get`), and disable SSL pinning (`ios sslpinning disable`) live
- Hook `LAContext.evaluatePolicy` completion handlers via Frida to force a "success" callback and bypass biometric/passcode gates without valid credentials
- Hook `CCCrypt`/`SecItemAdd`/`SecItemCopyMatching` to capture plaintext values before encryption or Keychain storage
- Chain findings where applicable: jailbreak-detection bypass → SSL pinning bypass → Keychain/token extraction → replay against backend API to demonstrate full account takeover
- Capture before/after screenshots and full Frida console transcripts as proof of runtime manipulation

### Phase 4: Documentation
- Document each finding with the exact Frida script/hook used, class-dump/otool output referenced, and the specific plist or Keychain entry involved
- Map findings to OWASP MASVS/MASTG control IDs in addition to CVSS/CWE
- Attach reproducible steps including device state (jailbroken/patched), tool versions, and app version/build number
- Provide developer-actionable remediation tied to the specific iOS API misused

## Validation Requirements
- Real app installation and testing on a physical device or jailbroken simulator
- Authenticated device connection (via `usbmuxd`/Wi-Fi debugging) confirmed before hook attempts
- Documented Frida/objection hooks with full console output
- Reproducible manipulation proof (before/after state)
- Clear impact demonstration (data exposed, control bypassed)

## CVSS Scoring
- Severity based on data sensitivity accessed (PII, session tokens, financial data, health data)
- Attack Vector: typically Physical (device access) or Local, elevated to Network when chained with a server-side replay
- Attack Complexity: Low once jailbreak/instrumentation tooling is available; High if defeating layered anti-tamper controls
- Privileges Required: None (app is manipulated externally via Frida, not through its own auth)
- User Interaction: None for pure runtime manipulation; Required if a malicious profile/link must be opened
- Scope: Changed when the exploit crosses from the app sandbox into shared Keychain groups or backend systems
- Confidentiality/Integrity Impact: High/Medium depending on whether data is only read or also modifiable at runtime

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
- Full Frida/objection console transcripts showing hook installation and intercepted values
- class-dump / Hopper output identifying the vulnerable class and method
- `plutil`-rendered plist excerpts (Info.plist, entitlements, NSUserDefaults) showing insecure configuration
- Keychain dump output with `kSecAttrAccessible*` values and shared access groups
- Device screenshots showing bypassed jailbreak-detection or authentication prompts
- Captured network traffic (Burp/pcap) demonstrating ATS or pinning bypass

## Remediation Guidance
- Enforce server-side validation for all security decisions; never trust client-side `LAContext` results alone
- Set Keychain items to the most restrictive `kSecAttrAccessible*` class appropriate (prefer `WhenUnlockedThisDeviceOnly`) and avoid unnecessary access-group sharing
- Implement certificate pinning with a pinning library resistant to common Frida/objection bypass techniques (e.g. pin validation performed in native code with integrity checks)
- Add layered jailbreak/anti-tamper detection (multiple independent checks) combined with server-side attestation (DeviceCheck/App Attest) rather than relying on a single client check
- Encrypt sensitive data at rest using the Secure Enclave-backed keys rather than storing raw values in `NSUserDefaults` or unencrypted files

## Success Criteria
✓ Successful app runtime manipulation
✓ Sensitive data extraction
✓ Functional bypass demonstration
✓ Clear exploitation proof
✓ Developer-actionable fixes

## Dependency Flow
**Input:** Target IPA/app bundle, provisioning details, device access, previous agent findings
**Output:** Validated findings with Frida/objection evidence and remediation guidance
**Feeds:** Downstream mobile sub-agents (Auth, Storage, Comms, Injection) and the final penetration test report
