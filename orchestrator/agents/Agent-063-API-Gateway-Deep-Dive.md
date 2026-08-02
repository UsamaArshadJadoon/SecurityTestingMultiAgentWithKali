# Agent-063-API-Gateway-Deep-Dive: API Gateway Platform Deep Dive

## Overview
A focused, platform-specific deep dive into the API gateway layer itself (Kong, Apigee, AWS API Gateway, Azure API Management) that goes beyond the general API Security agent's endpoint-level coverage to test the gateway's own policy engine, plugin configuration, and trust relationship with backend services. Gateways are frequently treated as a security control that "just works" once deployed, but plugin ordering bugs, per-route policy inconsistency, JWT-validation plugin misconfiguration, and backend services that blindly trust gateway-injected headers are all common, high-impact misconfigurations specific to how each platform implements policy enforcement. Because the gateway is usually the single chokepoint enforcing authentication and rate limiting for an entire API surface, a single gateway-layer bypass can undermine every route behind it at once — including routes individual endpoint-level testing already marked as "protected." Real-world impact includes full authentication bypass across an entire API surface, rate-limit evasion enabling brute-force/scraping at scale, and direct backend compromise when the backend trusts the gateway without independently verifying the request actually passed through it.

## Tools Integrated
- **Kong Admin API (via curl/Postman)** and **kong-python-pdk** references — reviewing route/service/plugin configuration where the admin endpoint is in scope or exposed, and testing plugin ordering/precedence
- **AWS CLI (`aws apigateway get-rest-apis`, `get-resources`, `get-authorizers`) / boto3** — enumerating deployed API Gateway stages, authorizers (Lambda/Cognito/IAM), usage plans, and resource policies
- **Azure CLI (`az apim`) / azure-mgmt-apimanagement (Python SDK)** — pulling APIM policy XML per API/operation to review `validate-jwt`, `rate-limit`, and `set-backend-service` policy configuration
- **Apigee Management API (via requests)** — retrieving deployed proxy bundles and shared flows to review `VerifyJWT`, `Quota`, and `AssignMessage` policy configuration
- **Burp Suite / Postman** — manual request crafting and replay against gateway-fronted routes, including direct-to-backend requests where the origin is discoverable
- **Custom Python scripts (requests + boto3/azure-mgmt-apimanagement + concurrent.futures)** — scripted rate-limit-bypass testing (rotating API keys/client IDs/`X-Forwarded-For` values across concurrent requests) and JWKS/JWT-plugin fuzzing at volumes impractical to do manually
- **jwt_tool** — algorithm-confusion and claim-tampering testing specifically against the gateway's JWT-validation plugin/policy, isolated from any additional validation the backend might also perform
- **ffuf** — enumerating gateway-level path/route configuration gaps (routes registered on the backend but not consistently covered by the same plugin chain as sibling routes)

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint the gateway platform in use from response headers and behavior (`Via: kong`, `X-Kong-*` headers; AWS `X-Amzn-RequestId`/`X-Amzn-Apigateway-*`; Apigee's distinctive error-page format and headers; Azure APIM's `Ocp-Apim-Trace-Location`/subscription-key requirement) and confirm the deployment model (self-hosted Kong vs. Kong Konnect, edge-optimized vs. regional AWS API Gateway, etc.)
- Where administrative access to configuration is in scope, pull the full policy/plugin configuration per route: Kong plugins and their ordering per route/service, AWS authorizer type and usage-plan throttling settings per stage, Azure APIM policy XML per API/operation, Apigee proxy bundle policies and shared flows
- Build a per-route matrix of which authentication, rate-limiting, and transformation plugins/policies are actually applied — do not assume uniform coverage; sibling routes under the same base path frequently have divergent plugin chains
- Identify how the gateway communicates trust to the backend: injected headers (`X-Consumer-ID`, `X-Consumer-Username`, `X-Apigee-*`, custom claims headers), mTLS between gateway and backend, or shared-secret headers
- Attempt to determine whether the backend origin is directly reachable bypassing the gateway entirely (internal IP exposed, backend hostname discoverable via DNS/certificate transparency, or backend accessible on a non-gateway port)

### Phase 2: Vulnerability Identification
- **Policy/plugin misconfiguration**: test for plugin-ordering issues where an authentication plugin executes after a caching/transformation plugin that could short-circuit the request, and identify routes missing a plugin/policy that sibling routes under the same path enforce
- **Rate-limit-policy bypass at the gateway layer**: test whether per-consumer rate limiting can be evaded by rotating API keys/client IDs across a shared account, whether limits keyed on client IP are bypassable via `X-Forwarded-For`/`X-Real-IP` header spoofing when the gateway trusts client-supplied forwarding headers, and whether distributed/concurrent request bursts reveal a race condition in the counter implementation allowing more requests through than the configured limit
- **JWT-validation-plugin misconfiguration**: test the gateway's own JWT plugin/policy (Kong `jwt`, Apigee `VerifyJWT`, APIM `validate-jwt`) independently of any backend-side validation — algorithm confusion (`RS256`→`HS256` using the public key as an HMAC secret), missing issuer/audience checks, acceptance of expired tokens due to clock-skew misconfiguration, and JWKS-endpoint cache-poisoning/staleness allowing a rotated-out key to remain trusted
- **Gateway-to-backend trust-boundary issues**: test whether the backend independently verifies gateway-injected identity headers or simply trusts any request bearing them, and whether those headers can be forged or overridden by a client when the request reaches the backend through an alternate path (direct backend access, or a gateway route lacking header-stripping/overwrite enforcement for client-supplied values matching trusted header names)
- **Client-supplied header smuggling into trust headers**: send client requests that pre-set the same header names the gateway uses to convey trust (e.g., a client sending its own `X-Consumer-ID`) to test whether the gateway correctly overwrites/strips these rather than passing through a client-controlled value

