"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileSearch,
  Database,
  Workflow,
  Send,
  Loader2,
  Table2,
  Terminal,
  Sparkles,
  Quote,
  ChevronDown,
  FileText,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";

type AgentMode = "rag" | "sql" | "combined";

type Source = { document: string; page?: number; content: string };

type DocInfo = {
  filename: string;
  pages: number;
  chunks: number;
  uploaded_at: string;
};

type Result = {
  answer: string;
  sources?: Source[];
  sql?: string;
  sqlColumns?: string[];
  sqlRows?: (string | number)[][];
  ragSources?: Source[];
  route?: string;
};

const T: Record<Lang, {
  title: Record<AgentMode, string>;
  live: string;
  desc: Record<AgentMode, string>;
  indexed: (n: number) => string;
  schema: string;
  placeholder: Record<AgentMode, string>;
  helper: string;
  emptyTitle: Record<AgentMode, string>;
  emptyDesc: Record<AgentMode, string>;
  loading: Record<AgentMode, string>;
  generatedSql: string;
  results: (n: number) => string;
  sources: string;
  showSql: string;
  route: (r: string) => string;
  networkError: string;
  samples: Record<AgentMode, string[]>;
  upload: {
    title: string;
    button: string;
    hint: string;
    uploading: string;
    uploadError: (msg: string) => string;
    dropHere: string;
    docsList: string;
    noDocs: string;
    chunks: (n: number) => string;
    pages: (n: number) => string;
    uploaded: string;
  };
}> = {
  en: {
    title: { rag: "RAG Agent", sql: "SQL Agent", combined: "Supervisor" },
    live: "LIVE",
    desc: {
      rag: "Ask questions about YOUR uploaded documents",
      sql: "Ask questions about business data — get SQL + results",
      combined: "Ask a question that needs both documents and data",
    },
    indexed: (n) => `${n} doc${n === 1 ? "" : "s"} indexed`,
    schema: "SQLite · 4 tables",
    placeholder: {
      rag: "Upload a document above, then ask anything about it…",
      sql: "e.g. What was total revenue in 2025?",
      combined: "e.g. Based on our policy, how many claims were denied for excluded windshield damage?",
    },
    helper: "Press Enter to send · Real LLM via Groq · LangChain + FAISS vector store",
    emptyTitle: {
      rag: "Upload a document to start",
      sql: "Ask a question",
      combined: "Ask a question",
    },
    emptyDesc: {
      rag: "Drop a PDF / TXT / MD above. The agent embeds it into FAISS, then answers your questions with citations from the document.",
      sql: "The agent reads your schema, generates SQL, runs it safely, and summarizes the result.",
      combined: "The agent routes to RAG and/or SQL, then synthesizes a single answer.",
    },
    loading: {
      rag: "Retrieving from FAISS · generating answer…",
      sql: "Reading schema · generating SQL · executing…",
      combined: "Routing to agents · synthesizing answer…",
    },
    generatedSql: "Generated SQL",
    results: (n) => `Results · ${n} rows`,
    sources: "Sources:",
    showSql: "Show SQL",
    route: (r) => `Route: ${r}`,
    networkError: "⚠️ Network error. Please retry.",
    samples: {
      rag: [
        "What is the technical stack used in this project?",
        "What embedding model does this project use?",
        "How does the document upload pipeline work?",
      ],
      sql: [
        "What was total revenue in 2025?",
        "Show revenue by legal entity for 2025",
        "How many claims were denied in 2025?",
        "List pending claims with their amounts",
      ],
      combined: [
        "Based on our policy, how many claims were denied for excluded windshield damage?",
        "What's the policy on windshield damage and how many such claims were paid?",
        "Based on our pricing, what would it cost to add eval suite for the US entity?",
      ],
    },
    upload: {
      title: "Documents",
      button: "Upload PDF / TXT / MD",
      hint: "Drop a file or click to browse · indexed in FAISS, persisted to disk",
      uploading: "Embedding & indexing…",
      uploadError: (msg) => `Upload failed: ${msg}`,
      dropHere: "Drop file here to upload",
      docsList: "Indexed documents",
      noDocs: "No documents uploaded yet — RAG queries will return empty until you upload one.",
      chunks: (n) => `${n} chunks`,
      pages: (n) => `${n} page${n === 1 ? "" : "s"}`,
      uploaded: "uploaded",
    },
  },
  zh: {
    title: { rag: "RAG 智能体", sql: "SQL 智能体", combined: "Supervisor" },
    live: "实时",
    desc: {
      rag: "就你上传的文档提问",
      sql: "就业务数据提问——拿到 SQL + 结果",
      combined: "提一个需要同时用到文档和数据的问题",
    },
    indexed: (n) => `已索引 ${n} 篇文档`,
    schema: "SQLite · 4 张表",
    placeholder: {
      rag: "在上方上传文档，然后就可以就文档提问…",
      sql: "例如：2025 年总营收是多少？",
      combined: "例如：根据保单，有多少理赔因挡风玻璃除外条款被拒？",
    },
    helper: "按 Enter 发送 · 由 Groq 真实大模型驱动 · LangChain + FAISS 向量库",
    emptyTitle: {
      rag: "上传文档以开始",
      sql: "提一个问题",
      combined: "提一个问题",
    },
    emptyDesc: {
      rag: "把 PDF / TXT / MD 文件拖到上方。智能体会嵌入到 FAISS 中，然后基于文档引用回答你的问题。",
      sql: "智能体读取 Schema、生成 SQL、安全执行，并对结果做总结。",
      combined: "智能体路由到 RAG 和/或 SQL，然后综合出单一答案。",
    },
    loading: {
      rag: "从 FAISS 检索中 · 生成答案中…",
      sql: "读取 Schema · 生成 SQL · 执行中…",
      combined: "路由到智能体 · 综合答案中…",
    },
    generatedSql: "生成的 SQL",
    results: (n) => `结果 · ${n} 行`,
    sources: "来源：",
    showSql: "展开 SQL",
    route: (r) => `路由：${r}`,
    networkError: "⚠️ 网络错误，请重试。",
    samples: {
      rag: [
        "这个项目用了什么技术栈？",
        "这个项目用的什么嵌入模型？",
        "文档上传流水线是怎么工作的？",
      ],
      sql: [
        "2025 年总营收是多少？",
        "按法人实体展示 2025 年的营收",
        "2025 年有多少理赔被拒？",
        "列出待处理理赔及金额",
      ],
      combined: [
        "根据保单，有多少理赔因挡风玻璃除外条款被拒？",
        "挡风玻璃损坏的理赔政策是什么？有多少此类理赔已赔付？",
        "基于你们的定价，给美国实体加评估套件大概多少钱？",
      ],
    },
    upload: {
      title: "文档",
      button: "上传 PDF / TXT / MD",
      hint: "拖拽文件或点击选择 · 嵌入 FAISS，持久化到磁盘",
      uploading: "嵌入并索引中…",
      uploadError: (msg) => `上传失败：${msg}`,
      dropHere: "拖拽文件到这里上传",
      docsList: "已索引文档",
      noDocs: "还没有上传文档——上传前 RAG 查询会返回空。",
      chunks: (n) => `${n} 个块`,
      pages: (n) => `${n} 页`,
      uploaded: "上传于",
    },
  },
};

