"use client";

import { useEffect, useRef, type RefObject } from "react";
import Sigma from "sigma";
import type { Settings } from "sigma/settings";
import type { NodeDisplayData, PartialButFor } from "sigma/types";
import { parseColor, rgba } from "@/lib/text-network/palette";
import type { TextGraph } from "@/lib/text-network/types";
import { drawEdges, type EdgeSprite, type Point } from "./edgeRenderer";
import { activeNode, isEdgeLit, isNodeLit, type InteractionStore } from "./interaction";
import { createPhysics, type Physics } from "./physics";
import type { CanvasTheme } from "./theme";

export type GraphControls = {
  focusNode: (id: string) => void;
  /** Zooms to fit the given nodes; an empty list zooms back out to the whole graph. */
  focusNodes: (ids: string[]) => void;
};

type Graph2DProps = {
  graph: TextGraph;
  store: InteractionStore;
  theme: CanvasTheme;
  curved: boolean;
  animate: boolean;
  /** Whether this view is the visible one; hidden views skip work. */
  active: boolean;
  /** Bumped by the parent to replay the intro (re-layout). */
  introToken: number;
  controlsRef: RefObject<GraphControls | null>;
};

type LabelData = PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color"> & { bcNorm?: number };
const FALLBACK_RGB = { r: 154, g: 166, b: 184 };

