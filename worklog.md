# crabAI — Worklog

---
Task ID: rag-agent-faiss-upload
Agent: main (Super Z)
Task: Refactor RAG Agent to match user's reference code — FAISS vector store (not FAISS), Cloudflare Workers AI embeddings, PyPDFLoader, SHA-256 manifest for change detection, document upload endpoint so users can upload PDFs/TXT through the UI. RAG Agent retrieves only from FAISS (no preloaded demo docs).

Work Log:
- Installed: faiss-cpu 1.15.1, langchain-cloudflare 0.4.1, pypdf 6.19.0, python-multipart 0.0.32
- Rewrote embeddings.py:
  - Primary: CloudflareWorkersAIEmbeddings (@cf/baai/bge-base-en-v1.5) — matches user's stack
  - Fallback 1: Nomic API (nomic-embed-text-v1.5)
  - Fallback 2: HashingEmbeddings (deterministic, no API key)
  - All produce 768-dim vectors so FAISS index can be queried with any backend
- Updated llm.py to match user's settings: temperature=0, reasoning_format="parsed", max_tokens=None, max_retries=1
- Rewrote rag_agent.py:
  - FAISS replaces FAISS (persistent on disk)
  - SHA-256 file hash manifest (manifest.json) — skips re-embedding if file unchanged
  - PyPDFLoader for PDFs, TextLoader for TXT/MD
  - RecursiveCharacterTextSplitter with chunk_size=1000, chunk_overlap=200 (matches user)
  - add_document() method: indexes a file, dedups by hash
  - list_documents() method: returns all indexed docs
  - ask() method: retrieves top-3 from FAISS, builds context with [1] [2] [3] citations, LCEL chain with system+human prompts
  - FAISS starts EMPTY (no preloaded demo docs) — per user's requirement
  - Sources deduped by page_content (FAISS can return duplicates from re-uploads)
  - Source paths shown as basename only (not absolute server path)
- Added 2 new endpoints in main.py:
  - GET  /api/documents        → list indexed documents
  - POST /api/documents/upload → multipart file upload, embeds + indexes in FAISS
- Updated next.config.ts rewrites to proxy /api/documents/* to port 8000
- Updated Next.js agent-demo.tsx:
  - Added upload UI in RAG mode (drop zone + click to browse + file picker)
  - Shows list of indexed documents with pages + chunks badges
  - Dynamic "N docs indexed" count in header
  - Drag-and-drop support
  - Empty state when no docs uploaded
  - Bilingual EN/中文 strings for all upload UI
- Verified end-to-end:
  - Started FastAPI, hit /api/health (200 OK)
  - /api/documents returns empty list initially
  - /api/rag/chat returns "no docs uploaded" message when empty
  - Uploaded test_rag_doc.txt via /api/documents/upload → indexed 2 chunks
  - Re-uploaded same file → SKIPPED re-embedding (manifest hash matched)
  - RAG query retrieved chunks from FAISS with citations
  - Uploaded second doc (crabai_test.txt) → 1 chunk
  - UI now shows "2 docs indexed" with both files listed
  - Asked "What is crabAI and how long does a project take?" → retrieved the FAQ doc (right doc for the question)
- ESLint passes clean (zero errors, zero warnings)

Stage Summary:
- Backend: real Python FAISS + LangChain + Groq + Cloudflare embeddings (with fallbacks). Document upload endpoint works. Re-embedding is skipped when file hash matches. FAISS persists across restarts.
- Frontend: RAG tab now has a drag-and-drop upload zone + indexed docs list. SQL and Combined tabs unchanged. All 3 modes still work.
- To go fully live: user sets GROQ_API_KEY (and optionally CF_API_TOKEN + CF_ACCOUNT_ID for real embeddings) in mini-services/crabai-api/.env, restarts FastAPI — all 3 agents produce real LLM answers.
- Files changed: embeddings.py, llm.py, rag_agent.py, main.py (backend); next.config.ts, agent-demo.tsx (frontend).
