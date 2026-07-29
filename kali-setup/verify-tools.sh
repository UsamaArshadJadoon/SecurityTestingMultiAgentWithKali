#!/bin/bash

# ============================================================================
# VERIFY TOOLS SCRIPT
# ============================================================================
# Verifies that required security tools are installed and accessible
# ============================================================================

set -e

echo "🔍 Verifying security tools installation..."

REQUIRED_TOOLS=(
    "nmap"
    "sqlmap"
    "curl"
    "git"
    "python3"
    "ssh"
    "openssl"
)

FOUND_TOOLS=0
MISSING_TOOLS=0

for tool in "${REQUIRED_TOOLS[@]}"; do
    if which "$tool" > /dev/null 2>&1; then
        echo "✅ $tool - installed"
        FOUND_TOOLS=$((FOUND_TOOLS + 1))
    else
        echo "❌ $tool - NOT FOUND"
        MISSING_TOOLS=$((MISSING_TOOLS + 1))
    fi
done

echo ""
echo "📊 Results: $FOUND_TOOLS found, $MISSING_TOOLS missing"

if [ $MISSING_TOOLS -eq 0 ]; then
    echo "✅ All required tools are installed!"
else
    echo "⚠️  Some tools are missing. Run: bash kali-setup/install-tools.sh"
    exit 1
fi
