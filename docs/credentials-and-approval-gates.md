# 🔐 CREDENTIALS MANAGEMENT & HUMAN APPROVAL GATES

**Purpose:** Secure credential storage + Human sign-off on findings  
**Security:** All credentials encrypted, git-ignored, never logged  
**Approval:** Critical findings require human review before reporting  

---

## 📋 CREDENTIALS MANAGEMENT SYSTEM

### **Setup (One-Time)**

User provides engagement credentials:

```bash
# Create engagement
bash scripts/setup-engagement.sh acme-corp

# This creates:
engagements/acme-corp/
  ├─ config.yaml          # Configuration
  ├─ scope.md             # Scope & auth
  ├─ .secrets             # CREDENTIALS (YOU FILL IN)
  ├─ .env                 # ENVIRONMENT VARS (YOU FILL IN)
  └─ .gitignore           # IGNORES SECRETS
```

### **Step 1: Fill in Credentials File**

File: `engagements/my-client/.secrets`

```bash
# ===== TARGET SYSTEM CREDENTIALS =====

# Primary Target URL
TARGET_URL="https://app.acme.com"
TARGET_API_URL="https://api.acme.com"

# Admin Account (for reconnaissance phase)
ADMIN_USERNAME="admin_test_001"
ADMIN_PASSWORD="TempAdmin123!@#"
ADMIN_EMAIL="admin@acme.test"

# Regular User Account (for authorization testing)
USER_USERNAME="user_test_001"
USER_PASSWORD="TempUser123!@#"
USER_EMAIL="user@acme.test"

# Contractor Role Account (for IDOR/privilege testing)
CONTRACTOR_USERNAME="contractor_test_001"
CONTRACTOR_PASSWORD="TempContractor123!@#"
CONTRACTOR_EMAIL="contractor@acme.test"

# Database Access (if allowed)
DB_HOST="db.internal.acme.com"
DB_USER="test_user"
DB_PASSWORD="TempDB123!@#"
DB_NAME="acme_uat"

# Additional Test Accounts
TEST_ACCOUNT_1_USERNAME="test1@acme.test"
TEST_ACCOUNT_1_PASSWORD="TestPass123!@#"

TEST_ACCOUNT_2_USERNAME="test2@acme.test"
TEST_ACCOUNT_2_PASSWORD="TestPass123!@#"

# API Keys (if applicable)
API_KEY_1="test_api_key_xxxxxxxxxx"
API_KEY_2="test_api_key_yyyyyyyyyyyy"

# SSH/VPN (if accessing internal systems)
SSH_KEY_PATH="/path/to/ssh/key"
SSH_USER="test_user"

# Proxy/VPN Details (if needed)
VPN_HOST="vpn.acme.com"
VPN_USERNAME="vpn_test_user"
VPN_PASSWORD="VPN123!@#"

# ===== IMPORTANT NOTES =====
# - Use TEMPORARY test accounts, not production credentials
# - All credentials will be masked in reports (PII protection)
# - File is NEVER committed to git
# - File is NEVER shared or logged
# - Credentials expire after engagement
```

### **Step 2: Create Environment File**

File: `engagements/my-client/.env`

```bash
#!/bin/bash
# Load credentials securely

export TARGET_URL="$(grep 'TARGET_URL=' ../.secrets | cut -d'=' -f2 | tr -d '"')"
export ADMIN_USERNAME="$(grep 'ADMIN_USERNAME=' ../.secrets | cut -d'=' -f2 | tr -d '"')"
export ADMIN_PASSWORD="$(grep 'ADMIN_PASSWORD=' ../.secrets | cut -d'=' -f2 | tr -d '"')"

# Load ALL from .secrets securely
source .secrets

# Display status (without showing secrets)
echo "✅ Environment loaded from .secrets"
echo "Target: ${TARGET_URL}"
echo "Test accounts available: 3+"
```

### **Step 3: Setup .gitignore**

File: `.gitignore` (in repository root)

