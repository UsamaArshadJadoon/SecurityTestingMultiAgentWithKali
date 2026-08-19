#!/usr/bin/env node

/**
 * SPECIALIZED PENETRATION TESTING WORKFLOWS
 *
 * Industry-standard assessment chains for:
 * - Web Application Security Testing
 * - API Security Assessment
 * - Cloud Infrastructure Testing
 * - Network & Infrastructure Testing
 * - Mobile Application Testing
 * - Container/Kubernetes Security
 * - OWASP Top 10 Testing
 * - Data Breach Risk Assessment
 */

class SpecializedWorkflows {
  /**
   * WEB APPLICATION SECURITY TESTING
   * OWASP Top 10 focused assessment
   */
  static createWebApplicationWorkflow(orchestrator) {
    orchestrator.defineChain('web-app-security', [
      // Phase 1: Reconnaissance
      { name: 'nikto', config: { timeout: 300000 } },           // Server scan
      { name: 'wafw00f', config: { timeout: 60000 } },          // WAF detection
      { name: 'robots-analyzer', config: { timeout: 30000 } },  // robots.txt analysis

      // Phase 2: Web Vulnerabilities (OWASP Top 10)
      {
        name: 'wfuzz',
        config: {
          timeout: 600000,
          condition: (out) => !out?.blocked_by_waf
        }
      },                                                         // Fuzzing
      { name: 'xsstrike', config: { timeout: 300000 } },        // XSS detection
      { name: 'sqlmap', config: { timeout: 600000 } },          // SQL injection
      { name: 'cmsmap', config: { timeout: 300000 } },          // CMS vulnerabilities

      // Phase 3: Authentication & Sessions
      { name: 'hydra', config: { timeout: 300000 } },           // Brute force
      { name: 'burpsuite', config: { timeout: 900000 } },       // Session analysis

      // Phase 4: API Testing (if applicable)
      {
        name: 'arjun',
        config: {
          timeout: 300000,
          condition: (out) => out?.has_api_endpoints
        }
      },

      // Phase 5: Server Misconfiguration
      { name: 'testssl', config: { timeout: 300000 } },         // SSL/TLS testing
      { name: 'security-headers-check', config: { timeout: 60000 } }
    ], {
      strategy: 'conditional',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 3600000
    });
  }

