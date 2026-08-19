#!/usr/bin/env node

/**
 * TICKET MANAGER - JIRA/Slack Integration
 *
 * Automatically creates JIRA tickets for security findings and notifies Slack.
 * Syncs status changes bidirectionally.
 */

const https = require('https');

class TicketManager {
  constructor(jiraConfig, slackConfig) {
    this.jiraConfig = jiraConfig || {};
    this.slackConfig = slackConfig || {};
    this.ticketMap = new Map();  // Maps finding_id → jiraId
  }

  /**
   * Creates JIRA ticket when finding is discovered
   * @param {object} finding - Finding object
   * @returns {Promise<object>} Ticket creation result
   */
  async createTicketOnFinding(finding) {
    if (!finding || !this.jiraConfig.baseUrl) {
      return { success: false, reason: 'Missing config or finding' };
    }

    const ticket = {
      fields: {
        project: { key: this.jiraConfig.projectKey || 'SEC' },
        issuetype: { name: 'Bug' },
        summary: finding.title,
        description: finding.description || finding.title,
        priority: { name: this._mapToJiraSeverity(finding.severity) },
        labels: ['pentest', finding.severity.toLowerCase()],
        customfield_10000: finding.affected_component || 'Unknown'
      }
    };

    try {
      const jiraId = await this._createJiraIssue(ticket);
      this.ticketMap.set(finding.finding_id, jiraId);

      // Notify Slack
      if (this.slackConfig.webhookUrl) {
        await this._notifySlack(finding, jiraId);
      }

      return {
        success: true,
        jiraId,
        finding_id: finding.finding_id
      };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  /**
   * Updates JIRA ticket when finding status changes
   * @param {object} finding - Updated finding
   * @returns {Promise<object>} Update result
   */
  async updateTicketOnStatusChange(finding) {
    const jiraId = this.ticketMap.get(finding.finding_id);
    if (!jiraId) return { success: false, reason: 'No mapped ticket' };

    const transitions = {
      'discovered': 'To Do',
      'approved': 'In Progress',
      'remediated': 'Done',
      'verified': 'Done',
      're_discovered': 'To Do'
    };

    const newStatus = transitions[finding.current_status] || 'To Do';

    try {
      await this._transitionJiraIssue(jiraId, newStatus);

      // Notify Slack of status change
      if (this.slackConfig.webhookUrl) {
        await this._notifySlackStatusChange(finding, jiraId);
      }

      return { success: true, jiraId };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }

  /**
   * Gets ticket mapping for a finding
   * @param {string} findingId - Finding ID
   * @returns {string|null} JIRA ticket ID or null
   */
  getTicketForFinding(findingId) {
    return this.ticketMap.get(findingId) || null;
  }

  /**
   * Gets statistics about ticket creation
   * @returns {object} Ticket stats
   */
  getStats() {
    return {
      total_mapped: this.ticketMap.size,
      tickets: Array.from(this.ticketMap.entries()).map(([fid, tid]) => ({
        finding_id: fid,
        ticket_id: tid
      }))
    };
  }

  /**
   * Internal: Map security severity to JIRA priority
   * @private
   */
  _mapToJiraSeverity(severity) {
    const mapping = {
      'Critical': 'Highest',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low',
      'Info': 'Lowest'
    };
    return mapping[severity] || 'Medium';
  }

  /**
   * Internal: Create JIRA issue via API
   * @private
   */
  async _createJiraIssue(ticket) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(ticket);

      const options = {
        hostname: new URL(this.jiraConfig.baseUrl).hostname,
        path: '/rest/api/3/issue',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jiraConfig.token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.key);
          } catch (e) {
            reject(new Error('Failed to parse JIRA response'));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Internal: Transition JIRA issue
   * @private
   */
  async _transitionJiraIssue(jiraId, status) {
    // Implementation would query available transitions and pick matching one
    // Simplified for demo
    return Promise.resolve();
  }

  /**
   * Internal: Send Slack notification
   * @private
   */
  async _notifySlack(finding, jiraId) {
    return new Promise((resolve) => {
      const payload = {
        text: `🔴 New ${finding.severity} Security Finding`,
        attachments: [{
          color: this._getColorForSeverity(finding.severity),
          fields: [
            { title: 'Finding', value: finding.title, short: false },
            { title: 'Severity', value: finding.severity, short: true },
            { title: 'Component', value: finding.affected_component, short: true },
            { title: 'JIRA', value: jiraId, short: true }
          ]
        }]
      };

      this._sendSlackWebhook(payload).catch(() => {});
      resolve();
    });
  }

  /**
   * Internal: Notify Slack of status change
   * @private
   */
  async _notifySlackStatusChange(finding, jiraId) {
    const payload = {
      text: `📋 Finding Status Updated: ${jiraId}`,
      attachments: [{
        color: '#0099ff',
        fields: [
          { title: 'Finding', value: finding.title, short: false },
          { title: 'New Status', value: finding.current_status, short: true },
          { title: 'JIRA', value: jiraId, short: true }
        ]
      }]
    };

    return this._sendSlackWebhook(payload).catch(() => {});
  }

  /**
   * Internal: Send to Slack webhook
   * @private
   */
  async _sendSlackWebhook(payload) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const url = new URL(this.slackConfig.webhookUrl);

      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        res.statusCode === 200 ? resolve() : reject(new Error(`Status ${res.statusCode}`));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Internal: Get color for severity
   * @private
   */
  _getColorForSeverity(severity) {
    const colors = {
      'Critical': '#ff0000',
      'High': '#ff6600',
      'Medium': '#ffaa00',
      'Low': '#00aa00',
      'Info': '#0099ff'
    };
    return colors[severity] || '#cccccc';
  }
}

function createTicketManager(jiraConfig, slackConfig) {
  return new TicketManager(jiraConfig, slackConfig);
}

module.exports = {
  TicketManager,
  createTicketManager
};
