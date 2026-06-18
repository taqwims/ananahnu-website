#!/bin/bash
# ============================================================
# deploy.sh — Build & Deploy HalalCore (No Docker)
# ============================================================
# Usage: sudo bash deploy/deploy.sh
# Run from the project root: /opt/halalcore/ananahnu
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Ensure Go is in PATH
export PATH=/usr/local/go/bin:$PATH

APP_DIR="/opt/halalcore"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_WWW="/var/www/halalcore.id"
TELEMARKETING_WWW="/var/www/telemarketing.halalcore.id"

echo ""
echo "============================================"
echo " HalalCore.id — Deploy (No Docker)"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# ============================================
# 1. Pre-flight Checks
# ============================================
info "Running pre-flight checks..."

if [ ! -f "backend/.env.production" ]; then
    error "backend/.env.production not found. Copy from deploy/.env.production.example and configure."
fi
if [ ! -f "frontend/.env.production" ]; then
    error "frontend/.env.production not found."
fi
if [ ! -f "telemarketing/.env.production" ]; then
    error "telemarketing/.env.production not found."
fi

command -v go &>/dev/null || error "Go is not installed. Run setup-server.sh first."
command -v node &>/dev/null || error "Node.js is not installed. Run setup-server.sh first."
command -v nginx &>/dev/null || error "Nginx is not installed. Run setup-server.sh first."

log "Pre-flight checks passed"

# ============================================
# 2. Pull Latest Code
# ============================================
info "Pulling latest code..."
if git rev-parse --is-inside-work-tree &>/dev/null; then
    git pull origin "$(git rev-parse --abbrev-ref HEAD)"
    log "Git pull completed"
else
    warn "Not a git repository, skipping git pull"
fi

# ============================================
# 3. Build Backend (Go)
# ============================================
info "Building backend..."
cd backend
export GO111MODULE=on
go mod download
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o "$BACKEND_DIR/server" ./cmd/api
log "Backend binary built → $BACKEND_DIR/server"

# Copy production env
cp .env.production "$BACKEND_DIR/.env"

# Copy templates
cp -r templates/* "$BACKEND_DIR/templates/" 2>/dev/null || true

# Ensure data directories exist with correct ownership
mkdir -p "$BACKEND_DIR/uploads" "$BACKEND_DIR/paymentproof" "$BACKEND_DIR/consultant" "$BACKEND_DIR/temp_docx"
chown -R halalcore:halalcore "$BACKEND_DIR"

cd ..

# ============================================
# 4. Build Frontend
# ============================================
info "Building frontend..."
cd frontend

# Use production env for build
cp .env.production .env
npm ci --production=false
npm run build

# Copy to Nginx web root
rm -rf "$FRONTEND_WWW"/*
cp -r dist/* "$FRONTEND_WWW/"
chown -R www-data:www-data "$FRONTEND_WWW"
log "Frontend built → $FRONTEND_WWW"

cd ..

# ============================================
# 5. Build Telemarketing
# ============================================
info "Building telemarketing..."
cd telemarketing

# Use production env for build
cp .env.production .env
npm ci --production=false
npm run build

# Copy to Nginx web root
rm -rf "$TELEMARKETING_WWW"/*
cp -r dist/* "$TELEMARKETING_WWW/"
chown -R www-data:www-data "$TELEMARKETING_WWW"
log "Telemarketing built → $TELEMARKETING_WWW"

cd ..

# ============================================
# 6. Setup Systemd Service
# ============================================
info "Setting up backend systemd service..."
cp deploy/halalcore-backend.service /etc/systemd/system/halalcore-backend.service
systemctl daemon-reload
systemctl enable halalcore-backend
systemctl restart halalcore-backend
log "Backend service restarted"

# ============================================
# 7. Setup Nginx Configs
# ============================================
info "Configuring Nginx..."
cp deploy/nginx/halalcore.id.conf /etc/nginx/sites-available/halalcore.id.conf
cp deploy/nginx/telemarketing.halalcore.id.conf /etc/nginx/sites-available/telemarketing.halalcore.id.conf
cp deploy/nginx/api.halalcore.id.conf /etc/nginx/sites-available/api.halalcore.id.conf

ln -sf /etc/nginx/sites-available/halalcore.id.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/telemarketing.halalcore.id.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.halalcore.id.conf /etc/nginx/sites-enabled/

if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "Nginx reloaded"
else
    warn "Nginx config test failed! Check: nginx -t"
fi

# ============================================
# 8. Health Checks
# ============================================
info "Running health checks..."
sleep 3

# Backend
RETRIES=10
for i in $(seq 1 $RETRIES); do
    if curl -sf http://localhost:8080/ping > /dev/null 2>&1; then
        log "Backend API is healthy ✓"
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        warn "Backend health check failed. Check: journalctl -u halalcore-backend -f"
    fi
    sleep 2
done

# Frontend
if curl -sf http://localhost:80 > /dev/null 2>&1; then
    log "Nginx is serving ✓"
else
    warn "Nginx check failed"
fi

# ============================================
# 9. Summary
# ============================================
echo ""
echo "============================================"
echo " Deployment Complete!"
echo "============================================"
echo ""
echo " Services:"
echo "   Frontend:      /var/www/halalcore.id             → https://halalcore.id"
echo "   Telemarketing: /var/www/telemarketing.halalcore.id → https://telemarketing.halalcore.id"
echo "   Backend API:   /opt/halalcore/backend/server     → https://api.halalcore.id"
echo ""
echo " Useful commands:"
echo "   Backend logs:   journalctl -u halalcore-backend -f"
echo "   Restart backend: systemctl restart halalcore-backend"
echo "   Nginx logs:     tail -f /var/log/nginx/access.log"
echo "   Nginx errors:   tail -f /var/log/nginx/error.log"
echo "   Redeploy:       sudo bash deploy/deploy.sh"
echo ""
