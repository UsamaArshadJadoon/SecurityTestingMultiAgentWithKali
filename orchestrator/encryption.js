#!/usr/bin/env node

/**
 * EVIDENCE ENCRYPTION
 *
 * Encrypts/decrypts finding evidence at rest using AES-256-GCM.
 * Protects HTTP requests, responses, credentials, and other sensitive data.
 *
 * Key rotation and management is the responsibility of the deployment environment.
 */

const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128 bits
const AUTH_TAG_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 32;  // 256 bits

class EvidenceEncryptor {
  constructor(encryptionKey) {
    this.encryptionKey = this._validateKey(encryptionKey);
    this.enabled = !!encryptionKey;
  }

  /**
   * Validates encryption key is exactly 32 bytes (256 bits)
   * @param {Buffer|string|null} key - Encryption key
   * @returns {Buffer|null} Validated key or null if disabled
   */
  _validateKey(key) {
    if (!key) return null;

    let keyBuffer;
    if (typeof key === 'string') {
      // If string, hash it to get consistent 32-byte key
      keyBuffer = crypto.createHash('sha256').update(key).digest();
    } else if (Buffer.isBuffer(key)) {
      keyBuffer = key;
    } else {
      throw new Error('Encryption key must be string or Buffer');
    }

    if (keyBuffer.length !== 32) {
      throw new Error(`Encryption key must be 32 bytes (256 bits), got ${keyBuffer.length}`);
    }

    return keyBuffer;
  }

  /**
   * Encrypts a finding's evidence section
   * @param {object} finding - The finding to encrypt
   * @returns {object} Finding with encrypted evidence and metadata
   */
  encryptFinding(finding) {
    if (!this.enabled) {
      return finding;  // No encryption if key not configured
    }

    const finding_copy = JSON.parse(JSON.stringify(finding));

    if (finding_copy.evidence) {
      const evidenceJson = JSON.stringify(finding_copy.evidence);
      const encrypted = this._encrypt(evidenceJson);

      finding_copy.evidence = {
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        algorithm: ENCRYPTION_ALGORITHM,
        encrypted_at: new Date().toISOString()
      };
      finding_copy._evidence_encrypted = true;
    }

    return finding_copy;
  }

  /**
   * Decrypts a finding's evidence section
   * @param {object} finding - The finding with encrypted evidence
   * @returns {object} Finding with decrypted evidence
   * @throws {Error} If decryption fails (wrong key or corrupted data)
   */
  decryptFinding(finding) {
    if (!this.enabled || !finding._evidence_encrypted) {
      return finding;
    }

    const finding_copy = JSON.parse(JSON.stringify(finding));

    if (finding_copy.evidence && finding_copy.evidence.encrypted) {
      try {
        const decrypted = this._decrypt(
          finding_copy.evidence.encrypted,
          finding_copy.evidence.iv,
          finding_copy.evidence.auth_tag
        );
        finding_copy.evidence = JSON.parse(decrypted);
        finding_copy._evidence_encrypted = false;
      } catch (error) {
        throw new Error(`Failed to decrypt finding evidence: ${error.message}`);
      }
    }

    return finding_copy;
  }

  /**
   * Internal: Encrypts plaintext using AES-256-GCM
   * @private
   * @param {string} plaintext - Text to encrypt
   * @returns {object} {encrypted, iv, authTag}
   */
  _encrypt(plaintext) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  /**
   * Internal: Decrypts ciphertext using AES-256-GCM
   * @private
   * @param {string} encrypted - Base64-encoded ciphertext
   * @param {string} ivBase64 - Base64-encoded IV
   * @param {string} authTagBase64 - Base64-encoded auth tag
   * @returns {string} Decrypted plaintext
   * @throws {Error} If authentication fails
   */
  _decrypt(encrypted, ivBase64, authTagBase64) {
    const iv = Buffer.from(ivBase64, 'base64');
    const ciphertext = Buffer.from(encrypted, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Gets encryption status for a finding
   * @param {object} finding - Finding to check
   * @returns {object} Encryption metadata
   */
  getEncryptionStatus(finding) {
    return {
      encryption_enabled: this.enabled,
      evidence_encrypted: finding._evidence_encrypted || false,
      algorithm: finding.evidence?.algorithm || null,
      encrypted_at: finding.evidence?.encrypted_at || null,
      has_encrypted_evidence: !!(finding.evidence?.encrypted)
    };
  }

  /**
   * Generates a new encryption key (for key rotation)
   * @static
   * @param {string} seed - Optional seed for key generation
   * @returns {string} Base64-encoded encryption key
   */
  static generateKey(seed = '') {
    const seedBuffer = seed ? Buffer.from(seed, 'utf8') : crypto.randomBytes(32);
    const key = crypto.createHash('sha256')
      .update(Buffer.concat([crypto.randomBytes(32), seedBuffer]))
      .digest();
    return key.toString('base64');
  }

  /**
   * Validates an encryption key
   * @static
   * @param {string|Buffer} key - Key to validate
   * @returns {boolean} True if valid
   */
  static isValidKey(key) {
    try {
      const encryptor = new EvidenceEncryptor(key);
      return encryptor.enabled;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Creates a new evidence encryptor instance
 * @param {string|Buffer|null} encryptionKey - 32-byte encryption key or null to disable
 * @returns {EvidenceEncryptor} Encryptor instance
 */
function createEvidenceEncryptor(encryptionKey = null) {
  return new EvidenceEncryptor(encryptionKey);
}

module.exports = {
  EvidenceEncryptor,
  createEvidenceEncryptor,
  generateKey: EvidenceEncryptor.generateKey,
  isValidKey: EvidenceEncryptor.isValidKey
};
