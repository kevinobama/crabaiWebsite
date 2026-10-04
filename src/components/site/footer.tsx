import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { CrabIcon } from "@/components/site/crab-icon";
import type { Lang } from "@/lib/i18n";

// Footer is a server component — it can't use the hook, so we just render
// both languages side by side in compact form. The header has the live toggle.
const T: Record<Lang, {
  tagline: string;
  product: string;
  company: string;
  contact: string;
  services: string;
  demos: string;
  pricing: string;
  industries: string;
  process: string;
  faq: string;
  bookCall: string;
  copyright: string;
  builtWith: string;
}> = {
  en: {
    tagline:
      "Custom RAG systems and natural-language SQL agents. Built by one engineer, deployed in your cloud, owned by your team.",
    product: "Product",
    company: "Company",
    contact: "Contact",
    services: "Services",
    demos: "Live Demos",
    pricing: "Pricing",
    industries: "Industries",
    process: "Process",
    faq: "FAQ",
    bookCall: "Book a call",
    copyright: "© {year} crabAI. Built by an AI engineer, for AI buyers.",
    builtWith: "Powered by CrabAI",
  },
  zh: {
    tagline:
      "定制 RAG 系统与自然语言 SQL 智能体。一位工程师搭建，部署在你的云里，归你的团队所有。",
    product: "产品",
    company: "公司",
    contact: "联系",
    services: "服务",
    demos: "在线演示",
    pricing: "价格",
    industries: "行业",
    process: "流程",
    faq: "常见问题",
    bookCall: "预约咨询",
    copyright: "© {year} crabAI. 为 AI 工程师而建，为 AI 买家而生。",
    builtWith: "Powered by CrabAI",
  },
};

export function SiteFooter() {
  // Render English by default; the header has the language toggle for the
  // interactive sections. Keeping the footer static avoids hydration issues.
  const t = T.en;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="space-y-3">
            <a href="#top" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-accent/15 ring-1 ring-accent/40">
                <CrabIcon className="size-3.5 text-accent" />
              </div>
              <span className="text-sm font-semibold">
                crab<span className="text-accent">AI</span>
              </span>
            </a>
            <p className="max-w-xs text-xs text-muted-foreground">{t.tagline}</p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.product}
              </div>
              <a href="#services" className="block text-muted-foreground hover:text-foreground">{t.services}</a>
              <a href="#demos" className="block text-muted-foreground hover:text-foreground">{t.demos}</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">{t.pricing}</a>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.company}
              </div>
              <a href="#industries" className="block text-muted-foreground hover:text-foreground">{t.industries}</a>
              <a href="#process" className="block text-muted-foreground hover:text-foreground">{t.process}</a>
              <a href="#faq" className="block text-muted-foreground hover:text-foreground">{t.faq}</a>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.contact}
              </div>
              <a href="mailto:kevinobamatheus@gmail.com" className="block text-muted-foreground hover:text-foreground">kevinobamatheus@gmail.com</a>
              <a href="#contact" className="block text-muted-foreground hover:text-foreground">{t.bookCall}</a>
            </div>
          </div>

          {/* Socials */}
          <div className="flex gap-2">
            <a
              href="#"
              aria-label="GitHub"
              className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Github className="size-4" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Linkedin className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="mailto:kevinobamatheus@gmail.com"
              aria-label="Email"
              className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t.copyright.replace("{year}", String(year))}</p>
          <p>{t.builtWith}</p>
        </div>
      </div>
    </footer>
  );
}
