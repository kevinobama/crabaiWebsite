<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { api, type AgentResult, type Source } from "@/lib/api";
import { useLang } from "@/composables/useLang";
import { STRINGS } from "@/lib/strings";

type Mode = "rag" | "sql" | "combined";

const props = defineProps<{ mode: Mode }>();

const { lang } = useLang();
const t = computed(() => STRINGS[lang.value].agent);

const question = ref("");
const loading = ref(false);
const result = ref<AgentResult | null>(null);
const history = ref<{ q: string; r: AgentResult }[]>([]);
const sqlOpen = ref(false);
const scrollEl = ref<HTMLDivElement | null>(null);

const Icon = computed(() => {
  if (props.mode === "rag") return "📄";
  if (props.mode === "sql") return "🗄️";
  return "🔀";
});

const endpoint = computed(() => {
  if (props.mode === "rag") return api.rag;
  if (props.mode === "sql") return api.sql;
  return api.combined;
});

const samples = computed(() => {
  if (props.mode === "rag") return t.value.samplesRag;
  if (props.mode === "sql") return t.value.samplesSql;
  return t.value.samplesCombined;
});

const placeholder = computed(() => {
  if (props.mode === "rag") return t.value.placeholderRag;
  if (props.mode === "sql") return t.value.placeholderSql;
  return t.value.placeholderCombined;
});

const loadingText = computed(() => {
  if (props.mode === "rag") return t.value.loadingRag;
  if (props.mode === "sql") return t.value.loadingSql;
  return t.value.loadingCombined;
});

const desc = computed(() => {
  if (props.mode === "rag") return t.value.descRag;
  if (props.mode === "sql") return t.value.descSql;
  return t.value.descCombined;
});

const title = computed(() => {
  if (props.mode === "rag") return t.value.rag;
  if (props.mode === "sql") return t.value.sql;
  return t.value.combined;
});

const sources = computed<Source[]>(() => result.value?.sources || result.value?.rag_sources || []);

async function ask(q: string) {
  if (!q.trim() || loading.value) return;
  loading.value = true;
  result.value = null;
  try {
    const r = await endpoint.value(q, lang.value);
    result.value = r;
    history.value = [...history.value, { q, r }].slice(-3);
  } catch {
    result.value = { answer: t.value.networkError };
  } finally {
    loading.value = false;
    await nextTick();
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: "smooth" });
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    ask(question.value);
  }
}

watch(() => props.mode, () => {
  result.value = null;
  history.value = [];
  question.value = "";
});
</script>

