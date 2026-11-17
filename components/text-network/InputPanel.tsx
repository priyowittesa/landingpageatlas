"use client";

import { RefreshCw, RotateCcw, Spline, Sparkles, Waypoints, X } from "lucide-react";
import { cn } from "@/lib/utils";

type InputPanelProps = {
  className?: string;
  draft: string;
  isCustom: boolean;
  maxNodes: number;
  curved: boolean;
  animate: boolean;
  onDraftChange: (value: string) => void;
  onBuild: () => void;
  onResetDefault: () => void;
  onRelayout: () => void;
  onCurvedChange: (value: boolean) => void;
  onAnimateChange: (value: boolean) => void;
  onMaxNodesChange: (value: number) => void;
  onClose: () => void;
};

function Toggle({ pressed, onChange, icon, label }: { pressed: boolean; onChange: (value: boolean) => void; icon: React.ReactNode; label: string }) {
  return <button type="button" aria-pressed={pressed} onClick={() => onChange(!pressed)} className={cn(
    "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
    pressed ? "border-transparent bg-[var(--tn-accent)] text-white" : "border-[var(--tn-panel-border)] text-[var(--tn-muted)] hover:text-[var(--tn-label)]",
  )}>{icon}{label}</button>;
}

export function InputPanel(props: InputPanelProps) {
  const { className, draft, isCustom, maxNodes, curved, animate } = props;
  return <section className={className} aria-label="Source text">
    <header className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold">Source text</h3>
      <button type="button" aria-label="Hide text panel" onClick={props.onClose} className="rounded-md p-1 text-[var(--tn-muted)] hover:text-[var(--tn-label)]"><X className="size-4" /></button>
    </header>
    <textarea
      value={draft}
      onChange={(event) => props.onDraftChange(event.target.value)}
      placeholder="Paste text here. Each line is processed separately."
      spellCheck={false}
      className="h-44 w-full resize-y rounded-lg border border-[var(--tn-panel-border)] bg-transparent p-2.5 text-xs leading-relaxed outline-none placeholder:text-[var(--tn-muted)] focus:border-[var(--tn-accent)]"
    />
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" onClick={props.onBuild} className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--tn-accent)] px-3 text-xs font-semibold text-white hover:opacity-90"><Waypoints className="size-3.5" />Build graph</button>
      <button type="button" onClick={props.onRelayout} className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--tn-panel-border)] px-2.5 text-xs font-medium hover:bg-[var(--tn-hover)]"><RefreshCw className="size-3.5" />Re-layout</button>
      {isCustom && <button type="button" onClick={props.onResetDefault} className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--tn-panel-border)] px-2.5 text-xs font-medium hover:bg-[var(--tn-hover)]"><RotateCcw className="size-3.5" />Use folder data</button>}
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      <Toggle pressed={curved} onChange={props.onCurvedChange} icon={<Spline className="size-3.5" />} label="Curved lines" />
      <Toggle pressed={animate} onChange={props.onAnimateChange} icon={<Sparkles className="size-3.5" />} label="Animation" />
    </div>
    <label className="mt-3 block text-xs text-[var(--tn-muted)]">
      <span className="flex justify-between"><span>Max nodes</span><span className="font-semibold text-[var(--tn-label)] tabular-nums">{maxNodes}</span></span>
      <input type="range" min={20} max={250} step={5} value={maxNodes} onChange={(event) => props.onMaxNodesChange(Number(event.target.value))} className="mt-1 w-full accent-[var(--tn-accent)]" />
    </label>
  </section>;
}
