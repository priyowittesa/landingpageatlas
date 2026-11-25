"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, ListFilter, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionsBoard } from "../../components/ActionsBoard";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { Tr, useT } from "../../components/Tr";
import { useActionsStore, type EpiAction } from "../../store/actions-store";
import {
  SIGNAL_MODULES,
  countByKind,
  filterSignals,
  trackedActionOf,
  type Signal,
  type SignalKind,
  type SignalModule
} from "../signals";
import { SignalDrawer } from "./SignalDrawer";
import { SignalRow } from "./SignalRow";
import { KIND_STYLE, TAG_STYLE } from "./signal-style";

type Tab = "open" | "actioned" | "tracker";

type OperationsBoardProps = {
  signals: Signal[];
  seeds: EpiAction[];
  asAt: string;
  asAtLabel: string;
  projectOptions: string[];
};

const KINDS: (SignalKind | "all")[] = ["all", "insight", "recommendation", "prediction"];

/**
 * Operations Intelligence: the one screen of what to look at and what to do. The four figures
 * on top filter the list; a signal opens a drawer with the evidence and the action to take.
 */
export function OperationsBoard({ signals, seeds, asAt, asAtLabel, projectOptions }: OperationsBoardProps) {
  const t = useT();
  const actions = useActionsStore((state) => state.actions);
  const seed = useActionsStore((state) => state.seed);
  const [kind, setKind] = useState<SignalKind | "all">("all");
  const [module, setModule] = useState<SignalModule | "all">("all");
  const [tab, setTab] = useState<Tab>("open");
  // An insight on another screen links here with ?signal=<id>, which opens that signal; the reader
  // opening or closing a drawer takes over from the link.
  const linked = useSearchParams().get("signal");
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const selectedId = picked === undefined ? linked : picked;
  const setSelectedId = setPicked;

  // The seeded exceptions are tracked from the start, so signals about them read as actioned.
  useEffect(() => seed(seeds), [seed, seeds]);

  const tracked = useMemo(() => new Map(signals.map((signal) => [signal.id, trackedActionOf(signal, actions)])), [signals, actions]);
  const open = signals.filter((signal) => !tracked.get(signal.id));
  const actioned = signals.filter((signal) => tracked.get(signal.id));

  const inTab = tab === "actioned" ? actioned : open;
  const byModule = filterSignals(inTab, { kind: "all", module });
  const counts = countByKind(byModule);
  const rows = filterSignals(inTab, { kind, module });
  const moduleCount = new Set(byModule.map((signal) => signal.module)).size;
  const selected = signals.find((signal) => signal.id === selectedId) ?? null;
  const filtered = kind !== "all" || module !== "all";

  const reset = () => {
    setKind("all");
    setModule("all");
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <h1 className="flex items-center gap-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              <Sparkles size={28} aria-hidden className="shrink-0 text-primary-200" />
              <Tr>Operations Intelligence</Tr>
            </h1>
            <p className="mt-3 text-sm leading-6 text-primary-100 sm:text-base">
              <Tr>ATLAS reads every module and turns what it finds into insights, recommendations and predictions. Pick one to see the evidence and take action. People decide; nothing runs on its own.</Tr>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
              <Sparkles size={14} aria-hidden />
              <Tr>AI-generated</Tr>
            </span>
            <SyntheticDataBadge />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
              <CalendarClock size={14} aria-hidden />
              <Tr>Demo snapshot as at</Tr> {asAtLabel}
            </span>
          </div>
        </div>

        <ul className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("Filter by kind of signal")}>
          {KINDS.map((item) => {
            const { Icon, label, caption } = KIND_STYLE[item];
            const active = kind === item;
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(active && item !== "all" ? "all" : item)}
                  className={cn(
                    "flex h-full w-full cursor-pointer flex-col rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white",
                    active ? "border-white bg-white text-gray-950 shadow-md" : "border-white/20 bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon size={16} aria-hidden className={active ? "text-primary-700" : "text-primary-200"} />
                    <Tr>{label}</Tr>
                  </span>
                  <span className="mt-2 text-4xl font-bold leading-none tabular-nums">{counts[item]}</span>
                  <span className={cn("mt-1.5 text-sm", active ? "text-gray-700" : "text-primary-100")}>
                    {item === "all" ? (
                      <>
                        <Tr>across</Tr> {moduleCount} <Tr>modules</Tr>
                      </>
                    ) : (
                      <Tr>{caption}</Tr>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="signal-module" className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
            <ListFilter size={16} aria-hidden className="text-primary-700" />
            <Tr>Module</Tr>
          </label>
          <select
            id="signal-module"
            value={module}
            onChange={(event) => setModule(event.target.value as SignalModule | "all")}
            className="h-10 cursor-pointer rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <option value="all">{t("All modules")}</option>
            {(Object.keys(SIGNAL_MODULES) as SignalModule[]).map((id) => (
              <option key={id} value={id}>
                {t(SIGNAL_MODULES[id].label)}
              </option>
            ))}
          </select>

          <div role="tablist" aria-label={t("Signal status")} className="flex rounded-lg border border-border bg-background p-0.5">
            {(
              [
                { id: "open", label: "Open", count: open.length },
                { id: "actioned", label: "Actioned", count: actioned.length },
                { id: "tracker", label: "Action tracker", count: actions.filter((action) => action.status !== "done").length }
              ] as { id: Tab; label: string; count: number }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-400",
                  tab === item.id ? "bg-primary-700 text-white" : "text-gray-800 hover:bg-primary-50"
                )}
              >
                <Tr>{item.label}</Tr> ({item.count})
              </button>
            ))}
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-700" aria-label={t("Value tags")}>
          <li className="font-medium"><Tr>Value tags</Tr>:</li>
          {(Object.keys(TAG_STYLE) as (keyof typeof TAG_STYLE)[]).map((tag) => {
            const { Icon, label, meaning } = TAG_STYLE[tag];
            return (
              <li key={tag} className="inline-flex items-center gap-1.5">
                <Icon size={12} aria-hidden className="text-primary-700" />
                <span className="font-semibold"><Tr>{label}</Tr></span>
                <span><Tr>{meaning}</Tr></span>
              </li>
            );
          })}
        </ul>
      </div>

      {tab === "tracker" ? (
        <ActionsBoard seeds={seeds} asAt={asAt} projectOptions={projectOptions} />
      ) : rows.length > 0 ? (
        <ul className="space-y-3" aria-label={t(tab === "open" ? "Open signals" : "Actioned signals")}>
          {rows.map((signal) => (
            <SignalRow key={signal.id} signal={signal} tracked={tracked.get(signal.id)} onOpen={() => setSelectedId(signal.id)} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50/40 px-6 py-10 text-center">
          <p className="text-sm text-gray-800">
            <Tr>{filtered ? "No signal matches these filters." : tab === "open" ? "Every signal has an action." : "No signal has an action yet."}</Tr>
          </p>
          {filtered && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-50"
            >
              <RotateCcw size={14} aria-hidden />
              <Tr>Clear filters</Tr>
            </button>
          )}
        </div>
      )}

      <SignalDrawer
        signal={selected}
        tracked={selected ? tracked.get(selected.id) : undefined}
        onClose={() => setSelectedId(null)}
        onOpenTracker={() => setTab("tracker")}
      />
    </div>
  );
}
