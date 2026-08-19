#!/usr/bin/env node

/**
 * REQUEST/RESPONSE SCHEMA VALIDATION - Phase 3 Gap 9
 *
 * Validates all incoming requests and outgoing responses against schemas.
 * Prevents invalid data from entering the system.
 */

const Ajv = require('ajv');

const ajv = new Ajv({ useDefaults: true, removeAdditional: true });

/**
 * Request validation middleware
 * @param {object} schema - JSON Schema for request body
 * @returns {Function} Express middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const validate = ajv.compile(schema);
    const valid = validate(req.body);

    if (!valid) {
      const errors = validate.errors?.map(e => ({
        path: e.instancePath || 'root',
        message: e.message,
        keyword: e.keyword
      })) || [];

      const logger = global.logger;
      if (logger) {
        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          error_count: errors.length,
          errors: errors.slice(0, 5)
        });
      }

      return res.status(400).json({
        error: 'Invalid request body',
        details: errors.slice(0, 5)
      });
    }

    // Replace body with validated (and cleaned) version
    req.body = validate.data;
    next();
  };
}

/**
 * Response validation middleware
 * @param {object} schema - JSON Schema for response body
 * @returns {Function} Express middleware
 */
function validateResponse(schema) {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        const logger = global.logger;
        if (logger) {
          logger.error('Response validation failed', {
            path: req.path,
            method: req.method,
            errors: validate.errors
          });
        }

        // Log but still send response (don't break client)
        console.warn('[WARN] Response failed schema validation:', validate.errors);
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Engagement request schema
 */
const engagementRequestSchema = {
  type: 'object',
  properties: {
    engagement_name: {
      type: 'string',
      minLength: 3,
      maxLength: 100,
      pattern: '^[a-zA-Z0-9_-]+$'
    },
    target_url: {
      type: 'string',
      format: 'uri',
      minLength: 10
    },
    scope_file: {
      type: 'string',
      minLength: 1
    },
    description: {
      type: 'string',
      maxLength: 1000
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 20
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical']
    }
  },
  required: ['engagement_name', 'target_url', 'scope_file'],
  additionalProperties: false
};

/**
 * Engagement response schema
 */
const engagementResponseSchema = {
  type: 'object',
  properties: {
    engagement_id: { type: 'string' },
    status: { type: 'string' },
    findings_count: { type: 'integer' },
    created_at: { type: 'string' },
    request_id: { type: 'string' }
  },
  required: ['engagement_id', 'status'],
  additionalProperties: true
};

/**
 * Health check response schema
 */
const healthCheckSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
    timestamp: { type: 'string' },
    uptime: { type: 'number' },
    checks: { type: 'object' }
  },
  required: ['status'],
  additionalProperties: true
};

/**
 * Metrics response schema
 */
const metricsResponseSchema = {
  type: 'object',
  properties: {
    rate_limiter: { type: 'object' },
    database_pool: { type: 'object' },
    logger: { type: 'object' },
    uptime: { type: 'number' },
    memory: { type: 'object' },
    request_id: { type: 'string' }
  },
  additionalProperties: true
};

/**
 * Create composite validator
 */
function createSchemaValidator(schemas = {}) {
  const validators = {};

  for (const [name, schema] of Object.entries(schemas)) {
    validators[name] = ajv.compile(schema);
  }

  return {
    validate: (schemaName, data) => {
      const validate = validators[schemaName];
      if (!validate) return { valid: true };
      return {
        valid: validate(data),
        errors: validate.errors || []
      };
    },

    validateRequest: (schemaName) => {
      return (req, res, next) => {
        const result = this.validate(schemaName, req.body);
        if (!result.valid) {
          const logger = global.logger;
          if (logger) {
            logger.warn('Schema validation failed', {
              schema: schemaName,
              errors: result.errors.slice(0, 3)
            });
          }
          return res.status(400).json({
            error: `Invalid request: ${schemaName}`,
            details: result.errors.slice(0, 3)
          });
        }
        next();
      };
    }
  };
}

module.exports = {
  validateRequest,
  validateResponse,
  createSchemaValidator,
  engagementRequestSchema,
  engagementResponseSchema,
  healthCheckSchema,
  metricsResponseSchema,
  ajv
};
