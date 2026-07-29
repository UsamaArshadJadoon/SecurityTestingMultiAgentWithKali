# Agent-001B: Active Network Discovery

## Overview
Active network scanning and asset discovery using port scanning, service enumeration, and network mapping.

## Tools Integrated
- nmap - Network mapper and port scanner
- zmap - Fast internet scanner
- masscan - Mass IP port scanner
- rustscan - Faster port scanner
- Shodan - Device database queries
- Censys - Internet-wide scanning

## Testing Approach
1. **Host Discovery** - Ping scans, ARP scans, ICMP sweeps
2. **Port Scanning** - TCP/UDP port discovery, service detection
3. **Service Identification** - Banner grabbing, version detection
4. **OS Fingerprinting** - Operating system identification
5. **Network Mapping** - Topology visualization, route enumeration
6. **Vulnerability Detection** - Known CVEs for discovered services

## Validation Requirements
- Confirmed active hosts
- Verified open ports
- Authenticated service versions
- Network topology mapped
- Device OS identified

## CVSS Scoring Factors
- Severity: Information disclosure
- Attack Vector: Network
- Privileges: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: Low-Medium

## Remediation Examples
- Disable unnecessary services
- Implement network segmentation
- Apply firewall rules
- Harden service configurations
- Close unused ports
- Update service software

## Success Criteria
✓ Complete host inventory
✓ All active services identified
✓ Service versions discovered
✓ Network topology mapped
✓ Potential entry points identified
