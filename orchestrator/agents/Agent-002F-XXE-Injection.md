# Agent: XML External Entity Injection

## Overview
Specialized security testing for XML External Entity Injection with integrated tools and comprehensive vulnerability assessment.

## Tools Integrated
- burp - XXE payload testing
- nuclei - XXE patterns
- custom tools - Entity parsing

## Testing Approach
1. Identify XML parsing
2. Test XXE payloads
3. Attempt entity expansion
4. Verify file access

## Validation Requirements
- Real vulnerability confirmation
- Authentic tool output evidence
- Reproducible exploitation proof
- Clear technical documentation
- Developer-actionable remediation

## CVSS Scoring Factors
- Severity: Based on impact level
- Attack Vector: Network
- Privileges: Varies by vulnerability
- User Interaction: Sometimes required
- Scope: Changed where applicable
- CIA Impact: Varies by finding

## Remediation Examples
- Input validation implementation
- Security headers configuration
- Framework security updates
- Code review and testing
- Security library integration

## Success Criteria
✓ Vulnerability confirmed
✓ Real proof of concept
✓ Technical details documented
✓ Fix recommendations provided
