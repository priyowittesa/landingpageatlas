import { describe, expect, it } from "vitest";
import { NOTES, SOURCE_FOLDERS, SOURCES } from "./data";
import {
  filterSources,
  formatFileSize,
  countSourcesUsed,
  getBacklinks,
  getKnowledgeGraph,
  getNotesFromSource,
  getSourceStats
} from "./logic";

describe("knowledge data", () => {
  it("links notes to notes and sources that exist", () => {
    const noteIds = new Set(NOTES.map((note) => note.id));
    const sourceIds = new Set(SOURCES.map((source) => source.id));
    for (const note of NOTES) {
      expect(note.links.every((id) => noteIds.has(id))).toBe(true);
      expect(note.sources.every((id) => sourceIds.has(id))).toBe(true);
    }
    const folderIds = new Set(SOURCE_FOLDERS.map((folder) => folder.id));
    expect(SOURCES.every((source) => folderIds.has(source.folderId))).toBe(true);
  });
});

describe("knowledge sources", () => {
  it("formats sizes in MB with a comma, small files in KB", () => {
    expect(formatFileSize(4.8 * 1024 * 1024)).toBe("4,8 MB");
    expect(formatFileSize(0.4 * 1024 * 1024)).toBe("410 KB");
  });

  it("counts files by processing status", () => {
    const stats = getSourceStats(SOURCES);
    expect(stats.total).toBe(16);
    expect(stats.ready + stats.processing + stats.failed).toBe(stats.total);
    expect(stats.failed).toBe(1);
    expect(stats.processing).toBe(2);
  });

  it("filters by folder, status and name", () => {
    expect(filterSources(SOURCES, { folderId: "policies", status: "all", query: "" })).toHaveLength(3);
    expect(filterSources(SOURCES, { folderId: null, status: "failed", query: "" }).map((source) => source.id)).toEqual(["src-13"]);
    expect(filterSources(SOURCES, { folderId: null, status: "all", query: "pnp126" })).toHaveLength(4);
  });
});

describe("knowledge base", () => {
  it("finds backlinks and the notes built from a source", () => {
    expect(getBacklinks("n-thresholds", NOTES).map((note) => note.id)).toEqual(["n-scurve"]);
    expect(getNotesFromSource("src-14", NOTES).map((note) => note.id)).toEqual(["n-termin", "n-billing"]);
  });

  it("counts the source files the notes use", () => {
    expect(countSourcesUsed(NOTES)).toBe(14);
  });

  it("draws one point per note and each linked pair once", () => {
    const graph = getKnowledgeGraph(NOTES);
    expect(graph.points).toHaveLength(NOTES.length);
    const ids = graph.links.map((link) => link.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("n-billing|n-termin");
    expect(graph.points.find((point) => point.id === "n-pnp126")?.degree).toBe(4);
  });
});
