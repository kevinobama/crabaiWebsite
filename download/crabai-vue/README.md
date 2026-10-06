# crabAI — Vue 3 + Vite frontend

This is the **Vue 3** version of the crabAI demo website. It connects to the
same FastAPI + LangChain + Groq backend as the Next.js version that ships in
this sandbox — pick whichever frontend you prefer.

> ⚠️ The sandbox preview URL only exposes Next.js. To run **this Vue version**
> locally, follow the steps below.

## Architecture

```
┌─────────────────────────────────────────────┐
│   Vue 3 (this project) · Vite · port 5173   │
│   [RAG Agent] [SQL Agent] [Combined]        │
└────────────┬──────────────────┬─────────────┘
             │ /api/* (Vite dev proxy)
             ▼                  ▼
        ┌─────────────────────────────────┐
        │  FastAPI (mini-services/crabai-api) · port 8000  │
        │  /api/rag/chat      /api/sql/chat   /api/combined/chat
        └────────────┬────────────────────┘
                     │
              Python LangChain
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    RAG Agent                SQL Agent
    FAISS      SQLite
    nomic-embed-text
          │
          ▼
        Groq (gpt-oss-20b)
```

## Prerequisites

1. **Node.js 22+** and npm/pnpm/bun
2. **Python 3.12+** and [uv](https://docs.astral.sh/uv/) (recommended) or pip
3. A **Groq API key** — free at https://console.groq.com/keys
4. *(Optional)* A **Nomic API key** for real `nomic-embed-text` embeddings —
   free at https://docs.nomic.ai/atlas/models/text-embedding

## 1. Start the FastAPI backend

```bash
cd mini-services/crabai-api

# Install Python deps
uv sync          # or: pip install -r requirements.txt

# Set your API keys
export GROQ_API_KEY=gsk_your_key_here
export NOMIC_API_KEY=nomic_your_key_here   # optional but recommended

# Run on port 8000
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify: `curl http://localhost:8000/api/health` → `{"status":"ok"}`

## 2. Start the Vue frontend

```bash
cd download/crabai-vue

npm install      # or: pnpm install / bun install
npm run dev      # starts Vite on http://localhost:5173
```

Open http://localhost:5173 in your browser. The Vite dev proxy forwards
`/api/*` to `http://localhost:8000` automatically.

## 3. Production build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

For production, set `VITE_API_BASE` to your deployed FastAPI URL:

```bash
echo "VITE_API_BASE=https://api.yourdomain.com" > .env.local
npm run build
```

## What's included

```
crabai-vue/
├── package.json          # Vue 3, Vite, TypeScript
├── vite.config.ts        # Dev proxy /api → :8000
├── tsconfig.json
├── index.html
├── public/favicon.svg    # 🦀 crab icon
└── src/
    ├── main.ts           # App entry
    ├── App.vue           # Layout: header, hero, demos tabs, footer
    ├── style.css         # Global resets
    ├── components/
    │   └── AgentDemo.vue  # The 3-tab interactive demo
    ├── composables/
    │   └── useLang.ts     # EN/中文 i18n with localStorage persistence
    └── lib/
        ├── api.ts         # API client (rag, sql, combined)
        └── strings.ts     # Bilingual EN/ZH content
```

## What's NOT in this Vue version

The Next.js version has more sections (Services, Industries, Process,
Pricing, FAQ, Contact form) — they're static marketing content. This Vue
version focuses on the **interactive demo** (the most important part for
showing customers). To add the marketing sections, port them from
`src/components/sections/*.tsx` in the Next.js project — the content is in
the bilingual dictionaries at the top of each file.

## Backend endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/rag/chat` | RAG agent — `{question, lang}` → `{answer, sources[]}` |
| `POST /api/sql/chat` | SQL agent — `{question, lang}` → `{answer, sql, columns, rows}` |
| `POST /api/combined/chat` | Supervisor — `{question, lang}` → `{answer, rag_sources, sql, ..., route}` |
| `POST /api/rag/chat/stream` | SSE streaming version of RAG |
| `POST /api/sql/chat/stream` | SSE streaming version of SQL |
| `POST /api/combined/chat/stream` | SSE streaming version of Combined |

## Customizing the demo content

- **RAG documents**: edit `mini-services/crabai-api/app/rag_agent.py` → `DEMO_DOCS`
- **SQL schema + data**: edit `mini-services/crabai-api/app/sql_agent.py` → `_seed_sqlite()`
- **Sample questions**: edit `download/crabai-vue/src/lib/strings.ts`

## Demo mode (no API keys)

If `GROQ_API_KEY` is not set, the backend uses a `FakeLLM` that returns a
"set GROQ_API_KEY" message. The UI works normally — you just won't get real
LLM answers until you plug in a key.

If `NOMIC_API_KEY` is not set, the RAG agent falls back to a deterministic
hashing-based embedder. Retrieval still works (returns docs) but isn't
semantically meaningful — for the demo it's fine because the corpus is
small and curated.

## License

This is your code — do whatever you want with it.
