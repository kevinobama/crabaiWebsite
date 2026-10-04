"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Database, Workflow, Sparkles } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";
import { AgentDemo } from "./agent-demo";

const T: Record<Lang, {
  badge: string;
  title: string;
  subtitle: string;
  tabs: { rag: string; sql: string; combined: string };
  footer: string;
}> = {
  en: {
    badge: "Live, interactive",
    title: "Don't read a slide deck. Try the product.",
    subtitle:
      "All three tabs are real, end-to-end systems powered by Python LangChain + Groq (gpt-oss-20b) + nomic-embed-text + InMemoryVectorStore. The RAG agent retrieves from 7 preloaded policy docs; the SQL agent writes real SQL against a SQLite database; the Supervisor routes a single question to either or both and synthesizes a combined answer.",
    tabs: { rag: "RAG Agent", sql: "SQL Agent", combined: "Combined" },
    footer: "Backend: FastAPI · LangChain · Groq · InMemoryVectorStore · SQLite",
  },
  zh: {
    badge: "实时交互",
    title: "别看幻灯片，直接试用产品。",
    subtitle:
      "三个 Tab 都是真实的、端到端系统，由 Python LangChain + Groq（gpt-oss-20b）+ nomic-embed-text + InMemoryVectorStore 驱动。RAG 智能体从 7 篇预加载的政策文档中检索；SQL 智能体基于 SQLite 数据库生成真实 SQL；Supervisor 会把一个问题路由到一个或两个智能体，并综合出最终答案。",
    tabs: { rag: "RAG 智能体", sql: "SQL 智能体", combined: "综合（Supervisor）" },
    footer: "后端：FastAPI · LangChain · Groq · InMemoryVectorStore · SQLite",
  },
};

export function DemosSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="demos" className="relative overflow-hidden border-y border-border bg-card/30">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="container relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
            <Sparkles className="size-3" />
            {t.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">{t.subtitle}</p>
        </div>

        <Tabs defaultValue="rag" className="mx-auto max-w-3xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rag" className="gap-2">
              <FileSearch className="size-4" />
              {t.tabs.rag}
            </TabsTrigger>
            {/* <TabsTrigger value="sql" className="gap-2">
              <Database className="size-4" />
              {t.tabs.sql}
            </TabsTrigger>
            <TabsTrigger value="combined" className="gap-2">
              <Workflow className="size-4" />
              {t.tabs.combined}
            </TabsTrigger> */}
          </TabsList>
          <TabsContent value="rag" className="mt-6">
            <AgentDemo mode="rag" />
          </TabsContent>
          <TabsContent value="sql" className="mt-6">
            <AgentDemo mode="sql" />
          </TabsContent>
          <TabsContent value="combined" className="mt-6">
            <AgentDemo mode="combined" />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ⚡ {t.footer}
        </p>
      </div>
    </section>
  );
}
