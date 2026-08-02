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
    ".env"
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
    echo "⚠️  Configuration incomplete. Create missing files with: bash scripts/setup-engagement.sh $ENGAGEMENT_NAME"
    exit 1
fi

# Validate .env file has content
if ! grep -q "^TARGET_URL=" "$ENGAGEMENT_DIR/.env"; then
    echo "❌ .env file appears incomplete (missing TARGET_URL)"
    exit 1
fi

if ! grep -q "^TARGET_URL=https\?://.\+" "$ENGAGEMENT_DIR/.env"; then
    echo "❌ TARGET_URL in .env is empty or not a valid URL"
    exit 1
fi

if ! grep -q "^ROLE_.*_USERNAME=" "$ENGAGEMENT_DIR/.env"; then
    echo "❌ .env has no authorized test-user roles (no ROLE_*_USERNAME entries)"
    echo "   Re-run: bash scripts/setup-engagement.sh $ENGAGEMENT_NAME"
    exit 1
fi

ROLE_COUNT=$(grep -c "^ROLE_.*_USERNAME=" "$ENGAGEMENT_DIR/.env")
echo "✅ Found $ROLE_COUNT authorized test-user role(s) in .env"

# Validate scope.md has authorization confirmed
if ! grep -q "authorization.confirmed: true" "$ENGAGEMENT_DIR/scope.md"; then
    echo "❌ scope.md does not confirm authorization (missing 'authorization.confirmed: true')"
    echo "   This engagement cannot be run until authorization is explicitly confirmed."
    exit 1
fi
echo "✅ Authorization confirmed in scope.md"

echo "✅ Configuration validation complete!"
echo "📋 Ready to run: bash scripts/run-pentest.sh $ENGAGEMENT_NAME"
