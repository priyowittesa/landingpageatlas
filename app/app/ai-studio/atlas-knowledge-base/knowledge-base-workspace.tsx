"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type cytoscape from "cytoscape";
import type { Core, ElementDefinition } from "cytoscape";
import {
  ChevronDown, ChevronRight, FilePlus2, Folder, FolderPlus, GitFork,
  MoreVertical, Pencil, Search, Upload, X, Eye, Network, FileText, Trash2, CheckCircle2, AlertCircle, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MarkdownPreview } from "@/components/markdown-preview";

type Note = { id: string; name: string; folder: string; content: string };
type Tab = { id: string; kind: "graph" | "note" };
type ManageTarget = { kind: "file" | "folder"; id: string; label: string; action: "rename" | "delete" };
type CreateTarget = { kind: "file" | "folder"; folder?: string };
type UploadResult = { name: string; status: "success" | "error"; message?: string };

const starterNotes: Note[] = [
  { id: "a1", name: "DesignAtlas.md", folder: "Product", content: `# DesignAtlas\n\n> Canonical reference for the ATLAS design system.\n\n## Principles\n\n- Keep interfaces focused and predictable.\n- Use shared tokens instead of one-off values.\n- Make every workflow keyboard friendly.\n\n## Connected documents\n\n[[Knowledge Architecture]] · [[Research Notes]]\n\n## Component guidance\n\n| Component | Guideline |\n| --- | --- |\n| Button | Use one primary action per surface |\n| Navigation | Preserve context and current location |\n| Forms | Validate near the relevant field |\n` },
  { id: "a2", name: "Knowledge Architecture.md", folder: "Product", content: "# Knowledge Architecture\n\nThe knowledge base connects people, projects, decisions, and source material through backlinks." },
  { id: "b1", name: "Customer Interviews.md", folder: "Research", content: "# Customer Interviews\n\n## Themes\n\n- Faster discovery\n- Clear ownership\n- Trustworthy references" },
  { id: "b2", name: "Research Notes.md", folder: "Research", content: "# Research Notes\n\nLinked to [[DesignAtlas]] and [[Customer Interviews]]." },
  { id: "c1", name: "Weekly Planning.md", folder: "Operations", content: "# Weekly Planning\n\n- [ ] Review new sources\n- [ ] Connect orphan notes\n- [ ] Publish decisions" },
];

const colors = ["#16a34a", "#7c3aed", "#2563eb", "#ea580c", "#db2777"];

