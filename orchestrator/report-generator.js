#!/usr/bin/env node

/**
 * REPORT GENERATOR
 *
 * Renders engagements/<name>/report/report.html from that engagement's
 * validated findings (evidence/findings/*.json, matching
 * templates/finding-schema.json), reusing the dark "case file" dossier
 * design system in templates/report/styles.css.
 *
 * Usage: node orchestrator/report-generator.js <engagement-name>
 */

const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');
const { validateFinding } = require('./validation-gate.js');

// Set by generateReport() at call time — supports both CLI use (name from
// argv) and programmatic use (name passed as a parameter, e.g. from
// Orchestrator.js). Single-instance/synchronous script, so a module-level
// "current engagement" is safe: report generation never runs concurrently
// for two engagements within the same process.
let ENGAGEMENT_NAME, ENGAGEMENT_PATH, FINDINGS_PATH, REPORT_DIR;
const STYLES_PATH = path.join(__dirname, '..', 'templates', 'report', 'styles.css');

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];
const PRIORITY_OF = { Critical: 'p0', High: 'p1', Medium: 'p2', Low: 'p3', Info: 'pv' };
const PRIORITY_LABEL = { p0: 'P0 — Fix Immediately', p1: 'P1 — Fix This Sprint', p2: 'P2 — Fix This Quarter', p3: 'P3 — Backlog', pv: 'Informational' };

// ============================================================================
// HELPERS
// ============================================================================

