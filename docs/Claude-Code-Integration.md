# 🚀 CLAUDE CODE INTEGRATION GUIDE

**Security Testing Multi-Agent Framework for Claude Code**

Since you're using **Claude Code locally**, all 86 agents dispatch through Claude Code's **Agent tool** across 30 sequential phases.

---

## ✅ HOW IT WORKS

### Architecture:
```
Your Project in Claude Code
       ↓
.claude/CLAUDE.md (this config)
       ↓
orchestrator/ (instructions)
       ↓
Agent Tool (Claude Code built-in)
       ↓
86 Agents (30 phases, each is a specialized agent call)
       ↓
findings/ (JSON output)
       ↓
report.html (final deliverable)
```

---

## 🎯 USING THE FRAMEWORK IN CLAUDE CODE

### Step 1: Load the Framework
```bash
# In Claude Code terminal
cd SecurityTestingMultiAgentWithKali
```

### Step 2: Create Engagement
```bash
# Create folder structure for new client
bash scripts/setup-engagement.sh my-client-name

# Edit configuration
nano engagements/my-client-name/config.yaml
nano engagements/my-client-name/scope.md
```

### Step 3: Start Orchestration in Claude Code

**Option A: Use Claude Code's Prompt to Start Sequential Agents**

In Claude Code, ask me:
```
Start penetration testing orchestration for my-client-name

Phase 1: Reconnaissance
- Run recon-agent
- Map attack surface
- Discover API endpoints

Phase 2: Surface-Level Testing
- Run web-pentest-agent
- Run api-security-agent  
- Run authn-authz-agent
- Run infra-agent
- Run cloud-container-agent

[etc. for all 30 phases]
```

**Option B: Use Shell Script to Coordinate Agents**

```bash
bash scripts/run-pentest.sh my-client-name
```

---

## 🔧 AGENT DISPATCHING IN CLAUDE CODE

### Each Agent Call Uses This Pattern:

```
Me: "Run [agent-name] against my-client-name engagement"

I will:
1. Load orchestrator/agents/[agent-name].md
2. Read engagement config
3. Call Agent tool with:
   - subagent_type: "penetration-tester" or "security-auditor"
   - description: "[agent description]"
   - prompt: "[detailed testing instructions from .md file]"
4. Parse findings
5. Save to evidence/findings/[PREFIX]-###.json
6. Pass context to next agent
```

---

## 📋 AGENT SPECIFICATIONS (86 Agents)

### PHASE 1: Reconnaissance (1 agent)
**recon-agent**
- Tools: nmap, amass, whois, whatweb, nuclei
- Output: surface-map.md, api-inventory.md, tech-stack.md
- Next: All Phase 2 agents depend on this

### PHASE 2: Surface-Level (6 agents)
**web-pentest-agent** → WEB-*.json findings
**api-security-agent** → API-*.json findings
**authn-authz-agent** → AUTHZ-*.json findings
**infra-agent** → INFRA-*.json findings
**cloud-container-agent** → CLOUD-*.json findings
**ai-llm-agent** → AI-*.json findings

### PHASE 3: Deep Exploitation (7 agents)
**ssrf-exploitation-agent** → SSRF-*.json
**request-smuggling-agent** → SMUGGLING-*.json
**file-upload-rce-agent** → FILEUPLOAD-*.json
**path-traversal-agent** → TRAVERSAL-*.json
**xxe-injection-agent** → XXE-*.json
**deserialization-rce-agent** → DESER-*.json
**ssti-exploitation-agent** → SSTI-*.json

### PHASE 4: Post-Exploitation (4 agents)
**post-exploitation-agent** → POSTEX-*.json
**privilege-escalation-agent** → PRIVESC-*.json
**secrets-harvesting-agent** → SECRETS-*.json
**lateral-movement-agent** → LATERAL-*.json

### PHASE 5: Source Code (2 agents)
**source-code-disclosure-agent** → SRCDISC-*.json
**git-forensics-agent** → GITFOREN-*.json

### PHASE 6: Cloud (3 agents)
**aws-exploitation-agent** → AWS-*.json
**gcp-exploitation-agent** → GCP-*.json
**azure-exploitation-agent** → AZURE-*.json

### PHASE 7: Advanced Auth (2 agents)
**oauth-saml-agent** → OAUTH-*.json
**cryptography-weakness-agent** → CRYPTO-*.json

