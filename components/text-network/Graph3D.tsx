"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { ConfigOptions, ForceGraph3DInstance } from "3d-force-graph";
import type SpriteTextType from "three-spritetext";
import { mulberry32 } from "@/lib/text-network/buildGraph";
import { mixRgb, parseColor, rgba, type Rgb } from "@/lib/text-network/palette";
import type { TextGraph } from "@/lib/text-network/types";
import { INTRO_DURATION, INTRO_MAX_DELAY, INTRO_TOTAL } from "./edgeRenderer";
import type { GraphControls } from "./Graph2D";
import { activeNode, isEdgeLit, isNodeLit, type InteractionStore } from "./interaction";
import type { CanvasTheme } from "./theme";

type Graph3DProps = {
  graph: TextGraph;
  store: InteractionStore;
  theme: CanvasTheme;
  animate: boolean;
  active: boolean;
  introToken: number;
  controlsRef: RefObject<GraphControls | null>;
};

type Node3D = { id: string; label: string; color: string; rgb: Rgb; size: number; bcNorm: number; x?: number; y?: number; z?: number };
type Link3D = { id: string; source: string | Node3D; target: string | Node3D; wNorm: number; hub: number };
type Instance = ForceGraph3DInstance<Node3D, Link3D>;
type Sprite = InstanceType<typeof SpriteTextType> & { position: { y: number }; visible: boolean };

const LINK_OPACITY = 0.6;
// The canvas stays transparent so the container's dotted background shows through.
const TRANSPARENT = "rgba(0,0,0,0)";
const FALLBACK_RGB = { r: 154, g: 166, b: 184 };
const endId = (end: string | Node3D) => typeof end === "object" ? end.id : end;

