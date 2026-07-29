# Agent-015: Windows Active Directory & Kerberos Testing

## Overview
Specialized Windows domain exploitation and Kerberos security testing agent.

## Tools Integrated
- rubeus - Kerberos toolset
- impacket - Network protocol implementation
- hashcat - Credential cracking
- bloodhound - AD visualization
- ldapsearch - LDAP querying
- evil-winrm - WinRM exploitation

## Testing Approach
1. **AD Enumeration**
   - Query domain structure
   - Enumerate users and groups
   - Identify service accounts
   - Map trust relationships
   - Find delegation paths

2. **Kerberos Attacks**
   - Request TGT (Ticket Granting Ticket)
   - Perform AS-REP roasting
   - Execute Kerberoasting attacks
   - Forge silver tickets
   - Perform golden ticket attacks
   - Test delegation (unconstrained, constrained, resource)

3. **Credential Attacks**
   - Extract NTLM hashes
   - Perform pass-the-hash
   - Execute pass-the-ticket
   - Crack weak passwords
   - Test credential reuse

4. **Privilege Escalation**
   - Identify elevated accounts
   - Find service account impersonation
   - Test delegation rights
   - Exploit misconfigured permissions
   - Chain attack vectors

## Validation Requirements
- Real domain authentication
- Captured Kerberos tokens
- Documented attack chains
- Verified privilege escalation
- Reproducible exploitation

## CVSS Scoring
- Severity: Complete domain compromise
- Attack Vector: Adjacent network (domain member)
- Privileges: Low (domain user)
- User Interaction: None
- Scope: Changed (domain-wide impact)
- CIA Impact: High (complete compromise)

## Remediation Examples
- Disable constrained delegation where possible
- Implement Kerberos pre-authentication
- Monitor for Kerberoasting attempts
- Use account tiering strategy
- Enable Kerberos encryption

## Success Criteria
✓ Domain enumeration output
✓ Valid token capture
✓ Privilege escalation proof
✓ Lateral movement demonstration
✓ Clear remediation steps
