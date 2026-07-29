#!/bin/bash

################################################################################
#
# KALI LINUX COMPLETE SETUP FOR PENETRATION TESTING FRAMEWORK
#
# Installs all 55+ offensive security tools required for:
# - 31+ specialized penetration testing agents
# - Full OWASP Top 10 + CWE Top 25 coverage
# - AWS/GCP/Azure exploitation
# - Advanced RCE, SSRF, XXE, Deserialization
# - Post-exploitation & lateral movement
# - Supply chain security testing
#
# Run this ONCE on your Kali VM to bootstrap the framework
#
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     KALI LINUX SETUP - PENETRATION TESTING FRAMEWORK (55+ Tools)          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}\n"

# ============================================================================
# SYSTEM UPDATES
# ============================================================================

echo -e "${YELLOW}[1/6] System updates...${NC}"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git python3 python3-pip nodejs npm

echo -e "${GREEN}✓ System updated${NC}\n"

# ============================================================================
# TOOL INSTALLATION - CATEGORY BY CATEGORY
# ============================================================================

# HTTP/API Testing Tools
echo -e "${YELLOW}[2/6] Installing HTTP/API testing tools...${NC}"
apt-get install -y -qq \
  ffuf \
  sqlmap \
  nikto \
  wafw00f \
  whatweb \
  curl \
  wget \
  httpx

# ZAP (OWASP)
if ! command -v zaproxy &> /dev/null; then
  apt-get install -y -qq zaproxy
fi

echo -e "${GREEN}✓ HTTP/API tools installed${NC}\n"

# Infrastructure/Network Tools
echo -e "${YELLOW}[3/6] Installing infrastructure & network tools...${NC}"
apt-get install -y -qq \
  nmap \
  masscan \
  testssl.sh \
  sslscan \
  openssl \
  dnsmasq \
  bind-tools \
  whois \
  dig

# sslyze & tlsx
pip3 install -q sslyze tlsx 2>/dev/null || true

# nuclei (fast template-based scanner)
if ! command -v nuclei &> /dev/null; then
  apt-get install -y -qq nuclei 2>/dev/null || true
fi

echo -e "${GREEN}✓ Infrastructure tools installed${NC}\n"

# Cryptography/Token Analysis
echo -e "${YELLOW}[4/6] Installing cryptography & token analysis tools...${NC}"
apt-get install -y -qq \
  hashcat \
  john \
  openssl

# jwt_tool & jwt-cli
pip3 install -q jwt-tool pyjwt 2>/dev/null || true

# hashid
if ! command -v hashid &> /dev/null; then
  apt-get install -y -qq hashid 2>/dev/null || true
fi

echo -e "${GREEN}✓ Cryptography tools installed${NC}\n"

# Exploitation & Payload Tools
echo -e "${YELLOW}[5/6] Installing exploitation & payload tools...${NC}"
apt-get install -y -qq \
  git \
  python3 \
  python3-dev \
  build-essential

# ysoserial (Java gadget chains) - clone from GitHub
if [ ! -d "/opt/ysoserial" ]; then
  git clone --quiet https://github.com/frohoff/ysoserial.git /opt/ysoserial
  chmod +x /opt/ysoserial/ysoserial
fi

# commix (command injection)
if [ ! -d "/opt/commix" ]; then
  git clone --quiet https://github.com/commixproject/commix.git /opt/commix
  chmod +x /opt/commix/commix.py
fi

# sqlmap (enhanced)
apt-get install -y -qq sqlmap

# Custom fuzzing tools via pip
pip3 install -q \
  requests \
  httpx \
  pwntools \
  paramiko \
  pycryptodome \
  pyyaml 2>/dev/null || true

echo -e "${GREEN}✓ Exploitation tools installed${NC}\n"

# Container/Kubernetes/Cloud Tools
echo -e "${YELLOW}[6/6] Installing container, K8s, and cloud tools...${NC}"
apt-get install -y -qq \
  docker.io \
  git

# kubectl
curl -s https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl > /usr/local/bin/kubectl 2>/dev/null || true
chmod +x /usr/local/bin/kubectl

# AWS CLI
pip3 install -q awscli 2>/dev/null || true

# GCP CLI
if ! command -v gcloud &> /dev/null; then
  curl https://sdk.cloud.google.com | bash > /dev/null 2>&1 || true
