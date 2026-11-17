import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import forceAtlas2 from "graphology-layout-forceatlas2";
import betweennessCentrality from "graphology-metrics/centrality/betweenness";
import { communityColor } from "./palette";
import { tokenizeLines } from "./tokenize";
import type { BuildGraphOptions, TextEdgeAttributes, TextGraph, TextGraphAttributes, TextLine, TextNodeAttributes } from "./types";

export const DEFAULT_MAX_NODES = 120;
/** Distance 1/2/3 words → weight 3/2/1. */
const WINDOW_WEIGHTS = [3, 2, 1];
const EDGE_SEPARATOR = "\u0000";

/** Deterministic PRNG so Louvain and the layout are reproducible. */
export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const nodeSize = (bcNorm: number) => 3 + 22 * Math.pow(bcNorm, 0.65);

type Cooccurrence = {
  freq: Map<string, number>;
  sources: Map<string, Record<string, number>>;
  edges: Map<string, number>;
};

/** Accumulates word frequencies and sliding-window (4 words) co-occurrence weights, line by line. */
export function countCooccurrences(input: string | TextLine[]): Cooccurrence {
  const freq = new Map<string, number>(), sources = new Map<string, Record<string, number>>(), edges = new Map<string, number>();
  for (const { tokens, sourceId } of tokenizeLines(input)) {
    tokens.forEach((word, index) => {
      freq.set(word, (freq.get(word) ?? 0) + 1);
      if (sourceId) {
        const bySource = sources.get(word) ?? {};
        bySource[sourceId] = (bySource[sourceId] ?? 0) + 1;
        sources.set(word, bySource);
      }
      WINDOW_WEIGHTS.forEach((weight, offset) => {
        const other = tokens[index + offset + 1];
        if (!other || other === word) return;
        const key = word < other ? `${word}${EDGE_SEPARATOR}${other}` : `${other}${EDGE_SEPARATOR}${word}`;
        edges.set(key, (edges.get(key) ?? 0) + weight);
      });
    });
  }
  return { freq, sources, edges };
}

/** Runs ForceAtlas2 from a seeded random start. Mutates x/y of every node. */
export function layoutGraph(graph: TextGraph, seed = 1, iterations = 600) {
  const random = mulberry32(seed * 7919 + 17), radius = Math.sqrt(graph.order) * 10;
  graph.forEachNode((node) => {
    const angle = random() * Math.PI * 2, distance = Math.sqrt(random()) * radius;
    graph.mergeNodeAttributes(node, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
  });
  if (graph.order < 2) return;
  forceAtlas2.assign(graph, {
    iterations,
    getEdgeWeight: "weight",
    settings: {
      ...forceAtlas2.inferSettings(graph),
      gravity: 1.2,
      scalingRatio: 6,
      slowDown: 2,
      outboundAttractionDistribution: true,
      edgeWeightInfluence: 0.6,
    },
  });
}

/**
 * Text → co-occurrence network: top-N words by weighted degree, betweenness centrality,
 * Louvain communities (sorted largest first), palette colours, sizes and a ForceAtlas2 layout.
 */
export function buildGraph(input: string | TextLine[], options: BuildGraphOptions = {}): TextGraph {
  const { maxNodes = DEFAULT_MAX_NODES, seed = 1, iterations = 600 } = options;
  const { freq, sources, edges } = countCooccurrences(input);

  const weightedDegree = new Map<string, number>();
  edges.forEach((weight, key) => {
    const [a, b] = key.split(EDGE_SEPARATOR);
    weightedDegree.set(a, (weightedDegree.get(a) ?? 0) + weight);
    weightedDegree.set(b, (weightedDegree.get(b) ?? 0) + weight);
  });
  const kept = new Set(
    Array.from(weightedDegree.entries())
      .sort((a, b) => b[1] - a[1] || (freq.get(b[0]) ?? 0) - (freq.get(a[0]) ?? 0) || a[0].localeCompare(b[0]))
      .slice(0, Math.max(1, maxNodes))
      .map(([word]) => word),
  );

  const graph: TextGraph = new Graph<TextNodeAttributes, TextEdgeAttributes, TextGraphAttributes>({ type: "undirected" });
  edges.forEach((weight, key) => {
    const [a, b] = key.split(EDGE_SEPARATOR);
    if (!kept.has(a) || !kept.has(b)) return;
    for (const word of [a, b]) {
      if (!graph.hasNode(word)) {
        graph.addNode(word, {
          label: word, freq: freq.get(word) ?? 0, weightedDegree: weightedDegree.get(word) ?? 0, sources: sources.get(word) ?? {},
          bc: 0, bcNorm: 0, community: 0, color: communityColor(0), size: nodeSize(0), x: 0, y: 0,
        });
      }
    }
    graph.addEdgeWithKey(key, a, b, { weight, wNorm: 0 });
  });
  // Nodes are only created through edges, so the graph never contains isolated nodes.

  return finalizeGraph(graph, seed, iterations);
}

/**
 * Shared post-processing for any TextGraph: normalised edge weights, betweenness centrality,
 * Louvain communities (sorted largest first), palette colours, sizes and a ForceAtlas2 layout.
 */
export function finalizeGraph(graph: TextGraph, seed = 1, iterations = 600): TextGraph {
  const maxWeight = Math.max(0, ...graph.mapEdges((_edge, attributes) => attributes.weight));
  graph.forEachEdge((edge, attributes) => graph.setEdgeAttribute(edge, "wNorm", maxWeight ? attributes.weight / maxWeight : 0));

  const bc = graph.order > 2 ? betweennessCentrality(graph, { getEdgeWeight: null, normalized: false }) : {};
  const maxBc = Math.max(0, ...Object.values(bc));

  let modularity = 0, communityCount = 0;
  if (graph.size === 0) {
    // Louvain needs edges; without any, all nodes share one community.
    graph.forEachNode((node) => graph.mergeNodeAttributes(node, { community: 0, color: communityColor(0) }));
    communityCount = Math.min(graph.order, 1);
  } else {
    const detailed = louvain.detailed(graph, { getEdgeWeight: "weight", rng: mulberry32(seed) });
    modularity = detailed.modularity;
    const members = new Map<number, string[]>();
    Object.entries(detailed.communities).forEach(([node, community]) => members.set(community, [...(members.get(community) ?? []), node]));
    const ranked = Array.from(members.values()).sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
    communityCount = ranked.length;
    ranked.forEach((nodes, index) => nodes.forEach((node) => graph.mergeNodeAttributes(node, { community: index, color: communityColor(index) })));
  }

  graph.forEachNode((node) => {
    const raw = bc[node] ?? 0, bcNorm = maxBc ? raw / maxBc : 0;
    graph.mergeNodeAttributes(node, { bc: raw, bcNorm, size: nodeSize(bcNorm) });
  });
  graph.replaceAttributes({ modularity, communityCount, maxWeight });

  layoutGraph(graph, seed, iterations);
  return graph;
}
