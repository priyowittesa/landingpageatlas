"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "./Tr";
import { useLanguageStore, type Language } from "../store/language-store";

const OPTIONS: { value: Language; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "id", label: "ID", name: "Bahasa Indonesia" }
];

/** English / Bahasa Indonesia toggle for the interface text. */
export function LanguageSwitch() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = useT();
  return (
    <div className="flex items-center gap-1.5">
      <Languages size={16} className="hidden text-muted-foreground sm:block" aria-hidden />
      <div role="radiogroup" aria-label={t("Language")} className="flex rounded-lg border border-primary-100 bg-primary-50 p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={language === option.value}
            aria-label={option.name}
            title={option.name}
            onClick={() => setLanguage(option.value)}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-semibold transition-colors",
              language === option.value
                ? "bg-white text-primary-800 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
