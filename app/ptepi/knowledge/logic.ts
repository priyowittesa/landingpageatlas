import type { KnowledgeNote, KnowledgeSource, SourceStatus } from "./data";

const sizeFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/** File size the way the upload list shows it: "4,8 MB", "410 KB". */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${sizeFormat.format(mb)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function getSourceStats(sources: KnowledgeSource[]) {
  const count = (status: SourceStatus) => sources.filter((source) => source.status === status).length;
  return {
    total: sources.length,
    ready: count("ready"),
    /** Uploaded or being chunked */
    processing: count("uploaded") + count("chunking"),
    failed: count("failed"),
    totalBytes: sources.reduce((sum, source) => sum + source.size, 0)
  };
}

export type SourceFilter = { folderId: string | null; status: string; query: string };

export function filterSources(sources: KnowledgeSource[], filter: SourceFilter): KnowledgeSource[] {
  const needle = filter.query.trim().toLowerCase();
  return sources.filter(
    (source) =>
      (filter.folderId === null || source.folderId === filter.folderId) &&
      (filter.status === "all" || source.status === filter.status) &&
      (!needle || source.name.toLowerCase().includes(needle))
  );
}

/** Distinct source files that at least one note is built from. */
export function countSourcesUsed(notes: KnowledgeNote[]): number {
  return new Set(notes.flatMap((note) => note.sources)).size;
}

/** Notes that link to this note. */
export function getBacklinks(noteId: string, notes: KnowledgeNote[]): KnowledgeNote[] {
  return notes.filter((note) => note.id !== noteId && note.links.includes(noteId));
}

/** Notes built from this source file. */
export function getNotesFromSource(sourceId: string, notes: KnowledgeNote[]): KnowledgeNote[] {
  return notes.filter((note) => note.sources.includes(sourceId));
}

export type GraphPoint = { id: string; x: number; y: number; degree: number };
export type GraphLink = { id: string; source: string; target: string };

/**
 * Knowledge graph of the notes: one point per note on a circle, one link per pair
 * of linked notes (a link both ways counts once). Degree sizes the point.
 */
export function getKnowledgeGraph(notes: KnowledgeNote[], radius = 260): { points: GraphPoint[]; links: GraphLink[] } {
  const ids = new Set(notes.map((note) => note.id));
  const pairs = new Map<string, GraphLink>();
  for (const note of notes) {
    for (const target of note.links) {
      if (!ids.has(target) || target === note.id) continue;
      const [a, b] = [note.id, target].sort();
      pairs.set(`${a}|${b}`, { id: `${a}|${b}`, source: a, target: b });
    }
  }
  const links = [...pairs.values()];
  const points = notes.map((note, index) => {
    const angle = (2 * Math.PI * index) / notes.length - Math.PI / 2;
    return {
      id: note.id,
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle)),
      degree: links.filter((link) => link.source === note.id || link.target === note.id).length
    };
  });
  return { points, links };
}
