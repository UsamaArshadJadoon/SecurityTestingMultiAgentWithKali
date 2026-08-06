# Agent-003H: API Rate Limiting & Throttling Bypass

## 🎯 Objectives

Test API rate limiting and throttling mechanisms to identify:
- Rate limit bypass techniques
- Distributed request optimization
- DDoS resilience evaluation
- Credential stuffing prevention gaps
- API quota manipulation

## 📋 Scope & Dependencies

**Depends On**:
- Agent-001 (Reconnaissance - target discovery)
- Agent-003 (API Security overview)
- Agent-003A (REST API testing)

**Tools Required**:
- `ab` (Apache Bench)
- `siege`
- `wrk`
- `hey`
- `k6` (Grafana k6)
- `curl`
- `Python` (requests library)
- Custom scripts for distributed testing

## 🔍 Testing Techniques

### 1. Rate Limit Header Bypass
- **X-Forwarded-For** manipulation (distributed origin spoofing)
- **X-Real-IP** header injection
- **X-Client-IP** header abuse
- **CF-Connecting-IP** (Cloudflare bypass)
- **User-Agent** rotation
- **Cookie-based** rate limit evasion

### 2. Distributed Request Generation
```bash
# Load test with multiple concurrent connections
ab -n 10000 -c 100 https://target.api/endpoint

# Gradual ramp-up testing
siege -u https://target.api/endpoint -c 50 -r 10 -b

# HTTP/2 multiplexing
wrk -t4 -c100 -d30s https://target.api/endpoint

# Threshold discovery
hey -n 10000 -c 100 https://target.api/endpoint
```

### 3. Token & Authentication Bypass
- **Expired token reuse** (server-side state mismatch)
- **Refresh token abuse** (automated refresh loops)
- **OAuth token scope bypass** (rate limiting at scope level)
- **API key rotation** (rapid key generation/usage)

### 4. Timing-Based Bypass
- **Request pacing optimization** (sub-threshold spacing)
- **Batch request timing** (exploiting window resets)
- **Clock skew exploitation** (time-based validation)

### 5. Endpoint Enumeration for Bypass
- Low-rate endpoints as pivot (bypass to restricted endpoints)
- **Wildcard path testing** (`/api/*`)
- **Version-based differences** (`/v1/` vs `/v2/`)

## ⚙️ Execution Steps

### Setup & Reconnaissance
```bash
# 1. Identify rate limit indicators
curl -I https://target.api/users | grep -i rate
curl -v https://target.api/users 2>&1 | grep -i "x-rate"

# 2. Map rate limit headers
curl -I https://target.api/users | head -20

# 3. Test basic rate limit
for i in {1..20}; do 
  curl -w "HTTP %{http_code}\n" -o /dev/null -s https://target.api/users
done
```

### Phase 1: Basic Rate Limit Discovery
```bash
# Test endpoint for rate limiting
curl -w "@curl-format.txt" -o /dev/null -s https://target.api/users
# Expected: 200 OK or 429 Too Many Requests

# Extract rate limit headers
curl -s -I https://target.api/users | grep -i "rate-limit\|ratelimit\|retry-after\|x-ratelimit"
```

### Phase 2: Bypass Technique Testing
```bash
# Test X-Forwarded-For bypass
for i in {1..50}; do
  curl -H "X-Forwarded-For: 10.0.0.$i" https://target.api/users
done

# Test header rotation
python3 rate-limit-bypass.py --target https://target.api/users --headers X-Forwarded-For,X-Real-IP,User-Agent
```

### Phase 3: Load Testing
```bash
# Gentle load test
ab -n 1000 -c 10 https://target.api/users

# Medium load
wrk -t2 -c50 -d30s https://target.api/users

# High load (if authorized)
k6 run rate-limit-test.js
```

### Phase 4: DDoS Resiliency Assessment
```bash
# Measure failure point
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://target.api/users)
  echo "Status: $STATUS"
  [ "$STATUS" = "429" ] && break
done
```

## 📊 Expected Findings

### Critical Findings
1. **No Rate Limiting Implemented**
   - Unlimited requests accepted
   - CVSS: 7.5 (High)
   - Impact: DDoS, credential stuffing, resource exhaustion

2. **Rate Limit Bypass via Header Injection**
   - X-Forwarded-For/X-Real-IP bypass
   - CVSS: 8.2 (High)
   - Impact: Threat actor can bypass protections

3. **Insufficient Rate Limit Thresholds**
   - >100 requests/second accepted
   - CVSS: 6.5 (Medium)
   - Impact: Reduced DDoS resilience

### High Findings
4. **Token Refresh Loop Exploitation**
   - Automated refresh bypasses rate limiting
   - CVSS: 7.8
   - Impact: Extended attack window

5. **Per-Endpoint Rate Limit Variation**
   - Some endpoints unprotected
   - CVSS: 6.8
   - Impact: Asymmetric attack surface

### Medium Findings
6. **Weak Rate Limit Reset Mechanism**
   - Predictable reset window
   - CVSS: 5.3
   - Impact: Optimization of attacks

## 🛡️ Remediation Code Examples

### Vulnerable Code (Express.js)
```javascript
// BAD: No rate limiting
app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    res.json(users);
  });
});
```

### Fixed Code (with express-rate-limit)
```javascript
const rateLimit = require("express-rate-limit");

// Good: Proper rate limiting with trusted proxy
const limiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 100,                   // Limit to 100 requests
  skip: (req) => req.user?.isAdmin === true,
  handler: (req, res) => res.status(429).json({ 
    error: "Too many requests" 
  }),
  trustProxy: 1,              // Trust first proxy
  standardHeaders: true,      // Send RateLimit headers
  legacyHeaders: false,       // Disable X-RateLimit-* headers
  keyGenerator: (req) => {
    // Use user ID if authenticated, IP otherwise
    return req.user?.id || req.ip;
  }
});

// Apply to critical endpoints
app.get('/api/users', limiter, (req, res) => {
  User.find({}, (err, users) => {
    res.json(users);
  });
});

// Stricter limits for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,  // Very strict
  skipSuccessfulRequests: true  // Only count failed attempts
});

app.post('/api/login', strictLimiter, (req, res) => {
  // Login logic
});
```

### Python/FastAPI Example
```python
from fastapi import FastAPI, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests"}
    )

@app.get("/users")
@limiter.limit("100/minute")
async def get_users(request: Request):
    return {"users": [...]}

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request):
    return {"token": "..."}
```

## ✅ Success Criteria

- [ ] Rate limit headers identified (X-RateLimit-*, Retry-After, etc.)
- [ ] Bypass techniques tested (header injection, token abuse)
- [ ] Failure point documented (requests/second)
- [ ] Load test results captured (ab/wrk/k6 output)
- [ ] DDoS impact assessment provided
- [ ] Clear remediation code included
- [ ] CVSS score justified
- [ ] Reproducible steps documented

## 🔗 Related CVEs & References

- CWE-770: Allocation of Resources Without Limits or Throttling
- CWE-307: Improper Restriction of Rendered UI Layers or Frames
- OWASP API2:2019 - Broken User Authentication
- Rate Limit Bypass Patterns: https://owasp.org/www-community/attacks/Rate_limit_bypass

## 📝 Notes

- Test during authorized testing window
- Monitor server resources during load testing
- Document all bypass techniques discovered
- Provide clear evidence of impact
- Include timing/coordination data for distributed attacks
