#!/usr/bin/env node

/**
 * BULK OPERATIONS - Phase 2 Optimization
 *
 * Handles batch processing of findings, engagements, and other operations.
 * Optimizes performance and resource usage for large datasets.
 */

/**
 * Bulk operation result
 */
class BulkOperationResult {
  constructor(operationId) {
    this.operationId = operationId;
    this.totalItems = 0;
    this.processed = 0;
    this.succeeded = 0;
    this.failed = 0;
    this.startTime = Date.now();
    this.endTime = null;
    this.errors = [];
    this.results = [];
  }

  addSuccess(result) {
    this.succeeded++;
    this.processed++;
    this.results.push({ success: true, result });
  }

  addError(error, item) {
    this.failed++;
    this.processed++;
    this.errors.push({ error: error.message, item, code: error.code });
    this.results.push({ success: false, error: error.message });
  }

  finish() {
    this.endTime = Date.now();
  }

  getStats() {
    return {
      operation_id: this.operationId,
      total: this.totalItems,
      processed: this.processed,
      succeeded: this.succeeded,
      failed: this.failed,
      success_rate: this.totalItems > 0 ? (this.succeeded / this.totalItems * 100).toFixed(2) + '%' : '0%',
      duration_ms: (this.endTime || Date.now()) - this.startTime,
      errors: this.errors.slice(0, 10) // Return first 10 errors
    };
  }
}

/**
 * Process bulk items with concurrency control
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {object} options - Configuration
 * @returns {Promise<BulkOperationResult>}
 */
async function processBulk(items, processor, options = {}) {
  const {
    concurrency = 10,
    batchSize = 100,
    continueOnError = true,
    operationId = `bulk-${Date.now()}`
  } = options;

  const result = new BulkOperationResult(operationId);
  result.totalItems = items.length;

  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processBatch(batch, processor, concurrency, result, continueOnError);
  }

  result.finish();
  return result;
}

/**
 * Process a batch of items
 * @private
 */
async function processBatch(batch, processor, concurrency, result, continueOnError) {
  const queue = [...batch];
  const active = [];

  while (queue.length > 0 || active.length > 0) {
    // Fill up to concurrency limit
    while (active.length < concurrency && queue.length > 0) {
      const item = queue.shift();
      const promise = processor(item)
        .then(res => {
          result.addSuccess(res);
          return { success: true };
        })
        .catch(error => {
          if (continueOnError) {
            result.addError(error, item);
            return { success: false, error };
          } else {
            throw error;
          }
        });

      active.push(promise);
    }

    // Wait for at least one to complete
    if (active.length > 0) {
      await Promise.race(active);
      active.splice(0, 1);
    }
  }
}

/**
 * Bulk import findings
 * @param {Array} findings - Array of finding objects
 * @param {Function} importFn - Function to import individual finding
 * @param {object} options - Configuration
 * @returns {Promise<BulkOperationResult>}
 */
async function bulkImportFindings(findings, importFn, options = {}) {
  return processBulk(findings, importFn, {
    concurrency: options.concurrency || 10,
    operationId: options.operationId || 'bulk-import-findings',
    ...options
  });
}

/**
 * Bulk update findings
 * @param {Array} updates - Array of update objects {id, data}
 * @param {Function} updateFn - Function to update individual finding
 * @param {object} options - Configuration
 * @returns {Promise<BulkOperationResult>}
 */
async function bulkUpdateFindings(updates, updateFn, options = {}) {
  return processBulk(updates, updateFn, {
    concurrency: options.concurrency || 10,
    operationId: options.operationId || 'bulk-update-findings',
    ...options
  });
}

/**
 * Bulk delete findings
 * @param {Array} ids - Array of finding IDs to delete
 * @param {Function} deleteFn - Function to delete individual finding
 * @param {object} options - Configuration
 * @returns {Promise<BulkOperationResult>}
 */
async function bulkDeleteFindings(ids, deleteFn, options = {}) {
  return processBulk(ids, deleteFn, {
    concurrency: options.concurrency || 10,
    operationId: options.operationId || 'bulk-delete-findings',
    ...options
  });
}

/**
 * Bulk assign findings
 * @param {Array} assignments - Array of {findingId, userId, role}
 * @param {Function} assignFn - Function to assign individual finding
 * @param {object} options - Configuration
 * @returns {Promise<BulkOperationResult>}
 */
async function bulkAssignFindings(assignments, assignFn, options = {}) {
  return processBulk(assignments, assignFn, {
    concurrency: options.concurrency || 5,
    operationId: options.operationId || 'bulk-assign-findings',
    ...options
  });
}

/**
 * Stream bulk operation progress
 * @param {AsyncGenerator} bulkOperation - Async generator yielding progress
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<BulkOperationResult>}
 */
async function streamBulkOperation(bulkOperation, onProgress) {
  const result = new BulkOperationResult('stream-bulk-operation');

  for await (const progress of bulkOperation) {
    result.processed++;
    if (progress.success) {
      result.succeeded++;
    } else {
      result.failed++;
      result.errors.push(progress.error);
    }

    if (onProgress) {
      onProgress(result.getStats());
    }
  }

  result.finish();
  return result;
}

/**
 * Create async generator for streaming bulk operations
 */
async function* streamingBulkProcessor(items, processor, options = {}) {
  const { concurrency = 10 } = options;
  const queue = [...items];
  const active = new Map();
  let index = 0;

  while (queue.length > 0 || active.size > 0) {
    // Fill queue to concurrency limit
    while (active.size < concurrency && queue.length > 0) {
      const item = queue.shift();
      const id = index++;
      const promise = processor(item)
        .then(result => ({ id, success: true, result }))
        .catch(error => ({ id, success: false, error }));

      active.set(id, promise);
    }

    // Yield results as they complete
    if (active.size > 0) {
      const completed = await Promise.race(active.values());
      active.delete(completed.id);
      yield completed;
    }
  }
}

module.exports = {
  BulkOperationResult,
  processBulk,
  bulkImportFindings,
  bulkUpdateFindings,
  bulkDeleteFindings,
  bulkAssignFindings,
  streamBulkOperation,
  streamingBulkProcessor
};
