#!/bin/bash
# crabAI — fast update script. Re-syncs code + rebuilds frontend without
# touching nginx/systemd config or .env.
#
# Use this when you've made code changes and want to push them to prod.
#
# Usage:
#   sudo bash update.sh
#
# After this runs, systemd automatically restarts the backend (because we
# use Restart=on-failure, you may want to `systemctl restart crabai-api`
# explicitly to pick up Python code changes).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "▶ Syncing backend..."
rsync -a --delete \
    --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' \
    --exclude 'data' --exclude '.env' \
    "$REPO_ROOT/mini-services/crabai-api/" /opt/crabai-api/

chown -R crabai:crabai /opt/crabai-api
sudo -u crabai uv sync --frozen 2>/dev/null -C /opt/crabai-api \
    || sudo -u crabai uv sync -C /opt/crabai-api

echo "▶ Rebuilding Vue frontend..."
cd "$REPO_ROOT/download/crabai-vue"
npm install --silent
npm run build

echo "▶ Syncing frontend..."
rsync -a --delete dist/ /var/www/crabai/
chown -R www-data:www-data /var/www/crabai

echo "▶ Restarting backend..."
systemctl restart crabai-api

echo "✓ Done. Health check:"
sleep 2
curl -s http://localhost:8000/api/health
echo
