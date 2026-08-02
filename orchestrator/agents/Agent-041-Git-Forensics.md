# Agent-041-Git-Forensics: Git Forensics

## Overview
Deep-dives into git repository history itself — not just the current working tree — to recover secrets and sensitive data that were committed and later "removed" by a subsequent commit under the mistaken assumption that deletion equals remediation. Because git is append-only by design, anything ever committed remains fully recoverable from history, reflogs, dangling commits, and even force-pushed/rebased-away commits until an explicit history rewrite (BFG/filter-repo) and garbage collection are performed. This agent treats the full `.git` object database — commits, blobs, tags, branches, stashes, and reflog — as attack surface, reconstructing secret material an attacker with repository read access (or an exposed `.git` directory) could recover regardless of what the latest commit looks like.

## Tools Integrated
- trufflehog (`--since-commit`, full filesystem/git-history mode) — regex + entropy-based secret detection across entire git history
- gitleaks (`detect --log-opts`) — commit-by-commit secret scanning with custom rule packs
- git-secrets — pattern-based historical scanning
- git log / git show / git diff — manual targeted history review of suspicious commits (e.g., messages like "remove password", "fix leaked key")
- BFG Repo-Cleaner / git filter-repo — used defensively to validate that a client's "cleanup" actually purged the objects, not just the ref
- git cat-file / git rev-list --objects --all — low-level object inspection to find orphaned/dangling blobs not reachable from any branch
- GitHub/GitLab commit search and code search API — searching org-wide history for secret patterns at scale
- gitrob / git-hound — targeted GitHub org-wide secret-in-history hunting
- shhgit — real-time secret detection across git hosting platforms

## Testing Approach

### Phase 1: Initial Assessment
- Clone the full repository including all branches, tags, and reflog (`git clone --mirror` or a full clone plus `git fetch --all`) — a shallow clone hides history
- Establish repository size/age/commit count to scope the forensics effort, and scan commit messages for patterns suggesting past incidents ("remove secret", "oops", "revert credentials", "security fix")
- Enumerate all branches (including remote-tracking and stale/abandoned ones) and tags — secrets often survive only on a branch nobody deleted
- Check accessible reflog entries and stash entries (`git stash list`) where local/authenticated repo access is available, not just a bare clone
- Determine whether the repo has ever undergone a history rewrite (BFG/filter-branch) by checking for `refs/original/` backup refs or inconsistent commit-hash patterns

### Phase 2: Vulnerability Identification
- Run trufflehog/gitleaks in full-history mode across every branch and tag, not just HEAD, to catch secrets that exist only in intermediate commits
- Specifically inspect commits immediately following a suspicious "remove"/"revert"/"cleanup" commit message — the secret is still fully present in the parent commit's blob
- Search for dangling/unreachable commits and blobs (`git fsck --full --unreachable --no-reflog`) that may hold secrets deliberately "deleted" via reset/rebase but never garbage-collected
- Check `.gitignore` history — files now ignored may have been committed earlier before the ignore rule existed (`git log --all --full-history -- <path>`)
- Review large/binary blobs in history for accidentally committed database dumps, private key files, or credential-bearing archives
- Cross-reference author email addresses and commit-signing keys in history for internal employee enumeration / OSINT value
- Check for secrets embedded in commit messages themselves, not just diffs — a common oversight when developers paste error output containing tokens

### Phase 3: Exploitation & Validation
- Extract each recovered secret and validate it against its real target system within authorized scope only (cloud CLI identity check, DB connection test, registry auth check), stopping immediately at confirmation of validity
- For a "removed" secret, produce the exact `git show <commit>:<path>` output proving the plaintext value is still retrievable from a normal clone, demonstrating the removal commit provided no actual protection
- Where force-push/rebase was used to "fix" history, demonstrate recovery via reflog or a cached/forked copy (e.g., a hosting provider's cached view of a previously public commit, or a contributor's local clone) to show the rewrite alone was insufficient without also rotating the leaked credential
- Chain a recovered credential into a second-order access demonstration consistent with rules of engagement (e.g., confirming a leaked cloud key's IAM permissions without performing any destructive or lateral action)

### Phase 4: Documentation
- Document the exact commit hash, author, date, and file path where each secret was introduced and, if applicable, where it was later removed
- Include the full command used to reproduce recovery (e.g., `git show a1b2c3d:config/database.yml`) so the client can verify independently
- Note whether the secret has already been rotated (test validity) — an unrotated, still-valid historically-leaked secret is materially higher severity
- Recommend not just secret rotation but a full history-rewrite-and-force-push remediation plan, explaining why simply committing a fix is insufficient

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
- Exact `git show`/`git log` command output proving secret recoverability from history
- Commit hash, author, timestamp, and file path chain of custody for each recovered secret
- Validation result of each recovered credential against its live target system (redacted value, confirmed scope/validity)
- Full branch/tag/reflog enumeration output showing where the secret-bearing commit remains reachable
- trufflehog/gitleaks scan output (JSON) with entropy/regex match details for each finding

## Remediation Guidance
- Rotate every recovered credential immediately regardless of how long ago it was "removed" from the latest commit
- Perform an actual history rewrite (`git filter-repo`, not just a new commit) to purge the secret-bearing blob from all branches, tags, and reflog, followed by a coordinated force-push and re-clone by all contributors
- Run `git gc --prune=now --aggressive` after the history rewrite to ensure dangling objects are actually removed from the object database, not just unreferenced
- Add pre-commit secret scanning (git-secrets, gitleaks pre-commit hook, trufflehog pre-commit) to prevent recurrence
- Invalidate any cached/forked/mirrored copies of the repository (fork network, CI runner caches, developer laptops) that may retain the pre-rewrite history

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
