"""
Supervisor / Combined agent.

Routes the user's question to RAG, SQL, or both — then synthesizes a single
answer. This is the "Digital Employee" demo: ask one question that needs both
policy knowledge AND data.

Example:
    "Based on our claims policy, how many claims last year were denied because
     of excluded windshield damage?"

Supervisor flow:
    1. Decide which agent(s) to call (LLM-as-router)
    2. Call RAG and/or SQL
    3. Combine: final answer with both sources and SQL
"""
from dataclasses import dataclass, field
from typing import List, Any
from langchain_core.prompts import ChatPromptTemplate

from .llm import get_llm
from .rag_agent import get_rag_agent
from .sql_agent import get_sql_agent


@dataclass
class CombinedAnswer:
    answer: str
    rag_sources: List[dict] = field(default_factory=list)
    sql: str = ""
    sql_rows: List[List[Any]] = field(default_factory=list)
    sql_columns: List[str] = field(default_factory=list)
    route: str = "both"  # "rag" | "sql" | "both"


def _route(question: str) -> str:
    """
    Simple keyword-based router. For a real demo you'd use the LLM as a router,
    but a keyword router is honest, fast, and has zero failure modes for a demo.
    """
    q = question.lower()
    sql_signals = [
        "how many", "count", "total", "sum", "revenue", "by year",
        "by entity", "by legal", "2024", "2025", "last year",
        "average", "group by", "top", "rank", "percent", "amount",
    ]
    rag_signals = [
        "policy", "cover", "covered", "exclude", "exclusion",
        "procedure", "how do i", "what is", "what does",
        "deductible", "appeal", "file", "compliance", "gdpr", "soc",
        "price", "pricing", "plan",
    ]
    needs_sql = any(s in q for s in sql_signals)
    needs_rag = any(s in q for s in rag_signals)
    if needs_sql and needs_rag:
        return "both"
    if needs_sql:
        return "sql"
    if needs_rag:
        return "rag"
    # Default: try both — let each agent decide if it has an answer.
    return "both"


def ask_combined(question: str, lang: str = "en") -> CombinedAnswer:
    """Route the question and synthesize a combined answer."""
    route = _route(question)
    rag_ans = None
    sql_ans = None

    if route in ("rag", "both"):
        rag_ans = get_rag_agent().ask(question, lang=lang)
    if route in ("sql", "both"):
        sql_ans = get_sql_agent().ask(question, lang=lang)

    # Synthesize a unified answer using the LLM.
    parts = []
    if rag_ans and rag_ans.sources:
        parts.append(f"From the documents:\n{rag_ans.answer}")
    if sql_ans and sql_ans.sql:
        parts.append(
            f"From the database (SQL):\n{sql_ans.answer}\n\nSQL used:\n{sql_ans.sql}"
        )
    if not parts:
        return CombinedAnswer(
            answer=(
                "I couldn't answer that from either the documents or the database."
                if lang == "en" else
                "我无法从文档或数据库中回答这个问题。"
            ),
            route=route,
        )

    llm = get_llm(temperature=0.2)
    lang_instruction = (
        "用简体中文回答，引用文档使用 [1] [2] 编号，并保留 SQL。"
        if lang == "zh" else
        "Answer in English. Cite document sources with [1], [2]. Include the SQL if relevant."
    )
    system_prompt = (
        "You are the crabAI supervisor. Synthesize a single clear answer from "
        "the sub-agent outputs. " + lang_instruction + " Be concise."
    )
    user_prompt = (
        f"User question: {question}\n\n"
        f"Sub-agent outputs:\n\n" + "\n\n---\n\n".join(parts) +
        "\n\nFinal combined answer:"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{user_prompt}"),
    ])
    chain = prompt | llm
    result = chain.invoke({"user_prompt": user_prompt})
    answer = result.content if hasattr(result, "content") else str(result)

    return CombinedAnswer(
        answer=answer,
        rag_sources=rag_ans.sources if rag_ans else [],
        sql=sql_ans.sql if sql_ans else "",
        sql_rows=sql_ans.rows if sql_ans else [],
        sql_columns=sql_ans.columns if sql_ans else [],
        route=route,
    )
