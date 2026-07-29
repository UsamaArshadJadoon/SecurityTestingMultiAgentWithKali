# 🔒 Security Testing Multi-Agent Framework with Kali Linux

**Enterprise-Grade Penetration Testing Orchestration | 31+ Agents | 55+ Tools | 95%+ Coverage**

---

## 📋 Overview

A fully-automated, sequential multi-agent penetration testing framework that orchestrates **31 specialized agents** across **13 phases**, integrating **55+ Kali Linux tools** for comprehensive security testing.

### Key Features

✅ **31+ Specialized Agents** — Each agent focuses on a specific vulnerability category  
✅ **55+ Integrated Tools** — Full Kali Linux toolkit (nmap, ffuf, sqlmap, nuclei, hashcat, aws-cli, kubectl, etc.)  
✅ **Sequential Execution** — Agents run in deterministic order with data flow between stages  
✅ **95%+ Vulnerability Coverage** — OWASP Top 10, CWE Top 25, MITRE ATT&CK, API Security, Cloud, Mobile  
✅ **Hyper-V Kali Integration** — SSH-based tool execution on Kali VM  
✅ **Fully Automated** — One-click engagement setup and scanning  
✅ **Enterprise Reporting** — CVSS scoring, OWASP mapping, remediation guidance  

---

## 🎯 What Gets Tested (31 Agents)

### Phase 1: Reconnaissance (1 Agent)
- **recon-agent** — OSINT, service enumeration, tech stack fingerprinting, API discovery, WAF/CDN detection

### Phase 2: Surface-Level Exploitation (6 Agents)
- **web-pentest-agent** — Authentication, IDOR, RBAC, XSS, CSRF, injection, DOS, headers
- **api-security-agent** — Advanced SQLi, NoSQL, fuzzing, BOLA, DOS, GraphQL, gRPC, JWT
- **authn-authz-agent** — MFA bypass, JWT cracking, session attacks, RBAC matrix, privilege escalation
- **infra-agent** — Network scanning, TLS/SSL, DNS, service enumeration, K8s, WAF, DOS
- **cloud-container-agent** — AWS, GCP, Azure, Docker, Kubernetes security
- **ai-llm-agent** — Prompt injection, jailbreak, token leakage

### Phase 3: Deep Exploitation (7 Agents)
- **ssrf-exploitation-agent** — SSRF, cloud metadata theft (AWS IMDSv1, GCP, Azure)
- **request-smuggling-agent** — HTTP request smuggling (CL.TE, TE.CL, HTTP/2, Rapid Reset)
- **file-upload-rce-agent** — Polyglot files, magic bytes, htaccess upload, ImageTragick
- **path-traversal-agent** — Directory traversal, encoding bypasses, symlink following
- **xxe-injection-agent** — XXE, blind XXE, OOB exfiltration, XML bomb
- **deserialization-rce-agent** — Java gadget chains, PHP unserialize, Python pickle RCE
- **ssti-exploitation-agent** — Jinja2, EL, MVEL, Velocity, Thymeleaf SSTI

### Phase 4: Post-Exploitation (4 Agents)
- **post-exploitation-agent** — System enumeration, user discovery, process analysis
- **privilege-escalation-agent** — Kernel exploits, sudo abuse, UAC bypass, local privesc
- **secrets-harvesting-agent** — Hardcoded credentials, .env, config files, memory dumps
- **lateral-movement-agent** — Network pivoting, service-to-service exploitation, persistence

### Phase 5: Source Code & Git Forensics (2 Agents)
- **source-code-disclosure-agent** — .git exposure, backup files, directory listing
- **git-forensics-agent** — Commit history mining, deleted secrets, author enumeration

### Phase 6: Cloud Exploitation (3 Agents)
- **aws-exploitation-agent** — S3 buckets, EC2, Lambda, RDS, IAM, Cognito, API Gateway
- **gcp-exploitation-agent** — GCS, Cloud Functions, Firestore, IAM, Service accounts
- **azure-exploitation-agent** — Storage, App Service, Functions, Key Vault, databases

