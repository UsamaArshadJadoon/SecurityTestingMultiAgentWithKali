# Agent-001: Reconnaissance & Asset Discovery

## Overview
Master reconnaissance agent that orchestrates passive OSINT (Agent-001A) and active discovery (Agent-001B) into a single, de-duplicated attack-surface map: root domains, subdomains, live hosts, listening services, technology stack, and public-facing entry points such as tokenized, guest, or shared links. Recon quality determines everything downstream — a subdomain, staging environment, or forgotten admin panel missed here is never tested by any later agent. In real engagements, the highest-impact findings are routinely traced back to assets nobody remembered existed: a dev/staging clone with debug mode on, an S3 bucket left public, a dangling CNAME ripe for subdomain takeover, or a "share" link with a predictable token. This agent's job is to make sure that surface is complete before Agent-002 onward start testing it.

## Tools Integrated
- **Amass** - passive + active subdomain enumeration and asset graph correlation
- **subfinder / assetfinder / findomain** - fast passive subdomain enumeration from multiple OSINT sources
- **crt.sh / Censys certificate search** - certificate transparency log mining for subdomain and internal-naming leakage
- **theHarvester** - email, employee, and subdomain harvesting from search engines and PGP key servers
- **whois / RDAP / dig / nslookup / host** - domain registration and DNS record enumeration (A, AAAA, MX, TXT/SPF/DMARC, NS, CAA)
- **Shodan / Censys / ZoomEye** - internet-wide scan data correlation without touching target infrastructure directly
- **dnsx / puredns** - bulk DNS resolution, wildcard filtering, and active subdomain brute forcing against real nameservers
- **naabu / masscan / zmap / rustscan** - high-speed port discovery across large ranges
- **nmap** - service/version fingerprinting, OS detection, targeted NSE scripts (banner, vuln, default-creds)
- **httpx** - live web asset probing (status code, title, tech stack, redirect chains) at scale
- **gowitness / EyeWitness** - automated screenshotting of every discovered web asset for rapid visual triage
- **Wappalyzer / WhatWeb** - technology and framework fingerprinting
- **Nuclei** - templated detection of exposed panels, default installs, and known CVEs against resolved assets
- **waybackurls / gau / gauplus** - historical URL and parameter mining from web archives for legacy/forgotten endpoints and tokenized links
- **gitrob / trufflehog / gitleaks** - secret and internal-hostname discovery in public GitHub/GitLab repositories
- **subjack / nuclei takeover templates** - subdomain takeover / dangling CNAME detection
- **cloud_enum / s3scanner** - cloud storage bucket enumeration and public-exposure checks
- **wafw00f** - WAF/IDS fingerprinting to calibrate later exploitation stealth requirements

## Testing Approach

### Phase 1: Initial Assessment
- Confirm scope precisely: root domains, IP/CIDR ranges, ASN ownership (BGP.he.net, ASN lookups), cloud account identifiers, and any explicitly in-scope third-party/vendor domains
- Enumerate known brand names, product names, and past acquisitions to seed subdomain/keyword permutation lists
- Pull existing MX/SPF/DMARC/DKIM records to map mail infrastructure and third-party mail providers
- Establish what is officially documented/sanctioned versus suspected shadow IT (unofficial marketing sites, forgotten POCs, contractor-hosted assets)
- Confirm rules of engagement boundaries between passive-only and active-probing phases, plus any scan-rate or blackout-window constraints