export function KnowledgeBaseWorkspace() {
  const [notes, setNotes] = useState<Note[]>(starterNotes);
  const [folders, setFolders] = useState(["Product", "Research", "Operations"]);
  const [openFolders, setOpenFolders] = useState<string[]>(folders);
  const [tabs, setTabs] = useState<Tab[]>([{ id: "graph", kind: "graph" }]);
  const [active, setActive] = useState("graph");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [manageTarget, setManageTarget] = useState<ManageTarget | null>(null);
  const [manageName, setManageName] = useState("");
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const [createName, setCreateName] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null);
  const [folderDropTarget, setFolderDropTarget] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const storageReady = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem("atlas-knowledge-base");
        if (stored) { const data = JSON.parse(stored); setNotes(data.notes); setFolders(data.folders); }
      } finally { storageReady.current = true; }
    });
  }, []);
  useEffect(() => {
    if (storageReady.current) localStorage.setItem("atlas-knowledge-base", JSON.stringify({ notes, folders }));
  }, [notes, folders]);

  const current = notes.find((note) => note.id === active);
  const filtered = notes.filter((note) => note.name.toLowerCase().includes(query.toLowerCase()));

  function openNote(note: Note) {
    if (!tabs.some((tab) => tab.id === note.id)) setTabs((value) => [...value, { id: note.id, kind: "note" }]);
    setActive(note.id); setEditing(false);
  }
  function closeTab(id: string) {
    const next = tabs.filter((tab) => tab.id !== id);
    setTabs(next.length ? next : [{ id: "graph", kind: "graph" }]);
    if (active === id) setActive((next.at(-1)?.id) ?? "graph");
  }
  function newFolder() {
    setCreateName("");
    setCreateTarget({ kind: "folder" });
  }
  function newNote(folder = folders[0] ?? "Notes") {
    setCreateName("");
    setCreateTarget({ kind: "file", folder });
  }
  function submitCreate() {
    if (!createTarget || !createName.trim()) return;
    const name = createName.trim();
    if (createTarget.kind === "folder") {
      if (folders.some((folder) => folder.toLowerCase() === name.toLowerCase())) return;
      setFolders((items) => [...items, name]);
      setOpenFolders((items) => [...items, name]);
      setCreateTarget(null);
      return;
    }
    const folder = createTarget.folder ?? folders[0] ?? "Notes";
    const filename = name.endsWith(".md") ? name : `${name}.md`;
    if (notes.some((note) => note.folder === folder && note.name.toLowerCase() === filename.toLowerCase())) return;
    const note = { id: crypto.randomUUID(), name: filename, folder, content: `# ${name.replace(/\.md$/, "")}\n\nStart writing here...` };
    setNotes((v) => [...v, note]); openNote(note); setEditing(true);
    setCreateTarget(null);
  }
  function uploadFiles(files: FileList | File[] | null) {
    [...(files ?? [])].forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !["md", "txt", "csv"].includes(extension)) {
        setUploadResults((items) => [...items, { name: file.name, status: "error", message: "Unsupported format" }]);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadResults((items) => [...items, { name: file.name, status: "error", message: "File exceeds 50 MB" }]);
        return;
      }
      file.text().then((content) => {
        setNotes((items) => [...items, { id: crypto.randomUUID(), name: file.name, folder: folders[0] ?? "Notes", content }]);
        setUploadResults((items) => [...items, { name: file.name, status: "success" }]);
      }).catch(() => setUploadResults((items) => [...items, { name: file.name, status: "error", message: "Unable to read file" }]));
    });
  }
  function openManage(target: ManageTarget) {
    setManageTarget(target);
    setManageName(target.label);
  }
  function submitManage() {
    if (!manageTarget) return;
    if (manageTarget.action === "rename") {
      const value = manageName.trim();
      if (!value) return;
      if (manageTarget.kind === "folder") {
        setFolders((items) => items.map((folder) => folder === manageTarget.id ? value : folder));
        setNotes((items) => items.map((note) => note.folder === manageTarget.id ? { ...note, folder: value } : note));
        setOpenFolders((items) => items.map((folder) => folder === manageTarget.id ? value : folder));
      } else {
        const filename = value.endsWith(".md") ? value : `${value}.md`;
        setNotes((items) => items.map((note) => note.id === manageTarget.id ? { ...note, name: filename } : note));
      }
    } else if (manageTarget.kind === "folder") {
      const removedIds = new Set(notes.filter((note) => note.folder === manageTarget.id).map((note) => note.id));
      setFolders((items) => items.filter((folder) => folder !== manageTarget.id));
      setNotes((items) => items.filter((note) => !removedIds.has(note.id)));
      setTabs((items) => { const next = items.filter((tab) => !removedIds.has(tab.id)); return next.length ? next : [{ id: "graph", kind: "graph" }]; });
      if (removedIds.has(active)) setActive("graph");
    } else {
      setNotes((items) => items.filter((note) => note.id !== manageTarget.id));
      setTabs((items) => { const next = items.filter((tab) => tab.id !== manageTarget.id); return next.length ? next : [{ id: "graph", kind: "graph" }]; });
      if (active === manageTarget.id) setActive("graph");
    }
    setManageTarget(null);
  }
  function reorderFolder(target: string) {
    if (!draggedFolder || draggedFolder === target) return;
    setFolders((items) => {
      const next = items.filter((folder) => folder !== draggedFolder);
      const targetIndex = next.indexOf(target);
      next.splice(targetIndex, 0, draggedFolder);
      return next;
    });
    setDraggedFolder(null);
    setFolderDropTarget(null);
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-[#fbfbfc]">
        <div className="p-4 pb-2 text-xs font-medium text-gray-500">Knowledge Directory</div>
        <div className="flex gap-2 px-4 py-3">
          <ToolButton title="New File" onClick={() => newNote()}><FilePlus2 /></ToolButton>
          <ToolButton title="New Folder" onClick={newFolder}><FolderPlus /></ToolButton>
          <ToolButton title="Upload File" onClick={() => { setUploadResults([]); setUploadOpen(true); }}><Upload /></ToolButton>
          <ToolButton title="Graph View" onClick={() => { setActive("graph"); if (!tabs.some(t => t.id === "graph")) setTabs(v => [{ id: "graph", kind: "graph" }, ...v]); }}><GitFork /></ToolButton>
          <input ref={fileInput} type="file" accept=".md,.txt,.csv" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />
        </div>
        <label className="mx-4 mb-3 flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-gray-400 shadow-sm focus-within:ring-2 focus-within:ring-primary-200">
          <Search className="h-4 w-4" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none" />
        </label>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {folders.map((folder) => {
            const expanded = openFolders.includes(folder); const folderNotes = filtered.filter((n) => n.folder === folder);
            return <div key={folder} onDragOver={(event) => { event.preventDefault(); if (draggedFolder !== folder) setFolderDropTarget(folder); }} onDragLeave={() => { if (folderDropTarget === folder) setFolderDropTarget(null); }} onDrop={(event) => { event.preventDefault(); reorderFolder(folder); }} className={cn("mb-1 rounded-md transition-all", folderDropTarget === folder && "border-t-2 border-primary-500 pt-1")}>
              <div className={cn("group flex h-8 items-center rounded-md px-1 text-sm hover:bg-gray-100", draggedFolder === folder && "opacity-40")}>
                <span draggable onDragStart={(event) => { setDraggedFolder(folder); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", folder); }} onDragEnd={() => { setDraggedFolder(null); setFolderDropTarget(null); }} title="Drag to reorder" className="cursor-grab rounded p-0.5 text-gray-300 opacity-0 hover:text-gray-600 active:cursor-grabbing group-hover:opacity-100"><GripVertical className="h-3.5 w-3.5" /></span>
                <button className="flex min-w-0 flex-1 items-center gap-1.5" onClick={() => setOpenFolders(v => expanded ? v.filter(x => x !== folder) : [...v, folder])}>
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<Folder className="h-4 w-4 text-primary-600" /><span className="truncate">{folder}</span>
                </button><DirectoryActions onNew={() => newNote(folder)} onRename={() => openManage({ kind: "folder", id: folder, label: folder, action: "rename" })} onDelete={() => openManage({ kind: "folder", id: folder, label: folder, action: "delete" })} />
              </div>
              {expanded && <div className="ml-4 border-l pl-2">{folderNotes.map((note) => <div key={note.id} className={cn("group flex h-8 items-center rounded-md", active === note.id ? "bg-primary-100 text-primary-800" : "text-gray-600 hover:bg-gray-100")}><button onClick={() => openNote(note)} className="flex min-w-0 flex-1 items-center gap-2 px-2 text-left text-sm"><FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{note.name}</span></button><DirectoryActions onRename={() => openManage({ kind: "file", id: note.id, label: note.name, action: "rename" })} onDelete={() => openManage({ kind: "file", id: note.id, label: note.name, action: "delete" })} /></div>)}</div>}
            </div>;
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-end border-b bg-[#fcfcfd] px-1">
          {tabs.map((tab) => { const label = tab.kind === "graph" ? "Graph View" : notes.find(n => n.id === tab.id)?.name ?? "Note"; return <button key={tab.id} onClick={() => setActive(tab.id)} className={cn("group flex h-10 max-w-52 items-center gap-2 border-b-2 px-4 text-sm", active === tab.id ? "border-primary-600 bg-white text-primary-700" : "border-transparent text-gray-500 hover:bg-gray-50")}>
            {tab.kind === "graph" ? <Network className="h-4 w-4" /> : <FileText className="h-4 w-4" />}<span className="truncate">{label}</span><span onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="rounded p-0.5 opacity-0 hover:bg-gray-200 group-hover:opacity-100"><X className="h-3.5 w-3.5" /></span>
          </button>; })}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {active === "graph" ? <Graph key={notes.map(n => n.id).join("-")} notes={notes} onOpen={openNote} /> : current ? <NoteView note={current} editing={editing} setEditing={setEditing} onChange={(content) => setNotes(v => v.map(n => n.id === current.id ? { ...n, content } : n))} /> : <Empty onCreate={() => newNote()} onUpload={() => { setUploadResults([]); setUploadOpen(true); }} />}
        </div>
      </section>
      <Dialog open={!!manageTarget} onOpenChange={(open) => { if (!open) setManageTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{manageTarget?.action === "rename" ? `Rename ${manageTarget.kind}` : `Delete ${manageTarget?.kind}`}</DialogTitle>
            <DialogDescription>{manageTarget?.action === "rename" ? "Enter a new name below." : manageTarget?.kind === "folder" ? "This folder and every file inside it will be deleted." : "This file will be permanently removed from the knowledge base."}</DialogDescription>
          </DialogHeader>
          {manageTarget?.action === "rename" && <input autoFocus value={manageName} onChange={(event) => setManageName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitManage(); }} className="h-10 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary-200" />}
          {manageTarget?.action === "delete" && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700"><span className="font-semibold">{manageTarget.label}</span> cannot be recovered after deletion.</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageTarget(null)}>Cancel</Button>
            <Button variant={manageTarget?.action === "delete" ? "destructive" : "default"} onClick={submitManage} disabled={manageTarget?.action === "rename" && !manageName.trim()}>{manageTarget?.action === "delete" ? "Delete" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!createTarget} onOpenChange={(open) => { if (!open) setCreateTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new {createTarget?.kind}</DialogTitle>
            <DialogDescription>{createTarget?.kind === "file" ? `The file will be created inside ${createTarget.folder ?? folders[0] ?? "Notes"}.` : "Add a folder to organize your knowledge documents."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="knowledge-create-name" className="text-sm font-medium text-gray-700">{createTarget?.kind === "file" ? "File name" : "Folder name"}</label>
            <input id="knowledge-create-name" autoFocus value={createName} onChange={(event) => setCreateName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitCreate(); }} placeholder={createTarget?.kind === "file" ? "Untitled.md" : "New folder"} className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary-200" />
            {createTarget?.kind === "file" && <p className="text-xs text-gray-400">The .md extension is added automatically.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTarget(null)}>Cancel</Button>
            <Button onClick={submitCreate} disabled={!createName.trim()}>Create {createTarget?.kind}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Files</DialogTitle>
            <DialogDescription className="sr-only">Upload knowledge files using drag and drop or the file browser.</DialogDescription>
          </DialogHeader>
          <div
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false); }}
            onDrop={(event) => { event.preventDefault(); setDragActive(false); uploadFiles([...event.dataTransfer.files]); }}
            className={cn("flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center transition-colors", dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 bg-white")}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700"><Upload className="h-6 w-6" /></div>
            <p className="font-semibold text-gray-800">Drag & drop your files here</p>
            <p className="mt-1 text-sm text-gray-400">Your files will be automatically processed</p>
          </div>
          <div className="flex items-center gap-3 py-1 text-xs text-gray-400"><span className="h-px flex-1 bg-gray-200" /><span>or</span><span className="h-px flex-1 bg-gray-200" /></div>
          <div className="text-center"><Button variant="secondary" onClick={() => fileInput.current?.click()} className="px-6">Browse Files</Button></div>
          {uploadResults.length > 0 && <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border p-2">{uploadResults.map((result, index) => <div key={`${result.name}-${index}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">{result.status === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}<span className="min-w-0 flex-1 truncate text-left text-gray-700">{result.name}</span><span className={result.status === "success" ? "text-xs text-green-600" : "text-xs text-red-600"}>{result.status === "success" ? "Uploaded" : result.message}</span></div>)}</div>}
          <p className="text-center text-xs text-gray-400">Supported formats: MD, TXT, CSV — Max 50 MB per file</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DirectoryActions({ onNew, onRename, onDelete }: { onNew?: () => void; onRename: () => void; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><button onClick={(event) => event.stopPropagation()} className="mr-1 rounded p-1 text-gray-400 opacity-0 hover:bg-white hover:text-primary-700 group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="More actions"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-36">
    {onNew && <DropdownMenuItem onSelect={onNew}><FilePlus2 className="h-4 w-4" />New file</DropdownMenuItem>}
    <DropdownMenuItem onSelect={onRename}><Pencil className="h-4 w-4" />Rename</DropdownMenuItem>
    <DropdownMenuItem onSelect={onDelete} className="text-red-600 focus:text-red-700"><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>;
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return <button title={title} onClick={onClick} className="group relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-white shadow-sm transition hover:bg-primary-800 [&_svg]:h-4 [&_svg]:w-4"><span className="pointer-events-none absolute left-1/2 top-11 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-950 px-2 py-1 text-xs group-hover:block">{title}</span>{children}</button>;
}

function NoteView({ note, editing, setEditing, onChange }: { note: Note; editing: boolean; setEditing: (v: boolean) => void; onChange: (v: string) => void }) {
  return <div className="mx-auto max-w-4xl px-10 py-8">
    <div className="mb-6 flex justify-end"><button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{editing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}{editing ? "Preview" : "Edit"}</button></div>
    {editing ? <textarea autoFocus value={note.content} onChange={(e) => onChange(e.target.value)} className="min-h-[65vh] w-full resize-none rounded-lg border bg-gray-50 p-5 font-mono text-sm leading-7 outline-none focus:ring-2 focus:ring-primary-200" /> : <MarkdownPreview content={note.content} />}
  </div>;
}

/* Previous React Flow implementation retained temporarily for comparison.
type KnowledgeNodeData = { note: Note; color: string; dimmed?: boolean; active?: boolean };
type KnowledgeNode = Node<KnowledgeNodeData, "knowledge">;

function ObsidianNode({ data }: NodeProps<KnowledgeNode>) {
  return <div className={cn("group flex w-36 flex-col items-center transition-all duration-300", data.dimmed && "opacity-20", data.active && "scale-110")}>
    <Handle type="target" position={Position.Top} className="!h-0 !w-0 !border-0 !bg-transparent" />
    <div style={{ backgroundColor: data.color, boxShadow: data.active ? `0 0 0 7px ${data.color}28, 0 8px 22px ${data.color}55` : undefined }} className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
      <FileText className="h-4 w-4" />
    </div>
    <span className="mt-1.5 max-w-full truncate rounded-md bg-white/85 px-2 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm backdrop-blur-sm">{data.note.name.replace(".md", "")}</span>
    <Handle type="source" position={Position.Bottom} className="!h-0 !w-0 !border-0 !bg-transparent" />
  </div>;
}

function makeGraph(notes: Note[]) {
  const folderIndex = new Map<string, number>();
  notes.forEach((note) => { if (!folderIndex.has(note.folder)) folderIndex.set(note.folder, folderIndex.size); });
  const nodes: KnowledgeNode[] = notes.map((note, index) => {
    const group = folderIndex.get(note.folder) ?? 0;
    const angle = (index / Math.max(notes.length, 1)) * Math.PI * 2 + group * .35;
    const radius = 170 + (index % 3) * 75;
    return { id: note.id, type: "knowledge", position: { x: 430 + Math.cos(angle) * radius, y: 270 + Math.sin(angle) * radius }, data: { note, color: colors[group % colors.length] } };
  });
  const edges: Edge[] = [];
  notes.forEach((note, index) => {
    const linked = notes.filter((candidate) => candidate.id !== note.id && note.content.toLowerCase().includes(candidate.name.replace(/\.md$/i, "").toLowerCase()));
    const targets = linked.length ? linked : (index ? [notes[Math.floor((index - 1) / 2)]] : []);
    targets.forEach((target) => { if (target) edges.push({ id: `${note.id}-${target.id}`, source: note.id, target: target.id }); });
  });
  return { nodes, edges };
}

function Graph({ notes, onOpen }: { notes: Note[]; onOpen: (n: Note) => void }) {
  const initial = useMemo(() => makeGraph(notes), [notes]);
  const [nodes, setNodes, onNodesChange] = useNodesState<KnowledgeNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selected, setSelected] = useState<string | null>(null);

  function selectNode(id: string | null) {
    setSelected(id);
    const connected = new Set<string>(id ? [id] : []);
    if (id) initial.edges.forEach((edge) => { if (edge.source === id) connected.add(edge.target); if (edge.target === id) connected.add(edge.source); });
    setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, active: node.id === id, dimmed: !!id && !connected.has(node.id) } })));
    setEdges((current) => current.map((edge) => { const highlighted = !id || edge.source === id || edge.target === id; return { ...edge, animated: !!id && highlighted, style: { stroke: highlighted ? "#7c3aed" : "#d1d5db", strokeWidth: highlighted ? 2 : 1, opacity: id && !highlighted ? .12 : .75 } }; }));
  }

  if (!notes.length) return <Empty onCreate={() => {}} onUpload={() => {}} />;
  return <div className="h-full min-h-[620px] bg-[#fcfcfd]">
    <ReactFlowProvider>
      <ReactFlow<KnowledgeNode>
        nodes={nodes} edges={edges} nodeTypes={{ knowledge: ObsidianNode }}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => selectNode(node.id)}
        onNodeDoubleClick={(_, node) => onOpen(node.data.note)}
        onPaneClick={() => selectNode(null)} fitView fitViewOptions={{ padding: .22 }}
        minZoom={.25} maxZoom={2.2} nodesConnectable={false} selectionOnDrag panOnScroll
        defaultEdgeOptions={{ type: "straight", style: { stroke: "#9ca3af", strokeWidth: 1.2, opacity: .7 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d8d8df" />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap position="bottom-left" pannable zoomable nodeColor={(node) => (node.data as KnowledgeNodeData).color} maskColor="rgba(248,248,252,.72)" className="!rounded-lg !border !bg-white !shadow-sm" />
        <Panel position="top-left" className="rounded-lg border bg-white/90 px-3 py-2 text-xs text-gray-500 shadow-sm backdrop-blur">
          <span className="font-semibold text-gray-700">{notes.length} notes</span> · drag to explore · double-click to open
          {selected && <button onClick={() => selectNode(null)} className="ml-2 font-medium text-primary-700">Clear focus</button>}
        </Panel>
      </ReactFlow>
    </ReactFlowProvider>
  </div>;
}

*/

function makeCytoscapeElements(notes: Note[]): ElementDefinition[] {
  const folders = new Map<string, number>();
  notes.forEach((note) => { if (!folders.has(note.folder)) folders.set(note.folder, folders.size); });
  const elements: ElementDefinition[] = notes.map((note, index) => ({
    data: { id: note.id, label: note.name.replace(/\.md$/i, ""), color: colors[(folders.get(note.folder) ?? 0) % colors.length] },
    position: { x: 420 + Math.cos((index / Math.max(notes.length, 1)) * Math.PI * 2) * 230, y: 300 + Math.sin((index / Math.max(notes.length, 1)) * Math.PI * 2) * 210 },
  }));
  notes.forEach((note, index) => {
    const linked = notes.filter((candidate) => candidate.id !== note.id && note.content.toLowerCase().includes(candidate.name.replace(/\.md$/i, "").toLowerCase()));
    const targets = linked.length ? linked : index ? [notes[Math.floor((index - 1) / 2)]] : [];
    targets.forEach((target) => elements.push({ data: { id: `${note.id}-${target.id}`, source: note.id, target: target.id } }));
  });
  return elements;
}

function Graph({ notes, onOpen }: { notes: Note[]; onOpen: (note: Note) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onOpenRef = useRef(onOpen);
  const noteMap = useMemo(() => new Map(notes.map((note) => [note.id, note])), [notes]);

  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);

  useEffect(() => {
    if (!containerRef.current || !notes.length) return;
    let cancelled = false;
    let dispose = () => {};
    void import("cytoscape").then(({ default: cytoscape }) => {
      if (cancelled || !containerRef.current) return;
    const style: cytoscape.StylesheetJson = [
      { selector: "node", style: { "background-color": "data(color)", label: "data(label)", width: 42, height: 42, "border-width": 4, "border-color": "#fff", "font-size": 11, color: "#3f3f46", "text-valign": "bottom", "text-margin-y": 9, "text-background-color": "#fff", "text-background-opacity": .86, "text-background-padding": "4px", "text-background-shape": "roundrectangle", "min-zoomed-font-size": "7px", "overlay-opacity": 0 } },
      { selector: "node:active", style: { "overlay-color": "#7c3aed", "overlay-opacity": .13, "overlay-padding": 8 } },
      { selector: "edge", style: { width: 1.2, "line-color": "#9ca3af", opacity: .68, "curve-style": "bezier", "control-point-step-size": 36 } },
      { selector: ".focused", style: { width: 52, height: 52, "border-color": "#ede9fe", "border-width": 7, "font-weight": 700, "font-size": 12, "z-index": 10 } },
      { selector: ".neighbor", style: { opacity: 1 } },
      { selector: "edge.neighbor", style: { width: 2.5, "line-color": "#7c3aed", "line-style": "dashed", opacity: 1, "z-index": 8 } },
      { selector: "node.hovered", style: { width: 49, height: 49, "border-color": "#ddd6fe", "border-width": 6, "font-weight": 700, "z-index": 12 } },
      { selector: "edge.hovered", style: { width: 2.2, "line-color": "#8b5cf6", opacity: .95, "z-index": 9 } },
      { selector: "node.dragging", style: { width: 56, height: 56, "border-color": "#c4b5fd", "border-width": 8, "z-index": 20 } },
      { selector: ".dimmed", style: { opacity: .12 } },
    ];
    const cy = cytoscape({
      container: containerRef.current, elements: makeCytoscapeElements(notes), style,
      minZoom: .2, maxZoom: 2.4, boxSelectionEnabled: false, headless: false,
      styleEnabled: true, pixelRatio: 1,
      layout: { name: "preset", fit: true, padding: 70 },
    });
    cyRef.current = cy;
    const dragOrigins = new Map<string, { x: number; y: number }>();
    let previousDragPosition: { x: number; y: number } | null = null;
    let layout: ReturnType<Core["layout"]> | null = null;
    const layoutFrame = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cy.destroyed()) return;
      cy.resize();
      layout = cy.layout({ name: "cose", animate: false, fit: true, padding: 70, nodeRepulsion: () => 520000, idealEdgeLength: () => 135, edgeElasticity: () => 90, gravity: .18, numIter: 1000, randomize: true });
      layout.run();
      cy.fit(undefined, 70);
      cy.forceRender();
    }));
    const resizeObserver = new ResizeObserver(() => {
      if (!cy.destroyed()) { cy.resize(); cy.fit(undefined, 70); }
    });
    resizeObserver.observe(containerRef.current);
    let lastTap = { id: "", at: 0 };
    cy.on("tap", "node", (event) => {
      const node = event.target;
      const neighborhood = node.closedNeighborhood();
      cy.elements().removeClass("focused neighbor dimmed");
      cy.elements().difference(neighborhood).addClass("dimmed");
      neighborhood.addClass("neighbor");
      node.removeClass("neighbor").addClass("focused");
      node.animate({ style: { width: 58, height: 58 } }, { duration: 150, complete: () => node.animate({ style: { width: 52, height: 52 } }, { duration: 180 }) });
      const now = Date.now();
      if (lastTap.id === node.id() && now - lastTap.at < 360) { const note = noteMap.get(node.id()); if (note) onOpenRef.current(note); }
      lastTap = { id: node.id(), at: now };
    });
    cy.on("tap", (event) => { if (event.target === cy) cy.elements().removeClass("focused neighbor dimmed"); });
    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      node.addClass("hovered");
      node.connectedEdges().addClass("hovered");
      node.neighborhood("node").animate({ style: { width: 45, height: 45 } }, { duration: 160 });
    });
    cy.on("mouseout", "node", (event) => {
      const node = event.target;
      if (!node.hasClass("focused") && !node.hasClass("dragging")) node.removeClass("hovered");
      node.connectedEdges().removeClass("hovered");
      node.neighborhood("node").filter((item: cytoscape.NodeSingular) => !item.hasClass("focused") && !item.hasClass("hovered")).animate({ style: { width: 42, height: 42 } }, { duration: 220 });
    });
    cy.on("grab", "node", (event) => {
      const node = event.target;
      dragOrigins.clear();
      node.neighborhood("node").forEach((neighbor: cytoscape.NodeSingular) => dragOrigins.set(neighbor.id(), { ...neighbor.position() }));
      previousDragPosition = { ...node.position() };
      node.addClass("dragging");
      node.connectedEdges().addClass("hovered");
    });
    cy.on("drag", "node", (event) => {
      const node = event.target;
      if (!previousDragPosition) return;
      const position = node.position();
      const dx = position.x - previousDragPosition.x;
      const dy = position.y - previousDragPosition.y;
      node.neighborhood("node").forEach((neighbor: cytoscape.NodeSingular) => {
        const current = neighbor.position();
        neighbor.position({ x: current.x + dx * .16, y: current.y + dy * .16 });
      });
      previousDragPosition = { ...position };
    });
    cy.on("free", "node", (event) => {
      const node = event.target;
      node.removeClass("dragging");
      node.connectedEdges().removeClass("hovered");
      node.neighborhood("node").forEach((neighbor: cytoscape.NodeSingular) => {
        const origin = dragOrigins.get(neighbor.id());
        const current = neighbor.position();
        if (!origin) return;
        neighbor.animate({ position: { x: current.x + (origin.x - current.x) * .42, y: current.y + (origin.y - current.y) * .42 } }, { duration: 420, easing: "ease-out-cubic" });
      });
      node.animate({ style: { width: node.hasClass("focused") ? 52 : 42, height: node.hasClass("focused") ? 52 : 42 } }, { duration: 280, easing: "ease-out-cubic" });
      previousDragPosition = null;
      dragOrigins.clear();
    });
    dispose = () => {
      cancelAnimationFrame(layoutFrame);
      resizeObserver.disconnect();
      layout?.stop();
      cy.stop(true, true);
      cy.removeAllListeners();
      cy.destroy();
      if (cyRef.current === cy) cyRef.current = null;
    };
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [noteMap, notes]);

  if (!notes.length) return <Empty onCreate={() => {}} onUpload={() => {}} />;
  const zoom = (factor: number) => { const cy = cyRef.current; if (!cy || !containerRef.current) return; cy.zoom({ level: Math.max(.2, Math.min(2.4, cy.zoom() * factor)), renderedPosition: { x: containerRef.current.clientWidth / 2, y: containerRef.current.clientHeight / 2 } }); };
  return <div className="relative h-full min-h-[620px] overflow-hidden bg-[#fcfcfd] bg-[radial-gradient(#dedee5_1px,transparent_1px)] [background-size:24px_24px]">
    <div ref={containerRef} className="absolute inset-0 z-0 block h-full min-h-[620px] w-full" style={{ width: "100%", height: "100%", position: "absolute" }} />
    <div className="absolute left-4 top-4 rounded-lg border bg-white/90 px-3 py-2 text-xs text-gray-500 shadow-sm backdrop-blur"><span className="font-semibold text-gray-700">{notes.length} notes</span> · drag to explore · double-click to open</div>
    <div className="absolute bottom-4 right-4 flex overflow-hidden rounded-lg border bg-white shadow-sm">
      <button onClick={() => zoom(1.2)} className="border-r px-3 py-2 text-lg text-gray-600 hover:bg-gray-50" title="Zoom in">+</button>
      <button onClick={() => cyRef.current?.fit(undefined, 60)} className="border-r px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50" title="Fit graph">Fit</button>
      <button onClick={() => zoom(1 / 1.2)} className="px-3 py-2 text-lg text-gray-600 hover:bg-gray-50" title="Zoom out">−</button>
    </div>
  </div>;
}

function Empty({ onCreate, onUpload }: { onCreate: () => void; onUpload: () => void }) {
  return <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center"><FileText className="mb-3 h-10 w-10 text-primary-200" /><h2 className="font-semibold text-gray-700">No file open</h2><p className="mt-1 text-sm text-gray-400">Select a file from the directory to get started.</p><div className="mt-5 flex gap-3"><button onClick={onCreate} className="rounded-md bg-primary-700 px-4 py-2 text-sm text-white">Create New File</button><button onClick={onUpload} className="rounded-md bg-primary-700 px-4 py-2 text-sm text-white">Upload File</button></div></div>;
}
