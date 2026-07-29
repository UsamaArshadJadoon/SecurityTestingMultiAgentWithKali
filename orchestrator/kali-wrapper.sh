#!/bin/bash

# ============================================================================
# KALI WRAPPER
# ============================================================================
# Runs a command on the Kali Linux instance over SSH. Used by the framework
# to execute security tools remotely.
#
# Configure via environment variables (defaults shown):
#   KALI_HOST  (default: 127.0.0.1)
#   KALI_PORT  (default: 22)
#   KALI_USER  (default: kali)
#   KALI_KEY   (optional path to SSH private key)
#
# Usage: bash orchestrator/kali-wrapper.sh "<command>"
# Example: bash orchestrator/kali-wrapper.sh "nmap -sV target.example.com"
# ============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: bash orchestrator/kali-wrapper.sh \"<command>\""
    exit 1
fi

KALI_HOST="${KALI_HOST:-127.0.0.1}"
KALI_PORT="${KALI_PORT:-22}"
KALI_USER="${KALI_USER:-kali}"

SSH_OPTS="-p $KALI_PORT -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
if [ -n "$KALI_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $KALI_KEY"
fi

# shellcheck disable=SC2086
ssh $SSH_OPTS "$KALI_USER@$KALI_HOST" "$1"