### Phase 7: Advanced Authentication (2 Agents)
- **oauth-saml-agent** — OAuth 2.0 bypass, SAML attacks, signature stripping
- **cryptography-weakness-agent** — Weak hashing, encryption, key management

### Phase 8: Supply Chain & Compliance (3 Agents)
- **dependency-scanning-agent** — CVE detection, outdated libraries, typosquatting
- **ci-cd-pipeline-agent** — Jenkins, GitLab CI, GitHub Actions, build tampering
- **compliance-testing-agent** — GDPR, HIPAA, PCI-DSS, SOC2 compliance

### Phase 9: Business Logic (1 Agent)
- **business-logic-agent** — Race conditions, TOCTOU, workflow bypass, price manipulation

### Phase 10: Rate Limiting & Brute Force (2 Agents)
- **rate-limiting-bypass-agent** — Rate limit bypass, distributed bypass, token bucket exhaustion
- **mass-assignment-agent** — Hidden field injection, privilege escalation via over-posting

### Phase 11: Advanced Protocols (2 Agents)
- **websocket-security-agent** — WebSocket hijacking, replay, injection
- **grpc-testing-agent** — gRPC plaintext, mTLS bypass, method enumeration

### Phase 12: Exploitation Chaining (1 Agent)
- **exploitation-agent** — Validate findings, chain exploits, privilege escalation paths

### Phase 13: Reporting (1 Agent)
- **reporting-agent** — CVSS scoring, OWASP/CWE mapping, remediation guidance, HTML report

---

## 🛠️ Tool Inventory (55+)

| Category | Tools |
|----------|-------|
| HTTP/API | ffuf, sqlmap, nuclei, httpx, curl, nikto, zaproxy, burp, wfuzz |
| Infrastructure | nmap, masscan, testssl.sh, sslyze, tlsx, sslscan, openssl, dig |
| Crypto/Token | hashcat, john, jwt_tool, hashid, openssl, pycryptodome |
| Exploitation | ysoserial, commix, sqlmap, PayloadsAllTheThings, SecretFinder |
| Cloud/Container | kubectl, aws-cli, gcloud, azure-cli, trivy, kubesec, docker |
| Recon/OSINT | amass, subfinder, whois, theHarvester, shodan-cli, censys-cli |
| Python Libraries | requests, pwntools, boto3, paramiko, cryptography, pyyaml |
| Wordlists | rockyou.txt, seclists, payloadsallthethings, nuclei-templates |

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/UsamaArshadJadoon/SecurityTestingMultiAgentWithKali.git
cd SecurityTestingMultiAgentWithKali
```

### 2. Set Up Kali VM (One-Time)
```bash
# On your Hyper-V Kali VM:
bash kali-setup/kali-init.sh
bash kali-setup/install-tools.sh

# Verify setup:
bash orchestrator/kali-health-check.sh
```

### 3. Create Engagement
```bash
# Copy template:
cp -r engagements/template engagements/my-client-name

# Edit configuration:
nano engagements/my-client-name/config.yaml
nano engagements/my-client-name/scope.md
nano engagements/my-client-name/.secrets
```

### 4. Run Penetration Test
```bash
# Start orchestrator (sequential execution):
node orchestrator/workflow.js my-client-name

