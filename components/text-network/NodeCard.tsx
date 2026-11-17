"use client";

import { FileText, X } from "lucide-react";
import { strongestNeighbors } from "@/lib/text-network/analytics";
import type { TextGraph } from "@/lib/text-network/types";

// Betweenness / Mentions / Connections stats are hidden for now; flip to re-enable.
const SHOW_STATS = false;

type NodeCardProps = {
  className?: string;
  graph: TextGraph;
  node: string;
  topicWords?: string[];
  sourceLabels?: Record<string, string>;
  onSelect: (id: string) => void;
  onOpenSource?: (sourceId: string) => void;
  onClose: () => void;
};

export function NodeCard({ className, graph, node, topicWords, sourceLabels, onSelect, onOpenSource, onClose }: NodeCardProps) {
  if (!graph.hasNode(node)) return null;
  const { label, color, bc, bcNorm, freq, sources, kind, description } = graph.getNodeAttributes(node);
  const neighbors = strongestNeighbors(graph, node, 12);
  const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1]).find(([id]) => sourceLabels?.[id])?.[0];
  const stats: [string, string][] = [
    ["Betweenness", `${bcNorm.toFixed(2)} (${Math.round(bc)})`],
    [kind !== undefined ? "Mentions" : "Frequency", String(freq)],
    ["Connections", String(graph.degree(node))],
  ];
  return <section className={className} aria-label={`Detail ${label}`}>
    <header className="flex items-start gap-2">
      <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold leading-tight">{label}</h3>
        {kind && <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--tn-muted)]">{kind}</p>}
        {topicWords && <p className="truncate text-xs text-[var(--tn-muted)]">Topic: {topicWords.join(" · ")}</p>}
      </div>
      <button type="button" aria-label="Close details" onClick={onClose} className="rounded-md p-1 text-[var(--tn-muted)] hover:text-[var(--tn-label)]"><X className="size-4" /></button>
    </header>
    {description && <p className="mt-2 line-clamp-3 text-xs text-[var(--tn-muted)]">{description}</p>}
    {SHOW_STATS && <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
      {stats.map(([name, value]) => <div key={name} className="rounded-lg bg-[var(--tn-hover)] px-2 py-1.5"><dt className="text-[10px] text-[var(--tn-muted)]">{name}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}
    </dl>}
    {neighbors.length > 0 && <div className="mt-2 flex flex-wrap gap-1">
      {neighbors.map((neighbor) => <button key={neighbor.id} type="button" title={neighbor.relations.length ? neighbor.relations.join(", ") : undefined} onClick={() => onSelect(neighbor.id)} className="flex items-center gap-1 rounded-full border border-[var(--tn-panel-border)] px-2 py-0.5 text-[11px] hover:bg-[var(--tn-hover)]">
        <span className="size-1.5 rounded-full" style={{ background: neighbor.color }} />{neighbor.label}
      </button>)}
    </div>}
    {topSource && onOpenSource && <button type="button" onClick={() => onOpenSource(topSource)} className="mt-2 flex w-full items-center gap-1.5 truncate rounded-lg border border-[var(--tn-panel-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--tn-hover)]">
      <FileText className="size-3.5 shrink-0" /><span className="truncate">Open {sourceLabels?.[topSource]}</span>
    </button>}
  </section>;
}
