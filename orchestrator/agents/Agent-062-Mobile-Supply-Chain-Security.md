# Agent-062-Mobile-Supply-Chain-Security: Mobile App Supply Chain Security

## Overview
Testing the mobile application supply chain end-to-end: code-signing and provisioning-profile integrity, the CI/CD pipeline that builds and publishes the app to an app store, the third-party SDKs and dependencies bundled into the final package, and the update/distribution mechanism the app relies on for both app-store releases and any over-the-air (OTA) JS/asset bundle updates (e.g., CodePush-style or Expo-style update channels). A mobile app is only as trustworthy as the weakest link in the chain that produced it — a debug-signed production build, an over-permissioned CI runner with hardcoded publishing credentials, an outdated ad/analytics SDK with a known remote-code-execution CVE, or an OTA update endpoint that accepts unsigned JS bundles can each independently compromise every install of the app regardless of how secure the app's own first-party code is. Real-world impact ranges from silent distribution of a malicious build to the entire user base via a compromised OTA channel, to a single leaked signing credential enabling an attacker to publish a fully trusted, look-alike update.

## Tools Integrated
- **apktool / jadx** (Android) and **class-dump / otool** (iOS, where package access allows) — extracting and reviewing signing metadata, entitlements, and embedded provisioning profile contents
- **openssl** — parsing and validating certificate chains, expiry dates, and signature algorithms used for code signing
- **MobSF** — automated SDK/library inventory extraction and known-vulnerability cross-referencing across the compiled package
- **OWASP Dependency-Check / Dependency-Track** — building a software bill of materials (SBOM) for third-party mobile SDKs and cross-referencing against known CVE databases
- **Custom Python scripts (requests + plistlib + xml parsing)** — parsing `AndroidManifest.xml`, `Info.plist`, and embedded `embedded.mobileprovision` files to extract entitlements, permissions, debuggable/production flags, and provisioning-profile expiry/device-restriction details programmatically
- **CI/CD configuration review (Fastlane `Fastfile`/`Appfile`, GitHub Actions/Bitrise/App Center YAML)** — where pipeline configuration is in scope, reviewing for hardcoded signing credentials, overly broad runner permissions, and unsigned artifact publishing steps
- **frida / objection** — confirming at runtime whether a production build retains debug-enabling entitlements (e.g., `get-task-allow`) that should have been stripped by the signing/release pipeline

## Testing Approach

### Phase 1: Initial Assessment
- Extract the app package and enumerate its signing certificate(s): issuer, validity window, signing algorithm, and whether the build is signed with a production distribution certificate versus a debug/ad-hoc/enterprise certificate
- Parse the embedded provisioning profile (iOS) or signing configuration (Android) for entitlements granted (`get-task-allow`, background modes, keychain access groups), device-ID restrictions, and expiry date
- Inventory every third-party SDK and dependency bundled into the app (ad networks, analytics, crash reporting, payment SDKs) along with pinned versions, and cross-reference each against known-CVE databases
- Where CI/CD configuration files are in scope and accessible (repository-based pipeline definitions), review them for hardcoded signing credentials/API keys, third-party runner permissions, and whether build artifacts are signed/verified before publishing
- Identify the app's update mechanism(s): standard app-store updates, and any OTA/JS-bundle update channel (CodePush-style, Expo-style, or custom), including the update-check endpoint and whether update packages are signed

### Phase 2: Vulnerability Identification
- **Code-signing/provisioning integrity issues**: confirm whether a production-distributed build retains debug-enabling entitlements (`get-task-allow: true`, debuggable Android manifest flag) that should never ship to end users, and whether the provisioning profile is expired, soon-to-expire, or overly permissive (wildcard app ID, excessive entitlements beyond what the app functionally needs)
- **CI/CD-to-app-store pipeline security**: identify hardcoded signing certificates, private keys, or publishing API tokens committed to pipeline configuration or exposed in build logs, and assess whether the pipeline enforces artifact signing/verification before submission to the app store
- **Third-party SDK/dependency risk**: flag bundled SDKs with known CVEs (especially ad/analytics SDKs with historical RCE, insecure deep-link handling, or excessive data-exfiltration behavior), and assess whether any SDK requests permissions or network destinations disproportionate to its stated function
- **App-store metadata/update-mechanism tampering risk**: test whether the OTA/JS-bundle update endpoint validates a cryptographic signature on the update package before the app applies it, and whether the update-check request/response can be intercepted or redirected (missing pinning on the update channel specifically) to serve a malicious bundle
- **Distribution channel confusion**: check whether the app accepts installs/updates from unofficial distribution channels (enterprise/ad-hoc profiles still valid and installable outside the app store) that bypass app-store review entirely

