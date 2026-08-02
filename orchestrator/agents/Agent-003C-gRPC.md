# Agent: gRPC Protocol Testing

## Overview
gRPC's binary Protobuf framing and HTTP/2 transport hide it from most web-focused tooling, so services frequently ship with weaker authorization discipline than an equivalent REST API — server reflection left enabled in production, per-method authorization skipped in favor of a single edge check, and cleartext or misconfigured TLS channels. This agent targets service/method enumeration (with or without reflection), per-method authentication/authorization bypass, protobuf-level fuzzing, and transport security, since gRPC is common in internal microservice meshes and mobile-app backends where it is assumed (often wrongly) to be out of easy reach.

## Tools Integrated
- grpcurl — reflection-based (or `.proto`-based) service/method enumeration and manual invocation
- grpcui — web UI for interactive exploration of a gRPC service's full method surface
- ghz — gRPC load/stress testing, repurposed for resource-exhaustion and concurrency-limit testing
- evans — interactive REPL-style gRPC client for scripted method chaining
- protoc / buf — extracting and compiling `.proto` definitions recovered from client binaries or mobile app packages
- mitmproxy (gRPC addon) / Wireshark with protobuf dissector — traffic interception and decoding
- apktool / jadx — extracting embedded `.proto` schemas from Android client binaries when server reflection is disabled
- testssl.sh / openssl s_client — TLS/mTLS channel configuration testing
- nuclei (grpc/ template family, where applicable)

## Testing Approach

### Phase 1: Initial Assessment
- Test whether server reflection is enabled: `grpcurl -plaintext <host>:<port> list` and `grpcurl -plaintext <host>:<port> describe <service>`
- If reflection is disabled, recover `.proto` definitions from mobile client binaries (apktool/jadx) or from captured traffic, then compile with protoc/buf to reconstruct the service definition
- Enumerate every service and method, noting streaming type (unary, server-streaming, client-streaming, bidirectional) since each has different abuse potential
- Identify the authentication mechanism in use (per-call metadata token, mTLS client certificates, custom interceptor headers) and where in the call chain it is enforced
- Assess the TLS/mTLS configuration with testssl.sh/openssl for cleartext fallback, weak ciphers, or missing client-certificate enforcement

### Phase 2: Vulnerability Identification
- Call every enumerated method with grpcurl while omitting or stripping auth metadata to test for missing per-method authentication/authorization (a common gap when only the gateway, not each service, checks auth)
- Test BOLA-style object access by manipulating object/ID fields inside the protobuf message payload (`-d '{"id": "<other-user-id>"}'`) to retrieve or modify another user's data
- Fuzz message fields with ghz/custom scripts using malformed protobuf (oversized repeated fields, integer overflow/underflow, unexpected field types) to surface crashes or unexpected behavior
- Test streaming methods for resource exhaustion by opening many concurrent bidirectional/server streams and measuring service degradation
- Confirm whether the reflection service itself is reachable from an untrusted network segment in "production" (info disclosure of the entire internal API surface, including internal-only methods)
- Test for TLS downgrade or plaintext-listener fallback alongside the intended secure endpoint

### Phase 3: Exploitation & Validation
- Build a grpcurl PoC command demonstrating a sensitive method invoked successfully with no or forged authentication metadata
- Replay a captured mitmproxy gRPC call with a modified object-ID field to prove cross-account data access
- Run a ghz-based load PoC showing measurable service degradation/resource exhaustion from a small number of malicious streaming connections
- Where reflection discloses internal-only methods, chain that disclosure into an unauthorized call against one of them to demonstrate real impact beyond information disclosure

### Phase 4: Documentation
- Detailed finding documentation with full grpcurl/ghz command lines and decoded JSON request/response
- CVSS 3.1 scoring
- OWASP API Top 10 / CWE mapping
- Remediation guidance covering interceptor-level authorization and channel security
- Developer-actionable recommendations

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring
- Severity: Based on impact level
- Attack Vector: Network
- Privileges: Varies by vulnerability
- User Interaction: Sometimes required
- Scope: Changed where applicable
- CIA Impact: Varies by finding

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
- Full `grpcurl list`/`describe` output enumerating the reflected service surface
- Decoded protobuf request/response pairs (`grpcurl -d`) for each finding
- ghz load-test output showing resource exhaustion or degraded latency/error rate under crafted concurrency
- TLS/mTLS/cipher scan results (testssl.sh/openssl output)
- Reflection-disclosed internal/admin method list where exposed in production

## Remediation Guidance
- Disable the reflection service in production deployments (or restrict it to an internal-only debug listener)
- Enforce authentication and authorization via interceptors on every method, not only at the gateway/edge
- Validate object ownership per method call (server-side), never trusting an ID supplied in the request payload
- Apply message-size limits, field-count limits, and per-connection streaming concurrency caps
- Enforce mTLS or equivalent strong channel security with no plaintext fallback listener
- Monitor and alert on reflection queries or unauthenticated method invocation attempts

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided

## Dependency Flow
**Input:** Target scope, gRPC service endpoints, previous agent findings
**Output:** Validated gRPC findings with evidence
**Feeds:** Downstream agents and final penetration test report
