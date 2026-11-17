import type { TextGraph } from "@/lib/text-network/types";

export type Physics = ReturnType<typeof createPhysics>;

const ALPHA_DECAY = 0.03, ALPHA_MIN = 0.005, DRAG_ALPHA = 0.3, VELOCITY_KEEP = 0.6, ANCHOR = 0.08;

/**
 * Obsidian-style "jelly" physics for arranging the 2D graph by hand. Edges are springs whose rest
 * length is the distance they had when the drag began, nodes that get too close push apart, and a
 * weak anchor holds every node near where it was, so a dragged node tugs its neighbours along while
 * the rest of the graph barely moves. The dropped node stays where it was let go.
 * Works in graph coordinates and writes x/y back to the graph once per frame.
 */
export function createPhysics(graph: TextGraph) {
  let nodes: string[] = [], index = new Map<string, number>();
  let x = new Float64Array(0), y = new Float64Array(0), vx = new Float64Array(0), vy = new Float64Array(0);
  let restX = new Float64Array(0), restY = new Float64Array(0);
  let springs: { a: number; b: number; length: number; strength: number; bias: number }[] = [];
  let collide = 0, alpha = 0, alphaTarget = 0;
  // The dragged node stays pinned after release until the graph settles; `dragging` keeps it warm.
  let pinned: { i: number; x: number; y: number } | null = null, dragging = false;
  let frame: number | null = null;

  // Rest state is taken from the current layout, so it follows re-layouts and earlier drags.
  const capture = () => {
    nodes = graph.nodes();
    index = new Map(nodes.map((node, i) => [node, i]));
    x = Float64Array.from(nodes, (node) => graph.getNodeAttribute(node, "x"));
    y = Float64Array.from(nodes, (node) => graph.getNodeAttribute(node, "y"));
    restX = x.slice();
    restY = y.slice();
    vx = new Float64Array(nodes.length);
    vy = new Float64Array(nodes.length);
    const degree = nodes.map((node) => graph.degree(node) || 1);
    springs = graph.mapEdges((_edge, _attributes, source, target) => {
      const a = index.get(source)!, b = index.get(target)!;
      return {
        a, b, length: Math.hypot(x[b] - x[a], y[b] - y[a]) || 1e-6,
        strength: 1 / Math.min(degree[a], degree[b]),
        bias: degree[a] / (degree[a] + degree[b]),
      };
    });
    const lengths = springs.map((spring) => spring.length).sort((p, q) => p - q);
    const spread = Math.hypot(Math.max(...x) - Math.min(...x), Math.max(...y) - Math.min(...y)) / Math.sqrt(nodes.length || 1);
    // Kept below most edge lengths so the first drag doesn't shove apart nodes the layout put close.
    collide = (lengths[Math.floor(lengths.length * 0.2)] ?? spread) * 0.6;
  };

  const tick = () => {
    alpha += (alphaTarget - alpha) * ALPHA_DECAY;
    for (const { a, b, length, strength, bias } of springs) {
      let dx = x[b] + vx[b] - x[a] - vx[a], dy = y[b] + vy[b] - y[a] - vy[a];
      const distance = Math.hypot(dx, dy) || 1e-6, pull = ((distance - length) / distance) * alpha * strength;
      dx *= pull; dy *= pull;
      vx[b] -= dx * bias; vy[b] -= dy * bias;
      vx[a] += dx * (1 - bias); vy[a] += dy * (1 - bias);
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = x[j] - x[i], dy = y[j] - y[i], distance = Math.hypot(dx, dy);
        if (distance >= collide) continue;
        const safe = distance || 1e-6, push = ((collide - safe) / safe) * alpha * 0.5;
        const px = distance ? dx * push : collide * alpha * 0.5, py = distance ? dy * push : 0;
        vx[j] += px; vy[j] += py; vx[i] -= px; vy[i] -= py;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      vx[i] += (restX[i] - x[i]) * ANCHOR * alpha; vy[i] += (restY[i] - y[i]) * ANCHOR * alpha;
      vx[i] *= VELOCITY_KEEP; vy[i] *= VELOCITY_KEEP;
      x[i] += vx[i]; y[i] += vy[i];
    }
    if (pinned) { x[pinned.i] = pinned.x; y[pinned.i] = pinned.y; vx[pinned.i] = vy[pinned.i] = 0; }
    graph.updateEachNodeAttributes((node, attributes) => {
      const i = index.get(node);
      if (i !== undefined) { attributes.x = x[i]; attributes.y = y[i]; }
      return attributes;
    }, { attributes: ["x", "y"] });
  };

  const loop = () => {
    tick();
    frame = dragging || alpha > ALPHA_MIN ? requestAnimationFrame(loop) : null;
    if (frame === null) pinned = null;
  };
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    pinned = null;
    dragging = false;
    alpha = alphaTarget = 0;
  };

  return {
    /** Pins `node` under the cursor and keeps the simulation warm while dragging. */
    drag(node: string, px: number, py: number) {
      if (frame === null) capture();
      const i = index.get(node);
      if (i === undefined) return;
      // A node dropped earlier in this run keeps its new spot instead of drifting back to its anchor.
      if (pinned && pinned.i !== i) { restX[pinned.i] = x[pinned.i]; restY[pinned.i] = y[pinned.i]; }
      pinned = { i, x: px, y: py };
      dragging = true;
      alphaTarget = DRAG_ALPHA;
      alpha = Math.max(alpha, DRAG_ALPHA);
      if (frame === null) frame = requestAnimationFrame(loop);
    },
    /** Lets go of the dragged node; it stays put while the rest of the graph settles around it. */
    release() {
      dragging = false;
      alphaTarget = 0;
    },
    stop,
  };
}
