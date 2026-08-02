# Agent-061-CrossPlatform-Framework-Security: Cross-Platform Framework Bridge Security

## Overview
Testing the JS-to-native and Dart-to-native bridge layers used by cross-platform mobile frameworks — React Native, Flutter, Xamarin, and Ionic/Capacitor (and Cordova-style hybrid WebViews) — where a fundamentally different trust boundary exists compared to fully-native apps: script code (JavaScript or Dart) running in an embedded runtime can invoke native functionality through a bridge, and that bridge is only as safe as the validation applied on both sides of it. Common failure modes include native modules exposed to the bridge without re-validating arguments (trusting the JS/Dart side implicitly), Flutter method channels registered without sender/argument validation, unencrypted or unobfuscated JS bundles/Dart snapshots that leak API keys or business logic to anyone who extracts the app package, and WebView-to-native bridges (`addJavascriptInterface`, Capacitor plugin bridges) reachable from any content the WebView loads, including a compromised or malicious third-party page. Real-world impact ranges from disclosure of embedded secrets and full business-logic reverse engineering to native code execution or arbitrary file-system access triggered purely from script-side input.

## Tools Integrated
- **Frida** / **objection** — runtime hooking of bridge entry points (`RCTBridge`/`RCTModuleMethod` invoke paths in React Native, `MethodChannel.setMethodCallHandler` in Flutter, `JavascriptInterface`-annotated methods in Android WebViews) to observe and tamper with cross-boundary arguments live
- **jadx** / **apktool** (Android) and **class-dump** (iOS) — static extraction and review of native module/plugin registration code, permission surfaces, and exported bridge interfaces
- **Hermes bytecode disassembler / react-native-decompiler** — recovering readable JS from a compiled Hermes bundle (`index.android.bundle`) to review for hardcoded secrets and to identify unvalidated bridge call sites
- **Blutter / reFlutter** — extracting and analyzing the Dart AOT snapshot (`libapp.so`, `isolate_snapshot_data`) from Flutter apps to recover method channel names, argument schemas, and embedded secrets since Flutter bundles are not shipped as readable JS
- **MobSF** — baseline automated static/dynamic scan across all four frameworks to quickly identify obvious exposed components, permissions, and hardcoded credentials before manual bridge-focused review
- **mitmproxy / Burp Suite** — intercepting bridge-adjacent network calls (Capacitor HTTP plugin, Xamarin `HttpClient`) to correlate bridge behavior with backend requests
- **Custom Frida scripts (Python-driven via frida-python)** — programmatically enumerating all registered native modules/method channels/JS interfaces at runtime and fuzzing each with malformed argument types/lengths to find native-side crashes or unchecked-index/path-traversal conditions

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint the cross-platform framework in use from the installed package: `libhermes.so`/`index.android.bundle` (React Native), `libflutter.so`/`libapp.so`/`flutter_assets/` (Flutter), Mono runtime assemblies and `.dll` files under `assemblies/` (Xamarin), `capacitor.config.json`/`config.xml` and a bundled `www/` WebView asset folder (Ionic/Capacitor/Cordova)
- Extract and statically review the JS bundle (deobfuscate/decompile Hermes bytecode) or Dart snapshot (Blutter/reFlutter) to recover bridge call sites, native module names, and any hardcoded API keys, backend URLs, or signing secrets
- Enumerate every native module/plugin exposed to the script layer: `NativeModules.*` (React Native), registered `MethodChannel`/`EventChannel` names (Flutter), `[Export]`-annotated bindings (Xamarin), and Capacitor/Cordova plugin manifests (`plugin.xml`, `capacitor.config.json` plugin list)
- For hybrid WebView apps, identify every `addJavascriptInterface`-registered object (Android) or `WKScriptMessageHandler` (iOS) reachable from loaded WebView content, and determine what content sources can reach that WebView (bundled assets only, versus any URL the app will navigate to)
- Map which bridge calls cross into filesystem, network, biometric, or payment-adjacent native functionality — these are the highest-value targets for Phase 2

### Phase 2: Vulnerability Identification
- **JS-to-native/Dart-to-native bridge injection**: using Frida, hook the bridge's argument-marshaling entry point and inject malformed, oversized, or type-confused arguments directly (bypassing any client-side JS/Dart validation entirely) to test whether the native side independently validates input before acting on it
- **Insecure native-module exposure**: identify native modules exposed to the bridge that perform sensitive actions (file read/write, shell/process invocation, credential store access) without any authorization or origin check, reachable by any script code regardless of how it entered the runtime
- **Flutter method-channel abuse**: use Frida to register a rogue handler on, or directly invoke, a discovered `MethodChannel` name with attacker-chosen arguments, testing whether channel handlers validate the calling context and argument schema rather than trusting well-formed-looking input
- **Bundled JS/Dart tampering and reverse engineering**: confirm whether the JS bundle is shipped without Hermes bytecode protection/obfuscation (or Dart snapshot without obfuscation flags), and whether hardcoded secrets recovered in Phase 1 are live/valid credentials against production backend endpoints
- **WebView-to-native bridge risk**: for hybrid apps, test whether the WebView loads any non-bundled/remote content (deep links, ads, third-party iframes) that can reach an exposed `JavascriptInterface`/plugin bridge method, and if so, craft a minimal HTML/JS payload that invokes a sensitive native action purely from that untrusted content
- **Bundle repackaging**: modify the extracted JS bundle or Dart assets, repackage the APK/IPA (apktool/codesigning bypass on a test device), and confirm whether the app loads and executes the tampered bundle without any integrity check

