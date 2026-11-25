"use client";

import "@xyflow/react/dist/style.css";
import { memo, useMemo, useState } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps
} from "@xyflow/react";
import { ArrowUpRight, FileText, Folder, Link2, Network, Search, Undo2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { useT } from "../../components/Tr";
import type { KnowledgeNote, KnowledgeSource, NoteFolder } from "../../knowledge/data";
import { getBacklinks, getKnowledgeGraph } from "../../knowledge/logic";

/** Folder tones of the graph. The legend names each folder, so color is never the only cue. */
const FOLDER_TONE: Record<string, { dot: string; chip: string }> = {
  delivery: { dot: "bg-primary-600", chip: "bg-primary-50 text-primary-800" },
  commercial: { dot: "bg-emerald-600", chip: "bg-emerald-50 text-emerald-800" },
  procurement: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-900" }
};

type GraphNodeData = { title: string; folderId: string; degree: number; selected: boolean };
type GraphNodeType = Node<GraphNodeData, "note">;

const HIDDEN_HANDLE = "!h-1 !w-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

function GraphNodeComponent({ data }: NodeProps<GraphNodeType>) {
  const size = 18 + data.degree * 4;
  const tone = FOLDER_TONE[data.folderId] ?? FOLDER_TONE.delivery;
  return (
    <div className="flex w-36 cursor-pointer flex-col items-center gap-1.5 text-center">
      <span
        className={cn(
          "relative block rounded-full shadow-sm ring-4 ring-white transition-transform hover:scale-110",
          tone.dot,
          data.selected && "outline outline-2 outline-offset-2 outline-primary-700"
        )}
        style={{ width: size, height: size }}
      >
        <Handle type="target" position={Position.Top} className={cn(HIDDEN_HANDLE, "!top-1/2 !left-1/2")} />
        <Handle type="source" position={Position.Top} className={cn(HIDDEN_HANDLE, "!top-1/2 !left-1/2")} />
      </span>
      <span
        className={cn(
          "rounded-md bg-white/90 px-1.5 text-xs leading-tight",
          data.selected ? "font-semibold text-gray-950" : "text-gray-800"
        )}
      >
        {data.title}
      </span>
    </div>
  );
}

const NODE_TYPES = { note: memo(GraphNodeComponent) };

type KnowledgeBaseWorkspaceProps = {
  folders: NoteFolder[];
  notes: KnowledgeNote[];
  sources: KnowledgeSource[];
};

/** Knowledge Base of the demo: notes by folder, the graph of their links, and one note with its backlinks and sources. */
export function KnowledgeBaseWorkspace({ folders, notes, sources }: KnowledgeBaseWorkspaceProps) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string>("graph");

  const needle = query.trim().toLowerCase();
  const visible = notes.filter((note) => !needle || `${note.title} ${note.summary}`.toLowerCase().includes(needle));
  const note = notes.find((item) => item.id === active) ?? null;

  const openNote = (id: string) => {
    setTabs((current) => (current.includes(id) ? current : [...current, id]));
    setActive(id);
  };
  const closeTab = (id: string) => {
    const next = tabs.filter((tab) => tab !== id);
    setTabs(next);
    if (active === id) setActive(next.at(-1) ?? "graph");
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="ptepi-card h-fit overflow-hidden" aria-label={t("Notes")}>
        <div className="border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-4 py-4">
          <h2 className="text-base font-semibold">{t("Notes")}</h2>
          <div className="relative mt-3">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Search notes")}
              aria-label={t("Search notes")}
              className="h-9 bg-white pl-9"
            />
          </div>
        </div>
        <div className="space-y-4 p-3">
          <button
            type="button"
            onClick={() => setActive("graph")}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
              active === "graph" ? "bg-primary-50 font-semibold text-primary-900" : "text-gray-800 hover:bg-primary-50/60"
            )}
          >
            <Network size={16} aria-hidden className="text-primary-600" />
            {t("Knowledge graph")}
          </button>
          {folders.map((folder) => {
            const items = visible.filter((item) => item.folderId === folder.id);
            if (items.length === 0) return null;
            const tone = FOLDER_TONE[folder.id] ?? FOLDER_TONE.delivery;
            return (
              <div key={folder.id}>
                <p className="flex items-center gap-1.5 px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <Folder size={14} aria-hidden className="text-primary-600" />
                  {t(folder.title)}
                  <span aria-hidden className={cn("ml-auto h-2 w-2 rounded-full", tone.dot)} />
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openNote(item.id)}
                        aria-current={active === item.id ? "true" : undefined}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm",
                          active === item.id ? "bg-primary-50 font-semibold text-primary-900" : "text-gray-800 hover:bg-primary-50/60"
                        )}
                      >
                        <FileText size={14} aria-hidden className="shrink-0 text-gray-500" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {visible.length === 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="w-full cursor-pointer rounded-lg border border-dashed border-primary-200 px-3 py-4 text-sm text-primary-800"
            >
              {t("No note matches. Show all notes")}
            </button>
          )}
        </div>
      </aside>

      <section className="ptepi-card min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-3 pt-2" role="tablist">
          <TabButton selected={active === "graph"} onClick={() => setActive("graph")}>
            <Network size={14} aria-hidden />
            {t("Knowledge graph")}
          </TabButton>
          {tabs.map((id) => {
            const tab = notes.find((item) => item.id === id);
            if (!tab) return null;
            return (
              <span key={id} className="relative flex shrink-0 items-center">
                <TabButton selected={active === id} onClick={() => setActive(id)}>
                  <FileText size={14} aria-hidden />
                  <span className="max-w-44 truncate pr-5">{tab.title}</span>
                </TabButton>
                <button
                  type="button"
                  aria-label={`${t("Close")} ${tab.title}`}
                  onClick={() => closeTab(id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            );
          })}
          <span className="ml-auto pb-2 pl-2">
            <SyntheticDataBadge />
          </span>
        </div>

        {note ? (
          <NoteView note={note} folderTitle={folders.find((folder) => folder.id === note.folderId)?.title ?? ""} notes={notes} sources={sources} onOpen={openNote} onGraph={() => setActive("graph")} />
        ) : (
          <GraphView folders={folders} notes={notes} onOpen={openNote} />
        )}
      </section>
    </div>
  );
}

function TabButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-2 text-sm",
        selected ? "border-primary-100 bg-white font-semibold text-gray-950" : "border-transparent text-gray-700 hover:text-gray-950"
      )}
    >
      {children}
    </button>
  );
}

function GraphView({ folders, notes, onOpen }: { folders: NoteFolder[]; notes: KnowledgeNote[]; onOpen: (id: string) => void }) {
  const t = useT();
  const graph = useMemo(() => getKnowledgeGraph(notes), [notes]);
  const nodes: GraphNodeType[] = useMemo(
    () =>
      graph.points.map((point) => {
        const item = notes.find((note) => note.id === point.id)!;
        return {
          id: point.id,
          type: "note",
          position: { x: point.x, y: point.y },
          data: { title: item.title, folderId: item.folderId, degree: point.degree, selected: false }
        };
      }),
    [graph, notes]
  );
  const edges: Edge[] = useMemo(
    () =>
      graph.links.map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
        type: "straight",
        style: { stroke: "var(--color-primary-300)", strokeWidth: 1.5 }
      })),
    [graph]
  );

  return (
    <div>
      <div className="h-[520px] bg-primary-50/30">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodeClick={(_, node) => onOpen(node.id)}
          nodesConnectable={false}
          edgesFocusable={false}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.4}
          maxZoom={1.6}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="var(--color-primary-200)" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-primary-100/60 px-6 py-3 text-sm text-gray-700">
        {folders.map((folder) => (
          <span key={folder.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", (FOLDER_TONE[folder.id] ?? FOLDER_TONE.delivery).dot)} />
            {t(folder.title)}
          </span>
        ))}
        <span className="ml-auto text-muted-foreground">
          {notes.length} {t("notes")} · {graph.links.length} {t("links")} · {t("Bigger point, more links. Click a point to open the note.")}
        </span>
      </div>
    </div>
  );
}

function NoteView({
  note,
  folderTitle,
  notes,
  sources,
  onOpen,
  onGraph
}: {
  note: KnowledgeNote;
  folderTitle: string;
  notes: KnowledgeNote[];
  sources: KnowledgeSource[];
  onOpen: (id: string) => void;
  onGraph: () => void;
}) {
  const t = useT();
  const tone = FOLDER_TONE[note.folderId] ?? FOLDER_TONE.delivery;
  const linked = note.links.map((id) => notes.find((item) => item.id === id)).filter((item): item is KnowledgeNote => Boolean(item));
  const backlinks = getBacklinks(note.id, notes);
  const fromSources = note.sources.map((id) => sources.find((source) => source.id === id)).filter((item): item is KnowledgeSource => Boolean(item));

  return (
    <article className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <p className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", tone.chip)}>{t(folderTitle)}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">{note.title}</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-800">{note.summary}</p>
        <h3 className="mt-6 text-sm font-semibold text-gray-950">{t("Key points")}</h3>
        <ul className="mt-2 max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-800">
          {note.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <h3 className="mt-6 text-sm font-semibold text-gray-950">{t("Linked notes")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {linked.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-sm text-primary-900 hover:border-primary-300"
            >
              <Link2 size={14} aria-hidden />
              {item.title}
            </button>
          ))}
        </div>
        <button type="button" onClick={onGraph} className="mt-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary-800 hover:underline">
          <Undo2 size={16} aria-hidden />
          {t("Back to the knowledge graph")}
        </button>
      </div>

      <aside className="space-y-5 rounded-xl border border-primary-100 bg-primary-50/40 p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("Backlinks")}</h3>
          <ul className="mt-2 space-y-1">
            {backlinks.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onOpen(item.id)} className="cursor-pointer text-left text-sm text-primary-800 hover:underline">
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("Built from")}</h3>
          <ul className="mt-2 space-y-2">
            {fromSources.map((source) => (
              <li key={source.id} className="flex items-start gap-2 text-sm text-gray-800">
                <FileText size={14} aria-hidden className="mt-0.5 shrink-0 text-primary-700" />
                <span className="min-w-0 break-words">{source.name}</span>
              </li>
            ))}
          </ul>
          <Link href="/ptepi/knowledge-source" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-800 hover:underline">
            {t("Open Knowledge Source")}
            <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>
      </aside>
    </article>
  );
}
