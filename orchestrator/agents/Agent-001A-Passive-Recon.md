# Agent-001A: Passive Reconnaissance

## Overview
Pure passive OSINT sub-agent that builds initial target intelligence entirely from third-party data sources — no packet ever touches target infrastructure at this stage. It exists to surface the intelligence that active scanning alone would miss: leaked credentials in public code repositories, employee identities usable for social engineering or password spraying, forgotten cloud assets referenced in old archived pages, and internal naming conventions leaked through certificate issuance. In real engagements this phase routinely produces the highest-value low-noise findings — a committed API key, a breach-exposed employee password, a dangling reference to a decommissioned service — before Agent-001B ever sends a probe. Its output is a prioritized candidate list, not confirmed vulnerabilities; everything here is handed to Agent-001B or a specialist agent for active validation.

## Tools Integrated
- **whois / RDAP** - domain registration, registrant org, creation/expiry, nameserver history
- **dig / host / nslookup** - public-resolver-only DNS record queries (A, MX, TXT/SPF/DMARC/DKIM, NS, CAA) with no zone transfer attempts
- **theHarvester** - email, subdomain, and employee-name harvesting from search engines and PGP key servers (`theHarvester -d target.com -b all`)
- **Amass (passive mode)** - `amass enum -passive -d target.com` for multi-source subdomain aggregation without active resolution sweeps
- **subfinder (passive sources only)** - fast OSINT-source subdomain enumeration
- **crt.sh / Censys certificate search** - certificate transparency log mining for subdomain and internal-hostname leakage
- **Shodan / Censys / ZoomEye** - pre-existing internet-wide scan/banner data queried by hostname/org/SSL filters, never scanning the target directly
- **Wayback Machine / waybackurls / gau / gauplus** - historical URL, parameter, and forgotten-endpoint mining, including old tokenized/share links
- **GitHub/GitLab/BitBucket dorking + trufflehog / gitleaks** - discovery of committed secrets, internal hostnames, and config leakage in public repositories
- **Sherlock / social-analyzer** - username-to-platform correlation across social media for employee OSINT
- **Have I Been Pwned (domain search) / breach-corpus lookups** - identification of employee credential exposure from past breaches
- **BuiltWith / Wappalyzer (cached/passive mode)** - technology fingerprinting from third-party cached data, not direct requests
- **SecurityTrails / DNSDumpster** - historical DNS record and hosting-provider change tracking
- **Recon-ng / Maltego** - OSINT workflow automation and entity-relationship mapping across collected data
- **Google / Bing / DuckDuckGo dorking** - `site:`, `filetype:`, `intitle:"index of"`, `inurl:login`, and `cache:` operators for exposed or archived content

## Testing Approach

### Phase 1: Initial Assessment
- Confirm root domain(s), organization name, brand aliases, and known acquisitions in scope
- Confirm this sub-agent's boundary is strictly passive — no active probing, brute forcing, or direct connections to target-owned infrastructure at this stage
- Enumerate known executive/employee names and org-chart hints as correlation seeds for breach-corpus and social-media lookups
- Identify which OSINT sources are permitted vs. excluded under the rules of engagement (e.g., paid data brokers, if disallowed)

### Phase 2: Vulnerability Identification
- WHOIS/RDAP lookup for registrar, registrant org, creation/expiry dates, and nameserver history; flag privacy-proxy inconsistencies that reveal true ownership
- DNS enumeration via public resolvers only: `dig` for A/MX/TXT(SPF/DMARC/DKIM)/NS/CAA records — explicitly no zone transfer attempts (reserved for Agent-001B)
- `theHarvester -d target.com -b all` for emails, subdomains, and employee names surfaced via search engines and PGP servers
- Certificate transparency mining (crt.sh, Censys certs) for subdomain enumeration and internal-naming convention leakage
- Passive Shodan/Censys/ZoomEye queries (`hostname:target.com`, `ssl:"target.com"`) to pull previously-collected banner/service data with zero direct contact
- Mine Wayback Machine/gau/waybackurls for historical URLs, parameter names, deprecated API paths, and legacy tokenized/guest/share links
- GitHub/GitLab dorking (`site:github.com "target.com" api_key`) followed by trufflehog/gitleaks scans of any discovered public repos for committed secrets, internal hostnames, and config files
- Employee/social OSINT: LinkedIn org search for headcount and technology hints, Sherlock/social-analyzer for username correlation across platforms
- Breach corpus correlation: Have I Been Pwned domain search and equivalent breach lookups for exposed employee credentials (password-reuse risk signal)
- Search-engine dorking: `site:target.com filetype:pdf`, `intitle:"index of"`, `inurl:login`, and `cache:` for removed-but-cached content
- Passive technology profiling via BuiltWith/Wappalyzer cached data (no direct request to target)

