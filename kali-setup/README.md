# Kali Linux Setup

Scripts to initialize and configure Kali Linux for the Security Testing Framework.

## Overview

The framework integrates 150+ Kali Linux security tools via SSH. These setup scripts configure your Kali Linux instance for use with the framework.

## Prerequisites

- Kali Linux 2024.x (or newer)
- 4GB RAM minimum
- 20GB disk space minimum
- Root/sudo access
- SSH access enabled

## Setup Steps

### Step 1: Initialize Kali Linux

```bash
# Run once during initial setup
bash kali-setup/kali-init.sh
```

This script:
- Updates system packages
- Installs essential tools (curl, git, python3)
- Creates framework directories
- Sets appropriate permissions

### Step 2: Install Security Tools

```bash
# Install 150+ security tools (takes 20-30 minutes)
bash kali-setup/install-tools.sh
```

This installs (per-package, so one unavailable/renamed package doesn't abort the rest — see `install-tools.sh` for the exact list and any that fail on your specific Kali release):
- **Network Tools:** nmap, zmap, masscan
- **Web Testing:** burpsuite, sqlmap, ffuf, wfuzz, nuclei, zaproxy
- **OSINT:** python3-shodan
- **Exploitation:** metasploit-framework, hashcat, john
- **Analysis:** ghidra, radare2, binwalk
- **Wireless:** aircrack-ng, wifite, pixiewps
- **Others:** git, curl, wget, openssl, ssh, netcat-traditional
- Postman has no apt package on Kali/Debian — install manually (AppImage/snap) if needed; it's optional since curl/httpie cover the same testing

### Step 3: Verify Tools

```bash
# Verify essential tools are installed
bash kali-setup/verify-tools.sh
```

Checks that required tools are installed and accessible.

## SSH Configuration

To use the framework from your host machine:

### 1. Enable SSH on Kali VM

```bash
# Start SSH service
sudo systemctl start ssh
sudo systemctl enable ssh

# Verify SSH is running
sudo systemctl status ssh
```

### 2. Configure SSH Keys (Optional but Recommended)

```bash
# Generate SSH key on host
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

# Copy key to Kali VM
ssh-copy-id -i ~/.ssh/id_rsa.pub kali@<kali-ip>

# Test connection
ssh kali@<kali-ip> "echo 'SSH works!'"
```

### 3. Set the Kali Connection Environment Variables

The framework does not have a config object to edit — `orchestrator/kali-wrapper.sh` and `orchestrator/kali-health-check.sh` read the connection details from environment variables (or your engagement's git-ignored `.env`, if you set them there):

```bash
export KALI_HOST=kali-vm-ip-or-hostname   # default: 127.0.0.1
export KALI_USER=kali                     # default: kali
export KALI_KEY=/path/to/.ssh/id_ed25519  # optional; omit to use ssh-agent/default key

# Verify it works
bash orchestrator/kali-health-check.sh
```

## Troubleshooting

### Tools Not Installing

```bash
# Update package lists
sudo apt-get update

# Retry installation
bash kali-setup/install-tools.sh
```

### SSH Connection Issues

```bash
# Test SSH connection
ssh -v kali@<kali-ip>

# Check Kali SSH service
sudo systemctl status ssh

# Enable SSH if disabled
sudo systemctl start ssh
```

### Missing Dependencies

```bash
# Install build tools
sudo apt-get install -y build-essential gcc g++ make

# Retry tool installation
bash kali-setup/install-tools.sh
```

## Available Tools

See [DOCUMENTATION.md](../docs/DOCUMENTATION.md) or the built-in integration for a complete list of 150+ integrated tools.

## Security Notes

- Always use SSH keys instead of passwords when possible
- Keep Kali Linux updated: `sudo apt-get update && sudo apt-get upgrade`
- Use a dedicated Kali VM for testing
- Restrict SSH access with firewall rules
- Never expose Kali SSH to the internet without proper security

## Support

For issues:
1. Check tool logs: `journalctl -u ssh`
2. Verify network connectivity: `ping <kali-ip>`
3. Check documentation: [README.md](../README.md)
