# Agent-051-Physical-Virtual-Infra-Config: Virtual Infrastructure & Hypervisor Hardening

## Overview
Assesses the virtualization layer underneath the workloads every other agent tests — hypervisor configuration and patch level, VM-escape attack surface, adherence to CIS virtualization hardening benchmarks, and the operational hygiene of the virtual estate itself (orphaned VMs, snapshot sprawl, unused templates). A hypervisor compromise or VM-escape vulnerability breaks the fundamental isolation assumption every tenant/workload on that host depends on, turning a single compromised guest into a path to every other VM sharing the same physical host. Equally, VM sprawl and forgotten orphaned resources are a quiet but persistent risk: unpatched, unmonitored virtual machines left running long after their purpose ended routinely turn out to be the easiest foothold in an environment precisely because nobody remembers they exist. This agent treats the virtualization management plane and the health of the virtual estate as first-class attack surface, not incidental infrastructure.

## Tools Integrated
- nmap — fingerprinting hypervisor management interfaces (vCenter/ESXi on TCP/443, Hyper-V/WinRM, Proxmox on TCP/8006, XenServer/XCP-ng XenAPI) and identifying exposed management ports from the network
- CIS-CAT / manual CIS Benchmark checklist review — configuration auditing of ESXi/vSphere, Hyper-V, and KVM/Proxmox hosts against published CIS hardening benchmarks (lockdown mode, NTP configuration, logging, service disablement)
- PowerCLI (VMware) / Hyper-V PowerShell module / `virsh` (libvirt/KVM) — authorized configuration-review scripting to pull host and VM configuration at scale for hardening-baseline comparison
- testssl.sh / openssl s_client — TLS configuration review of hypervisor management-interface endpoints (vCenter, ESXi host client, Proxmox web UI)
- Metasploit auxiliary/exploit modules relevant to known hypervisor CVEs (e.g. VMware SLAPP/CVE-class ESXi/vCenter vulnerabilities, Xen/QEMU escape CVEs) — used strictly for authorized validation of a specific, version-confirmed CVE, never speculative exploitation
- Custom Python (pyVmomi for vSphere / libvirt-python for KVM/Proxmox / Azure/AWS SDKs for cloud-hosted virtualization) inventory-and-drift script that enumerates every VM/template/snapshot across the virtual estate, flags VMs powered-off or unpatched beyond a configurable staleness threshold, snapshots older than a defined retention window (a common performance and security-patch-currency risk since a long-lived snapshot means the base disk hasn't been patched), and templates/orphaned disks with no associated running VM — producing a single sprawl-and-orphan report no manual review at scale would catch reliably

## Testing Approach

### Phase 1: Initial Assessment
- Enumerate every hypervisor management interface in scope (vCenter/ESXi, Hyper-V, Proxmox, XenServer/XCP-ng, KVM/libvirt management) and fingerprint exact product/build version via nmap and interface banners
- Pull the current virtual-estate inventory using the appropriate authorized API/CLI (PowerCLI, pyVmomi, virsh, cloud SDK) — every VM, its power state, last-patched/last-boot timestamp, associated snapshots, and templates
- Identify which hosts run genuinely multi-tenant workloads (VMs from different trust levels/business units sharing a physical host) versus single-tenant, since VM-escape impact scales directly with the trust boundary crossed
- Confirm whether hypervisor lockdown mode (ESXi) or equivalent management-plane restriction is enabled, and whether management interfaces are reachable from general workload networks or restricted to a dedicated management network

### Phase 2: Vulnerability Identification
- Run the CIS Benchmark configuration review against each hypervisor host type in scope, focusing on the highest-impact controls: lockdown mode, management-interface network restriction, NTP/logging configuration (critical for later forensic reconstruction), and disabled unnecessary services (SSH/shell access left permanently enabled on production ESXi hosts, for example)
- Correlate every enumerated hypervisor product/build version against known VM-escape and management-plane-authentication-bypass CVEs (cross-referenced with the Dependency Scanning agent), flagging any host running a version with a publicly known, high-severity escape or RCE vulnerability
- Run the custom Python sprawl-and-orphan inventory script across the full virtual estate and review its output for: VMs powered off but never decommissioned (potential unpatched, forgotten attack surface if ever re-powered), snapshots exceeding the retention-window threshold (indicating an unpatched base disk still in active snapshot chain), and orphaned disks/templates with no owner of record
- Test TLS configuration on every hypervisor management web interface, since a weak/expired certificate on vCenter or the ESXi host client undermines confidence in every credential submitted through it
- Where a management interface is reachable, test for default/well-known default credentials on the hypervisor's own admin account (distinct from, but coordinated with, the Network-Device-Hardening agent's default-credential methodology)

