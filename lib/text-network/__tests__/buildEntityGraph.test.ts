import { describe, expect, it } from "vitest";
import { analyzeGraph } from "../analytics";
import { buildEntityGraph, entityKey } from "../buildEntityGraph";

const ENTITIES = [
  { id: "e1", name: "Bank Indonesia", type: "ORG", description: "Central bank", sourceId: "a1" },
  { id: "e2", name: "Rupiah", type: "CURRENCY", sourceId: "a1" },
  { id: "e3", name: "bank  indonesia", type: "ORG", sourceId: "a2" },
  { id: "e4", name: "Inflasi", type: "CONCEPT", sourceId: "a2" },
  { id: "e5", name: "Jakarta", type: "PLACE", sourceId: "a2" },
];
const RELATIONS = [
  { id: "r1", source: "e1", target: "e2", type: "ISSUES" },
  { id: "r2", source: "e3", target: "e2", type: "STABILIZES" },
  { id: "r3", source: "e3", target: "e4", type: "CONTROLS" },
  { id: "r3", source: "e3", target: "e4", type: "CONTROLS" },
  { id: "r4", source: "e1", target: "e3", type: "SAME" },
  { id: "r5", source: "e1", target: "missing" },
];

describe("buildEntityGraph", () => {
  const graph = buildEntityGraph(ENTITIES, RELATIONS, { iterations: 20 });
  const bi = entityKey("Bank Indonesia");

  it("creates one node per entity and merges same-name entities across artifacts", () => {
    expect(graph.order).toBe(4);
    expect(graph.getNodeAttributes(bi)).toMatchObject({ label: "Bank Indonesia", kind: "ORG", description: "Central bank", freq: 2, sources: { a1: 1, a2: 1 } });
  });

  it("keeps multi-word names as a single node", () => {
    expect(graph.hasNode("bank")).toBe(false);
  });

  it("turns relations into weighted edges with their types, skipping self-loops, duplicates and unknown ids", () => {
    expect(graph.size).toBe(2);
    const edge = graph.edge(bi, "rupiah")!;
    expect(graph.getEdgeAttributes(edge)).toMatchObject({ weight: 2, wNorm: 1, relations: ["ISSUES", "STABILIZES"] });
    expect(graph.getEdgeAttribute(graph.edge(bi, "inflasi")!, "weight")).toBe(1);
  });

  it("keeps entities without relations", () => {
    expect(graph.degree("jakarta")).toBe(0);
  });

  it("caps nodes by weighted degree", () => {
    const small = buildEntityGraph(ENTITIES, RELATIONS, { maxNodes: 2, iterations: 20 });
    expect(small.nodes().sort()).toEqual([bi, "rupiah"].sort());
  });

  it("works with the analytics and with no relations at all", () => {
    expect(analyzeGraph(graph).structure.nodes).toBe(4);
    const lonely = buildEntityGraph(ENTITIES, [], { iterations: 20 });
    expect(lonely.size).toBe(0);
    expect(analyzeGraph(lonely).structure.topics).toBe(1);
  });
});