```gitignore
# ===== CREDENTIALS - NEVER COMMIT =====
.secrets
.env
.env.local
*.key
*.pem
credentials.*
secrets.*

# ===== USER DATA - NEVER COMMIT =====
engagements/*/.*secrets
engagements/*/.env
engagements/*/.env.local
engagements/*/credentials*

# ===== SENSITIVE EVIDENCE - NEVER COMMIT =====
evidence/*/raw/*-credentials.txt
evidence/*/raw/*-password*.txt
evidence/*/raw/*-token*.txt
evidence/*/raw/*-api-key*.txt
engagements/*/evidence/**/passwords.json
engagements/*/evidence/**/tokens.json
engagements/*/evidence/**/api-keys.json

# ===== PERSONALLY IDENTIFIABLE INFORMATION =====
# Note: PII IS stored in findings but MASKED
# Raw PII files should not be committed
**/unmasked-pii.json
**/raw-user-data.json

# ===== TEMPORARY FILES =====
*.tmp
*.bak
.DS_Store
Thumbs.db

# ===== LOGS (May contain secrets) =====
*.log
logs/
.claude/logs/

# ===== IDE FILES =====
.vscode/
.idea/
*.swp
*.swo

# ===== NODE/DEPENDENCIES =====
node_modules/
package-lock.json
npm-debug.log
```

### **Step 4: Agent Credential Loading**

Every agent automatically loads .secrets:

```javascript
// In each agent specification:

// Load engagement credentials securely
async function loadCredentials(engagementName) {
  const secretsPath = path.join(
    ENGAGEMENTS_PATH,
    engagementName,
    '.secrets'
  );
  
  // Read secrets file
  const secretsContent = fs.readFileSync(secretsPath, 'utf8');
  
  // Parse as shell variables
  const credentials = {};
  secretsContent.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.includes('=')) return;
    
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    credentials[key] = value;
  });
  
  return credentials;
}

// Usage in agent:
const creds = await loadCredentials(engagementName);
const targetUrl = creds.TARGET_URL;
const adminUser = creds.ADMIN_USERNAME;
const adminPass = creds.ADMIN_PASSWORD;

// CRITICAL: Never log credentials
console.log(`Testing: ${targetUrl}`); // OK
console.log(`Auth: ${adminPass}`);    // ❌ NEVER DO THIS!
```

---

## 🔒 CREDENTIAL PROTECTION RULES

### **In Agent Code:**

```
✅ ALLOWED:
  console.log(`Target: ${creds.TARGET_URL}`);
  console.log(`Testing as: ${creds.ADMIN_USERNAME}`);
  console.log(`Password length: ${creds.ADMIN_PASSWORD.length}`);

❌ NEVER ALLOWED:
  console.log(`Password: ${creds.ADMIN_PASSWORD}`);
  fs.writeFile('log.txt', `creds: ${creds}`);
  throw new Error(`Auth failed: ${creds.ADMIN_PASSWORD}`);
  evidence.request.body = body + creds.API_KEY;
```

### **In Evidence:**

```
✅ ALLOWED (MASKED):
  Finding evidence shows:
    Request: POST /api/login?user=admin***&pass=****
    Response: {"token": "eyJhbGc...***"}

❌ NEVER ALLOWED:
  Request: POST /api/login?user=admin_test_001&pass=TempAdmin123!@#
  Response with actual password visible
```

### **In Findings JSON:**

```
✅ CORRECT:
{
  "evidence": {
    "request": "POST /login?user=admin_test_***&pass=***",
    "tool_output": "Successfully authenticated as user ***",
    "note": "Actual credentials not stored, masked for security"
  }
}

❌ WRONG:
{
  "evidence": {
    "request": "POST /login?user=admin_test_001&pass=TempAdmin123!@#",
    "credentials_used": "admin_test_001 / TempAdmin123!@#"
  }
}
```

### **In Report:**

```
✅ Final report shows:
  "Tested with temporary test account (admin_test_***)
   Valid authentication confirmed
   Authorization bypass from contractor role to admin role"

❌ Never shows:
  Actual credentials
  Password hashes
  API keys
  Database connection strings
```

---

## 🙋 HUMAN APPROVAL GATE

### **Purpose**

Before ANY finding is reported to client:
- Human security reviewer validates finding
- Human approves severity & remediation
- Human confirms no false positives
- Human ensures professional presentation

### **Execution Flow**

