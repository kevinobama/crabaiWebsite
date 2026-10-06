"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  CheckCircle2,
  Loader2,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";
import { Phone } from "lucide-react";

const T: Record<Lang, {
  badge: string;
  h2Pre: string;
  h2Highlight: string;
  p1: string;
  responseWithin: string;
  orEmail: string;
  privacy: string;
  labels: { name: string; email: string; company: string; service: string; budget: string; message: string };
  required: string;
  placeholders: { name: string; email: string; company: string; message: string };
  serviceOptions: { value: string; label: string }[];
  budgetOptions: { value: string; label: string }[];
  pickOne: string;
  optional: string;
  submit: string;
  submitting: string;
  consent: string;
  successTitle: (name: string) => string;
  successBody: string;
  another: string;
  validationError: string;
  networkError: string;
  fallbackError: string;
}> = {
  en: {
    badge: "Let's talk",
    h2Pre: "Tell me about your data.",
    h2Highlight: "I'll send you an architecture proposal within 24 hours.",
    p1:
      "No sales call required to start. Send me what you're trying to build, what data you have, and any constraints (compliance, latency, budget). You'll get a written proposal back — including a fixed quote if it fits the Starter or Pro tier.",
    responseWithin: "First response within",
    orEmail: "Or email me at",
    privacy:
      "Your details go straight to me — no CRM, no marketing list, no third parties. I reply personally.",
    labels: {
      name: "Name",
      email: "Email",
      company: "Company",
      service: "What do you need?",
      budget: "Budget range",
      message: "Project details",
    },
    required: "*",
    placeholders: {
      name: "Alex Chen",
      email: "alex@company.com",
      company: "Acme Corp (optional)",
      message:
        "What data do you have? What do you want users to be able to ask? Any compliance / latency / stack constraints?",
    },
    serviceOptions: [
      { value: "rag", label: "Custom RAG system" },
      { value: "sql-agent", label: "SQL / data agent" },
      { value: "both", label: "Both — full platform" },
      { value: "consult", label: "Just consulting / architecture review" },
    ],
    budgetOptions: [
      { value: "<5k", label: "Under $5k" },
      { value: "5-15k", label: "$5k – $15k" },
      { value: "15-50k", label: "$15k – $50k" },
      { value: "50k+", label: "$50k+" },
    ],
    pickOne: "Pick one",
    optional: "Optional",
    submit: "Send & get a proposal",
    submitting: "Sending…",
    consent:
      "By submitting, you agree I may email you about your project. No marketing, no list, ever.",
    successTitle: (name) => `Got it — thanks, ${name}!`,
    successBody:
      "I'll review your project and reply within 24 hours with an architecture proposal or a few clarifying questions.",
    another: "Submit another",
    validationError: "Please fill in name, email, service, and project details.",
    networkError: "Network error. Please email kevinobamatheus@gmail.com instead.",
    fallbackError: "Submission failed.",
  },
  zh: {
    badge: "聊聊吧",
    h2Pre: "告诉我你的数据情况。",
    h2Highlight: "24 小时内我给你一份架构方案。",
    p1:
      "不需要先打电话。把你想做的东西、手头有什么数据、有什么约束（合规、延迟、预算）发给我。你会拿到一份书面方案——如果符合入门版或专业版，会附带固定报价。",
    responseWithin: "首次回复在",
    orEmail: "或直接发邮件给",
    privacy:
      "你的信息直接发到我手里——没有 CRM、没有营销名单、没有第三方。我自己回。",
    labels: {
      name: "姓名",
      email: "邮箱",
      company: "公司",
      service: "你需要什么？",
      budget: "预算范围",
      message: "项目详情",
    },
    required: "*",
    placeholders: {
      name: "周文圣",
      email: "elon@crabai.ai",
      company: "CrabAI 公司（可选）",
      message:
        "你有什么数据？希望用户能问什么问题？有没有合规、延迟、技术栈方面的约束？",
    },
    serviceOptions: [
      { value: "rag", label: "定制 RAG 系统" },
      { value: "sql-agent", label: "SQL / 数据智能体" },
      { value: "both", label: "两个都要——完整平台" },
      { value: "consult", label: "只要咨询 / 架构评审" },
    ],
    budgetOptions: [
      { value: "<3w",     label: "3 万元以下" },
      { value: "3-10w",   label: "3 万–10 万元" },
      { value: "10-35w",  label: "10 万–35 万元" },
      { value: "35w+",    label: "35 万元以上" },
    ],
    pickOne: "选一个",
    optional: "可选",
    submit: "发送，拿方案",
    submitting: "发送中…",
    consent: "提交即同意我就你的项目给你发邮件。绝不营销，绝不转卖。",
    successTitle: (name) => `收到了，谢谢 ${name}！`,
    successBody:
      "我会评估你的项目，24 小时内回复架构方案或几个澄清问题。",
    another: "再提交一个",
    validationError: "请填写姓名、邮箱、服务类型和项目详情。",
    networkError: "网络错误。请改发邮件到 kevinobamatheus@gmail.com。",
    fallbackError: "提交失败。",
  },
};

