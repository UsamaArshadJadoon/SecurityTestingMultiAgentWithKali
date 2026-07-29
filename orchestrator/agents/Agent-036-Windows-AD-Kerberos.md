# Agent-015: Windows Active Directory & Kerberos Testing

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Overview
Specialized Windows domain exploitation and Kerberos security testing agent.

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Tools Integrated
- rubeus - Kerberos toolset
- impacket - Network protocol implementation
- hashcat - Credential cracking
- bloodhound - AD visualization
- ldapsearch - LDAP querying
- evil-winrm - WinRM exploitation

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Testing Approach
1. **AD Enumeration**
   - Query domain structure
   - Enumerate users and groups
   - Identify service accounts
   - Map trust relationships
   - Find delegation paths

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
2. **Kerberos Attacks**
   - Request TGT (Ticket Granting Ticket)
   - Perform AS-REP roasting
   - Execute Kerberoasting attacks
   - Forge silver tickets
   - Perform golden ticket attacks
   - Test delegation (unconstrained, constrained, resource)

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
3. **Credential Attacks**
   - Extract NTLM hashes
   - Perform pass-the-hash
   - Execute pass-the-ticket
   - Crack weak passwords
   - Test credential reuse

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
4. **Privilege Escalation**
   - Identify elevated accounts
   - Find service account impersonation
   - Test delegation rights
   - Exploit misconfigured permissions
   - Chain attack vectors

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Validation Requirements
- Real domain authentication
- Captured Kerberos tokens
- Documented attack chains
- Verified privilege escalation
- Reproducible exploitation

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## CVSS Scoring
- Severity: Complete domain compromise
- Attack Vector: Adjacent network (domain member)
- Privileges: Low (domain user)
- User Interaction: None
- Scope: Changed (domain-wide impact)
- CIA Impact: High (complete compromise)

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Remediation Examples
- Disable constrained delegation where possible
- Implement Kerberos pre-authentication
- Monitor for Kerberoasting attempts
- Use account tiering strategy
- Enable Kerberos encryption

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Success Criteria
✓ Domain enumeration output
✓ Valid token capture
✓ Privilege escalation proof
✓ Lateral movement demonstration
✓ Clear remediation steps
