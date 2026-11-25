"use client";

import { BookOpenText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSARY, GLOSSARY_KEYS, glossaryKeyOf } from "../glossary";
import { useLanguageStore } from "../store/language-store";
import { useT } from "./Tr";

/**
 * A label with an Indonesian contract term (Tagihan, Taksasi, Retensi, Termin, Pelunasan,
 * BAST): dotted underline and a tooltip with its meaning. Other labels render as plain text.
 */
export function GlossaryTerm({ children }: { children: string }) {
  const language = useLanguageStore((state) => state.language);
  const t = useT();
  const key = glossaryKeyOf(children);
  const text = t(children);
  if (!key) return <>{text}</>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="cursor-help rounded-sm text-left underline decoration-primary-400 decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            aria-label={`${text}: ${GLOSSARY[key][language]}`}
          >
            {text}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold">{key}</p>
          <p>{GLOSSARY[key][language]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Top-bar glossary of the Indonesian contract terms. */
export function GlossaryButton() {
  const language = useLanguageStore((state) => state.language);
  const t = useT();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-gray-800 hover:bg-primary-50"
          aria-label={t("Glossary")}
        >
          <BookOpenText size={16} aria-hidden className="text-primary-700" />
          <span className="hidden xl:inline">{t("Glossary")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">{t("Glossary of contract terms")}</p>
        <dl className="max-h-96 divide-y divide-border overflow-y-auto">
          {GLOSSARY_KEYS.map((key) => (
            <div key={key} className="px-4 py-2.5">
              <dt className="text-sm font-semibold text-primary-900">{key}</dt>
              <dd className="text-xs leading-5 text-gray-700">{GLOSSARY[key][language]}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
