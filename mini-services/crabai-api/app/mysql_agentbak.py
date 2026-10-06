import os
from langchain.agents import create_agent
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from .llm import create_llm
from dotenv import load_dotenv
load_dotenv()

SYSTEM_PROMPT = """
You are an expert MySQL SQL agent.

Workflow:
1. ALWAYS inspect available tables first.
2. Identify tables relevant to the question.
3. Inspect relevant table schemas before writing SQL.
4. Generate syntactically correct MySQL SQL.
5. ALWAYS use the SQL query checker before executing SQL.
6. Execute the checked SQL query.
7. If the database returns an error, analyze it, inspect schema if needed,
   correct the SQL, check it again, and execute again.
8. Use only columns needed to answer the question.
9. Unless the user asks for a specific number of rows, limit results to 10.
10. Avoid SELECT * unless necessary.
11. Never expose internal reasoning or chain-of-thought.
12. Return a concise natural-language answer based on query results.

SECURITY:
- READ-ONLY database access.
- NEVER execute INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE,
  GRANT, or REVOKE.
- Only execute SELECT-style read queries.
"""

def create_mysql_agent():
    mysql_url = os.getenv("MYSQL_DATABASE_URL")
    if not mysql_url:
        raise ValueError("MYSQL_DATABASE_URL environment variable is not configured.")

    db = SQLDatabase.from_uri(
        mysql_url,
        sample_rows_in_table_info=3,
    )

    llm = create_llm(temperature=0)
    toolkit = SQLDatabaseToolkit(db=db, llm=llm)
    tools = toolkit.get_tools()

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )
