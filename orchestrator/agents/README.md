# 📋 106 Specialized Penetration Testing Agents

Complete specifications for all 106 agents, organized here by the same 23 execution categories `Orchestrator.js` actually runs them in (its own `defineAgents()`/`getPhaseName()` grouping).

**Framework Statistics:**
- **106 Agent Specification Files** (Agent-001 through Agent-064, several with lettered sub-agent variants)
- **23 Execution Categories**, dependency-ordered — each category's agents receive prior categories' real findings as context
- **150+ Integrated Kali Linux Tools** via SSH
- **4-Layer Validation System** (`orchestrator/validation-gate.js`) ensuring findings are format-valid, evidenced, technically accurate, and remediation-complete before they reach a report
- **CVSS 3.1 Scoring** with OWASP/CWE/MITRE mapping
- **Production Ready** - v2.0.0

> **Note:** every filename below was verified against the real files in this directory — none are placeholders. If you're looking for a specific agent, `Ctrl+F` the exact filename shown in **bold**.

## Agent Directory

### Category 1: Reconnaissance & Discovery (3 Agents)
- **Agent-001-Reconnaissance.md** - Reconnaissance & Asset Discovery
- **Agent-001A-Passive-Recon.md** - Passive Reconnaissance
- **Agent-001B-Active-Discovery.md** - Active Network Discovery

### Category 2: Web Application Testing (8 Agents)
- **Agent-002-Web-Pentest.md** - Web Pentest
- **Agent-002A-SQL-Injection.md** - SQL Injection Testing
- **Agent-002B-XSS-Testing.md** - Cross-Site Scripting
- **Agent-002C-CSRF-CORS.md** - CSRF and CORS Testing
- **Agent-002D-Template-Injection.md** - Server-Side Template Injection
- **Agent-002E-Session-Testing.md** - Session Management
- **Agent-002F-XXE-Injection.md** - XML External Entity Injection
- **Agent-002G-Path-Traversal.md** - Path Traversal and LFI

### Category 3: API Security (8 Agents)
- **Agent-003-API-Security.md** - API Security
- **Agent-003A-REST-API.md** - REST API Security Testing
- **Agent-003B-GraphQL.md** - GraphQL Testing
- **Agent-003C-gRPC.md** - gRPC Protocol Testing
- **Agent-003D-SOAP.md** - SOAP Web Services
- **Agent-003E-WebSocket.md** - WebSocket Security
- **Agent-003F-BOLA-Testing.md** - Broken Object-Level Auth
- **Agent-003G-Mass-Assignment.md** - Mass Assignment Vulnerability

### Category 4: Authentication & Authorization (3 Agents)
- **Agent-004-Authentication-Authorization.md** - Authentication Authorization
- **Agent-004A-Auth-Flow.md** - Authentication Flow Testing
- **Agent-024-OAuth-SAML-JWT.md** - OAuth SAML JWT

### Category 5: Infrastructure, Cloud & AI Surface (3 Agents)
- **Agent-005-Infrastructure.md** - Network & Infrastructure Security Assessment
- **Agent-006-Cloud-Container.md** - Cloud Container
- **Agent-007-AI-LLM.md** - AI LLM

### Category 6: Deep Exploitation & RCE (7 Agents)
- **Agent-008-SSRF-Exploitation.md** - SSRF Exploitation
- **Agent-009-Request-Smuggling.md** - Request Smuggling
- **Agent-0010-File-Upload-RCE.md** - File Upload RCE
- **Agent-0011-Path-Traversal-LFI.md** - Path Traversal LFI
- **Agent-0012-XXE-Injection.md** - XXE Injection
- **Agent-0013-Deserialization-RCE.md** - Deserialization RCE
- **Agent-0014-SSTI-Exploitation.md** - SSTI Exploitation

