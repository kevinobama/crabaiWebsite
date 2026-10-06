"""
SQL Agent module.

Flow:
    Question -> LangChain SQL toolkit -> generate SQL -> execute (read-only)
              -> analyze result -> natural-language answer + sql + rows

Connects to a MySQL database. Configure via environment variables.
"""
import os
import re
from dataclasses import dataclass, field
from typing import List, Any, Optional
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent

from .llm import get_llm
from dotenv import load_dotenv
load_dotenv()

# --------------------------------------------------------------------------
# MySQL connection
# --------------------------------------------------------------------------
def _build_mysql_url(
        host: str,
        port: int,
        user: str,
        password: str,
        database: str,
        driver: str = "pymysql",
) -> str:
    """Build a SQLAlchemy MySQL connection URL.

    Requires `pip install pymysql` by default. If you prefer another driver
    (e.g. `mysqlclient` or `mysql-connector-python`), set MYSQL_DRIVER to
    "mysqldb" or "mysqlconnector" respectively and install that package.
    """
    return (
        f"mysql+{driver}://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{database}?charset=utf8mb4"
    )


def _create_mysql_engine() -> Engine:
    """Create a SQLAlchemy engine for MySQL using env-var configuration.

    Required env vars:
        MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
    Optional:
        MYSQL_PORT (default 3306), MYSQL_DRIVER (default pymysql)

    Strongly recommended: point MYSQL_USER to a DB account with SELECT-only
    privileges so the agent cannot perform writes even if the LLM tries.
    """
    host = os.environ["MYSQL_HOST"]
    port = int(os.environ.get("MYSQL_PORT", "3306"))
    user = os.environ["MYSQL_USER"]
    password = os.environ["MYSQL_PASSWORD"]
    database = os.environ["MYSQL_DATABASE"]
    driver = os.environ.get("MYSQL_DRIVER", "pymysql")

    url = _build_mysql_url(host, port, user, password, database, driver)
    engine = create_engine(
        url,
        pool_pre_ping=True,   # auto-reconnect on stale/dropped connections
        pool_recycle=3600,
        pool_size=5,
        max_overflow=10,
    )
    # Fail fast on bad credentials/network instead of on first user query.
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return engine


# --------------------------------------------------------------------------
# Read-only enforcement (defense in depth, in addition to DB-level grants)
# --------------------------------------------------------------------------
_WRITE_KEYWORDS = re.compile(
    r"^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE)\b",
    re.IGNORECASE,
)


def _is_write_statement(sql: str) -> bool:
    return bool(_WRITE_KEYWORDS.match(sql.strip()))


@dataclass
class SqlAnswer:
    answer: str
    sql: str
    rows: List[List[Any]] = field(default_factory=list)
    columns: List[str] = field(default_factory=list)


class SqlAgent:
    """LangChain SQL agent over a MySQL database."""

    def __init__(self):
        self.engine = _create_mysql_engine()
        include_tables = self._parse_include_tables()
        self.db = SQLDatabase(
            self.engine,
            include_tables=include_tables,
            sample_rows_in_table_info=2,
        )
        self.llm = get_llm(temperature=0.0)
        self.agent = create_sql_agent(
            llm=self.llm,
            db=self.db,
            agent_type="tool-calling",
            verbose=False,
            max_iterations=int(os.environ.get("SQL_AGENT_MAX_ITER", "6")),
            handle_parsing_errors=True,
        )
        print(f"[sql] agent ready (MySQL: {os.environ.get('MYSQL_DATABASE')})")

    @staticmethod
    def _parse_include_tables() -> Optional[List[str]]:
        """Optionally restrict the agent's visibility to specific tables.

        Set MYSQL_INCLUDE_TABLES="table1,table2,table3" to scope access.
        If unset, the agent sees all tables in the configured database.
        """
        raw = os.environ.get("MYSQL_INCLUDE_TABLES", "").strip()
        if not raw:
            return None
        return [t.strip() for t in raw.split(",") if t.strip()]

    def ask(self, question: str, lang: str = "en") -> SqlAnswer:
        """Run the SQL agent and return structured answer + sql + rows."""
        try:
            result = self.agent.invoke({"input": question})
            output = result.get("output", "")
            sql = ""
            rows: List[List[Any]] = []
            columns: List[str] = []

            for step in result.get("intermediate_steps", []):
                action = step[0]
                if hasattr(action, "tool") and action.tool == "sql_db_query":
                    try:
                        candidate_sql = (
                            action.tool_input
                            if isinstance(action.tool_input, str)
                            else str(action.tool_input)
                        )

                        # Defense in depth: refuse to re-execute write statements
                        # even if the model attempted one.
                        if _is_write_statement(candidate_sql):
                            continue

                        sql = candidate_sql
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
