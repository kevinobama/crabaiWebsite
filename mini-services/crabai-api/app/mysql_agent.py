"""
SQL Agent module.

Flow:
    Question
        -> list tables
        -> inspect relevant schemas
        -> generate SQL
        -> SQL query checker
        -> execute SQL
        -> fix SQL if database error
        -> natural-language answer

Connects to a MySQL database.

Environment:
    MYSQL_DATABASE_URL=mysql+pymysql://user:password@localhost:3306/database

Optional:
    MYSQL_INCLUDE_TABLES=table1,table2,table3
    SQL_AGENT_MAX_ITER=6
"""

import os
import re
from dataclasses import dataclass, field
from typing import List, Any, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from langchain.agents import create_agent
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit

from .llm import get_llm


# --------------------------------------------------------------------------
# Environment
# --------------------------------------------------------------------------

load_dotenv()


# --------------------------------------------------------------------------
# System prompt
# --------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are an expert MySQL SQL agent.

Your job is to answer the user's questions by querying the MySQL database.

Follow this workflow:

1. ALWAYS inspect the available database tables first.
2. Identify the tables relevant to the user's question.
3. Inspect the schema of the relevant tables before writing SQL.
4. Generate syntactically correct MySQL SQL.
5. ALWAYS use the SQL query checker before executing SQL.
6. Execute the checked SQL query.
7. If the database returns an error:
   - analyze the error,
   - inspect the schema again if necessary,
   - correct the SQL,
   - check the corrected SQL,
   - execute it again.
8. Use only the columns needed to answer the question.
9. Unless the user explicitly asks for a specific number of rows,
   limit result sets to at most 10 rows.
10. Never use SELECT * unless absolutely necessary.
11. Never expose internal reasoning or chain-of-thought.
12. Return a concise natural-language answer based on the query results.

IMPORTANT SECURITY RULES:

- This agent is READ-ONLY.
- NEVER execute INSERT.
- NEVER execute UPDATE.
- NEVER execute DELETE.
- NEVER execute DROP.
- NEVER execute ALTER.
- NEVER execute CREATE.
- NEVER execute TRUNCATE.
- NEVER execute REPLACE.
- NEVER execute GRANT.
- NEVER execute REVOKE.
- Only execute SELECT-style read queries.
"""


# --------------------------------------------------------------------------
# MySQL connection
# --------------------------------------------------------------------------

def _create_mysql_engine() -> Engine:
    """
    Create SQLAlchemy MySQL engine.

    Required:
        MYSQL_DATABASE_URL

    Example:
        mysql+pymysql://root:654321@localhost:3306/crabai_sample_data
    """

    mysql_url = os.getenv("MYSQL_DATABASE_URL")

    if not mysql_url:
        raise ValueError(
            "MYSQL_DATABASE_URL environment variable is not configured."
        )

    engine = create_engine(
        mysql_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=5,
        max_overflow=10,
    )

    # Fail fast if connection is invalid.
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    return engine


# --------------------------------------------------------------------------
# Read-only enforcement
# --------------------------------------------------------------------------

_WRITE_KEYWORDS = re.compile(
    r"""
    ^\s*
    (
        INSERT
        |UPDATE
        |DELETE
        |DROP
        |ALTER
        |TRUNCATE
        |CREATE
        |REPLACE
        |GRANT
        |REVOKE
    )
    \b
    """,
    re.IGNORECASE | re.VERBOSE,
    )


def _is_write_statement(sql: str) -> bool:
    """
    Defense-in-depth check.

    Database-level SELECT-only permissions should still be used.
    """

    return bool(_WRITE_KEYWORDS.match(sql.strip()))


# --------------------------------------------------------------------------
# Response object
# --------------------------------------------------------------------------

@dataclass
class SqlAnswer:
    answer: str
    sql: str
    rows: List[List[Any]] = field(default_factory=list)
    columns: List[str] = field(default_factory=list)


# --------------------------------------------------------------------------
# SQL Agent
# --------------------------------------------------------------------------

class SqlAgent:
    """
    LangChain SQL agent over MySQL.

    Uses:
        create_agent()
        SQLDatabaseToolkit
        Groq GPT-OSS-20B
    """

    def __init__(self):

        # --------------------------------------------------------------
        # MySQL
        # --------------------------------------------------------------

        self.engine = _create_mysql_engine()

        # --------------------------------------------------------------
        # Optional table restriction
        # --------------------------------------------------------------

        include_tables = self._parse_include_tables()

        self.db = SQLDatabase(
            self.engine,
            include_tables=include_tables,
            sample_rows_in_table_info=2,
        )

        # --------------------------------------------------------------
        # LLM
        # --------------------------------------------------------------

        self.llm = get_llm(
            temperature=0.0
        )

        # --------------------------------------------------------------
        # LangChain SQL Toolkit
        # --------------------------------------------------------------

        self.toolkit = SQLDatabaseToolkit(
            db=self.db,
            llm=self.llm,
        )

        self.tools = self.toolkit.get_tools()

        # --------------------------------------------------------------
        # Agent
        # --------------------------------------------------------------

        self.agent = create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt=SYSTEM_PROMPT,
        )

        print(
            "[sql] agent ready "
            f"(MySQL: {os.getenv('MYSQL_DATABASE_URL')})"
        )

    # ------------------------------------------------------------------
    # Table filtering
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_include_tables() -> Optional[List[str]]:
        """
        Optionally restrict agent visibility.

        Example:

            MYSQL_INCLUDE_TABLES=c_customer,c_order,c_invoice
        """

        raw = os.environ.get(
            "MYSQL_INCLUDE_TABLES",
            ""
        ).strip()

        if not raw:
            return None

        return [
            table.strip()
            for table in raw.split(",")
            if table.strip()
        ]

    # ------------------------------------------------------------------
    # Extract SQL from agent messages
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_sql(messages) -> str:
        """
        Extract the most recent SQL query from tool-call messages.

        create_agent() returns a message-based state rather than the
        old create_sql_agent() intermediate_steps structure.
        """

        sql = ""

        for message in messages:

            tool_calls = getattr(
                message,
                "tool_calls",
                None,
            )

            if not tool_calls:
                continue

            for tool_call in tool_calls:

                tool_name = tool_call.get(
                    "name",
                    ""
                )

                if tool_name != "sql_db_query":
                    continue

                args = tool_call.get(
                    "args",
                    {}
                )

                if isinstance(args, dict):

                    candidate_sql = (
                            args.get("query")
                            or args.get("sql")
                            or ""
                    )

                else:
                    candidate_sql = str(args)

                if candidate_sql:
                    sql = candidate_sql

        return sql

    # ------------------------------------------------------------------
    # Execute SQL again for structured rows
    # ------------------------------------------------------------------

    def _execute_sql(
            self,
            sql: str,
    ):
        """
        Execute the final SELECT query and return:

            columns
            rows
        """

        if not sql:
            return [], []

        # Defense in depth.
        if _is_write_statement(sql):
            raise ValueError(
                "Write SQL is not allowed."
            )

        with self.engine.connect() as conn:

            result = conn.execute(
                text(sql)
            )

            columns = list(
                result.keys()
            )

            rows = [
                list(row)
                for row in result.fetchall()
            ]

        return columns, rows

    # ------------------------------------------------------------------
    # Ask
    # ------------------------------------------------------------------

    def ask(
            self,
            question: str,
            lang: str = "en",
    ) -> SqlAnswer:
        """
        Run SQL agent and return:

            answer
            sql
            rows
            columns
        """

        try:

            result = self.agent.invoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": question,
                        }
                    ]
                }
            )

            # ----------------------------------------------------------
            # Agent messages
            # ----------------------------------------------------------

            messages = result.get(
                "messages",
                []
            )

            # ----------------------------------------------------------
            # Final natural-language answer
            # ----------------------------------------------------------

            output = ""

            if messages:

                final_message = messages[-1]

                content = getattr(
                    final_message,
                    "content",
                    "",
                )

                if isinstance(content, str):
                    output = content

                elif isinstance(content, list):

                    parts = []

                    for item in content:

                        if isinstance(item, dict):

                            if item.get("type") == "text":
                                parts.append(
                                    item.get(
                                        "text",
                                        ""
                                    )
                                )

                    output = "\n".join(
                        parts
                    )

                else:
                    output = str(content)

            # ----------------------------------------------------------
            # Extract SQL
            # ----------------------------------------------------------

            sql = self._extract_sql(
                messages
            )

            # ----------------------------------------------------------
            # Execute SQL to get structured rows
            # ----------------------------------------------------------

            rows: List[List[Any]] = []
            columns: List[str] = []

            if sql:

                try:

                    columns, rows = self._execute_sql(
                        sql
                    )

                except Exception as e:

                    print(
                        f"[sql] failed to re-execute final SQL: {e}"
                    )

            return SqlAnswer(
                answer=output,
                sql=sql,
                rows=rows,
                columns=columns,
            )

        except Exception as e:

            print(
                f"[sql] agent error: {e}"
            )

            if lang == "en":

                error_message = (
                    f"SQL agent error: {e}"
                )

            else:

                error_message = (
                    f"SQL 智能体出错: {e}"
                )

            return SqlAnswer(
                answer=error_message,
                sql="",
                rows=[],
                columns=[],
            )


# --------------------------------------------------------------------------
# Singleton
# --------------------------------------------------------------------------

_agent: Optional[SqlAgent] = None


def get_sql_agent() -> SqlAgent:

    global _agent

    if _agent is None:

        _agent = SqlAgent()

    return _agent