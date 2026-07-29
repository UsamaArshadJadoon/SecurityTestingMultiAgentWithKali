# Agent-004A: OAuth2/OIDC/SAML Testing

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Overview
Comprehensive testing of authentication protocols and implementations including OAuth2, OpenID Connect, and SAML.

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Tools Integrated
- oauth2-utils - Protocol testing utilities
- oidc-debugger - OpenID Connect testing
- saml-decoder - SAML assertion analysis
- burp - Proxy interception

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Testing Approach
1. Test OAuth2 authorization code flow
2. Test implicit and hybrid flows
3. Check token validation and expiry
4. Test OIDC claim validation
5. Test SAML assertion signatures
6. Verify identity provider integration

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Validation Requirements
- Confirmed authentication bypass
- Valid token manipulation proof
- Real assertion forgery
- Signature validation bypass
- Reproducible exploitation

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## CVSS Scoring Factors
- Severity: Authentication bypass
- Attack Vector: Network
- Privileges: None
- User Interaction: Sometimes required
- Scope: Changed
- CIA Impact: High (account takeover)

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Remediation Examples
- Implement proper state validation
- Use PKCE extension
- Verify signature algorithms
- Validate expiry times
- Implement secure token storage

## Evidence Collection
- Actual HTTP requests and responses
- Command execution proof
- System screenshots
- Tool output and logs
- Configuration file excerpts
- Database dumps (if applicable)
## Success Criteria
✓ Protocol flow mapped
✓ Token bypass demonstrated
✓ Assertion forgery proof
✓ Real exploitation shown
