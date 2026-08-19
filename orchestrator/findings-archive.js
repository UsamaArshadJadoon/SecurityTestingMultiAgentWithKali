#!/usr/bin/env node

/**
 * FINDINGS ARCHIVE MANAGER
 *
 * Archives old findings to compressed storage while maintaining searchability.
 * Prevents disk space exhaustion and improves query performance.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class FindingsArchiver {
  constructor(archiveDir, currentFindingsDir) {
    this.archiveDir = archiveDir;
    this.currentFindingsDir = currentFindingsDir;
    this.ensureDirectoriesExist();
  }

  ensureDirectoriesExist() {
    [this.archiveDir, path.join(this.archiveDir, 'compressed'), path.join(this.archiveDir, 'index')].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Archives findings older than specified days
   * @param {number} daysOld - Archive findings older than this many days
   * @returns {object} Archive statistics
   */
  archiveOlderThan(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const files = fs.readdirSync(this.currentFindingsDir).filter(f => f.endsWith('.json'));
    let archivedCount = 0;
    const archivedFiles = [];

    files.forEach(file => {
      const filePath = path.join(this.currentFindingsDir, file);
      const stat = fs.statSync(filePath);

      if (stat.mtime < cutoffDate) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const finding = JSON.parse(content);

          // Compress and store
          const compressed = zlib.gzipSync(content);
          const archiveDate = new Date().toISOString().split('T')[0];
          const archivePath = path.join(this.archiveDir, 'compressed', `${archiveDate}_${file}.gz`);

          fs.writeFileSync(archivePath, compressed);

          // Add to index
          this._addToIndex(finding.finding_id, archivePath, finding.severity);

          // Remove from current
          fs.unlinkSync(filePath);

          archivedCount++;
          archivedFiles.push(file);
        } catch (e) {
          console.warn(`Failed to archive ${file}: ${e.message}`);
        }
      }
    });

    return {
      archived_count: archivedCount,
      archived_files: archivedFiles,
      freed_space_mb: archivedFiles.length * 0.1,  // Estimate
      cutoff_date: cutoffDate.toISOString()
    };
  }

  /**
   * Searches across current and archived findings
   * @param {object} query - Query object {severity: 'High', status: 'open', ...}
   * @returns {Array<object>} Matching findings
   */
  queryAcrossAll(query) {
    const results = [];

    // Search current
    const currentFiles = fs.readdirSync(this.currentFindingsDir).filter(f => f.endsWith('.json'));
    currentFiles.forEach(file => {
      try {
        const finding = JSON.parse(fs.readFileSync(path.join(this.currentFindingsDir, file), 'utf8'));
        if (this._matchesQuery(finding, query)) {
          results.push({...finding, location: 'current'});
        }
      } catch (e) {
        // Skip on error
      }
    });

    // Search index for archived
    const index = this._loadIndex();
    Object.entries(index).forEach(([findingId, archiveData]) => {
      if (this._matchesQueryMetadata(archiveData, query)) {
        results.push({
          finding_id: findingId,
          location: 'archived',
          archive_path: archiveData.archive_path
        });
      }
    });

    return results;
  }

  /**
   * Purges archived findings older than specified days
   * @param {number} daysOld - Purge archives older than this many days
   * @returns {object} Purge statistics
   */
  purgeArchivedBefore(daysOld = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const compressedDir = path.join(this.archiveDir, 'compressed');
    const files = fs.readdirSync(compressedDir);
    let purgedCount = 0;

    files.forEach(file => {
      const filePath = path.join(compressedDir, file);
      const stat = fs.statSync(filePath);

      if (stat.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        purgedCount++;
      }
    });

    return {
      purged_count: purgedCount,
      cutoff_date: cutoffDate.toISOString()
    };
  }

  /**
   * Gets archive statistics
   * @returns {object} Archive metadata
   */
  getStats() {
    const compressedDir = path.join(this.archiveDir, 'compressed');
    const files = fs.readdirSync(compressedDir) || [];

    let totalSize = 0;
    files.forEach(file => {
      const stat = fs.statSync(path.join(compressedDir, file));
      totalSize += stat.size;
    });

    const index = this._loadIndex();

    return {
      archived_findings: Object.keys(index).length,
      archived_files: files.length,
      total_size_bytes: totalSize,
      total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
      oldest_archive: files.length > 0 ? files[0] : null,
      newest_archive: files.length > 0 ? files[files.length - 1] : null
    };
  }

  /**
   * Internal: Add finding to archive index
   * @private
   */
  _addToIndex(findingId, archivePath, severity) {
    const index = this._loadIndex();
    index[findingId] = {
      archive_path: archivePath,
      severity,
      archived_at: new Date().toISOString()
    };
    this._saveIndex(index);
  }

  /**
   * Internal: Load archive index
   * @private
   */
  _loadIndex() {
    const indexPath = path.join(this.archiveDir, 'index', 'archive-index.json');
    if (!fs.existsSync(indexPath)) return {};

    try {
      return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  /**
   * Internal: Save archive index
   * @private
   */
  _saveIndex(index) {
    const indexPath = path.join(this.archiveDir, 'index', 'archive-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Internal: Check if finding matches query
   * @private
   */
  _matchesQuery(finding, query) {
    return Object.entries(query).every(([key, value]) => {
      if (key === 'severity') return finding.severity === value;
      if (key === 'status') return finding.current_status === value;
      if (key === 'title_contains') return finding.title.includes(value);
      return true;
    });
  }

  /**
   * Internal: Check if metadata matches query
   * @private
   */
  _matchesQueryMetadata(metadata, query) {
    if (query.severity && metadata.severity !== query.severity) return false;
    return true;
  }
}

/**
 * Creates a new archive manager
 * @param {string} archiveDir - Directory for archives
 * @param {string} currentDir - Directory of current findings
 * @returns {FindingsArchiver} Archive manager instance
 */
function createArchiveManager(archiveDir, currentDir) {
  return new FindingsArchiver(archiveDir, currentDir);
}

module.exports = {
  FindingsArchiver,
  createArchiveManager
};
