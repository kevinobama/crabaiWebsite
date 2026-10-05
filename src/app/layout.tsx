import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// ─── SEO constants ──────────────────────────────────────────────────────────
// Update SITE_URL to your real production domain. Used for canonical URL,
// Open Graph, sitemap, and JSON-LD.
const SITE_URL = "https://www.crabq.com";
const SITE_NAME = "crabAI";
const SITE_TWITTER = "@crabai";

// Bilingual titles + descriptions (the language switcher toggles between these
// at runtime via the i18n provider; this is the default/EN version that
// search engines see on first load).
const TITLE_EN = "crabAI — Custom RAG & SQL Agent Engineering | Hire an AI Engineer";
const TITLE_ZH = "crabAI — 定制 RAG 与 SQL 智能体工程 | AI 工程师服务";

const DESC_EN =
  "Hire a private AI engineer to build production-grade custom RAG systems and natural-language SQL agents for your data. FAISS + Groq + LangChain. 2-week MVP. Citations, evals, zero hallucinations. SOC 2 / GDPR / HIPAA ready.";
const DESC_ZH =
  "雇佣私人 AI 工程师，为你的数据构建生产级定制 RAG 系统与自然语言 SQL 智能体。FAISS + Groq + LangChain。2 周交付 MVP。带引用、有评估、零幻觉。支持 SOC 2 / GDPR / HIPAA 合规。";

// ─── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  // Default title — bilingual EN version (search engines index this first).
  // The runtime language switcher updates the <title> via the i18n provider.
  title: {
    default: TITLE_EN,
    template: `%s | crabAI`,
  },
  description: DESC_EN,
  applicationName: SITE_NAME,
  generator: "Next.js 16",
  referrer: "origin-when-cross-origin",
  keywords: [
    // English — high-intent search terms
    "custom RAG",
    "RAG agent",
    "RAG system",
    "SQL agent",
    "natural language to SQL",
    "text to SQL",
    "AI engineer for hire",
    "private AI engineer",
    "freelance AI developer",
    "LangChain consultant",
    "LlamaIndex consultant",
    "FAISS",
    "vector database",
    "LLM consulting",
    "AI consulting",
    "retrieval augmented generation",
    "knowledge base AI",
    "chatbot for documents",
    "document Q&A AI",
    "Groq",
    "gpt-oss-20b",
    // Chinese — high-intent search terms
    "定制 RAG",
    "RAG 智能体",
    "SQL 智能体",
    "自然语言转 SQL",
    "AI 工程师",
    "私人 AI 工程师",
    "AI 顾问",
    "LangChain 顾问",
    "向量数据库",
    "FAISS 开发",
    "知识库问答",
    "文档问答 AI",
    "大模型咨询",
    "RAG 系统",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    // Hreflang — tells search engines this is a multilingual site.
    // We serve both EN and ZH from the same URL (language toggle is client-side),
    // so we declare both locales pointing to the same canonical page.
    languages: {
      "en-US": "/",
      "zh-CN": "/",
      "x-default": "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg" }],
  },  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE_EN,
    description: DESC_EN,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "crabAI — Custom RAG & SQL Agent Engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: TITLE_EN,
    description: DESC_EN,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

// ─── JSON-LD structured data ────────────────────────────────────────────────
// Helps Google understand the business, the services, and the website. Rich
// results may include service cards in SERPs.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // Organization
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      description:
        "crabAI builds private, production-grade custom RAG systems and natural-language SQL agents. FAISS + Groq + LangChain. Bilingual EN/中文.",
      sameAs: [
        // Add your real social profiles when you have them
        // "https://github.com/crabai",
        // "https://www.linkedin.com/company/crabai",
        // "https://twitter.com/crabai",
      ],
    },
    // WebSite (enables sitelinks search box in Google results)
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    // Service — RAG Agent
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#rag-service`,
      name: "Custom RAG System Development",
      alternateName: "定制 RAG 系统开发",
      description:
        "Production-grade retrieval-augmented generation systems grounded in your private documents. FAISS vector store, hybrid retrieval, reranking, citations, eval suites. Deployed in your cloud or on-prem.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "Worldwide",
      serviceType: "AI Engineering — Retrieval Augmented Generation",
      url: `${SITE_URL}/#services`,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "4500",
        highPrice: "12000",
        offerCount: 3,
      },
    },
    // Service — SQL Agent
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#sql-service`,
      name: "Natural-Language SQL Agent Development",
      alternateName: "自然语言 SQL 智能体开发",
      description:
        "Conversational agents that translate business questions into validated SQL against your existing databases. Schema-aware prompt construction, read-only execution safety, natural-language summaries. Compatible with Postgres, MySQL, Snowflake, BigQuery, Redshift.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "Worldwide",
      serviceType: "AI Engineering — Natural Language to SQL",
      url: `${SITE_URL}/#services`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for rich search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSC.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
