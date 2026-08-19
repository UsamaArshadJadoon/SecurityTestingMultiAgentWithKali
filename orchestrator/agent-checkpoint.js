#!/usr/bin/env node

/**
 * AGENT CHECKPOINT MANAGER
 *
 * Enables per-agent checkpointing so failed/interrupted agents can resume
 * from their last known position instead of restarting from scratch.
 */

const fs = require('fs');
const path = require('path');

class AgentCheckpoint {
  constructor(checkpointDir) {
    this.checkpointDir = checkpointDir;
    this.ensureCheckpointDirExists();
  }

  ensureCheckpointDirExists() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * Saves checkpoint for an agent
   * @param {string} agentName - Agent name
   * @param {object} progress - Progress data to save
   */
  saveCheckpoint(agentName, progress) {
    const checkpoint = {
      agent: agentName,
      timestamp: new Date().toISOString(),
      findings_discovered: progress.findings_discovered || 0,
      phase: progress.phase || 0,
      last_tested_endpoint: progress.last_tested_endpoint || null,
      tested_endpoints: progress.tested_endpoints || [],
      tested_parameters: progress.tested_parameters || [],
      current_payload_index: progress.current_payload_index || 0,
      state: progress.state || {}  // Custom agent state
    };

    const checkpointPath = path.join(this.checkpointDir, `${agentName}.checkpoint.json`);
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    return checkpoint;
  }

  /**
   * Loads checkpoint for an agent
   * @param {string} agentName - Agent name
   * @returns {object|null} Checkpoint data or null if not found
   */
  loadCheckpoint(agentName) {
    const checkpointPath = path.join(this.checkpointDir, `${agentName}.checkpoint.json`);

    if (!fs.existsSync(checkpointPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(checkpointPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.warn(`Failed to load checkpoint for ${agentName}: ${e.message}`);
      return null;
    }
  }

  /**
   * Checks if agent has a valid checkpoint
   * @param {string} agentName - Agent name
   * @returns {boolean} True if checkpoint exists
   */
  hasCheckpoint(agentName) {
    const checkpointPath = path.join(this.checkpointDir, `${agentName}.checkpoint.json`);
    return fs.existsSync(checkpointPath);
  }

  /**
   * Clears checkpoint for an agent (call after successful completion)
   * @param {string} agentName - Agent name
   */
  clearCheckpoint(agentName) {
    const checkpointPath = path.join(this.checkpointDir, `${agentName}.checkpoint.json`);
    if (fs.existsSync(checkpointPath)) {
      fs.unlinkSync(checkpointPath);
    }
  }

  /**
   * Gets resume metrics
   * @returns {object} Statistics on checkpoints
   */
  getStats() {
    const files = fs.readdirSync(this.checkpointDir).filter(f => f.endsWith('.checkpoint.json'));

    const checkpoints = files.map(f => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(this.checkpointDir, f), 'utf8'));
        return {
          agent: content.agent,
          findings: content.findings_discovered,
          phase: content.phase,
          last_updated: content.timestamp
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return {
      total_checkpoints: checkpoints.length,
      agents_with_checkpoints: checkpoints.map(c => c.agent),
      total_findings_at_checkpoint: checkpoints.reduce((sum, c) => sum + c.findings, 0),
      checkpoints
    };
  }

  /**
   * Calculates time saved by resuming
   * @param {string} agentName - Agent name
   * @param {number} avgTimePerEndpoint - Average time per endpoint (ms)
   * @returns {object} Time savings calculation
   */
  calculateTimeSavings(agentName, avgTimePerEndpoint = 5000) {
    const checkpoint = this.loadCheckpoint(agentName);
    if (!checkpoint) {
      return { time_saved_ms: 0, endpoints_skipped: 0 };
    }

    const endpointsSkipped = (checkpoint.tested_endpoints || []).length;
    const timeSavedMs = endpointsSkipped * avgTimePerEndpoint;

    return {
      endpoints_skipped: endpointsSkipped,
      time_saved_ms: timeSavedMs,
      time_saved_minutes: (timeSavedMs / 60000).toFixed(1)
    };
  }

  /**
   * Clears all checkpoints (dangerous - use carefully)
   */
  clearAllCheckpoints() {
    const files = fs.readdirSync(this.checkpointDir).filter(f => f.endsWith('.checkpoint.json'));
    files.forEach(f => {
      fs.unlinkSync(path.join(this.checkpointDir, f));
    });
  }
}

/**
 * Creates a new checkpoint manager
 * @param {string} checkpointDir - Directory to store checkpoints
 * @returns {AgentCheckpoint} Checkpoint manager instance
 */
function createCheckpointManager(checkpointDir) {
  return new AgentCheckpoint(checkpointDir);
}

module.exports = {
  AgentCheckpoint,
  createCheckpointManager
};
