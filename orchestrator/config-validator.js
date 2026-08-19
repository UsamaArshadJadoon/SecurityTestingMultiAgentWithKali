#!/usr/bin/env node

/**
 * CONFIGURATION VALIDATOR - Phase 2 Optimization
 *
 * Validates server configuration on startup.
 * Ensures all required settings are present and valid.
 */

const Ajv = require('ajv');

const ajv = new Ajv({ useDefaults: true });

/**
 * Configuration schema
 */
const CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    port: {
      type: 'number',
      minimum: 1024,
      maximum: 65535,
      default: 3000
    },
    env: {
      type: 'string',
      enum: ['development', 'staging', 'production', 'test'],
      default: 'development'
    },
    logLevel: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    },
    database: {
      type: 'object',
      properties: {
        minConnections: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 5
        },
        maxConnections: {
          type: 'number',
          minimum: 5,
          maximum: 500,
          default: 20
        },
        idleTimeout: {
          type: 'number',
          minimum: 1000,
          default: 30000
        },
        acquireTimeout: {
          type: 'number',
          minimum: 1000,
          default: 5000
        }
      },
      default: {}
    },
    rateLimit: {
      type: 'object',
      properties: {
        perUserPerMinute: {
          type: 'number',
          minimum: 1,
          default: 100
        },
        perTenantPerMinute: {
          type: 'number',
          minimum: 10,
          default: 1000
        },
        maxQueryTime: {
          type: 'number',
          minimum: 1000,
          default: 30000
        }
      },
      default: {}
    },
    timeout: {
      type: 'object',
      properties: {
        request: {
          type: 'number',
          minimum: 5000,
          default: 30000
        },
        shutdown: {
          type: 'number',
          minimum: 5000,
          default: 30000
        }
      },
      default: {}
    },
    security: {
      type: 'object',
      properties: {
        requireAuth: {
          type: 'boolean',
          default: true
        },
        corsEnabled: {
          type: 'boolean',
          default: false
        },
        corsOrigins: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      default: {}
    },
    monitoring: {
      type: 'object',
      properties: {
        enableMetrics: {
          type: 'boolean',
          default: true
        },
        enableHealthCheck: {
          type: 'boolean',
          default: true
        }
      },
      default: {}
    }
  },
  required: ['port', 'env'],
  additionalProperties: true
};

/**
 * Validate configuration
 * @param {object} config - Configuration object
 * @returns {object} { valid: boolean, errors: Array, config: object }
 */
function validateConfig(config) {
  const validate = ajv.compile(CONFIG_SCHEMA);
  const valid = validate(config);

  return {
    valid,
    errors: valid ? [] : validate.errors || [],
    config: validate.data || config
  };
}

/**
 * Load and validate environment-specific config
 */
function loadEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
  const baseConfig = {
    port: parseInt(process.env.PORT, 10) || 3000,
    env,
    logLevel: process.env.LOG_LEVEL || 'info',
    database: {
      minConnections: parseInt(process.env.DB_MIN_CONN, 10) || 5,
      maxConnections: parseInt(process.env.DB_MAX_CONN, 10) || 20,
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT, 10) || 5000
    },
    rateLimit: {
      perUserPerMinute: parseInt(process.env.RATE_LIMIT_USER, 10) || 100,
      perTenantPerMinute: parseInt(process.env.RATE_LIMIT_TENANT, 10) || 1000,
      maxQueryTime: parseInt(process.env.RATE_LIMIT_QUERY_TIME, 10) || 30000
    },
    timeout: {
      request: parseInt(process.env.TIMEOUT_REQUEST, 10) || 30000,
      shutdown: parseInt(process.env.TIMEOUT_SHUTDOWN, 10) || 30000
    },
    security: {
      requireAuth: process.env.REQUIRE_AUTH !== 'false',
      corsEnabled: process.env.CORS_ENABLED === 'true'
    },
    monitoring: {
      enableMetrics: process.env.ENABLE_METRICS !== 'false',
      enableHealthCheck: process.env.ENABLE_HEALTH !== 'false'
    }
  };

  // Environment-specific overrides
  const envSpecificConfig = {
    development: {
      logLevel: 'debug',
      security: {
        // SECURITY: Always require auth - only disable via REQUIRE_AUTH env var
        requireAuth: process.env.REQUIRE_AUTH !== 'false',
        corsEnabled: true,
        corsOrigins: ['http://localhost:*']
      }
    },
    staging: {
      logLevel: 'info',
      security: {
        requireAuth: true,
        corsEnabled: true
      }
    },
    production: {
      logLevel: 'warn',
      security: {
        requireAuth: true,
        corsEnabled: false
      }
    },
    test: {
      logLevel: 'error',
      security: {
        requireAuth: false
      }
    }
  };

  const envConfig = envSpecificConfig[env] || {};
  const config = {
    ...baseConfig,
    ...envConfig,
    database: {
      ...baseConfig.database,
      ...envConfig.database
    },
    rateLimit: {
      ...baseConfig.rateLimit,
      ...envConfig.rateLimit
    },
    timeout: {
      ...baseConfig.timeout,
      ...envConfig.timeout
    },
    security: {
      ...baseConfig.security,
      ...envConfig.security
    },
    monitoring: {
      ...baseConfig.monitoring,
      ...envConfig.monitoring
    }
  };

  return config;
}

/**
 * Validate configuration on startup
 * @param {object} config - Configuration object
 * @returns {Promise} Throws if invalid
 */
async function validateConfigOnStartup(config) {
  const result = validateConfig(config);

  if (!result.valid) {
    const errors = result.errors
      .map(e => `${e.instancePath || 'root'}: ${e.message}`)
      .join('; ');

    const error = new Error(`Configuration validation failed: ${errors}`);
    error.code = 'CONFIG_INVALID';
    error.details = result.errors;
    throw error;
  }

  // Validate consistency
  if (result.config.database.minConnections > result.config.database.maxConnections) {
    const error = new Error('database.minConnections cannot exceed maxConnections');
    error.code = 'CONFIG_INVALID';
    throw error;
  }

  if (result.config.rateLimit.perUserPerMinute > result.config.rateLimit.perTenantPerMinute) {
    const error = new Error('rateLimit.perUserPerMinute cannot exceed perTenantPerMinute');
    error.code = 'CONFIG_INVALID';
    throw error;
  }

  return result.config;
}

module.exports = {
  CONFIG_SCHEMA,
  validateConfig,
  loadEnvironmentConfig,
  validateConfigOnStartup
};
