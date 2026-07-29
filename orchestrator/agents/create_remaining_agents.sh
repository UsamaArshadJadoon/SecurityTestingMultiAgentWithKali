#!/bin/bash

# Phase 2 Web Application Testing Sub-Agents
create_agent() {
  local file=$1
  local title=$2
  local tools=$3
  local approach=$4
  
  cat > "$file" << EOF
# Agent: $title

## Overview
Specialized security testing for $title with integrated tools and comprehensive vulnerability assessment.

## Tools Integrated
$tools

## Testing Approach
$approach

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
EOF
}

# Create Phase 2 agents
create_agent "Agent-002A-SQL-Injection.md" "SQL Injection Testing" "- sqlmap - Automated SQLi tool
- sqlninja - Blind SQLi tool
- msfconsole - Exploitation framework" "1. Test input parameters for SQLi
2. Identify database type
3. Extract database contents
4. Escalate privileges
5. Execute system commands"

create_agent "Agent-002B-XSS-Testing.md" "Cross-Site Scripting" "- xsser - XSS vulnerability scanner
- dom-xss-scanner - DOM-based XSS finder
- burp - Web application firewall" "1. Identify injection points
2. Test payload encoding
3. Verify code execution
4. Evaluate impact
5. Document findings"

create_agent "Agent-002C-CSRF-CORS.md" "CSRF and CORS Testing" "- burp - CSRF token analysis
- custom scripts - CORS header checking" "1. Analyze CSRF token implementation
2. Test token validation
3. Check CORS policies
4. Verify origin validation"

create_agent "Agent-002D-Template-Injection.md" "Server-Side Template Injection" "- tplmap - Template injection scanner
- burp - Manual testing
- nuclei - Template injection patterns" "1. Identify template engine
2. Test expression evaluation
3. Verify code execution
4. Extract sensitive data"

create_agent "Agent-002E-Session-Testing.md" "Session Management" "- burp - Session manipulation
- feroxbuster - Cookie enumeration
- jwt_tool - JWT analysis" "1. Analyze session tokens
2. Test session fixation
3. Check cookie security flags
4. Verify session timeout"

create_agent "Agent-002F-XXE-Injection.md" "XML External Entity Injection" "- burp - XXE payload testing
- nuclei - XXE patterns
- custom tools - Entity parsing" "1. Identify XML parsing
2. Test XXE payloads
3. Attempt entity expansion
4. Verify file access"

create_agent "Agent-002G-Path-Traversal.md" "Path Traversal and LFI" "- burp - Path traversal testing
- dotdotpwn - Directory traversal tool
- trawl - File finder" "1. Identify file access endpoints
2. Test path normalization
3. Attempt directory traversal
4. Verify file exposure"

# Phase 3 API Testing
create_agent "Agent-003A-REST-API.md" "REST API Security Testing" "- burp - API testing
- postman - API documentation
- ffuf - Parameter fuzzing
- wfuzz - Web fuzzing" "1. Enumerate API endpoints
2. Test authentication
3. Fuzzy test parameters
4. Verify authorization
5. Check rate limiting"

create_agent "Agent-003B-GraphQL.md" "GraphQL Testing" "- graphql-core - GraphQL parser
- introspection tools - Query discovery" "1. Query GraphQL schema
2. Test authentication bypass
3. Enumerate available queries
4. Test for injection"

create_agent "Agent-003C-gRPC.md" "gRPC Protocol Testing" "- grpcurl - gRPC client
- mitmproxy - Protocol interception
- ghidra - Binary analysis" "1. Discover gRPC services
2. Enumerate methods
3. Test authentication
4. Fuzz parameters"

create_agent "Agent-003D-SOAP.md" "SOAP Web Services" "- soapui - SOAP testing
- burp - SOAP interception
- wsdl2java - WSDL analysis" "1. Enumerate WSDL
2. Test SOAP methods
3. Check WS-Security
4. Test XXE in SOAP"

create_agent "Agent-003E-WebSocket.md" "WebSocket Security" "- burp - WebSocket plugin
- websockify - Protocol tool
- nc - Netcat for raw testing" "1. Identify WebSocket endpoints
2. Test message handling
3. Verify authentication
4. Check message validation"

create_agent "Agent-003F-BOLA-Testing.md" "Broken Object-Level Auth" "- burp - BOLA testing
- nuclei - BOLA patterns
- custom scripts - ID enumeration" "1. Identify resource IDs
2. Test ID manipulation
3. Access other users' data
4. Verify authorization checks"

create_agent "Agent-003G-Mass-Assignment.md" "Mass Assignment Vulnerability" "- burp - Parameter modification
- nuclei - Mass assignment patterns" "1. Identify assignable fields
2. Test parameter injection
3. Modify admin fields
4. Escalate privileges"

echo "Phase 2-3 agents created!"
