# crabAI — RAG + SQL Agent Demo

A bilingual (English / Chinese) demo website for selling custom RAG systems
and natural-language SQL agents to prospective customers. Two frontends, one
Python backend.

## What this repo contains

```
my-project/
├ src/                          # Next.js 16 frontend (live preview)
│   └── app/, components/...
├ mini-services/
│   └── crabai-api/                # FastAPI + LangChain backend
│       ├── app/
│       │   ├── main.py            # FastAPI app + endpoints + SSE
│       │   ├── embeddings.py      # Nomic API + Hashing fallback
│       │   ├── llm.py             # Groq + FakeLLM fallback
│       │   ├── rag_agent.py       # FAISS + preloaded docs
│       │   ├── sql_agent.py       # LangChain SQL toolkit + Mysql
│       │   └── supervisor.py      # Routes questions to RAG/SQL/both
│       └── .env.example
└── download/
    └── crabai-vue/                # Vue 3 + Vite frontend (run locally)
        ├── package.json
        ├── vite.config.ts          # Vite dev proxy /api → :8000
        ├── README.md               # Run instructions
        └── src/
            ├── App.vue
            ├── components/AgentDemo.vue
            ├── composables/useLang.ts
            └── lib/{api,strings}.ts
```

## Architecture

```
┌─────────────────────────────────────────────┐
│   Next.js (live preview) OR Vue 3 (local)   │
│   [RAG Agent] [SQL Agent] [Combined]        │
└────────────┬──────────────────┬─────────────┘
             │ /api/*  (Next.js rewrites or Vite proxy)
             ▼                  ▼
      ┌─────────────────────────────────┐
      │  FastAPI  ·  port 8000          │
      │  /api/rag/chat    /api/sql/chat  /api/combined/chat (SSE for each)
      └────────────┬────────────────────┘
                   │
              Python LangChain
                   │
          ┌──────────┴──────────┐
          ▼                     ▼
   RAG Agent                SQL Agent
   FAISS      Mysql (seeded)
   nomic-embed-text
                 │
                 ▼
               Groq
          gpt-oss-20b
```

## Quick start

### 1. Start the backend

```bash
cd mini-services/crabai-api

uv sync                              # install Python deps
export GROQ_API_KEY=gsk_your_key_here # free: https://console.groq.com/keys
export NOMIC_API_KEY=nomic_your_key  # optional, for real embeddings

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Pick a frontend

**Option A — Next.js (the one running in the sandbox preview):**
```bash
# From the repo root:
bun install
bun run dev      # http://localhost:3000
```
Next.js rewrites proxy `/api/*` to FastAPI on port 8000. See `next.config.ts`.

**Option B — Vue 3 + Vite (download and run locally):**
```bash
cd download/crabai-vue
npm install
npm run dev      # http://localhost:5173
```
Vite proxies `/api/*` to FastAPI on port 8000. See `vite.config.ts`.

## Demo mode (no API keys)

If `GROQ_API_KEY` isn't set, the backend uses a `FakeLLM` that returns a
"set GROQ_API_KEY" message instead of a real answer — the UI works normally,
you just won't see real LLM answers until you plug in a key.

If `NOMIC_API_KEY` isn't set, the RAG agent uses a deterministic hashing
embedder (works for the small curated demo corpus but isn't semantically
meaningful).

## What the demos do

| Tab | Endpoint | What happens |
|---|---|---|
| **RAG Agent** | `POST /api/rag/chat` | Retrieves top-3 chunks from FAISS (7 preloaded policy docs), feeds them to Groq, returns answer with cited sources |
| **SQL Agent** | `POST /api/sql/chat` | LangChain SQL toolkit reads the Mysql schema, generates SQL via Groq, executes read-only, returns SQL + rows + summary |
| **Combined** | `POST /api/combined/chat` | Supervisor routes the question (RAG / SQL / both), calls sub-agents, synthesizes a single answer with both sources and SQL |

## Customizing the demo

- **RAG documents**: edit `mini-services/crabai-api/app/rag_agent.py` → `DEMO_DOCS`
- **SQL schema + data**: edit `mini-services/crabai-api/app/sql_agent.py` → `_seed_Mysql()`
- **Sample questions**: edit the `T` dictionary at the top of `src/components/sections/agent-demo.tsx` (Next.js) or `download/crabai-vue/src/lib/strings.ts` (Vue)

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | Next.js 16 (preview) + Vue 3 (downloadable) | Both work, customer can pick |
| API | FastAPI | Python owns the LangChain ecosystem |
| Agent | Python LangChain 1.x | Standard, well-documented |
| LLM | Groq `openai/gpt-oss-20b` | Fast, free, OpenAI-API-compatible |
| Vector store | `FAISS` | Zero setup, perfect for demo |
| Embeddings | `nomic-embed-text` (Nomic API or hashing fallback) | Matches stack spec |
| SQL | Mysql + LangChain SQL toolkit | Self-contained, no external DB |
| Streaming | SSE | Simpler than WebSocket for one-way streaming |

## Using Nginx as a Reverse Proxy

Configure Nginx to route traffic to the appropriate services through a single domain.

```nginx
server {
    listen 80;
    server_name crabai.local;

    # Serve Next.js (port 3000) for root/
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # FastAPI backend (port 8000) — proxy /api/*
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Steps to Set Up

1. **Install Nginx**: `sudo apt install nginx` (Ubuntu) or `brew install nginx` (macOS)
2. **Create config**: `sudo nano /etc/nginx/sites-available/crabai`
3. **Paste the config above**, adjust `server_name` and paths as needed
4. **Enable site**: `sudo ln -s /etc/nginx/sites-available/crabai /etc/nginx/sites-enabled/`
5. **Test**: `sudo nginx -t`
6. **Start Nginx**: `sudo systemctl start nginx`
7. **Access**: Visit `http://crabai.local` — the Next.js UI will load, and all `/api/*` calls will automatically proxy to the FastAPI backend

### With SSL (HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name crabai.local;
    
    ssl_certificate /etc/letsencrypt/live/crabai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crabai/privkey.pem;
    
    # ... same location blocks as above
}
```