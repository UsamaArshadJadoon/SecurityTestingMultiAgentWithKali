# Agent-045-Network-Segmentation: Network Segmentation & Zero-Trust Validation

## Overview
Validates whether the network's logical segmentation actually contains an attacker the way the architecture diagram claims it does — VLAN boundaries, firewall/ACL rule sets, and zero-trust micro-segmentation policies are all tested by attempting the exact lateral movements they are supposed to prevent, not just reviewed on paper. Segmentation failures are a force-multiplier finding: a single mis-tagged trunk port or an overly permissive "any-any" cleanup rule left over from a migration can turn a contained breach of one low-value host into full access to the crown-jewel network segment. This agent treats every declared boundary (VLAN, subnet, security-group, mesh-policy) as a hypothesis to be disproven, and every east-west path it successfully traverses is evidence the segmentation model is wrong in production, whatever the intended design says.

## Tools Integrated
- yersinia — VLAN hopping via switch-spoofing (DTP) and double-tagging (802.1Q) attacks against access ports
- Scapy — crafting raw 802.1Q double-tagged frames, custom DTP negotiation frames, and CDP/LLDP probes to fingerprint switch topology and test trunk-negotiation behavior a packaged tool doesn't expose
- nmap — cross-segment port/service reachability sweeps to empirically map which hosts/ports are actually reachable across a claimed boundary, compared against the documented firewall/ACL ruleset
- hping3 — targeted TCP/UDP/ICMP probes with custom flags and source-port tricks to test stateful-firewall rule behavior and source-port/ICMP-based ACL bypass
- Custom Python (scapy + socket) segmentation-mapping script: given a list of subnets/VLANs in scope, systematically launches a small probe (TCP SYN to a fixed port set, ICMP echo, and a VLAN-tagged frame where applicable) from each accessible vantage point to every other declared segment, builds an actual reachability matrix, and diffs it against the client-provided intended-segmentation matrix to auto-flag every discrepancy
- Nipper / manual firewall-rule-export review — parsing exported Cisco ASA/Palo Alto/Fortinet/iptables rule sets for overly broad, shadowed, or redundant rules
- kubectl / cloud CLI (aws ec2 describe-security-groups, az network nsg list) — where segmentation is enforced by security groups/NSGs rather than physical VLANs

## Testing Approach

### Phase 1: Initial Assessment
- Obtain (or reconstruct from network diagrams/asset inventory) the intended segmentation model: which VLANs/subnets/security zones exist, which are supposed to reach which, and why (PCI zone, DMZ, management network, IoT/OT segment, etc.)
- Enumerate switch topology reachable from the test vantage point via CDP/LLDP capture and passive VLAN Trunking Protocol observation to identify trunk ports, native VLAN configuration, and any access ports mistakenly carrying multiple VLANs
- Pull and inventory every firewall/ACL/security-group ruleset in scope for the boundaries under test, noting rule order, any "any/any" or overly broad CIDR entries, and unused/shadowed rules
- For zero-trust/micro-segmentation deployments, enumerate the declared policy model (e.g. service-mesh authorization policies, host-based firewall rules, SDN micro-segments) separately from perimeter firewalls, since zero-trust claims are specifically that identity — not network location — gates access

### Phase 2: Vulnerability Identification
- Attempt VLAN hopping via switch spoofing (yersinia DTP negotiation to force a trunk) and via double-tagging (Scapy-crafted 802.1Q frames with a stacked native-VLAN tag) from an access-port vantage point, and record which target VLANs become reachable
- Run the custom Python segmentation-mapping script to build the empirical cross-segment reachability matrix and diff it against the intended-segmentation model; every path present in the empirical matrix but absent from the intended model is a finding
- Review firewall/ACL exports for rules broader than required (wildcard source/destination, unnecessary port ranges, temporary/migration rules never removed), and for rule-order issues where a permissive rule shadows a later restrictive one
- For zero-trust environments, test whether access is genuinely enforced by identity/mTLS rather than IP/network position: attempt to reach a policy-protected service from an unauthenticated pod/host on the same network segment and confirm the mesh/policy engine denies it purely on network reachability grounds
- Test east-west traffic controls specifically between tiers that should never talk directly (e.g. presentation tier directly to database tier, bypassing the application tier), and between management/out-of-band networks and production segments

### Phase 3: Exploitation & Validation
- Chain a successful VLAN-hop or ACL-bypass finding into an actual cross-segment resource access (e.g. reach a database port, an internal admin panel, or a domain controller from the "isolated" segment) to demonstrate real business impact rather than a theoretical reachability gap
- Where east-west visibility is achieved, attempt to move laterally from the newly reached segment into a further, more sensitive segment to assess whether the failure is an isolated misconfiguration or a systemic flat-network problem
- For zero-trust bypasses, demonstrate the specific policy-engine gap (e.g. mTLS not enforced for a given namespace, an authorization policy scoped too broadly, a legacy service exempted from the mesh) with a minimal reproducible request
- Validate that any identified "any-any" or forgotten migration rule is not compensated for by an out-of-band control before escalating severity

### Phase 4: Documentation
- Document each finding with the exact source segment/VLAN/IP, destination, port/protocol, and the specific rule or switch behavior that permitted it
- Deliver the empirical-versus-intended reachability matrix as a standalone artifact so architecture owners can see every discrepancy at a glance, not just the exploited subset
- Group related ACL-hygiene findings (multiple overly broad rules on the same firewall) for efficient remediation planning
- Map to CVSS/OWASP/CWE as usual, weighting Scope: Changed where a segmentation failure grants access beyond the originally compromised component

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
- Empirical reachability matrix (custom script output) diffed against the intended-segmentation model
- Packet captures showing successful VLAN-hop frames (double-tagged 802.1Q, DTP negotiation)
- Firewall/ACL/security-group rule exports with the specific offending rule highlighted
- nmap/hping3 output demonstrating cross-segment port reachability
- Screenshots/logs of the downstream resource reached after a segmentation bypass (database banner, admin panel, etc.)

## Remediation Guidance
- Disable DTP on access ports (switchport nonegotiate) and explicitly assign a dedicated, unused native VLAN never carrying user traffic to close double-tagging attacks
- Replace broad/legacy "any-any" and migration-era firewall rules with least-privilege, explicitly scoped rules, and schedule periodic ruleset review to catch shadowed or redundant entries
- Enforce identity-based authorization (mTLS + policy engine) for zero-trust segments rather than relying on network position, and remove any legacy exemptions from mesh enforcement
- Implement default-deny between tiers and require explicit, documented allow-rules for every legitimate east-west flow
- Re-run the empirical reachability sweep after remediation to confirm the intended-segmentation model now matches production reality

## Success Criteria
✓ Vulnerability authentically reproduced
✓ Real evidence collected from target system
✓ Complete exploitation path documented
✓ Technical details sufficiently detailed for developer/network-engineer understanding
✓ Impact clearly demonstrated
✓ Remediation is actionable and verifiable

## Dependency Flow
**Input:** Target scope, network diagrams/intended-segmentation model, asset inventory, previous agent findings (especially Infrastructure and Cloud agents)
**Output:** Validated findings with evidence, including the empirical-versus-intended reachability matrix
**Feeds:** Cloud, Container-Orchestration, VPN-Remote-Access, and Network-Device-Hardening agents; final penetration test report
