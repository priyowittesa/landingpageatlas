"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { BarChart3, Box, LoaderCircle, Search, Shapes, Square, TextCursorInput, Type } from "lucide-react";
import { analyzeGraph } from "@/lib/text-network/analytics";
import { buildGraph, DEFAULT_MAX_NODES, layoutGraph } from "@/lib/text-network/buildGraph";
import type { BuildGraphOptions, TextGraph, TextLine } from "@/lib/text-network/types";
import { cn } from "@/lib/utils";
import { AnalyticsPanel } from "./AnalyticsPanel";
import type { GraphControls } from "./Graph2D";
import { InputPanel } from "./InputPanel";
import { createInteractionStore } from "./interaction";
import { NodeCard } from "./NodeCard";
import { readCanvasTheme, type CanvasTheme } from "./theme";

const GraphLoading = () => <div className="absolute inset-0 flex items-center justify-center text-[var(--tn-muted)]"><LoaderCircle className="size-5 animate-spin" /></div>;
const Graph2D = dynamic(() => import("./Graph2D"), { ssr: false, loading: GraphLoading });
// Only fetched the first time the user switches to 3D.
const Graph3D = dynamic(() => import("./Graph3D"), { ssr: false, loading: GraphLoading });
// Analytics panel is hidden for now; flip to re-enable.
const SHOW_ANALYTICS = false;

export type TextNetworkProps = {
  /** Initial text, optionally tagged per line with a source id. */
  defaultLines: TextLine[];
  /**
   * Optional structured graph for the default data (e.g. entities and relations). When given it is
   * shown by default, with a toggle to fall back to the word network of `defaultLines`.
   */
  buildDefaultGraph?: (options: BuildGraphOptions) => TextGraph;
  /** Display names for source ids (shown on the node card). */
  sourceLabels?: Record<string, string>;
  onOpenSource?: (sourceId: string) => void;
  emptyState?: ReactNode;
  /** Select and zoom to the node that best represents a source; a new `token` repeats the request. */
  focusSource?: { id: string; label?: string; token: number };
};

/** Node whose label matches the source name, else the node mentioned most often in that source. */
function nodeForSource(graph: TextGraph, sourceId: string, label?: string) {
  const name = label?.trim().toLowerCase();
  const byName = name ? graph.findNode((_node, attributes) => attributes.label.toLowerCase() === name) : undefined;
  if (byName) return byName;
  const candidates = graph.filterNodes((_node, attributes) => (attributes.sources[sourceId] ?? 0) > 0);
  const score = (node: string) => graph.getNodeAttribute(node, "sources")[sourceId] ?? 0;
  return candidates.sort((a, b) => score(b) - score(a) || graph.getNodeAttribute(b, "bc") - graph.getNodeAttribute(a, "bc"))[0] ?? null;
}

const COMPACT_WIDTH = 760;
/** The 3D view is hidden for now; flip to bring the 2D/3D toggle back. */
const SHOW_3D = false;
const linesToText = (lines: TextLine[]) => lines.map((line) => line.text).join("\n");

