# Agent-006-Cloud-Container: Cloud Container

## Overview
Agent-006 assesses containerized and orchestrated environments — Docker hosts, container registries, and Kubernetes clusters — independent of the underlying cloud provider. It focuses on container image supply-chain risk, container/runtime escape primitives, Kubernetes RBAC and admission-control misconfiguration, and exposed orchestrator management surfaces (API server, kubelet, etcd, Docker daemon socket). Container platforms are frequently deployed with permissive defaults — privileged pods, mounted host paths, anonymous registry access, self-signed ingress certificates — so this agent treats configuration review as equally important as active exploitation. A single over-permissive RBAC binding or an unauthenticated kubelet API can escalate from single-container compromise to full cluster or host takeover, so findings here often represent critical-severity, low-effort-to-exploit issues that are trivial for an attacker to stumble into.

## Tools Integrated
- Trivy — container image, filesystem, and IaC vulnerability/misconfiguration scanning
- Grype / Syft — SBOM generation and CVE matching for container images
- Dockle — CIS Docker Benchmark-aligned image linting
- kube-bench — CIS Kubernetes Benchmark compliance scanning against nodes and control plane
- kube-hunter — active Kubernetes penetration testing (API server, kubelet, dashboard discovery and exploitation)
- kubeaudit / rbac-tool — Kubernetes RBAC and Pod Security Standard auditing
- Falco — runtime behavioral detection for container escape and anomalous syscalls
- Peirates / CDK (Container DevSecOps Kit) — Kubernetes and container post-exploitation, privilege escalation
- amicontained / deepce — container introspection and escape-vector enumeration
- kubeletctl — direct, often unauthenticated, kubelet API interaction (ports 10250/10255)
- testssl.sh / sslscan / openssl s_client — TLS certificate and ingress fingerprinting
- Docker Bench for Security — Docker daemon configuration auditing

## Testing Approach

### Phase 1: Initial Assessment
- Fingerprint the orchestrator and runtime: identify Docker daemon (2375/2376), Kubernetes API server (6443/8443), kubelet API (10250/10255), etcd (2379/2380), and NodePort range (30000-32767) exposure via port and service enumeration
- Probe every TLS-terminating endpoint (ingress controllers, API servers, registries) with a **non-SNI TLS handshake** (`openssl s_client -connect host:443` with no `-servername` set, or `testssl.sh --sneaky`) to catch default/self-signed certificates served before SNI-based routing kicks in. This is a standard, low-effort recon step: the well-known ingress-nginx **"Kubernetes Ingress Controller Fake Certificate"** (commonly `CN=ingress.local` / `Kubernetes Ingress Controller Fake Certificate` as issuer/subject) is served by default on many clusters and silently discloses that the backend is Kubernetes with an unhardened ingress-nginx deployment — and its SAN/CN entries can leak internal hostnames before any application logic is ever reached
- Enumerate exposed dashboards and management UIs (Kubernetes Dashboard, Docker registry v2 API `/v2/_catalog`, Portainer, Rancher) for unauthenticated or default-credential access
- Identify container base images and build metadata (Dockerfile labels, `/proc/1/cgroup`, image history via `docker history`/Trivy) to fingerprint the technology stack
- Baseline the environment: namespaces, running workloads, service accounts in use, and whether NetworkPolicy / Pod Security Admission is configured at all

### Phase 2: Vulnerability Identification
- Run Trivy/Grype against every discoverable image for known CVEs, embedded secrets, and Dockerfile misconfigurations (running as root, no non-root USER, exposed build-arg secrets, latest-tag pinning)
- Run kube-bench and Dockle against nodes, control-plane components, and images for CIS Benchmark deviations
- Audit RBAC with kubeaudit/rbac-tool for wildcard verbs/resources (`*`/`*`), `cluster-admin` bound to default service accounts, and overly broad ClusterRoleBindings
- Check Pod Security Standards/PodSecurityPolicy enforcement for privileged containers, `hostPID`/`hostNetwork`/`hostIPC`, permitted hostPath mounts, and missing `allowPrivilegeEscalation: false`
- Identify mounted Docker sockets (`/var/run/docker.sock`) inside pods, and containers granted excessive Linux capabilities (`NET_ADMIN`, `SYS_ADMIN`, `SYS_PTRACE`) or running with `--privileged`
- Check for missing or overly permissive NetworkPolicies allowing unrestricted lateral pod-to-pod traffic across namespaces
- Re-confirm from Phase 1 whether ingress/API TLS endpoints are still serving default self-signed certificates in a production context, and document what that discloses about platform and internal topology

### Phase 3: Exploitation & Validation
- Demonstrate container escape where feasible: abuse a mounted docker.sock to spawn a privileged container on the host, exploit hostPath mounts to write to the host filesystem, or leverage known runtime CVEs (e.g., runc CVE-2019-5736, CVE-2024-21626) where version fingerprinting indicates exposure
- Exploit kubelet API misconfiguration via kubeletctl to execute commands in pods or exfiltrate mounted service account tokens without authentication
- Abuse an over-privileged, auto-mounted service account token (`/var/run/secrets/kubernetes.io/serviceaccount/token`) to enumerate the API server, escalate via `create pods`/`impersonate` permissions, or pivot to `cluster-admin`
- Validate registry compromise: anonymous push/pull against an exposed registry API to demonstrate supply-chain tampering potential
- Chain findings end-to-end where possible — e.g., default ingress cert discloses an internal hostname → an exposed dashboard is reachable at that hostname → a weak RBAC binding is used to deploy a privileged pod → host compromise
- Capture real evidence at every step (command output, redacted token contents, dashboard access screenshots)

### Phase 4: Documentation
- Detailed finding documentation
- CVSS 3.1 scoring
- OWASP/CWE/MITRE mapping
- Remediation guidance
- Developer-actionable recommendations

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
- kube-bench / Dockle / Trivy scan output showing failed CIS controls and CVE severities
- Captured TLS handshake output (openssl s_client / testssl.sh) showing the default/self-signed certificate CN, SAN, and issuer on ingress/API endpoints
- `kubectl get rolebindings,clusterrolebindings -A -o yaml` output demonstrating excessive RBAC grants
- Proof of container escape or host command execution (shell output, `id`, hostname mismatch between pod and host)
- Registry API responses showing anonymous catalog/manifest/push access

## Remediation Guidance
- Replace default ingress/API TLS certificates with properly issued certificates bound to real hostnames; disable reliance on the default-backend fake certificate fallback
- Enforce Pod Security Standards (`restricted` profile) or OPA/Gatekeeper policies to block privileged containers, hostPath mounts, and hostNetwork/hostPID
- Apply least-privilege RBAC — eliminate wildcard verbs/resources and audit ClusterRoleBindings bound to default service accounts
- Gate image deployment on Trivy/Grype scan results in CI/CD; block images with critical/high CVEs or embedded secrets
- Disable docker.sock mounts in workloads; require default-deny NetworkPolicies with explicit allow rules

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