<template>
  <div class="card">
    <header class="card-header">
      <div class="card-header-left">
        <div class="icon-badge">{{ Icon }}</div>
        <div>
          <h3 class="card-title">
            {{ title }}
            <span class="live-badge">{{ t.live }}</span>
          </h3>
          <p class="card-desc">{{ desc }}</p>
        </div>
      </div>
      <div class="card-header-right">
        <span v-if="mode === 'rag'">📄 {{ t.indexed }}</span>
        <span v-else-if="mode === 'sql'">🗄️ {{ t.schema }}</span>
        <span v-else>🔀 RAG + SQL</span>
      </div>
    </header>

    <div ref="scrollEl" class="chat-area">
      <div v-if="!result && !loading && history.length === 0" class="empty-state">
        <div class="empty-icon">{{ Icon }}</div>
        <p class="empty-title">{{ t.emptyTitle }}</p>
        <p class="empty-desc">{{ t.emptyDesc }}</p>
      </div>

      <div v-for="(h, i) in history" :key="i" class="history-item">
        <div class="bubble user-bubble">{{ h.q }}</div>
        <div class="answer-block">
          <div class="answer-text">⚠️ {{ h.r.answer.slice(0, 200) }}{{ h.r.answer.length > 200 ? "…" : "" }}</div>
        </div>
      </div>

      <div v-if="loading" class="loading-bubble">
        <span class="spinner" />
        {{ loadingText }}
      </div>

      <div v-if="result && !loading" class="result-block">
        <div class="answer-block">
          <div class="answer-text">{{ result.answer }}</div>
        </div>

        <div v-if="result.route" class="route-badge">
          {{ t.route }} {{ result.route }}
        </div>

        <details v-if="result.sql" class="sql-collapsible">
          <summary>{{ t.showSql }} ▾</summary>
          <pre class="sql-code">{{ result.sql }}</pre>
        </details>

        <div v-if="result.columns && result.rows?.length" class="table-wrap">
          <div class="table-header">📊 {{ result.rows.length }} rows</div>
          <table>
            <thead>
              <tr><th v-for="c in result.columns" :key="c">{{ c }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in result.rows" :key="i">
                <td v-for="(c, j) in result.columns" :key="c">{{ row[j] }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="sources.length" class="sources">
          <div class="sources-label">📎 {{ t.sources }}</div>
          <div v-for="(s, i) in sources" :key="i" class="source-card">
            <div class="source-title">
              📄 {{ s.document }} <span v-if="s.page !== undefined">· p. {{ s.page }}</span>
            </div>
            <p class="source-content">{{ s.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="history.length === 0 && !result" class="samples">
      <button v-for="s in samples" :key="s" @click="question = s" class="sample-chip">
        {{ s }}
      </button>
    </div>

    <div class="input-area">
      <div class="input-row">
        <textarea
          v-model="question"
          :placeholder="placeholder"
          :disabled="loading"
          rows="2"
          @keydown="onKeydown"
        />
        <button
          @click="ask(question)"
          :disabled="loading || !question.trim()"
          class="send-btn"
        >
          ➤
        </button>
      </div>
      <p class="helper-text">{{ t.helper }}</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid oklch(0.9 0.006 240);
  border-radius: 0.75rem;
  background: white;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid oklch(0.9 0.006 240);
  background: oklch(0.52 0.16 162 / 0.05);
}
.card-header-left { display: flex; gap: 0.75rem; align-items: flex-start; }
.card-header-right { font-size: 0.75rem; color: oklch(0.45 0.012 240); }
.icon-badge {
  width: 2.5rem; height: 2.5rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 0.5rem;
  background: oklch(0.52 0.16 162 / 0.15);
  border: 1px solid oklch(0.52 0.16 162 / 0.3);
  font-size: 1.25rem;
}
.card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.live-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border: 1px solid oklch(0.52 0.16 162 / 0.4);
  border-radius: 0.25rem;
  color: oklch(0.52 0.16 162);
  font-weight: 400;
}
.card-desc { margin: 0; font-size: 0.75rem; color: oklch(0.45 0.012 240); }
.chat-area {
  max-height: 28rem;
  min-height: 18rem;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.empty-state {
  text-align: center;
  padding: 2.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.empty-icon { font-size: 2rem; }
.empty-title { font-weight: 500; font-size: 0.875rem; margin: 0; }
.empty-desc { font-size: 0.75rem; color: oklch(0.45 0.012 240); margin: 0; }
.bubble {
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
}
.user-bubble {
  background: oklch(0.52 0.16 162);
  color: white;
  align-self: flex-end;
  max-width: 85%;
}
.answer-block {
  background: oklch(0.96 0.005 240);
  border: 1px solid oklch(0.52 0.16 162 / 0.2);
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  white-space: pre-wrap;
}
.loading-bubble {
  background: oklch(0.96 0.005 240);
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: oklch(0.45 0.012 240);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.spinner {
  width: 0.875rem; height: 0.875rem;
  border: 2px solid oklch(0.85 0.01 240);
  border-top-color: oklch(0.52 0.16 162);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.result-block { display: flex; flex-direction: column; gap: 0.5rem; }
.route-badge {
  align-self: flex-end;
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  background: oklch(0.96 0.005 240);
  border-radius: 0.25rem;
}
.sql-collapsible { font-size: 0.875rem; }
.sql-collapsible summary { cursor: pointer; color: oklch(0.45 0.012 240); padding: 0.25rem 0; }
.sql-code {
  background: oklch(0.99 0.003 240);
  border: 1px solid oklch(0.9 0.006 240);
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 0.25rem 0 0;
}
.table-wrap { border: 1px solid oklch(0.9 0.006 240); border-radius: 0.375rem; overflow: hidden; }
.table-header {
  padding: 0.375rem 0.75rem;
  font-size: 0.625rem;
  text-transform: uppercase;
  color: oklch(0.45 0.012 240);
  background: oklch(0.96 0.005 240);
  border-bottom: 1px solid oklch(0.9 0.006 240);
}
table { width: 100%; font-size: 0.75rem; border-collapse: collapse; }
th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid oklch(0.92 0.005 240); }
th { color: oklch(0.45 0.012 240); font-weight: 500; background: oklch(0.96 0.005 240); }
.sources { border: 1px solid oklch(0.9 0.006 240); border-radius: 0.375rem; padding: 0.75rem; background: oklch(0.99 0.003 240); }
.sources-label { font-size: 0.625rem; text-transform: uppercase; color: oklch(0.45 0.012 240); margin-bottom: 0.5rem; }
.source-card { padding: 0.5rem; border: 1px solid oklch(0.9 0.006 240); border-radius: 0.25rem; background: white; margin-bottom: 0.5rem; }
.source-card:last-child { margin-bottom: 0; }
.source-title { font-size: 0.75rem; font-weight: 500; color: oklch(0.52 0.16 162); margin-bottom: 0.25rem; }
.source-content { font-size: 0.6875rem; color: oklch(0.45 0.012 240); margin: 0; line-height: 1.5; }
.samples { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0 1rem 0.75rem; }
.sample-chip {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border: 1px solid oklch(0.9 0.006 240);
  border-radius: 9999px;
  background: white;
  color: oklch(0.45 0.012 240);
  cursor: pointer;
  transition: all 0.15s;
}
.sample-chip:hover {
  border-color: oklch(0.52 0.16 162 / 0.4);
  color: oklch(0.18 0.012 240);
}
.input-area { border-top: 1px solid oklch(0.9 0.006 240); padding: 1rem; }
.input-row { display: flex; gap: 0.5rem; align-items: flex-end; }
textarea {
  flex: 1;
  resize: none;
  padding: 0.5rem 0.625rem;
  border: 1px solid oklch(0.9 0.006 240);
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 0.875rem;
  background: white;
}
textarea:focus { outline: none; border-color: oklch(0.52 0.16 162); }
.send-btn {
  width: 2.5rem; height: 2.5rem;
  border: none;
  border-radius: 0.375rem;
  background: oklch(0.52 0.16 162);
  color: white;
  cursor: pointer;
  font-size: 1rem;
}
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.send-btn:not(:disabled):hover { background: oklch(0.48 0.15 162); }
.helper-text { margin: 0.5rem 0 0; font-size: 0.6875rem; color: oklch(0.45 0.012 240); }
</style>
