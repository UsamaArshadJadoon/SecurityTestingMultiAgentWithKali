#!/usr/bin/env node

/**
 * FINDINGS DATABASE
 *
 * Unified interface for finding storage - supports SQLite (default) with JSON fallback.
 * Enables efficient querying, concurrent access, and distributed deployments.
 */

const fs = require('fs');
const path = require('path');

/**
 * Abstract database interface
 */
class FindingsDatabase {
  async create(finding) { throw new Error('Not implemented'); }
  async read(findingId) { throw new Error('Not implemented'); }
  async update(findingId, changes) { throw new Error('Not implemented'); }
  async delete(findingId) { throw new Error('Not implemented'); }
  async query(filters) { throw new Error('Not implemented'); }
  async count(filters) { throw new Error('Not implemented'); }
  async list(limit, offset) { throw new Error('Not implemented'); }
  async getStats() { throw new Error('Not implemented'); }
}

/**
 * JSON file-based implementation (fallback)
 */
class JSONFindingsDatabase extends FindingsDatabase {
  constructor(dbDir) {
    super();
    this.dbDir = dbDir;
    this.findingsDir = path.join(dbDir, 'findings');
    if (!fs.existsSync(this.findingsDir)) {
      fs.mkdirSync(this.findingsDir, { recursive: true });
    }
  }

  async create(finding) {
    const filePath = path.join(this.findingsDir, `${finding.finding_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(finding, null, 2));
    return finding;
  }

  async read(findingId) {
    const filePath = path.join(this.findingsDir, `${findingId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async update(findingId, changes) {
    const finding = await this.read(findingId);
    if (!finding) throw new Error(`Finding not found: ${findingId}`);
    Object.assign(finding, changes);
    return await this.create(finding);
  }

  async delete(findingId) {
    const filePath = path.join(this.findingsDir, `${findingId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async query(filters) {
    const files = fs.readdirSync(this.findingsDir).filter(f => f.endsWith('.json'));
    const results = [];

    for (const file of files) {
      const finding = JSON.parse(fs.readFileSync(path.join(this.findingsDir, file), 'utf8'));
      if (this._matchesFilters(finding, filters)) {
        results.push(finding);
      }
    }

    return results;
  }

  async count(filters) {
    const results = await this.query(filters);
    return results.length;
  }

  async list(limit = 100, offset = 0) {
    const files = fs.readdirSync(this.findingsDir).filter(f => f.endsWith('.json'));
    const paginated = files.slice(offset, offset + limit);

    return paginated.map(file =>
      JSON.parse(fs.readFileSync(path.join(this.findingsDir, file), 'utf8'))
    );
  }

  async getStats() {
    const files = fs.readdirSync(this.findingsDir).filter(f => f.endsWith('.json'));
    const findings = files.map(f =>
      JSON.parse(fs.readFileSync(path.join(this.findingsDir, f), 'utf8'))
    );

    const bySeverity = {};
    const byStatus = {};

    findings.forEach(f => {
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
      byStatus[f.current_status || 'unknown'] = (byStatus[f.current_status || 'unknown'] || 0) + 1;
    });

    return {
      total_findings: files.length,
      by_severity: bySeverity,
      by_status: byStatus,
      storage_backend: 'json-files'
    };
  }

  _matchesFilters(finding, filters) {
    return Object.entries(filters).every(([key, value]) => {
      if (key === 'severity') return finding.severity === value;
      if (key === 'status') return finding.current_status === value;
      if (key === 'title_contains') return finding.title.includes(value);
      return true;
    });
  }
}

/**
 * SQLite implementation (recommended for production)
 * Note: Requires 'better-sqlite3' package: npm install better-sqlite3
 */
class SQLiteFindingsDatabase extends FindingsDatabase {
  constructor(dbPath) {
    super();
    try {
      const Database = require('better-sqlite3');
      this.db = new Database(dbPath);
      this._initializeSchema();
    } catch (e) {
      console.warn('SQLite not available, falling back to JSON storage');
      this.isAvailable = false;
    }
  }

  _initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS findings (
        finding_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        severity TEXT,
        status TEXT,
        cvss_score REAL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_severity ON findings(severity);
      CREATE INDEX IF NOT EXISTS idx_status ON findings(status);
      CREATE INDEX IF NOT EXISTS idx_created ON findings(created_at);
    `);
  }

  async create(finding) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO findings (finding_id, title, severity, status, cvss_score, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      finding.finding_id,
      finding.title,
      finding.severity,
      finding.current_status,
      finding.cvss_score,
      JSON.stringify(finding)
    );
    return finding;
  }

  async read(findingId) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    const stmt = this.db.prepare('SELECT data FROM findings WHERE finding_id = ?');
    const row = stmt.get(findingId);
    return row ? JSON.parse(row.data) : null;
  }

  async update(findingId, changes) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    const finding = await this.read(findingId);
    if (!finding) throw new Error(`Finding not found: ${findingId}`);
    Object.assign(finding, changes);
    return await this.create(finding);
  }

  async delete(findingId) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    const stmt = this.db.prepare('DELETE FROM findings WHERE finding_id = ?');
    stmt.run(findingId);
  }

  async query(filters) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    let sql = 'SELECT data FROM findings WHERE 1=1';
    const params = [];

    if (filters.severity) {
      sql += ' AND severity = ?';
      params.push(filters.severity);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(r => JSON.parse(r.data));
  }

  async count(filters) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    let sql = 'SELECT COUNT(*) as count FROM findings WHERE 1=1';
    const params = [];

    if (filters.severity) {
      sql += ' AND severity = ?';
      params.push(filters.severity);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    return result.count;
  }

  async list(limit = 100, offset = 0) {
    if (!this.isAvailable) throw new Error('SQLite not available');
    const stmt = this.db.prepare('SELECT data FROM findings ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(limit, offset);
    return rows.map(r => JSON.parse(r.data));
  }

  async getStats() {
    if (!this.isAvailable) throw new Error('SQLite not available');

    const stmt1 = this.db.prepare('SELECT COUNT(*) as count FROM findings');
    const total = stmt1.get().count;

    const stmt2 = this.db.prepare('SELECT severity, COUNT(*) as count FROM findings GROUP BY severity');
    const bySeverity = stmt2.all().reduce((acc, row) => {
      acc[row.severity] = row.count;
      return acc;
    }, {});

    const stmt3 = this.db.prepare('SELECT status, COUNT(*) as count FROM findings GROUP BY status');
    const byStatus = stmt3.all().reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    return {
      total_findings: total,
      by_severity: bySeverity,
      by_status: byStatus,
      storage_backend: 'sqlite'
    };
  }
}

/**
 * Factory function to create appropriate database
 * @param {string} type - 'sqlite' or 'json' (auto-detected if not specified)
 * @param {string} path - Path to database
 * @returns {FindingsDatabase} Database instance
 */
function createFindingsDatabase(type = 'auto', dbPath) {
  if (type === 'auto') {
    try {
      return new SQLiteFindingsDatabase(dbPath);
    } catch (e) {
      console.warn('Falling back to JSON database');
      return new JSONFindingsDatabase(path.dirname(dbPath));
    }
  }

  if (type === 'sqlite') {
    return new SQLiteFindingsDatabase(dbPath);
  }

  if (type === 'json') {
    return new JSONFindingsDatabase(dbPath);
  }

  throw new Error(`Unknown database type: ${type}`);
}

module.exports = {
  FindingsDatabase,
  JSONFindingsDatabase,
  SQLiteFindingsDatabase,
  createFindingsDatabase
};