### Category 7: Post-Exploitation (9 Agents)
- **Agent-010A-Privilege-Escalation.md** - Privilege Escalation
- **Agent-010B-Lateral-Movement.md** - Lateral Movement Risk Assessment
- **Agent-010C-Persistence.md** - Persistence Mechanism Risk Assessment
- **Agent-010D-Data-Exfiltration.md** - Data Exposure & Exfiltration-Path Risk Assessment
- **Agent-010E-Cleanup.md** - Post-Engagement Cleanup & Revert Verification
- **Agent-015-Post-Exploitation.md** - Post-Exploitation Impact Synthesis
- **Agent-017-Secrets-Harvesting.md** - Exposed Secrets Discovery
- **Agent-018-Lateral-Movement.md** - Network Segmentation & Detection-Gap Assessment
- **Agent-037-Privilege-Escalation.md** - Privilege Escalation

### Category 8: Rate-Limiting, Protocol Abuse & Business Logic (10 Agents)
- **Agent-011A-Rate-Limit.md** - Rate Limit
- **Agent-011B-DoS-Attacks.md** - DoS Attacks
- **Agent-011C-Resource-Abuse.md** - Resource Abuse
- **Agent-029-Business-Logic.md** - Business Logic
- **Agent-030-Rate-Limiting.md** - Rate Limiting
- **Agent-031-Mass-Assignment.md** - Mass Assignment
- **Agent-031A-Extras.md** - Extras
- **Agent-032-WebSocket.md** - WebSocket
- **Agent-032A-Advanced.md** - Advanced
- **Agent-033-gRPC.md** - gRPC

### Category 9: Network Protocols (4 Agents)
- **Agent-012A-SMTP-Email.md** - SMTP Email
- **Agent-012B-LDAP-Directory.md** - LDAP Directory
- **Agent-012C-Database.md** - Database
- **Agent-012D-RDP-Remote.md** - RDP Remote

### Category 10: Mobile Security (6 Agents)
- **Agent-013-Mobile-iOS.md** - iOS Security Testing
- **Agent-014-Mobile-Android.md** - Android Security Testing
- **Agent-014A-Mobile-Auth.md** - Mobile Auth
- **Agent-014B-Mobile-Storage.md** - Mobile Storage
- **Agent-014C-Mobile-Comms.md** - Mobile Comms
- **Agent-014D-Mobile-Injection.md** - Mobile Injection

### Category 11: Wireless Security (5 Agents)
- **Agent-014E-WPA-Cracking.md** - WPA Cracking
- **Agent-014F-Bluetooth.md** - Bluetooth
- **Agent-014G-RFID-NFC.md** - RFID NFC
- **Agent-014H-Cellular.md** - Cellular
- **Agent-038-Wireless-WiFi-Hacking.md** - Wireless WiFi Security Testing

### Category 12: Windows & Linux Exploitation (2 Agents)
- **Agent-016-Linux-Kernel-Exploit.md** - Linux Kernel Exploitation
- **Agent-036-Windows-AD-Kerberos.md** - Active Directory & Kerberos Configuration Assessment

### Category 13: Reverse Engineering & Forensics (3 Agents)
- **Agent-039-Reverse-Engineering-Binary.md** - Binary Reverse Engineering & Analysis
- **Agent-040-Source-Code-Disclosure.md** - Source Code Disclosure
- **Agent-041-Git-Forensics.md** - Git Forensics

### Category 14: Cloud Platforms — AWS / GCP / Azure (4 Agents)
- **Agent-019-Cloud-AWS-Security.md** - AWS Cloud Security Testing
- **Agent-021-AWS-Exploitation.md** - AWS Exploitation
- **Agent-023-Azure-Exploitation.md** - Azure Exploitation
- **Agent-043-GCP-Exploitation.md** - GCP Exploitation

### Category 15: Defense Evasion (1 Agent)
- **Agent-020-Defense-Evasion-AV-EDR.md** - Detection-Coverage Assessment (Purple Team)

### Category 16: CI/CD, Dependencies & IaC (3 Agents)
- **Agent-022-CI-CD-Pipeline-Security.md** - CI/CD Pipeline Security Testing
- **Agent-026-Dependency-Scanning.md** - Dependency Scanning
- **Agent-027-CI-CD-Pipeline.md** - CI CD Pipeline

### Category 17: Cryptography (1 Agent)
- **Agent-025-Cryptography.md** - Cryptography

### Category 18: IoT & Firmware (1 Agent)
- **Agent-042-IoT-Firmware-Analysis.md** - IoT & Firmware Security Testing

