# Agent-046-LoadBalancer-ReverseProxy: Load Balancer & Reverse Proxy Security

## Overview
Targets the load-balancer and reverse-proxy layer (Nginx, HAProxy, F5 BIG-IP, Envoy, Traefik) that sits directly in front of the application and is frequently trusted implicitly by everything behind it — a misconfiguration here can smuggle requests past a WAF, poison caches for every downstream user, or expose an administrative surface never intended to be internet-facing. This layer is a uniquely high-leverage target because a single flaw (an HTTP request-smuggling desync, a trusted-but-unvalidated `X-Forwarded-For`, an exposed health-check endpoint) compromises the security assumptions of every application behind the proxy simultaneously, not just one endpoint. This agent treats the proxy as its own attack surface distinct from the application it fronts.

## Tools Integrated
- Burp Suite (HTTP Request Smuggler extension) — automated and manual CL.TE/TE.CL/TE.TE desync probing against the LB/proxy chain
- smuggler.py / h2csmuggler — standalone request-smuggling and HTTP/2-downgrade smuggling detection tools for confirming findings outside Burp
- curl / httpie with raw socket control (`--http1.0`, `--http2`, custom `Transfer-Encoding`/`Content-Length` header pairs) — manual desync confirmation and minimal reproducible PoC construction
- nmap / nmap NSE (http-methods, http-trace) — service fingerprinting of the proxy/LB itself and discovery of exposed management ports (F5 iControl REST on 8443, Traefik dashboard on 8080, HAProxy stats page)
- testssl.sh / sslscan — TLS-termination configuration review specifically at the edge, including cipher downgrade and certificate-mismatch checks between the public-facing cert and internal backend expectations
- Custom Python (requests + raw socket via `http.client`/low-level `socket`) script to systematically send crafted `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`, `X-Real-IP`, and `Forwarded` header combinations and diff application-observed values (via an echo/debug endpoint or response-based inference) against what was actually sent, revealing trust/parsing inconsistencies no off-the-shelf tool checks for
- Custom Python config-diff script comparing a pulled Nginx/HAProxy/Envoy/Traefik config file against a curated checklist of known-risky directives (`proxy_pass` without proper header stripping, `merge_slashes off`, permissive CORS reflected at the edge, wildcard `server_name`)

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint the exact proxy/LB software and version via response headers (`Server`, `Via`, `X-Powered-By`), error-page signatures, and behavioral quirks (chunked-encoding handling, header-casing normalization)
- Enumerate every distinct entry point through the LB/proxy chain (multiple vhosts, multiple backend pools, HTTP/1.1 vs HTTP/2 vs HTTP/3 listeners) since smuggling and header-trust behavior can differ per listener
- Identify and catalog all `X-Forwarded-*`/`Forwarded` header usage the application relies on for IP-based logic (rate limiting, geo-restriction, auth decisions) so header-trust testing in Phase 2 targets logic that actually matters
- Probe for exposed non-application endpoints on the LB/proxy itself: health-check paths (`/healthz`, `/status`, `/haproxy?stats`), admin/dashboard interfaces, and metrics endpoints (`/metrics` on Envoy/Traefik)

### Phase 2: Vulnerability Identification
- Run systematic CL.TE, TE.CL, and TE.TE desync probes (Burp HTTP Request Smuggler, cross-checked with smuggler.py) against every distinct listener/backend-pool combination identified in Phase 1, since smuggling behavior depends on the specific front-end/back-end parser pairing
- Use the custom Python header-trust script to send spoofed `X-Forwarded-For`/`X-Real-IP` values and determine whether the application (or the LB's own rate-limiting/ACL logic) trusts the client-supplied value over the actual TCP-connection source, enabling IP-based control bypass
- Test whether the LB/proxy correctly strips or overwrites client-supplied forwarding headers before passing to the backend, versus naively appending/merging them (a common misconfiguration that lets a client inject a trusted-looking header value)
- Attempt unauthenticated access to discovered health-check, stats, dashboard, and metrics endpoints, checking for information disclosure (backend IPs, internal hostnames, config details, credentials in metrics labels) or unauthenticated administrative actions
- Review pulled configuration files (where accessible) against the risky-directive checklist for cache-poisoning setup (unkeyed headers included in cache key logic), missing `proxy_pass` header sanitization, and permissive CORS/redirect handling applied at the edge

### Phase 3: Exploitation & Validation
- For a confirmed smuggling primitive, escalate to a concrete impact scenario: request queue poisoning to hijack another user's response, cache poisoning serving malicious content to subsequent visitors, or WAF/ACL bypass by smuggling a second request the WAF never inspects
- For a confirmed header-trust bypass, chain it into whatever the trusted header actually gates — demonstrate a rate-limit bypass, an IP-allowlist bypass, or an audit-log spoof using a crafted `X-Forwarded-For` value
- For exposed admin/stats/dashboard endpoints, confirm the exact unauthenticated actions possible (read-only info disclosure versus configuration-changing/restart actions) and document the specific data or control exposed
- Cross-check every smuggling and header-trust finding with a minimal, single-request curl/raw-socket reproduction so the finding does not depend on Burp's specific request framing

### Phase 4: Documentation
- Document each finding with the exact listener/vhost, the raw request bytes used (including precise `Content-Length`/`Transfer-Encoding` framing), and the observed desync/bypass evidence
- Capture before/after evidence for header-trust findings: header sent versus value the application/LB actually acted upon
- Note the specific proxy software/version and configuration directive responsible where determinable, to speed remediation
- Map to CVSS/OWASP/CWE as usual, escalating Scope to Changed where a smuggling primitive affects other users' requests/responses

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
  "owasp_category": "A05:2021 - Security Misconfiguration",
  "cwe_id": "CWE-444",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Raw request/response captures (exact bytes) proving CL.TE/TE.CL/TE.TE desync behavior
- Header-trust diff logs from the custom Python script showing spoofed-header value versus application-observed value
- Screenshots/responses from exposed health-check, stats, dashboard, or metrics endpoints
- Pulled configuration excerpts showing the specific risky directive
- testssl.sh/sslscan output for edge TLS-termination findings

## Remediation Guidance
- Normalize request framing at the edge: reject or normalize ambiguous requests containing both `Content-Length` and `Transfer-Encoding`, and ensure front-end/back-end parsers agree on framing (upgrade to HTTP/2 end-to-end where feasible to eliminate the smuggling class entirely)
- Explicitly strip and regenerate `X-Forwarded-For`/`X-Real-IP`/`Forwarded` headers at the trust boundary rather than appending to client-supplied values; only trust these headers when set by the LB itself
- Restrict health-check, stats, dashboard, and metrics endpoints to internal-only network access or place them behind authentication, never exposed on the public listener
- Include only server-controlled values (never raw unkeyed client headers) in cache-key generation to prevent cache poisoning
- Keep proxy/LB software patched to current stable releases and periodically diff production configuration against a hardened baseline

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/ops understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, service/port inventory from Infrastructure agent, previous agent findings
**Output:** Validated findings with evidence, including confirmed smuggling primitives and header-trust map
**Feeds:** API Security, Authentication, Rate-Limiting, and Cloud agents; final penetration test report
