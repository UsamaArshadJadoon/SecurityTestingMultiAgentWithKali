#!/bin/bash

# ============================================================================
# VALIDATE CONFIGURATION SCRIPT
# ============================================================================
# Validates that an engagement is properly configured before testing
# Usage: bash scripts/validate-config.sh my-client-name
# ============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: bash scripts/validate-config.sh <engagement-name>"
    exit 1
fi

ENGAGEMENT_NAME="$1"
ENGAGEMENT_DIR="engagements/$ENGAGEMENT_NAME"

echo "🔍 Validating engagement configuration: $ENGAGEMENT_NAME"

# Check if engagement directory exists
if [ ! -d "$ENGAGEMENT_DIR" ]; then
    echo "❌ Engagement directory not found: $ENGAGEMENT_DIR"
    echo "   Create it with: bash scripts/setup-engagement.sh $ENGAGEMENT_NAME"
    exit 1
fi

# Check required files
FILES_TO_CHECK=(
    "config.yaml"
    "scope.md"
    ".secrets"
)

MISSING_FILES=0
for file in "${FILES_TO_CHECK[@]}"; do
    if [ ! -f "$ENGAGEMENT_DIR/$file" ]; then
        echo "❌ Missing: $ENGAGEMENT_DIR/$file"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo "✅ Found: $file"
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo "⚠️  Configuration incomplete. Create missing files before proceeding."
    exit 1
fi

# Validate .secrets file has content
if ! grep -q "TARGET_URL" "$ENGAGEMENT_DIR/.secrets"; then
    echo "❌ .secrets file appears incomplete (missing TARGET_URL)"
    exit 1
fi

echo "✅ Configuration validation complete!"
echo "📋 Ready to run: node orchestrator/Orchestrator.js $ENGAGEMENT_NAME"
