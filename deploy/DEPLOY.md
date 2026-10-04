# crabAI — Production Deployment Guide

This guide walks you through deploying crabAI to a fresh Ubuntu 22.04+ server
using nginx + systemd + Let's Encrypt.

## Architecture

```
                    Internet
                       │
                       ▼
        ┌─────────────────────────────┐
        │  nginx (port 80, 443 SSL)   │
        │  - serves Vue static files  │
        │  - proxies /api/* → :8000  │
        │  - TLS termination         │
        └──────┬──────────────┬──────┘
               │              │
       static files       /api/* (proxy)
               ▼              ▼
        /var/www/crabai    127.0.0.1:8000
                            │
                            ▼
                  ┌──────────────────┐
                  │ FastAPI (systemd) │
                  │ user: crabai      │
                  │ /opt/crabai-api   │
                  └──────────────────┘
```

## What gets installed

| Component | Where | Run by |
|---|---|---|
| Vue static files | `/var/www/crabai/` | nginx |
| FastAPI backend | `/opt/crabai-api/` | systemd (`crabai` user) |
| FAISS index + uploads | `/opt/crabai-api/data/` | `crabai` user |
| SQLite DB | `/opt/crabai-api/data/crabai_demo.db` | `crabai` user |
| `.env` file | `/opt/crabai-api/.env` (mode 600) | `crabai` user |
| nginx config | `/etc/nginx/sites-available/crabai.conf` | root |
| SSL certs | `/etc/letsencrypt/live/<domain>/` | root |

## Prerequisites

1. **VPS or dedicated server** — Ubuntu 22.04+ or Debian 12+
2. **Domain pointing to the server's IP** — `crabai.example.com` A record → your server's IPv4
3. **Root or sudo access**
4. **API keys**:
   - NVIDIA: free at https://build.nvidia.com (no credit card)
   - Cloudflare: free at https://dash.cloudflare.com/profile/api-tokens (optional, for real embeddings)

## Deploy — one command

```bash
# On your laptop — push the repo to your server
ssh root@your-server "mkdir -p /opt/crabai && chown -R $USER:$USER /opt/crabai"
rsync -avz --exclude node_modules --exclude .venv --exclude __pycache__ \
    /home/z/my-project/ root@your-server:/opt/crabai/repo

# On the server — run the deploy script
ssh root@your-server
cd /opt/crabai/repo
sudo bash deploy/scripts/deploy.sh crabai.example.com
```

The script:
1. Creates a `crabai` system user
2. Installs nginx, certbot, uv, Python deps
3. Deploys the FastAPI backend to `/opt/crabai-api/`
4. Builds the Vue frontend and copies it to `/var/www/crabai/`
5. Installs the nginx config + systemd service
6. Issues an SSL cert via Let's Encrypt
7. Starts everything

Total time: ~5 minutes on a fresh server.

## After deploy

### Add your API keys

```bash
sudo -u crabai nano /opt/crabai-api/.env
# Edit and paste your real keys:
#   NVIDIA_API_KEY=nvapi-your-real-key
#   CF_API_TOKEN=your-cloudflare-token
#   CF_ACCOUNT_ID=your-cloudflare-account
```

Then restart the backend to pick up the new env vars:

```bash
sudo systemctl restart crabai-api
sudo journalctl -u crabai-api -f    # watch the startup log
```

You should see:
```
[env] loaded /opt/crabai-api/.env
[startup] initializing RAG agent...
[embeddings] using Cloudflare Workers AI (@cf/baai/bge-base-en-v1.5)
[llm] using NVIDIA NIM (meta/llama-3.3-70b-instruct)
[startup] crabAI backend ready ✓
```

### Verify

```bash
# Backend up?
curl http://localhost:8000/api/health
# → {"status":"ok","service":"crabai-api"}

# nginx serving the frontend?
curl -I https://crabai.example.com
# → HTTP/2 200

# Upload + RAG end-to-end?
curl -X POST https://crabai.example.com/api/documents/upload \
    -F "file=@/path/to/test.pdf"
curl -X POST https://crabai.example.com/api/rag/chat \
    -H "Content-Type: application/json" \
    -d '{"question":"What is this about?","lang":"en"}'
```

## Updating — push new code

After you make changes locally and want to deploy them:

```bash
# On your laptop — push to server
rsync -avz --exclude node_modules --exclude .venv --exclude __pycache__ \
    /home/z/my-project/ root@your-server:/opt/crabai/repo

# On the server — run the update script (fast, doesn't touch config)
sudo bash /opt/crabai/repo/deploy/scripts/update.sh
```

The update script:
- Syncs backend code to `/opt/crabai-api/`
- Rebuilds the Vue frontend
- Restarts the backend