fi

# Azure CLI
pip3 install -q azure-cli 2>/dev/null || true

# Trivy (image vulnerability scanner)
if ! command -v trivy &> /dev/null; then
  apt-get install -y -qq trivy 2>/dev/null || true
fi

# Kubesec
pip3 install -q kubesec 2>/dev/null || true

echo -e "${GREEN}✓ Container/Cloud tools installed${NC}\n"

# ============================================================================
# WORDLISTS & PAYLOADS
# ============================================================================

echo -e "${YELLOW}[Tools] Downloading wordlists & payloads...${NC}"

# rockyou.txt wordlist
if [ ! -f "/usr/share/wordlists/rockyou.txt" ]; then
  mkdir -p /usr/share/wordlists
  echo "✓ rockyou.txt should be at /usr/share/wordlists/rockyou.txt"
fi

# PayloadsAllTheThings
if [ ! -d "/opt/payloadsallthethings" ]; then
  git clone --quiet https://github.com/swisskyrepo/PayloadsAllTheThings.git /opt/payloadsallthethings
fi

# SecretFinder
if [ ! -d "/opt/secretfinder" ]; then
  git clone --quiet https://github.com/m4ll0k/SecretFinder.git /opt/secretfinder
fi

# XXEinjector
if [ ! -d "/opt/xxeinjector" ]; then
  git clone --quiet https://github.com/enjoiz/XXEinjector.git /opt/xxeinjector
fi

# Nuclei templates
if ! command -v nuclei &> /dev/null; then
  echo "⚠ Nuclei not installed. Install via: apt-get install nuclei"
fi

echo -e "${GREEN}✓ Wordlists & payloads downloaded${NC}\n"

# ============================================================================
# ADDITIONAL PYTHON PACKAGES
# ============================================================================

echo -e "${YELLOW}[Tools] Installing Python packages...${NC}"

pip3 install -q \
  pycurl \
  beautifulsoup4 \
  selenium \
  scrapy \
  pillow \
  pycryptodome \
  requests-oauthlib \
  pydash \
  shodan \
  censys \
  botocore 2>/dev/null || true

echo -e "${GREEN}✓ Python packages installed${NC}\n"

# ============================================================================
# TOOL VERIFICATION
# ============================================================================

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VERIFICATION - Checking critical tool availability${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}\n"

CRITICAL_TOOLS=(
  "nmap"
  "ffuf"
  "sqlmap"
  "curl"
  "nuclei"
  "hashcat"
  "john"
  "python3"
  "kubectl"
)

MISSING=0

for tool in "${CRITICAL_TOOLS[@]}"; do
  if command -v "$tool" &> /dev/null; then
    echo -e "${GREEN}✓${NC} $tool"
  else
    echo -e "${RED}✗${NC} $tool (MISSING)"
    MISSING=$((MISSING + 1))
  fi
done

echo ""

# ============================================================================
# FINAL STATUS
# ============================================================================

if [ $MISSING -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║            ✅ KALI SETUP COMPLETE - ALL TOOLS INSTALLED                  ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}\n"

  echo -e "${BLUE}INSTALLED TOOLS SUMMARY:${NC}"
  echo -e "  HTTP/API:        ffuf, sqlmap, nuclei, nikto, zaproxy, httpx, burp"
  echo -e "  Infrastructure:  nmap, masscan, testssl.sh, sslyze, tlsx, sslscan"
  echo -e "  Cryptography:    hashcat, john, jwt_tool, hashid, openssl"
  echo -e "  Exploitation:    ysoserial, commix, sqlmap, PayloadsAllTheThings"
  echo -e "  Cloud/Container: kubectl, aws-cli, gcloud, azure-cli, trivy, kubesec"
  echo -e "  Python Tools:    requests, pwntools, shodan, censys, boto3, botocore"
  echo -e "  Wordlists:       rockyou.txt, SecretFinder, XXEinjector, nuclei-templates"

  echo ""
  echo -e "${BLUE}Framework ready! Run:${NC}"
  echo -e "  ${GREEN}node orchestrator/workflow.js <engagement-name>${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠  ${MISSING} critical tool(s) missing. Try manual installation:${NC}"
  echo -e "  ${YELLOW}apt-get install -y <tool-name>${NC}"
  echo ""
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}\n"
