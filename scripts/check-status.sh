#!/bin/bash

# ============================================================================
# CHECK STATUS SCRIPT
# ============================================================================
# Shows the current execution state of an engagement (resume/progress info).
# Reads engagements/<name>/.orchestrator-state.json written by the orchestrator.
# Usage: bash scripts/check-status.sh <engagement-name>
# ============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: bash scripts/check-status.sh <engagement-name>"
    exit 1
fi

ENGAGEMENT_NAME="$1"
ENGAGEMENT_DIR="engagements/$ENGAGEMENT_NAME"
STATE_FILE="$ENGAGEMENT_DIR/.orchestrator-state.json"

echo "📊 Status for engagement: $ENGAGEMENT_NAME"

if [ ! -d "$ENGAGEMENT_DIR" ]; then
    echo "❌ Engagement not found: $ENGAGEMENT_DIR"
    echo "   Create it with: bash scripts/setup-engagement.sh $ENGAGEMENT_NAME"
    exit 1
fi

if [ ! -f "$STATE_FILE" ]; then
    echo "ℹ️  No run has started yet (no .orchestrator-state.json)."
    echo "   Start a run with: bash scripts/run-pentest.sh $ENGAGEMENT_NAME"
    exit 0
fi

# Pretty-print state if node is available, otherwise dump raw JSON
if command -v node > /dev/null 2>&1; then
    node -e '
        const s = require("./" + process.argv[1]);
        console.log("  Completed phases:", (s.completedPhases||[]).length);
        console.log("  Completed agents:", (s.completedAgents||[]).length + "/106");
        console.log("  Findings so far :", s.findingsCount || 0);
        console.log("  Errors          :", s.errors || 0);
        console.log("  Last update     :", s.lastUpdate || "n/a");
    ' "$STATE_FILE"
else
    cat "$STATE_FILE"
fi
