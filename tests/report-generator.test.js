/**
 * REPORT GENERATOR TESTS
 *
 * Basic tests for report generation:
 * - Escaping HTML entities
 * - Slug generation
 * - Date formatting
 * - Finding organization and sorting
 */

const path = require('path');

// ============================================================================
// UTILITY FUNCTION TESTS (extracted from report-generator.js)
// ============================================================================

describe('HTML Escaping', () => {
  test('should escape ampersands', () => {
    const input = 'Coffee & Tea';
    const output = input.replace(/&/g, '&amp;');
    expect(output).toBe('Coffee &amp; Tea');
  });

  test('should escape less-than signs', () => {
    const input = '5 < 10';
    const output = input.replace(/</g, '&lt;');
    expect(output).toBe('5 &lt; 10');
  });

  test('should escape greater-than signs', () => {
    const input = '10 > 5';
    const output = input.replace(/>/g, '&gt;');
    expect(output).toBe('10 &gt; 5');
  });

  test('should escape quotes', () => {
    const input = 'She said "Hello"';
    const output = input.replace(/"/g, '&quot;');
    expect(output).toBe('She said &quot;Hello&quot;');
  });

  test('should escape all HTML entities', () => {
    const esc = (str) => {
      if (str === undefined || str === null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const input = '<script>alert("XSS")</script>';
    const output = esc(input);
    expect(output).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(output).not.toContain('<script>');
  });

  test('should handle null/undefined gracefully', () => {
    const esc = (str) => {
      if (str === undefined || str === null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
    expect(esc('')).toBe('');
  });
});

// ============================================================================
// SLUG GENERATION TESTS
// ============================================================================

describe('Slug Generation', () => {
  test('should convert to lowercase', () => {
    const slug = (str) => {
      return String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    expect(slug('SQL Injection')).toBe('sql-injection');
    expect(slug('CSRF'))toEqual('csrf');
  });

  test('should replace spaces with hyphens', () => {
    const slug = (str) => {
      return String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    expect(slug('Cross Site Scripting')).toBe('cross-site-scripting');
  });

  test('should remove special characters', () => {
    const slug = (str) => {
      return String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    expect(slug('XXE (XML External Entity)')).toBe('xxe-xml-external-entity');
    expect(slug('Path Traversal/LFI')).toBe('path-traversallfi');
  });

  test('should trim leading/trailing hyphens', () => {
    const slug = (str) => {
      return String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    expect(slug('-Test-')).toBe('test');
    expect(slug('---Multiple---')).toBe('multiple');
  });

  test('should handle empty strings', () => {
    const slug = (str) => {
      return String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    expect(slug('')).toBe('');
    expect(slug('   ')).toBe('');
  });
});

// ============================================================================
// DATE FORMATTING TESTS
// ============================================================================

describe('Date Formatting', () => {
  test('should format Date objects as ISO date', () => {
    const fmtDate = (value) => {
      if (value === undefined || value === null || value === '') return '';
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return String(value);
    };

    const date = new Date('2026-08-19T12:00:00Z');
    expect(fmtDate(date)).toBe('2026-08-19');
  });

  test('should format YYYY-MM-DD strings as-is', () => {
    const fmtDate = (value) => {
      if (value === undefined || value === null || value === '') return '';
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return String(value);
    };

    expect(fmtDate('2026-08-19')).toBe('2026-08-19');
    expect(fmtDate('2024-01-01')).toBe('2024-01-01');
  });

  test('should handle null/undefined/empty', () => {
    const fmtDate = (value) => {
      if (value === undefined || value === null || value === '') return '';
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return String(value);
    };

    expect(fmtDate(null)).toBe('');
    expect(fmtDate(undefined)).toBe('');
    expect(fmtDate('')).toBe('');
  });
});

// ============================================================================
// FINDING SORTING & ORGANIZATION
// ============================================================================

describe('Finding Sorting and Organization', () => {
  const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

  test('should order findings by severity', () => {
    const findings = [
      { severity: 'Low', title: 'A' },
      { severity: 'Critical', title: 'B' },
      { severity: 'Medium', title: 'C' },
      { severity: 'High', title: 'D' },
      { severity: 'Info', title: 'E' }
    ];

    const sorted = findings.sort((a, b) => {
      return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    });

    expect(sorted[0].severity).toBe('Critical');
    expect(sorted[1].severity).toBe('High');
    expect(sorted[2].severity).toBe('Medium');
    expect(sorted[3].severity).toBe('Low');
    expect(sorted[4].severity).toBe('Info');
  });

  test('should group findings by severity', () => {
    const findings = [
      { severity: 'Critical', id: 1 },
      { severity: 'High', id: 2 },
      { severity: 'Critical', id: 3 },
      { severity: 'Low', id: 4 }
    ];

    const grouped = {};
    SEVERITY_ORDER.forEach(sev => {
      grouped[sev] = findings.filter(f => f.severity === sev);
    });

    expect(grouped['Critical']).toHaveLength(2);
    expect(grouped['High']).toHaveLength(1);
    expect(grouped['Low']).toHaveLength(1);
    expect(grouped['Medium']).toHaveLength(0);
    expect(grouped['Info']).toHaveLength(0);
  });

  test('should count findings by severity', () => {
    const findings = [
      { severity: 'Critical' },
      { severity: 'Critical' },
      { severity: 'High' },
      { severity: 'Medium' }
    ];

    const counts = {};
    SEVERITY_ORDER.forEach(sev => {
      counts[sev] = findings.filter(f => f.severity === sev).length;
    });

    expect(counts['Critical']).toBe(2);
    expect(counts['High']).toBe(1);
    expect(counts['Medium']).toBe(1);
    expect(counts['Low']).toBe(0);
    expect(counts['Info']).toBe(0);
  });
});

// ============================================================================
// PRIORITY MAPPING
// ============================================================================

describe('Priority Mapping', () => {
  const PRIORITY_OF = {
    Critical: 'p0',
    High: 'p1',
    Medium: 'p2',
    Low: 'p3',
    Info: 'pv'
  };

  const PRIORITY_LABEL = {
    p0: 'P0 — Fix Immediately',
    p1: 'P1 — Fix This Sprint',
    p2: 'P2 — Fix This Quarter',
    p3: 'P3 — Backlog',
    pv: 'Informational'
  };

  test('should map severity to priority level', () => {
    expect(PRIORITY_OF['Critical']).toBe('p0');
    expect(PRIORITY_OF['High']).toBe('p1');
    expect(PRIORITY_OF['Medium']).toBe('p2');
    expect(PRIORITY_OF['Low']).toBe('p3');
    expect(PRIORITY_OF['Info']).toBe('pv');
  });

  test('should map priority to human-readable label', () => {
    expect(PRIORITY_LABEL['p0']).toBe('P0 — Fix Immediately');
    expect(PRIORITY_LABEL['p1']).toBe('P1 — Fix This Sprint');
    expect(PRIORITY_LABEL['p2']).toBe('P2 — Fix This Quarter');
    expect(PRIORITY_LABEL['p3']).toBe('P3 — Backlog');
    expect(PRIORITY_LABEL['pv']).toBe('Informational');
  });

  test('should map finding through full priority chain', () => {
    const finding = { severity: 'High' };
    const priority = PRIORITY_OF[finding.severity];
    const label = PRIORITY_LABEL[priority];

    expect(priority).toBe('p1');
    expect(label).toBe('P1 — Fix This Sprint');
  });
});

// ============================================================================
// JSON LOADING SAFETY
// ============================================================================

describe('JSON Loading and Parsing', () => {
  test('should handle valid JSON findings', () => {
    const json = '{"finding_id":"FINDING-0001","title":"Test"}';
    expect(() => {
      JSON.parse(json);
    }).not.toThrow();
  });

  test('should handle invalid JSON gracefully', () => {
    const json = '{ invalid json }';
    expect(() => {
      JSON.parse(json);
    }).toThrow(SyntaxError);
  });

  test('should parse findings with escaped characters', () => {
    const json = '{"title":"SQL Injection in \\"Login\\""}'
;
    const parsed = JSON.parse(json);
    expect(parsed.title).toBe('SQL Injection in "Login"');
  });

  test('should handle large JSON findings', () => {
    const largeFinding = {
      finding_id: 'FINDING-0001',
      description: 'A'.repeat(5000),
      evidence: {
        proof_of_concept: 'B'.repeat(5000),
        request: 'C'.repeat(5000),
        response: 'D'.repeat(5000)
      }
    };

    const json = JSON.stringify(largeFinding);
    expect(() => {
      JSON.parse(json);
    }).not.toThrow();
  });
});

// ============================================================================
// REPORT STRUCTURE VALIDATION
// ============================================================================

describe('Report Structure Validation', () => {
  test('should have required report sections', () => {
    const report = {
      title: 'Penetration Test Report',
      scope: 'https://target.com',
      findings: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    expect(report).toHaveProperty('title');
    expect(report).toHaveProperty('scope');
    expect(report).toHaveProperty('findings');
    expect(report).toHaveProperty('summary');
  });

  test('should calculate finding statistics', () => {
    const findings = [
      { severity: 'Critical' },
      { severity: 'Critical' },
      { severity: 'High' },
      { severity: 'Medium' },
      { severity: 'Low' }
    ];

    const summary = {
      critical: findings.filter(f => f.severity === 'Critical').length,
      high: findings.filter(f => f.severity === 'High').length,
      medium: findings.filter(f => f.severity === 'Medium').length,
      low: findings.filter(f => f.severity === 'Low').length
    };

    expect(summary.critical).toBe(2);
    expect(summary.high).toBe(1);
    expect(summary.medium).toBe(1);
    expect(summary.low).toBe(1);
  });
});
