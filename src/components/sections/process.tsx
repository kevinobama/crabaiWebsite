"use client";

import { Badge } from "@/components/ui/badge";
import {
  Search,
  PenTool,
  Code2,
  TestTube2,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";

type Step = {
  icon: typeof Search;
  name: string;
  description: string;
  deliverables: string[];
};

const T: Record<Lang, {
  badge: string;
  title: string;
  subtitle: string;
  steps: Step[];
}> = {
  en: {
    badge: "How we'll work",
    title: "From zero to deployed in 6 weeks",
    subtitle:
      "Transparent milestones. Weekly demos. Code in your repo. You see the system working before any large commitment.",
    steps: [
      {
        icon: Search,
        name: "Discovery (Week 1)",
        description:
          "We map your data sources, success criteria, latency budget, and compliance constraints. You get a written architecture proposal with eval criteria — before any code is written.",
        deliverables: ["Architecture doc", "Eval rubric", "Fixed-quote proposal"],
      },
      {
        icon: PenTool,
        name: "Prototype (Week 1–2)",
        description:
          "A working slice of the system on a real subset of your data — chunking strategy, retrieval, answer generation, eval scores. You see it work before committing to full build.",
        deliverables: ["Live prototype URL", "Baseline eval report", "Refined scope"],
      },
      {
        icon: Code2,
        name: "Build (Week 2–4)",
        description:
          "Full implementation: ingestion pipelines, vector store, retrieval + reranking, query layer, observability. Weekly demos. Code lives in your repo from day one.",
        deliverables: ["Production code", "CI/CD", "Eval suite (automated)"],
      },
      {
        icon: TestTube2,
        name: "Eval & Hardening (Week 4–5)",
        description:
          "Adversarial testing, hallucination checks, latency tuning, security review. We hit your success metrics before launch — not after.",
        deliverables: ["Eval report (passing)", "Latency benchmarks", "Security checklist"],
      },
      {
        icon: Rocket,
        name: "Deploy (Week 5–6)",
        description:
          "Deployed to your cloud (AWS / GCP / Azure / on-prem) with monitoring, alerting, and rollback. Documentation and a 1-hour handoff session for your team.",
        deliverables: ["Live deployment", "Runbook", "Team handoff session"],
      },
      {
        icon: RefreshCw,
        name: "Iterate (Ongoing)",
        description:
          "Optional retainer: weekly eval runs, drift detection, model upgrades, and feature additions. Or I train your team to own it — your call.",
        deliverables: ["Weekly eval reports", "On-call support", "Training sessions"],
      },
    ],
  },
  zh: {
    badge: "我们的合作方式",
    title: "6 周从零到上线",
    subtitle:
      "透明的里程碑、每周演示、代码在你自己的仓库里。在任何大投入之前，你就能看到系统真正跑起来。",
    steps: [
      {
        icon: Search,
        name: "需求调研（第 1 周）",
        description:
          "梳理你的数据源、成功标准、延迟预算和合规约束。在任何代码动笔之前，你会先拿到一份带评估标准的书面架构方案。",
        deliverables: ["架构文档", "评估标准", "固定报价方案"],
      },
      {
        icon: PenTool,
        name: "原型搭建（第 1–2 周）",
        description:
          "在你真实数据的一个子集上跑通整套系统——分块策略、检索、答案生成、评估打分。在决定全面投入前，先看到效果。",
        deliverables: ["可访问的原型链接", "基线评估报告", "细化后的范围"],
      },
      {
        icon: Code2,
        name: "正式开发（第 2–4 周）",
        description:
          "完整实现：接入流水线、向量库、检索 + 重排、查询层、可观测性。每周演示，代码从第一天起就在你的仓库里。",
        deliverables: ["生产级代码", "CI/CD 流水线", "自动化评估套件"],
      },
      {
        icon: TestTube2,
        name: "评估与加固（第 4–5 周）",
        description:
          "对抗测试、幻觉检查、延迟调优、安全审查。我们达到你的成功指标后才上线——而不是上线后才发现问题。",
        deliverables: ["通过评估的报告", "延迟基准", "安全清单"],
      },
      {
        icon: Rocket,
        name: "部署上线（第 5–6 周）",
        description:
          "部署到你的云（AWS / GCP / Azure / 私有化），带监控、告警和回滚。提供文档和 1 小时的团队交接培训。",
        deliverables: ["上线部署", "运维手册", "团队交接培训"],
      },
      {
        icon: RefreshCw,
        name: "持续迭代（长期）",
        description:
          "可选的长期服务：每周评估、漂移检测、模型升级、功能迭代。也可以培训你的团队自己接手——由你决定。",
        deliverables: ["每周评估报告", "On-call 支持", "培训场次"],
      },
    ],
  },
};

export function ProcessSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="process" className="relative border-y border-border bg-card/30">
      <div className="container mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
            {t.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.steps.map((step, i) => (
            <div
              key={step.name}
              className="relative rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-accent/40"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
                  <step.icon className="size-5 text-accent" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mb-1.5 font-semibold">{step.name}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <ul className="mt-3 space-y-1 border-t border-border/60 pt-3">
                {step.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="size-1 rounded-full bg-accent" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
