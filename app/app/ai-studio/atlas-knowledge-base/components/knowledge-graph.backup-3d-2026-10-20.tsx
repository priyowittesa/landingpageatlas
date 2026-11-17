"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import { FileText, Search, X } from "lucide-react";
import type { KnowledgeArtifact, KnowledgeEntity } from "../types";

type KnowledgeGraphProps = { artifacts: KnowledgeArtifact[]; entities: KnowledgeEntity[]; onOpen: (artifact: KnowledgeArtifact) => void };
type GraphNode = { id: string; label: string; artifactId: string; color: string; degree: number; x?: number; y?: number; z?: number };
type GraphLink = { id: string; source: string | GraphNode; target: string | GraphNode; type: string };

const NODE_COLORS = ["#4ade80", "#a5b4fc", "#fbbf24", "#f472b6", "#38bdf8", "#c084fc"];
const graphItemId = (value: string | GraphNode) => typeof value === "object" ? value.id : value;

export function KnowledgeGraph({ artifacts, entities, onOpen }: KnowledgeGraphProps) {
  const container = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const lastClick = useRef<{ id: string; time: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null), [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const artifactMap = useMemo(() => new Map(artifacts.map((item) => [item.id, item])), [artifacts]);

  const { graphData, neighborIds } = useMemo(() => {
    const entityIds = new Set(entities.map((entity) => entity.id));
    const links = Array.from(new Map(entities.flatMap((entity) => entity.relations).map((relation) => [relation.id, relation])).values())
      .filter((relation) => entityIds.has(relation.sourceEntityId) && entityIds.has(relation.targetEntityId));
    const degrees = new Map<string, number>(), neighbours = new Map<string, Set<string>>();
    links.forEach((link) => {
      degrees.set(link.sourceEntityId, (degrees.get(link.sourceEntityId) ?? 0) + 1);
      degrees.set(link.targetEntityId, (degrees.get(link.targetEntityId) ?? 0) + 1);
      if (!neighbours.has(link.sourceEntityId)) neighbours.set(link.sourceEntityId, new Set());
      if (!neighbours.has(link.targetEntityId)) neighbours.set(link.targetEntityId, new Set());
      neighbours.get(link.sourceEntityId)?.add(link.targetEntityId);
      neighbours.get(link.targetEntityId)?.add(link.sourceEntityId);
    });
    return {
      graphData: {
        nodes: entities.map((entity, index): GraphNode => ({ id: entity.id, label: entity.name, artifactId: entity.artifactId, color: NODE_COLORS[index % NODE_COLORS.length], degree: degrees.get(entity.id) ?? 0 })),
        links: links.map((link): GraphLink => ({ id: link.id, source: link.sourceEntityId, target: link.targetEntityId, type: link.type })),
      },
      neighborIds: neighbours,
    };
  }, [entities]);

  const normalizedQuery = query.trim().toLowerCase();
  const matchedIds = useMemo(() => new Set(normalizedQuery ? graphData.nodes.filter((node) => node.label.toLowerCase().includes(normalizedQuery)).map((node) => node.id) : []), [graphData.nodes, normalizedQuery]);
  const activeId = hoveredId ?? selectedId;
  const visibleIds = activeId ? new Set([activeId, ...(neighborIds.get(activeId) ?? [])]) : null;

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!normalizedQuery || !matchedIds.size) return;
    const frame = requestAnimationFrame(() => graph.current?.zoomToFit(500, 90, (node) => matchedIds.has(node.id)));
    return () => cancelAnimationFrame(frame);
  }, [matchedIds, normalizedQuery]);

  const graphIsEmpty = entities.length === 0;
  return <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#070b1b]">
    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_45%,rgba(49,46,129,.24),transparent_55%)]" />
    <div ref={container} className="absolute inset-0 z-0">
      {size.width > 0 && size.height > 0 && <ForceGraph3D<GraphNode, GraphLink>
        ref={graph} width={size.width} height={size.height} graphData={graphData}
        nodeId="id" linkSource="source" linkTarget="target" backgroundColor="rgba(0,0,0,0)" showNavInfo={false}
        nodeRelSize={3.2}
        nodeVal={(node) => 1 + Math.min(node.degree, 6) * 0.15 + (node.id === activeId || matchedIds.has(node.id) ? 0.5 : 0)}
        nodeColor={(node) => {
          const isDimmed = (visibleIds !== null && !visibleIds.has(node.id)) || (normalizedQuery !== "" && !matchedIds.has(node.id));
          return isDimmed ? "#1e293b" : node.color;
        }}
        nodeOpacity={0.95}
        nodeResolution={20}
        cooldownTicks={120} d3AlphaDecay={0.03} d3VelocityDecay={0.28} linkOpacity={0.8}
        linkColor={(link) => (!visibleIds || (visibleIds.has(graphItemId(link.source)) && visibleIds.has(graphItemId(link.target)))) ? "rgba(148,163,184,.42)" : "rgba(148,163,184,.06)"}
        linkWidth={(link) => (!visibleIds || (visibleIds.has(graphItemId(link.source)) && visibleIds.has(graphItemId(link.target)))) ? 0.8 : 0.25}
        nodeThreeObject={(node: GraphNode) => {
          const isActive = node.id === activeId, isMatch = matchedIds.has(node.id);
          const isDimmed = (visibleIds !== null && !visibleIds.has(node.id)) || (normalizedQuery !== "" && !isMatch);
          const sprite = new SpriteText(node.label);
          sprite.color = isDimmed ? "#475569" : isMatch || isActive ? "#ffffff" : node.color;
          sprite.textHeight = Math.min(4.2, 2.8 + Math.sqrt(node.degree) * 0.3) + (isActive || isMatch ? 0.45 : 0);
          sprite.fontWeight = isActive || isMatch ? "600" : "500";
          sprite.backgroundColor = isDimmed ? false : "rgba(7,11,27,.72)";
          sprite.padding = [2.5, 1.25];
          sprite.borderRadius = 3;
          (sprite as SpriteText & { position: { y: number } }).position.y = 7;
          return sprite;
        }}
        nodeThreeObjectExtend
        nodeLabel={(node) => `${node.label}${node.degree ? ` · ${node.degree} connection${node.degree === 1 ? "" : "s"}` : ""}`}
        onNodeHover={(node) => { setHoveredId(node?.id ?? null); if (container.current) container.current.style.cursor = node ? "pointer" : "grab"; }}
        onNodeClick={(node) => {
          const now = Date.now(), isDoubleClick = lastClick.current?.id === node.id && now - lastClick.current.time < 300;
          lastClick.current = { id: node.id, time: now };
          setSelectedId(node.id);
          if (isDoubleClick) { const artifact = artifactMap.get(node.artifactId); if (artifact) onOpen(artifact); return; }
          const distance = 80, length = Math.hypot(node.x ?? 0, node.y ?? 0, node.z ?? 0) || 1, ratio = 1 + distance / length;
          graph.current?.cameraPosition({ x: (node.x ?? 0) * ratio, y: (node.y ?? 0) * ratio, z: (node.z ?? 0) * ratio }, { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 }, 650);
        }}
        onBackgroundClick={() => setSelectedId(null)}
      />}
    </div>
    {graphIsEmpty && <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center text-slate-400"><span className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-sm"><FileText className="size-5" /></span><p className="text-sm font-medium text-slate-200">No entities to visualize</p><p className="max-w-xs text-xs">Upload a file or clear the current search to populate the graph.</p></div>}
    <div className="absolute right-5 top-5 z-20 flex items-center gap-2">{searchOpen && <div className="flex h-9 items-center rounded-lg border border-white/15 bg-slate-950/80 px-3 text-slate-100 shadow-lg backdrop-blur"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search graph" className="w-52 bg-transparent text-sm outline-none placeholder:text-slate-500" /><button type="button" onClick={() => { setQuery(""); setSearchOpen(false); }} className="text-slate-400 hover:text-white"><X className="size-4" /></button></div>}<button type="button" aria-label="Search graph" onClick={() => setSearchOpen((open) => !open)} className="flex size-9 items-center justify-center rounded-lg bg-primary-700 text-white shadow-lg hover:bg-primary-800"><Search className="size-4" /></button></div>
    {!graphIsEmpty && <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">Drag to rotate · Scroll to zoom · Double-click a name to open</div>}
  </div>;
}
