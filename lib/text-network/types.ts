import type Graph from "graphology";

/** A line of input text, optionally tagged with where it came from (e.g. an artifact id). */
export type TextLine = { text: string; sourceId?: string };

export type TextNodeAttributes = {
  label: string;
  /** Number of occurrences in the text. */
  freq: number;
  /** Sum of co-occurrence weights of incident edges (before top-N filtering). */
  weightedDegree: number;
  /** Raw (unweighted) betweenness centrality. */
  bc: number;
  /** bc / max(bc), 0..1. */
  bcNorm: number;
  /** Community index, 0 = largest. */
  community: number;
  color: string;
  size: number;
  x: number;
  y: number;
  /** Occurrence count per source id. */
  sources: Record<string, number>;
  /** Entity graphs only: entity type (e.g. PERSON). */
  kind?: string;
  /** Entity graphs only. */
  description?: string;
};

export type TextEdgeAttributes = {
  weight: number;
  /** weight / max(weight), 0..1. */
  wNorm: number;
  /** Entity graphs only: distinct relation types along this edge. */
  relations?: string[];
};

/** An entity for buildEntityGraph; entities with the same name (case-insensitive) become one node. */
export type EntityInput = { id: string; name: string; type?: string; description?: string; sourceId?: string };
/** A relation between two EntityInput ids. */
export type RelationInput = { id: string; source: string; target: string; type?: string };

export type TextGraphAttributes = {
  modularity: number;
  communityCount: number;
  maxWeight: number;
};

export type TextGraph = Graph<TextNodeAttributes, TextEdgeAttributes, TextGraphAttributes>;

export type BuildGraphOptions = {
  /** Keep the N nodes with the highest weighted degree. Default 120. */
  maxNodes?: number;
  /** Seed for Louvain and the initial layout. Default 1. */
  seed?: number;
  /** ForceAtlas2 iterations. Default 600. */
  iterations?: number;
};

export type Topic = {
  community: number;
  color: string;
  size: number;
  /** Share of nodes, 0..100. */
  percent: number;
  words: string[];
};

export type DiscourseCondition = "Biased" | "Focused" | "Diversified" | "Dispersed";

export type StructuralGap = {
  a: Topic;
  b: Topic;
  /** Inter-cluster weight / (size A × size B). */
  density: number;
};

export type GraphAnalytics = {
  topics: Topic[];
  topNodes: { id: string; label: string; bc: number; bcNorm: number; color: string }[];
  structure: {
    nodes: number;
    edges: number;
    topics: number;
    modularity: number;
    /** Share of total betweenness held by the 3 most central nodes, 0..1. */
    concentration: number;
    condition: DiscourseCondition;
  };
  gaps: StructuralGap[];
};
