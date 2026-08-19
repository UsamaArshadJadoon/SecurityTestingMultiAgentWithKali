#!/usr/bin/env node

/**
 * SIMPLIFIED CLI ENTRY POINT
 *
 * Just ask for:
 * 1. URL
 * 2. Credentials
 * 3. Role
 *
 * Everything else is automated!
 */

const { SimplifiedInputHandler } = require('../orchestrator/simplified-input-handler');
const { ToolIntegrationLayer } = require('../orchestrator/tool-integration-layer');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Step 1: Get user inputs (only 3 things!)
    const handler = new SimplifiedInputHandler();
    const config = await handler.getUserInputs();

    // Step 2: Display summary
    handler.displaySummary(config);

    // Step 3: Save configuration
    const configPath = path.join(process.cwd(), `.assessment-${config.assessmentId}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`💾 Config saved: ${configPath}\n`);

    // Step 4: Set environment variables
    process.env.JWT_SECRET = config.secrets.JWT_SECRET;
    process.env.REQUEST_SIGNING_SECRET = config.secrets.REQUEST_SIGNING_SECRET;
    process.env.KEYSTORE_MASTER_KEY = config.secrets.KEYSTORE_MASTER_KEY;
    process.env.NODE_ENV = 'production';

    // Step 5: Initialize framework
    console.log('🚀 Initializing framework...\n');

    const logger = {
      info: (msg) => console.log(`  ℹ️  ${msg}`),
      warn: (msg) => console.log(`  ⚠️  ${msg}`),
      error: (msg) => console.log(`  ❌ ${msg}`),
      debug: (msg) => console.log(`  🔍 ${msg}`)
    };

    const integration = new ToolIntegrationLayer(logger, logger);

    // Step 6: Start assessment
    console.log('📊 Starting assessment...\n');
    console.log(`   Target: ${config.target}`);
    console.log(`   Type: ${config.assessmentType}`);
    console.log(`   Intensity: ${config.intensityLevel}`);
    console.log(`   Duration: ${config.duration}\n`);

    const result = await integration.runAssessment({
      target: config.target,
      workflowType: config.assessmentType,
      intensityLevel: config.intensityLevel
    });

    // Step 7: Display results
    displayResults(result, config, handler);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * DISPLAY ASSESSMENT RESULTS
 */
function displayResults(result, config, handler) {
  console.clear();
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║            ASSESSMENT RESULTS & SUMMARY                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Summary stats
  console.log('📊 ASSESSMENT SUMMARY:');
  console.log(`   Target: ${result.target}`);
  console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`   Tools Used: ${result.tools.length}`);
  console.log(`   Vulnerabilities Found: ${result.vulnerabilities.length}\n`);

  // Severity breakdown
  const critical = result.vulnerabilities.filter(v => v.severity === 'CRITICAL');
  const high = result.vulnerabilities.filter(v => v.severity === 'HIGH');
  const medium = result.vulnerabilities.filter(v => v.severity === 'MEDIUM');
  const low = result.vulnerabilities.filter(v => v.severity === 'LOW');

  console.log('🎯 FINDINGS BREAKDOWN:');
  console.log(`   🔴 CRITICAL: ${critical.length}`);
  console.log(`   🟠 HIGH:     ${high.length}`);
  console.log(`   🟡 MEDIUM:   ${medium.length}`);
  console.log(`   🟢 LOW:      ${low.length}\n`);

  // Risk level
  console.log(`📈 OVERALL RISK: ${result.riskAssessment.overallRisk}`);
  console.log(`📊 RISK SCORE: ${result.riskAssessment.riskscore}/100\n`);

  // Top findings
  if (critical.length > 0) {
    console.log('🚨 CRITICAL FINDINGS:');
    critical.slice(0, 3).forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.type}`);
      console.log(`      Location: ${v.location}`);
      console.log(`      Fix: ${v.remediation.substring(0, 60)}...\n`);
    });
  }

  // Save full report
  const reportPath = path.join(process.cwd(), `report-${config.assessmentId}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  console.log(`📄 Full report saved: ${reportPath}`);
  console.log(`⚙️  Configuration saved: .assessment-${config.assessmentId}.json\n`);

  // Next steps
  console.log('✅ NEXT STEPS:');
  console.log('   1. Review findings above');
  console.log('   2. Check full report for detailed analysis');
  console.log('   3. Create remediation tickets for critical issues');
  console.log('   4. Schedule follow-up assessment after fixes\n');

  // Environment export option
  console.log('💡 TIP: Save configuration for reuse:');
  console.log(`   export ASSESSMENT_ID="${config.assessmentId}"`);
  console.log(`   export ASSESSMENT_TARGET="${config.target}"\n`);
}

/**
 * ERROR HANDLING
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// RUN
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { main };