```
Finding Passes Validation Gates (4-layer)
    ↓
[HUMAN APPROVAL GATE]
    ├─ Severity Review
    │  ├─ CVSS score appropriate?
    │  ├─ Impact assessment accurate?
    │  └─ Business impact clear?
    │
    ├─ False Positive Check
    │  ├─ Is this really exploitable?
    │  ├─ Would this trigger false alert?
    │  └─ Have we tested this correctly?
    │
    ├─ Remediation Review
    │  ├─ Fix is technically sound?
    │  ├─ Effort estimate reasonable?
    │  └─ Code examples correct?
    │
    ├─ Presentation Review
    │  ├─ Professional language?
    │  ├─ Clear for client?
    │  ├─ No internal jargon?
    │  └─ Appropriate tone?
    │
    └─ Approval Decision
       ├─ ✅ APPROVED → Include in report
       ├─ 🔄 REQUEST CHANGES → Agent fixes
       └─ ❌ REJECT → Remove from report
```

### **Critical Finding Approval (CVSS 7.0+)**

```
CVSS Score >= 7.0 (Critical/High)
    ↓
MUST have human approval before reporting
    ├─ Security Lead reviews
    ├─ TL;DR for executive summary
    └─ Approve/Reject decision required

Process:
  1. Agent creates finding
  2. Passes 4-layer validation ✅
  3. Marked for human review 🙋
  4. Security Lead receives notification
  5. Lead reviews full finding (evidence, impact, fix)
  6. Lead provides approval or requests changes
  7. If changes needed, agent revises
  8. Final approval from Lead
  9. Finding included in report ✅
```

### **Human Approval Checklist**

```
SECURITY LEAD CHECKLIST:

Finding ID: ___________
Severity: ___________
Agent: ___________

☐ SEVERITY REVIEW
  ☐ CVSS score matches impact
  ☐ Impact assessment is accurate
  ☐ Business impact is clear
  ☐ Severity appropriate for client

☐ FALSE POSITIVE CHECK
  ☐ Vulnerability is real (not theoretical)
  ☐ Reproducible as described
  ☐ Not a known false positive
  ☐ Evidence is authentic

☐ REMEDIATION REVIEW
  ☐ Fix is technically correct
  ☐ Effort estimate is realistic
  ☐ Code examples are safe to use
  ☐ No dependencies missing

☐ PRESENTATION REVIEW
  ☐ Language is professional
  ☐ Clear for client to understand
  ☐ No internal terminology
  ☐ Appropriate tone for severity
  ☐ No PII exposed

APPROVAL DECISION:
  ☐ APPROVED - Include in report
  ☐ APPROVED WITH CHANGES (specify below)
  ☐ REJECTED - Do not include in report

Changes Required (if applicable):
  _________________________________
  _________________________________

Approved By: ___________
Date/Time: ___________
Signature: ___________
```

### **Approval Workflow in Claude Code**

```
When running penetration test in Claude Code:

Me: "Critical finding detected - WEB-001 (XSS, CVSS 8.2)"
    [Finds vulnerability]
    [Passes 4-layer validation ✅]
    [Marked for human approval 🙋]

You: Review and approve/reject
     Me: "Do you approve WEB-001 for reporting?"
     
     [You review the full finding details]
     [You make decision]
     
You: "APPROVED - Include in report" ✅
     OR
     "REQUEST CHANGES - Evidence needs..."
     OR
     "REJECTED - This is a false positive because..."

Me: [Takes your decision]
    ✅ If approved → Include in final report
    🔄 If changes → Agent revises and resubmits
    ❌ If rejected → Finding excluded, logged
```

### **Critical Findings Requiring Approval**

```
Always require human approval for:

CVSS >= 7.0 (Critical/High):
  ☐ All findings CVSS 7.0+
  ☐ SQL Injection
  ☐ RCE (Remote Code Execution)
  ☐ Authentication Bypass
  ☐ Privilege Escalation to Admin
  ☐ Data Breach (> 100 records)
  ☐ Complete System Compromise

CVSS 5.0-6.9 (Medium/High):
  ☐ First-time vulnerability type
  ☐ Unusual exploitation path
  ☐ Potential for chaining
  ☐ Affects sensitive data

CVSS < 5.0 (Low/Medium):
  ☐ Auto-approved unless unusual
  ☐ Can be bulk-approved by lead
```