// The FastAPI mini-service runs on port 8000. Next.js rewrites (see next.config.ts)
// proxy /api/rag/*, /api/sql/*, /api/combined/* to it, so the frontend just uses
// relative paths — works for both local dev and the public preview URL.
const API_BASE = "/api";

function endpointFor(mode: AgentMode): string {
  switch (mode) {
    case "rag":
      return `${API_BASE}/rag/chat`;
    case "sql":
      return `${API_BASE}/sql/chat`;
    case "combined":
      return `${API_BASE}/combined/chat`;
  }
}

export function AgentDemo({ mode }: { mode: AgentMode }) {
  const { lang } = useLang();
  const t = T[lang];

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<{ q: string; r: Result }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // RAG: document upload state
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const icon =
    mode === "rag" ? FileSearch : mode === "sql" ? Database : Workflow;
  const Icon = icon;

  // Fetch the list of indexed documents (RAG mode only).
  const refreshDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      // Silent fail — the upload UI will show "no docs" anyway.
    }
  }, []);

  // On mount or when switching to RAG mode, refresh the doc list.
  useEffect(() => {
    if (mode === "rag") refreshDocs();
  }, [mode, refreshDocs]);

  // Upload a file to the FastAPI backend.
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.detail || `HTTP ${res.status}`);
        return;
      }
      await refreshDocs();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUploading(false);
    }
  }, [refreshDocs]);

  // Drag-and-drop handlers.
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [result, loading]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(endpointFor(mode), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang }),
      });
      const data = await res.json();
      const r: Result = {
        answer: data.answer || "",
        sources: data.sources,
        sql: data.sql,
        sqlColumns: data.columns || data.sql_columns,
        sqlRows: data.rows || data.sql_rows,
        ragSources: data.rag_sources,
        route: data.route,
      };
      setResult(r);
      setHistory((h) => [...h, { q, r }].slice(-3));
    } catch {
      setResult({ answer: t.networkError });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(question);
    }
  }

  return (
    <Card className="overflow-hidden border-accent/20 bg-card/60 backdrop-blur-sm">
      <CardHeader className="border-b border-border bg-accent/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
              <Icon className="size-5 text-accent" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {t.title[mode]}
                <Badge variant="outline" className="text-[10px] font-normal text-accent">
                  {t.live}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">{t.desc[mode]}</CardDescription>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            {mode === "rag" ? (
              <>
                <FileText className="size-3.5" />
                {t.indexed(documents.length)}
              </>
            ) : mode === "sql" ? (
              <>
                <Table2 className="size-3.5" />
                {t.schema}
              </>
            ) : (
              <>
                <Workflow className="size-3.5" />
                RAG + SQL
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Upload UI — only in RAG mode */}
        {mode === "rag" && (
          <div className="border-b border-border bg-muted/30 p-4">
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragOver
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/40 hover:bg-accent/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={onFilePick}
                className="hidden"
                aria-label={t.upload.button}
              />
              {uploading ? (
                <>
                  <Loader2 className="size-6 animate-spin text-accent" />
                  <p className="text-sm font-medium text-accent">{t.upload.uploading}</p>
                </>
              ) : (
                <>
                  <div className="flex size-10 items-center justify-center rounded-full bg-accent/15">
                    <Upload className="size-5 text-accent" />
                  </div>
                  <p className="text-sm font-medium">{t.upload.button}</p>
                  <p className="text-xs text-muted-foreground">{t.upload.hint}</p>
                </>
              )}
            </div>

            {uploadError && (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {t.upload.uploadError(uploadError)}
              </p>
            )}

            {/* Documents list */}
            {documents.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.upload.docsList}
                </div>
                <ul className="space-y-1.5">
                  {documents.map((d) => (
                    <li
                      key={d.filename}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="size-3.5 shrink-0 text-accent" />
                        <span className="truncate text-xs font-medium">{d.filename}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {t.upload.pages(d.pages)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {t.upload.chunks(d.chunks)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div
          ref={scrollRef}
          className="max-h-[440px] min-h-[280px] space-y-4 overflow-y-auto p-4"
        >
          {!result && !loading && history.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
                <Icon className="size-6 text-accent" />
              </div>
              <p className="text-sm font-medium">{t.emptyTitle[mode]}</p>
              <p className="max-w-xs text-xs text-muted-foreground">{t.emptyDesc[mode]}</p>
              {mode === "rag" && documents.length === 0 && (
                <p className="mt-2 text-[11px] text-accent">{t.upload.noDocs}</p>
              )}
            </div>
          )}

          {history.map((h, i) => (
            <div key={i} className="space-y-2">
              <UserBubble q={h.q} />
              <ResultBlock r={h.r} t={t} compact />
            </div>
          ))}

          {loading && (
            <div className="space-y-2">
              <UserBubble q={question} />
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t.loading[mode]}
              </div>
            </div>
          )}

          {result && !loading && (
            <ResultBlock r={result} t={t} />
          )}
        </div>

        {history.length === 0 && !result && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {t.samples[mode].map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t.placeholder[mode]}
              rows={2}
              className="resize-none bg-background/60"
              disabled={loading}
            />
            <Button
              onClick={() => ask(question)}
              disabled={loading || !question.trim()}
              size="icon"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t.helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UserBubble({ q }: { q: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
        {q}
      </div>
    </div>
  );
}

function ResultBlock({
  r,
  t,
  compact = false,
}: {
  r: Result;
  t: typeof T.en;
  compact?: boolean;
}) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const sources = r.sources || r.ragSources || [];
  const hasSql = !!r.sql;
  const hasRows = !!r.sqlRows && r.sqlRows.length > 0;

  return (
    <div className="space-y-2">
      {/* Answer */}
      <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3.5 py-2.5 text-sm">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
        <p className="whitespace-pre-wrap leading-relaxed text-foreground">{r.answer}</p>
      </div>

      {/* Route badge (Combined only) */}
      {r.route && (
        <div className="flex justify-end">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {t.route(r.route)}
          </Badge>
        </div>
      )}

      {/* Show SQL collapsible */}
      {hasSql && (
        <Collapsible open={sqlOpen} onOpenChange={setSqlOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Terminal className="size-3" />
              {t.showSql}
              <ChevronDown
                className={cn("size-3 transition-transform", sqlOpen && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="overflow-hidden rounded-lg border border-border bg-background/80">
              <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground">
                {r.sql}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Results table */}
      {hasRows && r.sqlColumns && (
        <div className="overflow-hidden rounded-lg border border-border bg-background/80">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Table2 className="size-3" />
            {t.results(r.sqlRows!.length)}
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  {r.sqlColumns.map((c) => (
                    <th key={c} className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.sqlRows!.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    {r.sqlColumns!.map((c, j) => (
                      <td key={c} className="px-3 py-2 text-foreground">
                        {formatCell(row[j])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sources */}
      {!compact && sources.length > 0 && (
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Quote className="size-3" />
            {t.sources}
          </div>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="rounded-md border border-border/60 bg-card/60 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
                  <FileText className="size-3" />
                  {s.document}
                  {s.page !== undefined && s.page !== null && (
                    <span className="text-muted-foreground">· p. {s.page}</span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCell(v: string | number | undefined | null) {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number") {
    return v >= 1000
      ? v.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : String(v);
  }
  return String(v);
}