function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slug(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// js-yaml auto-parses unquoted YYYY-MM-DD scalars into JS Date objects; render
// those (and real Date instances generally) as a plain ISO date, not toString().
function fmtDate(value) {
  if (value === undefined || value === null || value === '') return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadConfig() {
  const configFile = path.join(ENGAGEMENT_PATH, 'config.yaml');
  if (!fs.existsSync(configFile)) {
    console.error(`❌ Config not found: ${configFile}`);
    process.exit(1);
  }
  return YAML.load(fs.readFileSync(configFile, 'utf8')) || {};
}

function loadScope() {
  const scopeFile = path.join(ENGAGEMENT_PATH, 'scope.md');
  const content = fs.existsSync(scopeFile) ? fs.readFileSync(scopeFile, 'utf8') : '';
  const grab = (label) => {
    const m = content.match(new RegExp(label + ':\\s*(.+)'));
    return m ? m[1].trim() : '';
  };
  const inScope = [...content.matchAll(/## In Scope\n([\s\S]*?)(\n##|\n$)/g)].map(m => m[1]);
  const outOfScope = [...content.matchAll(/## Out of Scope\n([\s\S]*?)(\n##|\n$)/g)].map(m => m[1]);
  const restrictions = [...content.matchAll(/## Restrictions\n([\s\S]*?)(\n##|\n$)/g)].map(m => m[1]);
  const roles = [...content.matchAll(/## Authorized Test Roles\n([\s\S]*?)(\n##|\n$)/g)].map(m => m[1]);
  return {
    authorizedBy: grab('Authorized By'),
    contact: grab('Contact'),
    date: grab('Date'),
    confirmed: /authorization\.confirmed:\s*true/.test(content),
    inScope: (inScope[0] || '').trim(),
    outOfScope: (outOfScope[0] || '').trim(),
    restrictions: (restrictions[0] || '').trim(),
    roles: (roles[0] || '').trim(),
  };
}

function loadFindings() {
  if (!fs.existsSync(FINDINGS_PATH)) return [];
  const files = fs.readdirSync(FINDINGS_PATH).filter(f => f.endsWith('.json'));
  const findings = [];
  let rejectedCount = 0;
  files.forEach(f => {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(FINDINGS_PATH, f), 'utf8'));
    } catch (e) {
      console.error(`⚠️  Skipping invalid finding file ${f}: ${e.message}`);
      return;
    }
    // Defensive re-validation: never trust a pre-set validation_status field.
    // A finding that reaches this directory by any path other than
    // Orchestrator.js's addFindings() (e.g. an agent writing JSON directly)
    // has not necessarily cleared the 4-layer gate yet — re-check here so
    // the report's "0% false positive" guarantee holds regardless of how
    // the file got there.
    const result = validateFinding(raw);
    if (!result.valid) {
      rejectedCount++;
      console.error(`⚠️  ${f} rejected at ${result.failedAt} gate: ${result.errors.join('; ')}`);
      return;
    }
    findings.push({ ...raw, validation_status: 'validated' });
  });
  if (rejectedCount) {
    console.log(`   ${rejectedCount} finding(s) failed validation and were excluded from the report — see stderr above.`);
  }
  findings.sort((a, b) => {
    const sa = SEVERITY_ORDER.indexOf(a.severity), sb = SEVERITY_ORDER.indexOf(b.severity);
    if (sa !== sb) return sa - sb;
    return (b.cvss_score || 0) - (a.cvss_score || 0);
  });
  findings.forEach((f, i) => { f._num = String(i + 1).padStart(2, '0'); f._anchor = `FINDING-${f._num}`; });
  return findings;
}

function computeStats(findings) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  findings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });
  const total = findings.length;
  const validated = findings.filter(f => f.validation_status === 'validated').length;
  const pending = findings.filter(f => f.validation_status === 'pending').length;
  const owaspCounts = {};
  findings.forEach(f => { if (f.owasp_category) owaspCounts[f.owasp_category] = (owaspCounts[f.owasp_category] || 0) + 1; });
  const avgCvss = total ? (findings.reduce((s, f) => s + (f.cvss_score || 0), 0) / total).toFixed(1) : '0.0';
  const maxCvss = total ? Math.max(...findings.map(f => f.cvss_score || 0)).toFixed(1) : '0.0';
  return { counts, total, validated, pending, owaspCounts, avgCvss, maxCvss };
}

// ============================================================================
// RENDER: COVER
// ============================================================================

function renderCover(config, scope, stats) {
  const name = esc(config.engagement_name || ENGAGEMENT_NAME);
  const target = esc(config.target_url || 'Not specified');
  const start = esc(fmtDate(config.start_date));
  const end = esc(fmtDate(config.end_date));
  const generated = new Date().toISOString().slice(0, 10);

  return `
<div class="cover">
  <span class="classification">CONFIDENTIAL &mdash; AUTHORIZED PENETRATION TEST</span>
  <h1>${name} &mdash; Security Assessment Report</h1>
  <p class="subtitle">Penetration Testing, Security &amp; Exploitation Testing Engagement</p>

  <div class="cover-method">
    <p>Conducted using advanced Claude AI Agents and Kali Linux over SSH, combining automated
    analysis with expert-driven validation to identify and verify security vulnerabilities.</p>
    <div class="method-flow reveal">
      <div class="method-node"><div class="icon claude">&#129302;</div><div class="txt"><b>Claude AI Agents</b><span>106 specialized agents</span></div></div>
      <div class="method-connector"><span class="arrow">&rarr;</span><span class="tag">SSH</span></div>
      <div class="method-node"><div class="icon kali">&#128009;</div><div class="txt"><b>Kali Linux</b><span>150+ integrated tools</span></div></div>
      <div class="method-connector"><span class="arrow">&rarr;</span></div>
      <div class="method-node"><div class="icon"><span aria-hidden="true">&#127919;</span></div><div class="txt"><b>Target</b><span>${target}</span></div></div>
    </div>
  </div>

  <dl class="meta">
    <dt>Target</dt><dd>${target}</dd>
    <dt>Engagement Window</dt><dd>${start} &ndash; ${end}</dd>
    <dt>Report Generated</dt><dd>${generated}</dd>
    <dt>Authorized By</dt><dd>${esc(scope.authorizedBy || 'Not recorded')} (${esc(scope.contact || '')})</dd>
    <dt>Authorization Confirmed</dt><dd>${scope.confirmed ? 'Yes &mdash; ' + esc(scope.date) : 'NOT CONFIRMED'}</dd>
  </dl>

  <div class="stat-row">
    <div class="stat stat-critical"><span class="n">${stats.counts.Critical}</span><span class="l">Critical</span></div>
    <div class="stat stat-high"><span class="n">${stats.counts.High}</span><span class="l">High</span></div>
    <div class="stat stat-medium"><span class="n">${stats.counts.Medium}</span><span class="l">Medium</span></div>
    <div class="stat stat-low"><span class="n">${stats.counts.Low}</span><span class="l">Low</span></div>
    <div class="stat stat-info"><span class="n">${stats.counts.Info}</span><span class="l">Info</span></div>
    <div class="stat"><span class="n">${stats.total}</span><span class="l">Total Findings</span></div>
  </div>
</div>`;
}

// ============================================================================
// RENDER: NAV + SEVERITY STRIP
// ============================================================================

function renderNav(config, findings, stats) {
  const bySev = {};
  SEVERITY_ORDER.forEach(s => { bySev[s] = findings.filter(f => f.severity === s); });
  const megaCols = SEVERITY_ORDER.map(sev => {
    const list = bySev[sev];
    const items = list.length
      ? `<ul>${list.map(f => `<li><a href="#${f._anchor}" role="menuitem"><span class="sev-dot sev-${sev.toLowerCase()}"></span><span class="fid-mini">${f._num}</span>&nbsp;${esc(f.title)}</a></li>`).join('')}</ul>`
      : `<p class="mega-empty">No ${sev.toLowerCase()}-severity findings in this engagement.</p>`;
    return `<div class="mega-col" role="none"><h4>${sev} &middot; ${list.length}</h4>${items}</div>`;
  }).join('');

  return `
<header class="topnav">
  <div class="topnav-inner">
    <a href="#top" class="brand">${esc((config.engagement_name || ENGAGEMENT_NAME).toUpperCase())} &middot; SECURITY ASSESSMENT</a>
    <ul class="topnav-links" aria-label="Primary">
      <li><a href="#exec-summary">Summary</a></li>
      <li><a href="#tools-methodology">Tools &amp; Methodology</a></li>
      <li class="mega-item">
        <a href="#detailed-findings" class="mega-trigger" aria-haspopup="true">Findings <span class="mega-caret">&#9662;</span></a>
        <div class="mega-panel" role="menu" aria-label="All ${stats.total} findings by severity">${megaCols}</div>
      </li>
      <li><a href="#roadmap">Roadmap</a></li>
      <li><a href="#conclusion">Conclusion &amp; Recommendations</a></li>
      <li><a href="#appendix">Appendix</a></li>
    </ul>
  </div>
</header>
<div class="sev-strip">
  <div class="sev-strip-inner">
    <span class="item critical"><span class="n">${stats.counts.Critical}</span><span class="l">Critical</span></span>
    <span class="item high"><span class="n">${stats.counts.High}</span><span class="l">High</span></span>
    <span class="item medium"><span class="n">${stats.counts.Medium}</span><span class="l">Medium</span></span>
    <span class="item low"><span class="n">${stats.counts.Low}</span><span class="l">Low</span></span>
    <span class="item info"><span class="n">${stats.counts.Info}</span><span class="l">Info</span></span>
    <span class="item total"><span class="n">${stats.total}</span><span class="l">Total</span></span>
  </div>
</div>`;
}

// ============================================================================
// RENDER: EXECUTIVE SUMMARY
// ============================================================================

function renderExecSummary(config, stats, findings) {
  const barTotal = stats.total || 1;
  const segs = SEVERITY_ORDER.filter(s => stats.counts[s] > 0).map(s => {
    const w = (stats.counts[s] / barTotal * 100).toFixed(1);
    return `<rect class="sev-seg sev-seg-${s.toLowerCase()}" x="0" y="0" width="${w}%" height="44" />`;
  }).join('');

  const topFindings = findings.filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 5);
  const topList = topFindings.length
    ? `<ul class="finding-refs">${topFindings.map(f => `<li><span class="sev-dot sev-${f.severity.toLowerCase()}"></span><a href="#${f._anchor}">${f._anchor}</a> &mdash; ${esc(f.title)}</li>`).join('')}</ul>`
    : `<p>No Critical or High severity findings were identified in this engagement.</p>`;

  return `
<section id="exec-summary">
  <h2><span class="num">01</span>Executive Summary</h2>
  <div class="panel">
    <p>This engagement dispatched the full 106-agent security testing framework against
    <code class="inline">${esc(config.target_url || 'the target')}</code>, covering web application, API, authentication,
    infrastructure, mobile, cloud, database, and specialized testing domains. Every finding below cleared a
    4-layer validation gate (Format &rarr; Evidence &rarr; Technical Accuracy &rarr; Remediation) before being
    included in this report &mdash; nothing here is speculative.</p>
    <div class="chart reveal">
      <div class="chart-title">Severity Distribution</div>
      <svg class="sev-bar-svg" viewBox="0 0 100 44" preserveAspectRatio="none">${segs}</svg>
    </div>
    <p><b>${stats.total}</b> total findings &middot; average CVSS <b>${stats.avgCvss}</b> &middot; highest CVSS <b>${stats.maxCvss}</b> &middot;
    <b>${stats.validated}</b> independently validated${stats.pending ? `, <b>${stats.pending}</b> pending validation` : ''}.</p>
  </div>
  <h4>Highest-Priority Findings</h4>
  ${topList}
</section>`;
}

// ============================================================================
// RENDER: TOOLS & METHODOLOGY
// ============================================================================

function renderMethodology() {
  return `
<section id="tools-methodology">
  <h2><span class="num">02</span>Tools &amp; Methodology</h2>
  <div class="panel">
    <p>Testing was performed by Claude AI agents driving real, industry-standard security tools on a
    Kali Linux host over SSH &mdash; every command executed and every result captured is genuine tool
    output, not a simulation. The framework covers 33 sequential phases across web application, API,
    authentication, infrastructure, cloud, mobile, wireless, database, and specialized testing domains,
    integrating 150+ Kali Linux tools.</p>
  </div>
  <div class="tool-grid">
    <div class="tool-card"><h4>Web &amp; API</h4><dl>
      <dt>Burp Suite / OWASP ZAP</dt><dd>Manual and automated web application testing</dd>
      <dt>sqlmap</dt><dd>SQL injection detection and exploitation</dd>
      <dt>ffuf / wfuzz</dt><dd>Endpoint and parameter fuzzing</dd>
    </dl></div>
    <div class="tool-card"><h4>Network &amp; Infrastructure</h4><dl>
      <dt>nmap / masscan</dt><dd>Port scanning and service enumeration</dd>
      <dt>testssl.sh / sslscan</dt><dd>TLS/SSL configuration analysis</dd>
      <dt>hydra / medusa</dt><dd>Credential and default-account testing</dd>
    </dl></div>
    <div class="tool-card"><h4>Exploitation &amp; Validation</h4><dl>
      <dt>Metasploit / custom PoCs</dt><dd>Confirmed exploitation of identified vulnerabilities</dd>
      <dt>jwt_tool</dt><dd>JWT/token analysis and manipulation</dd>
      <dt>hashcat / John the Ripper</dt><dd>Credential strength characterization</dd>
    </dl></div>
  </div>
</section>`;
}

// ============================================================================
// RENDER: RISK SUMMARY TABLE
// ============================================================================

function renderRiskSummary(findings) {
  const rows = findings.map(f => `<tr>
    <td><a href="#${f._anchor}" data-sort="${f._num}">${f._anchor}</a></td>
    <td>${esc(f.title)}</td>
    <td data-sort="${f.cvss_score || 0}">${f.cvss_score != null ? f.cvss_score.toFixed(1) : 'N/A'}</td>
    <td><span class="badge ${f.severity}">${f.severity}</span></td>
    <td>${esc(f.owasp_category || '&mdash;')}</td>
    <td><span class="status-badge status-${f.validation_status === 'validated' ? 'validated' : 'pending'}">${f.validation_status || 'pending'}</span></td>
  </tr>`).join('');

  return `
<section id="risk-summary">
  <h2><span class="num">03</span>Risk Summary</h2>
  <p>Click any column header to sort. Click a finding ID to jump to its full write-up.</p>
  <div class="table-scroll">
    <table class="data" id="risk-table">
      <thead><tr><th>ID</th><th>Title</th><th>CVSS</th><th>Severity</th><th>OWASP Category</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">No findings recorded.</td></tr>'}</tbody>
    </table>
  </div>
</section>`;
}

// ============================================================================
// RENDER: DETAILED FINDINGS
// ============================================================================

function renderFindings(findings) {
  const cards = findings.map(f => {
    const evidence = f.evidence || {};
    const remediation = f.remediation || {};
    return `
  <div class="finding" id="${f._anchor}">
    <div class="finding-head">
      <h3><span class="fid">${f._anchor}</span> &mdash; ${esc(f.title)}</h3>
      <span class="badge ${f.severity}">${f.severity}</span>
      <span class="status-badge status-${f.validation_status === 'validated' ? 'validated' : 'pending'}">${f.validation_status || 'pending'}</span>
    </div>
    <div class="finding-meta">
      <div><b>CVSS Score</b>${f.cvss_score != null ? f.cvss_score.toFixed(1) : 'N/A'}</div>
      <div><b>CVSS Vector</b>${esc(f.cvss_vector || 'N/A')}</div>
      <div><b>OWASP Category</b>${esc(f.owasp_category || 'N/A')}</div>
      <div><b>CWE</b>${esc(f.cwe_id || 'N/A')}</div>
    </div>
    ${f.affected_component ? `<div class="affected-component"><b>Affected Component</b>${esc(f.affected_component)}</div>` : ''}
    <div class="finding-description"><p>${esc(f.description)}</p></div>
    <h4>Evidence</h4>
    ${evidence.proof_of_concept ? `<p>${esc(evidence.proof_of_concept)}</p>` : ''}
    <div class="grid2">
      ${evidence.request ? `<div><span class="code-label label-vuln">Request</span><pre><code>${esc(evidence.request)}</code></pre></div>` : ''}
      ${evidence.response ? `<div><span class="code-label label-vuln">Response</span><pre><code>${esc(evidence.response)}</code></pre></div>` : ''}
    </div>
    <h4>Remediation</h4>
    <p>${esc(remediation.description || 'No remediation guidance provided.')}</p>
    <div class="grid2">
      ${remediation.vulnerable_code ? `<div><span class="code-label label-vuln">Vulnerable Code</span><pre><code>${esc(remediation.vulnerable_code)}</code></pre></div>` : ''}
      ${remediation.fixed_code ? `<div><span class="code-label label-fixed">Fixed Code</span><pre><code>${esc(remediation.fixed_code)}</code></pre></div>` : ''}
    </div>
    ${remediation.effort ? `<p><span class="tag">Estimated effort: ${esc(remediation.effort)}</span></p>` : ''}
  </div>`;
  }).join('\n');

  return `
<section id="detailed-findings">
  <h2><span class="num">04</span>Detailed Findings</h2>
  ${cards || '<p>No findings to report.</p>'}
</section>`;
}

// ============================================================================
// RENDER: REMEDIATION ROADMAP
// ============================================================================

function renderRoadmap(findings) {
  const tiers = ['p0', 'p1', 'p2', 'p3', 'pv'];
  const grouped = {};
  tiers.forEach(t => { grouped[t] = []; });
  findings.forEach(f => { grouped[PRIORITY_OF[f.severity] || 'pv'].push(f); });

  const tierHtml = tiers.filter(t => grouped[t].length).map(t => `
  <div class="priority-tier ${t}">
    <div class="priority-heading"><span class="priority-badge ${t}">${PRIORITY_LABEL[t]}</span><span>${grouped[t].length} finding(s)</span></div>
    <ul>${grouped[t].map(f => `<li><span class="sev-dot sev-${f.severity.toLowerCase()}"></span><a href="#${f._anchor}">${f._anchor}</a> &mdash; ${esc(f.title)}</li>`).join('')}</ul>
  </div>`).join('');

  return `
<section id="roadmap">
  <h2><span class="num">05</span>Remediation Roadmap</h2>
  <p>Findings are grouped into fix-priority tiers below, ordered by severity so the highest-impact
  work is addressed first.</p>
  ${tierHtml || '<p>No findings to prioritize.</p>'}
</section>`;
}

// ============================================================================
// RENDER: CONCLUSION
// ============================================================================

function renderConclusion(stats) {
  const overallRisk = stats.counts.Critical > 0 ? 'Critical' : stats.counts.High > 0 ? 'High' : stats.counts.Medium > 0 ? 'Medium' : 'Low';
  return `
<section id="conclusion">
  <h2><span class="num">06</span>Conclusion &amp; Recommendations</h2>
  <div class="panel">
    <p>This engagement identified <b>${stats.total}</b> validated findings, with an overall risk posture
    assessed as <b>${overallRisk}</b> based on the highest-severity findings present. Every finding in this
    report is backed by real, reproducible evidence and includes concrete remediation guidance.</p>
    <p><b>Recommendations:</b></p>
    <ul>
      <li>Address Priority 0 and Priority 1 findings (see Remediation Roadmap) before the next release.</li>
      <li>Re-test all remediated findings to confirm fixes are effective and complete.</li>
      <li>Incorporate the highest-recurring vulnerability classes into secure-development training.</li>
      <li>Schedule the next full assessment on a regular cadence (e.g. quarterly or per major release).</li>
    </ul>
  </div>
</section>`;
}

// ============================================================================
// RENDER: APPENDIX
// ============================================================================

function renderAppendix(config, scope, stats) {
  const owaspRows = Object.entries(stats.owaspCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) =>
    `<tr><td>${esc(cat)}</td><td>${count}</td></tr>`).join('');

  return `
<section id="appendix">
  <h2><span class="num">07</span>Appendix</h2>
  <h4>Scope</h4>
  <div class="panel">
    <p><b>In Scope:</b> ${esc(scope.inScope) || 'Not recorded'}</p>
    <p><b>Out of Scope:</b> ${esc(scope.outOfScope) || 'Not recorded'}</p>
    <p><b>Restrictions:</b> ${esc(scope.restrictions) || 'Not recorded'}</p>
  </div>
  <h4>OWASP Category Distribution</h4>
  <div class="table-scroll"><table class="data"><thead><tr><th>Category</th><th>Findings</th></tr></thead>
  <tbody>${owaspRows || '<tr><td colspan="2">No OWASP categories recorded.</td></tr>'}</tbody></table></div>
  <h4>Framework</h4>
  <p>Generated by the Security Testing Multi-Agent Framework &mdash; 106 specialized agents across 33
  sequential phases, orchestrated via Claude Code with Kali Linux over SSH. See
  <code class="inline">orchestrator/agents/README.md</code> for the complete agent directory.</p>
</section>`;
}

// ============================================================================
// RENDER: FOOTER
// ============================================================================

function renderFooter(config) {
  const generated = new Date().toISOString();
  return `
<footer class="pagefoot">
  <div class="pagefoot-inner">
    <div class="pagefoot-col">
      <div class="pagefoot-brand">Security Testing Multi-Agent Framework</div>
      <p>Automated penetration testing combining Claude AI agents with real Kali Linux tooling over SSH.
      Every finding is validated through a 4-layer gate before appearing in this report.</p>
    </div>
    <div class="pagefoot-col">
      <div class="pagefoot-label">Engagement</div>
      <dl><dt>Name</dt><dd>${esc(config.engagement_name || ENGAGEMENT_NAME)}</dd>
      <dt>Generated</dt><dd>${generated}</dd></dl>
    </div>
    <div class="pagefoot-col">
      <div class="pagefoot-label">Confidentiality</div>
      <p>This report contains confidential security information. Distribute only to authorized personnel.</p>
    </div>
  </div>
  <div class="pagefoot-bottom"><span class="tag">CONFIDENTIAL</span><span>&copy; ${new Date().getFullYear()}</span></div>
</footer>`;
}

// ============================================================================
// ASSEMBLE & WRITE
// ============================================================================

function generateReport(engagementName) {
  ENGAGEMENT_NAME = engagementName || process.argv[2];
  if (!ENGAGEMENT_NAME) {
    console.error('Usage: node orchestrator/report-generator.js <engagement-name>');
    process.exit(1);
  }
  ENGAGEMENT_PATH = path.join(__dirname, '..', 'engagements', ENGAGEMENT_NAME);
  FINDINGS_PATH = path.join(ENGAGEMENT_PATH, 'evidence', 'findings');
  REPORT_DIR = path.join(ENGAGEMENT_PATH, 'report');

  const config = loadConfig();
  const scope = loadScope();
  const findings = loadFindings();
  const stats = computeStats(findings);
  const styles = fs.existsSync(STYLES_PATH) ? fs.readFileSync(STYLES_PATH, 'utf8') : '';
  const title = esc(config.engagement_name || ENGAGEMENT_NAME);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Security Assessment Report</title>
<style>
${styles}
</style>
</head>
<body>
<script>document.documentElement.className += ' js';</script>
${renderNav(config, findings, stats)}
<main id="top">
${renderCover(config, scope, stats)}
${renderExecSummary(config, stats, findings)}
${renderMethodology()}
${renderRiskSummary(findings)}
${renderFindings(findings)}
${renderRoadmap(findings)}
${renderConclusion(stats)}
${renderAppendix(config, scope, stats)}
</main>
<a href="#top" class="back-to-top" aria-label="Back to top of report"><span class="arrow" aria-hidden="true">&uarr;</span> Top</a>
${renderFooter(config)}
<script>
(function(){
  var table = document.getElementById('risk-table');
  if(!table) return;
  var ths = table.querySelectorAll('th');
  ths.forEach(function(th, idx){
    th.addEventListener('click', function(){
      var tbody = table.querySelector('tbody');
      var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      var asc = th.getAttribute('data-asc') !== 'true';
      ths.forEach(function(t){ t.removeAttribute('data-asc'); });
      th.setAttribute('data-asc', asc);
      rows.sort(function(a, b){
        var ca = a.children[idx], cb = b.children[idx];
        var va = ca.getAttribute('data-sort') || ca.textContent.trim();
        var vb = cb.getAttribute('data-sort') || cb.textContent.trim();
        var na = parseFloat(va), nb = parseFloat(vb);
        var cmp;
        if(!isNaN(na) && !isNaN(nb)){ cmp = na - nb; } else { cmp = va.localeCompare(vb); }
        return asc ? cmp : -cmp;
      });
      rows.forEach(function(r){ tbody.appendChild(r); });
    });
  });
})();
</script>
<script>
(function(){
  var els = document.querySelectorAll('.reveal');
  var revealAll = function(){ els.forEach(function(el){ el.classList.add('in-view'); }); };
  if(!('IntersectionObserver' in window)){ revealAll(); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function(el){ io.observe(el); });
  setTimeout(revealAll, 1500);
})();
</script>
</body>
</html>`;

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportFile = path.join(REPORT_DIR, 'report.html');
  fs.writeFileSync(reportFile, html);

  const jsonFile = path.join(REPORT_DIR, 'report.json');
  fs.writeFileSync(jsonFile, JSON.stringify({ engagement: ENGAGEMENT_NAME, generated: new Date().toISOString(), stats, findings }, null, 2));

  console.log(`✅ Report generated: ${reportFile}`);
  console.log(`   ${stats.total} findings (${stats.counts.Critical} critical, ${stats.counts.High} high, ${stats.counts.Medium} medium, ${stats.counts.Low} low, ${stats.counts.Info} info)`);
  return reportFile;
}

if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, loadConfig, loadScope, loadFindings, computeStats };
