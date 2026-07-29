# Agent-001A: Passive Reconnaissance

## Overview
Passive information gathering and open-source intelligence for target identification and attack surface discovery without active probing.

## Tools Integrated
- whois - Domain registration lookup
- nslookup - DNS query tool
- dig - Advanced DNS lookup
- host - Hostname to IP resolver
- theHarvester - Email/subdomain harvester
- Shodan - Public search engine for internet devices
- Censys - Internet-wide survey data

## Testing Approach
1. **WHOIS Lookup** - Registrant information, registrar details, domain history
2. **DNS Enumeration** - DNS records, MX records, NS servers
3. **Email Harvesting** - Public email addresses linked to target
4. **Search Engine Dorking** - Google, Bing, DuckDuckGo advanced searches
5. **Social Media OSINT** - LinkedIn, Twitter, GitHub, public profiles
6. **Web Archive** - Wayback machine historical data
7. **Public Records** - Business registrations, court records, news articles

## Validation Requirements
- Verified public data collection
- Documented source references
- No active network probing
- Legally obtained information only
- Complete data correlation

## CVSS Scoring Factors
- Severity: Information disclosure (low-medium)
- Attack Vector: Network (public data)
- Privileges: None required
- User Interaction: None
- Scope: Unchanged
- Confidentiality: Low (public information)

## Remediation Examples
- Minimize public information exposure
- Configure DNS security
- Monitor domain registrar account
- Implement WHOIS privacy
- Review social media presence
- Remove sensitive data from archives

## Success Criteria
✓ Complete WHOIS information gathered
✓ All DNS records enumerated
✓ Associated email addresses found
✓ Public data sources identified
✓ Target footprint mapped