### PHASE 8: Supply Chain (3 agents)
**dependency-scanning-agent** → DEPS-*.json
**ci-cd-pipeline-agent** → CICD-*.json
**compliance-testing-agent** → COMPLIANCE-*.json

### PHASE 9: Business Logic (1 agent)
**business-logic-agent** → LOGIC-*.json

### PHASE 10: Rate Limiting (2 agents)
**rate-limiting-bypass-agent** → RATELIMIT-*.json
**mass-assignment-agent** → MASSASSIGN-*.json

### PHASE 11: Advanced Protocols (2 agents)
**websocket-security-agent** → WS-*.json
**grpc-testing-agent** → GRPC-*.json

### PHASE 12: Chaining (1 agent)
**exploitation-agent** → CHAIN-*.json

### PHASE 13: Reporting (1 agent)
**reporting-agent** → report.html

---

## 📂 DIRECTORY STRUCTURE FOR CLAUDE CODE

```
SecurityTestingMultiAgentWithKali/
│
├─ .claude/
│  └─ CLAUDE.md                    # This file
│
├─ orchestrator/
│  ├─ agents/
│  │  ├─ Agent-001-Reconnaissance.md   # Agent specs (prompts)
│  │  ├─ Agent-002-Web-Pentest.md
│  │  ├─ Agent-003-API-Security.md
│  │  └─ ... (86 total)
│  ├─ kali-wrapper.sh              # SSH to Kali
│  └─ README.md
│
├─ kali-setup/
│  ├─ kali-init.sh                 # Setup Kali VM
│  ├─ install-tools.sh             # Install 150+ tools
│  └─ kali-config.yaml
│
├─ engagements/
│  ├─ template/
│  │  ├─ config.yaml               # Copy & fill in
│  │  ├─ scope.md                  # Copy & fill in
│  │  └─ .secrets                  # Copy & fill in
│  │
│  └─ my-client-name/              # Your engagement
│     ├─ config.yaml
│     ├─ scope.md
│     ├─ .secrets
│     ├─ evidence/
│     │  ├─ findings/              # JSON findings
│     │  ├─ raw/                   # Request/response
│     │  └─ screenshots/
│     └─ report/
│        └─ report.html
│
├─ templates/
│  ├─ finding-schema.json          # Canonical format
│  └─ report-template.html
│
├─ docs/
│  ├─ AGENT-SPECS.md               # Detailed agent specs
│  ├─ TESTING-METHODOLOGY.md       # How to test
│  └─ ...
│
└─ scripts/
   ├─ setup-engagement.sh          # Create new engagement
   └─ run-pentest.sh               # Run orchestration
```

---

## 🎯 QUICK START IN CLAUDE CODE

### 1. Setup (One-Time)
```bash
# Clone repository
git clone https://github.com/UsamaArshadJadoon/SecurityTestingMultiAgentWithKali.git
cd SecurityTestingMultiAgentWithKali

# Setup Kali VM
bash kali-setup/kali-init.sh
bash kali-setup/install-tools.sh

# Verify tools
bash orchestrator/kali-health-check.sh
```

### 2. Create Engagement
```bash
# Create new client
bash scripts/setup-engagement.sh acme-corp

# Edit config
nano engagements/acme-corp/config.yaml
nano engagements/acme-corp/scope.md
nano engagements/acme-corp/.secrets
```

### 3. Run in Claude Code

**Start with Phase 1 in Claude Code:**

Me: "Please run the recon-agent for acme-corp engagement using the orchestrator/agents/Agent-001-Reconnaissance.md specification"

I will:
1. Read the agent specification
2. Load engagement configuration
3. Execute the agent with detailed instructions
4. Save findings to `engagements/acme-corp/evidence/findings/RECON-001.json`
5. Provide context for next agents

---

## 🔄 SEQUENTIAL WORKFLOW IN CLAUDE CODE

### You: "Run full penetration test for acme-corp"

I will execute sequentially in Claude Code:

```
PHASE 1: Reconnaissance
  └─> Run recon-agent
      └─ Findings saved
      
PHASE 2: Surface Testing (6 agents, sequential)
  ├─> Run web-pentest-agent (uses recon output)
  ├─> Run api-security-agent (uses recon output)
  ├─> Run authn-authz-agent (uses recon output)
  ├─> Run infra-agent (uses recon output)
  ├─> Run cloud-container-agent (uses recon + infra)
  └─> Run ai-llm-agent (uses recon output)

PHASE 3: Deep Exploitation (7 agents, sequential)
  ├─> Run ssrf-exploitation-agent (uses web + api findings)
  ├─> Run request-smuggling-agent (uses web findings)
  ├─> Run file-upload-rce-agent (uses web findings)
  ├─> Run path-traversal-agent (uses web findings)
  ├─> Run xxe-injection-agent (uses api findings)
  ├─> Run deserialization-rce-agent (uses api findings)
  └─> Run ssti-exploitation-agent (uses web findings)

[... Phases 4-13 ...]

PHASE 13: Reporting
  └─> Run reporting-agent
      └─ Generate report.html
```

---

## 📊 FINDING FORMAT

All findings saved as JSON following `templates/finding-schema.json`:

```json
{
  "id": "WEB-001",
  "title": "Clickjacking via Missing X-Frame-Options",
  "description": "...",
  "severity": "high",
  "cvss_v3_1": {
    "score": 6.5,
    "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N"
  },
  "status": "candidate",
  "agent": "web-pentest-agent",
  "evidence": {
    "proof_of_concept": "...",
    "request": {...},
    "response": {...},
    "tool_used": "burp-repeater",
    "screenshots": [...]
  },
  "impact": {...},
  "remediation": {...},
  "owasp": ["A01:2021 – Broken Access Control"],
  "cwe": [{"id": "CWE-693", "title": "Protection Mechanism Failure"}],
  "timestamp": "2026-07-29T12:00:00Z"
}
```

---

## 🔐 SECURITY PRACTICES

✅ **Scope Gate:** Must confirm `authorization.confirmed: true` in scope.md  
✅ **Finding Validation:** All findings must have concrete proof-of-concept  
✅ **PII Masking:** Automatically mask sensitive data in evidence  
✅ **Read-Only First:** Non-destructive PoC before mutation testing  
✅ **Logging:** All destructive actions logged for audit trail  

---

## 📈 EXPECTED OUTCOMES

After running all 86 agents across 30 phases:

**Deliverables:**
- `engagements/acme-corp/evidence/findings/` — All findings (JSON)
- `engagements/acme-corp/evidence/raw/` — HTTP requests/responses
- `engagements/acme-corp/evidence/screenshots/` — PoC images
- `engagements/acme-corp/report/report.html` — Final HTML report
- `engagements/acme-corp/report/report.json` — Machine-readable report

**Findings:**
- 15-25 validated security issues
- CVSS scoring per finding
- OWASP Top 10 categorization
- CWE/MITRE ATT&CK mapping
- Concrete evidence for each

**Timeline:**
- 40-60 hours comprehensive testing
- Fully automated via Claude Code
- Sequential execution with data flow

---

## 🆘 TROUBLESHOOTING

### Kali VM Not Reachable
```bash
bash orchestrator/kali-health-check.sh
# Check SSH keys in .claude/ssh-keys/
# Verify Kali VM is running (Hyper-V)
```

### Agent Timeout
- Increase timeout in agent specification
- Default: 1-2 hours per agent
- Check Kali resource usage

### Missing Findings
```bash
# Check evidence directory
ls -la engagements/acme-corp/evidence/findings/

# Check Kali SSH logs
bash orchestrator/kali-wrapper.sh "journalctl -xe"
```

### Resume Interrupted Test
```bash
# Orchestrator auto-saves state after each agent
# Run again and it will skip completed agents:
bash scripts/run-pentest.sh acme-corp
```

---

## 📝 NEXT STEPS

1. ✅ Copy framework to your Claude Code workspace
2. ✅ Setup Kali VM: `bash kali-setup/kali-init.sh`
3. ✅ Create engagement: `bash scripts/setup-engagement.sh my-client`
4. ✅ In Claude Code, ask me to run agents sequentially
5. ✅ View final report: `engagements/my-client/report/report.html`

---

## 💡 KEY POINTS

- **No external API needed** - Everything runs in Claude Code
- **Sequential execution** - Each agent waits for prior phase
- **Data flow** - Context passes between agents
- **Auto-validation** - Exploitation agent validates all findings
- **Full automation** - 86 agents, minimal manual work
- **Enterprise-ready** - CVSS scoring, OWASP mapping, remediation

---

**You're ready to run enterprise penetration tests entirely within Claude Code!** 🔒