### Phase 3: Exploitation & Validation
- Where the backend origin is directly reachable, bypass the gateway entirely and replay a request that the gateway would normally block/rate-limit/authenticate, proving the gateway is a bypassable single point of enforcement rather than a defense-in-depth layer
- Forge a plausible gateway-trust header (e.g., `X-Consumer-ID` for a privileged consumer) directly against the backend (bypassing the gateway) to demonstrate privilege escalation purely from the missing backend-side trust verification
- Demonstrate a concrete rate-limit bypass with before/after request counts: show the configured limit (e.g., 100 req/min) being exceeded by a specific, reproducible factor via key rotation or forwarding-header spoofing
- Complete a full JWT algorithm-confusion or expired-token-acceptance PoC specifically against the gateway's validation layer (isolate this from the backend by observing that the gateway itself forwards the request rather than rejecting it)
- Chain a confirmed gateway-bypass finding with any backend header-trust gap to demonstrate full authentication/authorization bypass across the entire API surface the gateway was meant to protect, not just a single route

### Phase 4: Documentation
- Document each finding with the specific gateway platform, the exact policy/plugin configuration reviewed (or its absence), and the request/response pair proving the bypass
- Include a side-by-side comparison of the plugin/policy chain applied to the vulnerable route versus a correctly configured sibling route, to make the misconfiguration's scope immediately clear to the platform team
- Distinguish gateway-configuration-owner findings (plugin/policy setup) from backend-development-owner findings (header-trust verification), since remediation responsibility differs
- Map findings to OWASP API Security Top 10 (API2/API4/API8) categories in addition to CVSS/CWE

## Validation Requirements
✓ Real vulnerability confirmation
✓ Authentic tool output evidence
✓ Reproducible exploitation proof
✓ Clear technical documentation
✓ Developer-actionable remediation
✓ Findings clearly attributed to gateway configuration versus backend trust-boundary ownership

## CVSS Scoring
- Uses CVSS 3.1 vector scoring
- Attack Vector: Network
- Attack Complexity: Low for direct-backend-bypass and header-smuggling findings; Medium for rate-limit race-condition findings requiring concurrent request timing
- Privileges Required: None for pre-auth gateway-bypass findings; Low where a valid-but-lower-privileged API key/token is needed to demonstrate trust-header escalation
- Scope: Changed where a gateway-layer bypass grants access across the full backend API surface rather than a single component
- CIA Impact: Confidentiality/Integrity typically High for authentication-bypass and trust-header-forgery findings

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
  "cwe_id": "CWE-284",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Per-route plugin/policy configuration matrix showing the misconfigured route versus correctly configured sibling routes
- Direct-backend-access request/response proving the gateway can be bypassed entirely
- Forged trust-header request/response demonstrating backend privilege escalation independent of the gateway
- Rate-limit bypass logs showing request counts and timestamps exceeding the configured threshold via key rotation or header spoofing
- JWT-validation PoC (jwt_tool output) showing the gateway forwarding a request bearing an algorithm-confused or expired token

## Remediation Guidance
- Apply and audit plugin/policy chains consistently across every route under a given base path; use configuration-as-code with automated drift detection to prevent per-route inconsistency
- Enforce backend network isolation (security groups, private endpoints, mTLS) so the backend origin is never directly reachable, making the gateway a genuine single enforcement point rather than an optional one
- Have the backend independently verify gateway-asserted identity via mTLS client certificates or a signed, gateway-specific assertion (e.g., a short-lived signed JWT the gateway itself issues) rather than trusting plain forwarded headers
- Configure rate limiting on a dimension resistant to trivial rotation (authenticated consumer identity validated server-side, not client-supplied IP/key headers alone), and load-test the counter implementation for race conditions under concurrency
- Independently validate JWTs at the gateway using a pinned algorithm and freshly-fetched JWKS with appropriate cache TTL, rejecting any token whose algorithm doesn't match the expected key type

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided
✓ Gateway-configuration versus backend-trust-boundary ownership clearly attributed

## Dependency Flow
**Input:** Target scope, gateway platform identification, administrative configuration access where available, previous agent findings (general API Security recon)
**Output:** Validated gateway-layer findings with evidence
**Feeds:** Downstream agents (BOLA/BFLA Testing, API Security) and final penetration test report
