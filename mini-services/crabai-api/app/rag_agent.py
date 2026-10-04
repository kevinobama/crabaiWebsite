"""
RAG Agent module.

Architecture (matches the user's reference code):
    Upload PDF -> hash -> PyPDFLoader -> RecursiveCharacterTextSplitter
              -> CloudflareWorkersAIEmbeddings -> FAISS (saved to disk)
              -> manifest.json tracks file hashes (skip re-embedding if unchanged)

    Query    -> embeddings.embed_query -> FAISS.similarity_search -> top-k chunks
              -> Groq LLM -> answer + cited sources

The vectorstore starts EMPTY. The user uploads documents through the API
(POST /api/documents/upload). At first startup, if the FAISS index doesn't
exist yet, we create an empty one so the API doesn't crash — but RAG queries
will return "no documents" until something is uploaded.

If you want to preload a default PDF at startup (matching the user's
reference code pattern), set RAG_PRELOAD_PDF=/path/to/file.pdf in env.
"""
import os
import json
import hashlib
import tempfile
from dataclasses import dataclass
from typing import List
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import FAISS

from .embeddings import get_embeddings
from .llm import get_llm


# ---- Paths --------------------------------------------------------------
VECTORSTORE_DIR = os.environ.get(
    "RAG_VECTORSTORE_DIR",
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "faiss_index"),
)
MANIFEST_PATH = os.path.join(VECTORSTORE_DIR, "manifest.json")
INDEX_FILE = os.path.join(VECTORSTORE_DIR, "index.faiss")


# ---- Helpers: hash-based change detection (per user's reference code) --
def file_hash(path: str) -> str:
    """SHA-256 of file contents — used to detect changes for re-embedding."""
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def load_manifest() -> dict:
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, "r") as f:
            return json.load(f)
    return {}


def save_manifest(manifest: dict) -> None:
    os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)


# ---- Types --------------------------------------------------------------
@dataclass
class RagAnswer:
    answer: str
    sources: List[dict]


@dataclass
class UploadedDoc:
    filename: str
    hash: str
    pages: int
    chunks: int
    uploaded_at: str


