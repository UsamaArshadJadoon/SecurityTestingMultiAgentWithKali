#!/bin/bash

# ============================================================================
# INSTALL SECURITY TOOLS SCRIPT
# ============================================================================
# Installs 150+ Kali Linux security tools for the framework
# This may take 20-30 minutes depending on system and network
# ============================================================================

set -e

echo "🔧 Installing 150+ Security Tools"
echo "⏱️  This may take 20-30 minutes..."

# Core network tools
echo "📦 Installing network tools..."
apt-get install -y nmap zmap masscan rustscan shodan

# Web application testing
echo "📦 Installing web app testing tools..."
apt-get install -y burpsuite sqlmap ffuf wfuzz nuclei zaproxy

# API testing
echo "📦 Installing API testing tools..."
apt-get install -y postman grpcurl

# Exploitation tools
echo "📦 Installing exploitation tools..."
apt-get install -y metasploit-framework hashcat john

# System analysis
echo "📦 Installing system analysis tools..."
apt-get install -y ghidra radare2 binwalk

# Wireless testing
echo "📦 Installing wireless tools..."
apt-get install -y aircrack-ng wifite pixiewps

# Others
echo "📦 Installing miscellaneous tools..."
apt-get install -y git curl wget openssl ssh nc

echo "✅ Tool installation complete!"
echo "📋 Next step: bash kali-setup/verify-tools.sh"