### Phase 3: Exploitation & Validation
- Build a Frida script (frida-python) that hooks the identified bridge invoke path and demonstrates a native-side action (file write outside the sandboxed app directory, or a native crash indicating memory corruption) triggered purely by a crafted script-side argument, with no legitimate app UI interaction required
- For the highest-value WebView-to-native finding, host a minimal malicious HTML page and, using only content the WebView will load (a crafted deep link, an ad creative, or a JS injection point identified during prior XSS testing), invoke the exposed native interface method to perform a sensitive action (read local storage, trigger a payment/native action) and capture the result
- Demonstrate that a bundle rebuilt with tampered JS/Dart logic (repackaged and resigned for a test device) is accepted and executed by the app with no integrity verification, showing supply-chain-adjacent tampering risk at the bundle level
- Where hardcoded secrets were recovered from the bundle/snapshot, validate them against the live backend to prove real credential exposure rather than a benign placeholder value
- Chain a confirmed bridge-injection finding with any previously found native-module-exposure gap to escalate from "script can call a native function" to "script can perform a privileged, security-relevant native action" (e.g., silently granting a permission, disabling a security control, or exfiltrating stored credentials)

### Phase 4: Documentation
- Document each finding with the exact Frida hook script, the specific bridge/method-channel/JS-interface name targeted, and the argument payload that triggered the unintended native behavior
- Include the decompiled/deobfuscated bundle excerpt showing the vulnerable call site or exposed secret, distinguishing genuinely reachable bridge exposure from theoretical/unreachable code
- Note the specific framework and version (React Native/Flutter/Xamarin/Capacitor) since bridge architecture and available mitigations differ meaningfully between them
- Map findings to OWASP MASVS (code quality/platform interaction requirements) in addition to CVSS/CWE

## Validation Requirements
✓ Authentic vulnerability reproduction via live bridge interaction (Frida hook or crafted WebView payload), not static review alone
✓ Real evidence from target system
✓ Reproducible exploitation steps
✓ Complete technical documentation identifying the exact bridge/channel/interface exploited
✓ Verified impact assessment
✓ Proper data organization for downstream agents

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: typically Local/Physical for bridge-injection findings requiring app instrumentation, Network where a remote WebView payload (malicious ad/deep link) reaches an exposed bridge interface
- Attack Complexity: Low for unvalidated native modules directly reachable via method-channel/bridge calls; High where exploitation requires chaining with an XSS/content-injection foothold first
- Privileges Required: None to Low depending on whether the attack requires local device access or only remote content delivery
- Scope: frequently Changed when a script-layer bug escalates into native-layer impact (file system, credential store, payment action)
- CIA Impact: varies by the specific native functionality reached; High where file system or credential access is achieved

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
  "owasp_category": "A08:2021 - Software and Data Integrity Failures",
  "cwe_id": "CWE-940",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Frida console/script output showing the bridge hook firing and the resulting native-side action or crash
- Decompiled/deobfuscated JS bundle or Dart snapshot excerpt showing the vulnerable call site or an exposed hardcoded secret
- HTML/JS PoC used to trigger a WebView-to-native bridge call, plus the captured native-side result
- Repackaged bundle/app artifact demonstrating acceptance of tampered script code with no integrity check
- Screenshots/log capture of the sensitive native action succeeding (permission grant, file write, credential access) triggered purely from script-layer input

## Remediation Guidance
- Independently validate every argument crossing the bridge on the native side (type, length, allowed value ranges) — never trust that the JS/Dart caller already validated it, since Frida/instrumentation can bypass client-side checks entirely
- Restrict native module/method-channel/JS-interface exposure to only the functionality genuinely needed by the app, and gate sensitive actions behind an explicit origin or capability check rather than exposing them unconditionally to any script caller
- Enable bytecode/Dart snapshot obfuscation and strip hardcoded secrets from the bundle; move sensitive keys to a backend-issued, short-lived token model instead
- Restrict WebView content loading to bundled/trusted origins only (disable arbitrary remote navigation where not required) and remove `addJavascriptInterface`/plugin bridge exposure from any WebView that can load untrusted or ad content
- Add bundle/snapshot integrity verification (signed manifest, checksum validation at app startup) so a tampered or repackaged bundle is detected and refused rather than silently executed

## Success Criteria
✓ Vulnerability authentically reproduced via live bridge interaction
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer understanding
✓ Impact clearly demonstrated (native-layer action triggered from script-layer input)
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, extracted application package, previous agent findings (mobile static analysis, WebView/XSS recon)
**Output:** Validated cross-platform bridge findings with evidence
**Feeds:** Downstream agents (Mobile Auth, Mobile Supply Chain Security) and final penetration test report
