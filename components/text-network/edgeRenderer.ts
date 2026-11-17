import { mixRgb, rgba, type Rgb } from "@/lib/text-network/palette";
import type { CanvasTheme } from "./theme";

export type Point = { x: number; y: number };

export type EdgeSprite = {
  source: string;
  target: string;
  wNorm: number;
  sourceRgb: Rgb;
  targetRgb: Rgb;
  sourceBc: number;
  targetBc: number;
};

export type EdgeFrame = {
  now: number;
  theme: CanvasTheme;
  curved: boolean;
  animate: boolean;
  /** performance.now() when the intro started, or null when no intro is running. */
  introStart: number | null;
  /** Hovered or selected node; flowing dots only appear on its edges. */
  active: string | null;
  isLit: (source: string, target: string) => boolean;
  positions: Map<string, Point>;
  /** Zoom-dependent thickness multiplier. */
  scale: number;
};

export const CURVATURE = 0.18;
export const INTRO_MAX_DELAY = 1500;
export const INTRO_DURATION = 700;
export const INTRO_TOTAL = INTRO_MAX_DELAY + INTRO_DURATION;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Control point: midpoint offset perpendicular by CURVATURE × length (or the midpoint for straight lines). */
export function controlPoint(p0: Point, p1: Point, curved: boolean): Point {
  const mid = lerp(p0, p1, 0.5);
  if (!curved) return mid;
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  return { x: mid.x - dy * CURVATURE, y: mid.y + dx * CURVATURE };
}

export function bezierPoint(p0: Point, c: Point, p1: Point, t: number): Point {
  return lerp(lerp(p0, c, t), lerp(c, p1, t), t);
}

/** De Casteljau split: the sub-curve from t=0 to t. */
export function splitBezier(p0: Point, c: Point, p1: Point, t: number) {
  const c1 = lerp(p0, c, t);
  return { p0, c: c1, p1: lerp(c1, lerp(c, p1, t), t) };
}

/** 0..1 growth of an edge during the intro; hubs (high betweenness) grow first. */
export function introProgress(edge: Pick<EdgeSprite, "sourceBc" | "targetBc">, elapsed: number) {
  const delay = (1 - Math.max(edge.sourceBc, edge.targetBc)) * INTRO_MAX_DELAY;
  return easeOutCubic(Math.min(1, Math.max(0, (elapsed - delay) / INTRO_DURATION)));
}

function strokeCurve(ctx: CanvasRenderingContext2D, p0: Point, c: Point, p1: Point) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(c.x, c.y, p1.x, p1.y);
  ctx.stroke();
}

function drawSpark(ctx: CanvasRenderingContext2D, at: Point, color: Rgb, theme: CanvasTheme, scale: number) {
  const radius = 7 * scale, glow = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, radius);
  const core = mixRgb(color, theme.labelRgb, 0.6);
  glow.addColorStop(0, rgba(core, 0.95));
  glow.addColorStop(0.35, rgba(color, 0.5));
  glow.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlow(ctx: CanvasRenderingContext2D, p0: Point, c: Point, p1: Point, edge: EdgeSprite, color: Rgb, frame: EdgeFrame) {
  const { now, scale } = frame;
  ctx.save();
  ctx.setLineDash([3 * scale, 7 * scale]);
  ctx.lineDashOffset = -now / 40;
  ctx.strokeStyle = rgba(color, 0.55);
  ctx.lineWidth = Math.max(0.75, scale);
  strokeCurve(ctx, p0, c, p1);
  ctx.restore();

  const dots = edge.wNorm > 0.66 ? 3 : 2, radius = (1.5 + edge.wNorm * 1.5) * Math.sqrt(scale);
  ctx.save();
  ctx.shadowColor = rgba(color, 0.9);
  ctx.shadowBlur = 6;
  ctx.fillStyle = rgba(color, 0.95);
  for (let index = 0; index < dots; index += 1) {
    const at = bezierPoint(p0, c, p1, (now / 1600 + index / dots) % 1);
    ctx.beginPath();
    ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws all edges for one frame. Returns true while another frame is needed
 * (intro still running, or flowing dots on the active node's edges).
 */
export function drawEdges(ctx: CanvasRenderingContext2D, edges: EdgeSprite[], frame: EdgeFrame): boolean {
  const { theme, curved, animate, introStart, active, positions, scale, now } = frame;
  const elapsed = animate && introStart !== null ? now - introStart : Infinity;
  const introRunning = elapsed < INTRO_TOTAL;
  let hasFlow = false;
  ctx.lineCap = "round";

  const lit: EdgeSprite[] = [];
  ctx.strokeStyle = rgba(theme.dimRgb, theme.edgeAlpha * 0.5);
  for (const edge of edges) {
    if (frame.isLit(edge.source, edge.target)) { lit.push(edge); continue; }
    const p0 = positions.get(edge.source), p1 = positions.get(edge.target);
    if (!p0 || !p1) continue;
    const progress = introRunning ? introProgress(edge, elapsed) : 1;
    if (progress <= 0) continue;
    const [from, to] = edge.targetBc > edge.sourceBc ? [p1, p0] : [p0, p1];
    const c = controlPoint(p0, p1, curved), segment = splitBezier(from, c, to, progress);
    ctx.lineWidth = (0.4 + edge.wNorm) * scale;
    strokeCurve(ctx, segment.p0, segment.c, segment.p1);
  }

  for (const edge of lit) {
    const p0 = positions.get(edge.source), p1 = positions.get(edge.target);
    if (!p0 || !p1) continue;
    const reversed = edge.targetBc > edge.sourceBc;
    const [from, to, fromRgb, toRgb] = reversed ? [p1, p0, edge.targetRgb, edge.sourceRgb] : [p0, p1, edge.sourceRgb, edge.targetRgb];
    const c = controlPoint(p0, p1, curved);
    const progress = introRunning ? introProgress(edge, elapsed) : 1;
    if (progress <= 0) continue;
    const segment = splitBezier(from, c, to, progress);
    // A high floor keeps weak (weight-1) edges clearly visible; weight only adds emphasis.
    const alpha = Math.min(1, theme.edgeAlpha * (0.65 + 0.35 * edge.wNorm) * (active ? 1.3 : 1));
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    gradient.addColorStop(0, rgba(fromRgb, alpha));
    gradient.addColorStop(1, rgba(toRgb, alpha));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = (1.1 + 2.4 * edge.wNorm) * scale;
    strokeCurve(ctx, segment.p0, segment.c, segment.p1);
    if (progress < 1) drawSpark(ctx, segment.p1, toRgb, theme, scale);

    if (animate && active && !introRunning && (edge.source === active || edge.target === active)) {
      const outward = edge.source === active ? { p0, p1, rgb: edge.sourceRgb } : { p0: p1, p1: p0, rgb: edge.targetRgb };
      drawFlow(ctx, outward.p0, c, outward.p1, edge, mixRgb(outward.rgb, theme.labelRgb, 0.35), frame);
      hasFlow = true;
    }
  }
  return introRunning || hasFlow;
}