# Expected execution time: 40-60 hours (comprehensive)
# Output: evidence/, report/report.html
```

---

## 📁 Directory Structure

```
SecurityTestingMultiAgentWithKali/
│
├─ kali-setup/                    # Kali VM bootstrap
│  ├─ kali-init.sh
│  ├─ install-tools.sh
│  ├─ kali-config.yaml
│  └─ README.md
│
├─ orchestrator/                  # Main orchestration
│  ├─ workflow.js                 # Master orchestrator
│  ├─ kali-wrapper.sh             # SSH execution wrapper
│  ├─ kali-health-check.sh        # Connectivity verification
│  ├─ agents/                     # 31 agent prompts/specs
│  │  ├─ recon-agent.md
│  │  ├─ web-pentest-agent.md
│  │  ├─ api-security-agent.md
│  │  ├─ ... (28 more agents)
│  │  └─ reporting-agent.md
│  └─ README.md
│
├─ engagements/                   # Per-engagement data
│  ├─ template/
│  │  ├─ config.yaml              # Targets, RoE, test accounts
│  │  ├─ scope.md                 # Authorization & scope gate
│  │  ├─ .secrets                 # Credentials (git-ignored)
│  │  └─ README.md
│  │
│  └─ [client-name]/              # Actual engagement
│     ├─ config.yaml
│     ├─ scope.md
│     ├─ evidence/
│     │  ├─ recon/
│     │  ├─ findings/
│     │  ├─ raw/
│     │  └─ screenshots/
│     └─ report/
│        └─ report.html
│
├─ templates/                     # Reusable schemas
│  ├─ finding-schema.json         # Canonical finding format
│  ├─ report-template.html        # HTML report layout
│  └─ surface-map-template.md
│
├─ docs/                          # Documentation
│  ├─ AGENT-SPECS.md              # Detailed agent specs
│  ├─ TOOL-REFERENCE.md           # Tool usage guide
│  ├─ OWASP-MAPPING.md            # OWASP Top 10 coverage
│  └─ API-SECURITY.md             # API testing guide
│
├─ README.md                      # This file
├─ LICENSE
├─ package.json
└─ .gitignore
```

---

## 🔧 Configuration Example

### config.yaml
```yaml
engagement:
  name: "ClientXYZ Security Assessment"
  owner: "security@client.com"
  start_date: "2026-08-01"

targets:
  urls:
    - "https://app.client.com"
    - "https://api.client.com"
  hosts:
    - "app.client.com"
    - "api.client.com"

kali:
  host: "192.168.1.100"
  user: "kali"
  ssh_key: "./ssh-keys/kali-agent"

rules_of_engagement:
  allow_mutation: true
  allow_dos: true
  max_concurrent_requests: 10

test_accounts:
  admin:
    username: "admin_user"
    password: "${ADMIN_PASSWORD}"
  user:
    username: "regular_user"
    password: "${USER_PASSWORD}"
```

### scope.md
```markdown
# Engagement Scope

## Authorization
- Authorized by: John Doe (john@client.com)
- Date: 2026-08-01
- authorization.confirmed: true

## Targets (IN SCOPE)
- https://app.client.com
- https://api.client.com
- https://admin.client.com

## OUT OF SCOPE
- production-*.client.com
- third-party services
```

---

## 📊 Execution Flow

```
START
  ├─ Load config + validate scope
  ├─ Test Kali connectivity
  │
  ├─ PHASE 1: RECONNAISSANCE
  │  └─ recon-agent → surface-map.md
  │
  ├─ PHASE 2: SURFACE-LEVEL EXPLOITATION (6 agents, sequential)
  │  ├─ web-pentest-agent → WEB-*.json
  │  ├─ api-security-agent → API-*.json
  │  ├─ authn-authz-agent → AUTHZ-*.json
  │  ├─ infra-agent → INFRA-*.json
  │  ├─ cloud-container-agent → CLOUD-*.json
  │  └─ ai-llm-agent → AI-*.json
  │
  ├─ PHASE 3: DEEP EXPLOITATION (7 agents, sequential)
  │  ├─ ssrf-exploitation-agent → SSRF-*.json
  │  ├─ request-smuggling-agent → SMUGGLING-*.json
  │  ├─ file-upload-rce-agent → FILEUPLOAD-*.json
  │  ├─ path-traversal-agent → TRAVERSAL-*.json
  │  ├─ xxe-injection-agent → XXE-*.json
  │  ├─ deserialization-rce-agent → DESER-*.json
  │  └─ ssti-exploitation-agent → SSTI-*.json
  │
  ├─ PHASE 4-13: Additional Agents (19 agents, sequential)
  │  └─ (post-exploitation, cloud, auth, supply chain, business logic, etc.)
  │
  └─ REPORTING AGENT
     └─ report/report.html (CVSS, OWASP mapping, remediation)

