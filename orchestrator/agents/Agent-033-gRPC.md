# Agent-033-gRPC: gRPC

## Overview
gRPC security testing focused on server reflection abuse and streaming-specific denial-of-service/resource-exhaustion issues, complementary to Agent-003C's coverage of core gRPC authentication/authorization and protobuf message-tampering testing. gRPC's binary Protobuf framing and HTTP/2 transport make it opaque to traditional web scanners, and many teams leave server reflection (`grpc.reflection.v1alpha.ServerReflection`) enabled in production for internal tooling convenience — effectively exposing the full service/method/message schema to any client that can reach the port. Combined with HTTP/2's native support for long-lived bidirectional streams, this creates a distinct attack surface: full API enumeration without source code or `.proto` files, and resource-exhaustion vectors (unbounded streaming, flow-control abuse, unclosed streams) that don't exist in traditional unary REST APIs. Real-world impact includes complete internal API surface disclosure via reflection, and service-level DoS from a single malicious streaming client exhausting server threads/memory.

## Tools Integrated
- grpcurl - reflection-based service/method enumeration and manual unary/streaming RPC invocation
- grpcui - web UI wrapper over grpcurl/reflection for interactive exploration and manual testing
- ghz - gRPC load-testing tool repurposed for streaming DoS and flow-control abuse testing
- protoscope / protoc --decode_raw - raw Protobuf wire-format inspection when reflection is disabled and `.proto` files are unavailable
- Wireshark (with HTTP/2 and gRPC dissectors) - HTTP/2 stream-level analysis, flow-control window inspection, and frame-level abuse detection
- BloomRPC / Postman gRPC support - GUI-based request crafting against enumerated services
- Custom Python (grpcio + protobuf) scripts - scripted streaming abuse harnesses (unbounded message floods, slow-drip streams, stream-count exhaustion)

## Testing Approach

### Phase 1: Initial Assessment
- Probe the target port for gRPC Server Reflection (`grpc.reflection.v1alpha.ServerReflection` or `v1`) using `grpcurl -plaintext <host>:<port> list`
- If reflection is enabled, fully enumerate every exposed service, method, and nested message/enum type, and export the reconstructed `.proto` schema for downstream use
- If reflection is disabled, attempt schema recovery via HTTP/2 traffic capture, decompiled client binaries/mobile APKs, or `protoc --decode_raw` against captured raw frames
- Classify every discovered method by RPC type: unary, server-streaming, client-streaming, or bidirectional-streaming, since each has a distinct abuse profile
- Identify TLS configuration (mutual TLS vs. plaintext/`h2c`) and any load balancer/gateway (Envoy, Traefik, gRPC-Gateway) translating REST to gRPC in front of the service

### Phase 2: Vulnerability Identification
- If reflection is enabled on an externally reachable or otherwise untrusted-network endpoint, treat full schema/method disclosure as a finding in its own right and use it to accelerate discovery of unauthenticated or under-authorized internal/admin methods
- Invoke every enumerated method directly via grpcurl without going through the intended client to check for methods missing authentication/authorization that are otherwise hidden behind client-side logic
- For server-streaming methods, open a stream and never send flow-control credit or never close it, repeated across many concurrent connections, to test for unbounded resource consumption (memory, goroutines/threads, file descriptors) per open stream
- For client-streaming/bidirectional methods, send a very large number of messages or oversized individual messages without ever completing the call, testing for missing per-stream message-count or byte-size limits
- Test HTTP/2-level abuse: rapid stream creation/reset (similar to HTTP/2 Rapid Reset), sending `HEADERS` with no follow-up `DATA`, and manipulating flow-control window updates to stall server-side buffers
- Test whether deadline/timeout metadata (`grpc-timeout`) is enforced server-side, or whether a client can omit it to hold a stream open indefinitely
- Test error-handling/status-code responses for information leakage (stack traces, internal hostnames, SQL fragments in `google.rpc.Status` details)

### Phase 3: Exploitation & Validation
- Produce a complete enumerated method/message inventory purely from reflection, then demonstrate at least one previously-unknown-to-testers method being successfully invoked with sensitive effect
- Demonstrate a measurable DoS: server resource usage (CPU, memory, thread/goroutine count, or open file descriptors) climbing under a scripted streaming-abuse load until service degradation or crash, captured with before/after metrics
- Demonstrate a working race/flood exploit where sustained unbounded streaming or rapid stream churn measurably degrades response latency or availability for legitimate concurrent clients
- Confirm reproducibility by running the streaming-abuse script multiple times and observing consistent resource-exhaustion behavior
- Where reflection exposed an unauthenticated sensitive method, chain it to a concrete data-disclosure or state-change PoC

### Phase 4: Documentation
- Detailed finding documentation including the full reflection-derived schema excerpt or captured raw Protobuf frames
- CVSS 3.1 scoring reflecting availability impact for streaming DoS and confidentiality impact for reflection-driven disclosure
- OWASP/CWE mapping (CWE-200 Information Exposure for reflection, CWE-400/CWE-770 Resource Exhaustion for streaming DoS)
- Remediation guidance covering reflection service configuration and stream resource limits
- Developer-actionable recommendations with concrete server configuration/interceptor code

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
- Full grpcurl reflection dump output (`list`, `describe`) showing every disclosed service/method/message
- ghz/custom-script load reports showing latency and error-rate degradation during streaming-abuse trials
- Server-side resource metrics (CPU/memory/thread/connection counts) captured before, during, and after the streaming DoS attempt
- Wireshark HTTP/2 capture showing abnormal stream creation/reset rates or stalled flow-control windows
- Raw request/response transcripts (grpcurl `-v` output) for any unauthenticated sensitive method invocation

## Remediation Guidance
- Disable server reflection in production/externally-reachable environments, or restrict it to authenticated internal-only network paths
- Enforce authentication and per-method authorization at the interceptor/middleware layer server-side, independent of what the client SDK exposes
- Set explicit per-stream limits: maximum message size, maximum messages per stream, maximum stream duration, and maximum concurrent streams per client/connection
- Enforce server-side deadlines even when a client omits `grpc-timeout`, and aggressively reap idle or stalled streams
- Rate-limit stream creation per client/IP and monitor for rapid stream-reset patterns consistent with HTTP/2-layer abuse

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