It does NOT touch:
- `.env` (your API keys)
- nginx config
- SSL certs
- FAISS index / uploaded docs
- SQLite DB

## Common operations

```bash
# View backend logs (live)
sudo journalctl -u crabai-api -f

# View backend status
sudo systemctl status crabai-api

# Restart backend (e.g. after editing .env)
sudo systemctl restart crabai-api

# Reload nginx (after editing nginx config)
sudo nginx -t && sudo systemctl reload nginx

# Test SSL auto-renewal
sudo certbot renew --dry-run

# View nginx access log
sudo tail -f /var/log/nginx/access.log

# View nginx error log
sudo tail -f /var/log/nginx/error.log
```

## Backup

The only stateful data is `/opt/crabai-api/data/`. Back it up:

```bash
# Manual backup
sudo tar -czf crabai-backup-$(date +%F).tar.gz /opt/crabai-api/data/

# Or via cron — daily at 3am, keep 7 days:
# 0 3 * * * tar -czf /backups/crabai-$(date +\%F).tar.gz /opt/crabai-api/data/ && find /backups -name 'crabai-*.tar.gz' -mtime +7 -delete
```

This backs up:
- `faiss_index/` — your embedded document vectors
- `uploads/` — the original PDFs/TXTs
- `crabai_demo.db` — the SQLite demo data (regenerable but doesn't hurt to back up)

It does NOT back up the LLM/embeddings API keys — those live in `/opt/crabai-api/.env` and should be backed up separately (e.g. in a password manager).

## Troubleshooting

### Backend won't start

```bash
sudo journalctl -u crabai-api -n 50 --no-pager
```

Common causes:
- **Missing API keys** — the FakeLLM fallback will still start, so this isn't fatal
- **Port 8000 in use** — `sudo lsof -i :8000`
- **Permissions on `data/`** — `sudo chown -R crabai:crabai /opt/crabai-api/data`

### nginx returns 502 Bad Gateway

Backend isn't running or isn't responding:
```bash
sudo systemctl status crabai-api
curl http://localhost:8000/api/health
```

### nginx returns 404 for `/api/*`

The proxy isn't configured. Verify:
```bash
sudo nginx -t
sudo cat /etc/nginx/sites-enabled/crabai.conf | grep -A5 "location /api/"
```

### Upload fails with `413 Request Entity Too Large`

Your PDF is bigger than the `client_max_body_size 10M` limit. Edit nginx config:
```bash
sudo nano /etc/nginx/sites-available/crabai.conf
# Change: client_max_body_size 50M;
sudo nginx -t && sudo systemctl reload nginx
```

### SSE streaming doesn't work

Make sure `proxy_buffering off;` is set in the `/api/` location block (it is by default in our config). Test with:
```bash
curl -N -X POST https://crabai.example.com/api/rag/chat/stream \
    -H "Content-Type: application/json" \
    -d '{"question":"test","lang":"en"}'
```

You should see streaming `event: ...` lines, not a single buffered response.

## Security notes

- The `crabai` user is a system user with no shell (`/usr/sbin/nologin`)
- The systemd service is hardened (`NoNewPrivileges`, `ProtectSystem=strict`, etc.)
- nginx sends security headers (HSTS, X-Frame-Options, CSP)
- Rate limiting on `/api/*` (10 req/sec per IP)
- `.env` is mode 600 (only `crabai` user can read)
- FastAPI listens only on 127.0.0.1 (not exposed to the internet — only nginx can reach it)

To further harden:
- Consider Cloudflare in front of nginx (free, adds DDoS protection + WAF)
- Consider `fail2ban` for SSH brute-force protection
- Consider a firewall (`ufw`) — only allow 22, 80, 443

## Costs

| Item | Cost |
|---|---|
| VPS (Hetzner CX22 — 2 vCPU, 4GB RAM) | ~$4/month |
| Domain | ~$10/year |
| SSL (Let's Encrypt) | Free |
| NVIDIA NIM API | Free (1000 req/day) |
| Cloudflare Workers AI | Free (10k req/day) |
| **Total** | **~$4/month + domain** |

A $4/month VPS comfortably handles ~10 concurrent demo users.

## Scaling (when you outgrow the single VPS)

The architecture scales cleanly:
- **More backend capacity**: increase `--workers` in the systemd service, or split FastAPI across multiple servers behind a load balancer
- **Larger vector store**: switch from FAISS to Qdrant or pgvector (one-line change in `rag_agent.py`)
- **More uploads**: move `data/uploads/` to S3 (only the FAISS index needs to be local)
- **Multi-region**: nginx upstream can point to multiple FastAPI backends with `keepalive`

But for a customer demo, the single $4/month VPS is more than enough.