export function ContactSection() {
  const { lang } = useLang();
  const t = T[lang];

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    budget: "",
    message: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || success) return;

    if (!form.name || !form.email || !form.service || !form.message) {
      setError(t.validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.fallbackError);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-border bg-card/30"
    >
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="container relative mx-auto max-w-5xl px-4 py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left: pitch */}
          <div className="space-y-6">
            <Badge variant="outline" className="border-accent/40 text-accent">
              {t.badge}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.h2Pre}
              <br />
              <span className="text-gradient">{t.h2Highlight}</span>
            </h2>
            <p className="text-muted-foreground">{t.p1}</p>

            <div className="space-y-3 rounded-xl border border-border bg-background/60 p-5">
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock className="size-4 text-accent" />
                <span className="text-muted-foreground">{t.responseWithin}</span>
                <span className="font-medium text-foreground">
                  {lang === "en" ? "24 hours" : "24 小时"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-accent" />
                <span className="text-muted-foreground">{t.orEmail}</span>
                <a
                  href="mailto:kevinobamatheus@gmail.com"
                  className="font-medium text-accent hover:underline"
                >
                  kevinobamatheus@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-accent" />
                Phone: +86 131 27584476
              </div>

            </div>

            <div className="text-xs text-muted-foreground">{t.privacy}</div>
          </div>

          {/* Right: form */}
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {success ? (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/40">
                    <CheckCircle2 className="size-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {t.successTitle(form.name.split(" ")[0] || form.name)}
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {t.successBody}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSuccess(false);
                      setForm({ name: "", email: "", company: "", service: "", budget: "", message: "" });
                    }}
                  >
                    {t.another}
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">
                        {t.labels.name} <span className="text-accent">{t.required}</span>
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder={t.placeholders.name}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">
                        {t.labels.email} <span className="text-accent">{t.required}</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder={t.placeholders.email}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="company">{t.labels.company}</Label>
                    <Input
                      id="company"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      placeholder={t.placeholders.company}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="service">
                        {t.labels.service} <span className="text-accent">{t.required}</span>
                      </Label>
                      <Select
                        value={form.service}
                        onValueChange={(v) => update("service", v)}
                      >
                        <SelectTrigger id="service">
                          <SelectValue placeholder={t.pickOne} />
                        </SelectTrigger>
                        <SelectContent>
                          {t.serviceOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="budget">{t.labels.budget}</Label>
                      <Select
                        value={form.budget}
                        onValueChange={(v) => update("budget", v)}
                      >
                        <SelectTrigger id="budget">
                          <SelectValue placeholder={t.optional} />
                        </SelectTrigger>
                        <SelectContent>
                          {t.budgetOptions.map((b) => (
                            <SelectItem key={b.value} value={b.value}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">
                      {t.labels.message} <span className="text-accent">{t.required}</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      rows={5}
                      placeholder={t.placeholders.message}
                      required
                    />
                  </div>

                  {error && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        {t.submit}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-muted-foreground">
                    {t.consent}
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
