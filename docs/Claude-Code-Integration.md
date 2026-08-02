# 🚀 CLAUDE CODE INTEGRATION GUIDE

**Security Testing Multi-Agent Framework for Claude Code**

Since you're using **Claude Code locally**, all 106 agents dispatch through Claude Code's **Agent tool** across 23 dependency-ordered execution categories (`Orchestrator.js`'s own internal grouping — a separate, purely organizational 33-"phase" file-directory catalog also exists in `orchestrator/agents/README.md` for browsing the same 106 spec files by theme, but it isn't the execution order).

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
106 Agents (23 execution categories, each agent a specialized live Agent-tool call)
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
# Interactive — asks for the target URL, each authorized test-user role's
# username/password, and authorization confirmation; saves config.yaml,
# scope.md, and .env automatically
bash scripts/setup-engagement.sh my-client-name
```

### Step 3: Start Orchestration in Claude Code

**Option A: Ask Claude Code to run the full test hands-off**

In Claude Code, ask me:
```
Run full penetration test for my-client-name
```

This follows the exact AUTONOMOUS OPERATING PROTOCOL described above —
Claude Code dispatches all 106 agents across 23 categories in order, running
every finding through the real validation gate, pausing only for the one
CVSS ≥ 7.0 sign-off gate, then generates the report.

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

## 📋 AGENT SPECIFICATIONS (106 Agents)

> **Note:** the bolded names below (`recon-agent`, `web-pentest-agent`, etc.) are
> conceptual role labels for this section's narrative, not real filenames — the
> exact spec file to read and dispatch for each role is named beside it or in
> the AUTONOMOUS OPERATING PROTOCOL section above. The authoritative,
> file-by-file 106-agent directory lives in
> [orchestrator/agents/README.md](../orchestrator/agents/README.md).

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
├─ orchestrator/
│  ├─ agents/
│  │  ├─ Agent-001-Reconnaissance.md   # Agent specs (prompts)
│  │  ├─ Agent-002-Web-Pentest.md
│  │  ├─ Agent-003-API-Security.md
│  │  ├─ README.md                 # Agent directory overview
│  │  └─ ... (106 total)
│  ├─ Orchestrator.js              # State tracking + validation gate
│  ├─ kali-wrapper.sh              # SSH to Kali
│  ├─ kali-health-check.sh         # Verify Kali connectivity & tools
│  └─ README.md
│
├─ kali-setup/
│  ├─ kali-init.sh                 # Setup Kali VM
│  ├─ install-tools.sh             # Install 150+ tools
│  ├─ verify-tools.sh              # Confirm tool installation
│  └─ README.md
│
├─ engagements/                    # Created per engagement at runtime (git-ignored)
│  └─ my-client-name/              # Your engagement
│     ├─ config.yaml
│     ├─ scope.md
│     ├─ .env                      # Credentials (git-ignored)
│     ├─ evidence/
│     │  ├─ findings/              # JSON findings
│     │  ├─ raw/                  # Request/response
│     │  └─ screenshots/
│     └─ report/
│        └─ report.html
│
├─ templates/
│  ├─ finding-schema.json          # Canonical finding format
│  └─ README.md
│
├─ docs/
│  ├─ DOCUMENTATION.md             # Complete reference — agents, tools, validation
│  ├─ Claude-Code-Integration.md   # This file
│  ├─ Master-Documentation-Portal.html
│  └─ How-To-Use-Agents-Guide.html
│
└─ scripts/
   ├─ setup-engagement.sh          # Interactive intake — target URL, roles, credentials
   ├─ validate-config.sh           # Validate engagement config before running
   ├─ run-pentest.sh               # Run orchestration
   └─ check-status.sh              # Show run progress
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
# Interactive — asks for the target URL, each authorized test-user role's
# username/password, and authorization confirmation; saves config.yaml,
# scope.md, and .env automatically. No manual file editing needed.
bash scripts/setup-engagement.sh acme-corp
```

### 3. Run in Claude Code

**Start with Phase 1 in Claude Code:**

Me: "Please run Agent-001-Reconnaissance for the acme-corp engagement using the orchestrator/agents/Agent-001-Reconnaissance.md specification"

I will:
1. Read the agent specification
2. Load engagement configuration
3. Execute the agent with detailed instructions
4. Save findings to `engagements/acme-corp/evidence/findings/RECON-001.json`
5. Provide context for next agents

---

## 🔄 AUTONOMOUS OPERATING PROTOCOL — "Run full penetration test for acme-corp"

This is the exact hands-off protocol Claude Code follows once you give that
instruction. No API key or external service is involved — Claude Code's own
Agent tool IS the dispatch mechanism; `Orchestrator.js` only tracks state and
runs the real validation gate. Claude Code does not stop to ask you anything
during this loop except the one explicit sign-off gate below.

1. **Load state.** Read `engagements/acme-corp/config.yaml`, `scope.md`, `.env`,
   and `.orchestrator-state.json` (if a prior run left one) to know what's
   already completed — resuming skips agents already marked complete.
