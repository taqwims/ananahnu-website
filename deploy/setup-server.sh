#!/bin/bash
# ============================================================
# setup-server.sh — One-time VPS Ubuntu 22.04 Setup (No Docker)
# ============================================================
# Usage: sudo bash setup-server.sh
#
# Installs and configures:
# - Go 1.25 (for building backend)
# - Node.js 22 LTS (for building frontend)
# - PostgreSQL 15
# - Nginx (reverse proxy + static files)
# - Certbot (Let's Encrypt SSL)
# - UFW Firewall
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Check root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

echo "============================================"
echo " HalalCore.id — VPS Setup Script"
echo " Ubuntu 22.04 LTS (No Docker)"
echo "============================================"
echo ""

# ============================================
# 1. System Update
# ============================================
log "Updating system packages..."
apt update && apt upgrade -y
apt install -y curl wget git build-essential unzip

# ============================================
# 2. Install Go
# ============================================
GO_VERSION="1.25.4"
log "Installing Go ${GO_VERSION}..."
if ! command -v go &> /dev/null || [[ "$(go version 2>/dev/null)" != *"${GO_VERSION}"* ]]; then
    wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz

    # Add to PATH for all users
    if ! grep -q '/usr/local/go/bin' /etc/profile.d/go.sh 2>/dev/null; then
        echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh
        chmod +x /etc/profile.d/go.sh
    fi
    export PATH=$PATH:/usr/local/go/bin
    log "Go ${GO_VERSION} installed: $(go version)"
else
    log "Go already installed: $(go version)"
fi

# ============================================
# 3. Install Node.js 22 LTS
# ============================================
log "Installing Node.js 22 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
    log "Node.js installed: $(node -v)"
else
    log "Node.js already installed: $(node -v)"
fi

# ============================================
# 4. Install PostgreSQL
# ============================================
log "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    log "PostgreSQL installed"
else
    log "PostgreSQL already installed"
fi

# Configure PostgreSQL user & database
log "Configuring PostgreSQL..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='ananahnu'" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE USER ananahnu WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';"
    log "PostgreSQL user 'ananahnu' created"
}
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='ananahnu'" | grep -q 1 || {
    sudo -u postgres psql -c "CREATE DATABASE ananahnu OWNER ananahnu;"
    log "PostgreSQL database 'ananahnu' created"
}

# ============================================
# 5. Install Nginx
# ============================================
log "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    log "Nginx installed"
else
    log "Nginx already installed"
fi

# ============================================
# 6. Install Certbot
# ============================================
log "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    log "Certbot installed"
else
    log "Certbot already installed"
fi

# ============================================
# 7. Configure UFW Firewall
# ============================================
log "Configuring UFW Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
log "UFW configured (SSH + HTTP + HTTPS)"

# ============================================
# 8. Create Application Directories
# ============================================
APP_DIR="/opt/halalcore"
log "Creating application directories..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/backend"
mkdir -p "$APP_DIR/backend/uploads"
mkdir -p "$APP_DIR/backend/paymentproof"
mkdir -p "$APP_DIR/backend/consultant"
mkdir -p "$APP_DIR/backend/temp_docx"
mkdir -p "$APP_DIR/backend/templates"
mkdir -p /var/www/halalcore.id
mkdir -p /var/www/telemarketing.halalcore.id

# ============================================
# 9. Create backend system user
# ============================================
log "Creating halalcore system user..."
if ! id "halalcore" &>/dev/null; then
    useradd --system --no-create-home --shell /bin/false halalcore
    log "System user 'halalcore' created"
else
    log "System user 'halalcore' already exists"
fi

# Set ownership
chown -R halalcore:halalcore "$APP_DIR/backend"
chown -R www-data:www-data /var/www/halalcore.id
chown -R www-data:www-data /var/www/telemarketing.halalcore.id

# ============================================
# 10. Setup Nginx
# ============================================
log "Setting up Nginx..."
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "============================================"
echo " Setup Complete!"
echo "============================================"
echo ""
echo " Installed: Go ${GO_VERSION}, Node.js $(node -v), PostgreSQL, Nginx, Certbot"
echo ""
echo " Next steps:"
echo ""
echo " 1. Clone your repo:"
echo "    git clone <your-repo-url> ${APP_DIR}/ananahnu"
echo ""
echo " 2. Point DNS records to this server:"
echo "    A  halalcore.id                → <SERVER_IP>"
echo "    A  www.halalcore.id            → <SERVER_IP>"
echo "    A  api.halalcore.id            → <SERVER_IP>"
echo "    A  telemarketing.halalcore.id  → <SERVER_IP>"
echo ""
echo " 3. IMPORTANT — Change the PostgreSQL password:"
echo "    sudo -u postgres psql -c \"ALTER USER ananahnu PASSWORD 'your_secure_password';\""
echo "    Then update the same password in backend/.env.production"
echo ""
echo " 4. Get SSL certificates (after DNS propagates):"
echo "    certbot --nginx -d halalcore.id -d www.halalcore.id -d api.halalcore.id -d telemarketing.halalcore.id"
echo ""
echo " 5. Copy Nginx configs & deploy:"
echo "    cd ${APP_DIR}/ananahnu"
echo "    bash deploy/deploy.sh"
echo ""
