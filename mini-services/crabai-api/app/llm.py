"""
LLM module.

Primary: Groq with openai/gpt-oss-20b (matches the user's stack).
Fallback: a deterministic local echo when no GROQ_API_KEY is set, so the demo
still loads and the API surface is testable.

To enable real Groq inference:
  1. Get a free key at https://console.groq.com/keys
  2. Set GROQ_API_KEY in the environment
"""
import os
from typing import Any, Sequence
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.tools import BaseTool
from langchain_groq import ChatGroq
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from dotenv import load_dotenv
load_dotenv()

class FakeLLM(BaseChatModel):
    """
    A no-API-key fallback. Returns a clear, helpful message so the user
    knows exactly what to do. Implements the minimal LangChain chat model
    surface (including bind_tools) so it slots into the same agent code.
    """

    @property
    def _llm_type(self) -> str:
        return "fake-llm"

    def bind_tools(self, tools: Sequence[BaseTool | dict], **kwargs: Any) -> "BaseChatModel":
        """
        Return self — the FakeLLM ignores tool definitions and always returns
        the "set GROQ_API_KEY" message. This lets the SQL agent initialize and
        respond gracefully instead of crashing at startup.
        """
        return self

    def _generate(self, messages: list[BaseMessage], stop=None, **kwargs: Any) -> Any:
        last_user = next(
            (m for m in reversed(messages) if m.type == "human"), None
        )
        question = last_user.content if last_user else "(no question)"
        note = (
            f"You asked: {question[:200]}"
        )
        from langchain_core.outputs import ChatGeneration, ChatResult
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=note))])

# nvidia
def get_llm(temperature: float = 0.0) -> BaseChatModel:
    if os.getenv("NVIDIA_API_KEY"):
        return ChatNVIDIA(
            model="openai/gpt-oss-20b",
            temperature=1,
            top_p=1,
            max_completion_tokens=4096,
        )
    return FakeLLM()

# Groq
def get_llmGroq(temperature: float = 0.0) -> BaseChatModel:
    # os.environ["HTTPS_PROXY"] = "http://127.0.0.1:1080"
    # os.environ["HTTP_PROXY"] = "http://127.0.0.1:1080"
    # os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    # os.environ["no_proxy"] = "localhost,127.0.0.1"

    """
    Factory: prefer Groq if a key is set, else fall back to FakeLLM.
    Defaults match the user's RAG code: temperature=0, reasoning_format="parsed".
    """
    if os.getenv("GROQ_API_KEY"):
        print("[llm] using Groq (openai/gpt-oss-20b)")
        return ChatGroq(
            model="openai/gpt-oss-20b",
            temperature=temperature,
            max_tokens=None,
            reasoning_format="parsed",
            timeout=None,
            max_retries=1,
        )
    print("[llm] GROQ_API_KEY not set — using FakeLLM fallback")
    return FakeLLM()

def create_llm(temperature: float = 0):
    return ChatNVIDIA(
        model="openai/gpt-oss-20b",
        temperature=1,
        top_p=1,
        max_completion_tokens=4096,
    )