"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scale,
  Banknote,
  HeartPulse,
  ShoppingCart,
  Factory,
  GraduationCap,
  Plane,
  Wrench,
} from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";

type Industry = {
  icon: typeof Scale;
  name: string;
  useCase: string;
  example: string;
};

const T: Record<Lang, {
  badge: string;
  title: string;
  subtitle: string;
  industries: Industry[];
}> = {
  en: {
    badge: "Where I've shipped",
    title: "Built for knowledge-intensive industries",
    subtitle:
      "The same RAG + SQL primitives, tuned to each industry's accuracy, compliance, and latency requirements.",
    industries: [
      {
        icon: Scale,
        name: "Legal",
        useCase:
          "Case-law GraphRAG for due diligence — retrieve precedents, statutes, and rulings with citations partners can trust.",
        example: `"Find every ruling in CA on non-compete clauses from 2020+"`,
      },
      {
        icon: Banknote,
        name: "Financial Services",
        useCase:
          "Research assistants that synthesize filings, transcripts, and internal memos. SQL agents for portfolio analytics.",
        example: `"Summarize the risk factors from this 10-K with citations"`,
      },
      {
        icon: HeartPulse,
        name: "Healthcare",
        useCase:
          "Clinical knowledge bases grounded in SOPs, formularies, and guidelines — with strict source attribution and audit logs.",
        example: `"What's the protocol for adult sepsis at our hospital?"`,
      },
      {
        icon: ShoppingCart,
        name: "E-commerce Ops",
        useCase:
          "SQL agents for inventory, fulfillment, and LTV analytics — letting ops teams self-serve without pinging data.",
        example: `"Which SKUs have <10 units left and >50 weekly sales?"`,
      },
      {
        icon: Factory,
        name: "Manufacturing",
        useCase:
          "Maintenance manuals + IoT logs in one RAG. Technicians ask in plain language, get the right page + safety warnings.",
        example: `"Why is line 3 showing error code E-447?"`,
      },
      {
        icon: GraduationCap,
        name: "Education",
        useCase:
          "Course-material tutors that answer student questions strictly from the syllabus — no made-up citations, ever.",
        example: `"Explain the difference between TCP and UDP from week 4"`,
      },
      {
        icon: Plane,
        name: "Travel & Hospitality",
        useCase:
          "Policy + booking agents that handle complex multi-step questions across reservation, loyalty, and fare-rule systems.",
        example: `"Can I rebook a cancelled flight to a partner airline?"`,
      },
      {
        icon: Wrench,
        name: "Internal IT / DevOps",
        useCase:
          "Runbooks, postmortems, and Confluence in one RAG. On-call engineers resolve incidents faster with cited answers.",
        example: `"What's the rollback procedure for the payments service?"`,
      },
    ],
  },
  zh: {
    badge: "我交付过的行业",
    title: "为知识密集型行业而构建",
    subtitle:
      "同样的 RAG + SQL 基础能力，针对每个行业的准确率、合规性和延迟要求进行调优。",
    industries: [
      {
        icon: Scale,
        name: "法律",
        useCase:
          "用于尽职调查的判例 GraphRAG——检索判例、法规和裁定，附带合伙人可信赖的引用。",
        example: "「检索 2020 年以来加州所有关于竞业禁止条款的判决」",
      },
      {
        icon: Banknote,
        name: "金融服务",
        useCase:
          "综合财报、电话会纪要和内部备忘的研究助手；用于组合分析的 SQL 智能体。",
        example: "「带引用地总结这份 10-K 中的风险因素」",
      },
      {
        icon: HeartPulse,
        name: "医疗健康",
        useCase:
          "基于 SOP、药品目录和诊疗指南的临床知识库——严格的来源标注和审计日志。",
        example: "「我院成人脓症的处理流程是什么？」",
      },
      {
        icon: ShoppingCart,
        name: "电商运营",
        useCase:
          "用于库存、履约和 LTV 分析的 SQL 智能体——让运营自助取数，不用反复找数据团队。",
        example: "「哪些 SKU 库存 <10 且周销量 >50？」",
      },
      {
        icon: Factory,
        name: "制造业",
        useCase:
          "维修手册 + IoT 日志统一进一个 RAG。技术员用自然语言提问，拿到正确页面和安全提示。",
        example: "「3 号线报 E-447 错误是什么原因？」",
      },
      {
        icon: GraduationCap,
        name: "教育",
        useCase:
          "课程资料辅导助手，严格依据教学大纲回答学生问题——绝不编造引用。",
        example: "「用第 4 周的内容解释 TCP 和 UDP 的区别」",
      },
      {
        icon: Plane,
        name: "旅游与酒店",
        useCase:
          "策略 + 预订智能体，处理跨预订、会员和运价系统的复杂多步问题。",
        example: "「取消的航班能改签到合作航司吗？」",
      },
      {
        icon: Wrench,
        name: "内部 IT / DevOps",
        useCase:
          "运行手册、事故复盘、Confluence 统一进一个 RAG。值班工程师靠带引用的答案更快解决故障。",
        example: "「支付服务的回滚流程是什么？」",
      },
    ],
  },
};

export function IndustriesSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="industries" className="container mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
          {t.badge}
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-4 text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.industries.map((ind) => (
          <Card
            key={ind.name}
            className="group border-border bg-card/60 backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-card/80"
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30 transition-transform group-hover:scale-110">
                <ind.icon className="size-5 text-accent" />
              </div>
              <h3 className="font-semibold">{ind.name}</h3>
              <p className="text-xs text-muted-foreground">{ind.useCase}</p>
              <p className="rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5 font-mono text-[11px] text-accent/90">
                {ind.example}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