2. **Confirm the scope gate.** Refuse to proceed unless `scope.md` contains
   the exact line `authorization.confirmed: true` (already true if the
   engagement was created via `setup-engagement.sh`'s interactive intake).
3. **For each agent in `orchestrator/Orchestrator.js`'s `defineAgents()` list**,
   in execution-category order (categories 1 → 23 — Orchestrator.js's own
   internal grouping, distinct from the 33 "Phase N" file-directory groupings
   in `orchestrator/agents/README.md`; both cover the same 106 real spec
   files in `orchestrator/agents/*.md`, just organized two different ways):
   - Read that agent's full spec file as the prompt.
   - Call the **Agent tool** with `subagent_type: "penetration-tester"` or
     `"security-auditor"` (per that agent's `type`), passing the spec plus
     the relevant slice of `execution_context` (e.g. the surface map from
     recon, or confirmed findings from an earlier phase).
   - The subagent drives real Kali tools over SSH via
     `orchestrator/kali-wrapper.sh` and returns findings as JSON.
   - **Validate before handoff:** every finding is run through
     `orchestrator/validation-gate.js`'s 4 gates (Format → Evidence →
     Technical Accuracy → Remediation) *before* it's added to
     `execution_context` or handed to the next agent. A finding that fails
     any gate is rejected — logged with the specific gate and reason, not
     silently dropped — and never reaches the report.
   - Mark the agent complete in `.orchestrator-state.json` and move to the
     next one. No pause, no confirmation needed at this step.
4. **The one sign-off gate:** if a validated finding scores CVSS ≥ 7.0
   (High/Critical), pause and ask you to approve or reject it before
   continuing. This is the only point requiring your input between intake
   and the final report.
5. **Generate the report.** Once every agent has run, call
   `orchestrator/report-generator.js`'s `generateReport()` to render
   `report/report.html` from every validated finding in
   `evidence/findings/*.json`.

```
CATEGORY 1  (3 agents)  Reconnaissance & Discovery      → Agent-001*
CATEGORY 2  (8 agents)  Web Application Testing         → Agent-002*
CATEGORY 3  (8 agents)  API Security                    → Agent-003*
CATEGORY 4  (3 agents)  Authentication & Authorization   → Agent-004*, Agent-024
CATEGORY 5  (3 agents)  Infrastructure, Cloud & AI       → Agent-005, 006, 007
CATEGORY 6  (7 agents)  Deep Exploitation & RCE          → Agent-008, 009, 0010-0014
[... continues through category 23 ...]
CATEGORY 23 (6 agents)  Web/Mobile/API Coverage Extension → Agent-059 – Agent-064
  └─> generateFinalReport() → report.html
```

See `orchestrator/agents/README.md` for the complete, authoritative
phase-by-phase file listing, and `docs/How-To-Use-Agents-Guide.html`'s Agent
Explorer for the same 106-agent catalog, searchable by name/tool/topic.

---

## 📊 FINDING FORMAT

All findings saved as JSON following `templates/finding-schema.json` exactly
(this is the real, authoritative shape — every field below is required unless
noted otherwise):

```json
{
  "finding_id": "FINDING-0001",
  "agent": "Agent-002-Web-Pentest",
  "title": "Clickjacking via Missing X-Frame-Options",
  "description": "The application does not set X-Frame-Options or a frame-ancestors CSP directive, allowing the page to be embedded in a malicious iframe for clickjacking attacks.",
  "severity": "High",
  "cvss_score": 6.5,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N",
  "affected_component": "GET / (all pages)",
  "evidence": {
    "proof_of_concept": "Embedded the login page in an <iframe> on an attacker-controlled page; it rendered without any framing restriction.",
    "request": "GET / HTTP/1.1\nHost: staging.acme-corp.com",
    "response": "HTTP/1.1 200 OK\n(no X-Frame-Options or CSP frame-ancestors header present)",
    "screenshots": []
  },
  "remediation": {
    "description": "Set X-Frame-Options: DENY (or SAMEORIGIN) and/or a CSP frame-ancestors directive on every response.",
    "vulnerable_code": "// no frame-protection header set",
    "fixed_code": "res.setHeader('X-Frame-Options', 'DENY');",
    "effort": "1-2 hours"
  },
  "owasp_category": "A01:2021 - Broken Access Control",
  "cwe_id": "CWE-1021",
  "validation_status": "validated",
  "validation_date": "2026-07-29T12:00:00Z"
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

After running all 106 agents across 23 execution categories:

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
- No fixed duration — scales with how many of the 106 agents you dispatch in the session, and how long each one's real tooling takes against the target
- Driven by a live Claude Code session via the Agent tool — no unattended/background mode
- Sequential, dependency-ordered execution with data flow between categories

---

## 🆘 TROUBLESHOOTING

### Kali VM Not Reachable
```bash
bash orchestrator/kali-health-check.sh
# Check SSH keys in ~/.ssh/ (e.g. ~/.ssh/kali_key), and KALI_HOST/KALI_USER/KALI_KEY env vars
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
- **Full automation** - 106 agents, minimal manual work
- **Enterprise-ready** - CVSS scoring, OWASP mapping, remediation

---

**You're ready to run enterprise penetration tests entirely within Claude Code!** 🔒

