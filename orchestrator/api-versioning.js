#!/usr/bin/env node

/**
 * API VERSIONING & DEPRECATION - Phase 3 Gap 12
 *
 * Manages API versions and deprecation strategy.
 * Allows old clients to continue working while supporting new versions.
 */

/**
 * API version definition
 */
class ApiVersion {
  constructor(version, options = {}) {
    this.version = version;
    this.releaseDate = options.releaseDate || new Date();
    this.deprecationDate = options.deprecationDate;
    this.sunsetDate = options.sunsetDate;
    this.endpoints = new Map();
    this.changes = options.changes || [];
    this.notes = options.notes || '';
  }

  registerEndpoint(path, methods, handler) {
    this.endpoints.set(path, { methods, handler });
  }

  isDeprecated() {
    return this.deprecationDate && new Date() > new Date(this.deprecationDate);
  }

  isSunset() {
    return this.sunsetDate && new Date() > new Date(this.sunsetDate);
  }

  getStatus() {
    if (this.isSunset()) return 'sunset';
    if (this.isDeprecated()) return 'deprecated';
    return 'active';
  }
}

/**
 * API version manager
 */
class ApiVersionManager {
  constructor() {
    this.versions = new Map();
    this.currentVersion = null;
    this.routing = new Map(); // path -> version map
  }

  /**
   * Register API version
   */
  registerVersion(version) {
    this.versions.set(version.version, version);
    if (!this.currentVersion) {
      this.currentVersion = version.version;
    }
  }

  /**
   * Get version by number
   */
  getVersion(versionNumber) {
    return this.versions.get(versionNumber);
  }

  /**
   * Get all versions
   */
  getAllVersions() {
    return Array.from(this.versions.values());
  }

  /**
   * Get version status
   */
  getVersionStatus(versionNumber) {
    const version = this.getVersion(versionNumber);
    if (!version) return null;

    return {
      version: versionNumber,
      status: version.getStatus(),
      releaseDate: version.releaseDate,
      deprecationDate: version.deprecationDate,
      sunsetDate: version.sunsetDate,
      changes: version.changes,
      notes: version.notes
    };
  }

  /**
   * Register endpoint in version
   */
  registerEndpoint(versionNumber, path, methods, handler) {
    const version = this.getVersion(versionNumber);
    if (!version) throw new Error(`Version ${versionNumber} not registered`);

    version.registerEndpoint(path, methods, handler);
    this.routing.set(`${versionNumber}:${path}`, handler);
  }

  /**
   * Get handler for endpoint in version
   */
  getHandler(versionNumber, path) {
    const key = `${versionNumber}:${path}`;
    return this.routing.get(key);
  }
}

/**
 * Express middleware for API versioning
 */
function apiVersionMiddleware(versionManager) {
  return (req, res, next) => {
    // Extract version from URL, header, or query
    let version = null;

    // 1. Check URL path (/v1/... or /api/v1/...)
    const pathMatch = req.path.match(/\/v(\d+)/);
    if (pathMatch) {
      version = pathMatch[1];
    }

    // 2. Check Accept header (application/vnd.api+json;version=1)
    if (!version) {
      const acceptHeader = req.get('Accept') || '';
      const versionMatch = acceptHeader.match(/version=(\d+)/i);
      if (versionMatch) {
        version = versionMatch[1];
      }
    }

    // 3. Check X-API-Version header
    if (!version) {
      version = req.get('X-API-Version');
    }

    // 4. Check query parameter
    if (!version) {
      version = req.query.version;
    }

    // Default to current version
    if (!version) {
      version = versionManager.currentVersion;
    }

    // Store version info on request
    req.apiVersion = version;
    const versionObj = versionManager.getVersion(version);

    if (!versionObj) {
      return res.status(400).json({
        error: 'Invalid API version',
        version: version,
        supported_versions: versionManager.getAllVersions().map(v => v.version)
      });
    }

    // Set deprecation warning if needed
    if (versionObj.isDeprecated()) {
      res.set('API-Deprecation', 'true');
      res.set('API-Sunset', versionObj.sunsetDate || 'TBD');
      res.set('Warning', `299 - "API version ${version} is deprecated"`);

      const logger = global.logger;
      if (logger) {
        logger.warn('Deprecated API version used', {
          version,
          path: req.path,
          client_ip: req.ip,
          sunset_date: versionObj.sunsetDate
        });
      }
    }

    // Set version info header
    res.set('X-API-Version', version);

    next();
  };
}

/**
 * Response transformer for backward compatibility
 */
class ResponseTransformer {
  constructor() {
    this.transformers = new Map();
  }

  /**
   * Register response transformer for version
   */
  registerTransformer(fromVersion, toVersion, transformer) {
    const key = `${fromVersion}->${toVersion}`;
    this.transformers.set(key, transformer);
  }

  /**
   * Transform response between versions
   */
  transform(data, fromVersion, toVersion) {
    if (fromVersion === toVersion) return data;

    const key = `${fromVersion}->${toVersion}`;
    const transformer = this.transformers.get(key);

    if (!transformer) {
      const logger = global.logger;
      if (logger) {
        logger.debug('No transformer found', { fromVersion, toVersion });
      }
      return data;
    }

    return transformer(data);
  }
}

/**
 * Deprecation warning builder
 */
function buildDeprecationWarning(version, sunsetDate, alternatives = []) {
  let message = `API version ${version} will be sunset on ${sunsetDate}.`;

  if (alternatives.length > 0) {
    message += ` Please migrate to: ${alternatives.join(', ')}.`;
  }

  return message;
}

/**
 * Create versioned route handler
 */
function versionedRoute(versionManager, handler) {
  return (req, res, next) => {
    const version = req.apiVersion;
    const versionObj = versionManager.getVersion(version);

    // Call original handler
    handler(req, res, next);
  };
}

module.exports = {
  ApiVersion,
  ApiVersionManager,
  apiVersionMiddleware,
  ResponseTransformer,
  buildDeprecationWarning,
  versionedRoute
};
