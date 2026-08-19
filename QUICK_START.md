# 🚀 Quick Start - 3 Inputs Only!

## The Simplest Way to Run Assessments

You only need to provide **3 things**:

1. **Target URL** (what to test)
2. **Credentials** (how to access it)
3. **Role** (what type of assessment)

**Everything else is automatic!**

---

## Installation (5 minutes)

```bash
# 1. Clone repo
git clone https://github.com/your-org/SecurityTestingMultiAgentWithKali.git
cd SecurityTestingMultiAgentWithKali

# 2. Install dependencies
npm install

# 3. Run assessment
npm run assess
```

---

## Run First Assessment

```bash
npm run assess
```

**You'll be asked:**

```
1️⃣  TARGET URL
   🔗 Enter target URL: example.com

2️⃣  CREDENTIALS
   👤 Username (or API key): admin
   🔐 Password (or token): ••••••••

3️⃣  ASSESSMENT TYPE
   1. Web Application
   2. REST API
   3. Cloud Infrastructure
   ... (9 more options)
   
   🎯 Select option (1-11): 1
```

**That's it!** Framework handles:
- ✅ URL validation & normalization
- ✅ Credential type detection
- ✅ Assessment intensity selection
- ✅ Secret generation & configuration
- ✅ Integration setup
- ✅ Report generation

---

## What Happens Next

### 1. Configuration Summary
```
📍 Target URL:              https://example.com
🎯 Assessment Type:         WEB-APP
⚡ Intensity Level:         STANDARD
⏱️  Estimated Duration:      30-120 minutes
🔑 Credentials:             admin (basic-auth)
```

### 2. Assessment Runs
```
🚀 Initializing framework...
📊 Starting assessment...

   Target: https://example.com
   Type: web-app
   Intensity: standard
   Duration: 30-120 minutes
```

### 3. Results Displayed
```
📊 ASSESSMENT SUMMARY:
   Target: https://example.com
   Duration: 45.3s
   Tools Used: 8
   Vulnerabilities Found: 12

🎯 FINDINGS BREAKDOWN:
   🔴 CRITICAL: 2
   🟠 HIGH:     4
   🟡 MEDIUM:   5
   🟢 LOW:      1

📈 OVERALL RISK: HIGH
📊 RISK SCORE: 72/100
```

---

## Assessment Types (Choose One)

| # | Type | Duration | Best For |
|---|------|----------|----------|
| 1 | Web App | 30-120m | Websites, web applications |
| 2 | REST API | 1-2h | API endpoints, microservices |
| 3 | Cloud | 1-3h | AWS, Azure, GCP accounts |
| 4 | Network | 2-6h | Internal networks, servers |
| 5 | Mobile | 2-4h | iOS, Android applications |
| 6 | Container | 1-2h | Docker, Kubernetes |
| 7 | OWASP | 3-6h | Compliance, standards |
| 8 | Data Risk | 1-2h | Data exposure assessment |
| 9 | Incident | 2-8h | Post-breach investigation |
| 10 | Supply Chain | 1-3h | Dependencies, third-party |
| 11 | Threat | 2-4h | Design validation |

---

## Real Examples

### Example 1: Test Company Website
```
🔗 Enter target URL: company.com
👤 Username: admin@company.com
🔐 Password: ••••••••
🎯 Select option: 1 (Web App)

⏱️  Duration: ~45 minutes
```

### Example 2: Test Internal API
```
🔗 Enter target URL: api.internal.com
👤 Username: api_key_12345
🔐 Password: secret_token
🎯 Select option: 2 (REST API)

⏱️  Duration: ~1 hour
```

### Example 3: Audit AWS Account
```
🔗 Enter target URL: aws-account
👤 Username: AWS_ACCESS_KEY
🔐 Password: AWS_SECRET_KEY
🎯 Select option: 3 (Cloud)

⏱️  Duration: ~2 hours
```

---

## What Gets Auto-Configured

✅ **URL Validation**
- Detects IP addresses vs domains
- Adds HTTPS if needed
- Normalizes format

✅ **Credentials Detection**
- API keys (sk_*, api_*)
- Bearer tokens
- Basic auth
- Public access

✅ **Assessment Intensity**
- Rapid (5-15 min) - quick check
- Standard (30-120 min) - typical
- Thorough (2-6 hours) - comprehensive

✅ **Security Setup**
- Generates 3 secret keys
- Configures JWT authentication
- Sets up encryption at rest
- Enables audit logging

✅ **Integrations**
- SIEM (if configured)
- Bug trackers (if configured)
- Slack notifications (if configured)

✅ **Reports**
- JSON report with full findings
- Assessment configuration saved
- Credentials safely stored
- Results analysis included

---

## View Reports

### JSON Report
```bash
cat report-{assessment-id}.json | jq '.'
```

### Quick Summary
```bash
npm run report {assessment-id}
```

### Create Tickets
```bash
npm run create-tickets {assessment-id}
```

---

## Common Credentials Types

### Web App (Basic Auth)
```
Username: admin
Password: admin123
```

### API (Bearer Token)
```
Username: sk_live_abc123xyz
Password: (leave empty or use token)
```

### Cloud (AWS)
```
Username: AKIA1234567890AB
Password: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Cloud (Azure)
```
Username: client-id
Password: client-secret
```

---

## Troubleshooting

### Issue: Target not accessible
```
❌ Invalid URL. Try again.

✅ Solution: Use full URL format
   ✓ example.com
   ✓ https://example.com
   ✓ 192.168.1.1
   ✓ 192.168.1.0/24 (CIDR)
```

### Issue: Invalid credentials
```
Check credentials format:
- Username should match target type
- Password should be actual password/token
- API keys should start with prefix (sk_, api_)
```

### Issue: Unknown assessment type
```
Select only 1-11 from the options shown
Type the number and press Enter
```

---

## Command Reference

```bash
# Run interactive assessment
npm run assess

# Run with specific target (skip URL prompt)
npm run assess -- --url=example.com

# Run with all inputs
npm run assess -- --url=example.com --user=admin --pass=secret --role=web-app

# View previous assessment
npm run report {assessment-id}

# Run tests
npm test

# View logs
npm run logs

# View current assessments
npm run list-assessments
```

---

## Need Help?

1. **Full documentation**: See `docs/framework-documentation.md`
2. **Installation issues**: See "Troubleshooting" section above
3. **Usage examples**: See `docs/framework-documentation.md` (Usage Examples)
4. **API reference**: See `docs/framework-documentation.md` (API Reference)

---

## What's Next?

After first assessment:

1. ✅ Review findings
2. ✅ Check critical vulnerabilities
3. ✅ Create remediation tickets
4. ✅ Schedule follow-up assessment
5. ✅ Set up continuous monitoring

---

**That's it! You're ready to start testing! 🚀**

**Run:** `npm run assess`