export default function Graph2D({ graph, store, theme, curved, animate, active, introToken, controlsRef }: Graph2DProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Sigma | null>(null);
  // Values read by the reducers / render loop without re-creating the renderer.
  const optionsRef = useRef({ theme, curved, animate, active });
  const introStartRef = useRef<number | null>(null);
  const kickRef = useRef<() => void>(() => {});
  const physicsRef = useRef<Physics | null>(null);

  useEffect(() => {
    const container = sigmaRef.current, canvas = canvasRef.current, wrapper = wrapperRef.current;
    const context = canvas?.getContext("2d");
    if (!container || !canvas || !wrapper || !context) return;

    const edges: EdgeSprite[] = graph.mapEdges((_edge, attributes, source, target, sourceAttributes, targetAttributes) => ({
      source, target, wNorm: attributes.wNorm,
      sourceRgb: parseColor(sourceAttributes.color) ?? FALLBACK_RGB, targetRgb: parseColor(targetAttributes.color) ?? FALLBACK_RGB,
      sourceBc: sourceAttributes.bcNorm, targetBc: targetAttributes.bcNorm,
    }));

    const drawLabel = (ctx: CanvasRenderingContext2D, data: LabelData, settings: Settings) => {
      if (!data.label) return;
      const bc = data.bcNorm ?? 0, size = 10 + bc * 16;
      ctx.font = `${bc > 0.35 ? 600 : 400} ${size}px ${settings.labelFont}`;
      ctx.fillStyle = rgba(optionsRef.current.theme.labelRgb, 0.38 + 0.62 * bc);
      ctx.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
    };
    const drawHover = (ctx: CanvasRenderingContext2D, data: LabelData, settings: Settings) => {
      const rgb = parseColor(data.color) ?? FALLBACK_RGB, inner = data.size, outer = data.size * 3 + 8;
      const glow = ctx.createRadialGradient(data.x, data.y, inner, data.x, data.y, outer);
      glow.addColorStop(0, rgba(rgb, 0.6));
      glow.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(data.x, data.y, outer, 0, Math.PI * 2);
      ctx.arc(data.x, data.y, inner, 0, Math.PI * 2, true);
      ctx.fill();
      drawLabel(ctx, data, settings);
    };

    const renderer = new Sigma(graph, container, {
      allowInvalidContainer: true,
      renderEdgeLabels: false,
      enableEdgeHoverEvents: false,
      enableEdgeClickEvents: false,
      zIndex: true,
      labelDensity: 0.9,
      labelGridCellSize: 70,
      labelRenderedSizeThreshold: 0,
      labelFont: "Inter, ui-sans-serif, system-ui, sans-serif",
      minCameraRatio: 0.05,
      maxCameraRatio: 4,
      labelRenderer: drawLabel,
      hoverRenderer: drawHover,
      edgeReducer: (_edge, data) => ({ ...data, hidden: true }),
      nodeReducer: (node, data) => {
        const state = store.get(), active = activeNode(state);
        if (!isNodeLit(graph, state, node)) return { ...data, color: optionsRef.current.theme.dim, label: null, zIndex: 0, highlighted: false };
        const emphasised = active !== null || state.focusCommunity !== null;
        return { ...data, zIndex: node === active ? 2 : 1, highlighted: node === state.selected, forceLabel: emphasised };
      },
    });
    rendererRef.current = renderer;

    const positions = new Map<string, Point>();
    let frame: number | null = null, width = 0, height = 0;
    const paint = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      positions.clear();
      graph.forEachNode((node) => {
        const data = renderer.getNodeDisplayData(node);
        if (data && !data.hidden) positions.set(node, renderer.framedGraphToViewport(data));
      });
      const { theme: currentTheme, curved: isCurved, animate: isAnimated } = optionsRef.current, state = store.get();
      return drawEdges(context, edges, {
        now, theme: currentTheme, curved: isCurved, animate: isAnimated, introStart: introStartRef.current, active: activeNode(state),
        isLit: (source, target) => isEdgeLit(graph, state, source, target),
        positions, scale: Math.min(3, Math.max(0.5, renderer.scaleSize(1))),
      });
    };
    const tick = () => {
      frame = null;
      if (paint(performance.now()) && optionsRef.current.active) frame = requestAnimationFrame(tick);
    };
    const kick = () => { if (frame === null) frame = requestAnimationFrame(tick); };
    kickRef.current = kick;
    renderer.on("afterRender", () => {
      if (paint(performance.now()) && optionsRef.current.active) kick();
    });

    // Nodes can be dragged to arrange the graph by hand; neighbours follow through the physics. The
    // bbox is pinned on the first drag so moving a node past the edge doesn't rescale the graph.
    const physics = createPhysics(graph);
    physicsRef.current = physics;
    let dragged: string | null = null, moved = false;
    const captor = renderer.getMouseCaptor();
    renderer.on("downNode", ({ node }) => {
      dragged = node;
      if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
    });
    captor.on("mousedown", () => { moved = false; });
    captor.on("mousemovebody", (event) => {
      if (!dragged) return;
      const position = renderer.viewportToGraph(event);
      physics.drag(dragged, position.x, position.y);
      moved = true;
      container.style.cursor = "grabbing";
      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });
    captor.on("mouseup", () => {
      if (dragged && moved) container.style.cursor = store.get().hovered ? "pointer" : "";
      dragged = null;
      physics.release();
    });

    renderer.on("enterNode", ({ node }) => { store.set({ hovered: node }); if (!dragged) container.style.cursor = "pointer"; });
    renderer.on("leaveNode", () => { store.set({ hovered: null }); if (!dragged) container.style.cursor = ""; });
    // A drag ends with a click; it shouldn't change the selection.
    renderer.on("clickNode", ({ node }) => { if (!moved) store.set({ selected: node }); });
    renderer.on("clickStage", () => { if (!moved) store.set({ selected: null, hovered: null, focusCommunity: null }); });
    const unsubscribe = store.subscribe(() => { if (optionsRef.current.active) renderer.refresh(); });

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      width = wrapper.clientWidth;
      height = wrapper.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      renderer.resize();
      renderer.refresh();
    });
    observer.observe(wrapper);

    controlsRef.current = {
      focusNode: (id) => {
        const data = renderer.getNodeDisplayData(id);
        if (data) void renderer.getCamera().animate({ x: data.x, y: data.y, ratio: 0.45 }, { duration: 600 });
      },
      focusNodes: (ids) => {
        const points = ids.map((id) => renderer.getNodeDisplayData(id)).filter((data) => data !== undefined);
        if (!points.length) { void renderer.getCamera().animatedReset({ duration: 600 }); return; }
        const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
        const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        // Display coordinates are normalised so ratio 1 frames the whole graph; pad the box by 40%.
        const ratio = Math.min(1, Math.max(0.15, Math.max(maxX - minX, maxY - minY) * 1.4));
        void renderer.getCamera().animate({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, ratio }, { duration: 600 });
      },
    };

    introStartRef.current = optionsRef.current.animate ? performance.now() : null;
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      physics.stop();
      physicsRef.current = null;
      observer.disconnect();
      unsubscribe();
      kickRef.current = () => {};
      controlsRef.current = null;
      renderer.kill();
      rendererRef.current = null;
    };
  }, [graph, store, controlsRef]);

  useEffect(() => {
    const becameActive = active && !optionsRef.current.active;
    optionsRef.current = { theme, curved, animate, active };
    if (!animate) introStartRef.current = null;
    if (becameActive && animate) introStartRef.current = performance.now();
    // Theme / visibility changes need the reducers re-run; toggles only need a repaint.
    rendererRef.current?.refresh();
    kickRef.current();
  }, [theme, curved, animate, active]);

  useEffect(() => {
    if (!introToken) return;
    // Re-layout replaces hand-placed positions, so let the bbox fit the new layout again.
    physicsRef.current?.stop();
    rendererRef.current?.setCustomBBox(null).refresh();
    if (!optionsRef.current.animate) return;
    introStartRef.current = performance.now();
    kickRef.current();
  }, [introToken]);

  return <div ref={wrapperRef} className="absolute inset-0 overflow-hidden bg-[radial-gradient(var(--tn-dot)_1px,transparent_1px)] [background-size:24px_24px]" style={{ backgroundColor: theme.background }}>
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
    <div ref={sigmaRef} className="absolute inset-0" />
  </div>;
}
