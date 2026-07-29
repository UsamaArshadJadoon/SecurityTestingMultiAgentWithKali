#!/bin/bash

# ============================================================================
# SETUP ENGAGEMENT SCRIPT
# ============================================================================
# Creates a new penetration testing engagement with required configuration
# Usage: bash scripts/setup-engagement.sh my-client-name
# ============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: bash scripts/setup-engagement.sh <engagement-name>"
    echo "Example: bash scripts/setup-engagement.sh acme-corp"
    exit 1
fi

ENGAGEMENT_NAME="$1"
ENGAGEMENT_DIR="engagements/$ENGAGEMENT_NAME"

echo "🔧 Setting up engagement: $ENGAGEMENT_NAME"

# Create directory structure
mkdir -p "$ENGAGEMENT_DIR"
mkdir -p "$ENGAGEMENT_DIR/evidence/findings"
mkdir -p "$ENGAGEMENT_DIR/report"

# Create config.yaml template
cat > "$ENGAGEMENT_DIR/config.yaml" << 'EOF'
# Engagement Configuration
engagement_name: PLACEHOLDER
target_url: https://target.example.com
scope_file: scope.md
secrets_file: .secrets
timezone: UTC
start_date: 2024-07-29
end_date: 2024-07-31
EOF

# Create scope.md template
cat > "$ENGAGEMENT_DIR/scope.md" << 'EOF'
# Engagement Scope

## Target
- URL: https://target.example.com
- IP Range: 192.168.1.0/24

## Authorization
- Authorized By: [Security Lead Name]
- Contact: [email@company.com]
- Date: 2024-07-29

## Scope
- Full application including APIs
- Admin panel testing
- Database testing (with credentials)

## Out of Scope
- Third-party services
- Third-party payment processors
- Customer data (do not modify)

## Restrictions
- No DoS attacks
- Testing during business hours only
- Do not modify production data
EOF

# Create .secrets template
cat > "$ENGAGEMENT_DIR/.secrets.template" << 'EOF'
# Target Information
TARGET_URL=https://target.example.com
TARGET_DOMAIN=target.com

# Authentication Credentials
TARGET_USERNAME=testuser@target.com
TARGET_PASSWORD=password123

# Database Credentials (optional)
DATABASE_HOST=db.internal
DATABASE_USER=db_user
DATABASE_PASSWORD=db_password

# API Keys (optional)
API_KEY=sk-xxxxx

# Authorization
AUTHORIZATION_NAME=Security Lead
AUTHORIZATION_EMAIL=lead@company.com
AUTHORIZATION_DATE=2024-07-29

# Testing Window
TESTING_WINDOW_START=2024-07-29T00:00:00Z
TESTING_WINDOW_END=2024-07-31T23:59:59Z
EOF

echo "✅ Engagement setup complete!"
echo "📋 Next steps:"
echo "   1. Copy .secrets.template to .secrets: cp $ENGAGEMENT_DIR/.secrets.template $ENGAGEMENT_DIR/.secrets"
echo "   2. Edit .secrets with actual credentials"
echo "   3. Update config.yaml and scope.md with engagement details"
echo "   4. Run: node orchestrator/Orchestrator.js $ENGAGEMENT_NAME"
