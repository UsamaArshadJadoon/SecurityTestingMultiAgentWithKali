#!/bin/bash

# ============================================================================
# SETUP ENGAGEMENT SCRIPT — interactive intake
# ============================================================================
# Creates a new penetration testing engagement by asking for the target URL,
# one or more authorized test-user roles (username/password each), and
# authorization confirmation — then saves everything to .env so no further
# manual file-editing is needed before running the test.
# Usage: bash scripts/setup-engagement.sh <engagement-name>
# ============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: bash scripts/setup-engagement.sh <engagement-name>"
    echo "Example: bash scripts/setup-engagement.sh acme-corp"
    exit 1
fi

ENGAGEMENT_NAME="$1"
ENGAGEMENT_DIR="engagements/$ENGAGEMENT_NAME"

if [ -d "$ENGAGEMENT_DIR" ]; then
    echo "⚠️  Engagement '$ENGAGEMENT_NAME' already exists at $ENGAGEMENT_DIR"
    echo "   Remove it first, or choose a different name, to start fresh."
    exit 1
fi

echo "🔧 Setting up engagement: $ENGAGEMENT_NAME"
echo ""
echo "This is a one-time interactive intake. Everything you enter is saved"
echo "locally to $ENGAGEMENT_DIR/.env (git-ignored) — nothing is sent anywhere"
echo "except the Kali box you SSH the tests through."
echo ""

