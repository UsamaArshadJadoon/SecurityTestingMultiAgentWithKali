#!/usr/bin/env node

/**
 * TENANT MANAGER - Multi-tenant Support
 *
 * Isolates findings, configurations, and access by tenant.
 * Enforces RBAC and resource quotas.
 */

const fs = require('fs');
const path = require('path');

class TenantManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.tenants = new Map();
    this.auditLog = [];
  }

  /**
   * Creates a new tenant
   * @param {string} tenantId - Unique tenant identifier
   * @param {object} config - Tenant configuration
   * @returns {object} Created tenant
   */
  createTenant(tenantId, config = {}) {
    if (this.tenants.has(tenantId)) {
      throw new Error(`Tenant already exists: ${tenantId}`);
    }

    const tenant = {
      id: tenantId,
      basePath: path.join(this.baseDir, tenantId),
      createdAt: new Date().toISOString(),
      roles: config.roles || { admin: [], viewer: [] },
      limits: {
        maxFindings: config.maxFindings || 10000,
        maxStorage: config.maxStorage || 1024  // MB
      },
      users: config.users || {},
      isActive: true
    };

    // Create tenant directory structure
    fs.mkdirSync(tenant.basePath, { recursive: true });
    fs.mkdirSync(path.join(tenant.basePath, 'findings'), { recursive: true });
    fs.mkdirSync(path.join(tenant.basePath, 'config'), { recursive: true });
    fs.mkdirSync(path.join(tenant.basePath, 'audit'), { recursive: true });

    this.tenants.set(tenantId, tenant);
    this._logAudit('tenant_created', tenantId, null, tenant);

    return tenant;
  }

  /**
   * Gets tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {object} Tenant object
   */
  getTenant(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
    return tenant;
  }

  /**
   * Adds user to tenant with role
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {string} role - Role (admin, viewer, editor)
   * @returns {object} Updated tenant
   */
  addUserToTenant(tenantId, userId, role = 'viewer') {
    const tenant = this.getTenant(tenantId);
    tenant.users[userId] = role;
    this._logAudit('user_added', tenantId, userId, { role });
    return tenant;
  }

  /**
   * Enforces RBAC for an action
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {string} action - Action to perform
   * @returns {boolean} Whether action is allowed
   */
  enforceRBAC(tenantId, userId, action) {
    const tenant = this.getTenant(tenantId);
    const userRole = tenant.users[userId];

    if (!userRole) {
      this._logAudit('rbac_denied', tenantId, userId, { action, reason: 'no_role' });
      return false;
    }

    const permissions = {
      admin: ['create', 'read', 'update', 'delete', 'manage_users'],
      editor: ['create', 'read', 'update'],
      viewer: ['read']
    };

    const allowed = permissions[userRole]?.includes(action);
    if (!allowed) {
      this._logAudit('rbac_denied', tenantId, userId, { action, reason: 'insufficient_permission' });
    }

    return allowed;
  }

  /**
   * Executes operation in tenant context with isolation
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID performing action
   * @param {Function} operation - Async function to execute
   * @returns {Promise<any>} Operation result
   */
  async executeWithTenantIsolation(tenantId, userId, operation) {
    const tenant = this.getTenant(tenantId);

    // Verify access
    if (!tenant.users[userId]) {
      throw new Error(`User not in tenant: ${userId}`);
    }

    const context = {
      tenantId,
      userId,
      basePath: tenant.basePath,
      limits: tenant.limits,
      role: tenant.users[userId]
    };

    try {
      const result = await operation(context);
      this._logAudit('operation_success', tenantId, userId, { operation: operation.name });
      return result;
    } catch (e) {
      this._logAudit('operation_failed', tenantId, userId, { error: e.message });
      throw e;
    }
  }

  /**
   * Gets tenant statistics
   * @param {string} tenantId - Tenant ID
   * @returns {object} Tenant stats
   */
  getTenantStats(tenantId) {
    const tenant = this.getTenant(tenantId);
    const findingsDir = path.join(tenant.basePath, 'findings');

    let findingCount = 0;
    let storageUsed = 0;

    if (fs.existsSync(findingsDir)) {
      const files = fs.readdirSync(findingsDir);
      findingCount = files.length;

      files.forEach(file => {
        const stat = fs.statSync(path.join(findingsDir, file));
        storageUsed += stat.size;
      });
    }

    return {
      id: tenantId,
      user_count: Object.keys(tenant.users).length,
      finding_count: findingCount,
      storage_used_mb: (storageUsed / 1024 / 1024).toFixed(2),
      storage_limit_mb: tenant.limits.maxStorage,
      storage_usage: ((storageUsed / tenant.limits.maxStorage / 1024 / 1024) * 100).toFixed(1) + '%',
      is_active: tenant.isActive,
      created_at: tenant.createdAt
    };
  }

  /**
   * Gets all tenants (admin only)
   * @returns {Array<object>} All tenants
   */
  getAllTenants() {
    return Array.from(this.tenants.values());
  }

  /**
   * Gets audit log for tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Audit log entries
   */
  getAuditLog(tenantId) {
    return this.auditLog.filter(entry => entry.tenantId === tenantId);
  }

  /**
   * Internal: Log audit entry
   * @private
   */
  _logAudit(action, tenantId, userId, details) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      tenantId,
      userId,
      details
    });
  }

  /**
   * Deletes tenant (permanent)
   * @param {string} tenantId - Tenant ID
   * @returns {object} Deletion result
   */
  deleteTenant(tenantId) {
    const tenant = this.getTenant(tenantId);

    try {
      if (fs.existsSync(tenant.basePath)) {
        fs.rmSync(tenant.basePath, { recursive: true, force: true });
      }

      this.tenants.delete(tenantId);
      this._logAudit('tenant_deleted', tenantId, null, {});

      return { success: true, tenantId };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }
}

function createTenantManager(baseDir) {
  return new TenantManager(baseDir);
}

module.exports = {
  TenantManager,
  createTenantManager
};