# ---- Agent --------------------------------------------------------------
class RagAgent:
    """
    FAISS-backed RAG agent. Documents are uploaded via `add_document()`,
    embedded with the configured provider, and stored in a persistent FAISS
    index. Queries retrieve only from FAISS — there is no in-memory fallback.
    """

    def __init__(self):
        self.embeddings = get_embeddings()
        self.llm = get_llm(temperature=0.0)
        # Match the user's splitter settings.
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        self.vectorstore: FAISS | None = None
        self.manifest: dict = load_manifest()
        self._load_or_init_vectorstore()
        # Optional: preload a default PDF at startup.
        preload = os.environ.get("RAG_PRELOAD_PDF")
        if preload and os.path.exists(preload):
            print(f"[rag] preloading {preload}...")
            self.add_document(preload)

    def _load_or_init_vectorstore(self) -> None:
        """Load existing FAISS index, or create an empty one."""
        if os.path.exists(INDEX_FILE):
            print(f"[rag] loading FAISS index from {VECTORSTORE_DIR}")
            self.vectorstore = FAISS.load_local(
                VECTORSTORE_DIR,
                self.embeddings,
                allow_dangerous_deserialization=True,
            )
            print(f"[rag] loaded {len(self.manifest)} indexed document(s)")
        else:
            print("[rag] no FAISS index found — creating empty vectorstore")
            # Start with an empty FAISS index (no documents).
            self.vectorstore = FAISS.from_documents(
                [Document(page_content="")], self.embeddings
            )
            # Remove the placeholder doc we used to bootstrap.
            self.vectorstore.delete([list(self.vectorstore.index_to_docstore_id.values())[0]])
            self._save_vectorstore()

    def _save_vectorstore(self) -> None:
        os.makedirs(VECTORSTORE_DIR, exist_ok=True)
        self.vectorstore.save_local(VECTORSTORE_DIR)

    # ---- Upload ----------------------------------------------------------
    def add_document(self, file_path: str) -> UploadedDoc:
        """
        Index a document file. Re-uses the manifest to skip re-embedding if
        the file content hasn't changed (same pattern as the user's reference).

        Supports PDF (PyPDFLoader) and plain text (TextLoader). Other formats
        are rejected with a clear error.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(file_path)

        current_hash = file_hash(file_path)
        filename = os.path.basename(file_path)

        # Skip if already indexed with the same hash.
        existing = self.manifest.get(file_path)
        if isinstance(existing, dict) and existing.get("hash") == current_hash:
            print(f"[rag] {filename} unchanged — skipping re-embedding")
            return UploadedDoc(
                filename=filename,
                hash=current_hash,
                pages=existing.get("pages", 0),
                chunks=existing.get("chunks", 0),
                uploaded_at=existing.get("uploaded_at", ""),
            )

        # Load document content based on extension.
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
            docs = loader.load()
        elif ext in (".txt", ".md"):
            loader = TextLoader(file_path)
            docs = loader.load()
        else:
            raise ValueError(f"Unsupported file type: {ext} (use PDF, TXT, or MD)")

        # Split into chunks (matching user's settings: 1000/200).
        splits = self.splitter.split_documents(docs)
        print(f"[rag] indexing {filename}: {len(docs)} pages -> {len(splits)} chunks")

        # Embed + add to FAISS.
        self.vectorstore.add_documents(splits)
        self._save_vectorstore()

        # Update manifest.
        from datetime import datetime, timezone
        entry = {
            "hash": current_hash,
            "pages": len(docs),
            "chunks": len(splits),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "filename": filename,
        }
        self.manifest[file_path] = entry
        save_manifest(self.manifest)
        print(f"[rag] indexed {filename} ({len(splits)} chunks)")

        return UploadedDoc(
            filename=filename,
            hash=current_hash,
            pages=len(docs),
            chunks=len(splits),
            uploaded_at=entry["uploaded_at"],
        )

    # ---- List ------------------------------------------------------------
    def list_documents(self) -> List[UploadedDoc]:
        """Return all currently indexed documents."""
        result = []
        for path, meta in self.manifest.items():
            result.append(UploadedDoc(
                filename=meta.get("filename", os.path.basename(path)),
                hash=meta.get("hash", ""),
                pages=meta.get("pages", 0),
                chunks=meta.get("chunks", 0),
                uploaded_at=meta.get("uploaded_at", ""),
            ))
        return result

    # ---- Query -----------------------------------------------------------
    def ask(self, question: str, lang: str = "en", top_k: int = 3) -> RagAnswer:
        """
        Retrieve top-k chunks from FAISS, then ask the LLM to answer with
        citations. If no documents are indexed, returns a friendly message.
        """
        if not self.vectorstore:
            return RagAnswer(answer="RAG store not ready.", sources=[])

        # If the manifest is empty, we have no real documents indexed.
        if not self.manifest:
            no_docs = (
                "📭 还没有上传任何文档。请先在上方点击上传 PDF，再提问。"
                if lang == "zh" else
                "📭 No documents uploaded yet. Upload a PDF above, then ask a question."
            )
            return RagAnswer(answer=no_docs, sources=[])

        # Retrieve top-k chunks from FAISS.
        retrieved = self.vectorstore.similarity_search(question, k=top_k)
        if not retrieved:
            no_answer = (
                "我在知识库里没有找到相关内容。" if lang == "zh"
                else "I couldn't find anything in the knowledge base about that."
            )
            return RagAnswer(answer=no_answer, sources=[])

        # Build context with numbered citations.
        # Use page_content as a dedup key (FAISS can return the same chunk
        # twice if the index has duplicates from re-uploads).
        seen = set()
        unique_docs: List[Document] = []
        for doc in retrieved:
            key = doc.page_content
            if key not in seen:
                seen.add(key)
                unique_docs.append(doc)
        retrieved = unique_docs

        context_blocks = []
        for i, doc in enumerate(retrieved):
            # Show just the basename, not the full server-side path.
            src = os.path.basename(doc.metadata.get("source", "?"))
            page = doc.metadata.get("page")
            page_str = f" (page {page})" if page is not None else ""
            ctx = f"[{i + 1}] Source: {src}{page_str}\n{doc.page_content}"
            context_blocks.append(ctx)
        context = "\n\n".join(context_blocks)

        lang_instruction = (
            "用简体中文回答，引用使用 [1] [2] 等编号对应上下文序号。" if lang == "zh"
            else "Answer in English. Cite sources using [1], [2] etc. matching the context numbers."
        )
        system_prompt = (
            "You are crabAI's RAG Agent. Answer the question using only the "
            "provided context. If the context doesn't contain the answer, say "
            "so explicitly. " + lang_instruction + " Be concise and helpful."
        )

        # Build the LCEL chain (matches the user's reference code pattern).
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer:"),
        ])

        def format_docs(docs: List[Document]) -> str:
            return "\n\n".join(d.page_content for d in docs)

        # We've already retrieved the chunks above; build a simple chain that
        # injects them as context and asks the LLM. (Using the user's LCEL
        # pattern with `retriever | format_docs` would re-run retrieval — we
        # already have the docs, so we skip that step.)
        rag_chain = (
            {
                "context": lambda _: format_docs(retrieved),
                "question": RunnablePassthrough(),
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

        try:
            answer = rag_chain.invoke(question)
        except Exception as e:
            # If the LLM fails (e.g. no API key), return a helpful message
            # that still includes the retrieved sources.
            err = (
                f"⚠️ LLM call failed: {e}\n\nRetrieved {len(retrieved)} sources — "
                "see below."
            )
            answer = err

        sources = [
            {
                "document": os.path.basename(doc.metadata.get("source", "?")),
                "page": doc.metadata.get("page"),
                "content": doc.page_content,
            }
            for doc in retrieved
        ]
        return RagAnswer(answer=answer, sources=sources)


# Singleton, created at FastAPI startup.
_agent: RagAgent | None = None


def get_rag_agent() -> RagAgent:
    global _agent
    if _agent is None:
        _agent = RagAgent()
    return _agent
