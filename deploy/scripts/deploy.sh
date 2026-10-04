#!/bin/bash
# crabAI — production deploy script.
#
# Run this ON YOUR PRODUCTION SERVER (Ubuntu/Debian) as root or sudo.
# It sets up:
#   1. System user `crabai`
#   2. /opt/crabai-api (FastAPI backend, run by systemd)
#   3. /var/www/crabai  (Vue static files, served by nginx)
#   4. nginx config + Let's Encrypt SSL
#   5. systemd service, started and enabled
#
# Usage:
#   sudo bash deploy.sh your-domain.com
#
# Example:
#   sudo bash deploy.sh crabai.example.com
#
# Idempotent — safe to re-run to update the deployed code.

set -euo pipefail

# --- Args -------------------------------------------------------------------
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
    echo "❌ Usage: sudo bash $0 <your-domain.com>"
    echo "   Example: sudo bash $0 crabai.example.com"
    exit 1
fi

# Detect the repo root (parent of the deploy/ folder).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "============================================================"
echo "  crabAI production deployment"
echo "  Domain: $DOMAIN"
echo "  Repo:   $REPO_ROOT"
echo "============================================================"
echo ""

# --- 1. System user --------------------------------------------------------
echo "▶ Step 1/7: Creating 'crabai' system user..."
if ! id -u crabai &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin crabai
    echo "  ✓ created user 'crabai'"
else
    echo "  ✓ user 'crabai' already exists"
fi

# --- 2. Install system deps ------------------------------------------------
echo "▶ Step 2/7: Installing system packages (nginx, certbot, uv, python)..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl git \
    build-essential python3-dev >/dev/null

# Install uv (Python package manager) if not present.
if ! command -v uv &>/dev/null; then
    echo "  installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ln -sf ~/.local/bin/uv /usr/local/bin/uv
fi
echo "  ✓ system packages installed"

# --- 3. Deploy FastAPI backend ---------------------------------------------
echo "▶ Step 3/7: Deploying FastAPI backend to /opt/crabai-api..."
mkdir -p /opt/crabai-api

# Sync the backend code.
rsync -a --delete \
    --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' \
    --exclude 'data/faiss_index' --exclude 'data/uploads' --exclude '.env' \
    "$REPO_ROOT/mini-services/crabai-api/" /opt/crabai-api/

# Install Python deps.
cd /opt/crabai-api
sudo -u crabai uv sync --frozen 2>/dev/null || sudo -u crabai uv sync
chown -R crabai:crabai /opt/crabai-api

# Ensure data dirs exist and are writable by the crabai user.
mkdir -p /opt/crabai-api/data/{faiss_index,uploads}
chown -R crabai:crabai /opt/crabai-api/data

# Create .env if missing.
if [ ! -f /opt/crabai-api/.env ]; then
    cp "$SCRIPT_DIR/env.production.example" /opt/crabai-api/.env
    chmod 600 /opt/crabai-api/.env
    chown crabai:crabai /opt/crabai-api/.env
    echo "  ✓ created /opt/crabai-api/.env (edit it to add your API keys)"
else
    echo "  ✓ /opt/crabai-api/.env already exists (preserved)"
fi
echo "  ✓ backend deployed"

# --- 4. Build + deploy Vue frontend ---------------------------------------
echo "▶ Step 4/7: Building + deploying Vue frontend to /var/www/crabai..."
mkdir -p /var/www/crabai

# Build the Vue project.
cd "$REPO_ROOT/download/crabai-vue"
if [ ! -d node_modules ]; then
    npm install --silent
fi
npm run build

# Sync the built static files.
rsync -a --delete dist/ /var/www/crabai/
chown -R www-data:www-data /var/www/crabai
echo "  ✓ frontend deployed"

# --- 5. nginx config -------------------------------------------------------
echo "▶ Step 5/7: Installing nginx config..."
NGINX_CONF=/etc/nginx/sites-available/crabai.conf
sed "s|CRABAI_DOMAIN|$DOMAIN|g" "$SCRIPT_DIR/nginx/crabai.conf" > "$NGINX_CONF"
chmod 644 "$NGINX_CONF"

# Enable the site (symlink).
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/crabai.conf

# Disable the default site (optional but cleaner).
rm -f /etc/nginx/sites-enabled/default

# Test config.
nginx -t
echo "  ✓ nginx config installed"

# --- 6. systemd service ---------------------------------------------------
echo "▶ Step 6/7: Installing systemd service..."
cp "$SCRIPT_DIR/systemd/crabai-api.service" /etc/systemd/system/crabai-api.service
systemctl daemon-reload
systemctl enable --now crabai-api
echo "  ✓ systemd service enabled + started"

# --- 7. SSL via Let's Encrypt ----------------------------------------------
echo "▶ Step 7/7: Issuing SSL certificate via Let's Encrypt..."
echo "  (this requires your DNS to point to this server already)"
read -p "  Issue SSL cert now? [Y/n] " ISSUE_SSL
ISSUE_SSL="${ISSUE_SSL:-Y}"
if [[ "$ISSUE_SSL" =~ ^[Yy]$ ]]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos --register-unsafely-without-email \
        --redirect || echo "  ⚠ certbot failed — run manually: certbot --nginx -d $DOMAIN"
    echo "  ✓ SSL issued"
else
    echo "  ⚠ skipped SSL — run later: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# --- Final -----------------------------------------------------------------
echo ""
echo "============================================================"
echo "  ✓ Deployment complete!"
echo ""
echo "  Next steps:"
echo "    1. Edit /opt/crabai-api/.env and add your API keys:"
echo "         sudo -u crabai nano /opt/crabai-api/.env"
echo "    2. Restart the backend to pick up new env vars:"
echo "         sudo systemctl restart crabai-api"
echo "    3. Check backend health:"
echo "         curl http://localhost:8000/api/health"
echo "    4. Open your site:"
echo "         https://$DOMAIN"
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status crabai-api     # backend status"
echo "    sudo journalctl -u crabai-api -f     # tail backend logs"
echo "    sudo systemctl reload nginx          # after nginx config edits"
echo "    sudo certbot renew --dry-run         # test SSL auto-renewal"
echo "============================================================"
