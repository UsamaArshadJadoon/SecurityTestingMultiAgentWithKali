#!/bin/bash

# ============================================================================
# KALI HEALTH CHECK
# ============================================================================
# Verifies SSH connectivity to the Kali instance and confirms that essential
# security tools are available before an engagement runs.
#
# Configure via environment variables (see orchestrator/kali-wrapper.sh):
#   KALI_HOST, KALI_PORT, KALI_USER, KALI_KEY
#
# Usage: bash orchestrator/kali-health-check.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER="$SCRIPT_DIR/kali-wrapper.sh"

echo "🔍 Kali health check"

# 1. Connectivity
echo -n "  SSH connectivity... "
if bash "$WRAPPER" "echo ok" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ cannot reach Kali over SSH (check KALI_HOST/KALI_USER/KALI_KEY)"
    exit 1
fi

# 2. Essential tools
ESSENTIAL_TOOLS=(nmap sqlmap nuclei ffuf hydra)
MISSING=0
for tool in "${ESSENTIAL_TOOLS[@]}"; do
    echo -n "  $tool... "
    if bash "$WRAPPER" "command -v $tool" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌ not found"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo "✅ Kali is ready."
else
    echo "⚠️  $MISSING essential tool(s) missing. Run: bash kali-setup/install-tools.sh"
    exit 1
fi
