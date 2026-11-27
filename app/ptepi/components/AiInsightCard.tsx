"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, MessageSquareText, Sparkles } from "lucide-react";
import { matchQuestion } from "../ask-atlas/questions";
import { INSIGHT_QUESTION, type Insight } from "../operations/insights";
import { Chip, KindChip, LevelChip } from "../operations/components/SignalRow";
import { useNexaChatStore } from "../store/nexa-chat-store";
import { ReasonText } from "./ReasonText";
import { Tr, useT } from "./Tr";

const FALLBACK_TEXT = "I cannot answer that yet. In this prototype I can answer these questions:";

type AiInsightCardProps = {
  insights: Insight[];
  /** Label of the snapshot date, from the data */
  asAtLabel: string;
};

/**
 * What ATLAS found on this screen, set apart so it is noticed: a violet card with a sparkles
 * mark, the most severe insight in full and the others as a short list. Every insight opens its
 * action drawer in Operations Intelligence; Nexa can explain it without leaving the screen.
 * Renders nothing when ATLAS has found nothing, so no screen shows an empty box.
 */
export function AiInsightCard({ insights, asAtLabel }: AiInsightCardProps) {
  const t = useT();
  const setOpen = useNexaChatStore((state) => state.setOpen);
  const ask = useNexaChatStore((state) => state.ask);
  const [top, ...rest] = insights;
  if (!top) return null;

  const askNexa = () => {
    const question = INSIGHT_QUESTION[top.module];
    ask(question, matchQuestion(question), FALLBACK_TEXT);
    setOpen(true);
  };

  return (
    <section
      aria-label={t("AI insight")}
      className="relative overflow-hidden rounded-xl border border-primary-300 bg-background shadow-sm"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent" />
      <div aria-hidden className="relative h-1 w-full bg-gradient-to-r from-primary-700 via-primary-500 to-primary-300" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-white shadow-md shadow-primary-500/25"
        >
          <Sparkles size={20} />
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip className="bg-primary-700 text-white ring-primary-700">
              <Sparkles size={12} aria-hidden />
              <Tr>AI insight</Tr>
            </Chip>
            <Chip className="bg-white text-primary-900 ring-primary-200">
              <Tr>Advisory</Tr>
            </Chip>
            <KindChip kind={top.kind} />
            <LevelChip level={top.level} />
            {top.estimated && (
              <Chip className="bg-primary-50 text-primary-900 ring-primary-200">
                <Tr>ATLAS-estimated</Tr>
              </Chip>
            )}
            <span className="ml-auto text-xs text-gray-700">
              <Tr>Demo snapshot as at</Tr> {asAtLabel}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-semibold leading-snug text-gray-950">
              <Tr>{top.title}</Tr>
            </h2>
            <ReasonText text={top.summary} limit={5} className="mt-1 max-w-4xl text-sm leading-relaxed text-gray-800" />
          </div>

          {rest.length > 0 && (
            <ul className="divide-y divide-primary-100 overflow-hidden rounded-lg border border-primary-100 bg-white">
              {rest.map((insight) => (
                <li key={insight.id}>
                  <Link
                    href={`/ptepi/actions?signal=${insight.id}`}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-900 transition-colors hover:bg-primary-50 focus-visible:bg-primary-50 focus-visible:outline-none"
                  >
                    <LevelChip level={insight.level} />
                    <span className="min-w-0 flex-1">
                      <Tr>{insight.title}</Tr>
                    </span>
                    <ChevronRight size={16} aria-hidden className="shrink-0 text-gray-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <Link
              href={`/ptepi/actions?signal=${top.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
            >
              <Tr>Take action</Tr>
              <ArrowRight size={16} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={askNexa}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3.5 py-2 text-sm font-medium text-primary-900 transition-colors hover:bg-primary-50"
            >
              <MessageSquareText size={16} aria-hidden />
              <Tr>Ask Nexa about this</Tr>
            </button>
            <Link href="/ptepi/actions" className="text-sm font-medium text-primary-800 hover:underline">
              <Tr>All signals in Operations Intelligence</Tr>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
