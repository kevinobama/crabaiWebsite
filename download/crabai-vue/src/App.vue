<script setup lang="ts">
import { ref } from "vue";
import { useLang } from "@/composables/useLang";
import { STRINGS } from "@/lib/strings";
import AgentDemo from "@/components/AgentDemo.vue";

const { lang, setLang } = useLang();
const t = computed(() => STRINGS[lang.value]);
import { computed } from "vue";

const activeTab = ref<"rag" | "sql" | "combined">("rag");
</script>

<template>
  <div class="app-root">
    <!-- Header -->
    <header class="site-header">
      <div class="container header-inner">
        <a href="#top" class="brand">
          <span class="brand-icon">🦀</span>
          <span class="brand-name">crab<span class="brand-accent">AI</span></span>
        </a>
        <nav class="nav-desktop">
          <a href="#services">{{ t.nav.services }}</a>
          <a href="#demos">{{ t.nav.demos }}</a>
          <a href="#industries">{{ t.nav.industries }}</a>
          <a href="#process">{{ t.nav.process }}</a>
          <a href="#pricing">{{ t.nav.pricing }}</a>
          <a href="#faq">{{ t.nav.faq }}</a>
        </nav>
        <div class="header-actions">
          <div class="lang-toggle">
            <button :class="{ active: lang === 'en' }" @click="setLang('en')">EN</button>
            <button :class="{ active: lang === 'zh' }" @click="setLang('zh')">中文</button>
          </div>
          <a href="#demos" class="btn btn-ghost">{{ t.cta.tryDemo }}</a>
          <a href="#contact" class="btn btn-primary">{{ t.cta.bookCall }}</a>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section id="top" class="hero">
        <div class="container hero-inner">
          <span class="status-badge">{{ t.hero.badge }}</span>
          <h1 class="hero-h1">
            <span class="gradient">{{ t.hero.h1a }}</span> {{ t.hero.h1b }}<br />
            {{ t.hero.h1c }}
          </h1>
          <p class="hero-subhead">{{ t.hero.subhead }}</p>
          <div class="hero-cta">
            <a href="#demos" class="btn btn-primary btn-lg">▶ {{ t.hero.cta1 }}</a>
            <a href="#contact" class="btn btn-outline btn-lg">{{ t.hero.cta2 }} →</a>
          </div>
        </div>
      </section>

      <!-- Demos -->
      <section id="demos" class="demos-section">
        <div class="container demos-inner">
          <span class="section-badge">✨ {{ t.demos.badge }}</span>
          <h2 class="section-h2">{{ t.demos.title }}</h2>
          <p class="section-subhead">{{ t.demos.subtitle }}</p>

          <div class="tabs">
            <div class="tab-list">
              <button
                :class="{ active: activeTab === 'rag' }"
                @click="activeTab = 'rag'"
              >📄 {{ t.demos.tabs.rag }}</button>
              <button
                :class="{ active: activeTab === 'sql' }"
                @click="activeTab = 'sql'"
              >🗄️ {{ t.demos.tabs.sql }}</button>
              <button
                :class="{ active: activeTab === 'combined' }"
                @click="activeTab = 'combined'"
              >🔀 {{ t.demos.tabs.combined }}</button>
            </div>
            <div class="tab-content">
              <AgentDemo :mode="activeTab" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="brand-icon">🦀</span>
          <span class="brand-name">crab<span class="brand-accent">AI</span></span>
        </div>
        <p class="footer-tagline">{{ t.footer.tagline }}</p>
        <p class="footer-copy">{{ t.footer.copyright }}</p>
        <p class="footer-built">{{ t.footer.builtWith }}</p>
      </div>
    </footer>
  </div>
</template>

<style>
:root {
  --bg: oklch(0.995 0.003 240);
  --fg: oklch(0.18 0.012 240);
  --card: white;
  --muted: oklch(0.45 0.012 240);
  --border: oklch(0.9 0.006 240);
  --accent: oklch(0.52 0.16 162);
  --accent-bg: oklch(0.52 0.16 162 / 0.1);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.5;
}
.app-root { display: flex; flex-direction: column; min-height: 100vh; }
.container { max-width: 72rem; margin: 0 auto; padding: 0 1rem; }

