# 📋 31 Specialized Penetration Testing Agents

Complete specifications for all agents used in the framework.

## Agent Directory

### Phase 1: Reconnaissance (1 Agent)
- **Agent-001-Reconnaissance.md** - Passive/active recon, asset discovery

### Phase 2: Surface Testing (6 Agents)
- **Agent-002-Web-Pentest.md** - OWASP Top 10 web testing
- **Agent-003-API-Security.md** - REST/GraphQL/SOAP API testing
- **Agent-004-Authentication-Authorization.md** - Auth/AuthZ testing
- **Agent-005-Infrastructure.md** - Network/infrastructure testing
- **Agent-006-Cloud-Container.md** - AWS/GCP/Azure/Docker testing
- **Agent-007-AI-LLM.md** - AI/LLM endpoint testing

### Phase 3: Deep Exploitation (7 Agents)
- **Agent-008-SSRF-Exploitation.md** - Server-side request forgery
- **Agent-009-Request-Smuggling.md** - HTTP request smuggling
- **Agent-010-File-Upload-RCE.md** - File upload & RCE
- **Agent-011-Path-Traversal-LFI.md** - Path traversal & LFI
- **Agent-012-XXE-Injection.md** - XML external entity injection
- **Agent-013-Deserialization-RCE.md** - Insecure deserialization
- **Agent-014-SSTI-Exploitation.md** - Server-side template injection

### Phase 4: Post-Exploitation (4 Agents)
- **Agent-015-Post-Exploitation.md** - General post-exploitation
- **Agent-016-Privilege-Escalation.md** - Privilege escalation
- **Agent-017-Secrets-Harvesting.md** - Secrets harvesting
- **Agent-018-Lateral-Movement.md** - Lateral movement

### Phase 5: Source Code Analysis (2 Agents)
- **Agent-019-Source-Code-Disclosure.md** - Source code exposure
- **Agent-020-Git-Forensics.md** - Git history analysis

### Phase 6: Cloud Testing (3 Agents)
- **Agent-021-AWS-Exploitation.md** - AWS testing
- **Agent-022-GCP-Exploitation.md** - GCP testing
- **Agent-023-Azure-Exploitation.md** - Azure testing

### Phase 7: Advanced Authentication (2 Agents)
- **Agent-024-OAuth-SAML-JWT.md** - OAuth/SAML/JWT testing
- **Agent-025-Cryptography.md** - Cryptographic weaknesses

### Phase 8: Supply Chain & Compliance (3 Agents)
- **Agent-026-Dependency-Scanning.md** - Vulnerable dependencies
- **Agent-027-CI-CD-Pipeline.md** - CI/CD security
- **Agent-028-Compliance.md** - Compliance testing

### Phase 9: Business Logic (1 Agent)
- **Agent-029-Business-Logic.md** - Business logic abuse

### Phase 10: Rate Limiting & Brute Force (2 Agents)
- **Agent-030-Rate-Limiting.md** - Rate limit bypass
- **Agent-031-Mass-Assignment.md** - Mass assignment

### Phase 11: Advanced Protocols (2 Agents)
- **Agent-032-WebSocket.md** - WebSocket security
- **Agent-033-gRPC.md** - gRPC testing

### Phase 12: Exploitation Chaining (1 Agent)
- **Agent-034-Exploitation-Chaining.md** - Multi-step exploitation

### Phase 13: Reporting (1 Agent)
- **Agent-035-Reporting.md** - Report generation

## Agent Specification Format

Each agent file includes:
- **Purpose**: What the agent does
- **Tools**: Integrated security tools
- **Testing Coverage**: Attack vectors tested
- **Validation**: Evidence requirements

## Total Coverage

- **35 Agents** - All testing phases
- **55+ Tools** - Fully integrated
- **100% OWASP** - Top 10 coverage
- **100% CWE** - Top 25 coverage
- **7+ MITRE ATT&CK** - Tactics covered

---

See `/docs/Agent-Specifications.md` for detailed agent documentation.