### Category 19: Database Security (1 Agent)
- **Agent-044-Database-Security-Testing.md** - Database Security Testing

### Category 20: Compliance, Chaining & Reporting (4 Agents)
- **Agent-028-Compliance.md** - Compliance
- **Agent-030B-Report-Analysis.md** - Report Analysis
- **Agent-034-Exploitation-Chaining.md** - Exploitation Chaining
- **Agent-035-Reporting.md** - Reporting

### Category 21: Advanced Infrastructure Security (8 Agents)
- **Agent-045-Network-Segmentation.md** - Network Segmentation & Zero-Trust Validation
- **Agent-046-LoadBalancer-ReverseProxy.md** - Load Balancer & Reverse Proxy Security
- **Agent-047-VPN-RemoteAccess.md** - VPN & Remote Access Security
- **Agent-048-Container-Orchestration-Deep.md** - Deep Container Orchestration & Service Mesh Security
- **Agent-049-Email-Infrastructure-Hardening.md** - Mail Server & MTA Infrastructure Hardening
- **Agent-050-Backup-DR-Security.md** - Backup & Disaster Recovery Security
- **Agent-051-Physical-Virtual-Infra-Config.md** - Virtual Infrastructure & Hypervisor Hardening
- **Agent-052-Network-Device-Hardening.md** - Network Device Hardening (Routers, Switches, Firewalls)

### Category 22: Advanced Database Security (6 Agents)
- **Agent-053-NoSQL-Deep-Dive.md** - NoSQL Engine-Specific Injection & Misconfiguration Testing
- **Agent-054-DB-Privilege-Replication-Audit.md** - Database Privilege, Replication & Audit-Log Security Review
- **Agent-055-ORM-QueryBuilder-Injection.md** - ORM & Query-Builder Abstraction-Layer Injection Testing
- **Agent-056-DBaaS-Managed-Database-Security.md** - Managed Database Service (DBaaS) Configuration Security Review
- **Agent-057-Database-Encryption-KeyManagement.md** - Database Encryption & Key Management Review
- **Agent-058-DataWarehouse-BigData-Security.md** - Data Warehouse & Big Data Platform Security Testing

### Category 23: Web, Mobile & API Coverage Extension (6 Agents)
- **Agent-059-WebAuthn-Passkey-Security.md** - WebAuthn / FIDO2 Passkey Security
- **Agent-060-PWA-ServiceWorker-Security.md** - PWA / Service Worker Security
- **Agent-061-CrossPlatform-Framework-Security.md** - Cross-Platform Framework Bridge Security
- **Agent-062-Mobile-Supply-Chain-Security.md** - Mobile App Supply Chain Security
- **Agent-063-API-Gateway-Deep-Dive.md** - API Gateway Platform Deep Dive
- **Agent-064-Webhook-Security.md** - Webhook Security

## Agent Specification Format

Each agent file includes:
- **Overview**: Purpose and scope
- **Tools**: Integrated security tools
- **Testing Approach**: Detailed methodology
- **Validation**: Evidence requirements
- **CVSS Scoring**: Severity factors
- **Remediation**: Fix recommendations
- **Success Criteria**: Proof of concept requirements

## Complete Framework Coverage

✅ **106 Agents** - Comprehensive coverage
✅ **150+ Tools** - Full tool integration
✅ **100% OWASP** - Top 10 + extended
✅ **100% CWE** - Top 25 + additional
✅ **7+ MITRE ATT&CK** - Multiple tactics
✅ **Mobile Security** - iOS & Android
✅ **Wireless** - WiFi, Bluetooth, cellular
✅ **Cloud** - AWS, GCP, Azure
✅ **DevOps** - CI/CD, containers, serverless
✅ **IoT** - Firmware, embedded systems
✅ **Hardware** - BIOS, physical testing
✅ **Post-Exploitation** - Persistence, evasion
✅ **Enterprise** - Windows AD, Kerberos
✅ **Database** - SQL, NoSQL, Oracle
✅ **Compliance** - PCI-DSS, HIPAA, GDPR, SOC2
✅ **Advanced** - Cryptanalysis, reverse engineering, malware analysis

---

Each agent is production-ready with 4-layer validation, real evidence requirements, and developer-friendly remediation guidance.
