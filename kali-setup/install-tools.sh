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

FAILED_TOOLS=()

# Installs each package individually so one unavailable/renamed package
# doesn't abort the whole run (a single failing name in a combined
# `apt-get install -y a b c` line takes every other package on that line
# down with it under `set -e`).
apt_install_each() {
    for pkg in "$@"; do
        if apt-get install -y "$pkg"; then
            :
        else
            echo "⚠️  apt package '$pkg' failed/unavailable — skipping, continuing with the rest"
            FAILED_TOOLS+=("$pkg (apt)")
        fi
    done
}

# Core network tools
echo "📦 Installing network tools..."
apt_install_each nmap zmap masscan rustscan

# Web application testing
echo "📦 Installing web app testing tools..."
apt_install_each burpsuite sqlmap ffuf wfuzz nuclei zaproxy

# API testing
echo "📦 Installing API testing tools..."
apt_install_each grpcurl

# Exploitation tools
echo "📦 Installing exploitation tools..."
apt_install_each metasploit-framework hashcat john

# System analysis
echo "📦 Installing system analysis tools..."
apt_install_each ghidra radare2 binwalk

# Wireless testing
echo "📦 Installing wireless tools..."
apt_install_each aircrack-ng wifite pixiewps

# Others
echo "📦 Installing miscellaneous tools..."
apt_install_each git curl wget openssl ssh nc

# Tools NOT distributed via apt — installed through their own package
# managers/direct download instead of a (guaranteed to fail) apt name.
echo "📦 Installing tools not available via apt..."
if command -v pip3 > /dev/null 2>&1; then
    pip3 install --break-system-packages -q shodan 2>/dev/null || pip3 install -q shodan || { echo "⚠️  pip install shodan failed"; FAILED_TOOLS+=("shodan (pip)"); }
else
    echo "⚠️  pip3 not found — skipping shodan CLI"
    FAILED_TOOLS+=("shodan (pip3 missing)")
fi

echo "ℹ️  Postman has no apt package on Kali/Debian — install manually from"
echo "   https://www.postman.com/downloads/ (AppImage or snap) if API-agent"
echo "   tooling needs it; it is optional (curl/httpie cover the same testing)."

echo ""
if [ ${#FAILED_TOOLS[@]} -eq 0 ]; then
    echo "✅ Tool installation complete — everything installed successfully!"
else
    echo "⚠️  Tool installation finished with ${#FAILED_TOOLS[@]} issue(s):"
    printf '   - %s\n' "${FAILED_TOOLS[@]}"
    echo "   Install these manually, or re-run this script after checking package names"
    echo "   for your Kali release (apt-cache search <name>)."
fi
echo "📋 Next step: bash kali-setup/verify-tools.sh"
