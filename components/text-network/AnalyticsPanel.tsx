"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscourseCondition, GraphAnalytics } from "@/lib/text-network/types";

type AnalyticsPanelProps = {
  className?: string;
  analytics: GraphAnalytics;
  focusCommunity: number | null;
  onFocusCommunity: (community: number | null) => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
};

const CONDITION_HINT: Record<DiscourseCondition, string> = {
  Biased: "A few words dominate and topics blend together.",
  Focused: "Topics are tightly connected around a single theme.",
  Diversified: "Several distinct topics with enough bridges between them.",
  Dispersed: "Topics are fragmented and rarely connected.",
};

const Heading = ({ children }: { children: React.ReactNode }) => <h4 className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--tn-muted)] first:mt-0">{children}</h4>;
const Dot = ({ color }: { color: string }) => <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />;

export function AnalyticsPanel({ className, analytics, focusCommunity, onFocusCommunity, onSelectNode, onClose }: AnalyticsPanelProps) {
  const { topics, topNodes, structure, gaps } = analytics;
  const stats: [string, string][] = [
    ["Node", String(structure.nodes)],
    ["Connections", String(structure.edges)],
    ["Topics", String(structure.topics)],
    ["Modularity", structure.modularity.toFixed(2)],
    ["Top 3 BC concentration", `${Math.round(structure.concentration * 100)}%`],
  ];
  return <section className={className} aria-label="Analytics">
    <header className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Analytics</h3>
      <button type="button" aria-label="Hide analytics" onClick={onClose} className="rounded-md p-1 text-[var(--tn-muted)] hover:text-[var(--tn-label)]"><X className="size-4" /></button>
    </header>

    <Heading>Main topics</Heading>
    <ul className="space-y-1">
      {topics.map((topic) => <li key={topic.community}>
        <button type="button" aria-pressed={focusCommunity === topic.community} onClick={() => onFocusCommunity(focusCommunity === topic.community ? null : topic.community)} className={cn(
          "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[var(--tn-hover)]",
          focusCommunity === topic.community && "bg-[var(--tn-hover)] ring-1 ring-[var(--tn-panel-border)]",
        )}>
          <span className="mt-1"><Dot color={topic.color} /></span>
          <span className="min-w-0 flex-1 leading-snug"><span className="font-medium">{topic.words.join(" · ")}</span></span>
          <span className="tabular-nums text-[var(--tn-muted)]">{Math.round(topic.percent)}%</span>
        </button>
      </li>)}
    </ul>

    <Heading>Most influential nodes</Heading>
    <ul className="space-y-1">
      {topNodes.map((node) => <li key={node.id}>
        <button type="button" onClick={() => onSelectNode(node.id)} className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-[var(--tn-hover)]">
          <span className="flex items-center justify-between gap-2"><span className="truncate font-medium">{node.label}</span><span className="tabular-nums text-[var(--tn-muted)]">{node.bcNorm.toFixed(2)}</span></span>
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[var(--tn-hover)]"><span className="block h-full rounded-full" style={{ width: `${Math.max(4, node.bcNorm * 100)}%`, background: node.color }} /></span>
        </button>
      </li>)}
    </ul>

    <Heading>Structure</Heading>
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {stats.map(([label, value]) => <div key={label} className="contents"><dt className="text-[var(--tn-muted)]">{label}</dt><dd className="text-right font-medium tabular-nums">{value}</dd></div>)}
    </dl>
    <p className="mt-2 rounded-lg bg-[var(--tn-hover)] px-2.5 py-2 text-xs"><span className="font-semibold">Discourse condition: {structure.condition}</span><span className="mt-0.5 block text-[var(--tn-muted)]">{CONDITION_HINT[structure.condition]}</span></p>

    <Heading>Structural gaps</Heading>
    {gaps.length === 0
      ? <p className="text-xs text-[var(--tn-muted)]">Not enough topics (≥ 3 nodes) to compare yet.</p>
      : <ul className="space-y-1.5">
        {gaps.map((gap) => <li key={`${gap.a.community}-${gap.b.community}`} className="rounded-lg border border-[var(--tn-panel-border)] px-2.5 py-2 text-xs">
          {[gap.a, gap.b].map((topic, index) => <button key={topic.community} type="button" onClick={() => onFocusCommunity(topic.community)} className="flex w-full items-center gap-2 text-left hover:underline">
            <Dot color={topic.color} /><span className="truncate">{topic.words.join(" · ")}</span>{index === 0 && <span className="ml-auto shrink-0 text-[var(--tn-muted)]">↔</span>}
          </button>)}
        </li>)}
      </ul>}
  </section>;
}
