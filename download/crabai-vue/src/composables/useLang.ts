import { ref, watchEffect } from "vue";

export type Lang = "en" | "zh";

const STORAGE_KEY = "crabai-lang";
const lang = ref<Lang>(localStorage.getItem(STORAGE_KEY) as Lang ?? "en");

watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, lang.value);
  document.documentElement.lang = lang.value === "zh" ? "zh-CN" : "en";
});

export function useLang() {
  return {
    lang,
    setLang: (l: Lang) => { lang.value = l; },
    toggle: () => { lang.value = lang.value === "en" ? "zh" : "en"; },
  };
}
