# Templates Directory

This directory contains templates and schemas for the Security Testing Framework.

## Files

### finding-schema.json
JSON schema for validated security findings. All findings must conform to this schema:
- Required fields: id, title, description, severity, cvss_score, evidence, remediation
- Validates CVSS 3.1 vector format
- Ensures evidence includes proof of concept with request/response
- Requires code examples for remediation

### report/styles.css
The dark "case file" dossier design system shared by every generated report — CSS
custom properties for the severity/status palette, sticky nav + severity strip,
cover page, findings cards, priority-tier roadmap, sortable risk table, and
scroll-reveal animations. Consumed by `orchestrator/report-generator.js`, which
inlines it into each engagement's `report/report.html`. Edit this one file to
restyle every future report consistently.

## Usage

### Validating a Finding
```javascript
const schema = require('./templates/finding-schema.json');
const Ajv = require('ajv');
const ajv = new Ajv();
const validate = ajv.compile(schema);

const isValid = validate(finding);
if (!isValid) {
  console.log('Finding validation errors:', validate.errors);
}
```

### Creating a Finding
```json
{
  "finding_id": "FINDING-0001",
  "title": "SQL Injection in Login Form",
  "description": "The login endpoint is vulnerable to SQL injection...",
  "severity": "Critical",
  "cvss_score": 9.8,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "affected_component": "POST /api/login",
  "evidence": {
    "proof_of_concept": "Injecting ' OR '1'='1 returns all users",
    "request": "POST /api/login HTTP/1.1\nContent-Type: application/json\n\n{\"username\": \"admin' OR '1'='1\"}",
    "response": "HTTP/1.1 200 OK\n{\"users\": [{\"id\": 1, \"name\": \"admin\"}]}"
  },
  "remediation": {
    "description": "Use parameterized queries instead of string concatenation",
    "vulnerable_code": "const query = `SELECT * FROM users WHERE username = '${username}'`;",
    "fixed_code": "const query = 'SELECT * FROM users WHERE username = ?';\ndb.query(query, [username]);",
    "effort": "2-4 hours"
  },
  "owasp_category": "A03:2021 - Injection",
  "cwe_id": "CWE-89",
  "validation_status": "validated",
  "validation_date": "2024-07-30T00:00:00Z"
}
```

## Adding New Templates

To add new templates:
1. Create the template file in this directory
2. Document it in this README
3. Reference it in the framework documentation
4. Update the schema if needed
