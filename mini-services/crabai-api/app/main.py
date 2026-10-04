"""
FastAPI app — crabAI backend.

Endpoints:
    GET  /api/health
    POST /api/rag/chat           -> {answer, sources[]}
    POST /api/sql/chat           -> {answer, sql, columns, rows}
    POST /api/combined/chat      -> {answer, rag_sources, sql, columns, rows, route}
    GET  /api/documents          -> {documents: [...]}
    POST /api/documents/upload   (multipart) -> {document: {...}}

    POST /api/rag/chat/stream    -> SSE stream of answer tokens + sources
    POST /api/sql/chat/stream    -> SSE stream of answer tokens + sql + rows
    POST /api/combined/chat/stream -> SSE stream
"""
import os
import json
import asyncio
import tempfile
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .rag_agent import get_rag_agent
from .sql_agent import get_sql_agent
from .supervisor import ask_combined


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload RAG + SQL agents at startup so first request is fast."""
    print("[startup] initializing RAG agent...")
    get_rag_agent()
    print("[startup] initializing SQL agent...")
    get_sql_agent()
    print("[startup] crabAI backend ready ✓")
    yield


app = FastAPI(title="crabAI API", version="1.0.0", lifespan=lifespan)

# Allow the Next.js frontend (same origin, plus local dev) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------- request models -----------------------------------

class RagRequest(BaseModel):
    question: str
    lang: str = "en"


class SqlRequest(BaseModel):
    question: str
    lang: str = "en"


class CombinedRequest(BaseModel):
    question: str
    lang: str = "en"


# ------------------------- endpoints ---------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "crabai-api"}


@app.post("/api/rag/chat")
async def rag_chat(req: RagRequest):
    if not req.question.strip():
        raise HTTPException(400, "question is required")
    agent = get_rag_agent()
    # Offload to a thread so we don't block the event loop during LLM call.
    result = await asyncio.to_thread(agent.ask, req.question, req.lang)
    return {
        "answer": result.answer,
        "sources": result.sources,
    }


@app.post("/api/sql/chat")
async def sql_chat(req: SqlRequest):
    if not req.question.strip():
        raise HTTPException(400, "question is required")
    agent = get_sql_agent()
    result = await asyncio.to_thread(agent.ask, req.question, req.lang)
    return {
        "answer": result.answer,
        "sql": result.sql,
        "columns": result.columns,
        "rows": result.rows,
    }


@app.post("/api/combined/chat")
async def combined_chat(req: CombinedRequest):
    if not req.question.strip():
        raise HTTPException(400, "question is required")
    result = await asyncio.to_thread(ask_combined, req.question, req.lang)
    return {
        "answer": result.answer,
        "rag_sources": result.rag_sources,
        "sql": result.sql,
        "sql_columns": result.sql_columns,
        "sql_rows": result.sql_rows,
        "route": result.route,
    }


# ------------------------- document management -----------------------------

@app.get("/api/documents")
async def list_documents():
    """List all currently indexed documents in the FAISS vectorstore."""
    agent = get_rag_agent()
    docs = agent.list_documents()
    return {
        "documents": [
            {
                "filename": d.filename,
                "hash": d.hash,
                "pages": d.pages,
                "chunks": d.chunks,
                "uploaded_at": d.uploaded_at,
            }
            for d in docs
        ],
        "total": len(docs),
    }


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF, TXT, or MD), embed it, and add to FAISS.
    Returns the document metadata. Re-uploading the same content is a no-op
    (detected via SHA-256 hash).
    """
    if not file.filename:
        raise HTTPException(400, "filename is required")

    # Read uploaded bytes to a temp file (PyPDFLoader needs a path).
    suffix = os.path.splitext(file.filename)[1].lower()
    if suffix not in (".pdf", ".txt", ".md"):
        raise HTTPException(400, f"Unsupported file type: {suffix} (use PDF, TXT, or MD)")

    # Write to a temp file under data/uploads/ so paths are stable in the manifest.
    uploads_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "uploads"
    )
    os.makedirs(uploads_dir, exist_ok=True)
    # Sanitize filename (no path traversal).
    safe_name = os.path.basename(file.filename)
    dest = os.path.join(uploads_dir, safe_name)
    with open(dest, "wb") as f:
        f.write(await file.read())

    # Index it (offloaded so we don't block the event loop during embedding).
    agent = get_rag_agent()
    try:
        doc = await asyncio.to_thread(agent.add_document, dest)
    except Exception as e:
        raise HTTPException(500, f"Indexing failed: {e}")

    return {
        "document": {
            "filename": doc.filename,
            "hash": doc.hash,
            "pages": doc.pages,
            "chunks": doc.chunks,
            "uploaded_at": doc.uploaded_at,
        },
    }


# ------------------------- SSE streaming endpoints -------------------------

def _sse(event: str, data: dict) -> str:
    """Format a Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.post("/api/rag/chat/stream")
async def rag_chat_stream(req: RagRequest):
    """Stream RAG answer as SSE: thinking -> sources -> token -> done."""
    if not req.question.strip():
        raise HTTPException(400, "question is required")
    agent = get_rag_agent()

    async def gen():
        yield _sse("thinking", {"message": "Retrieving documents..."})
        result = await asyncio.to_thread(agent.ask, req.question, req.lang)
        yield _sse("sources", {"sources": result.sources})
        # For simplicity, send the full answer as one token — true token streaming
        # would require a streaming LLM + a different agent design.
        yield _sse("token", {"text": result.answer})
        yield _sse("done", {})

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/api/sql/chat/stream")
async def sql_chat_stream(req: SqlRequest):
    if not req.question.strip():
        raise HTTPException(400, "question is required")
    agent = get_sql_agent()

    async def gen():
        yield _sse("thinking", {"message": "Reading schema..."})
        result = await asyncio.to_thread(agent.ask, req.question, req.lang)
        if result.sql:
            yield _sse("sql", {"sql": result.sql})
            yield _sse("rows", {"columns": result.columns, "rows": result.rows})
        yield _sse("thinking", {"message": "Analyzing results..."})
        yield _sse("token", {"text": result.answer})
        yield _sse("done", {})

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/api/combined/chat/stream")
async def combined_chat_stream(req: CombinedRequest):
    if not req.question.strip():
        raise HTTPException(400, "question is required")

    async def gen():
        yield _sse("thinking", {"message": "Routing to agents..."})
        result = await asyncio.to_thread(ask_combined, req.question, req.lang)
        yield _sse("route", {"route": result.route})
        if result.rag_sources:
            yield _sse("rag_sources", {"sources": result.rag_sources})
        if result.sql:
            yield _sse("sql", {"sql": result.sql})
            yield _sse("rows", {"columns": result.sql_columns, "rows": result.sql_rows})
        yield _sse("token", {"text": result.answer})
        yield _sse("done", {})

    return StreamingResponse(gen(), media_type="text/event-stream")


def main():
    """Run the FastAPI app with uvicorn on port 8000."""
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