  /**
   * API SECURITY ASSESSMENT
   * RESTful & GraphQL API testing
   */
  static createAPISecurityWorkflow(orchestrator) {
    orchestrator.defineChain('api-security', [
      // API Discovery & Reconnaissance
      { name: 'arjun', config: { timeout: 300000 } },           // Parameter discovery
      { name: 'nuclei', config: { timeout: 300000 } },          // API template scanning

      // API Endpoint Enumeration
      { name: 'graphql-playground', config: { timeout: 120000 } },
      { name: 'swagger-ui', config: { timeout: 120000 } },
      { name: 'postman', config: { timeout: 120000 } },

      // Authentication Testing
      { name: 'jwt-fuzzer', config: { timeout: 300000 } },
      { name: 'oauth-validator', config: { timeout: 300000 } },

      // Injection Testing
      { name: 'sqlmap', config: { timeout: 600000 } },          // SQL injection
      { name: 'xsstrike', config: { timeout: 300000 } },        // XSS in APIs
      { name: 'xml-xxe-tester', config: { timeout: 300000 } },  // XXE injection

      // API-Specific Vulnerabilities
      { name: 'rate-limit-tester', config: { timeout: 300000 } },
      { name: 'cors-tester', config: { timeout: 120000 } },
      { name: 'api-versioning-check', config: { timeout: 120000 } },

      // Data Exposure
      { name: 'api-response-analyzer', config: { timeout: 300000 } },
      { name: 'sensitive-data-scanner', config: { timeout: 300000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 4800000
    });
  }

  /**
   * CLOUD INFRASTRUCTURE SECURITY
   * AWS, Azure, GCP assessment
   */
  static createCloudSecurityWorkflow(orchestrator) {
    orchestrator.defineChain('cloud-security', [
      // Cloud Service Discovery
      { name: 'cloud-mapper', config: { timeout: 300000 } },
      { name: 's3-scanner', config: { timeout: 300000 } },
      { name: 'bucket-finder', config: { timeout: 300000 } },
      { name: 'shodan', config: { timeout: 120000 } },          // Cloud endpoints

      // Configuration Assessment
      { name: 'cloudmapper', config: { timeout: 600000 } },
      { name: 'prowler', config: { timeout: 600000 } },         // AWS security audit
      { name: 'azure-scanner', config: { timeout: 600000 } },
      { name: 'gcp-auditor', config: { timeout: 600000 } },

      // Credential & API Key Detection
      { name: 'truffleHog', config: { timeout: 300000 } },
      { name: 'detect-secrets', config: { timeout: 300000 } },
      { name: 'gitleaks', config: { timeout: 300000 } },

      // IAM & Access Control
      { name: 'iam-analyzer', config: { timeout: 300000 } },
      { name: 'policy-simulator', config: { timeout: 300000 } },

      // Network Exposure
      { name: 'security-group-analyzer', config: { timeout: 300000 } },
      { name: 'vpc-peering-check', config: { timeout: 300000 } },

      // Data Exposure
      { name: 'database-exposure-check', config: { timeout: 300000 } },
      { name: 'backup-exposure-scanner', config: { timeout: 300000 } }
    ], {
      strategy: 'parallel',
      aggregateResults: true,
      timeout: 3600000
    });
  }

  /**
   * NETWORK & INFRASTRUCTURE TESTING
   * Internal network security assessment
   */
  static createNetworkSecurityWorkflow(orchestrator) {
    orchestrator.defineChain('network-security', [
      // Network Discovery
      { name: 'nmap', config: { timeout: 600000 } },
      { name: 'masscan', config: { timeout: 600000 } },
      { name: 'netdiscover', config: { timeout: 300000 } },

      // Service Enumeration
      { name: 'nmap-service-detection', config: { timeout: 600000 } },
      { name: 'banner-grabber', config: { timeout: 300000 } },
      { name: 'service-version-scanner', config: { timeout: 300000 } },

      // Vulnerability Assessment
      { name: 'nessus', config: { timeout: 1800000 } },
      { name: 'openvas', config: { timeout: 1800000 } },
      { name: 'nexpose', config: { timeout: 1800000 } },

      // Protocol Testing
      { name: 'testssl', config: { timeout: 300000 } },
      { name: 'smb-enum', config: { timeout: 300000 } },
      { name: 'snmp-enum', config: { timeout: 300000 } },
      { name: 'ldap-enum', config: { timeout: 300000 } },

      // Firewall & IDS Testing
      { name: 'firewalk', config: { timeout: 300000 } },
      { name: 'ids-evasion-test', config: { timeout: 600000 } },

      // Wireless (if applicable)
      {
        name: 'aircrack-ng',
        config: {
          timeout: 600000,
          condition: (out) => out?.wireless_networks_found
        }
      },

      // Active Directory (if applicable)
      {
        name: 'bloodhound',
        config: {
          timeout: 600000,
          condition: (out) => out?.ad_detected
        }
      }
    ], {
      strategy: 'conditional',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 7200000
    });
  }

  /**
   * MOBILE APPLICATION SECURITY
   * iOS & Android assessment
   */
  static createMobileSecurityWorkflow(orchestrator) {
    orchestrator.defineChain('mobile-security', [
      // APK/App Analysis
      { name: 'apktool', config: { timeout: 300000 } },
      { name: 'frida', config: { timeout: 600000 } },
      { name: 'burpsuite-mobile', config: { timeout: 900000 } },

      // Static Analysis
      { name: 'androguard', config: { timeout: 300000 } },
      { name: 'mobsf', config: { timeout: 600000 } },
      { name: 'quark-engine', config: { timeout: 300000 } },

      // Dynamic Analysis
      { name: 'xposed', config: { timeout: 600000 } },
      { name: 'runtime-monitor', config: { timeout: 600000 } },

      // Communication Testing
      { name: 'interceptor', config: { timeout: 300000 } },
      { name: 'certificate-pinning-checker', config: { timeout: 300000 } },
      { name: 'api-fuzzer', config: { timeout: 600000 } },

      // Local Storage Testing
      { name: 'data-storage-scanner', config: { timeout: 300000 } },
      { name: 'shared-preferences-checker', config: { timeout: 300000 } },
      { name: 'database-dumper', config: { timeout: 300000 } },

      // Authentication & Sessions
      { name: 'biometric-bypass-tester', config: { timeout: 300000 } },
      { name: 'session-hijacking-test', config: { timeout: 300000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 7200000
    });
  }

  /**
   * CONTAINER & KUBERNETES SECURITY
   * Docker, Kubernetes, container orchestration
   */
  static createContainerSecurityWorkflow(orchestrator) {
    orchestrator.defineChain('container-security', [
      // Container Image Analysis
      { name: 'trivy', config: { timeout: 600000 } },
      { name: 'grype', config: { timeout: 600000 } },
      { name: 'anchore', config: { timeout: 600000 } },
      { name: 'clair', config: { timeout: 600000 } },

      // Container Registry Scanning
      { name: 'registry-scanner', config: { timeout: 300000 } },
      { name: 'image-history-analyzer', config: { timeout: 300000 } },

      // Kubernetes Cluster Assessment
      { name: 'kubesec', config: { timeout: 300000 } },
      { name: 'kubebench', config: { timeout: 600000 } },
      { name: 'kube-hunter', config: { timeout: 900000 } },
      { name: 'polaris', config: { timeout: 600000 } },

      // RBAC Testing
      { name: 'rbac-checker', config: { timeout: 300000 } },
      { name: 'privilege-escalation-test', config: { timeout: 300000 } },

      // Network Policies
      { name: 'netpol-validator', config: { timeout: 300000 } },
      { name: 'service-mesh-analyzer', config: { timeout: 600000 } },

      // Secret Management
      { name: 'secret-scanner', config: { timeout: 300000 } },
      { name: 'vault-auditor', config: { timeout: 300000 } },

      // Runtime Security
      { name: 'falco', config: { timeout: 600000 } },
      { name: 'seccomp-profile-test', config: { timeout: 300000 } }
    ], {
      strategy: 'parallel',
      aggregateResults: true,
      timeout: 7200000
    });
  }

  /**
   * OWASP TOP 10 FOCUSED TESTING
   * Methodical testing against OWASP Top 10 2021
   */
  static createOWASPTop10Workflow(orchestrator) {
    orchestrator.defineChain('owasp-top10', [
      // A01: Broken Access Control
      { name: 'access-control-tester', config: { timeout: 600000 } },
      { name: 'privilege-escalation-scanner', config: { timeout: 600000 } },
      { name: 'horizontal-escalation-tester', config: { timeout: 600000 } },

      // A02: Cryptographic Failures
      { name: 'crypto-weakness-scanner', config: { timeout: 300000 } },
      { name: 'ssl-tester', config: { timeout: 300000 } },
      { name: 'data-exposure-scanner', config: { timeout: 600000 } },

      // A03: Injection
      { name: 'sqlmap', config: { timeout: 600000 } },
      { name: 'nosql-injection-tester', config: { timeout: 600000 } },
      { name: 'ldap-injection-tester', config: { timeout: 300000 } },
      { name: 'xml-injection-tester', config: { timeout: 300000 } },
      { name: 'os-injection-tester', config: { timeout: 300000 } },

      // A04: Insecure Design
      { name: 'architecture-analyzer', config: { timeout: 300000 } },
      { name: 'threat-model-validator', config: { timeout: 300000 } },

      // A05: Security Misconfiguration
      { name: 'config-auditor', config: { timeout: 600000 } },
      { name: 'default-credentials-tester', config: { timeout: 300000 } },
      { name: 'security-headers-checker', config: { timeout: 300000 } },

      // A06: Vulnerable & Outdated Components
      { name: 'dependency-checker', config: { timeout: 600000 } },
      { name: 'sca-scanner', config: { timeout: 600000 } },

      // A07: Authentication Failures
      { name: 'auth-weakness-scanner', config: { timeout: 600000 } },
      { name: 'session-management-tester', config: { timeout: 600000 } },
      { name: 'mfa-bypass-tester', config: { timeout: 300000 } },

      // A08: Software & Data Integrity Failures
      { name: 'supply-chain-auditor', config: { timeout: 600000 } },
      { name: 'code-integrity-checker', config: { timeout: 300000 } },

      // A09: Logging & Monitoring Failures
      { name: 'log-coverage-analyzer', config: { timeout: 300000 } },
      { name: 'incident-response-tester', config: { timeout: 300000 } },

      // A10: SSRF
      { name: 'ssrf-tester', config: { timeout: 600000 } },
      { name: 'internal-service-scanner', config: { timeout: 600000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 10800000
    });
  }

  /**
   * DATA BREACH RISK ASSESSMENT
   * Focused on data sensitivity and exposure
   */
  static createDataBreachRiskWorkflow(orchestrator) {
    orchestrator.defineChain('data-breach-risk', [
      // Data Discovery
      { name: 'data-classifier', config: { timeout: 600000 } },
      { name: 'sensitive-data-scanner', config: { timeout: 900000 } },
      { name: 'pii-detector', config: { timeout: 600000 } },

      // Storage & Transmission
      { name: 'unencrypted-storage-finder', config: { timeout: 600000 } },
      { name: 'weak-encryption-detector', config: { timeout: 300000 } },
      { name: 'ssl-tester', config: { timeout: 300000 } },
      { name: 'certificate-validator', config: { timeout: 300000 } },

      // Access Control
      { name: 'access-control-auditor', config: { timeout: 600000 } },
      { name: 'permission-scanner', config: { timeout: 300000 } },

      // Data Exfiltration Risks
      { name: 'exfiltration-vector-finder', config: { timeout: 600000 } },
      { name: 'api-data-leak-scanner', config: { timeout: 600000 } },

      // Backup & Recovery
      { name: 'backup-exposure-checker', config: { timeout: 600000 } },
      { name: 'disaster-recovery-tester', config: { timeout: 300000 } },

      // Compliance
      { name: 'gdpr-compliance-checker', config: { timeout: 600000 } },
      { name: 'hipaa-compliance-auditor', config: { timeout: 600000 } },
      { name: 'pci-dss-validator', config: { timeout: 600000 } }
    ], {
      strategy: 'parallel',
      aggregateResults: true,
      timeout: 7200000
    });
  }

  /**
   * INCIDENT RESPONSE & FORENSICS
   * Post-breach investigation and forensics
   */
  static createIncidentResponseWorkflow(orchestrator) {
    orchestrator.defineChain('incident-response', [
      // Initial Triage
      { name: 'breach-scope-analyzer', config: { timeout: 300000 } },
      { name: 'affected-systems-finder', config: { timeout: 600000 } },

      // Evidence Collection
      { name: 'log-aggregator', config: { timeout: 600000 } },
      { name: 'memory-dumper', config: { timeout: 300000 } },
      { name: 'disk-analyzer', config: { timeout: 1800000 } },

      // Threat Hunting
      { name: 'ioc-scanner', config: { timeout: 900000 } },
      { name: 'malware-detector', config: { timeout: 600000 } },
      { name: 'lateral-movement-detector', config: { timeout: 600000 } },

      // Timeline Reconstruction
      { name: 'timeline-builder', config: { timeout: 600000 } },
      { name: 'attack-chain-analyzer', config: { timeout: 600000 } },

      // Attribution
      { name: 'threat-actor-profiler', config: { timeout: 600000 } },
      { name: 'campaign-tracker', config: { timeout: 600000 } },

      // Remediation Verification
      { name: 'fix-validator', config: { timeout: 600000 } },
      { name: 'persistence-checker', config: { timeout: 600000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 14400000
    });
  }

  /**
   * SUPPLY CHAIN SECURITY
   * Third-party and dependency assessment
   */
  static createSupplyChainSecurityWorkflow(orchestrator) {
    orchestrator.defineChain('supply-chain-security', [
      // Vendor Discovery
      { name: 'vendor-mapper', config: { timeout: 600000 } },
      { name: 'third-party-scanner', config: { timeout: 600000 } },

      // Dependency Analysis
      { name: 'sbom-generator', config: { timeout: 300000 } },
      { name: 'dependency-checker', config: { timeout: 600000 } },
      { name: 'vulnerability-scanner', config: { timeout: 600000 } },

      // Code Review
      { name: 'sast-scanner', config: { timeout: 900000 } },
      { name: 'static-analysis', config: { timeout: 900000 } },

      // Build Security
      { name: 'build-pipeline-auditor', config: { timeout: 600000 } },
      { name: 'artifact-validator', config: { timeout: 300000 } },

      // Provenance
      { name: 'provenance-checker', config: { timeout: 300000 } },
      { name: 'signature-validator', config: { timeout: 300000 } },

      // Runtime Verification
      { name: 'runtime-scanner', config: { timeout: 600000 } },
      { name: 'behavior-analyzer', config: { timeout: 600000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 7200000
    });
  }

  /**
   * THREAT MODELING & VALIDATION
   * Validate against threat models
   */
  static createThreatModelingWorkflow(orchestrator) {
    orchestrator.defineChain('threat-modeling', [
      // Extract Architecture
      { name: 'architecture-extractor', config: { timeout: 600000 } },
      { name: 'data-flow-mapper', config: { timeout: 300000 } },
      { name: 'trust-boundary-analyzer', config: { timeout: 300000 } },

      // Threat Enumeration
      { name: 'stride-validator', config: { timeout: 600000 } },
      { name: 'attack-tree-builder', config: { timeout: 600000 } },

      // Vulnerability Mapping
      { name: 'cwe-mapper', config: { timeout: 300000 } },
      { name: 'cvss-calculator', config: { timeout: 300000 } },

      // Exploit Testing
      { name: 'attack-simulation', config: { timeout: 1200000 } },
      { name: 'mitigation-validator', config: { timeout: 600000 } }
    ], {
      strategy: 'sequential',
      passOutputToNext: true,
      aggregateResults: true,
      timeout: 7200000
    });
  }
}

module.exports = { SpecializedWorkflows };
