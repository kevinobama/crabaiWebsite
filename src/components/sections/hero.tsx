"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Database, FileSearch, Zap, ShieldCheck } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";

const T: Record<Lang, {
  badge: string;
  h1a: string;
  h1b: string;
  h1c: string;
  subhead: string;
  cta1: string;
  cta2: string;
  trust: { soc: string; mvp: string; eval: string; stack: string };
  stats: { value: string; label: string }[];
}> = {
  en: {
    badge: "Available for new projects · ",
    h1a: "Custom RAG",
    h1b: "& SQL Agents",
    h1c: "built for your data",
    subhead:
      "I design, build, and ship production-grade retrieval-augmented generation systems and natural-language SQL agents — so your team gets answers from your documents and databases in plain English, with citations, evals, and zero hallucinations.",
    cta1: "Try the Live Demos",
    cta2: "Book a Discovery Call",
    trust: {
      soc: "SOC 2 ready",
      mvp: "2-week MVP delivery",
      eval: "Eval-driven quality",
      stack: "Your stack, your cloud",
    },
    stats: [
      { value: "20+", label: "Projects shipped" },
      { value: "<2s", label: "Avg. query latency" },
      { value: "97%", label: "Eval pass rate" },
      { value: "8", label: "Industries served" },
    ],
  },
  zh: {
    badge: "正在接新项目 · 2026 第四季度",
    h1a: "定制 RAG",
    h1b: "与 SQL 智能体",
    h1c: "为你的数据而生",
    subhead:
      "我设计、构建并交付生产级的检索增强生成（RAG）系统和自然语言 SQL 智能体——让你的团队能用日常语言从文档和数据库中获取答案，附带引用、评估，零幻觉。",
    cta1: "试用在线演示",
    cta2: "预约咨询",
    trust: {
      soc: "SOC 2 就绪",
      mvp: "2 周交付 MVP",
      eval: "评估驱动质量",
      stack: "你的技术栈，你的云",
    },
    stats: [
      { value: "20+", label: "已交付项目" },
      { value: "<2s", label: "平均查询延迟" },
      { value: "97%", label: "评估通过率" },
      { value: "8", label: "服务行业数量" },
    ],
  },
};

export function HeroSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" aria-hidden />

      <div className="container relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Status badge */}
          <Badge
            variant="outline"
            className="mb-6 gap-1.5 border-accent/40 bg-accent/10 text-accent"
          >
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            {t.badge}
          </Badge>

          {/* Headline */}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="text-gradient">{t.h1a}</span> {t.h1b}
            <br />
            {t.h1c}
          </h1>

          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            {t.subhead}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 glow-emerald"
            >
              <a href="#demos">
                <Play className="size-4" />
                {t.cta1}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#contact">
                {t.cta2}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              {t.trust.soc}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-accent" />
              {t.trust.mvp}
            </span>
            <span className="flex items-center gap-1.5">
              <FileSearch className="size-4 text-accent" />
              {t.trust.eval}
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="size-4 text-accent" />
              {t.trust.stack}
            </span>
          </div>
        </div>

        {/* Stats panel */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {t.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card/60 p-4 text-center backdrop-blur-sm"
            >
              <div className="text-2xl font-bold text-accent sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