### Phase 3: Exploitation & Validation
- Confirm via Frida/objection that a production build with a retained debug entitlement (`get-task-allow`) can be attached to and instrumented on a non-jailbroken/non-rooted device, demonstrating that the release pipeline failed to strip debug capability
- Where the OTA update endpoint lacks package-signature verification, construct and push a benign test payload through the update channel (or against a staging/test channel if production is out of scope) to confirm the app would apply an unsigned/attacker-modified bundle
- For a bundled SDK with a known CVE reachable from the host app's normal usage (e.g., an insecure deep-link handler in an ad SDK), demonstrate the exploit path end-to-end within the context of the host app
- Where CI/CD credentials or signing material were found exposed, demonstrate (in a safe, scoped test — e.g., against a test/staging publishing target only) the ability to build and prepare a tampered artifact using the recovered credentials, without actually publishing to a real production channel
- Chain an expired/overly-permissive provisioning profile finding with a device-restriction bypass to show the build is installable/runnable outside its intended distribution boundary

### Phase 4: Documentation
- Document each finding with the extracted signing certificate/provisioning profile details, SDK inventory with matched CVEs, or the specific CI/CD configuration line exposing sensitive material
- Include the SBOM generated for the app so remediation owners can prioritize which dependencies to update first
- Clearly separate findings by remediation owner: release-engineering/signing team, CI/CD platform team, or app development team (SDK selection), since supply-chain findings often span organizational boundaries
- Map findings to relevant CWE categories (e.g., CWE-1104 for use of unmaintained third-party components) in addition to CVSS

## Validation Requirements
✓ Real vulnerability confirmation
✓ Authentic tool output evidence
✓ Reproducible exploitation proof scoped safely to test/staging channels where destructive actions (publishing) are involved
✓ Clear technical documentation
✓ Developer-actionable remediation

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: Physical/Local for on-device signing/entitlement findings; Network for OTA-update and CI/CD-credential-exposure findings
- Attack Complexity: High for findings requiring compromise of a build pipeline or distribution channel; Low for directly observable production-build entitlement/signing weaknesses
- Privileges Required: varies — None for app-store-side observations, potentially High for CI/CD-credential-dependent scenarios
- Scope: frequently Changed for OTA-update-hijack and CI/CD-credential findings, since impact extends to the entire installed user base rather than a single session
- CIA Impact: Integrity typically High for supply-chain-tampering findings; Confidentiality High where signing keys/CI credentials are exposed

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
  "cwe_id": "CWE-1104",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Parsed signing certificate/provisioning profile output showing entitlements, expiry, and distribution type
- SBOM/dependency scan output listing bundled SDKs, versions, and matched CVEs
- Frida/objection session output confirming instrumentability of a production-signed build
- Redacted CI/CD configuration excerpt showing the exposure pattern (credential location, permission scope) without disclosing the live secret value itself
- OTA update-channel request/response capture showing absence of package-signature verification

## Remediation Guidance
- Strip all debug-enabling entitlements and flags from production release builds, and enforce this via an automated pipeline gate rather than manual review
- Store signing certificates, provisioning profiles, and publishing credentials exclusively in a dedicated secrets manager scoped to the release pipeline, never in repository files or build logs
- Maintain a continuously updated SBOM for bundled mobile SDKs and set a policy threshold (e.g., no SDK with an unpatched Critical/High CVE) enforced before each release
- Cryptographically sign every OTA/JS-bundle update package and verify that signature client-side before applying the update, in addition to pinning the update-check channel itself
- Restrict enterprise/ad-hoc distribution profiles to the minimum necessary device set and expiry window, and monitor for builds signed with non-production certificates reaching end-user devices

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided
✓ Findings safely scoped to avoid impacting real production distribution channels

## Dependency Flow
**Input:** Target scope, extracted application package, CI/CD configuration (where in scope), previous agent findings (mobile static analysis)
**Output:** Validated supply-chain findings with evidence
**Feeds:** Downstream agents (Cross-Platform Framework Security, Mobile Auth) and final penetration test report
