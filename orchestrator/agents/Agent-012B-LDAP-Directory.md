# Agent-012B-LDAP-Directory: LDAP Directory

## Overview
Targets LDAP and Active Directory directory services (ports 389/636/3268/3269), where misconfigurations expose an organization's entire identity structure to attack. Anonymous or weakly-controlled binds allow unauthenticated enumeration of users, groups, computers, and password policy — intelligence that directly feeds password spraying and Kerberoasting. Weak ACLs, unsigned/unencrypted LDAP traffic, and excessive delegation rights can enable privilege escalation all the way to Domain Admin. This service is frequently the pivot point between an initial foothold and full domain compromise, making it one of the highest-leverage targets in an internal engagement.

## Tools Integrated
- ldapsearch (OpenLDAP client) - anonymous/authenticated bind testing, base/scope queries, schema and RootDSE enumeration
- ldapdomaindump - full directory structure export (users, groups, computers, trusts) to HTML/JSON
- BloodHound with SharpHound/bloodhound-python collectors - attack-path graphing, ACL abuse and delegation discovery
- windapsearch / ADRecon - AD-specific enumeration with minimal privileges
- rpcclient / enum4linux-ng - complementary SMB/RPC-based user and policy enumeration
- Impacket suite (GetADUsers.py, GetNPUsers.py, GetUserSPNs.py) - AS-REP roasting and Kerberoasting driven from LDAP-derived user lists
- ldapmodify / ldapadd - testing write ACLs (e.g., group membership or attribute modification abuse)
- nmap (ldap-search, ldap-rootdse NSE scripts) - RootDSE and naming-context discovery
- CrackMapExec / NetExec (ldap module) - credential validation and password policy retrieval

## Testing Approach

### Phase 1: Initial Assessment
- Query RootDSE (`ldapsearch -x -H ldap://host -s base -b "" "(objectclass=*)"`) to fingerprint the vendor (Active Directory, OpenLDAP, 389 DS), naming contexts, and supported controls
- Determine whether anonymous bind is permitted (`ldapsearch -x -H ldap://host -b "<basedn>"` with no credentials supplied)
- Enumerate available naming contexts and schema, and check whether LDAPS (636)/StartTLS is offered alongside plaintext 389
- Identify Global Catalog exposure (3268/3269), which can leak forest-wide data beyond a single domain
- Validate the LDAPS certificate for expiry, weak ciphers, and hostname mismatch

### Phase 2: Vulnerability Identification
- Anonymous bind data exposure: attempt to pull the full user list, group memberships, password policy attributes (`pwdLastSet`, `lockoutThreshold`), and description fields (which often contain embedded passwords) without credentials
- LDAP signing/channel binding not enforced: confirm whether unsigned/unencrypted simple binds are accepted, which enables LDAP relay attacks
- Excessive read/write ACLs: test whether a low-privileged or anonymous account can modify sensitive attributes (`userAccountControl`, group membership, `msDS-AllowedToActOnBehalfOfOtherIdentity` for resource-based constrained delegation)
- Kerberoastable/AS-REP-roastable accounts: query for populated `servicePrincipalName` attributes and accounts with `UF_DONT_REQUIRE_PREAUTH` set
- Default or weak service-account credentials tied to LDAP bind DNs discovered in configuration files or via enumeration
- Password policy weaknesses (`minPwdLength`, `lockoutThreshold=0`, no complexity requirement) discovered via LDAP queries, which directly informs spraying feasibility

### Phase 3: Exploitation & Validation
- Chain anonymous bind into a full domain dump (ldapdomaindump/BloodHound collection), then run attack-path analysis to identify the shortest route to Domain Admin
- Use enumerated usernames and the discovered password policy to run a controlled, lockout-aware password spray (CrackMapExec/NetExec) against a small, representative set of accounts
- Request and crack Kerberoast/AS-REP hashes offline (hashcat) from SPNs/preauth-disabled accounts surfaced via LDAP, demonstrating credential compromise without touching account lockout thresholds
- Where write access is confirmed, demonstrate ACL abuse using a disposable/authorized test object only — never modify live production groups or accounts
- Assess LDAP relay feasibility where signing is not enforced, describing (and, only where explicitly authorized, demonstrating in a controlled manner) NTLM relay to LDAP for computer object creation or RBCD abuse

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
- Raw ldapsearch output showing anonymous/unauthenticated access to sensitive attributes
- BloodHound attack-path export demonstrating the privilege-escalation route
- Extracted password policy and account list used to justify spray scope and rate
- Kerberoast/AS-REP ticket hashes (redacted) and cracked-credential proof
- Screenshots/logs of the ACL modification test showing write-access abuse

## Remediation Guidance
- Disable anonymous LDAP bind; require authentication for all directory queries
- Enforce LDAP signing and channel binding (mandatory LDAPS/StartTLS) to prevent relay attacks
- Apply least-privilege ACLs on directory objects; audit and remove unnecessary write/generic-all rights
- Enforce a strong password policy and remove unnecessary `DONT_REQUIRE_PREAUTH` flags and SPNs from privileged accounts
- Rotate and vault service-account credentials used for LDAP binds; monitor for enumeration and spray patterns
- Restrict Global Catalog exposure and directory access to only the hosts/subnets that require it

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