export function TextNetwork({ defaultLines, buildDefaultGraph, sourceLabels, onOpenSource, emptyState, focusSource }: TextNetworkProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controls2D = useRef<GraphControls | null>(null), controls3D = useRef<GraphControls | null>(null);
  const [store] = useState(createInteractionStore);
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<CanvasTheme>(() => readCanvasTheme(null));

  const [draft, setDraft] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string | null>(null);
  const [maxNodes, setMaxNodes] = useState(DEFAULT_MAX_NODES), [appliedMaxNodes, setAppliedMaxNodes] = useState(DEFAULT_MAX_NODES);
  const [curved, setCurved] = useState(true), [animate, setAnimate] = useState(true);
  const [mode, setMode] = useState<"2d" | "3d">("2d"), [has3D, setHas3D] = useState(false);
  const [introToken, setIntroToken] = useState(0), [seed, setSeed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null), [focusCommunity, setFocusCommunity] = useState<number | null>(null);
  const [compact, setCompact] = useState(false);
  const [panels, setPanels] = useState<{ input: boolean; analytics: boolean } | null>(null);
  const [query, setQuery] = useState(""), [notFound, setNotFound] = useState(false);

  const [view, setView] = useState<"entities" | "words">("entities");

  const input = customInput ?? defaultLines;
  const showEntities = Boolean(buildDefaultGraph) && customInput === null && view === "entities";
  const graph = useMemo(
    () => (showEntities && buildDefaultGraph ? buildDefaultGraph({ maxNodes: appliedMaxNodes }) : buildGraph(input, { maxNodes: appliedMaxNodes })),
    [showEntities, buildDefaultGraph, input, appliedMaxNodes],
  );
  const analytics = useMemo(() => analyzeGraph(graph), [graph]);
  const visible = panels ?? { input: false, analytics: false };

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedMaxNodes(maxNodes), 250);
    return () => window.clearTimeout(timer);
  }, [maxNodes]);

  // A new graph invalidates the previous selection.
  useEffect(() => { store.set({ hovered: null, selected: null, focusCommunity: null }); }, [graph, store]);

  useEffect(() => store.subscribe((state, changed) => {
    if (changed.includes("selected")) setSelected(state.selected);
    if (changed.includes("focusCommunity")) setFocusCommunity(state.focusCommunity);
  }), [store]);

  // The theme class is applied by next-themes before the next frame; read the CSS variables after it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTheme(readCanvasTheme(wrapperRef.current)));
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let last: boolean | null = null;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width < COMPACT_WIDTH;
      if (next === last) return;
      last = next;
      setCompact(next);
      // Panels go back to their defaults (hidden bottom sheets on small screens).
      setPanels(null);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const controls = () => (mode === "3d" ? controls3D : controls2D).current;
  const selectNode = (id: string) => { store.set({ selected: id, focusCommunity: null }); controls()?.focusNode(id); };

  // The renderer loads lazily, so wait (up to ~3s) for its controls before zooming.
  useEffect(() => {
    if (!focusSource) return;
    const node = nodeForSource(graph, focusSource.id, focusSource.label);
    if (!node) return;
    store.set({ selected: node, focusCommunity: null });
    let frame = 0, tries = 0;
    const tryFocus = () => {
      const current = (mode === "3d" ? controls3D : controls2D).current;
      if (current) current.focusNode(node);
      else if (tries++ < 180) frame = requestAnimationFrame(tryFocus);
    };
    tryFocus();
    return () => cancelAnimationFrame(frame);
    // Only a new request should focus; rebuilding the graph or switching modes must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSource?.token]);
  const togglePanel = (panel: "input" | "analytics") => setPanels(compact
    ? { input: panel === "input" && !visible.input, analytics: panel === "analytics" && !visible.analytics }
    : { ...visible, [panel]: !visible[panel] });
  const switchMode = (next: "2d" | "3d") => { if (next === "3d") setHas3D(true); setMode(next); };

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    const labels = graph.mapNodes((node, attributes) => [node, attributes.label.toLowerCase()] as const);
    const match = labels.find(([, label]) => label === term) ?? labels.find(([, label]) => label.startsWith(term)) ?? labels.find(([, label]) => label.includes(term));
    setNotFound(!match);
    if (match) selectNode(match[0]);
  };

  const relayout = () => {
    const next = seed + 1;
    setSeed(next);
    layoutGraph(graph, next);
    setIntroToken((token) => token + 1);
  };

  const panelClass = (side: "left" | "right") => cn(
    "absolute z-20 overflow-y-auto border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] p-3 text-[var(--tn-label)] shadow-xl backdrop-blur-md [scrollbar-width:thin]",
    compact ? "inset-x-0 bottom-0 max-h-[65%] rounded-t-2xl" : cn("top-14 max-h-[calc(100%-4.5rem)] w-80 rounded-xl", side === "left" ? "left-3" : "right-3"),
  );
  const isEmpty = graph.order === 0;
  const selectedTopic = selected && graph.hasNode(selected) ? analytics.topics.find((topic) => topic.community === graph.getNodeAttribute(selected, "community")) : undefined;
  const graphProps = { graph, store, theme, animate, introToken };

  return <div ref={wrapperRef} className="text-network relative h-full min-h-0 w-full overflow-hidden bg-[var(--tn-bg)] text-[var(--tn-label)]">
    {!isEmpty && <>
      <div className={cn("absolute inset-0", mode !== "2d" && "pointer-events-none invisible")}>
        <Graph2D {...graphProps} curved={curved} active={mode === "2d"} controlsRef={controls2D} />
      </div>
      {has3D && <div className={cn("absolute inset-0", mode !== "3d" && "pointer-events-none invisible")}>
        <Graph3D {...graphProps} active={mode === "3d"} controlsRef={controls3D} />
      </div>}
    </>}
    {isEmpty && <div className="absolute inset-0 flex items-center justify-center p-6">{emptyState ?? <p className="text-sm text-[var(--tn-muted)]">No words to visualize.</p>}</div>}

    <div className="absolute inset-x-3 top-3 z-30 flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={visible.input} onClick={() => togglePanel("input")} className={cn("flex h-9 items-center gap-1.5 rounded-lg border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] px-2.5 text-xs font-medium shadow-sm backdrop-blur", visible.input && "text-[var(--tn-accent)]")}><TextCursorInput className="size-4" /><span className="max-[480px]:hidden">Text</span></button>
      {SHOW_3D && <div className="flex h-9 rounded-lg border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] p-0.5 shadow-sm backdrop-blur" role="group" aria-label="View mode">
        {(["2d", "3d"] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => switchMode(value)} className={cn("flex items-center gap-1 rounded-md px-2.5 text-xs font-semibold uppercase", mode === value ? "bg-[var(--tn-accent)] text-white" : "text-[var(--tn-muted)] hover:text-[var(--tn-label)]")}>
          {value === "2d" ? <Square className="size-3.5" /> : <Box className="size-3.5" />}{value}
        </button>)}
      </div>}
      {buildDefaultGraph && customInput === null && <div className="flex h-9 rounded-lg border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] p-0.5 shadow-sm backdrop-blur" role="group" aria-label="Node type">
        {(["entities", "words"] as const).map((value) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={cn("flex items-center gap-1 rounded-md px-2.5 text-xs font-semibold", view === value ? "bg-[var(--tn-accent)] text-white" : "text-[var(--tn-muted)] hover:text-[var(--tn-label)]")}>
          {value === "entities" ? <Shapes className="size-3.5" /> : <Type className="size-3.5" />}<span className="max-[480px]:hidden">{value === "entities" ? "Entities" : "Words"}</span>
        </button>)}
      </div>}
      <form onSubmit={search} className="ml-auto flex h-9 min-w-0 items-center gap-1.5 rounded-lg border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] px-2.5 shadow-sm backdrop-blur">
        <Search className="size-4 shrink-0 text-[var(--tn-muted)]" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setNotFound(false); }} placeholder={showEntities ? "Search entities" : "Search words"} aria-label="Search nodes" className="w-28 min-w-0 bg-transparent text-xs outline-none placeholder:text-[var(--tn-muted)] sm:w-40" />
        {notFound && <span className="shrink-0 text-[10px] text-[var(--tn-muted)]">not found</span>}
      </form>
      {SHOW_ANALYTICS && <button type="button" aria-pressed={visible.analytics} onClick={() => togglePanel("analytics")} className={cn("flex h-9 items-center gap-1.5 rounded-lg border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] px-2.5 text-xs font-medium shadow-sm backdrop-blur", visible.analytics && "text-[var(--tn-accent)]")}><BarChart3 className="size-4" /><span className="max-[480px]:hidden">Analytics</span></button>}
    </div>

    {visible.input && <InputPanel
      className={panelClass("left")}
      draft={draft ?? (customInput ?? linesToText(defaultLines))}
      isCustom={customInput !== null}
      maxNodes={maxNodes} curved={curved} animate={animate}
      onDraftChange={setDraft}
      onBuild={() => {
        const next = draft ?? customInput;
        if (next !== null && next !== linesToText(defaultLines)) setCustomInput(next);
        if (compact) setPanels({ input: false, analytics: false });
      }}
      onResetDefault={() => { setCustomInput(null); setDraft(null); }}
      onRelayout={relayout}
      onCurvedChange={setCurved} onAnimateChange={setAnimate} onMaxNodesChange={setMaxNodes}
      onClose={() => togglePanel("input")}
    />}
    {SHOW_ANALYTICS && visible.analytics && !isEmpty && <AnalyticsPanel
      className={panelClass("right")}
      analytics={analytics}
      focusCommunity={focusCommunity}
      onFocusCommunity={(community) => {
        store.set({ focusCommunity: community, selected: null });
        controls()?.focusNodes(community === null ? [] : graph.filterNodes((_node, attributes) => attributes.community === community));
      }}
      onSelectNode={selectNode}
      onClose={() => togglePanel("analytics")}
    />}
    {selected && !(compact && (visible.input || visible.analytics)) && <NodeCard
      className={cn(
        "absolute z-20 rounded-xl border border-[var(--tn-panel-border)] bg-[var(--tn-panel)] p-3 shadow-xl backdrop-blur-md",
        compact ? "inset-x-3 bottom-3" : cn("bottom-3 w-80", visible.input ? "left-[21.5rem]" : "left-3"),
      )}
      graph={graph} node={selected} topicWords={selectedTopic?.words}
      sourceLabels={sourceLabels} onOpenSource={onOpenSource}
      onSelect={selectNode}
      onClose={() => store.set({ selected: null })}
    />}
  </div>;
}
