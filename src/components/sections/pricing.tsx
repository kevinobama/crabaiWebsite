"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";

type Tier = {
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  highlight: boolean;
  features: string[];
  cta: string;
  href: string;
};

const T: Record<Lang, {
  badge: string;
  title: string;
  subtitle: string;
  popular: string;
  tiers: Tier[];
  footerPre: string;
  footerLink: string;
}> = {
  en: {
    badge: "Pricing",
    title: "Fixed-scope projects. No retainers required.",
    subtitle:
      "Pay for outcomes, not hours. Every project starts with a free architecture proposal — you commit only after you see the plan.",
    popular: "Most popular",
    footerPre: "Need something different?",
    footerLink: "Tell me about your project",
    tiers: [
      {
        name: "Starter",
        tagline: "A working RAG MVP on your data",
        price: "$4,500",
        cadence: "fixed · 2 weeks",
        highlight: false,
        features: [
          "RAG over up to 3 document sources",
          "Hybrid retrieval (BM25 + embeddings)",
          "Citations + source previews",
          "Basic eval suite (20 test cases)",
          "Deployed to your Vercel / Render",
          "1 round of revisions",
          "30 days post-launch support",
        ],
        cta: "Start a Starter project",
        href: "#contact",
      },
      {
        name: "Pro",
        tagline: "Production RAG + SQL agent, fully integrated",
        price: "$12,000",
        cadence: "fixed · 4–5 weeks",
        highlight: true,
        features: [
          "RAG over unlimited sources",
          "Natural-language SQL agent on 1 DB",
          "Reranking + answer verification",
          "Full eval suite (100+ test cases)",
          "Observability (Langfuse / LangSmith)",
          "Deployed to your AWS / GCP / Azure",
          "3 rounds of revisions",
          "90 days post-launch support",
          "2-hour team handoff training",
        ],
        cta: "Book a Pro discovery call",
        href: "#contact",
      },
      {
        name: "Enterprise",
        tagline: "Multi-system + on-prem + dedicated support",
        price: "Custom",
        cadence: "scoped · 6–12 weeks",
        highlight: false,
        features: [
          "Everything in Pro, plus:",
          "Multi-DB / multi-tenant SQL agents",
          "On-prem or VPC deployment",
          "Custom compliance (HIPAA, FedRAMP)",
          "Model fine-tuning or local LLMs",
          "Dedicated Slack channel",
          "Quarterly eval + drift reports",
          "On-site workshop (optional)",
        ],
        cta: "Talk to me about Enterprise",
        href: "#contact",
      },
    ],
  },
  zh: {
    badge: "价格",
    title: "固定范围项目，无需长期签约。",
    subtitle:
      "为结果付费，不是为小时付费。每个项目都先免费出架构方案——你看到方案后才决定是否推进。",
    popular: "最受欢迎",
    footerPre: "需要别的方案？",
    footerLink: "告诉我你的项目",
    tiers: [
      {
        name: "入门版",
        tagline: "基于你的数据搭一个能用的 RAG MVP",
        price: "$4,500",
        cadence: "固定价 · 2 周",
        highlight: false,
        features: [
          "最多接入 3 个文档源",
          "混合检索（BM25 + 向量）",
          "引用 + 原文预览",
          "基础评估套件（20 个用例）",
          "部署到你的 Vercel / Render",
          "1 轮修改",
          "30 天上线后支持",
        ],
        cta: "开始一个入门版项目",
        href: "#contact",
      },
      {
        name: "专业版",
        tagline: "生产级 RAG + SQL 智能体，完整集成",
        price: "$12,000",
        cadence: "固定价 · 4–5 周",
        highlight: true,
        features: [
          "无限制文档源接入",
          "1 个数据库上的自然语言 SQL 智能体",
          "重排 + 答案校验",
          "完整评估套件（100+ 用例）",
          "可观测性（Langfuse / LangSmith）",
          "部署到你的 AWS / GCP / Azure",
          "3 轮修改",
          "90 天上线后支持",
          "2 小时团队交接培训",
        ],
        cta: "预约专业版咨询",
        href: "#contact",
      },
      {
        name: "企业版",
        tagline: "多系统 + 私有化部署 + 专属支持",
        price: "议价",
        cadence: "按需界定 · 6–12 周",
        highlight: false,
        features: [
          "包含专业版全部能力，另加：",
          "多库 / 多租户 SQL 智能体",
          "私有化或 VPC 部署",
          "定制合规（HIPAA、FedRAMP）",
          "模型微调或本地大模型",
          "专属 Slack 群",
          "季度评估 + 漂移报告",
          "现场 workshop（可选）",
        ],
        cta: "聊聊企业版",
        href: "#contact",
      },
    ],
  },
};

export function PricingSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="pricing" className="container mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
          {t.badge}
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-4 text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {t.tiers.map((tier) => (
          <Card
            key={tier.name}
            className={cn(
              "relative border-border bg-card/60 backdrop-blur-sm transition-all",
              tier.highlight
                ? "border-accent/50 shadow-lg glow-emerald lg:-translate-y-2"
                : "hover:border-accent/30"
            )}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1 bg-accent text-accent-foreground">
                  <Star className="size-3 fill-current" />
                  {t.popular}
                </Badge>
              </div>
            )}
            <CardHeader className="space-y-1 pb-6">
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="text-xs text-muted-foreground">{tier.tagline}</p>
              <div className="pt-3">
                <span className="text-3xl font-bold tracking-tight">{tier.price}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{tier.cadence}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  "w-full",
                  tier.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : ""
                )}
                variant={tier.highlight ? "default" : "outline"}
              >
                <a href={tier.href}>{tier.cta}</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {t.footerPre}{" "}
        <a href="#contact" className="text-accent hover:underline">
          {t.footerLink}
        </a>{" "}
        {lang === "en" ? "and I'll propose a custom scope." : "，我会给你一个定制方案。"}
      </p>
    </section>
  );
}
