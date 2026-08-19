#!/usr/bin/env node

/**
 * FEATURE FLAGS - Phase 3 Gap 17
 *
 * Enables/disables features without redeployment.
 * Supports percentage-based rollouts and user targeting.
 */

/**
 * Feature flag definition
 */
class FeatureFlag {
  constructor(name, options = {}) {
    this.name = name;
    this.enabled = options.enabled !== false;
    this.rolloutPercentage = options.rolloutPercentage || 100;
    this.allowedUsers = new Set(options.allowedUsers || []);
    this.blockedUsers = new Set(options.blockedUsers || []);
    this.description = options.description || '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.metadata = options.metadata || {};
  }

  /**
   * Check if feature is enabled for user
   */
  isEnabledForUser(userId) {
    // Feature disabled globally
    if (!this.enabled) return false;

    // User explicitly blocked
    if (this.blockedUsers.has(userId)) return false;

    // User explicitly allowed
    if (this.allowedUsers.has(userId)) return true;

    // Percentage-based rollout
    if (this.rolloutPercentage < 100) {
      const hash = this._hashUserId(userId);
      return (hash % 100) < this.rolloutPercentage;
    }

    return true;
  }

  /**
   * Hash user ID for consistent rollout
   * @private
   */
  _hashUserId(userId) {
    const crypto = require('crypto');
    return parseInt(
      crypto.createHash('md5').update(userId).digest('hex').substring(0, 8),
      16
    );
  }

  /**
   * Enable feature
   */
  enable() {
    this.enabled = true;
    this.updatedAt = new Date();
  }

  /**
   * Disable feature
   */
  disable() {
    this.enabled = false;
    this.updatedAt = new Date();
  }

  /**
   * Set rollout percentage
   */
  setRolloutPercentage(percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be 0-100');
    }
    this.rolloutPercentage = percentage;
    this.updatedAt = new Date();
  }

  /**
   * Add user to allowlist
   */
  allowUser(userId) {
    this.allowedUsers.add(userId);
    this.blockedUsers.delete(userId);
    this.updatedAt = new Date();
  }

  /**
   * Block user
   */
  blockUser(userId) {
    this.blockedUsers.add(userId);
    this.allowedUsers.delete(userId);
    this.updatedAt = new Date();
  }

  /**
   * Get feature status
   */
  getStatus() {
    return {
      name: this.name,
      enabled: this.enabled,
      rolloutPercentage: this.rolloutPercentage,
      allowedUserCount: this.allowedUsers.size,
      blockedUserCount: this.blockedUsers.size,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      description: this.description
    };
  }
}

/**
 * Feature flag manager
 */
class FeatureFlagManager {
  constructor() {
    this.flags = new Map();
  }

  /**
   * Register feature flag
   */
  registerFlag(name, options) {
    const flag = new FeatureFlag(name, options);
    this.flags.set(name, flag);
    return flag;
  }

  /**
   * Get feature flag
   */
  getFlag(name) {
    return this.flags.get(name);
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(name, userId = null) {
    const flag = this.getFlag(name);
    if (!flag) return false;

    if (userId) {
      return flag.isEnabledForUser(userId);
    }

    return flag.enabled;
  }

  /**
   * Get all flags
   */
  getAllFlags() {
    return Array.from(this.flags.values());
  }

  /**
   * Get all flags status
   */
  getAllStatus() {
    const status = {};
    this.flags.forEach((flag, name) => {
      status[name] = flag.getStatus();
    });
    return status;
  }

  /**
   * Enable flag
   */
  enableFlag(name) {
    const flag = this.getFlag(name);
    if (flag) flag.enable();
  }

  /**
   * Disable flag
   */
  disableFlag(name) {
    const flag = this.getFlag(name);
    if (flag) flag.disable();
  }

  /**
   * Update rollout percentage
   */
  setRolloutPercentage(name, percentage) {
    const flag = this.getFlag(name);
    if (flag) flag.setRolloutPercentage(percentage);
  }
}

/**
 * Express middleware for feature flags
 */
function featureFlagMiddleware(manager) {
  return (req, res, next) => {
    const ctx = req.requestContext?.() || {};
    const userId = ctx.userId;

    // Attach feature flag checker to request
    req.featureEnabled = (flagName) => {
      return manager.isEnabled(flagName, userId);
    };

    // Attach all flags status
    req.featureFlags = manager.getAllStatus();

    next();
  };
}

/**
 * Conditional feature handler
 */
function featureConditional(manager, flagName, enabledHandler, disabledHandler = null) {
  return async (req, res, next) => {
    const ctx = req.requestContext?.() || {};
    const userId = ctx.userId;

    if (manager.isEnabled(flagName, userId)) {
      return enabledHandler(req, res, next);
    } else if (disabledHandler) {
      return disabledHandler(req, res, next);
    } else {
      return res.status(404).json({
        error: 'Feature not available',
        feature: flagName
      });
    }
  };
}

module.exports = {
  FeatureFlag,
  FeatureFlagManager,
  featureFlagMiddleware,
  featureConditional
};
