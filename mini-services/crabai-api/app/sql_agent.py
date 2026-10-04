"""
SQL Agent module.

Flow:
    Question -> LangChain SQL toolkit -> generate SQL -> execute (read-only)
              -> analyze result -> natural-language answer + sql + rows

Uses an in-memory SQLite database preloaded with a small business schema
(revenue, legal_entities, claims) so the demo works without external DB setup.
"""
import sqlite3
from dataclasses import dataclass, field
from typing import List, Any
from sqlalchemy import create_engine, text
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent

from .llm import get_llm


def _seed_sqlite(path: str) -> None:
    """Create and populate a small business database for the demo."""
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    # Drop if exists for clean restart.
    for t in ["claims", "legal_entities", "revenue", "customers"]:
        cur.execute(f"DROP TABLE IF EXISTS {t}")
    # Legal entities (multi-entity insurance company).
    cur.execute("""
        CREATE TABLE legal_entities (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            country TEXT
        )
    """)
    cur.executemany(
        "INSERT INTO legal_entities (id, name, country) VALUES (?, ?, ?)",
        [
            (1, "crabAI US Inc", "USA"),
            (2, "crabAI EU GmbH", "Germany"),
            (3, "crabAI UK Ltd", "UK"),
        ],
    )
    # Revenue table.
    cur.execute("""
        CREATE TABLE revenue (
            id INTEGER PRIMARY KEY,
            legal_entity_id INTEGER NOT NULL,
            fiscal_year INTEGER NOT NULL,
            amount_usd DECIMAL(14, 2) NOT NULL,
            FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(id)
        )
    """)
    cur.executemany(
        "INSERT INTO revenue (id, legal_entity_id, fiscal_year, amount_usd) VALUES (?, ?, ?, ?)",
        [
            (1, 1, 2024, 4_120_000),
            (2, 1, 2025, 6_480_000),
            (3, 2, 2024, 1_950_000),
            (4, 2, 2025, 2_710_000),
            (5, 3, 2024, 880_000),
            (6, 3, 2025, 1_240_000),
        ],
    )
    # Claims table.
    cur.execute("""
        CREATE TABLE claims (
            id INTEGER PRIMARY KEY,
            legal_entity_id INTEGER NOT NULL,
            claim_date TEXT NOT NULL,
            cause TEXT NOT NULL,
            amount_usd DECIMAL(12, 2) NOT NULL,
            status TEXT NOT NULL,  -- paid, denied, pending
            denial_reason TEXT,
            FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(id)
        )
    """)
    cur.executemany(
        """INSERT INTO claims
           (id, legal_entity_id, claim_date, cause, amount_usd, status, denial_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [
            (1, 1, "2025-02-14", "windshield_road_debris", 320.00, "paid", None),
            (2, 1, "2025-04-03", "windshield_off_road", 410.00, "denied", "off_road_exclusion"),
            (3, 1, "2025-05-19", "hail_damage", 1850.00, "paid", None),
            (4, 2, "2025-03-22", "theft", 8200.00, "denied", "police_report_missing"),
            (5, 2, "2025-06-08", "windshield_intentional", 380.00, "denied", "intentional_act_exclusion"),
            (6, 3, "2025-01-30", "vandalism", 1240.00, "paid", None),
            (7, 3, "2025-07-12", "windshield_road_debris", 290.00, "pending", None),
        ],
    )
    conn.commit()
    conn.close()


@dataclass
class SqlAnswer:
    answer: str
    sql: str
    rows: List[List[Any]] = field(default_factory=list)
    columns: List[str] = field(default_factory=list)


class SqlAgent:
    """LangChain SQL agent over a seeded SQLite database."""

    def __init__(self, db_path: str = "data/crabai_demo.db"):
        import os
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        _seed_sqlite(db_path)
        # Read-only SQLAlchemy engine — the agent cannot run DDL/DML.
        self.engine = create_engine(f"sqlite:///{db_path}")
        self.db = SQLDatabase(self.engine, include_tables=["legal_entities", "revenue", "claims"])
        self.llm = get_llm(temperature=0.0)
        self.agent = create_sql_agent(
            llm=self.llm,
            db=self.db,
            agent_type="tool-calling",
            verbose=False,
            max_iterations=6,
            handle_parsing_errors=True,
        )
        print("[sql] agent ready (SQLite seeded)")

    def ask(self, question: str, lang: str = "en") -> SqlAnswer:
        """Run the SQL agent and return structured answer + sql + rows."""
        try:
            result = self.agent.invoke({"input": question})
            output = result.get("output", "")
            # The intermediate_steps contain the SQL executed.
            sql = ""
            rows: List[List[Any]] = []
            columns: List[str] = []
            for step in result.get("intermediate_steps", []):
                action = step[0]
                if hasattr(action, "tool") and action.tool == "sql_db_query":
                    try:
                        sql = action.tool_input if isinstance(action.tool_input, str) else str(action.tool_input)
                        # Try to run the SQL to get rows for structured output.
                        with self.engine.connect() as conn:
                            rs = conn.execute(text(sql))
                            columns = list(rs.keys())
                            rows = [list(r) for r in rs.fetchall()]
                    except Exception:
                        pass
            return SqlAnswer(answer=output, sql=sql, rows=rows, columns=columns)
        except Exception as e:
            err = (
                f"SQL agent error: {e}" if lang == "en"
                else f"SQL 智能体出错: {e}"
            )
            return SqlAnswer(answer=err, sql="", rows=[], columns=[])


# Singleton, created at FastAPI startup.
_agent: SqlAgent | None = None


def get_sql_agent() -> SqlAgent:
    global _agent
    if _agent is None:
        _agent = SqlAgent()
    return _agent