export default function Graph3D({ graph, store, theme, animate, active, introToken, controlsRef }: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<Instance | null>(null);
  const optionsRef = useRef({ theme, animate, active });
  const refreshRef = useRef<() => void>(() => {});
  const introRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false, introFrame: number | null = null, observer: ResizeObserver | null = null, unsubscribe = () => {};
    let fg: Instance | null = null;

    void Promise.all([import("3d-force-graph"), import("three-spritetext")]).then(([{ default: ForceGraph3D }, { default: SpriteText }]) => {
      if (cancelled) return;

      // Start from the 2D layout normalised to ±100, with a random (seeded) depth.
      const xs = graph.mapNodes((_node, attributes) => attributes.x), ys = graph.mapNodes((_node, attributes) => attributes.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const half = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 || 1;
      const random = mulberry32(42);
      const nodes: Node3D[] = graph.mapNodes((id, attributes) => ({
        id, label: attributes.label, color: attributes.color, rgb: parseColor(attributes.color) ?? FALLBACK_RGB, size: attributes.size, bcNorm: attributes.bcNorm,
        x: ((attributes.x - cx) / half) * 100, y: ((attributes.y - cy) / half) * 100, z: (random() - 0.5) * 100,
      }));
      const nodeById = new Map(nodes.map((node) => [node.id, node]));
      const links: Link3D[] = graph.mapEdges((id, attributes, source, target, sourceAttributes, targetAttributes) => ({
        id, source, target, wNorm: attributes.wNorm, hub: Math.max(sourceAttributes.bcNorm, targetAttributes.bcNorm),
      }));

      const sprites = new Map<string, { sprite: Sprite; color: string; visible: boolean }>();
      const nodeLit = (id: string) => isNodeLit(graph, store.get(), id);
      const linkLit = (link: Link3D) => isEdgeLit(graph, store.get(), endId(link.source), endId(link.target));
      const isActiveLink = (link: Link3D) => {
        const current = activeNode(store.get());
        return current !== null && (endId(link.source) === current || endId(link.target) === current);
      };
      const labelColor = (node: Node3D) => rgba(optionsRef.current.theme.labelRgb, 0.38 + 0.62 * node.bcNorm);

      // The package declares its generics on the interface, not the constructor.
      const ForceGraph = ForceGraph3D as unknown as new (element: HTMLElement, options?: ConfigOptions) => Instance;
      const instance = new ForceGraph(container, { controlType: "trackball" });
      fg = instance;
      fgRef.current = instance;
      let fitted = false;
      instance
        .width(container.clientWidth)
        .height(container.clientHeight)
        .backgroundColor(TRANSPARENT)
        .showNavInfo(false)
        .nodeRelSize(1)
        .nodeVal((node: Node3D) => Math.pow(node.size * 0.55, 3))
        .nodeColor((node: Node3D) => nodeLit(node.id) ? node.color : optionsRef.current.theme.dim)
        .nodeOpacity(0.95)
        .nodeResolution(16)
        .nodeLabel(() => "")
        .nodeThreeObjectExtend(true)
        .nodeThreeObject((node: Node3D) => {
          const textHeight = 2.6 + node.bcNorm * 8, color = labelColor(node);
          const sprite = new SpriteText(node.label, textHeight, color) as Sprite;
          sprite.fontWeight = node.bcNorm > 0.35 ? "600" : "400";
          sprite.position.y = node.size * 0.55 + textHeight * 0.75;
          sprites.set(node.id, { sprite, color, visible: true });
          return sprite;
        })
        .linkCurvature(0.25)
        .linkOpacity(optionsRef.current.animate ? 0 : LINK_OPACITY)
        .linkWidth((link: Link3D) => 0.35 + link.wNorm * 1.2)
        .linkColor((link: Link3D) => {
          const source = nodeById.get(endId(link.source));
          return linkLit(link) && source ? rgba(source.rgb, 0.5 + 0.5 * link.wNorm) : rgba(optionsRef.current.theme.dimRgb, 0.25);
        })
        .linkDirectionalParticles((link: Link3D) => optionsRef.current.animate && isActiveLink(link) ? (link.wNorm > 0.66 ? 3 : 2) : 0)
        .linkDirectionalParticleSpeed(0.006)
        .linkDirectionalParticleWidth((link: Link3D) => 1.2 + link.wNorm * 1.6)
        .linkDirectionalParticleColor((link: Link3D) => {
          const current = nodeById.get(activeNode(store.get()) ?? "") ?? nodeById.get(endId(link.source));
          return rgba(mixRgb(current?.rgb ?? FALLBACK_RGB, optionsRef.current.theme.labelRgb, 0.35), 1);
        })
        .onNodeHover((node: Node3D | null) => { store.set({ hovered: node?.id ?? null }); container.style.cursor = node ? "pointer" : ""; })
        .onNodeClick((node: Node3D) => { store.set({ selected: node.id }); flyTo(node); })
        .onBackgroundClick(() => store.set({ selected: null, hovered: null, focusCommunity: null }))
        .cooldownTicks(220)
        .onEngineStop(() => { if (!fitted) { fitted = true; instance.zoomToFit(600, 40); } })
        .graphData({ nodes, links });
      instance.d3Force("link")?.strength((link: Link3D) => 0.05 + 0.75 * link.wNorm);
      instance.d3Force("charge")?.strength(-80);

      function flyTo(node: Node3D) {
        const x = node.x ?? 0, y = node.y ?? 0, z = node.z ?? 0, distance = 60 + node.size * 2;
        const ratio = 1 + distance / (Math.hypot(x, y, z) || 1);
        instance.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 800);
      }

      refreshRef.current = () => {
        instance.backgroundColor(TRANSPARENT);
        instance.nodeColor(instance.nodeColor()).linkColor(instance.linkColor()).linkDirectionalParticles(instance.linkDirectionalParticles());
        nodes.forEach((node) => {
          const entry = sprites.get(node.id);
          if (!entry) return;
          const visible = nodeLit(node.id), color = labelColor(node);
          if (entry.visible !== visible) { entry.sprite.visible = visible; entry.visible = visible; }
          if (entry.color !== color) { entry.sprite.color = color; entry.color = color; }
        });
      };

      // Intro: links fade in while one particle per link travels, hubs first.
      introRef.current = () => {
        if (introFrame !== null) cancelAnimationFrame(introFrame);
        introFrame = null;
        if (!optionsRef.current.animate) { instance.linkOpacity(LINK_OPACITY); return; }
        const queue = [...links].sort((a, b) => b.hub - a.hub), start = performance.now();
        let next = 0, lastOpacity = -1;
        instance.linkOpacity(0);
        const step = () => {
          const elapsed = performance.now() - start;
          const opacity = Math.round(Math.min(1, elapsed / INTRO_TOTAL) * LINK_OPACITY * 20) / 20;
          if (opacity !== lastOpacity) { instance.linkOpacity(opacity); lastOpacity = opacity; }
          while (next < queue.length && (1 - queue[next].hub) * INTRO_MAX_DELAY <= elapsed) instance.emitParticle(queue[next++]);
          if (elapsed < INTRO_TOTAL + INTRO_DURATION || next < queue.length) introFrame = requestAnimationFrame(step);
          else { instance.linkOpacity(LINK_OPACITY); introFrame = null; }
        };
        introFrame = requestAnimationFrame(step);
      };

      unsubscribe = store.subscribe(() => { if (optionsRef.current.active) refreshRef.current(); });
      observer = new ResizeObserver(() => instance.width(container.clientWidth).height(container.clientHeight));
      observer.observe(container);
      controlsRef.current = {
        focusNode: (id) => { const node = nodeById.get(id); if (node) flyTo(node); },
        focusNodes: (ids) => {
          const wanted = new Set(ids);
          instance.zoomToFit(800, 40, wanted.size ? (node: Node3D) => wanted.has(node.id) : () => true);
        },
      };
      if (optionsRef.current.active) introRef.current(); else instance.pauseAnimation();
    });

    return () => {
      cancelled = true;
      if (introFrame !== null) cancelAnimationFrame(introFrame);
      observer?.disconnect();
      unsubscribe();
      refreshRef.current = () => {};
      introRef.current = () => {};
      if (fg) {
        fg.pauseAnimation();
        fg._destructor();
        container.replaceChildren();
        if (controlsRef.current) controlsRef.current = null;
      }
      fgRef.current = null;
    };
  }, [graph, store, controlsRef]);

  useEffect(() => {
    const becameActive = active && !optionsRef.current.active, animationStopped = !animate && optionsRef.current.animate;
    optionsRef.current = { theme, animate, active };
    const fg = fgRef.current;
    if (!fg) return;
    if (!active) { fg.pauseAnimation(); return; }
    fg.resumeAnimation();
    refreshRef.current();
    // introRef also cancels a running intro and restores full opacity when animation is off.
    if (becameActive || animationStopped) introRef.current();
  }, [theme, animate, active]);

  useEffect(() => {
    if (introToken && optionsRef.current.active) introRef.current();
  }, [introToken]);

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[radial-gradient(var(--tn-dot)_1px,transparent_1px)] [background-size:24px_24px]" style={{ backgroundColor: theme.background }} />;
}
