#!/bin/bash

# ============================================================================
# KALI LINUX INITIALIZATION SCRIPT
# ============================================================================
# Initializes Kali Linux VM for use with the Security Testing Framework
# Run this once during initial setup
# ============================================================================

set -e

echo "🔧 Initializing Kali Linux for Security Testing Framework"

# Update system packages
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential tools if not already installed
echo "📦 Checking essential tools..."
which curl > /dev/null || apt-get install -y curl
which git > /dev/null || apt-get install -y git
which python3 > /dev/null || apt-get install -y python3

# Create necessary directories
echo "📁 Creating framework directories..."
mkdir -p /opt/security-testing-framework
mkdir -p /opt/security-testing-framework/tools
mkdir -p /opt/security-testing-framework/evidence

# Set permissions
chmod -R 755 /opt/security-testing-framework

echo "✅ Kali Linux initialization complete!"
echo "📋 Next step: bash kali-setup/install-tools.sh"