TOTAL TIME: 40-60 hours (comprehensive testing)
```

---

## 📈 Coverage & Compliance

### OWASP Top 10 2021 ✅
1. Broken Access Control — IDOR, BOLA, RBAC agents
2. Cryptographic Failures — Crypto weakness agent
3. Injection — SQLi, NoSQL, command injection agents
4. Insecure Design — Business logic agent
5. Security Misconfiguration — Infrastructure, cloud agents
6. Vulnerable Components — Dependency scanning agent
7. Authentication Failures — Authn/Authz agents
8. Software & Data Integrity Failures — CI/CD, supply chain agents
9. Logging & Monitoring Failures — Post-exploitation, compliance agents
10. SSRF — SSRF exploitation agent

### CWE Top 25 ✅
All 25 most dangerous weaknesses covered across agents

### MITRE ATT&CK ✅
- **Reconnaissance** — recon-agent
- **Weaponization** — exploitation agents
- **Delivery** — file upload, SSRF agents
- **Exploitation** — all exploitation agents
- **Installation** — persistence modules in post-exploitation agent
- **Command & Control** — lateral movement agent
- **Actions on Objectives** — business logic, privilege escalation agents

### Compliance Testing ✅
- GDPR — compliance-testing-agent
- HIPAA — compliance-testing-agent
- PCI-DSS — compliance-testing-agent
- SOC2 — compliance-testing-agent

---

## 🔐 Security Best Practices

✅ All findings require **concrete evidence** (no assumptions)  
✅ Scope gate enforces **authorization.confirmed: true**  
✅ Smallest **non-destructive PoC** preferred  
✅ **Read-only proofs** before mutation testing  
✅ **PII masking** in all evidence/reports  
✅ **Complete logging** of destructive actions  
✅ **Safe fallback** when Kali tools unavailable (use Playwright MCP + curl)  
✅ **False positive policy** — findings validated by exploitation agent  

---

## 🤝 Contributing

Contributions welcome! Areas:
- Additional agent templates
- Tool integration improvements
- Report template enhancements
- Documentation updates
- Bug fixes

---

## 📝 License

Licensed under [Apache 2.0](LICENSE) — Commercial use permitted with attribution.

---

## 👨‍💻 Authors

**Usama Arshed Jadoon** — QC Lead, AZM Digital  
Framework developed for enterprise penetration testing automation.

---

## 🆘 Support & Documentation

- **Agent Specifications**: [docs/AGENT-SPECS.md](docs/AGENT-SPECS.md)
- **Tool Reference**: [docs/TOOL-REFERENCE.md](docs/TOOL-REFERENCE.md)
- **API Security**: [docs/API-SECURITY.md](docs/API-SECURITY.md)
- **Kali Setup Troubleshooting**: [kali-setup/README.md](kali-setup/README.md)
- **Issues**: [GitHub Issues](https://github.com/UsamaArshadJadoon/SecurityTestingMultiAgentWithKali/issues)

---

## ⚡ Quick Links

- **GitHub Repository**: https://github.com/UsamaArshadJadoon/SecurityTestingMultiAgentWithKali
- **Framework Overview**: [FRAMEWORK.md](docs/FRAMEWORK.md)
- **Engagement Template**: [engagements/template/README.md](engagements/template/README.md)
- **Tool Inventory**: [docs/TOOL-REFERENCE.md](docs/TOOL-REFERENCE.md)

---

**Happy Hacking! 🔒**