### Phase 3: Exploitation & Validation
- For a hypervisor host confirmed to be running a version with a known, high-severity VM-escape or management-plane-RCE CVE, validate exploitability strictly through the version/build-fingerprint match and, only where explicitly authorized and safe for the environment, a controlled non-destructive PoC using the appropriate Metasploit module or vendor advisory reproduction steps in a designated test/maintenance window
- For confirmed lockdown-mode/management-interface-exposure gaps, demonstrate reachability of the management API/console from an unintended network position (e.g. from a general workload VLAN rather than the dedicated management network)
- For sprawl/orphan findings, select a representative sample of flagged stale VMs/snapshots and manually confirm they are genuinely orphaned (no active business owner, no current traffic) rather than intentionally dormant, to avoid false-positive noise in the final report
- Where default/weak hypervisor admin credentials are confirmed, demonstrate successful authentication to the management interface and document the scope of control that credential grants (full host/cluster administration versus limited read-only)

### Phase 4: Documentation
- Document each finding with the exact host, hypervisor product/build version, and specific CIS-benchmark control or CVE involved
- Deliver the sprawl-and-orphan inventory report as a standalone artifact, since its business value (cost and attack-surface reduction) is distinct from, and complements, the security-finding narrative
- Capture CIS-CAT/manual-review output and version-fingerprint evidence as primary proof for hardening-gap findings
- Map to CVSS/OWASP/CWE as usual, treating confirmed VM-escape-capable versions as Scope: Changed given their cross-tenant blast radius

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
  "owasp_category": "A06:2021 - Vulnerable and Outdated Components",
  "cwe_id": "CWE-1120",
  "validation_status": "validated",
  "validation_date": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Hypervisor product/build-version fingerprint evidence and corresponding CVE correlation
- CIS Benchmark review output (CIS-CAT or manual checklist) showing the specific failed control
- Sprawl-and-orphan inventory report from the custom Python script (stale VMs, aged snapshots, orphaned disks/templates)
- Network-reachability evidence for management-interface exposure findings
- TLS/certificate evidence for hypervisor management-interface findings

## Remediation Guidance
- Patch hypervisor hosts to current vendor-supported versions on a defined cadence, prioritizing any build with a known VM-escape or management-plane RCE
- Enable lockdown mode (or equivalent) and restrict all hypervisor management-interface access to a dedicated, firewalled management network — never reachable from general workload VLANs
- Enforce CIS Benchmark baseline configuration (NTP, logging, disabled unnecessary services, strong management-interface TLS) across every host, with periodic re-audit after firmware/version upgrades
- Establish a VM/snapshot lifecycle policy: automatic flagging and decommissioning of powered-off VMs past a defined staleness threshold, and a maximum snapshot retention window enforced by tooling rather than manual discipline
- Replace default hypervisor admin credentials immediately upon deployment and enforce MFA on management-interface authentication where supported

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/infrastructure-engineer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, hypervisor/virtualization management access, previous agent findings (especially Infrastructure and Dependency Scanning agents)
**Output:** Validated findings with evidence, including the sprawl-and-orphan inventory report
**Feeds:** Cloud, Dependency Scanning, and Network-Segmentation agents; final penetration test report
