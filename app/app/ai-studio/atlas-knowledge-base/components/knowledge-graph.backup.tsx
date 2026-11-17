"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { FileText, Search, X } from "lucide-react";
import type { KnowledgeArtifact, KnowledgeEntity } from "../types";

type KnowledgeGraphProps = {
  artifacts: KnowledgeArtifact[];
  entities: KnowledgeEntity[];
  onOpen: (artifact: KnowledgeArtifact) => void;
};

type GraphNode = { id: string; label: string; artifactId: string; color: string; degree: number; x?: number; y?: number };
type GraphLink = { id: string; source: string; target: string; type: string };

const NODE_COLORS = ["#22c55e", "#818cf8", "#f59e0b", "#ec4899", "#38bdf8", "#a855f7"];

function graphItemId(value: unknown) {
  return typeof value === "object" && value !== null && "id" in value ? String(value.id) : String(value);
}

export function KnowledgeGraph({ artifacts, entities, onOpen }: KnowledgeGraphProps) {
  const container = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const lastClick = useRef<{ id: string; time: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const artifactMap = useMemo(() => new Map(artifacts.map((item) => [item.id, item])), [artifacts]);

  const { graphData, neighborIds } = useMemo(() => {
    const entityIds = new Set(entities.map((entity) => entity.id));
    const links = Array.from(new Map(entities.flatMap((entity) => entity.relations).map((relation) => [relation.id, relation])).values())
      .filter((relation) => entityIds.has(relation.sourceEntityId) && entityIds.has(relation.targetEntityId));
    const degrees = new Map<string, number>();
    const neighbours = new Map<string, Set<string>>();
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
    const frame = requestAnimationFrame(() => graph.current?.zoomToFit(350, 110, (node) => matchedIds.has(node.id)));
    return () => cancelAnimationFrame(frame);
  }, [matchedIds, normalizedQuery]);

  const graphIsEmpty = entities.length === 0;
  return <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#fcfcfd] bg-[radial-gradient(#dedee5_1px,transparent_1px)] [background-size:24px_24px]">
    <div ref={container} className="absolute inset-0 z-0">
      {size.width > 0 && size.height > 0 && <ForceGraph2D
        ref={graph}
        width={size.width}
        height={size.height}
        graphData={graphData}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={120}
        d3AlphaDecay={0.035}
        d3VelocityDecay={0.3}
        linkColor={(link: GraphLink) => (!visibleIds || (visibleIds.has(graphItemId(link.source)) && visibleIds.has(graphItemId(link.target)))) ? "rgba(100,116,139,0.48)" : "rgba(148,163,184,0.10)"}
        linkWidth={(link: GraphLink) => (!visibleIds || (visibleIds.has(graphItemId(link.source)) && visibleIds.has(graphItemId(link.target))) ? 1.15 : 0.65)}
        nodeCanvasObject={(node: GraphNode, context, scale) => {
          const isActive = node.id === activeId;
          const isMatch = matchedIds.has(node.id);
          const isDimmed = (visibleIds !== null && !visibleIds.has(node.id)) || (normalizedQuery !== "" && !isMatch);
          const radius = Math.min(9, 3.5 + Math.sqrt(node.degree) * 1.35);
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          context.globalAlpha = isDimmed ? 0.18 : 1;
          context.beginPath();
          context.arc(x, y, radius + (isActive || isMatch ? 2 : 0), 0, 2 * Math.PI);
          context.fillStyle = isActive || isMatch ? "#ffffff" : node.color;
          context.fill();
          context.lineWidth = isActive || isMatch ? 2.5 / scale : 0;
          context.strokeStyle = isMatch ? "#2563eb" : node.color;
          context.stroke();
          if (isActive || isMatch || scale > 1.35) {
            context.font = `600 ${11 / scale}px Inter, ui-sans-serif, system-ui, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillStyle = isDimmed ? "rgba(71,85,105,.45)" : "#334155";
            context.fillText(node.label, x, y + radius + 4 / scale, 110 / scale);
          }
          context.globalAlpha = 1;
        }}
        nodePointerAreaPaint={(node: GraphNode, color, context) => {
          context.fillStyle = color;
          context.beginPath();
          context.arc(node.x ?? 0, node.y ?? 0, Math.min(12, 7 + Math.sqrt(node.degree) * 1.35), 0, 2 * Math.PI);
          context.fill();
        }}
        onNodeHover={(node: GraphNode | null) => setHoveredId(node?.id ?? null)}
        onNodeClick={(node: GraphNode) => {
          const now = Date.now();
          const isDoubleClick = lastClick.current?.id === node.id && now - lastClick.current.time < 300;
          lastClick.current = { id: node.id, time: now };
          setSelectedId(node.id);
          if (isDoubleClick) {
            const artifact = artifactMap.get(node.artifactId);
            if (artifact) onOpen(artifact);
            return;
          }
          graph.current?.centerAt(node.x, node.y, 350);
          graph.current?.zoom(1.8, 350);
        }}
        onBackgroundClick={() => setSelectedId(null)}
      />}
    </div>
    {graphIsEmpty && <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center text-gray-500"><span className="flex size-11 items-center justify-center rounded-full border bg-white shadow-sm"><FileText className="size-5" /></span><p className="text-sm font-medium text-gray-700">No entities to visualize</p><p className="max-w-xs text-xs">Upload a file or clear the current search to populate the graph.</p></div>}
    <div className="absolute right-5 top-5 z-20 flex items-center gap-2">{searchOpen && <div className="flex h-9 items-center rounded-lg border bg-white px-3 shadow-sm"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search graph" className="w-52 bg-transparent text-sm outline-none" /><button type="button" onClick={() => { setQuery(""); setSearchOpen(false); }} className="text-gray-400 hover:text-gray-700"><X className="size-4" /></button></div>}<button type="button" aria-label="Search graph" onClick={() => setSearchOpen((open) => !open)} className="flex size-9 items-center justify-center rounded-lg bg-primary-700 text-white shadow-sm hover:bg-primary-800"><Search className="size-4" /></button></div>
  </div>;
}
