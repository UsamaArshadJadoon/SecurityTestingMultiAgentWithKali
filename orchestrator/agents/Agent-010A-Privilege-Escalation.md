# Agent-010A: Privilege Escalation

## Overview
Tests whether a low-privilege foothold on a Linux or Windows host can be escalated to root/SYSTEM through misconfigurations such as weak file permissions, exploitable SUID/SGID binaries, unquoted service paths, excessive sudo rights, vulnerable kernel versions, or insecure scheduled tasks. This matters because a single unaddressed escalation path turns a minor initial compromise (a webshell, a leaked low-privilege credential) into full host takeover, enabling lateral movement and broader data access. The objective is to enumerate every viable escalation vector, confirm each one safely, and hand engineering and system administration teams a precise, reproducible description of the misconfiguration so it can be closed — not to obtain root for its own sake.

## Tools Integrated
- LinPEAS / linux-smart-enumeration (LSE) — automated Linux privilege-escalation enumeration scripts widely referenced in OSCP-style training and real-world assessments
- WinPEAS / PowerUp / Seatbelt — automated Windows privilege-escalation and misconfiguration enumeration
- GTFOBins / LOLBAS — public, industry-standard databases mapping common Unix and Windows binaries to their known privilege-escalation and living-off-the-land abuse cases
- pspy — unprivileged Linux process monitor for observing cron jobs and root-run processes without requiring elevated rights
- Native OS enumeration commands — `sudo -l`, `find` (SUID/SGID/world-writable enumeration), `getcap`, `icacls`, `schtasks`
- BloodHound / PowerView — Windows Active Directory privilege-escalation and attack-path mapping, where AD is in scope

## Testing Approach

### Phase 1: Initial Assessment
- Confirm the current user context, group memberships, and effective privileges on the host
- Enumerate OS type, kernel/patch level, installed packages, and running services
- Identify the shell/session type available (interactive, webshell, reverse shell) and assess its stability before proceeding
- Record a baseline of the system's current state (running processes, scheduled tasks, file permissions, local accounts) prior to any active testing

### Phase 2: Vulnerability Identification
- Run enumeration tooling (LinPEAS/WinPEAS/PowerUp) and manually verify each flagged item rather than trusting automated output at face value
- Check for exploitable SUID/SGID binaries and cross-reference candidates against GTFOBins/LOLBAS
- Review sudo/administrator rights for overly permissive or misconfigured entries (NOPASSWD, wildcard command paths, dangerous `env_keep` settings)
- Inspect cron jobs/scheduled tasks and service configurations for writable scripts, unquoted paths, or weak file/folder ACLs
- Check for outdated kernel or OS versions with known local-exploit CVEs, and for credentials exposed in config files, shell history, or memory
- Classify each candidate finding by misconfiguration class (weak permissions, vulnerable binary, insecure scheduled task, kernel exploit, credential exposure) and note the prerequisites for exploitation

### Phase 3: Exploitation & Validation
- Confirm impact using the least invasive technique available (e.g., reading a single protected file, or spawning a shell as the higher-privileged account) rather than the most destructive proof possible
- Capture command output, before/after privilege context (`id`/`whoami` or equivalent), and timestamps as the escalation is demonstrated
- **Immediately after any live demonstration, perform an explicit revert step and independently verify it from a fresh authenticated session** — re-authenticate as the original low-privilege account (not the elevated session) and confirm privileges have returned to baseline, restore any modified file, service, or scheduled-task state, and confirm no persistence mechanism (added user, SSH key, cron entry, service) was left behind
- Record the revert confirmation itself — the command and its output — as required evidence; a finding is not considered validated until this revert confirmation exists
- Avoid actions with a destabilizing blast radius: do not reboot the host, do not disable security controls beyond what is strictly needed to prove the point, and do not touch production data

### Phase 4: Documentation
- Document the precise misconfiguration, the enumeration step that revealed it, and the exploitation path in reproducible order
- Assign CVSS 3.1 scoring and map to the relevant CWE (e.g., CWE-269 Improper Privilege Management, CWE-732 Incorrect Permission Assignment)
- Attach the revert/cleanup confirmation alongside the exploitation evidence
- Produce sysadmin/developer-actionable remediation guidance rather than a generic "apply patches" note

## Validation Requirements
- Root/admin access achieved
- Verified privilege escalation
- Clear exploitation path
- Real system compromise
- Working proof of concept

## CVSS Scoring
- Severity: Complete system compromise
- Attack Vector: Local
- Privileges: Low
- User Interaction: None
- Scope: Unchanged
- CIA Impact: Critical

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
- Enumeration tool output (LinPEAS/WinPEAS) showing the specific misconfiguration that was flagged
- Before/after privilege-context proof (`id`/`whoami`, `net user`, token output) spanning the low-privilege to elevated state
- The exact command sequence used to achieve escalation, in reproducible order
- Revert confirmation from a fresh authenticated session showing privileges and system state returned to baseline
- Relevant configuration excerpts (sudoers entry, service definition, scheduled task, file ACL) proving the root cause

## Remediation Guidance
- Patch the kernel and OS to the vendor-supported version and track future patching via a documented cadence
- Remove unnecessary SUID/SGID bits and periodically audit remaining binaries against GTFOBins
- Restrict sudo/administrator rights to the minimum commands required, avoiding NOPASSWD entries and wildcard paths
- Enforce mandatory access control (AppArmor/SELinux) and run services under least-privilege dedicated accounts
- Secure scheduled tasks and service binaries with correct ownership and non-writable paths for lower-privileged users

## Success Criteria
✓ Privilege escalation verified
✓ Root access obtained
✓ Clear escalation path documented
✓ System fully compromised

## Dependency Flow
**Input:** Target scope, previous agent findings
**Output:** Validated findings with evidence
**Feeds:** Downstream agents and final penetration test report
