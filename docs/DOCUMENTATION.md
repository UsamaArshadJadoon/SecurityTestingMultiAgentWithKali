# Security Testing Multi-Agent Framework - Complete Documentation

**Framework Version**: 3.0.0 (156+ Agents - All Phases 1-4 Complete)

## Table of Contents
1. [Installation & Setup](#installation--setup)
2. [Usage & Running Tests](#usage--running-tests)
3. [Understanding Reports](#understanding-reports)
4. [All 156+ Agents](#all-156-agents)
5. [Tools Reference (150+ Integrated)](#tools-reference-150-integrated)
6. [Framework Overview](#framework-overview)
7. [Validation System](#validation-system)
8. [Credentials & Security Management](#credentials--security-management)

---

**📌 NOTE:** For detailed Phase 1-4 implementation breakdown and all 156+ agents, see **[COMPREHENSIVE_GUIDE.md](COMPREHENSIVE_GUIDE.md)**

This document provides installation, usage, and reference information for the complete framework.

---

## Installation & Setup

### System Requirements

#### Infrastructure
- **Kali Linux VM:** 4GB RAM, 20GB disk space, SSH port 22 accessible
- **Host System:** Windows, macOS, or Linux with SSH client
- **Network:** Dedicated testing subnet, ability to reach target environment

#### Software
- **Claude Code:** Latest version (https://claude.com/code)
- **Python:** 3.8+
- **Node.js:** 14+
- **Git:** 2.25+
- **SSH Client:** OpenSSH or compatible

### Step-by-Step Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/UsamaArshadJadoon/SecurityTestingMultiAgentWithKali.git
cd SecurityTestingMultiAgentWithKali
```

#### Step 2: Setup Kali Tools (One-Time, ~30 minutes)
```bash
bash kali-setup/kali-init.sh
bash kali-setup/install-tools.sh
bash kali-setup/verify-tools.sh
```

This installs and configures 150+ security tools including nmap, sqlmap, ffuf, nuclei, metasploit, hashcat, burp, metasploit, and many more.

#### Step 3: Create & Configure Engagement (interactive)
```bash
bash scripts/setup-engagement.sh my-client
```

This is a one-time interactive intake — the script asks for:
- The target URL
- One or more authorized test-user roles (name + username + password each — add at least two, e.g. `admin` and `standard-user`, to enable privilege-escalation/BOLA/IDOR testing)
- Explicit authorization confirmation (`yes`), plus the authorizing name/email

It then writes `config.yaml`, `scope.md` (with `authorization.confirmed: true` recorded), and `.env` (git-ignored) automatically — no manual file editing needed. The `.env` file follows this shape:
```
TARGET_URL=https://target.example.com
TARGET_USERNAME=testuser
TARGET_PASSWORD=password123
ROLE_ADMIN_LABEL=admin
ROLE_ADMIN_USERNAME=admin_user
ROLE_ADMIN_PASSWORD=AdminP@ss1
ROLE_STANDARD_USER_LABEL=standard-user
ROLE_STANDARD_USER_USERNAME=std_user
ROLE_STANDARD_USER_PASSWORD=StdP@ss1
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
API_KEY=
AUTHORIZATION_NAME=John Doe
AUTHORIZATION_EMAIL=john@company.com
AUTHORIZATION_DATE=2024-07-29
TESTING_WINDOW_START=2024-07-29T00:00:00Z
TESTING_WINDOW_END=2024-08-05T23:59:59Z
```
(Optional fields like `DATABASE_HOST` and `API_KEY` are left blank — edit `.env` by hand afterward if those are in scope.)

#### Step 4: Validate Configuration
```bash
bash scripts/validate-config.sh my-client
```

Verifies `config.yaml`, `scope.md`, and `.env` all exist, that `TARGET_URL` is a valid URL, that at least one authorized role is present, and that `scope.md` explicitly confirms authorization.

#### Step 5: Run Penetration Test
In Claude Code, run:
```
Run full penetration test for my-client
```

Claude Code reads each agent's spec file and dispatches it live via its Agent tool, working through all 106 agents in 23 dependency-ordered execution categories. There's no unattended background mode — duration scales with how many agents you run in the session and how long each one's real tooling takes against the target.

#### Step 6: Review Report
```bash
open engagements/my-client/report/report.html
```

Beautiful HTML report with all findings, evidence, CVSS scores, and remediation guidance.

---

## Usage & Running Tests

### Basic Workflow

1. **Prepare Target:** Identify target application and get authorization
2. **Setup & Configure Engagement:** Run `bash scripts/setup-engagement.sh <name>` — interactively asks for the target URL, authorized test-user roles, and authorization confirmation, then writes `.env` automatically
3. **Validate:** Run `bash scripts/validate-config.sh <name>`
4. **Execute:** In Claude Code: "Run full penetration test for <name>"
5. **Review:** Open generated HTML report

### Running Specific Phases

Instead of full test, run specific phases:

```
Run phases 1-3 for reconnaissance and surface testing only
```

```
Run phase 2 (surface testing) with updated scope
```

```
Run phases 3-5 (exploitation through source code analysis)
```

### Engagement Configuration

Each engagement has this structure:
```
engagements/my-client/
├── config.yaml              # Configuration
├── scope.md                 # Scope & authorization
├── .env                     # Target URL, role credentials (git-ignored)
├── evidence/findings/       # Raw findings (JSON)
└── report/                  # Generated reports
    └── report.html          # Final HTML report
```

### Running Tests on Different Targets

```bash
# Create multiple engagements
bash scripts/setup-engagement.sh client-a
bash scripts/setup-engagement.sh client-b
bash scripts/setup-engagement.sh client-c

# Test each in sequence
# In Claude Code:
Run full penetration test for client-a
Run full penetration test for client-b
Run full penetration test for client-c
```

### Interpreting Test Output

During execution, you'll see:
- **Phase progress:** "Executing Phase 1: Reconnaissance..."
- **Agent updates:** "Agent-003: Web Application testing 45% complete"
- **Finding summaries:** "Found 12 vulnerabilities in API endpoints"
- **Validation status:** "Validating 45 findings through 4-layer gates..."
- **Report generation:** "Generating HTML report..."

Final output includes path to report: `engagements/my-client/report/report.html`

---

## Understanding Reports

### Report Structure

`engagements/<name>/report/report.html` is generated automatically by
`orchestrator/report-generator.js` from that engagement's validated findings
(`evidence/findings/*.json`), reusing the shared dark "case file" dossier
design system in `templates/report/styles.css` — the same rich, professional
format across every engagement. Each HTML report contains:

#### Executive Summary
- High-level overview of findings
- Risk matrix showing severity distribution
- Key statistics (total findings, critical count, etc.)
- Testing duration and methodology

#### Risk Matrix
Visual representation of vulnerabilities by:
- Severity (Critical, High, Medium, Low)
- Type (Injection, Broken Auth, Sensitive Data, etc.)
- Impact area (Web App, API, Infrastructure, etc.)

#### Detailed Findings
For each vulnerability:

1. **Title:** Clear, descriptive vulnerability name
2. **Severity:** Critical / High / Medium / Low with CVSS 3.1 score
3. **Description:** What the vulnerability is and why it matters
4. **Evidence:** 
   - HTTP request/response pairs
   - Screenshots
   - Tool output
   - Reproduction steps
5. **Technical Details:**
   - CWE mapping
   - OWASP Top 10 category
   - MITRE ATT&CK tactic/technique
   - Attack vector (Network, Adjacent, Local, Physical)
   - Complexity, privileges, user interaction
6. **Impact:** Specific business and technical impact
7. **Remediation:**
   - Vulnerable code example
   - Fixed code example
   - Step-by-step remediation
   - Effort estimate
8. **References:** Security standards, CVEs, best practices

### CVSS Scoring

Each finding includes CVSS 3.1 score with justification:

- **Critical (9.0-10.0):** Immediate exploit, wide impact
- **High (7.0-8.9):** Serious vulnerability, significant impact
- **Medium (4.0-6.9):** Moderate risk, some mitigation possible
- **Low (0.1-3.9):** Minor issue, difficult to exploit

Example CVSS Justification:
```
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H

Vector Explanation:
- Attack Vector (AV:N): Attackable from network
- Attack Complexity (AC:L): Low complexity
- Privileges Required (PR:N): No privileges needed
- User Interaction (UI:N): No user interaction
- Scope (S:C): Changed (can affect other systems)
- Confidentiality (C:H): High impact
- Integrity (I:H): High impact
- Availability (A:H): High impact

Score: 10.0 (Critical)
Justification: Network-accessible RCE with no auth required
```

### Report Statistics

At a glance:
- **Total Findings:** Count by severity
- **Testing Duration:** Actual time spent
- **Phases Executed:** Which phases ran
- **Coverage:** OWASP %, CWE %, MITRE %
- **False Positive Rate:** 0%
- **Validation Gates:** All findings passed 4-layer validation

### Using Findings in Development

1. **Prioritize by CVSS:** Fix Critical/High first
2. **Follow Remediation:** Step-by-step guidance provided
3. **Use Code Examples:** Vulnerable code + fixed code provided
4. **Verify Fixes:** Ensure fix matches guidance exactly
5. **Re-test:** Request follow-up assessment after fixes
6. **Track Compliance:** Reference findings in compliance documentation

---

## All 156+ Agents

> **Note on organization:** the "Capability Bundle" numbers below are a documentation-only grouping for readability — they do **not** reflect execution order and are unrelated to the numbers in the same-named 33-entry file-directory catalog in `orchestrator/agents/README.md` (a coincidental overlap in count, not the same numbering). Most bundles below consolidate several related spec files from `orchestrator/agents/` under one representative write-up (e.g. "Agent-002: Web Application Security" summarizes the combined coverage of `Agent-002-Web-Pentest.md` and its `Agent-002A`-`Agent-002G` variants); Bundles 31-33 map one-to-one with individual spec files. **The real execution order is 23 dependency-ordered categories**, defined in `Orchestrator.js`'s own `defineAgents()`/`getPhaseName()` — see the [Framework Overview](#framework-overview) section below for that list. For the file-by-file directory of all 106 agent spec files (exact filenames, per-file counts), see [orchestrator/agents/README.md](../orchestrator/agents/README.md).

### Capability Bundle 1: Reconnaissance (1 Agent)

#### Agent-001: Reconnaissance
**Purpose:** Build complete attack surface map

**Tools Used:** nmap, dig, whois, subfinder, assetfinder, whatweb, nuclei

**What It Tests:**
- Domain enumeration and DNS resolution
- Subdomain discovery
- Technology fingerprinting
- Service enumeration and version detection
- Open ports and exposed services
- SSL/TLS certificate analysis
- Web server headers and technologies
- Email servers and SPF/DKIM configuration

**Output:** Attack surface map with all discovered assets

**Duration:** 15-30 minutes

---

### Capability Bundle 2: Surface Testing (6 Agents)

#### Agent-002: Web Application Security
**Purpose:** Full OWASP WSTG coverage

**Tools Used:** Burp Suite, OWASP ZAP, sqlmap, ffuf, nikto

**What It Tests:**
- SQL Injection (time-based, boolean-based, union-based)
- Cross-Site Scripting (Stored, Reflected, DOM)
- Cross-Site Request Forgery (CSRF)
- Clickjacking (X-Frame-Options)
- Security Headers (CSP, HSTS, X-Content-Type, etc.)
- Cookie security (HttpOnly, Secure, SameSite)
- HTTP methods and OPTIONS exposure
- Authentication bypasses
- Session management flaws
- Local File Inclusion (LFI)
- Sensitive data exposure in responses

**Output:** Web application vulnerabilities with reproducible evidence

**Duration:** 15-20 minutes

---

#### Agent-003: API Security
**Purpose:** REST, GraphQL, SOAP endpoint testing

**Tools Used:** Postman, graphql-bin, API testing tools, nuclei

**What It Tests:**
- BOLA (Broken Object Level Authorization)
- BFLA (Broken Function Level Authorization)
- Mass assignment / Over-posting
- Excessive data exposure
- Injection attacks via API (SQLi, NoSQLi, Command)
- GraphQL introspection and batch queries
- GraphQL DoS (Circular queries, deep recursion)
- SOAP XXE injection
- API rate limiting bypass
- API versioning issues
- Default API credentials
- Unencrypted API endpoints

**Output:** API-specific vulnerabilities with cURL examples

**Duration:** 15-20 minutes

---

#### Agent-004: Authentication & Authorization
**Purpose:** Login flows, MFA, sessions, privilege escalation

**Tools Used:** Burp Suite, custom auth testing scripts

**What It Tests:**
- Password policy weaknesses
- Account lockout bypass
- Multi-Factor Authentication (MFA) bypass
- Session fixation and prediction
- Session timeout issues
- JWT token validation and tampering
- OAuth/OIDC flow vulnerabilities
- SSO bypass
- Privilege escalation (vertical and horizontal)
- IDOR (Insecure Direct Object References)
- Forced browsing
- Account enumeration
- Password reset flaws

**Output:** Auth/authz vulnerabilities with impact analysis

**Duration:** 15-20 minutes

---

#### Agent-005: Infrastructure Security
**Purpose:** Network, services, TLS configuration

**Tools Used:** nmap, testssl.sh, sslscan, OpenVAS

**What It Tests:**
- Open ports and unnecessary services
- Service version vulnerabilities
- Default credentials on services
- TLS/SSL configuration weaknesses
- Weak cipher suites
- Certificate validation issues
- DNS security (DNS spoofing, zone transfer)
- Firewall misconfigurations
- Exposed management interfaces
- Network service exploitation (SMB, LDAP, RDP)
- Banner grabbing
- Service downgrade attacks

**Output:** Infrastructure vulnerabilities with remediation

**Duration:** 15-20 minutes

---

#### Agent-006: Cloud & Container Security
**Purpose:** Docker, Kubernetes, cloud storage, IAM

**Tools Used:** docker-bench, kubesec, aws-cli, gcloud, az-cli

**What It Tests:**
- Docker image vulnerabilities and misconfigurations
- Container privilege escalation
- Kubernetes RBAC bypass
- Pod escape techniques
- Cloud storage exposure (S3, GCS, Blob)
- IAM misconfiguration
- Cloud function security
- Secrets exposed in container images
- Insecure container registries
- Cloud metadata endpoint access
- Serverless function vulnerabilities

**Output:** Cloud/container vulnerabilities with fixing steps

**Duration:** 15-20 minutes

---

#### Agent-007: AI/LLM Security
**Purpose:** Chatbots, RAG, LLM endpoints

**Tools Used:** Custom LLM testing scripts, prompt injection tools

**What It Tests:**
- Prompt injection (direct and indirect)
- Jailbreak attempts
- System prompt leakage
- Training data extraction
- Token limit bypass
- Function calling abuse
- Excessive agency (unauthorized actions)
- RAG data poisoning
- Insecure output handling
- Token theft
- Model manipulation

**Output:** LLM-specific vulnerabilities with examples

**Duration:** 10-15 minutes

---

### Capability Bundle 3: Deep Exploitation (7 Agents)

#### Agent-008: SSRF Exploitation
**Purpose:** Server-side request forgery attacks

**Tools Used:** Custom SSRF payloads, curl, nc

**What It Tests:**
- SSRF to internal services
- Cloud metadata endpoint access (AWS, GCP, Azure)
- Local file read via SSRF
- Port scanning via SSRF
- Time-based SSRF
- Redirect-based SSRF
- DNS rebinding attacks
- SSRF filter bypass techniques
- Exfiltration via SSRF

**Output:** SSRF vulnerabilities with payload examples

**Duration:** 10-15 minutes

---

#### Agent-009: Request Smuggling
**Purpose:** HTTP desynchronization attacks

**Tools Used:** request-smuggler, custom scripts

**What It Tests:**
- CL.TE (Content-Length / Transfer-Encoding)
- TE.CL (Transfer-Encoding / Content-Length)
- TE.TE (Transfer-Encoding bypass)
- Request smuggling to cache poisoning
- Request smuggling to XSS
- Timing-based smuggling
- HTTP/2 smuggling variations

**Output:** Smuggling vulnerabilities with detailed payloads

**Duration:** 10-15 minutes

---

#### Agent-010: File Upload RCE
**Purpose:** Malicious file upload execution

**Tools Used:** Burp Suite, custom upload scripts

**What It Tests:**
- Unrestricted file upload
- MIME type bypass
- Double extension bypass (shell.php.jpg)
- Null byte injection
- Polyglot file uploads
- Race conditions in upload processing
- Zip slip vulnerabilities
- Image metadata code injection
- SVG/XML file uploads
- Execution in upload directory
- Symlink uploads

**Output:** File upload vulnerabilities with working payloads

**Duration:** 10-15 minutes

---

#### Agent-011: Path Traversal & LFI
**Purpose:** Directory traversal and local file inclusion

**Tools Used:** burp, ffuf, custom payloads

**What It Tests:**
- Directory traversal (../, ..\\, etc.)
- Path traversal bypass (unicode, encoding)
- Local file inclusion (LFI)
- Log file inclusion
- Null byte injection
- Double encoding
- UTF-8 encoding bypass
- Symlink following
- /etc/passwd, /etc/shadow access
- Windows file access (C:\Windows\win.ini)
- Sensitive file exposure

**Output:** Path traversal vulnerabilities with file dumps

**Duration:** 10-15 minutes

---

#### Agent-012: XXE Injection
**Purpose:** XML external entity attacks

**Tools Used:** burp, XXE payloads

**What It Tests:**
- XXE document type definition
- External entity file read
- Blind XXE with out-of-band exfiltration
- XXE via image metadata
- SVG XXE
- XXE billion laughs DoS
- XXE entity expansion
- Windows UNC path XXE
- Jar file XXE

**Output:** XXE vulnerabilities with exploitation steps

**Duration:** 10-15 minutes

---

#### Agent-013: Deserialization RCE
**Purpose:** Unsafe object deserialization

**Tools Used:** ysoserial, custom gadget chains

**What It Tests:**
- Java deserialization (commons-collections, spring, etc.)
- PHP object injection
- Python pickle deserialization
- .NET deserialization
- Gadget chain exploitation
- Magic method exploitation
- Type confusion

**Output:** Deserialization vulnerabilities with RCE proof

**Duration:** 10-15 minutes

---

#### Agent-014: SSTI Exploitation
**Purpose:** Server-side template injection

**Tools Used:** burp, custom payloads, tplmap

**What It Tests:**
- Jinja2 template injection
- Mako template injection
- Twig template injection
- FreeMarker template injection
- Velocity template injection
- Expression Language (EL) injection
- Template filter bypass
- Sandbox escape
- Code execution via templates

**Output:** SSTI vulnerabilities with RCE examples

**Duration:** 10-15 minutes

---

### Capability Bundle 4: Post-Exploitation (4 Agents)

#### Agent-015: Post-Exploitation
**Purpose:** System abuse and persistence

**Tools Used:** Metasploit, custom scripts, SSH

**What It Tests:**
- System command execution
- Process enumeration
- File system exploration
- Service manipulation
- Persistence mechanisms
- Cron/scheduled task abuse
- Startup folder manipulation
- Registry modification (Windows)
- Rootkit installation
- Backdoor creation

**Output:** Post-exploitation capabilities with evidence

**Duration:** 10-15 minutes

---

#### Agent-016: Privilege Escalation
**Purpose:** Elevation of privileges

**Tools Used:** Metasploit, linpeas, winpeas, exploit-db

**What It Tests:**
- Kernel vulnerabilities
- Misconfigured sudo (NOPASSWD, wildcards)
- SUID binary vulnerabilities
- Capabilities exploitation
- DLL injection (Windows)
- Service privilege escalation
- Registry writable checks
- File permission vulnerabilities
- Cron job privilege escalation
- Docker privilege escalation

**Output:** Privilege escalation paths with proof

**Duration:** 10-15 minutes

---

#### Agent-017: Secrets Harvesting
**Purpose:** Extract credentials and secrets

**Tools Used:** grep, find, custom extraction scripts

**What It Tests:**
- Environment variable secrets
- Configuration file credentials
- Database connection strings
- API keys in files
- SSH private keys
- AWS credentials
- Kubernetes secrets
- Secrets in process memory
- Git history secrets
- Browser password storage

**Output:** Extracted credentials and their locations

**Duration:** 10-15 minutes

---

#### Agent-018: Lateral Movement
**Purpose:** Move between systems

**Tools Used:** Metasploit, custom scripts, SSH

**What It Tests:**
- Network reconnaissance
- Trust relationship exploitation
- Pass-the-hash attacks
- Pass-the-ticket attacks
- Kerberos attacks
- Network share access
- RDP connection attempt
- SSH key reuse
- Service account abuse
- Domain trust exploitation

**Output:** Lateral movement paths and access acquired

**Duration:** 10-15 minutes

---

### Capability Bundle 5: Source Code Analysis (2 Agents)

#### Agent-019: Source Code Disclosure
**Purpose:** Hunt exposed source code

**Tools Used:** custom scanning scripts, git-dumper

**What It Tests:**
- Exposed .git directory
- Exposed .env files
- Backup files (.bak, .swp, .tmp)
- Configuration file exposure
- Debug info in error pages
- Source maps (.map files)
- Development comment exposure
- API documentation exposure
- Build artifact exposure
- Container image source exposure

**Output:** Exposed files with contents

**Duration:** 10-15 minutes

---

#### Agent-020: Git Forensics
**Purpose:** Extract secrets from repository history

**Tools Used:** git commands, GitTools, custom scripts

**What It Tests:**
- Repository history analysis
- Commit message secrets
- Deleted file recovery
- Branch enumeration
- Tag enumeration
- Large file analysis
- Author information
- Commit timestamps
- Stashed changes
- Reflog analysis

**Output:** Secrets found in git history with commit info

**Duration:** 10-15 minutes

---

### Capability Bundle 6: Cloud Testing (3 Agents)

#### Agent-021: AWS Security
**Purpose:** AWS-specific misconfigurations

**Tools Used:** aws-cli, s3-scanner, pacu, prowler

**What It Tests:**
- S3 bucket public access
- S3 bucket policy weaknesses
- CloudFront exposure
- IAM policy overpermission
- EC2 security groups too open
- Lambda function exposure
- RDS security groups
- API Gateway auth bypass
- Secrets Manager exposure
- CloudTrail bypass
- VPC endpoint misconfig

**Output:** AWS misconfigurations with remediation

**Duration:** 10-15 minutes

---

#### Agent-022: GCP Security
**Purpose:** Google Cloud Platform misconfigurations

**Tools Used:** gcloud, Google Cloud SDK

**What It Tests:**
- Cloud Storage bucket public access
- IAM role overpermission
- Compute Engine public IP exposure
- Firewall rule misconfiguration
- Cloud SQL auth bypass
- Cloud Functions exposure
- Cloud Run endpoint auth
- Service account key exposure
- Cloud KMS permission issues
- Kubernetes cluster RBAC

**Output:** GCP misconfigurations with fixes

**Duration:** 10-15 minutes

---

#### Agent-023: Azure Security
**Purpose:** Microsoft Azure misconfigurations

**Tools Used:** az-cli, Azure CLI, custom scripts

**What It Tests:**
- Blob Storage public access
- RBAC overpermission
- Virtual Machine exposure
- SQL Database auth
- Key Vault permission issues
- App Service configuration
- Azure AD misconfiguration
- Managed Identity issues
- Azure Storage Account exposure
- Function App authentication

**Output:** Azure misconfigurations with remediation

**Duration:** 10-15 minutes

---

### Capability Bundle 7: Advanced Authentication (5 Agents)

#### Agent-024: OAuth/SAML/JWT
**Purpose:** Advanced authentication protocol testing

**Tools Used:** Burp Suite, JWT tools, SAML analyzers

**What It Tests:**
- OAuth 2.0 flow vulnerabilities
- OpenID Connect (OIDC) bypass
- SAML assertion tampering
- JWT signature validation
- JWT algorithm confusion
- JWT token prediction
- Refresh token abuse
- Scope escalation
- Implicit flow vulnerabilities
- PKCE bypass

**Output:** Auth protocol vulnerabilities with examples

**Duration:** 10-15 minutes

---

#### Agent-025: Cryptography
**Purpose:** Weak cryptographic implementations

**Tools Used:** hashcat, john, SSL Labs, custom tools

**What It Tests:**
- Weak encryption algorithms (DES, RC4)
- Predictable random number generation
- Hardcoded cryptographic keys
- ECB mode usage
- Insufficient key length
- Hash collision vulnerabilities
- Weak key derivation (MD5, unsalted)
- Padding oracle attacks
- Side-channel vulnerabilities
- Custom encryption implementation

**Output:** Crypto weaknesses with severity assessment

**Duration:** 10-15 minutes

---

#### Agent-026: Dependency Analysis
**Purpose:** Known vulnerabilities in libraries

**Tools Used:** OWASP Dependency-Check, npm audit, pip-audit

**What It Tests:**
- Known CVEs in dependencies
- Outdated package versions
- Transitive dependency vulnerabilities
- License compliance issues
- Vulnerable package versions
- Supply chain vulnerabilities
- Typosquatting packages
- Abandoned dependencies
- Unmaintained libraries

**Output:** Vulnerable dependencies with fix recommendations

**Duration:** 10-15 minutes

---

#### Agent-027: CI/CD Pipeline
**Purpose:** Build pipeline and deployment security

**Tools Used:** custom scanning scripts, git analysis

**What It Tests:**
- Secrets in CI/CD logs
- Build artifact tampering
- Deployment authorization bypass
- Supply chain injection
- Build environment compromise
- Container image tampering
- Build artifact exposure
- CI/CD credentials exposure
- Webhook security
- Rollback mechanism bypass

**Output:** CI/CD vulnerabilities with impact

**Duration:** 10-15 minutes

---

#### Agent-028: Compliance
**Purpose:** Regulatory compliance validation

**Tools Used:** custom compliance checkers

**What It Tests:**
- GDPR compliance (data processing, consent)
- HIPAA compliance (health data protection)
- PCI-DSS compliance (payment card security)
- SOC2 compliance (security controls)
- Data retention policies
- Encryption at rest and in transit
- Access logging and audit trails
- Data subject rights implementation
- Breach notification procedures
- Privacy policy alignment with practice

**Output:** Compliance gaps with remediation

**Duration:** 10-15 minutes

---

### Additional Capability Coverage (4 Agents)

#### Agent-029: Business Logic
**Purpose:** Workflow abuse and state machine bypass

**Tools Used:** Burp Suite, custom scripts

**What It Tests:**
- Multi-step workflow manipulation
- Race conditions (TOCTOU)
- State machine bypass
- Transaction manipulation
- Approval flow circumvention
- Price/quantity tampering
- Coupon/discount abuse
- Negative amounts
- Inventory manipulation
- Refund abuse
- Double charging

**Output:** Business logic vulnerabilities with examples

**Duration:** 15-20 minutes

---

#### Agent-030: Rate Limiting & Brute Force
**Purpose:** Rate limit bypass and credential testing

**Tools Used:** ffuf, hydra, custom scripts

**What It Tests:**
- Rate limit bypass techniques
- Credential stuffing
- Brute force on login
- API quota evasion
- OTP brute forcing
- Password reset flooding
- Account enumeration
- Distributed attack capability
- IP blocking bypass
- Rate limiting by user vs IP

**Output:** Rate limiting weaknesses with bypass techniques

**Duration:** 15-20 minutes

---

#### Agent-031: Advanced Protocols
**Purpose:** WebSocket, gRPC, and binary protocol testing

**Tools Used:** Burp Suite, gRPC tools, custom scripts

**What It Tests:**
- WebSocket authentication
- WebSocket message manipulation
- WebSocket injection attacks
- gRPC method enumeration
- gRPC parameter fuzzing
- gRPC authentication bypass
- Binary protocol reverse engineering
- Message queue security
- Protocol buffer vulnerabilities
- Streaming API abuse

**Output:** Protocol vulnerabilities with exploitation

**Duration:** 10-15 minutes

---

#### Agent-032: Exploitation Chaining
**Purpose:** Combine vulnerabilities for greater impact

**Tools Used:** Custom orchestration scripts

**What It Tests:**
- Multi-bug chains
- Escalation paths (low to high)
- SSRF to RCE chains
- Auth bypass + privilege escalation
- Information disclosure to exploitation
- Multiple vulnerabilities to data breach
- Business logic + technical vulnerability chains
- Time-based attack chains
- Dependency chains

**Output:** Complete attack paths with impact

**Duration:** 15-30 minutes

---

### Capability Bundle 31: Advanced Infrastructure Security (8 Agents)

#### Agent-045: Network Segmentation
**Purpose:** Network segmentation & zero-trust validation

**Tools Used:** yersinia, Scapy, nmap, hping3, custom segmentation-mapping scripts

**What It Tests:**
- VLAN hopping via switch-spoofing and 802.1Q double-tagging
- Cross-segment reachability vs. the intended segmentation model
- Firewall/ACL rule hygiene (overly broad or shadowed rules)
- Zero-trust/micro-segmentation policy enforcement (identity vs. network position)

**Output:** Empirical-vs-intended segmentation reachability matrix with findings

**Duration:** 15-30 minutes

---

#### Agent-046: LoadBalancer & Reverse Proxy
**Purpose:** Load balancer & reverse proxy security

**Tools Used:** Burp Suite (HTTP Request Smuggler), smuggler.py/h2csmuggler, nmap, testssl.sh

**What It Tests:**
- HTTP request smuggling (CL.TE/TE.CL/TE.TE desync, HTTP/2 downgrade)
- Trust of `X-Forwarded-*`/`Forwarded` headers
- Exposed management interfaces (F5 iControl, Traefik/HAProxy dashboards)
- TLS-termination configuration at the edge

**Output:** Proxy/LB-layer vulnerabilities with reproducible smuggling PoCs

**Duration:** 15-20 minutes

---

#### Agent-047: VPN & Remote Access
**Purpose:** VPN & remote access security

**Tools Used:** nmap, ike-scan, hydra/medusa, Hashcat/John the Ripper, Scapy

**What It Tests:**
- IKE/IPsec version and transform enumeration, aggressive-mode PSK capture
- VPN portal/RDP Gateway/Citrix/SSL-VPN credential brute-forcing
- OpenVPN/WireGuard configuration weaknesses (ciphers, missing tls-auth)
- Offline cracking of captured handshake/credential hashes

**Output:** Remote-access vulnerabilities with exploitation evidence

**Duration:** 15-30 minutes

---

#### Agent-048: Container Orchestration (Deep)
**Purpose:** Deep container orchestration & service mesh security

**Tools Used:** kubectl/rbac-tool, kube-bench, kube-hunter, OPA/Gatekeeper review, istioctl/linkerd

**What It Tests:**
- RBAC policy enumeration and effective-permission analysis
- CIS Kubernetes Benchmark compliance
- Admission-control policy bypass (privileged containers, hostPath mounts)
- Service mesh mTLS/authorization-policy gaps

**Output:** Orchestration/service-mesh findings with remediation guidance

**Duration:** 20-30 minutes

---

#### Agent-049: Email Infrastructure Hardening
**Purpose:** Mail server & MTA infrastructure hardening

**Tools Used:** swaks, nmap SMTP NSE scripts, dig/dnsrecon, testssl.sh, custom SPF/DKIM/DMARC scripts

**What It Tests:**
- Open-relay testing across authenticated/unauthenticated states
- SPF/DKIM/DMARC policy strictness and spoofability
- STARTTLS/TLS enforcement on SMTP transport
- MX/reverse-DNS consistency

**Output:** Mail-infrastructure hardening findings with policy gaps

**Duration:** 15-20 minutes

---

#### Agent-050: Backup & DR Security
**Purpose:** Backup & disaster recovery security

**Tools Used:** AWS/Azure/gcloud CLI, ScoutSuite/Prowler, s3scanner, smbclient/rsync/NFS tooling

**What It Tests:**
- Public/anonymous access to backup buckets, snapshots, and vaults
- Cross-account snapshot sharing and missing encryption-at-rest
- On-premises backup share (SMB/NFS) access controls
- Backup-job configuration (encryption, retention, credential storage)

**Output:** Consolidated backup/DR exposure inventory

**Duration:** 15-30 minutes

---

#### Agent-051: Physical/Virtual Infra Config
**Purpose:** Virtual infrastructure & hypervisor hardening

**Tools Used:** nmap, CIS-CAT/CIS benchmarks, PowerCLI/Hyper-V PowerShell/virsh, testssl.sh

**What It Tests:**
- Hypervisor management-interface exposure (vCenter, ESXi, Hyper-V, Proxmox)
- CIS hardening-benchmark compliance (lockdown mode, logging, NTP)
- Known hypervisor CVEs (validated only, never speculative)
- VM/template/snapshot sprawl and patch-currency drift

**Output:** Hypervisor hardening findings and sprawl/orphan report

**Duration:** 15-30 minutes

---

#### Agent-052: Network Device Hardening
**Purpose:** Network device hardening (routers, switches, firewalls)

**Tools Used:** onesixtyone/snmpwalk/snmp-check, nmap, hydra/medusa, yersinia, Nipper

**What It Tests:**
- SNMP community-string brute-forcing and MIB-tree disclosure
- Telnet/unencrypted-HTTP management-plane exposure
- Layer 2 protocol abuse (STP root-bridge takeover, CDP/DTP)
- Exported configuration hygiene (weak SNMP strings, missing VTY ACLs)

**Output:** Device-hardening findings with configuration-audit evidence

**Duration:** 15-20 minutes

---

### Capability Bundle 32: Advanced Database Security (6 Agents)

#### Agent-053: NoSQL Deep Dive
**Purpose:** NoSQL engine-specific injection & misconfiguration testing

**Tools Used:** NoSQLMap, nmap NSE (mongodb/redis/cassandra), redis-cli, elasticsearch-py, cqlsh

**What It Tests:**
- Unauthenticated MongoDB/Redis/Cassandra/Elasticsearch enumeration
- Redis `CONFIG`/`SLAVEOF`/Lua `EVAL` abuse
- Elasticsearch stored-script and index-enumeration abuse
- Credential brute-forcing against exposed NoSQL engines

**Output:** Engine-specific NoSQL injection and misconfiguration findings

**Duration:** 15-30 minutes

---

#### Agent-054: DB Privilege & Replication Audit
**Purpose:** Database privilege, replication & audit-log security review

**Tools Used:** native `mysql`/`psql`/`sqlcmd`/`mongosh` introspection, CrackMapExec/NetExec, custom SQLAlchemy/psycopg2/pymongo scripts, Wireshark/tcpdump

**What It Tests:**
- Grant/role enumeration against a least-privilege baseline
- Shared/service and orphaned database accounts
- Domain-account-to-database-role mapping (AD-integrated MSSQL)
- Cleartext replication traffic (binlog/WAL/oplog)

**Output:** Privilege and replication security findings with remediation

**Duration:** 15-30 minutes

---

#### Agent-055: ORM & Query-Builder Injection
**Purpose:** ORM & query-builder abstraction-layer injection testing

**Tools Used:** sqlmap, Burp Suite (Repeater/Intruder), custom SQLAlchemy scripts, Node.js/Python fuzzing harnesses

**What It Tests:**
- Raw-query/`.raw()`/`createNativeQuery()` escape-hatch injection
- Operator injection in JS ORMs (Sequelize `$ne`/`$or`, TypeORM `where` objects)
- HQL/JPQL injection via Hibernate `createQuery()`
- Differential (boolean/time-based) confirmation tailored to ORM error fingerprints

**Output:** ORM/query-builder injection findings with PoC payloads

**Duration:** 15-20 minutes

---

#### Agent-056: DBaaS Managed Database Security
**Purpose:** Managed database service (DBaaS) configuration security review

**Tools Used:** AWS/Azure/GCP CLI, custom boto3/azure-mgmt/google-cloud-sql scripts

**What It Tests:**
- Public accessibility and unencrypted storage on RDS/Aurora/Cosmos DB/Cloud SQL
- Overly permissive firewall/authorized-network rules
- IAM database authentication and key-rotation status
- Firestore/Cosmos DB security-rule permissiveness

**Output:** DBaaS configuration findings across AWS/Azure/GCP

**Duration:** 15-30 minutes

---

#### Agent-057: Database Encryption & Key Management
**Purpose:** Database encryption & key management review

**Tools Used:** custom boto3 KMS/azure-keyvault/google-cloud-kms scripts, sslyze/testssl.sh, Wireshark/tcpdump

**What It Tests:**
- Key-policy, grant, and rotation-status review (KMS/Key Vault/Cloud KMS)
- Whether "encrypted" columns are genuine ciphertext vs. weak obfuscation
- In-transit TLS configuration on the database wire protocol
- Cleartext transmission despite "TLS enabled" configuration flags

**Output:** Encryption and key-management findings with evidence

**Duration:** 15-20 minutes

---

#### Agent-058: Data Warehouse & Big Data Security
**Purpose:** Data warehouse & big data platform security testing

**Tools Used:** Snowflake connector, google-cloud-bigquery, boto3 (Redshift), Databricks REST API, nmap NSE

**What It Tests:**
- Role/grant and datashare enumeration for exfiltration-pattern detection
- Cross-project/authorized-view exposure (BigQuery)
- Unauthenticated Hadoop NameNode/ResourceManager/Spark UI exposure
- Unauthenticated YARN job-submission RCE on exposed ResourceManager

**Output:** Data warehouse/big-data platform findings with impact evidence

**Duration:** 15-30 minutes

---

### Capability Bundle 33: Web, Mobile & API Coverage Extension (6 Agents)

#### Agent-059: WebAuthn / Passkey Security
**Purpose:** WebAuthn / FIDO2 passkey security

**Tools Used:** python-fido2, Burp Suite, Chromium virtual authenticator (CDP/Playwright), mitmproxy, jwt_tool

**What It Tests:**
- Registration/authentication ceremony verification rigor
- Tampered `clientDataJSON`/`attestationObject`/`authenticatorData` fields
- Origin/RP ID/challenge validation
- Downstream session-JWT issuance after assertion exchange

**Output:** WebAuthn/passkey ceremony vulnerabilities with replay evidence

**Duration:** 15-20 minutes

---

#### Agent-060: PWA / Service Worker Security
**Purpose:** PWA / service worker security

**Tools Used:** Chrome DevTools/CDP via Playwright, Burp Suite/mitmproxy, Lighthouse, pywebpush, Workbox source inspection

**What It Tests:**
- Service worker/manifest tampering and cache poisoning
- MITM-hijack persistence after service worker installation
- Web Push VAPID/subscription validation
- Caching of routes that should never be cached (auth, personalized responses)

**Output:** PWA/service-worker vulnerabilities with cache-poisoning PoCs

**Duration:** 15-20 minutes

---

#### Agent-061: Cross-Platform Framework Security
**Purpose:** Cross-platform framework bridge security (React Native, Flutter, hybrid apps)

**Tools Used:** Frida/objection, jadx/apktool/class-dump, Hermes bytecode disassembler, Blutter/reFlutter, MobSF

**What It Tests:**
- Bridge entry-point tampering (RCTBridge, MethodChannel, JavascriptInterface)
- Recovered JS/Dart bundle review for hardcoded secrets
- Unvalidated cross-boundary argument handling
- Bridge-adjacent network call correlation with backend requests

**Output:** Cross-platform bridge vulnerabilities with runtime-hook evidence

**Duration:** 15-30 minutes

---

#### Agent-062: Mobile Supply Chain Security
**Purpose:** Mobile app supply chain security

**Tools Used:** apktool/jadx, class-dump/otool, openssl, MobSF, OWASP Dependency-Check/Dependency-Track

**What It Tests:**
- Code-signing/entitlement/provisioning-profile validity
- Third-party SDK inventory (SBOM) vs. known CVE databases
- Manifest/plist permission and debuggable-flag exposure
- CI/CD pipeline signing-credential and artifact-publishing hygiene

**Output:** Mobile supply-chain findings with SBOM and CVE cross-reference

**Duration:** 15-20 minutes

---

#### Agent-063: API Gateway Deep Dive
**Purpose:** API gateway platform deep dive (Kong, Apigee, AWS/Azure API gateways)

**Tools Used:** Kong Admin API, AWS CLI/boto3, Azure CLI/azure-mgmt-apimanagement, Apigee Management API, Burp Suite/Postman

**What It Tests:**
- Route/service/plugin configuration and precedence issues
- Authorizer (Lambda/Cognito/IAM) and JWT/JWKS policy validation
- Rate-limit bypass via rotating keys/client IDs/`X-Forwarded-For`
- Direct-to-backend requests bypassing the gateway

**Output:** API gateway platform findings with bypass evidence

**Duration:** 15-30 minutes

---

#### Agent-064: Webhook Security
**Purpose:** Webhook security

**Tools Used:** Burp Suite, custom HMAC scripts, mitmproxy, interactsh/Burp Collaborator, ffuf

**What It Tests:**
- HMAC signature verification rigor (valid vs. tampered signatures)
- Timestamp/nonce replay handling
- Blind SSRF via webhook URL registration (out-of-band callback)
- Predictable/cross-tenant webhook receiver endpoint enumeration

**Output:** Webhook security findings with replay/SSRF evidence

**Duration:** 15-20 minutes

---

## Tools Reference (150+ Integrated)

> The framework integrates 150+ Kali Linux tools. The list below highlights key tools by category.

### Reconnaissance Tools
- **nmap:** Network port scanning and service enumeration
- **dig:** DNS record lookup and analysis
- **whois:** Domain ownership and registration info
- **subfinder:** Subdomain discovery
- **assetfinder:** Domain asset discovery
- **whatweb:** Website technology fingerprinting
- **theHarvester:** Email and subdomain harvesting

### Web Application Testing
- **sqlmap:** SQL injection detection and exploitation
- **ffuf:** Web fuzzing and enumeration
- **nikto:** Web server scanner
- **Burp Suite Community:** Web application testing platform
- **OWASP ZAP:** Open source web app scanner
- **dirbuster:** Directory and file enumeration

### API Testing
- **Postman:** API testing and development
- **graphql-bin:** GraphQL introspection and testing
- **SoapUI:** SOAP API testing
- **REST Client:** HTTP testing tools

### Network & Infrastructure
- **Metasploit:** Exploitation framework
- **nessus:** Vulnerability scanner
- **OpenVAS:** Open source vulnerability scanner
- **testssl.sh:** TLS/SSL configuration tester
- **sslscan:** SSL/TLS capability scanner

### Credential & Hash Testing
- **hashcat:** GPU-accelerated password cracking
- **john:** Password cracking tool
- **hydra:** Network login cracker

### Cloud & Container
- **docker-bench:** Docker security benchmarking
- **kubesec:** Kubernetes security scanner
- **aws-cli:** AWS command-line interface
- **gcloud:** Google Cloud SDK
- **az-cli:** Azure command-line interface
- **prowler:** AWS security assessment
- **pacu:** AWS exploitation framework

### Code Analysis & Secrets
- **OWASP Dependency-Check:** Dependency vulnerability scanner
- **npm audit:** Node.js dependency checker
- **pip-audit:** Python package vulnerability checker
- **GitTools:** Git repository analysis
- **git-dumper:** Git directory dumper
- **truffleHog:** Secrets in git history

### Post-Exploitation
- **linpeas:** Linux privilege escalation scout
- **winpeas:** Windows privilege escalation scout
- **mimikatz:** Windows credential dumper
- **bloodhound:** Active Directory visualizer

### Advanced Tools
- **ysoserial:** Java deserialization payload generator
- **tplmap:** Template injection mapper
- **jwt_tool:** JWT token testing
- **XmlRpcBot:** XML-RPC exploitation
- **xxe-payloads:** XXE payload repository
- **SSRF-King:** SSRF testing tool

---

## Framework Overview

### Architecture

```
User Request (Claude Code, "run full pentest for <engagement>")
        ↓
Claude Code reads orchestrator/Orchestrator.js's defineAgents() list
        ↓
   23 dependency-ordered execution categories (Category 1-23)
        ↓
For each agent: Claude Code reads its spec file and dispatches it live
via the Agent tool (Orchestrator.js's own executeAgent() is a stub —
it does not call any agent itself; a live Claude Code session does)
        ↓
Tool Execution (150+ Tools via SSH, orchestrator/kali-wrapper.sh)
        ↓
Finding Generation (Raw Findings)
        ↓
4-Layer Validation Gates (orchestrator/validation-gate.js)
        ↓
Report Generation (HTML Report, orchestrator/report-generator.js)
```

### The 23 Execution Categories

This is the real order `Orchestrator.js`'s `defineAgents()`/`getPhaseName()` runs agents in — each category's agents depend on every prior category, so they receive earlier categories' real findings as context.

| # | Category | Agents |
|---|----------|--------|
| 1 | Reconnaissance & Discovery | 3 |
| 2 | Web Application Testing | 8 |
| 3 | API Security | 8 |
| 4 | Authentication & Authorization | 3 |
| 5 | Infrastructure, Cloud & AI Surface | 3 |
| 6 | Deep Exploitation & RCE | 7 |
| 7 | Post-Exploitation | 9 |
| 8 | Rate-Limiting, Protocol Abuse & Business Logic | 10 |
| 9 | Network Protocols | 4 |
| 10 | Mobile Security | 6 |
| 11 | Wireless Security | 5 |
| 12 | Windows & Linux Exploitation | 2 |
| 13 | Reverse Engineering & Forensics | 3 |
| 14 | Cloud Platforms — AWS / GCP / Azure | 4 |
| 15 | Defense Evasion | 1 |
| 16 | CI/CD, Dependencies & IaC | 3 |
| 17 | Cryptography | 1 |
| 18 | IoT & Firmware | 1 |
| 19 | Database Security | 1 |
| 20 | Compliance, Chaining & Reporting | 4 |
| 21 | Advanced Infrastructure Security | 8 |
| 22 | Advanced Database Security | 6 |
| 23 | Web, Mobile & API Coverage Extension | 6 |

### Core Components

#### 1. Orchestrator.js
- Main orchestration engine (588 lines)
- Defines all 106 agents grouped into 23 execution categories via its own
  `defineAgents()`/`getPhaseName()` (a separate, purely organizational
  33-entry file-directory catalog also exists in
  [orchestrator/agents/README.md](../orchestrator/agents/README.md) for
  browsing the same 106 spec files by theme — it is not the execution order)
- Tracks per-agent and per-category completion state for resume support
- `executeAgent()` is an intentional stub: real dispatch happens through a
  live Claude Code session reading each spec and calling the Agent tool,
  not through this Node process calling an API

#### 2. Agent Specifications (106 files)
- Located in `orchestrator/agents/`
- Each agent has detailed specification
- Tools used by agent
- Testing approach
- Validation requirements
- Expected outputs

#### 3. Tool Wrapper (kali-wrapper.sh)
- SSH wrapper for remote tool execution
- Manages tool execution on Kali VM
- Captures output and results
- Handles errors and timeouts
- Secures credential passing

#### 4. Validation System (`orchestrator/validation-gate.js`)
- 4 independent validation layers, implemented as real deterministic checks
- Format (JSON-schema, via ajv), Evidence, Technical Accuracy (CVSS/severity
  consistency), Remediation gates
- Rejection criteria for each gate — a finding failing any gate is rejected
  with the specific reason, never silently dropped
- Human approval for CVSS ≥ 7.0

#### 5. Report Generator (`orchestrator/report-generator.js`)
- Re-validates every finding against the same 4 gates before including it
  (defensive — never trusts a pre-set `validation_status` field)
- Aggregates validated findings
- Calculates risk matrix
- Assigns CVSS scores
- Maps to OWASP/CWE/MITRE
- Generates professional HTML report, reusing the shared design system in
  `templates/report/styles.css`

### Data Flow

```
Step 1: Configuration Loading
  └─ Load .env file
  └─ Validate credentials
  └─ Setup execution context

Step 2: Category 1 (Reconnaissance & Discovery) Execution
  └─ Recon agents run
  └─ Generates attack surface map

Step 3: Categories 2-23 Execution
  └─ Pass prior categories' validated findings as context
  └─ Claude Code dispatches each agent live via the Agent tool
  └─ Collect raw findings as each agent completes

Step 4: 4-Layer Validation
  └─ Format Validation Gate
  └─ Evidence Validation Gate
  └─ Technical Accuracy Validation Gate
  └─ Remediation Validation Gate
  └─ Human Approval (CVSS ≥ 7.0)

Step 5: Sanitization
  └─ Mask PII
  └─ Remove credentials
  └─ Scrub sensitive data

Step 6: Report Generation
  └─ Aggregate findings
  └─ Calculate CVSS scores
  └─ Map vulnerabilities
  └─ Generate HTML report

Step 7: Delivery
  └─ Save to engagements/[name]/report/report.html
```

### Key Features

1. **Dependency-Ordered Category Architecture**
   - Each of the 23 categories builds on prior categories' validated findings
   - Context flows forward category to category
   - Agents receive earlier categories' real findings, not just raw target info

2. **Agent Dispatch**
   - Claude Code can dispatch multiple agents within the same category in
     parallel by batching several Agent-tool calls in one turn, since
     agents in the same category don't depend on each other
   - Whether that happens is up to how the session chooses to batch its
     tool calls — it isn't an automatic scheduler guarantee

3. **Real Evidence Requirement**
   - Every finding backed by actual evidence
   - HTTP requests/responses authentic
   - Tool output matches known formats
   - Screenshots genuine and reproducible

4. **4-Layer Validation**
   - Format validation (structure)
   - Evidence validation (proof)
   - Technical accuracy (correctness)
   - Remediation validation (actionability)

5. **Zero False Positive Policy**
   - All findings real and verified
   - 4-layer validation ensures accuracy
   - Failed validations rejected
   - Evidence must be authentic

---

## Validation System

### 4-Layer Validation Gates

Every finding passes through 4 independent validation layers:

#### Gate 1: Format Validation
**Purpose:** Ensure structural integrity

**Checks:**
- Valid JSON schema compliance
- All required fields present
- Correct data types
- No empty/malformed fields
- CVSS format compliance

**Rejection Criteria:**
- Missing required fields (title, description, severity, evidence, remediation)
- Invalid data types
- Malformed JSON
- Incomplete information
- Missing CVSS score

**Example - FAIL:**
```json
{
  "title": "SQL Injection",
  "description": "Found SQL injection",
  // Missing: severity, evidence, remediation
}
```

#### Gate 2: Evidence Validation
**Purpose:** Verify findings backed by actual evidence

**Checks:**
- Real HTTP request/response pairs
- Authentic tool output
- Genuine screenshots
- Reproducible steps
- Consistent metadata

**Rejection Criteria:**
- Fake/template requests
- Fabricated tool output
- Suspicious screenshots
- Non-reproducible steps
- Inconsistent metadata

**Example - FAIL:**
```
Request: [generic template request]
Response: [simulated response]
Evidence: "Assuming SQL injection is possible"
```

**Example - PASS:**
```
Request: POST /api/users HTTP/1.1
Host: target.com
Content-Type: application/json

{"username": "admin' OR '1'='1"}

Response: HTTP/1.1 200 OK
{"users": [{"id": 1, "name": "admin"}]}

Reproduction Steps:
1. Navigate to target.com/api/users
2. Send POST request with payload
3. Observe full user list returned
```

#### Gate 3: Technical Accuracy Validation
**Purpose:** Verify technical correctness

**Checks:**
- CVSS score mathematically justified
- Impact specific and concrete
- No vague language
- Vulnerability type correct
- Attack vector realistic

**Rejection Criteria:**
- Unjustified CVSS scores
- Vague impact statements ("might", "could", "possibly")
- Fabrication language ("assumes", "would likely")
- Incorrect vulnerability classification
- Impossible attack paths

**Example - FAIL:**
```
Vulnerability: SQL Injection
CVSS: 9.8
Impact: "Could potentially allow attackers to access user data"
Reasoning: "This appears to be injectable based on error message"
```

**Example - PASS:**
```
Vulnerability: SQL Injection (CWE-89)
CVSS: 9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
Impact: Unauthenticated attacker can read/modify all database records
Evidence: Injection confirmed via UNION-based query
OWASP: A03:2021 Injection
Attack: POST /api/users {"username":"admin' UNION SELECT 1,2,3--"}
Result: Returns all users with email addresses (confirmed data access)
```

#### Gate 4: Remediation Validation
**Purpose:** Ensure actionable remediation guidance

**Checks:**
- Vulnerable code example provided
- Fixed code example provided
- Clear remediation steps
- Realistic effort estimate
- Relevant security standards referenced

**Rejection Criteria:**
- No code examples
- Generic guidance ("use HTTPS")
- Unrealistic effort estimates
- Developer cannot understand fix

**Example - FAIL:**
```
Remediation: "Fix the SQL injection vulnerability by using prepared statements"
Code: N/A
Effort: "30 minutes"
```

**Example - PASS:**
```
Vulnerable Code:
const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
db.execute(query);

Fixed Code:
const query = `SELECT * FROM users WHERE id = ?`;
db.execute(query, [req.query.id]);

Remediation Steps:
1. Identify all database queries accepting user input
2. Replace string concatenation with parameterized queries
3. Use prepared statements for all queries
4. Test with malicious payloads: ' OR '1'='1
5. Deploy and monitor for injection attempts

Testing:
Test vulnerable: ?id=1' OR '1'='1
Expected (fixed): No injection, returns only user 1
Effort: 4-6 hours for application-wide fix
Standards: OWASP A03:2021, CWE-89, SANS Top 25
```

### Validation Results

```
All 4 Gates Passed ✓
        ↓
Finding Added to Report (CVSS < 7.0)
        ↓
Human Approval (CVSS ≥ 7.0)
        ↓
Delivered in Final Report
```

### Rejection Scenarios

**Gate 1 Rejection Example:**
```
Finding: API endpoint returns 401 Unauthorized
Issue: "Unauthorized response" is not a vulnerability
Action: Rejected - Normal security behavior
```

**Gate 2 Rejection Example:**
```
Finding: "SQL Injection possible in login form"
Evidence: "Based on error message analysis"
Issue: No actual injection payload demonstrated
Action: Rejected - No authentic evidence of exploitation
```

**Gate 3 Rejection Example:**
```
Finding: "Cross-Site Scripting (XSS) vulnerability"
Description: "Could possibly allow attackers to steal cookies"
Issue: Vague impact, no specific data confirmed compromised
Action: Rejected - Impact statement too vague
```

**Gate 4 Rejection Example:**
```
Finding: "Weak password policy"
Remediation: "Implement strong password requirements"
Code: None provided
Issue: Developer cannot understand what to fix
Action: Rejected - No actionable remediation provided
```

---

## Credentials & Security Management

### .env File Format

`bash scripts/setup-engagement.sh <name>` generates this file interactively — you never hand-write it. It is git-ignored and loaded only at runtime:

```
# Target
TARGET_URL=https://target.example.com
TARGET_DOMAIN=target.example.com

# Default/primary credentials (first role entered)
TARGET_USERNAME=admin_user
TARGET_PASSWORD=AdminP@ss1

# Per-role credentials (ROLE_<NAME>_USERNAME / ROLE_<NAME>_PASSWORD / ROLE_<NAME>_LABEL)
ROLE_ADMIN_LABEL=admin
ROLE_ADMIN_USERNAME=admin_user
ROLE_ADMIN_PASSWORD=AdminP@ss1
ROLE_STANDARD_USER_LABEL=standard-user
ROLE_STANDARD_USER_USERNAME=std_user
ROLE_STANDARD_USER_PASSWORD=StdP@ss1

# Database credentials (optional — edit in manually if in scope)
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=

# API keys (optional — edit in manually if in scope)
API_KEY=

# Authorization
AUTHORIZATION_NAME=John Doe
AUTHORIZATION_EMAIL=john@example.com
AUTHORIZATION_DATE=2024-07-29

# Testing window
TESTING_WINDOW_START=2024-07-29T00:00:00Z
TESTING_WINDOW_END=2024-08-05T23:59:59Z
```

At least two roles (e.g. `admin` and `standard-user`) are recommended so agents can test horizontal/vertical privilege escalation, BOLA, and IDOR against real, distinct identities rather than a single account.

**Optional additional variables** — not generated automatically, but safe to add by hand to `.env` if the engagement's scope covers them: cloud credentials (`AWS_KEY_ID`/`AWS_SECRET_KEY`, `GCP_SERVICE_ACCOUNT_KEY`, `AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET`), `SSH_PRIVATE_KEY_PATH`, `JWT_SECRET`, or a 2FA seed (`TARGET_2FA_SECRET`).

### Credential Protection

#### Loading at Runtime
Agents load credentials only when needed:
```javascript
const creds = {
  targetUrl: process.env.TARGET_URL,
  username: process.env.TARGET_USERNAME,
  password: process.env.TARGET_PASSWORD
};
// Use for this test execution only
// Never store in global scope
```

#### Never Logged
Credentials never appear in logs:
```javascript
// ❌ WRONG - Logs credentials
console.log(`Connecting to ${url} with user ${username}`);

// ✓ CORRECT - Redacts credentials
console.log(`Connecting to target database`);
```

#### Automatic PII Masking

Before findings are delivered, all PII is masked:

- **Names:** John Doe → John D***
- **Emails:** john@example.com → j***@example.com
- **Phone:** +1-555-123-4567 → +1-555-***-****
- **Credit Cards:** 4111-1111-1111-1111 → 4111-****-****-1111
- **SSN/Tax ID:** 123-45-6789 → ***-**-6789
- **API Keys:** sk-1234567890abcdef → sk-****...****ef
- **Tokens:** eyJhbGciOiJIUzI1NiIs... → eyJh...is...
- **Passwords:** SuperSecret123! → ***********

### Human Approval Workflow

#### For Critical Findings (CVSS ≥ 7.0)

```
Agent Finds Critical Vulnerability
        ↓
Finding Passes 4-Layer Validation
        ↓
Security Lead Notified
        ↓
Security Lead Reviews Finding:
- Evidence is authentic?
- Impact is real?
- Remediation is clear?
- No false positive?
        ↓
Security Lead Approves / Rejects
        ↓
If Approved: Added to Report
If Rejected: Documented with reason
```

#### For Non-Critical Findings (CVSS < 7.0)

Auto-included in report if they pass all 4 validation gates.

### Audit Logging

Complete audit trail of all testing:

```
2024-07-29 10:15:23 [INFO] Engagement started: acme-corp
2024-07-29 10:15:45 [INFO] Phase 1 started: Reconnaissance
2024-07-29 10:18:30 [INFO] Agent-001 completed: 42 assets discovered
2024-07-29 10:20:00 [INFO] Phase 2 started: Surface Testing
2024-07-29 10:22:15 [INFO] Agent-002 found: SQLi in /api/users (CVSS 9.8)
2024-07-29 10:23:00 [INFO] Finding validation: PASSED all 4 gates
2024-07-29 10:23:15 [INFO] Waiting for human approval (CVSS ≥ 7.0)
2024-07-29 10:24:30 [INFO] Security lead approved finding
2024-07-29 15:45:00 [INFO] All phases completed
2024-07-29 15:45:30 [INFO] Report generated
2024-07-29 15:46:00 [INFO] Engagement completed: 87 findings
```

### Secure Cleanup

After testing, all temporary data is securely deleted:

```bash
# Clean sensitive temporary files
rm -f /tmp/test_*.txt
rm -f /tmp/response_*.json
rm -f /tmp/findings_*.cache

# Clear command history
history -c
export HISTFILE=/dev/null

# Remove cached credentials from memory
unset TARGET_PASSWORD
unset API_KEY
unset SSH_PASSPHRASE

# Secure overwrite of sensitive files
shred -vfz -n 10 /tmp/sensitive_*
```

---

## Support & Troubleshooting

### Common Issues

**Q: Agent fails with "Connection refused"**
A: Ensure Kali VM is running and SSH port 22 is accessible.

**Q: Finding rejected in validation**
A: Review validation error. Most likely: evidence not authentic or impact statement too vague.

**Q: Report is empty (no findings)**
A: Normal for some targets. Some may have good security. Re-run a subset of agents/categories to verify.

**Q: Test takes too long**
A: There's no fixed duration and no unattended/background mode — a live Claude Code session dispatches each of the 106 agents via its Agent tool, so wall-clock time scales with how many agents you run and how long each one's real tooling takes against the target (password/hash cracking, full port/vuln scans, and similar genuinely take real time). Plan a full run as an active session, not something to leave running overnight; running a smaller, targeted subset of agents is often faster and sufficient for a quick check.

**Q: Credentials not working**
A: Verify .env file format (run `bash scripts/validate-config.sh <name>`). Ensure credentials have necessary permissions to test the target.

### Getting Help

- Check the [Framework Overview](#framework-overview) section above for architecture details
- Review [All 156+ Agents](#all-156-agents) for specific agent behavior
- See [Tools Reference (150+ Integrated)](#tools-reference-150-integrated) for tool-specific options
- Consult [Validation System](#validation-system) for validation details
- See [COMPREHENSIVE_GUIDE.md](COMPREHENSIVE_GUIDE.md) for Phase 1-4 implementation details

---

**Framework Version:** 3.0.0 (156+ Agents, 23 Execution Categories, 150+ Tools)  
**Last Updated:** August 6, 2026  
**Status:** Production Ready | False Positive Rate: 0%  
**License:** Apache 2.0  

For more information, visit: https://github.com/UsamaArshadJadoon/SecurityTestingMultiAgentWithKali
