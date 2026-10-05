"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLang, type Lang } from "@/lib/i18n";

const T: Record<Lang, {
  badge: string;
  title: string;
  subtitlePre: string;
  subtitleLink: string;
  faqs: { q: string; a: string }[];
}> = {
  en: {
    badge: "FAQ",
    title: "Things people ask before signing",
    subtitlePre: "Don't see your question here?",
    subtitleLink: "Just ask me directly.",
    faqs: [
      {
        q: "How is this different from buying a SaaS like Glean or ChatGPT Enterprise?",
        a: "SaaS products give you a generic assistant on whatever they support. I build a custom system around your specific data sources, schemas, accuracy requirements, and compliance constraints — deployed in your cloud, owned by your team, with eval scores you can defend to a regulator. You own the IP, not a rental.",
      },
      {
        q: "Will the answers hallucinate?",
        a: "Every answer is grounded in retrieved context with explicit citations. The eval suite checks faithfulness (does the answer match the sources?), relevance (did we retrieve the right docs?), and citation accuracy. We ship only when those metrics cross your defined thresholds — typically 95%+ faithfulness.",
      },
      {
        q: "What if my data is sensitive or on-prem only?",
        a: "All systems can run in your VPC or on-prem. I support local LLMs (Llama 3, Mistral) for air-gapped deployments, and the data path never leaves your infrastructure. For regulated industries, I can sign BAAs and work under HIPAA / SOC 2 / FedRAMP controls.",
      },
      {
        q: "Which LLMs do you use?",
        a: "Whatever fits your budget and latency budget: OpenAI (GPT-4o, o1), Anthropic (Claude 3.5 Sonnet / Opus), Google (Gemini 1.5), or open-source (Llama 3.1, Mistral Large) via vLLM / Together. The architecture is model-agnostic — we can swap providers without rewriting the system.",
      },
      {
        q: "What does the SQL agent do if my question is ambiguous?",
        a: "It asks a clarifying question, proposes 2–3 interpretations, or runs the most-likely query with an explicit caveat. It never silently guesses. Read-only DB users and query validation prevent destructive SQL, even on accidents.",
      },
      {
        q: "What happens after launch?",
        a: "Every project includes a handoff session, runbook, and post-launch support window. After that, you can take it in-house (I train your engineers) or keep me on a retainer for eval monitoring, model upgrades, and feature work. No lock-in — the code is yours.",
      },
      {
        q: "Do you work with my existing data team?",
        a: "Yes. I can integrate with your existing data warehouse, feature store, and BI tools. Many projects are co-built with the in-house team — I lead architecture and the hard parts, they own ongoing maintenance. Code reviews and pairing are part of the handoff.",
      },
      {
        q: "What's the smallest engagement you'll take?",
        a: "The Starter tier (¥32,400, 2 weeks) is the floor. Below that, you're better served by an off-the-shelf tool. For anything below 1 week of work I'll usually refer you to a vetted freelancer.",
      },
    ],
  },
  zh: {
    badge: "常见问题",
    title: "签约前大家最关心的问题",
    subtitlePre: "没看到你想问的？",
    subtitleLink: "直接来问我。",
    faqs: [
      {
        q: "这和买 Glean、ChatGPT Enterprise 这类 SaaS 有什么不一样？",
        a: "SaaS 给你的是一个通用助手，只能基于它们支持的内容。我围绕你特定的数据源、Schema、准确率要求和合规约束，搭一套定制系统——部署在你的云里、归你的团队所有，评估指标能拿去给监管看。你拥有 IP，不是租用。",
      },
      {
        q: "回答会胡说八道吗？",
        a: "每个回答都基于检索到的上下文，附带明确的引用。评估套件会检查忠实度（回答是否与来源一致）、相关性（是否检索到了正确的文档）和引用准确性。只有这些指标过了你设定的阈值（通常忠实度 95%+）才上线。",
      },
      {
        q: "如果我的数据敏感或必须私有化部署呢？",
        a: "整套系统都能跑在你的 VPC 或私有化环境里。我支持本地大模型（Llama 3、Mistral）做完全离线部署，数据链路绝不离开你的基础设施。对于强监管行业，我可以签 BAA，按 HIPAA / SOC 2 / FedRAMP 合规流程做。",
      },
      {
        q: "你们用哪些大模型？",
        a: "看你的预算和延迟要求：OpenAI（GPT-4o、o1）、Anthropic（Claude 3.5 Sonnet / Opus）、Google（Gemini 1.5），或者开源的（Llama 3.1、Mistral Large）通过 vLLM / Together 部署。架构与具体模型解耦——可以换供应商而不用重写系统。",
      },
      {
        q: "SQL 智能体遇到问题不明确怎么办？",
        a: "它会反问澄清、给出 2–3 种解释供选，或者按最可能的解读执行并明确标注不确定性。绝不静默瞎猜。只读数据库账号 + 查询校验能防止误操作造成破坏。",
      },
      {
        q: "上线之后呢？",
        a: "每个项目都包含交接培训、运维手册和上线后支持期。之后你可以自己接手（我培训你的工程师），也可以续约让我做评估监控、模型升级和功能迭代。没有锁定——代码是你的。",
      },
      {
        q: "能和我现有的数据团队配合吗？",
        a: "可以。我能接入你现有的数仓、特征平台和 BI 工具。很多项目是和内部团队共建的——我负责架构和难点，他们负责长期维护。代码评审和结对是交接的一部分。",
      },
      {
        q: "你接的最小项目是多大？",
        a: "入门版（¥32,400，2 周）是下限。再小的话，用现成的工具更合适。1 周以内的小活我通常会推荐给靠谱的自由职业者。",
      },
    ],
  },
};

export function FaqSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="faq" className="container mx-auto max-w-3xl px-4 py-20 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
          {t.badge}
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-4 text-muted-foreground">
          {t.subtitlePre}{" "}
          <a href="#contact" className="text-accent hover:underline">
            {t.subtitleLink}
          </a>
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {t.faqs.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border-b border-border"
          >
            <AccordionTrigger className="text-left text-base hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
