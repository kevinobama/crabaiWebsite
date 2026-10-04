"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileSearch,
  Database,
  Layers,
  GitBranch,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";

type T = {
  badge: string;
  title: string;
  subtitle: string;
  services: {
    id: string;
    icon: typeof FileSearch;
    name: string;
    tagline: string;
    description: string;
    features: string[];
    stack: string[];
  }[];
  seeLive: string;
  archLabel: string;
  archSteps: string[];
};

const CONTENT: Record<Lang, T> = {
  en: {
    badge: "What I build",
    title: "Two products. One engineer. End-to-end delivery.",
    subtitle:
      "I don't hand you a notebook. I ship a deployed, monitored, evaluated system your team can actually use — then train your engineers to maintain it.",
    services: [
      {
        id: "rag",
        icon: FileSearch,
        name: "Custom RAG Systems",
        tagline: "Answers from your documents — with citations, not hallucinations.",
        description:
          "End-to-end retrieval-augmented generation pipelines that ground LLM answers in your private documents. Built with chunking strategies tuned to your content type, hybrid retrieval (keyword + semantic), reranking, and answer-verification layers so users get accurate, source-cited responses every time.",
        features: [
          "Document ingestion: PDFs, Notion, Confluence, Slack, Google Drive",
          "Hybrid retrieval: BM25 + dense embeddings (OpenAI, Cohere, or local)",
          "Reranking with cross-encoders for precision",
          "Citations and source previews in every answer",
          "Eval suites: faithfulness, relevance, citation accuracy",
          "Streaming responses for sub-2s perceived latency",
        ],
        stack: ["LangChain / LlamaIndex", "Pinecone / Qdrant / pgvector", "OpenAI / Anthropic / Local LLMs"],
      },
      {
        id: "sql",
        icon: Database,
        name: "Natural-Language SQL Agents",
        tagline: "Let anyone on your team ask questions in English. Get SQL back.",
        description:
          "Conversational agents that translate business questions into validated SQL against your existing databases. Schema-aware prompt construction, query validation, read-only execution safety, and natural-language summaries of the results — so non-technical stakeholders self-serve analytics without breaking anything.",
        features: [
          "Schema introspection and dynamic prompt construction",
          "Read-only DB user + query validation for safety",
          "Multi-turn conversations with context (filters, follow-ups)",
          "Auto-generated visualizations (charts, tables)",
          "Natural-language summaries of every result set",
          "Works with Postgres, MySQL, Snowflake, BigQuery, Redshift",
        ],
        stack: ["LangGraph / custom orchestration", "Vanna / RAGAS for SQL", "Any JDBC-compatible DB"],
      },
    ],
    seeLive: "See it live",
    archLabel: "Reference architecture",
    archSteps: ["Your Data", "Embeddings / Schema", "Vector DB / SQL Engine", "Rerank / Validate", "LLM", "Cited Answer"],
  },
  zh: {
    badge: "我提供的服务",
    title: "两款产品，一位工程师，端到端交付。",
    subtitle:
      "我不会甩给你一个笔记本。我交付的是一套部署好、有监控、有评估、你的团队真正能用的系统，然后再培训你的工程师维护它。",
    services: [
      {
        id: "rag",
        icon: FileSearch,
        name: "定制 RAG 系统",
        tagline: "从你的文档中获取答案——带引用，不胡说。",
        description:
          "端到端的检索增强生成流水线，将大模型的回答锚定在你的私有文档上。针对你的内容类型调优的分块策略、混合检索（关键词 + 语义）、重排序以及回答校验层，让用户每次都能得到准确、带来源的回复。",
        features: [
          "文档接入：PDF、Notion、Confluence、Slack、Google Drive",
          "混合检索：BM25 + 稠密向量（OpenAI、Cohere 或本地模型）",
          "交叉编码器重排序，提升精度",
          "每个回答都带引用和原文预览",
          "评估套件：忠实度、相关性、引用准确性",
          "流式响应，感知延迟 < 2 秒",
        ],
        stack: ["LangChain / LlamaIndex", "Pinecone / Qdrant / pgvector", "OpenAI / Anthropic / 本地大模型"],
      },
      {
        id: "sql",
        icon: Database,
        name: "自然语言 SQL 智能体",
        tagline: "让团队任何人都用英语提问，直接拿到 SQL。",
        description:
          "对话式智能体，把业务问题翻译成校验过的 SQL，跑在你现有的数据库上。基于 Schema 的提示词构造、查询校验、只读执行安全策略，以及对结果的自然语言总结——让非技术同事自助取数，还不怕把数据库搞坏。",
        features: [
          "Schema 自动解析 + 动态提示词构造",
          "只读数据库用户 + 查询校验，确保安全",
          "带上下文的多轮对话（过滤、追问）",
          "自动生成可视化（图表、表格）",
          "每个结果集都附带自然语言总结",
          "兼容 Postgres、MySQL、Snowflake、BigQuery、Redshift",
        ],
        stack: ["LangGraph / 自研编排", "Vanna / RAGAS for SQL", "任何 JDBC 兼容数据库"],
      },
    ],
    seeLive: "查看在线演示",
    archLabel: "参考架构",
    archSteps: ["你的数据", "向量化 / Schema", "向量库 / SQL 引擎", "重排 / 校验", "大模型", "带引用答案"],
  },
};

export function ServicesSection() {
  const { lang } = useLang();
  const t = CONTENT[lang];

  return (
    <section id="services" className="container mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
          {t.badge}
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-4 text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {t.services.map((service) => (
          <Card
            key={service.id}
            className="group relative overflow-hidden border-border bg-card/60 backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-lg"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
                  <service.icon className="size-6 text-accent" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <CardDescription className="text-sm font-medium text-accent">
                    {service.tagline}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">{service.description}</p>

              <ul className="space-y-2">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Layers className="size-3.5" />
                  {lang === "en" ? "Stack" : "技术栈"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {service.stack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs font-normal">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <a
                href="#demos"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {t.seeLive}
                <ArrowRight className="size-3.5" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Architecture diagram strip */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <GitBranch className="size-3.5" />
          {t.archLabel}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
          {t.archSteps.map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2 sm:flex-row">
              <div className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs font-medium sm:text-sm">
                {step}
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