### Phase 3: Exploitation & Validation
- Where a leaked API key or secret is found in a public repo, validate its live/dead status only against the third-party provider's own auth-check endpoint — never against target infrastructure at this passive stage
- Confirm harvested emails follow the organization's real address format and resolve to active MX infrastructure, to prime later authenticated password-spray/brute-force testing by the auth-testing agent
- Cross-reference forgotten Wayback-archived endpoints against current DNS resolution to flag zombie/legacy assets for Agent-001B to actively verify
- Package every passive finding with full source attribution and confidence level so Agent-001B can prioritize which candidates need active verification first, and so leaked-secret findings can chain directly into a cloud/API misconfiguration agent

### Phase 4: Documentation
- Document every finding with its exact OSINT source (crt.sh query, GitHub repo/commit, Wayback snapshot URL, Shodan query string)
- Retain raw WHOIS/RDAP text, theHarvester output, and certificate transparency JSON
- Redact or securely handle any harvested PII/credentials per rules-of-engagement data-handling requirements
- Produce a prioritized candidate list (subdomains, leaked secrets, employee identities, legacy endpoints) ready for active validation

## Validation Requirements
- Verified public data collection only — no active network probing performed at any point
- Every finding documented with its exact source reference and retrieval method
- Legally and passively obtained information only, consistent with the rules of engagement
- Complete data correlation across sources (WHOIS, DNS, certs, repos, breach corpora) before handoff
- Any discovered credentials/secrets flagged for immediate client notification, not further exploited

## CVSS Scoring
- Severity: Information disclosure (low-medium; escalates when leaked credentials or secrets are found)
- Attack Vector: Network (public/third-party data sources only)
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: Low-Medium (higher when live credentials or API keys are confirmed in public repos)

## Output Format
```json
{
  "finding_id": "FINDING-0001",
  "agent": "Agent-001A",
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
- theHarvester and Amass passive-mode raw output (emails, subdomains, sources)
- WHOIS/RDAP record text and certificate transparency JSON (crt.sh/Censys)
- Wayback Machine/gau/waybackurls historical URL lists
- GitHub/GitLab dork results and trufflehog/gitleaks scan output (secrets redacted in reports, retained securely for reproduction)
- Breach-corpus correlation results (handled per PII/data-sensitivity requirements)
- Shodan/Censys/ZoomEye raw JSON query responses

## Remediation Guidance
- Enable WHOIS/RDAP privacy protection on all domain registrations
- Monitor certificate transparency logs continuously (CertStream or equivalent) to detect unauthorized certificate issuance
- Enforce mandatory secret-scanning pre-commit hooks (gitleaks/trufflehog) and repository history scrubbing in CI/CD
- Immediately rotate any credentials or API keys discovered in public repositories or archives
- Submit takedown/removal requests for sensitive content indexed by web archives or search engine caches
- Run periodic employee security-awareness training addressing OSINT and social-engineering exposure

## Success Criteria
✓ Complete WHOIS/RDAP information gathered
✓ All public DNS records enumerated
✓ Associated email addresses and employee identities found
✓ Leaked secrets/credentials in public repositories identified and reported
✓ Public data sources fully documented with source attribution
✓ Target footprint mapped without any active probing

## Dependency Flow
**Input:** Target scope (domains/org names only), rules of engagement confirming passive-only boundary
**Output:** Prioritized passive intelligence dataset — candidate subdomains, leaked secrets, employee/email list, historical endpoints
**Feeds:** Agent-001B (active validation), Agent-001 (aggregated attack surface map), authentication-testing and cloud-misconfiguration agents downstream
