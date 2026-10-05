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

export const metadata: Metadata = {
  title: "crabAI — Custom RAG & SQL Agent Engineering",
  description:
    "Production-grade RAG systems and natural-language SQL agents, built for your data. Fast delivery, eval-driven quality, deployed to your stack.",
  keywords: [
    "RAG",
    "SQL Agent",
    "LLM",
    "AI Engineer",
    "Knowledge Base",
    "Natural Language to SQL",
    "LangChain",
    "LlamaIndex",
    "AI Consulting",
    "定制 RAG",
    "SQL 智能体",
    "AI 工程师",
  ],
  authors: [{ name: "crabAI" }],
  icons: {
    icon: "/crablogo.svg",
  },
  openGraph: {
    title: "crabAI — Custom RAG & SQL Agent Engineering",
    description:
      "Production-grade RAG systems and natural-language SQL agents, built for your data.",
    siteName: "crabAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "crabAI — Custom RAG & SQL Agent Engineering",
    description:
      "Production-grade RAG systems and natural-language SQL agents, built for your data.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSC.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
