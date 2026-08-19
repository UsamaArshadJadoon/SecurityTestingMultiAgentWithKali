#!/usr/bin/env node

/**
 * KEY MANAGER
 *
 * Manages encryption key lifecycle including generation, rotation, versioning,
 * and secure storage. Supports key expiration and automatic re-encryption.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KeyManager {
  constructor(keyStorePath) {
    this.keyStorePath = keyStorePath;
    this.ensureKeyStoreExists();
    this.keys = this.loadKeyStore();
    this.activeKeyId = this.getActiveKeyId();
  }

  ensureKeyStoreExists() {
    if (!fs.existsSync(this.keyStorePath)) {
      fs.mkdirSync(this.keyStorePath, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Generates a new encryption key with metadata
   * @param {string} label - Key label (e.g., 'findings-encryption')
   * @param {number} rotationDays - Rotation interval in days (default: 90)
   * @returns {object} Key pair with metadata
   */
  generateKey(label, rotationDays = 90) {
    const keyId = `key-${label}-${Date.now()}`;
    const keyBuffer = crypto.randomBytes(32); // 256 bits
    const keyBase64 = keyBuffer.toString('base64');

    const keyPair = {
      key_id: keyId,
      label,
      key: keyBase64,
      created_at: new Date().toISOString(),
      expires_at: this._addDays(new Date(), rotationDays).toISOString(),
      status: 'active',
      rotation_interval_days: rotationDays,
      algorithm: 'aes-256-gcm'
    };

    this.keys[keyId] = keyPair;
    this._saveKeyStore();

    return keyPair;
  }

  /**
   * Rotates an encryption key (marks old as rotated, creates new)
   * @param {string} oldKeyId - Key to rotate out
   * @returns {object} New key pair
   */
  rotateKey(oldKeyId) {
    if (!this.keys[oldKeyId]) {
      throw new Error(`Key not found: ${oldKeyId}`);
    }

    const oldKey = this.keys[oldKeyId];

    // Mark old key as rotated
    oldKey.status = 'rotated';
    oldKey.rotated_at = new Date().toISOString();

    // Generate new key with same label
    const newKeyPair = this.generateKey(oldKey.label, oldKey.rotation_interval_days);

    this._saveKeyStore();

    return {
      old_key_id: oldKeyId,
      new_key_id: newKeyPair.key_id,
      rotated_at: new Date().toISOString(),
      reencryption_required: true
    };
  }

  /**
   * Gets the active key for new encryptions
   * @returns {object} Active key
   */
  getActiveKey() {
    if (!this.activeKeyId) {
      throw new Error('No active key found. Generate one first.');
    }
    return this.keys[this.activeKeyId];
  }

  /**
   * Gets a specific key by ID (for decryption of old data)
   * @param {string} keyId - Key ID
   * @returns {object} Key pair
   */
  getKey(keyId) {
    const key = this.keys[keyId];
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    return key;
  }

  /**
   * Gets the active key ID
   * @private
   * @returns {string} Active key ID
   */
  getActiveKeyId() {
    const activeKeys = Object.values(this.keys).filter(k => k.status === 'active');
    if (activeKeys.length === 0) return null;
    // Return most recently created active key
    return activeKeys.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )[0].key_id;
  }

  /**
   * Checks if key has expired
   * @param {string} keyId - Key ID
   * @returns {boolean} True if expired
   */
  isExpired(keyId) {
    const key = this.keys[keyId];
    if (!key) return false;
    return new Date() > new Date(key.expires_at);
  }

  /**
   * Gets all keys needing rotation
   * @returns {Array<object>} Keys expiring within 7 days
   */
  getKeysNeedingRotation() {
    const sevenDaysFromNow = this._addDays(new Date(), 7);
    return Object.values(this.keys).filter(k =>
      k.status === 'active' && new Date(k.expires_at) < sevenDaysFromNow
    );
  }

  /**
   * Gets key statistics
   * @returns {object} Statistics
   */
  getStats() {
    const allKeys = Object.values(this.keys);
    const activeKeys = allKeys.filter(k => k.status === 'active');
    const rotatedKeys = allKeys.filter(k => k.status === 'rotated');
    const expiredKeys = allKeys.filter(k => this.isExpired(k.key_id));
    const needsRotation = this.getKeysNeedingRotation();

    return {
      total_keys: allKeys.length,
      active_keys: activeKeys.length,
      rotated_keys: rotatedKeys.length,
      expired_keys: expiredKeys.length,
      keys_needing_rotation: needsRotation.length,
      active_key_id: this.activeKeyId,
      rotation_warnings: needsRotation.map(k => ({
        key_id: k.key_id,
        label: k.label,
        expires_at: k.expires_at
      }))
    };
  }

  /**
   * Validates a key
   * @static
   * @param {string|Buffer} key - Key to validate
   * @returns {boolean} True if valid 256-bit key
   */
  static isValidKey(key) {
    try {
      let keyBuffer;
      if (typeof key === 'string') {
        keyBuffer = Buffer.from(key, 'base64');
      } else if (Buffer.isBuffer(key)) {
        keyBuffer = key;
      } else {
        return false;
      }
      return keyBuffer.length === 32; // 256 bits
    } catch (e) {
      return false;
    }
  }

  /**
   * Loads and decrypts key store from disk
   * @private
   * @returns {object} Keys map
   */
  loadKeyStore() {
    const storeFile = path.join(this.keyStorePath, 'keystore.json');
    if (!fs.existsSync(storeFile)) {
      return {};
    }

    try {
      const content = fs.readFileSync(storeFile, 'utf8');

      // SECURITY: Decrypt keystore if master key is configured
      if (process.env.KEYSTORE_MASTER_KEY) {
        const decrypted = this._decryptKeyStore(content);
        return JSON.parse(decrypted);
      }

      // Fallback for backwards compatibility (warn in logs)
      const logger = global.logger;
      if (logger) {
        logger.warn('Loading unencrypted keystore - set KEYSTORE_MASTER_KEY to encrypt');
      }
      return JSON.parse(content);
    } catch (e) {
      console.warn(`Failed to load keystore: ${e.message}`);
      return {};
    }
  }

  /**
   * Saves and encrypts key store to disk
   * @private
   */
  _saveKeyStore() {
    const storeFile = path.join(this.keyStorePath, 'keystore.json');
    let dataToWrite = JSON.stringify(this.keys, null, 2);

    // SECURITY: Encrypt keystore at rest if master key configured
    if (process.env.KEYSTORE_MASTER_KEY) {
      dataToWrite = this._encryptKeyStore(dataToWrite);
    } else {
      const logger = global.logger;
      if (logger) {
        logger.warn('Storing unencrypted keystore - set KEYSTORE_MASTER_KEY to encrypt');
      }
    }

    fs.writeFileSync(storeFile, dataToWrite, {
      mode: 0o600  // Owner read/write only
    });
  }

  /**
   * Encrypts keystore data using master key
   * @private
   */
  _encryptKeyStore(data) {
    const masterKey = Buffer.from(process.env.KEYSTORE_MASTER_KEY, 'base64');
    if (masterKey.length !== 32) {
      throw new Error('KEYSTORE_MASTER_KEY must be 32 bytes (base64 encoded)');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    const envelope = {
      version: 1,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted
    };

    return JSON.stringify(envelope);
  }

  /**
   * Decrypts keystore data using master key
   * @private
   */
  _decryptKeyStore(encryptedEnvelope) {
    const masterKey = Buffer.from(process.env.KEYSTORE_MASTER_KEY, 'base64');
    if (masterKey.length !== 32) {
      throw new Error('KEYSTORE_MASTER_KEY must be 32 bytes (base64 encoded)');
    }

    const envelope = JSON.parse(encryptedEnvelope);
    const iv = Buffer.from(envelope.iv, 'hex');
    const authTag = Buffer.from(envelope.authTag, 'hex');
    const data = envelope.data;

    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Helper: Add days to date
   * @private
   */
  _addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Exports key for backup (encrypted recommended)
   * @param {string} keyId - Key to export
   * @returns {object} Exportable key data
   */
  exportKey(keyId) {
    const key = this.getKey(keyId);
    return {
      key_id: key.key_id,
      label: key.label,
      created_at: key.created_at,
      expires_at: key.expires_at,
      status: key.status,
      // DO NOT export the actual key in plaintext
      // This is metadata only
      warning: 'Key material not included. Store separately in secure vault.'
    };
  }

  /**
   * Gets decryption key for a finding (could be from multiple keys)
   * @param {object} encryptedData - Encrypted data with key_id
   * @returns {Buffer} Decryption key
   */
  getDecryptionKey(encryptedData) {
    if (!encryptedData.key_id) {
      throw new Error('Encrypted data missing key_id');
    }
    const key = this.getKey(encryptedData.key_id);
    return Buffer.from(key.key, 'base64');
  }
}

/**
 * Creates a new key manager instance
 * @param {string} keyStorePath - Path to store keys
 * @returns {KeyManager} Key manager instance
 */
function createKeyManager(keyStorePath) {
  return new KeyManager(keyStorePath);
}

module.exports = {
  KeyManager,
  createKeyManager,
  isValidKey: KeyManager.isValidKey
};