### **Approval Metrics**

```
Track approval statistics:

Per Engagement:
  Total findings created: X
  Passed validation gates: Y
  Submitted for human approval: Y
  Human-approved for reporting: Z
  Human-rejected: A
  Requested changes: B
  
  Approval rate: Z/Y%
  False positive rate: A/Y%
  Change request rate: B/Y%
  
Example:
  100 findings created
  92 passed validation gates
  92 submitted for approval
  85 approved for reporting
  5 rejected (false positives)
  2 requested changes
  
  Approval rate: 93%
  False positive rate: 5.4%
  Change rate: 2.2%
```

---

## 📁 FILE STRUCTURE WITH SECURITY

```
SecurityTestingMultiAgentWithKali/
│
├─ .gitignore (includes /.secrets, /.env)
│
└─ engagements/
   └─ my-client/
      ├─ config.yaml             ✅ Safe to commit
      ├─ scope.md                ✅ Safe to commit
      ├─ .secrets                ❌ NEVER commit (git-ignored)
      │  └─ Contains:
      │     - TARGET_URL
      │     - ADMIN_USERNAME
      │     - ADMIN_PASSWORD
      │     - API_KEYS
      │     - DB_CREDENTIALS
      │
      ├─ .env                    ❌ NEVER commit (git-ignored)
      │  └─ Loads .secrets securely
      │
      ├─ evidence/
      │  ├─ findings/
      │  │  └─ [FINDINGS WITH MASKED CREDS] ✅ Safe
      │  ├─ raw/
      │  │  └─ [Raw evidence, PII masked] ✅ Safe
      │  └─ screenshots/
      │     └─ [Screenshots, creds masked] ✅ Safe
      │
      └─ report/
         └─ report.html          ✅ Safe to share with client
            └─ All PII masked, no credentials shown
```

---

## 🔐 SECURITY GUARANTEES

```
✅ Credentials Never:
  - Logged in console output
  - Shown in findings
  - Exposed in reports
  - Committed to git
  - Shared unencrypted
  - Left in evidence files

✅ Agent Behavior:
  - Load credentials from .secrets
  - Use credentials only for testing
  - Mask credentials in evidence
  - Never log passwords
  - Clean up after use

✅ Approval Process:
  - Human reviews critical findings
  - Human approves severity
  - Human checks for false positives
  - Human signs off on each finding
  - Audit trail of approvals

✅ Report Security:
  - All credentials masked
  - No PII in report
  - No raw passwords
  - No API keys exposed
  - Safe to share with client
```

---

## 🚀 WORKFLOW EXAMPLE

```
ENGAGEMENT: acme-corp

Step 1: Setup
  $ bash scripts/setup-engagement.sh acme-corp
  $ nano engagements/acme-corp/.secrets
    [Fill in credentials]
  $ source engagements/acme-corp/.env
    ✅ Credentials loaded

Step 2: Run Test in Claude Code
  Me: "Run web-pentest-agent for acme-corp"
  [Agent loads .secrets automatically]
  [Agent uses credentials for testing]
  [Agent masks credentials in findings]
  
Step 3: Critical Finding Found
  Finding: WEB-001 XSS (CVSS 8.2)
  Status: Passed validation ✅
  Action: Requires human approval 🙋
  
Step 4: Human Approval
  You: "Review WEB-001 findings"
  Me: [Shows full finding, evidence, remediation]
  You: "APPROVED - Include in report"
  
Step 5: Report Generation
  Finding included in report ✅
  Credentials masked in report ✅
  Report safe to share with client ✅

Step 6: Client Delivery
  $ cat engagements/acme-corp/report/report.html
  [Shows professional finding without exposed credentials]
```

---

## 🎯 FINAL SECURITY CHECKLIST

```
BEFORE DELIVERING REPORT:

☐ All .secrets files git-ignored
☐ No .secrets files committed
☐ All findings have masked credentials
☐ No API keys in report
☐ No passwords in evidence files
☐ No PII unmasked
☐ Human approval on critical findings
☐ Approval chain documented
☐ All changes traced to human approver
☐ Report is safe to share with client
```

---

**Complete credential protection + human approval system implemented.** 🔐

