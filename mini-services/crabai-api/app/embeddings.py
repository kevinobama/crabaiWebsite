"""
Embeddings module.

Primary: Cloudflare Workers AI — `@cf/baai/bge-base-en-v1.5` (matches user's stack).
Fallback 1: Nomic's hosted API for `nomic-embed-text-v1.5`.
Fallback 2: a deterministic hashing-based embedder when no API key is set,
so the demo still works out-of-the-box without any credentials.

Set Cloudflare credentials (preferred):
  CF_API_TOKEN=your_cloudflare_api_token
  CF_ACCOUNT_ID=your_cloudflare_account_id

Or Nomic (free at https://docs.nomic.ai/atlas/models/text-embedding):
  NOMIC_API_KEY=your_nomic_key
"""
import os
import hashlib
from typing import List
import httpx
from langchain_core.embeddings import Embeddings


class HashingEmbeddings(Embeddings):
    """
    Deterministic content-aware embeddings (no external API needed).

    Hashes token buckets into a fixed-size vector. Not semantically meaningful
    (it won't know "car" ≈ "auto"), but it works for retrieval on a small,
    curated demo corpus — and it has zero dependencies and zero latency cost.
    """

    def __init__(self, dim: int = 768):
        # 768 dims matches the bge-base-en-v1.5 model output dim — so swapping
        # between Hashing and Cloudflare embeddings doesn't require rebuilding
        # the FAISS index (vector dims match).
        self.dim = dim

    def _embed(self, text: str) -> List[float]:
        text = text.lower()
        tokens = [t for t in text.split() if len(t) > 1]
        vec = [0.0] * self.dim
        for tok in tokens:
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            sign = 1.0 if (h & 1) else -1.0
            idx = (h >> 1) % self.dim
            vec[idx] += sign
        norm = sum(v * v for v in vec) ** 0.5
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)


class CloudflareEmbeddings(Embeddings):
    """
    Wrapper around langchain_cloudflare's CloudflareWorkersAIEmbeddings so
    we can construct it lazily only when CF credentials exist, and so the
    rest of the code doesn't need to know which backend is in use.
    """

    def __init__(
        self,
        api_token: str | None = None,
        account_id: str | None = None,
        model: str = "@cf/baai/bge-base-en-v1.5",
    ):
        from langchain_cloudflare.embeddings import CloudflareWorkersAIEmbeddings
        self.api_token = api_token or os.getenv("CF_API_TOKEN")
        self.account_id = account_id or os.getenv("CF_ACCOUNT_ID")
        if not self.api_token or not self.account_id:
            raise ValueError("CF_API_TOKEN and CF_ACCOUNT_ID must be set")
        self.model = model
        # The langchain_cloudflare library's constructor params are
        # `account_id` and `api_token` (no `cloudflare_` prefix).
        self._impl = CloudflareWorkersAIEmbeddings(
            model_name=model,
            api_token=self.api_token,
            account_id=self.account_id,
        )

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._impl.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._impl.embed_query(text)


class NomicEmbeddings(Embeddings):
    """nomic-embed-text-v1.5 via Nomic's hosted API (free 1M tokens/month)."""

    def __init__(self, api_key: str | None = None, model: str = "nomic-embed-text-v1.5"):
        self.api_key = api_key or os.getenv("NOMIC_API_KEY")
        if not self.api_key:
            raise ValueError("NOMIC_API_KEY not set")
        self.model = model
        self.endpoint = "https://api-atlas.nomic.ai/v1/embeddings"

    def _call(self, texts: List[str]) -> List[List[float]]:
        resp = httpx.post(
            self.endpoint,
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"model": self.model, "texts": texts},
            timeout=60.0,
        )
        resp.raise_for_status()
        return resp.json()["embeddings"]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._call(texts)

    def embed_query(self, text: str) -> List[float]:
        return self._call([text])[0]


def get_embeddings() -> Embeddings:
    """
    Factory with a clear precedence:
        1. Cloudflare Workers AI (matches user's stack — @cf/baai/bge-base-en-v1.5)
        2. Nomic API (nomic-embed-text-v1.5)
        3. HashingEmbeddings (deterministic, no API key needed)

    All three produce 768-dim vectors so a FAISS index built with one can be
    queried with another (though for best results use the same one throughout).
    """
    cf_token = os.getenv("CF_API_TOKEN")
    cf_account = os.getenv("CF_ACCOUNT_ID")
    if cf_token and cf_account:
        print("[embeddings] using Cloudflare Workers AI (@cf/baai/bge-base-en-v1.5)")
        return CloudflareEmbeddings()
    if os.getenv("NOMIC_API_KEY"):
        print("[embeddings] using Nomic API (nomic-embed-text-v1.5)")
        return NomicEmbeddings()
    print("[embeddings] no CF_API_TOKEN/NOMIC_API_KEY — using HashingEmbeddings fallback")
    print("[embeddings]   (works for demo; not semantically meaningful)")
    return HashingEmbeddings()


def embeddings_dimension() -> int:
    """All three providers above produce 768-dim vectors."""
    return 768