"use client";

import { translate } from "../i18n";
import { useLanguageStore } from "../store/language-store";

/** Translator for client components: t("Portfolio health"). */
export function useT(): (text: string) => string {
  const language = useLanguageStore((state) => state.language);
  return (text: string) => translate(text, language);
}

/**
 * Interface text in the chosen language. Usable inside server components, so a
 * page passes plain English strings and the visitor sees English or Bahasa Indonesia.
 */
export function Tr({ children }: { children: string }) {
  const t = useT();
  return <>{t(children)}</>;
}
