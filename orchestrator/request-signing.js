#!/usr/bin/env node

/**
 * REQUEST SIGNING (HMAC) - Phase 3 Gap 15
 *
 * Signs API requests with HMAC to prevent tampering.
 * Ensures request integrity and authenticity.
 */

const crypto = require('crypto');

/**
 * Sign request with HMAC
 */
function signRequest(method, path, body, secret, algorithm = 'sha256') {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const message = `${method}:${path}:${bodyString}`;

  const signature = crypto
    .createHmac(algorithm, secret)
    .update(message)
    .digest('hex');

  return {
    signature,
    algorithm,
    timestamp: Date.now()
  };
}

/**
 * Verify request signature
 */
function verifySignature(method, path, body, signature, secret, algorithm = 'sha256') {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const message = `${method}:${path}:${bodyString}`;

  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(message)
    .digest('hex');

  // SECURITY: Pad both buffers to same length to prevent timing attacks
  // timingSafeEqual throws if buffers differ in length, leaking timing info
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  // Ensure both are same length (expected length is always 64 for hex SHA256)
  const maxLength = Math.max(sigBuf.length, expectedBuf.length);
  const sigPadded = Buffer.alloc(maxLength);
  const expectedPadded = Buffer.alloc(maxLength);

  sigBuf.copy(sigPadded);
  expectedBuf.copy(expectedPadded);

  try {
    return crypto.timingSafeEqual(sigPadded, expectedPadded);
  } catch (e) {
    return false;
  }
}

/**
 * Request signer
 */
class RequestSigner {
  constructor(secret, algorithm = 'sha256') {
    this.secret = secret;
    this.algorithm = algorithm;
  }

  sign(method, path, body) {
    return signRequest(method, path, body, this.secret, this.algorithm);
  }

  verify(method, path, body, signature) {
    try {
      return verifySignature(method, path, body, signature, this.secret, this.algorithm);
    } catch (error) {
      return false;
    }
  }
}

/**
 * Express middleware for request signing verification
 */
function requestSigningMiddleware(signer, options = {}) {
  const {
    headerName = 'X-Signature',
    algorithmHeader = 'X-Signature-Algorithm',
    timestampHeader = 'X-Request-Timestamp',
    maxAge = 300000 // 5 minutes
  } = options;

  return (req, res, next) => {
    // Skip GET requests (typically don't have body)
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }

    const signature = req.get(headerName);
    if (!signature) {
      const logger = global.logger;
      if (logger) {
        logger.warn('Missing request signature', {
          path: req.path,
          method: req.method,
          headerName
        });
      }
      return res.status(400).json({
        error: 'Missing request signature',
        header: headerName
      });
    }

    // Check timestamp
    const timestamp = parseInt(req.get(timestampHeader), 10);
    if (isNaN(timestamp)) {
      return res.status(400).json({
        error: 'Missing or invalid request timestamp',
        header: timestampHeader
      });
    }

    const age = Date.now() - timestamp;
    if (age > maxAge || age < -60000) { // Allow 1 minute clock skew
      const logger = global.logger;
      if (logger) {
        logger.warn('Request signature expired', {
          path: req.path,
          age,
          maxAge
        });
      }
      return res.status(401).json({
        error: 'Request signature expired',
        age,
        maxAge
      });
    }

    // Verify signature
    const isValid = signer.verify(req.method, req.path, req.body, signature);
    if (!isValid) {
      const logger = global.logger;
      if (logger) {
        logger.warn('Invalid request signature', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
      }
      return res.status(401).json({
        error: 'Invalid request signature'
      });
    }

    next();
  };
}

/**
 * Generate signature for documentation
 */
function generateSignatureExample(method = 'POST', path = '/api/test', body = {}) {
  const secret = 'example-secret';
  const signer = new RequestSigner(secret);
  const sig = signer.sign(method, path, body);

  return {
    signature: sig.signature,
    algorithm: sig.algorithm,
    timestamp: sig.timestamp,
    headers: {
      'X-Signature': sig.signature,
      'X-Signature-Algorithm': sig.algorithm,
      'X-Request-Timestamp': sig.timestamp.toString()
    }
  };
}

module.exports = {
  signRequest,
  verifySignature,
  RequestSigner,
  requestSigningMiddleware,
  generateSignatureExample
};
