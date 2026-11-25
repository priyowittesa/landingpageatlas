"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tr } from "../../components/Tr";
import type { EpiAction } from "../../store/actions-store";
import { SIGNAL_MODULES, type Signal } from "../signals";
import { KIND_CHIP, KIND_STYLE, LEVEL_STYLE, TAG_STYLE } from "./signal-style";

export function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", className)}>
      {children}
    </span>
  );
}

export function KindChip({ kind }: { kind: Signal["kind"] }) {
  const { Icon, label } = KIND_STYLE[kind];
  return (
    <Chip className={KIND_CHIP[kind]}>
      <Icon size={12} aria-hidden />
      <Tr>{kind === "insight" ? "Insight" : kind === "recommendation" ? "Recommendation" : "Prediction"}</Tr>
      <span className="sr-only"> ({label})</span>
    </Chip>
  );
}

export function LevelChip({ level }: { level: Signal["level"] }) {
  const { Icon, label, className } = LEVEL_STYLE[level];
  return (
    <Chip className={className}>
      <Icon size={12} aria-hidden />
      <Tr>{label}</Tr>
    </Chip>
  );
}

export function TagChips({ tags }: { tags: Signal["tags"] }) {
  return (
    <>
      {tags.map((tag) => {
        const { Icon, label } = TAG_STYLE[tag];
        return (
          <Chip key={tag} className="bg-gray-50 text-gray-800 ring-gray-200">
            <Icon size={12} aria-hidden />
            <Tr>{label}</Tr>
          </Chip>
        );
      })}
    </>
  );
}

type SignalRowProps = {
  signal: Signal;
  /** The tracked action when someone has already acted on it */
  tracked?: EpiAction;
  onOpen: () => void;
};

/**
 * One signal: kind, module, what is at stake and how bad it is, the headline and two figures.
 * The title is the focusable control that opens the drawer; the whole row is its hit area.
 */
export function SignalRow({ signal, tracked, onOpen }: SignalRowProps) {
  return (
    <li className="group relative rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary-300 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 basis-[18rem]">
          <div className="flex flex-wrap items-center gap-1.5">
            <KindChip kind={signal.kind} />
            <span className="text-xs font-medium text-gray-700">
              <Tr>{SIGNAL_MODULES[signal.module].label}</Tr> · {signal.projectId}
            </span>
            <TagChips tags={signal.tags} />
            <LevelChip level={signal.level} />
            {signal.estimated && (
              <Chip className="bg-primary-50 text-primary-900 ring-primary-200">
                <Tr>ATLAS-estimated</Tr>
              </Chip>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug text-gray-950">
            <button
              type="button"
              onClick={onOpen}
              className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              <Tr>{signal.title}</Tr>
            </button>
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            <Tr>{signal.summary}</Tr>
          </p>
        </div>

        <dl className="flex shrink-0 items-center gap-6">
          {signal.metrics.map((metric) => (
            <div key={metric.label} className="text-right">
              <dt className="text-xs text-gray-600">
                <Tr>{metric.label}</Tr>
              </dt>
              <dd className="text-lg font-semibold tabular-nums text-gray-950">
                <Tr>{metric.value}</Tr>
              </dd>
            </div>
          ))}
        </dl>

        {tracked ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 ring-1 ring-inset ring-green-200">
            <CircleCheck size={16} aria-hidden />
            <Tr>Tracked as</Tr> {tracked.id}
          </span>
        ) : (
          <span
            aria-hidden
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-primary-800"
          >
            <Tr>Take action</Tr>
            <ArrowRight size={16} />
          </span>
        )}
      </div>
    </li>
  );
}
