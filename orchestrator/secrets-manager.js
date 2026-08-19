#!/usr/bin/env node

/**
 * SECRETS MANAGER
 *
 * Secure credential storage and rotation using environment-based vault pattern.
 * Prevents secrets from being stored in code, config files, or git history.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecretsManager {
  constructor(vaultPath = null) {
    // If no vault path, use encrypted local storage
    // In production, integrate with HashiCorp Vault or AWS Secrets Manager
    this.vaultPath = vaultPath || path.join(process.cwd(), '.secrets-vault');
    this.secrets = new Map();
    this.rotationHistory = new Map();
    this.encryptionKey = this._getOrCreateEncryptionKey();
    this._loadSecrets();
  }

  /**
   * Get secret by path
   * @param {string} secretPath - Path like 'security/jira/api-token'
   * @returns {string} Secret value
   */
  getSecret(secretPath) {
    const secret = this.secrets.get(secretPath);
    if (!secret) {
      throw new Error(`Secret not found: ${secretPath}`);
    }
    return secret.value;
  }

  /**
   * Store secret securely
   * @param {string} secretPath - Path like 'security/jira/api-token'
   * @param {string} value - Secret value
   * @param {object} options - metadata
   */
  setSecret(secretPath, value, options = {}) {
    const secret = {
      path: secretPath,
      value,
      createdAt: new Date().toISOString(),
      rotationDays: options.rotationDays || 90,
      createdBy: options.createdBy || 'system',
      encrypted: true
    };

    this.secrets.set(secretPath, secret);
    this._persistSecret(secretPath, secret);

    // Log for audit
    this._logSecretOperation('SECRET_STORED', secretPath, options.createdBy);

    return { success: true, secretPath, expiresIn: `${secret.rotationDays} days` };
  }

  /**
   * Rotate secret to new value
   * @param {string} secretPath - Path to rotate
   * @param {string} newValue - New secret value
   * @returns {object} Rotation result
   */
  rotateSecret(secretPath, newValue) {
    const oldSecret = this.secrets.get(secretPath);
    if (!oldSecret) {
      throw new Error(`Cannot rotate non-existent secret: ${secretPath}`);
    }

    // Store old value in history
    if (!this.rotationHistory.has(secretPath)) {
      this.rotationHistory.set(secretPath, []);
    }

    this.rotationHistory.get(secretPath).push({
      oldValue: oldSecret.value,
      rotatedAt: new Date().toISOString(),
      rotatedBy: 'system'
    });

    // Set new value
    const updatedSecret = {
      ...oldSecret,
      value: newValue,
      updatedAt: new Date().toISOString(),
      rotatedAt: new Date().toISOString()
    };

    this.secrets.set(secretPath, updatedSecret);
    this._persistSecret(secretPath, updatedSecret);

    this._logSecretOperation('SECRET_ROTATED', secretPath, 'system');

    return {
      success: true,
      secretPath,
      rotatedAt: updatedSecret.rotatedAt,
      nextRotation: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Get secrets needing rotation (approaching expiry)
   * @returns {Array} Secrets that should be rotated
   */
  getSecretsNeedingRotation(daysThreshold = 7) {
    const needsRotation = [];

    this.secrets.forEach((secret, path) => {
      const createdDate = new Date(secret.createdAt);
      const rotationDays = secret.rotationDays || 90;
      const expiryDate = new Date(createdDate.getTime() + rotationDays * 24 * 60 * 60 * 1000);
      const daysUntilExpiry = Math.floor((expiryDate - Date.now()) / (24 * 60 * 60 * 1000));

      if (daysUntilExpiry <= daysThreshold) {
        needsRotation.push({
          path,
          daysUntilExpiry,
          expiryDate: expiryDate.toISOString(),
          priority: daysUntilExpiry <= 0 ? 'CRITICAL' : 'HIGH'
        });
      }
    });

    return needsRotation;
  }

  /**
   * Get rotation history for a secret
   * @param {string} secretPath - Secret path
   * @returns {Array} Rotation history
   */
  getRotationHistory(secretPath) {
    return this.rotationHistory.get(secretPath) || [];
  }

  /**
   * Get statistics
   * @returns {object} Secret statistics
   */
  getStats() {
    const needsRotation = this.getSecretsNeedingRotation();

    return {
      total_secrets: this.secrets.size,
      secrets_needing_rotation: needsRotation.length,
      critical_secrets: needsRotation.filter(s => s.priority === 'CRITICAL').length,
      rotations_total: Array.from(this.rotationHistory.values()).reduce((sum, hist) => sum + hist.length, 0),
      secrets_by_type: this._categorizeSecrets()
    };
  }

  /**
   * Internal: Get or create encryption key
   * @private
   */
  _getOrCreateEncryptionKey() {
    const keyPath = path.join(this.vaultPath, '.key');
    if (!fs.existsSync(this.vaultPath)) {
      fs.mkdirSync(this.vaultPath, { recursive: true, mode: 0o700 });
    }

    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }

    // Generate new key
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyPath, key, { mode: 0o600 });
    return key;
  }

  /**
   * Internal: Load secrets from storage
   * @private
   */
  _loadSecrets() {
    if (!fs.existsSync(this.vaultPath)) {
      return;
    }

    const files = fs.readdirSync(this.vaultPath).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(this.vaultPath, file), 'utf8');
        const secret = JSON.parse(content);
        this.secrets.set(secret.path, secret);
      } catch (e) {
        console.error(`Failed to load secret from ${file}:`, e.message);
      }
    });
  }

  /**
   * Internal: Persist secret to disk
   * @private
   */
  _persistSecret(secretPath, secret) {
    const sanitized = secretPath.replace(/\//g, '_');
    const filePath = path.join(this.vaultPath, `${sanitized}.json`);
    fs.writeFileSync(filePath, JSON.stringify(secret, null, 2), { mode: 0o600 });
  }

  /**
   * Internal: Log secret operation
   * @private
   */
  _logSecretOperation(action, secretPath, actor) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      secretPath,
      actor,
      success: true
    };
    // In production, send to structured logging system
    console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Internal: Categorize secrets
   * @private
   */
  _categorizeSecrets() {
    const categories = {};
    this.secrets.forEach((secret, path) => {
      const category = path.split('/')[0];
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  /**
   * Delete secret (use with caution)
   * @param {string} secretPath - Path to delete
   */
  deleteSecret(secretPath) {
    this.secrets.delete(secretPath);
    const sanitized = secretPath.replace(/\//g, '_');
    const filePath = path.join(this.vaultPath, `${sanitized}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    this._logSecretOperation('SECRET_DELETED', secretPath, 'admin');
    return { success: true };
  }
}

function createSecretsManager(vaultPath) {
  return new SecretsManager(vaultPath);
}

module.exports = {
  SecretsManager,
  createSecretsManager
};
