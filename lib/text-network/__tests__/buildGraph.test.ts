import { describe, expect, it } from "vitest";
import { analyzeGraph, discourseCondition } from "../analytics";
import { buildGraph, countCooccurrences, nodeSize } from "../buildGraph";
import { COMMUNITY_PALETTE } from "../palette";

const SAMPLE = [
  "knowledge graph connects entities relations",
  "knowledge graph visualizes entities",
  "graph layout forceatlas places nodes",
  "community detection louvain finds clusters",
  "louvain clusters modularity community",
  "betweenness centrality bridges clusters graph",
].join("\n");

describe("countCooccurrences", () => {
  it("weights distance 1/2/3 as 3/2/1 inside a 4-word window", () => {
    const { edges } = countCooccurrences("alpha bravo charlie delta echo");
    const weight = (a: string, b: string) => edges.get(a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);
    expect(weight("alpha", "bravo")).toBe(3);
    expect(weight("alpha", "charlie")).toBe(2);
    expect(weight("alpha", "delta")).toBe(1);
    expect(weight("alpha", "echo")).toBeUndefined();
  });

  it("accumulates weights and never crosses lines", () => {
    const { edges, freq } = countCooccurrences("alpha bravo\nalpha bravo\ncharlie");
    expect(edges.get("alpha\u0000bravo")).toBe(6);
    expect(freq.get("charlie")).toBe(1);
    expect(Array.from(edges.keys()).some((key) => key.includes("charlie"))).toBe(false);
  });

  it("tracks per-source occurrences", () => {
    const { sources } = countCooccurrences([{ text: "alpha bravo", sourceId: "a" }, { text: "alpha", sourceId: "b" }]);
    expect(sources.get("alpha")).toEqual({ a: 1, b: 1 });
  });
});

describe("buildGraph", () => {
  const graph = buildGraph(SAMPLE, { iterations: 50 });

  it("builds an undirected graph without isolated nodes", () => {
    expect(graph.type).toBe("undirected");
    expect(graph.order).toBeGreaterThan(5);
    graph.forEachNode((node) => expect(graph.degree(node)).toBeGreaterThan(0));
  });

  it("normalises betweenness and derives sizes", () => {
    const values = graph.mapNodes((_node, attributes) => attributes.bcNorm);
    expect(Math.max(...values)).toBeCloseTo(1);
    graph.forEachNode((_node, { bcNorm, size }) => {
      expect(bcNorm).toBeGreaterThanOrEqual(0);
      expect(size).toBeCloseTo(nodeSize(bcNorm));
    });
    expect(graph.getNodeAttribute("graph", "bcNorm")).toBe(1);
  });

  it("orders communities from largest and colours them from the palette", () => {
    const sizes = new Map<number, number>();
    graph.forEachNode((_node, { community, color }) => {
      sizes.set(community, (sizes.get(community) ?? 0) + 1);
      expect(color).toBe(COMMUNITY_PALETTE[community % COMMUNITY_PALETTE.length]);
    });
    const ordered = Array.from(sizes.entries()).sort((a, b) => a[0] - b[0]).map(([, size]) => size);
    expect(ordered).toEqual([...ordered].sort((a, b) => b - a));
    expect(graph.getAttribute("communityCount")).toBe(sizes.size);
  });

  it("keeps only the top-N nodes by weighted degree", () => {
    const small = buildGraph(SAMPLE, { maxNodes: 4, iterations: 10 });
    expect(small.order).toBeLessThanOrEqual(4);
    expect(small.hasNode("graph")).toBe(true);
  });

  it("is deterministic for the same seed and assigns finite positions", () => {
    const again = buildGraph(SAMPLE, { iterations: 50 });
    graph.forEachNode((node, { x, y, community }) => {
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(again.getNodeAttributes(node)).toMatchObject({ x, y, community });
    });
  });

  it("handles empty input", () => {
    const empty = buildGraph("the and of");
    expect(empty.order).toBe(0);
    expect(analyzeGraph(empty).structure.nodes).toBe(0);
  });
});

describe("analyzeGraph", () => {
  it("reports topics, top nodes and structure", () => {
    const analytics = analyzeGraph(buildGraph(SAMPLE, { iterations: 50 }));
    expect(analytics.topics.length).toBeGreaterThan(0);
    expect(analytics.topics.length).toBeLessThanOrEqual(8);
    expect(analytics.topNodes[0].label).toBe("graph");
    expect(analytics.topNodes.length).toBeLessThanOrEqual(8);
    expect(analytics.structure.concentration).toBeGreaterThan(0);
    expect(analytics.structure.concentration).toBeLessThanOrEqual(1);
  });

  it("classifies the discourse condition", () => {
    expect(discourseCondition(0.7, 0.3)).toBe("Biased");
    expect(discourseCondition(0.5, 0.3)).toBe("Focused");
    expect(discourseCondition(0.5, 0.5)).toBe("Diversified");
    expect(discourseCondition(0.5, 0.7)).toBe("Dispersed");
  });
});
