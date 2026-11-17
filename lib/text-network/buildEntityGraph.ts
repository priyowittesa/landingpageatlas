import Graph from "graphology";
import { DEFAULT_MAX_NODES, finalizeGraph, nodeSize } from "./buildGraph";
import { communityColor } from "./palette";
import type { BuildGraphOptions, EntityInput, RelationInput, TextEdgeAttributes, TextGraph, TextGraphAttributes, TextNodeAttributes } from "./types";

const EDGE_SEPARATOR = "\u0000";

/** Entities sharing a name (case- and whitespace-insensitive) are merged across artifacts. */
export const entityKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

type MergedEntity = { label: string; types: Map<string, number>; description?: string; mentions: number; sources: Record<string, number> };

const mostCommon = (counts: Map<string, number>) =>
  Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];

/**
 * Entities → network: one node per (merged) entity, one edge per related pair (weight = number of
 * relations). Keeps the top-N nodes by weighted degree, including entities without relations.
 */
export function buildEntityGraph(entities: EntityInput[], relations: RelationInput[], options: BuildGraphOptions = {}): TextGraph {
  const { maxNodes = DEFAULT_MAX_NODES, seed = 1, iterations = 600 } = options;

  const keyById = new Map<string, string>();
  const merged = new Map<string, MergedEntity>();
  for (const entity of entities) {
    const key = entityKey(entity.name);
    if (!key) continue;
    keyById.set(entity.id, key);
    const node: MergedEntity = merged.get(key) ?? { label: entity.name.trim(), types: new Map(), mentions: 0, sources: {} };
    node.mentions += 1;
    if (entity.type) node.types.set(entity.type, (node.types.get(entity.type) ?? 0) + 1);
    if (!node.description && entity.description?.trim()) node.description = entity.description.trim();
    if (entity.sourceId) node.sources[entity.sourceId] = (node.sources[entity.sourceId] ?? 0) + 1;
    merged.set(key, node);
  }

  const edges = new Map<string, { weight: number; relations: Set<string> }>();
  const seen = new Set<string>();
  for (const relation of relations) {
    const a = keyById.get(relation.source), b = keyById.get(relation.target);
    if (!a || !b || a === b || seen.has(relation.id)) continue;
    seen.add(relation.id);
    const key = a < b ? `${a}${EDGE_SEPARATOR}${b}` : `${b}${EDGE_SEPARATOR}${a}`;
    const edge = edges.get(key) ?? { weight: 0, relations: new Set<string>() };
    edge.weight += 1;
    if (relation.type) edge.relations.add(relation.type);
    edges.set(key, edge);
  }

  const weightedDegree = new Map<string, number>();
  edges.forEach(({ weight }, key) => {
    for (const node of key.split(EDGE_SEPARATOR)) weightedDegree.set(node, (weightedDegree.get(node) ?? 0) + weight);
  });
  const kept = Array.from(merged.keys())
    .sort((a, b) => (weightedDegree.get(b) ?? 0) - (weightedDegree.get(a) ?? 0) || merged.get(b)!.mentions - merged.get(a)!.mentions || a.localeCompare(b))
    .slice(0, Math.max(1, maxNodes));

  const graph: TextGraph = new Graph<TextNodeAttributes, TextEdgeAttributes, TextGraphAttributes>({ type: "undirected" });
  for (const key of kept) {
    const { label, types, description, mentions, sources } = merged.get(key)!;
    graph.addNode(key, {
      // An empty kind still marks the node as an entity.
      label, kind: mostCommon(types) ?? "", description, freq: mentions, weightedDegree: weightedDegree.get(key) ?? 0, sources,
      bc: 0, bcNorm: 0, community: 0, color: communityColor(0), size: nodeSize(0), x: 0, y: 0,
    });
  }
  edges.forEach(({ weight, relations: types }, key) => {
    const [a, b] = key.split(EDGE_SEPARATOR);
    if (graph.hasNode(a) && graph.hasNode(b)) graph.addEdgeWithKey(key, a, b, { weight, wNorm: 0, relations: Array.from(types).sort() });
  });

  return finalizeGraph(graph, seed, iterations);
}
