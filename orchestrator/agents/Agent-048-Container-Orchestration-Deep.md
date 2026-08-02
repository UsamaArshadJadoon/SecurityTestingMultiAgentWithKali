# Agent-048-Container-Orchestration-Deep: Deep Container Orchestration & Service Mesh Security

## Overview
Goes beyond basic Kubernetes misconfiguration checks (privileged pods, exposed dashboards) to assess the deeper control-plane and mesh-layer security guarantees an orchestration platform depends on: admission-controller policy enforcement, network-policy segmentation between namespaces/workloads, service-mesh (Istio/Linkerd) mTLS and authorization-policy correctness, etcd exposure, and Pod Security Standards enforcement. These are the controls that determine whether a compromised single container stays contained to that pod or becomes a path to cluster-wide compromise — an etcd instance reachable without authentication, or a service mesh with mTLS configured in permissive mode, silently negates the isolation the platform is assumed to provide. This agent assumes basic misconfiguration scanning has already run and focuses specifically on these deeper, often-overlooked control-plane and mesh trust boundaries.

## Tools Integrated
- kubectl / kubectl-who-can / rbac-tool — RBAC policy enumeration and effective-permission analysis across service accounts and namespaces
- kube-bench — CIS Kubernetes Benchmark compliance scanning of control-plane and node configuration
- kube-hunter — active penetration-testing-oriented Kubernetes attack-surface discovery, including etcd and kubelet API exposure
- OPA (Open Policy Agent) / Gatekeeper policy review tooling — testing whether admission-control policies (Rego constraints) actually block the workload configurations they claim to (privileged containers, hostPath mounts, missing resource limits)
- etcdctl — direct etcd interaction to test authentication requirements and, where reachable, attempt to read cluster secrets stored in etcd
- istioctl / linkerd CLI — mesh configuration dump and analysis (`istioctl analyze`, `istioctl proxy-config`) to review PeerAuthentication/AuthorizationPolicy resources for permissive-mode mTLS or overly broad policies
- Scapy / custom Python (kubernetes client library + socket) — crafting direct pod-to-pod traffic that bypasses the service mesh sidecar entirely (targeting the pod IP:port directly rather than through the mesh-injected proxy) to test whether NetworkPolicy and mesh authorization are enforced independent of the sidecar, or whether sidecar-bypass traffic slips through unauthenticated
- Custom Python (kubernetes client) script to enumerate every NetworkPolicy object cluster-wide, build the effective allowed-traffic graph per namespace/label-selector, and diff it against the Network-Segmentation agent's east-west reachability findings to catch NetworkPolicies that exist on paper but aren't actually restricting traffic (e.g. wrong label selector, policy in wrong namespace)

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate cluster version, admission-controller configuration (which webhooks/OPA-Gatekeeper constraints are installed and in what mode — enforce vs dry-run/audit-only), and Pod Security Standard level applied per namespace (privileged/baseline/restricted)
- Inventory every NetworkPolicy object cluster-wide and build the intended-traffic model from label selectors and namespace scoping
- If a service mesh is deployed, pull PeerAuthentication and AuthorizationPolicy resources via istioctl/linkerd CLI to determine the declared mTLS mode (STRICT/PERMISSIVE/DISABLE) per namespace and workload
- Check etcd exposure: identify whether the etcd client port (2379/2380) is reachable from the tested vantage point and whether client-certificate authentication is enforced

### Phase 2: Vulnerability Identification
- Test admission-controller enforcement empirically: attempt to deploy (in an authorized test namespace) a manifest violating each claimed policy (privileged: true, hostPath mount, missing resource limits, disallowed capability) and confirm whether the API server actually rejects it or merely logs a dry-run warning
- Run the custom Python NetworkPolicy-diff script to compare the declared policy graph against empirically observed reachability, flagging any NetworkPolicy that is present but ineffective due to label-selector mismatch, wrong namespace scope, or being overridden by a default-allow CNI configuration
- For a mesh deployment, test whether PERMISSIVE-mode mTLS namespaces actually allow plaintext connections to bypass mesh authentication, and whether any AuthorizationPolicy is scoped too broadly (e.g. `source: {}` matching all callers)
- Send crafted pod-to-pod traffic directly to a workload's pod IP, bypassing the mesh sidecar's inbound listener where possible, to test whether NetworkPolicy/iptables rules enforce isolation independent of application-layer mesh authorization, or whether sidecar-bypass traffic reaches the application unauthenticated
- Attempt direct etcdctl access to the etcd client port without a client certificate; if reachable, attempt a read-only `get` against the Kubernetes Secrets key prefix to determine whether cluster secrets are exposed

### Phase 3: Exploitation & Validation
- Where admission control fails to block a policy-violating workload, deploy the minimal violating pod in an authorized namespace and demonstrate the resulting privilege (e.g. host filesystem access via hostPath, or node-level capability) as a concrete PoC, then remove it immediately after evidence capture
- Where NetworkPolicy is ineffective, demonstrate cross-namespace or cross-workload traffic that should be blocked, chaining into whatever service is reached (echoing the Network-Segmentation agent's methodology at the cluster-internal layer)
- Where mesh mTLS is bypassable, demonstrate an unauthenticated plaintext connection reaching a service that assumes mesh-authenticated callers only, and identify what data/action that connection can access
- If etcd secrets are readable, demonstrate retrieval of one representative Secret object (redacting its actual value in the report) to prove the exposure without exfiltrating live credentials beyond what's needed for evidence

### Phase 4: Documentation
- Document each finding with the exact namespace/workload/policy object involved and the specific enforcement gap (dry-run mode, label mismatch, permissive mTLS, etc.)
- Deliver the NetworkPolicy intended-vs-actual reachability diff as a standalone artifact
- Capture admission-controller test manifests and the API server's actual accept/reject response as primary evidence
- Map to CVSS/OWASP/CWE as usual, treating unauthenticated etcd secret exposure and mesh-authentication bypass as high-severity, Scope: Changed findings given their cluster-wide blast radius

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
  "cwe_id": "CWE-284",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- kube-bench/kube-hunter output showing control-plane and node-level configuration gaps
- Admission-controller test-manifest and the API server's actual accept/reject response
- NetworkPolicy intended-vs-actual reachability diff from the custom Python script
- istioctl/linkerd config dumps showing PeerAuthentication/AuthorizationPolicy mode
- etcdctl connection/query output demonstrating (or ruling out) unauthenticated access

## Remediation Guidance
- Move all admission-control policies (OPA/Gatekeeper constraints, Pod Security Standards) from dry-run/audit mode to enforce mode once validated against legitimate workloads
- Correct NetworkPolicy label selectors and namespace scoping so the declared policy graph matches actual enforcement; verify with the diff methodology after every change
- Set service-mesh mTLS to STRICT mode cluster-wide (or at minimum for every namespace handling sensitive data) and scope AuthorizationPolicy resources to specific, named source identities rather than open matches
- Restrict etcd client-port access to control-plane nodes only, behind mutual TLS client-certificate authentication, with no network path from workload namespaces
- Periodically re-run the full deep-orchestration sweep after cluster upgrades, since admission-controller and mesh defaults frequently change between versions

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/platform-engineer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, cluster access credentials/kubeconfig, previous agent findings (especially Cloud and Network-Segmentation agents)
**Output:** Validated findings with evidence, including the NetworkPolicy reachability diff and mesh mTLS/authorization audit
**Feeds:** Network-Segmentation, Cloud, and Dependency Scanning agents; final penetration test report
