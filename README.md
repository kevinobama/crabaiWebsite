# crabAI — RAG + SQL Agent demo

A bilingual (English / Chinese) demo website for selling custom RAG systems
and natural-language SQL agents to prospective customers. Two frontends, one
Python backend.

## What this repo contains

```
my-project/
├── src/                          # Next.js 16 frontend (live preview)
│   └── app/, components/...
├── mini-services/
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




Here's how to start both services — backend first (the frontend depends on it).

## 1. Backend — FastAPI (port 8000)

```bash
cd /home/z/my-project/mini-services/crabai-api

# First time only — install Python deps
uv sync

# Set your API keys (get free keys first)
export GROQ_API_KEY=gsk_your_key_here              # https://console.groq.com/keys
export CF_API_TOKEN=your_cloudflare_token          # optional, for real embeddings
export CF_ACCOUNT_ID=your_cloudflare_account_id   # optional

# Start the server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify it's running** (in a new terminal):
```bash
curl http://localhost:8000/api/health
# → {"status":"ok","service":"crabai-api"}

# Upload a document
curl -X POST http://localhost:8000/api/documents/upload -F "file=@/path/to/your.pdf"

# Ask a question
curl -X POST http://localhost:8000/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this document about?","lang":"en"}'
```

You should see startup logs like:
```
[startup] initializing RAG agent...
[embeddings] using Cloudflare Workers AI (@cf/baai/bge-base-en-v1.5)
[rag] no FAISS index found — creating empty FAISS
[startup] crabAI backend ready ✓
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 2a. Frontend — Next.js (the one in the sandbox preview)

```bash
cd /home/z/my-project

# First time only
bun install        # or: npm install / pnpm install

# Start dev server on port 3000
bun run dev
```

Open **http://localhost:3000** in your browser. Next.js rewrites (in `next.config.ts`) automatically proxy `/api/*` to FastAPI on port 8000 — no extra config needed.

## 2b. Frontend — Vue 3 + Vite (the downloadable one)

```bash
cd /home/z/my-project/download/crabai-vue

# First time only
npm install       # or: pnpm install / bun install

# Start dev server on port 5173
npm run dev
```

Open **http://localhost:5173**. Vite's dev proxy (in `vite.config.ts`) proxies `/api/*` to FastAPI on port 8000 — same as Next.js.

## Running order — important

```
Terminal 1:  cd mini-services/crabai-api && uv run uvicorn ...
                ↓ wait for "Application startup complete"
Terminal 2:  cd /home/z/my-project && bun run dev
                ↓
            open http://localhost:3000
```

Start the **backend first**, then the frontend. If you start the frontend first, you'll see "Network error" in the UI until the backend comes up — then it'll work on the next request.

## File map for editing

```
mini-services/crabai-api/
├── app/
│   ├── main.py          ← FastAPI app + endpoints
│   ├── embeddings.py    ← Cloudflare / Nomic / Hashing
│   ├── llm.py           ← Groq (gpt-oss-20b)
│   ├── rag_agent.py     ← FAISS + upload + retrieval  ← RAG code lives here
│   ├── sql_agent.py     ← LangChain SQL toolkit + Mysql
│   └── supervisor.py    ← Routes to RAG/SQL/both
├── data/
│   ├── faiss_index/     ← created on first upload (persistent)
│   ├── uploads/         ← uploaded files saved here
│   └── crabai_demo.db    ← Mysql for SQL agent
├── .env.example         ← copy to .env, add your keys
└── pyproject.toml       ← Python deps
```

## Common issues

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: langchain_cloudflare` | Run `uv sync` in `mini-services/crabai-api/` |
| `GROQ_API_KEY not set` in answers | Set the env var before starting, or create `.env` (FastAPI auto-loads it via `python-dotenv`) |
| Frontend shows "Network error" | Backend isn't running, or it's on a different port — check `curl http://localhost:8000/api/health` |
| FAISS index rebuilt empty after restart | Normal if no docs uploaded — index persists only after first upload |
| Want to reset everything | `rm -rf mini-services/crabai-api/data/faiss_index mini-services/crabai-api/data/uploads` |

## Quick sanity check — full pipeline

After both servers are running, run this in one command:

```bash
# Upload a doc
curl -X POST http://localhost:8000/api/documents/upload -F "file=@/tmp/test.txt"

# See it in the list
curl http://localhost:8000/api/documents

# Ask a question about it
curl -X POST http://localhost:8000/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this about?","lang":"en"}'
```

All three should return valid JSON with real data. Then open the frontend and try the same flow through the UI — upload a file in the RAG tab, ask a question, see the cited sources.

Want me to:
1. Create a single `start.sh` script that launches both servers with one command?
2. Add a `Makefile` with `make backend` / `make frontend` / `make dev` (both)?
3. Walk through deploying this to a real server (VPS / Render / Railway)?


# 1. Build the frontend
cd /home/z/my-project/download/crabai-vue
npm run build

Run it with a process manager
Option A: PM2 (easiest)
bash
Copy

npm i -g pm2
pm2 start npm --name "myapp" -- start    # runs "npm start" → next start
pm2 startup && pm2 save                  # auto-restart on reboot

nohup uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 --proxy-headers --forwarded-allow-ips=127.0.0.1 &





