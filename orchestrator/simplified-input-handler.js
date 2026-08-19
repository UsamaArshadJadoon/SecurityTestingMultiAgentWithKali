/**
 * SIMPLIFIED INPUT HANDLER
 *
 * Takes only 3 inputs from user:
 * 1. URL (target)
 * 2. Credentials (username/password or API keys)
 * 3. Role (assessment type)
 *
 * Everything else is automated
 */

const crypto = require('crypto');
const readline = require('readline');

class SimplifiedInputHandler {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * MAIN ENTRY POINT: Get all inputs from user
   */
  async getUserInputs() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     PROFESSIONAL PENETRATION TESTING FRAMEWORK v4.0       ║');
    console.log('║                   SIMPLE INPUT MODE                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📋 PROVIDE ASSESSMENT DETAILS:\n');

    // Get URL
    const url = await this.promptURL();

    // Get Credentials
    const credentials = await this.promptCredentials();

    // Get Role
    const role = await this.promptRole();

    // Build complete assessment config
    const config = this.buildAssessmentConfig(url, credentials, role);

    this.rl.close();
    return config;
  }

  /**
   * PROMPT 1: Get Target URL
   */
  async promptURL() {
    return new Promise((resolve) => {
      console.log('1️⃣  TARGET URL');
      console.log('   Examples: example.com, https://api.example.com, 192.168.1.0/24\n');

      this.rl.question('   🔗 Enter target URL: ', (answer) => {
        // Validate URL
        const validURL = this.validateURL(answer);
        if (!validURL) {
          console.log('   ❌ Invalid URL. Try again.\n');
          resolve(this.promptURL());
        } else {
          console.log(`   ✅ Target: ${validURL}\n`);
          resolve(validURL);
        }
      });
    });
  }

  /**
   * PROMPT 2: Get Credentials
   */
  async promptCredentials() {
    return new Promise((resolve) => {
      console.log('2️⃣  CREDENTIALS\n');

      this.rl.question('   👤 Username (or API key): ', (username) => {
        this.rl.question('   🔐 Password (or token): ', (password) => {
          console.log('   ✅ Credentials saved\n');

          resolve({
            username: username || 'anonymous',
            password: password || 'none',
            type: this.detectCredentialType(username, password)
          });
        });
      });
    });
  }

  /**
   * PROMPT 3: Get Assessment Role
   */
  async promptRole() {
    return new Promise((resolve) => {
      console.log('3️⃣  ASSESSMENT TYPE\n');

      const roles = [
        '1. Web Application',
        '2. REST API',
        '3. Cloud Infrastructure (AWS/Azure/GCP)',
        '4. Network & Infrastructure',
        '5. Mobile Application',
        '6. Docker/Kubernetes',
        '7. OWASP Top 10 (Compliance)',
        '8. Data Breach Risk',
        '9. Incident Response',
        '10. Supply Chain Security',
        '11. Threat Modeling'
      ];

      roles.forEach(role => console.log(`   ${role}`));
      console.log('');

      this.rl.question('   🎯 Select option (1-11): ', (answer) => {
        const roleMap = {
          '1': 'web-app',
          '2': 'api',
          '3': 'cloud',
          '4': 'network',
          '5': 'mobile',
          '6': 'container',
          '7': 'owasp',
          '8': 'data-risk',
          '9': 'incident-response',
          '10': 'supply-chain',
          '11': 'threat-model'
        };

        const selected = roleMap[answer];
        if (!selected) {
          console.log('   ❌ Invalid selection. Try again.\n');
          resolve(this.promptRole());
        } else {
          const roleNames = {
            'web-app': 'Web Application Testing',
            'api': 'API Security Assessment',
            'cloud': 'Cloud Infrastructure Audit',
            'network': 'Network Security Testing',
            'mobile': 'Mobile App Assessment',
            'container': 'Container Security Scan',
            'owasp': 'OWASP Top 10 Compliance',
            'data-risk': 'Data Breach Risk Assessment',
            'incident-response': 'Incident Response Investigation',
            'supply-chain': 'Supply Chain Security',
            'threat-model': 'Threat Modeling'
          };

          console.log(`   ✅ Selected: ${roleNames[selected]}\n`);
          resolve(selected);
        }
      });
    });
  }

  /**
   * BUILD COMPLETE ASSESSMENT CONFIG
   * Everything else is automated based on URL + Role
   */
  buildAssessmentConfig(url, credentials, role) {
    // Auto-detect intensity based on role
    const intensityMap = {
      'web-app': 'standard',      // 30-120 min
      'api': 'standard',           // 1-2 hours
      'cloud': 'thorough',         // 1-3 hours
      'network': 'thorough',       // 2-6 hours
      'mobile': 'thorough',        // 2-4 hours
      'container': 'standard',     // 1-2 hours
      'owasp': 'thorough',         // 3-6 hours
      'data-risk': 'standard',     // 1-2 hours
      'incident-response': 'thorough', // 2-8 hours
      'supply-chain': 'standard',  // 1-3 hours
      'threat-model': 'standard'   // 2-4 hours
    };

    // Auto-generate required secrets
    const secrets = {
      JWT_SECRET: crypto.randomBytes(32).toString('base64'),
      REQUEST_SIGNING_SECRET: crypto.randomBytes(32).toString('base64'),
      KEYSTORE_MASTER_KEY: crypto.randomBytes(32).toString('base64')
    };

    return {
      // User inputs
      target: url,
      credentials: credentials,
      assessmentType: role,

      // Auto-detected settings
      intensityLevel: intensityMap[role],
      duration: this.getDurationEstimate(role),

      // Auto-generated secrets
      secrets: secrets,

      // Auto-configured integrations
      integrations: {
        siem: process.env.SIEM_ENDPOINT ? true : false,
        bugTracker: process.env.BUG_TRACKER_URL ? true : false,
        slack: process.env.SLACK_WEBHOOK_URL ? true : false
      },

      // Assessment metadata
      timestamp: new Date(),
      assessmentId: crypto.randomBytes(8).toString('hex'),

      // Common settings for all roles
      rateLimit: {
        requestsPerSecond: 5,
        burstSize: 10
      },
      timeouts: {
        scanTimeout: 300000,        // 5 min per scan
        assessmentTimeout: 3600000  // 1 hour per assessment
      }
    };
  }

  /**
   * VALIDATION: URL
   */
  validateURL(url) {
    if (!url) return null;

    // Remove protocol if present
    url = url.replace(/^https?:\/\//, '');

    // Basic validation
    if (url.length < 3) return null;

    // Add protocol
    if (url.match(/^\d+\.\d+\.\d+\.\d+/)) {
      return url;  // IP address
    } else {
      return url.startsWith('https://') || url.startsWith('http://')
        ? url
        : `https://${url}`;
    }
  }

  /**
   * DETECT: Credential type
   */
  detectCredentialType(username, password) {
    if (username.includes('sk_') || username.includes('api_')) {
      return 'api-key';
    }
    if (password.includes('jwt_') || password.includes('Bearer ')) {
      return 'bearer-token';
    }
    if (username.includes('@') && password) {
      return 'credentials';
    }
    if (!username || !password) {
      return 'public';
    }
    return 'basic-auth';
  }

  /**
   * GET: Duration estimate for role
   */
  getDurationEstimate(role) {
    const estimates = {
      'web-app': '30-120 minutes',
      'api': '1-2 hours',
      'cloud': '1-3 hours',
      'network': '2-6 hours',
      'mobile': '2-4 hours',
      'container': '1-2 hours',
      'owasp': '3-6 hours',
      'data-risk': '1-2 hours',
      'incident-response': '2-8 hours',
      'supply-chain': '1-3 hours',
      'threat-model': '2-4 hours'
    };
    return estimates[role] || 'unknown';
  }

  /**
   * DISPLAY: Assessment summary
   */
  displaySummary(config) {
    console.clear();
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║           ASSESSMENT CONFIGURATION SUMMARY                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📍 Target URL:              ${config.target}`);
    console.log(`🎯 Assessment Type:         ${config.assessmentType.toUpperCase()}`);
    console.log(`⚡ Intensity Level:         ${config.intensityLevel.toUpperCase()}`);
    console.log(`⏱️  Estimated Duration:      ${config.duration}`);
    console.log(`🔑 Credentials:             ${config.credentials.username} (${config.credentials.type})`);
    console.log(`📊 Assessment ID:           ${config.assessmentId}`);
    console.log(`🔄 Rate Limiting:           ${config.rateLimit.requestsPerSecond} req/sec`);

    if (config.integrations.siem) console.log(`✅ SIEM Integration:        Enabled`);
    if (config.integrations.bugTracker) console.log(`✅ Bug Tracker:             Enabled`);
    if (config.integrations.slack) console.log(`✅ Slack Notifications:     Enabled`);

    console.log('\n✨ Assessment ready to begin!\n');
  }

  /**
   * EXPORT: Config as environment variables (SECURE)
   * NOTE: Secrets are NOT exported - they remain in memory only
   * Credentials password is NOT exported - use secret manager instead
   */
  exportAsEnv(config) {
    // Only safe, non-sensitive configuration
    const envVars = `
# Generated Assessment Configuration (Non-Sensitive Only)
export ASSESSMENT_ID="${config.assessmentId}"
export ASSESSMENT_TARGET="${config.target}"
export ASSESSMENT_TYPE="${config.assessmentType}"
export ASSESSMENT_INTENSITY="${config.intensityLevel}"

# User Credentials (Username only - password from secret manager)
export CREDENTIAL_USERNAME="${config.credentials.username}"
export CREDENTIAL_TYPE="${config.credentials.type}"

# Assessment Settings
export NODE_ENV="production"
export RATE_LIMIT=${config.rateLimit.requestsPerSecond}
export SCAN_TIMEOUT=${config.timeouts.scanTimeout}

# ⚠️  IMPORTANT SECURITY NOTES:
# - Secrets (JWT_SECRET, REQUEST_SIGNING_SECRET, KEYSTORE_MASTER_KEY) are auto-generated and kept in memory
# - Credential passwords are NOT exported - fetch from your secret manager
# - Never log or commit secrets to files
# - For production: Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
    `;
    return envVars.trim();
  }
}

module.exports = { SimplifiedInputHandler };

/**
 * USAGE:
 *
 * const { SimplifiedInputHandler } = require('./simplified-input-handler');
 *
 * const handler = new SimplifiedInputHandler();
 * const config = await handler.getUserInputs();
 *
 * handler.displaySummary(config);
 *
 * ⚠️  SECURITY: Secrets stay in memory, not exported
 * const envVars = handler.exportAsEnv(config);
 * // DO NOT log envVars - they contain no secrets but are for reference only
 *
 * // Secrets are auto-generated and stored in memory:
 * // config.secrets.JWT_SECRET
 * // config.secrets.REQUEST_SIGNING_SECRET
 * // config.secrets.KEYSTORE_MASTER_KEY
 *
 * // For production: Load secrets from vault
 * // process.env.JWT_SECRET = await vault.getSecret('jwt-secret');
 * // process.env.REQUEST_SIGNING_SECRET = await vault.getSecret('request-signing-secret');
 * // process.env.KEYSTORE_MASTER_KEY = await vault.getSecret('keystore-master-key');
 */
