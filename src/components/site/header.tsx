"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";
import { CrabIcon } from "@/components/site/crab-icon";

const NAV_LINKS: Record<Lang, { label: string; href: string }[]> = {
  en: [
    { label: "Services", href: "#services" },
    { label: "Live Demos", href: "#demos" },
    { label: "Industries", href: "#industries" },
    { label: "Process", href: "#process" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  zh: [
    { label: "服务", href: "#services" },
    { label: "在线演示", href: "#demos" },
    { label: "行业", href: "#industries" },
    { label: "流程", href: "#process" },
    { label: "价格", href: "#pricing" },
    { label: "常见问题", href: "#faq" },
  ],
};

const UI: Record<Lang, { tryDemo: string; bookCall: string; openMenu: string }> = {
  en: { tryDemo: "Try a Demo", bookCall: "Book a Call", openMenu: "Open menu" },
  zh: { tryDemo: "试用演示", bookCall: "预约咨询", openMenu: "打开菜单" },
};

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = NAV_LINKS[lang];
  const ui = UI[lang];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/40">
            <CrabIcon className="size-4 text-accent" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            crab<span className="text-accent">AI</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {/* Language toggle */}
          <div
            className="flex items-center rounded-md border border-border p-0.5 text-xs font-medium"
            role="group"
            aria-label="Language switch"
          >
            <button
              onClick={() => setLang("en")}
              className={cn(
                "rounded-sm px-2 py-1 transition-colors",
                lang === "en"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("zh")}
              className={cn(
                "rounded-sm px-2 py-1 transition-colors",
                lang === "zh"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={lang === "zh"}
            >
              中文
            </button>
          </div>
          <Button asChild size="sm" variant="ghost">
            <a href="#demos">{ui.tryDemo}</a>
          </Button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="#contact">{ui.bookCall}</a>
          </Button>
        </div>

        {/* Mobile: language toggle + menu */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center rounded-md border border-border p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang("en")}
              className={cn(
                "rounded-sm px-2 py-1",
                lang === "en"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("zh")}
              className={cn(
                "rounded-sm px-2 py-1",
                lang === "zh"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              aria-pressed={lang === "zh"}
            >
              中文
            </button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={ui.openMenu}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-6 flex flex-col gap-1">
                {nav.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a
                      href={link.href}
                      className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button asChild variant="outline">
                      <a href="#demos">{ui.tryDemo}</a>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <a href="#contact">{ui.bookCall}</a>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