# ---------------------------------------------------------------------------
# Target URL
# ---------------------------------------------------------------------------
TARGET_URL=""
while [ -z "$TARGET_URL" ]; do
    read -rp "Target URL (e.g. https://staging.acme-corp.com): " INPUT_URL
    if [[ "$INPUT_URL" =~ ^https?://[^/]+ ]]; then
        TARGET_URL="$INPUT_URL"
    else
        echo "   Please enter a full URL starting with http:// or https://"
    fi
done
TARGET_DOMAIN=$(echo "$TARGET_URL" | sed -E 's#^https?://##' | cut -d/ -f1 | cut -d: -f1)

# ---------------------------------------------------------------------------
# Test-user roles (at least one required)
# ---------------------------------------------------------------------------
echo ""
echo "Now add the test-user accounts this engagement is authorized to use."
echo "Add at least two roles (e.g. 'admin' and 'standard-user') if you want"
echo "agents to test horizontal/vertical privilege escalation, BOLA, and IDOR."
echo "Press Enter with no name when you're done adding roles."

ROLE_ENV_LINES=""
ROLE_SUMMARY=""
ROLE_COUNT=0
FIRST_ROLE_USER=""
FIRST_ROLE_PASS=""

while true; do
    NEXT_NUM=$((ROLE_COUNT + 1))
    echo ""
    read -rp "Role #$NEXT_NUM name (e.g. admin, standard-user; blank to stop): " ROLE_NAME
    if [ -z "$ROLE_NAME" ]; then
        break
    fi
    read -rp "  Username for '$ROLE_NAME': " ROLE_USER
    read -rsp "  Password for '$ROLE_NAME' (hidden): " ROLE_PASS
    echo ""
    if [ -z "$ROLE_USER" ] || [ -z "$ROLE_PASS" ]; then
        echo "   Username and password are both required — this role was not saved."
        continue
    fi

    SAFE_NAME=$(printf '%s' "$ROLE_NAME" | tr '[:lower:]' '[:upper:]' | tr -c 'A-Z0-9' '_')
    ROLE_ENV_LINES+=$'\n'"ROLE_${SAFE_NAME}_LABEL=${ROLE_NAME}"
    ROLE_ENV_LINES+=$'\n'"ROLE_${SAFE_NAME}_USERNAME=${ROLE_USER}"
    ROLE_ENV_LINES+=$'\n'"ROLE_${SAFE_NAME}_PASSWORD=${ROLE_PASS}"
    ROLE_SUMMARY+=$'\n'"- ${ROLE_NAME} (username: ${ROLE_USER})"
    ROLE_COUNT=$((ROLE_COUNT + 1))

    if [ "$ROLE_COUNT" -eq 1 ]; then
        FIRST_ROLE_USER="$ROLE_USER"
        FIRST_ROLE_PASS="$ROLE_PASS"
    fi
done

if [ "$ROLE_COUNT" -eq 0 ]; then
    echo ""
    echo "❌ At least one role (username + password) is required. Re-run this script to try again."
    exit 1
fi

# ---------------------------------------------------------------------------
# Authorization confirmation — hard gate, matches Orchestrator.js's scope check
# ---------------------------------------------------------------------------
echo ""
echo "⚠️  Authorization check (required)"
echo "By continuing you confirm that you have written authorization to test"
echo "$TARGET_URL, and that testing this target does not violate any"
echo "third-party terms of service."
read -rp "Type 'yes' to confirm authorization: " AUTH_CONFIRM
if [ "$AUTH_CONFIRM" != "yes" ]; then
    echo "❌ Authorization not confirmed. No engagement was created."
    exit 1
fi

read -rp "Authorized by (name): " AUTHORIZATION_NAME
read -rp "Authorized by (email): " AUTHORIZATION_EMAIL
TODAY=$(date -u +%Y-%m-%d 2>/dev/null || echo "2024-01-01")
WINDOW_END=$(date -u -d "+7 days" +%Y-%m-%d 2>/dev/null || echo "$TODAY")

# ---------------------------------------------------------------------------
# Write everything out
# ---------------------------------------------------------------------------
mkdir -p "$ENGAGEMENT_DIR/evidence/findings" "$ENGAGEMENT_DIR/evidence/raw" "$ENGAGEMENT_DIR/evidence/screenshots" "$ENGAGEMENT_DIR/report"

cat > "$ENGAGEMENT_DIR/config.yaml" << EOF
# Engagement Configuration
engagement_name: $ENGAGEMENT_NAME
target_url: $TARGET_URL
scope_file: scope.md
secrets_file: .env
timezone: UTC
start_date: $TODAY
end_date: $WINDOW_END
EOF

cat > "$ENGAGEMENT_DIR/scope.md" << EOF
# Engagement Scope

## Target
- URL: $TARGET_URL
- Domain: $TARGET_DOMAIN

## Authorization
- Authorized By: $AUTHORIZATION_NAME
- Contact: $AUTHORIZATION_EMAIL
- Date: $TODAY
- authorization.confirmed: true

## Authorized Test Roles
$ROLE_SUMMARY

## Scope
- Full application including APIs
- Admin panel testing
- Database testing (with credentials, if provided)

## Out of Scope
- Third-party services
- Third-party payment processors
- Customer data (do not modify)

## Restrictions
- No DoS attacks
- Testing during business hours only
- Do not modify production data
EOF

cat > "$ENGAGEMENT_DIR/.env" << EOF
# Generated by scripts/setup-engagement.sh — git-ignored, never commit this file.

# Target
TARGET_URL=$TARGET_URL
TARGET_DOMAIN=$TARGET_DOMAIN

# Default/primary credentials (first role entered)
TARGET_USERNAME=$FIRST_ROLE_USER
TARGET_PASSWORD=$FIRST_ROLE_PASS

# Per-role credentials (ROLE_<NAME>_USERNAME / ROLE_<NAME>_PASSWORD / ROLE_<NAME>_LABEL)$ROLE_ENV_LINES

# Database credentials (optional — edit in manually if in scope)
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=

# API keys (optional — edit in manually if in scope)
API_KEY=

# Authorization
AUTHORIZATION_NAME=$AUTHORIZATION_NAME
AUTHORIZATION_EMAIL=$AUTHORIZATION_EMAIL
AUTHORIZATION_DATE=$TODAY

# Testing window
TESTING_WINDOW_START=${TODAY}T00:00:00Z
TESTING_WINDOW_END=${WINDOW_END}T23:59:59Z
EOF

echo ""
echo "✅ Engagement setup complete!"
echo "📋 Saved: $ENGAGEMENT_DIR/config.yaml, scope.md, .env ($ROLE_COUNT role(s))"
echo "📋 Next: bash scripts/run-pentest.sh $ENGAGEMENT_NAME"
