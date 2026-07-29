# Agent-001: Reconnaissance & Asset Discovery

## Overview
Master reconnaissance agent that performs passive and active discovery to map the complete attack surface including hosts, services, subdomains, technologies, and potential entry points.

## Tools Integrated
- **whois** - Domain registration information
- **nslookup** - DNS enumeration
- **dig** - Advanced DNS queries
- **theHarvester** - Email and subdomain harvesting
- **shodan** - Internet-connected device discovery
- **censys** - Internet-wide scan data
- **recon-ng** - Reconnaissance framework
- **assetfinder** - Subdomain discovery
- **subfinder** - Subdomain enumeration
- **nmap** - Network mapping and service detection
- **masscan** - Mass IP port scanner
- **zmap** - Internet-wide network scanner

## Testing Approach

### Phase 1: Passive Intelligence Gathering
- DNS records enumeration (A, MX, CNAME, TXT, NS)
- WHOIS database lookup
- Email address harvesting
- Social media profile discovery
- Certificate transparency logs search
- Google dorking results analysis
- GitHub repository discovery
- Public APIs identification

### Phase 2: Subdomain & Host Discovery
- Subdomain enumeration using wordlists
- DNS brute force (carefully)
- CNAME flattening
- Hosted zone mapping
- Host alive verification
- Reverse DNS lookup
- Virtual host identification

### Phase 3: Service Discovery
- Network scanning (TCP/UDP ports)
- Banner grabbing
- Service version identification
- Technology fingerprinting
- HTTP headers analysis
- Favicon hash identification
- SSL/TLS certificate analysis

### Phase 4: Technology Stack Identification
- Web framework detection
- CMS detection
- JavaScript library detection
- Server technology identification
- API documentation discovery
- WAF/IDS detection

## Validation Requirements
✓ Target scope clearly defined
✓ All discovery data documented
✓ No false negatives in host discovery
✓ Comprehensive service mapping
✓ Technology stack accurately identified
✓ Proper data organization for downstream agents

## CVSS Scoring
- Severity: Informational
- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: Low (public data)

## Output Format
```json
{
  "phase": 1,
  "agent": "Agent-001",
  "findings": {
    "domains": ["example.com"],
    "subdomains": ["api.example.com"],
    "hosts": [{"ip": "192.168.1.1", "hostname": "host1.example.com"}],
    "services": [{"port": 80, "service": "http", "version": "Apache 2.4.41"}],
    "technologies": ["Apache", "PHP 7.4"]
  },
  "timestamp": "2024-07-30T10:00:00Z"
}
```

## Evidence Collection
- Screenshot of reconnaissance results
- nmap output (XML format)
- DNS enumeration logs
- Service banner captures

## Remediation
- Minimize information leakage
- Disable unnecessary services
- Implement DNS firewalls
- Restrict certificate transparency

## Success Criteria
✓ All in-scope hosts discovered
✓ All listening services identified
✓ Complete technology stack mapped
✓ Zero missing critical services

## Dependency Flow
**Input:** Target scope, IP ranges, domains
**Output:** Complete attack surface map
**Feeds:** Agent-002, Agent-003, Agent-005