/* Header */
.site-header {
  position: sticky; top: 0; z-index: 50;
  background: oklch(0.995 0.003 240 / 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 4rem;
}
.brand { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--fg); }
.brand-icon { font-size: 1.25rem; }
.brand-name { font-size: 1rem; font-weight: 600; }
.brand-accent { color: var(--accent); }
.nav-desktop { display: none; gap: 1.5rem; }
.nav-desktop a { font-size: 0.875rem; color: var(--muted); text-decoration: none; }
.nav-desktop a:hover { color: var(--fg); }
.header-actions { display: flex; align-items: center; gap: 0.5rem; }
.lang-toggle {
  display: flex; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.125rem; font-size: 0.75rem;
}
.lang-toggle button {
  border: none; background: transparent; cursor: pointer;
  padding: 0.25rem 0.5rem; border-radius: 0.25rem; color: var(--muted);
  font-size: 0.75rem; font-weight: 500;
}
.lang-toggle button.active { background: var(--accent); color: white; }

.btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: 0.375rem;
  font-size: 0.875rem; font-weight: 500; text-decoration: none;
  border: 1px solid transparent; cursor: pointer;
}
.btn-ghost { background: transparent; color: var(--fg); }
.btn-ghost:hover { background: oklch(0.96 0.005 240); }
.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover { background: oklch(0.48 0.15 162); }
.btn-outline { background: white; border-color: var(--border); color: var(--fg); }
.btn-outline:hover { background: oklch(0.96 0.005 240); }
.btn-lg { padding: 0.625rem 1.5rem; font-size: 0.95rem; }

@media (min-width: 768px) {
  .nav-desktop { display: flex; }
}

/* Hero */
.hero { padding: 5rem 0 6rem; text-align: center; position: relative; }
.hero-inner { max-width: 48rem; margin: 0 auto; }
.status-badge {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.25rem 0.75rem; border-radius: 9999px;
  border: 1px solid oklch(0.52 0.16 162 / 0.4);
  background: var(--accent-bg); color: var(--accent);
  font-size: 0.75rem; font-weight: 500; margin-bottom: 1.5rem;
}
.status-badge::before { content: "●"; }
.hero-h1 { font-size: 2.5rem; line-height: 1.1; font-weight: 700; margin: 0 0 1.5rem; }
.gradient {
  background: linear-gradient(to right, oklch(0.18 0.012 240), oklch(0.52 0.16 162));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-subhead { font-size: 1.125rem; color: var(--muted); margin: 0 0 2rem; max-width: 36rem; margin-left: auto; margin-right: auto; }
.hero-cta { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
@media (min-width: 640px) { .hero-h1 { font-size: 3.75rem; } }

/* Demos section */
.demos-section {
  padding: 5rem 0;
  background: oklch(0.97 0.005 240);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.demos-inner { max-width: 48rem; margin: 0 auto; text-align: center; }
.section-badge {
  display: inline-block; padding: 0.25rem 0.625rem; border-radius: 9999px;
  border: 1px solid oklch(0.52 0.16 162 / 0.4); color: var(--accent);
  font-size: 0.75rem; font-weight: 500; margin-bottom: 0.75rem;
}
.section-h2 { font-size: 1.875rem; font-weight: 700; margin: 0 0 1rem; }
.section-subhead { color: var(--muted); margin: 0 0 2rem; font-size: 0.875rem; }

.tabs { text-align: left; }
.tab-list {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem;
  background: oklch(0.92 0.005 240); padding: 0.25rem; border-radius: 0.5rem;
}
.tab-list button {
  padding: 0.5rem 0.75rem; border: none; background: transparent;
  border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer;
  color: var(--muted);
}
.tab-list button.active {
  background: white; color: var(--fg); box-shadow: 0 1px 2px oklch(0 0 0 / 0.1);
}
.tab-content { margin-top: 1.5rem; }

/* Footer */
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: var(--bg);
  padding: 2.5rem 0;
}
.footer-inner { text-align: center; }
.footer-brand { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.footer-tagline { font-size: 0.75rem; color: var(--muted); margin: 0 0 1.5rem; max-width: 32rem; margin-left: auto; margin-right: auto; }
.footer-copy { font-size: 0.75rem; color: var(--muted); margin: 0 0 0.25rem; }
.footer-built { font-size: 0.625rem; color: var(--muted); margin: 0; }
</style>
