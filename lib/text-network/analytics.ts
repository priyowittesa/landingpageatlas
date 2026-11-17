import { communityColor } from "./palette";
import type { DiscourseCondition, GraphAnalytics, StructuralGap, TextGraph, Topic } from "./types";

const byBetweenness = (graph: TextGraph) => (a: string, b: string) =>
  graph.getNodeAttribute(b, "bc") - graph.getNodeAttribute(a, "bc") || a.localeCompare(b);

export function communityMembers(graph: TextGraph) {
  const members = new Map<number, string[]>();
  graph.forEachNode((node, { community }) => members.set(community, [...(members.get(community) ?? []), node]));
  members.forEach((nodes) => nodes.sort(byBetweenness(graph)));
  return members;
}

export function discourseCondition(concentration: number, modularity: number): DiscourseCondition {
  if (concentration > 0.6 && modularity < 0.4) return "Biased";
  if (modularity < 0.4) return "Focused";
  if (modularity <= 0.65) return "Diversified";
  return "Dispersed";
}

/** Strongest neighbours of a node, sorted by edge weight. */
export function strongestNeighbors(graph: TextGraph, node: string, limit = 12) {
  if (!graph.hasNode(node)) return [];
  return graph
    .mapEdges(node, (_edge, attributes, source, target) => ({ id: source === node ? target : source, weight: attributes.weight, relations: attributes.relations ?? [] }))
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map(({ id, weight, relations }) => ({ id, weight, relations, label: graph.getNodeAttribute(id, "label"), color: graph.getNodeAttribute(id, "color") }));
}

export function analyzeGraph(graph: TextGraph): GraphAnalytics {
  const members = communityMembers(graph);
  const ranked = Array.from(members.entries()).sort((a, b) => a[0] - b[0]);
  const toTopic = ([community, nodes]: [number, string[]], words = 4): Topic => ({
    community,
    color: communityColor(community),
    size: nodes.length,
    percent: graph.order ? (nodes.length / graph.order) * 100 : 0,
    words: nodes.slice(0, words).map((node) => graph.getNodeAttribute(node, "label")),
  });

  const sortedNodes = graph.nodes().sort(byBetweenness(graph));
  const totalBc = sortedNodes.reduce((sum, node) => sum + graph.getNodeAttribute(node, "bc"), 0);
  const topBc = sortedNodes.slice(0, 3).reduce((sum, node) => sum + graph.getNodeAttribute(node, "bc"), 0);
  const concentration = totalBc ? topBc / totalBc : 0;
  const { modularity, communityCount } = graph.getAttributes();

  const candidates = ranked.filter(([, nodes]) => nodes.length >= 3).slice(0, 6);
  const gaps: StructuralGap[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const [ca, nodesA] = candidates[i], [cb, nodesB] = candidates[j];
      let inter = 0;
      for (const node of nodesA) {
        graph.forEachEdge(node, (_edge, { weight }, source, target) => {
          const other = source === node ? target : source;
          if (graph.getNodeAttribute(other, "community") === cb) inter += weight;
        });
      }
      gaps.push({ a: toTopic([ca, nodesA], 3), b: toTopic([cb, nodesB], 3), density: inter / (nodesA.length * nodesB.length) });
    }
  }
  gaps.sort((a, b) => a.density - b.density || a.a.community - b.a.community || a.b.community - b.b.community);

  return {
    topics: ranked.slice(0, 8).map((entry) => toTopic(entry)),
    topNodes: sortedNodes.slice(0, 8).map((node) => {
      const { label, bc, bcNorm, color } = graph.getNodeAttributes(node);
      return { id: node, label, bc, bcNorm, color };
    }),
    structure: {
      nodes: graph.order,
      edges: graph.size,
      topics: communityCount,
      modularity,
      concentration,
      condition: discourseCondition(concentration, modularity),
    },
    gaps: gaps.slice(0, 3),
  };
}
