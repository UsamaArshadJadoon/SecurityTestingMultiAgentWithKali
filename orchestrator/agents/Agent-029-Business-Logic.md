# Agent-029-Business-Logic: Business Logic

## Overview
Business-logic abuse testing targets the abuse cases that automated scanners cannot see because nothing is technically "broken" — the application does exactly what it was coded to do, just not what the business intended. This agent probes workflow sequencing (skipping or replaying steps out of order), state manipulation (forcing an object into a state its own UI would never allow), parameter/price/quantity tampering, race conditions in multi-step transactions (double-spend, TOCTOU on limits/inventory/balances), and abuse of legitimate features at scale (coupon stacking, referral farming, negative-value transactions). These flaws are invisible to CVSS-scanner-driven testing and often produce direct financial or fraud impact rather than classic CIA-triad damage, which makes them easy for less experienced teams to underweight and easy for real attackers to monetize quietly for a long time before detection. Because business-logic bugs are workflow-shaped rather than payload-shaped, this testing is manual-first and requires an accurate model of the intended process before any deviation from it can be recognized as abuse.

## Tools Integrated
- Burp Suite Turbo Intruder — precise single-packet/multi-threaded race-condition attacks against multi-step transactional endpoints (double-redemption, TOCTOU on balances/inventory/limits)
- Burp Suite Repeater/Intruder — manual step-skipping, parameter tampering, and replay of multi-step workflow requests out of sequence
- OWASP ZAP — baseline workflow crawling and sequence mapping to build the state-transition model of the application
- Postman/Newman — scripted reproduction of multi-step API workflows for regression-testing a business-logic finding after a fix
- race-the-web / racer — dedicated race-condition exploitation for concurrent request timing attacks
- mitmproxy — traffic interception/modification for mobile or thick-client workflows where Burp's proxy setup is impractical
- Custom scripts (Python + requests/httpx) — modeling and driving the exact primary business transaction end-to-end, including forced concurrency and out-of-order step injection
- Spreadsheet/state-diagram modeling (manual) — mapping every legitimate state transition so illegitimate transitions are recognizable as such

## Testing Approach

### Phase 1: Initial Assessment
- **Priority one, before any other business-logic work**: identify the single primary business-critical transaction/workflow — the core end-to-end process the product exists to perform (e.g., the main purchase/checkout/submission/approval flow) — and walk it completely end-to-end, exactly as a real user would, as one of the very first actions taken in the engagement. Do not defer this to a later round: a blocking failure anywhere in this workflow gates every downstream business-logic test that depends on reaching later states, and it needs maximum lead time to be reported, fixed, and re-tested before the engagement closes.
- If the primary workflow fails with a blocking error (5xx, stuck state, unhandled exception) during this first pass, immediately document and escalate it as a standalone finding with full reproduction steps, rather than waiting to bundle it with later findings — flag explicitly that it blocks further testing of that workflow until resolved
- Once the primary workflow is confirmed reachable end-to-end, enumerate all other multi-step workflows in scope (registration, checkout, refunds/cancellations, approvals, account recovery, tiered permissions) and map each one's intended sequence, valid state transitions, and business rules/limits (quantities, prices, discount stacking rules, rate limits)
- Identify every point where client-supplied data influences business logic (price, quantity, currency, discount codes, status fields, ownership/user IDs) and where server-side authority might be improperly delegated to the client
- Catalog roles/permission tiers and the workflow steps each is supposed to be restricted from, to seed later state-manipulation and privilege-boundary tests

### Phase 2: Vulnerability Identification
- With the primary workflow's baseline established from Phase 1, systematically attempt to skip steps, replay earlier steps, submit steps out of order, and resubmit a completed step to see if the state machine enforces sequence server-side
- Test for state manipulation: force an object (order, ticket, application, account) into a state it should not legally reach (e.g., "shipped" before "paid", "approved" without required prior sign-off) by directly calling later-stage endpoints or replaying/forging state-transition requests
- Tamper business-critical parameters (price, quantity, currency, discount %, negative values, decimal/overflow edge cases) that the client should not control, checking whether the server independently validates against source-of-truth values
- Identify concurrency-sensitive operations (balance deduction, inventory decrement, coupon redemption, limited-quantity purchases, voting/rate limits) as candidates for race-condition testing in Phase 3
- Test workflow abuse at scale: coupon/discount stacking beyond intended limits, referral/loyalty program farming, repeated free-trial abuse via identity reuse, and rate/quantity limit bypass through parallel sessions
- Probe for missing server-side re-validation of authorization/ownership at each workflow step (a user manipulating a workflow to act on another user's object mid-process, distinct from a simple IDOR)

### Phase 3: Exploitation & Validation
- Execute Turbo Intruder single-packet race attacks against every concurrency-sensitive endpoint identified in Phase 2 (redeem the same coupon twice simultaneously, withdraw/transfer beyond balance, purchase more than available inventory) and capture the resulting inconsistent state as evidence
- Fully complete an abusive end-to-end run of the primary business workflow (e.g., completing the core transaction using a tampered/skipped/replayed sequence) to demonstrate real business impact, not just a single malformed request
- Quantify the financial/operational impact of each confirmed logic flaw (e.g., "N free units obtainable per hour with zero valid payment," "balance can go negative by $X per race window")
- Re-run each confirmed exploitation path a second time from a clean state to rule out a one-off timing fluke and confirm reliable reproducibility
- Where the primary workflow itself was found blocked in Phase 1, re-attempt it here once a fix has been deployed, to confirm the fix restores full end-to-end functionality before the workflow can be considered validated

### Phase 4: Documentation
- Document the intended workflow/state machine alongside the actual abusive path taken, with a side-by-side diagram or step list so a non-technical stakeholder can see exactly where business rules were bypassed
- Explicitly flag any finding that originated from the primary business-critical workflow and note the lead time consumed by any blocking error encountered, since this affects retest scheduling before engagement close
- Map findings to CWE-841 (Improper Enforcement of Behavioral Workflow), CWE-362 (race condition), CWE-840 (Business Logic Errors) and relevant OWASP Top 10 (API6:2023 Unrestricted Access to Sensitive Business Flows) categories in addition to CVSS
- Provide remediation framed as server-side enforcement additions (state-machine validation, idempotency keys, atomic/locking operations, server-side authoritative pricing) rather than client-side fixes

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
- Side-by-side state diagram of intended workflow vs. the actual abusive sequence executed
- Turbo Intruder race-condition attack logs showing simultaneous request timing and the resulting inconsistent state
- Before/after account or object state (balance, inventory count, order status) proving the business impact
- Full HTTP request/response sequence for the primary business-critical workflow, including any blocking error encountered and its exact timestamp
- Quantified abuse metrics (e.g., discount value obtained, inventory oversold, balance manipulated) supporting financial impact estimation

## Remediation Guidance
- Server-side state-machine enforcement so each workflow step validates the object's current state before acting
- Idempotency keys and atomic/locking operations for every concurrency-sensitive transaction (balance, inventory, coupon redemption)
- Server-side authoritative recalculation of price/quantity/discount values, never trusting client-supplied business parameters
- Re-verification of ownership/authorization at every step of a multi-step workflow, not just at entry
- Explicit note when remediation targets the primary business-critical workflow, given its priority for re-test before engagement close

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