### Phase 2: Vulnerability Identification
- Run `amass enum -passive -d target.com`, `subfinder -d target.com -all -silent`, and `assetfinder --subs-only`, then merge and de-duplicate results
- Mine certificate transparency logs (`curl -s "https://crt.sh/?q=%.target.com&output=json"`, Censys certs search) for subdomains and internal hostname naming conventions
- Resolve all candidate hostnames with `dnsx -a -resp -silent`; detect and filter wildcard DNS by querying a random non-existent subdomain first
- Run active discovery on resolved live hosts: `naabu -l hosts.txt -top-ports 1000`, `masscan` for large ranges, `nmap -sV -sC` for banner/version fingerprinting
- Probe every resolved host with `httpx -title -tech-detect -status-code -follow-redirects` to build a complete live web-asset inventory
- Screenshot every web asset with gowitness/EyeWitness for fast visual identification of forgotten admin panels, staging environments, and default install pages
- Fingerprint technology stack via Wappalyzer/WhatWeb/httpx and cross-reference detected versions against known CVEs
- Mine historical URLs with waybackurls/gau for parameter names, deprecated API paths, and tokenized/guest/shared-link patterns (`?token=`, `?share=`, `/guest/`, `/invite/`, `/public/`)
- Run targeted dorking: `site:target.com inurl:admin`, `intitle:"index of"`, Shodan `hostname:target.com http.title:"login"`
- Enumerate cloud storage exposure (public S3/Azure Blob/GCS buckets) via naming-permutation tools
- Scan any discovered public GitHub/GitLab repositories with trufflehog/gitleaks for committed credentials, API keys, and internal hostnames

### Phase 3: Exploitation & Validation
- Confirm subdomain takeover candidates by verifying dangling CNAMEs point to unclaimed cloud resources (GitHub Pages, Heroku, Azure, S3) using subjack or Nuclei takeover templates
- Test tokenized/guest/shared-link entry points for missing access control: attempt adjacent-token enumeration/guessing and check for IDOR on guest-link resources
- Verify exposed admin/dev panels for default credentials or authentication bypass with a single benign, non-destructive request
- Package each technology + version finding with CVE correlation and hand off to the relevant specialist exploitation agent rather than exploiting in place
- Record the exact discovery chain per asset (which OSINT source or scan revealed it) so downstream agents can independently reproduce the finding

### Phase 4: Documentation
- Compile a unified asset inventory with discovery method and source attributed per entry
- Attach screenshot evidence for every unique web asset
- Retain raw certificate-transparency, DNS, WHOIS/RDAP, and Shodan/Censys query output
- Document the technology stack per host with a confidence level for each identified version

## Validation Requirements
✓ Target scope clearly defined and confirmed against rules of engagement
✓ All discovery data cross-validated between passive and active sources
✓ No false negatives in host/subdomain discovery (wildcard DNS handled correctly)
✓ Comprehensive service and technology mapping with version confidence noted
✓ Tokenized/guest/shared-link entry points explicitly enumerated
✓ Proper data organization and de-duplication for downstream agents

## CVSS Scoring
- Severity: Informational (feeds severity determinations made by downstream agents)
- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: Low (public/derived data; individual findings such as takeovers or exposed panels are scored independently by the agent that validates them)

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
- nmap output in XML and grepable formats for all discovered hosts/services
- Subdomain enumeration tool output (Amass/subfinder/assetfinder JSON) with source attribution
- Certificate transparency query results (crt.sh/Censys raw JSON)
- gowitness/EyeWitness screenshots of every discovered web asset
- WHOIS/RDAP records and Shodan/Censys raw JSON responses
- DNS zone transfer attempt output and resolved record sets

## Remediation Guidance
- Decommission stale, forgotten, or unused DNS records and subdomains; audit DNS zones on a recurring schedule
- Monitor certificate transparency logs continuously (e.g., CertStream-based alerting) to catch unauthorized or unexpected certificate issuance
- Suppress verbose service banners and version strings in server/framework configuration
- Place all public-facing assets behind a WAF/CDN and restrict direct-origin access
- Enforce short TTL, single-use or scope-limited tokens on shared/guest links, and log access to them
- Apply least-privilege bucket policies on cloud storage (block public read/list by default)

## Success Criteria
✓ All in-scope hosts discovered
✓ All listening services identified
✓ Complete technology stack mapped
✓ Zero missing critical services or forgotten assets

## Dependency Flow
**Input:** Target scope, IP ranges, domains, rules of engagement (passive/active boundaries)
**Output:** Complete, de-duplicated attack surface map aggregated from Agent-001A and Agent-001B
**Feeds:** Agent-002, Agent-003, Agent-005, and all vulnerability-specific exploitation agents
