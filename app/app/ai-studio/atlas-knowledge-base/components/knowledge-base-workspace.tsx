"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronRight, CircleHelp, FilePlus2, FileText, Folder, Hash, Layers3, LoaderCircle, Network, Pencil, Search, Tag, Trash2, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarkdownPreview } from "@/components/markdown-preview";
import { cn } from "@/lib/utils";
import type { ArtifactFolder, KnowledgeArtifact, KnowledgeEntity, Tab, UploadResult } from "../types";
import { extractArtifacts, extractDownloadUrl, extractEntities, extractFolders, useKnowledgeBaseApi } from "../use-knowledge-base";

const KnowledgeGraph = dynamic(
  () => import("./knowledge-graph").then((module) => module.KnowledgeGraph),
  { ssr: false },
);

export function KnowledgeBaseWorkspace() {
  const api = useKnowledgeBaseApi();
  const [folders, setFolders] = useState<ArtifactFolder[]>([]), [artifacts, setArtifacts] = useState<KnowledgeArtifact[]>([]);
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [openFolders, setOpenFolders] = useState<string[]>([]), [tabs, setTabs] = useState<Tab[]>([{ id: "graph", kind: "graph" }]), [active, setActive] = useState("graph");
  const [graphFocus, setGraphFocus] = useState<{ artifactId: string; token: number }>();
  const [query, setQuery] = useState(""), [loading, setLoading] = useState(true), [dialog, setDialog] = useState<null | { kind: "folder" | "file" | "upload" | "rename" | "delete"; id?: string; folderId?: string; label?: string }>(null), [name, setName] = useState("");
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]), [saving, setSaving] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState<Record<string, string>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const nextFolders = extractFolders(await api.getFolders());
      setFolders(nextFolders);
      setOpenFolders((value) => value.filter((id) => nextFolders.some((folder) => folder.id === id)));
      const results = await Promise.allSettled(nextFolders.map(async (folder) => {
        const items = extractArtifacts(await api.getArtifacts(folder.id, query));
        return items.map((artifact) => ({ ...artifact, folderId: artifact.folderId || folder.id }));
      }));
      setArtifacts(results.flatMap((result) => result.status === "fulfilled" ? result.value : []));
      const entityResults = await Promise.allSettled(nextFolders.map(async (folder) =>
        extractEntities(await api.getEntities(folder.id), folder.id)
      ));
      setEntities(entityResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed) toast.error(`Failed to load files from ${failed} folder${failed > 1 ? "s" : ""}`);
    } catch (error) { toast.error(message(error, "Failed to load knowledge base")); } finally { setLoading(false); }
  }, [api, query]);
  useEffect(() => { const timer = setTimeout(() => void reload(), 250); return () => clearTimeout(timer); }, [reload]);

  const current = artifacts.find((item) => item.id === active);
  const folderArtifacts = useMemo(() => new Map(folders.map((folder) => [folder.id, artifacts.filter((artifact) => artifact.folderId === folder.id)])), [artifacts, folders]);
  /** Switches to the graph tab and zooms to the artifact's node. */
  function locateArtifact(artifact: KnowledgeArtifact) {
    setTabs((items) => items.some((tab) => tab.id === "graph") ? items : [{ id: "graph", kind: "graph" }, ...items]);
    setActive("graph");
    setGraphFocus((current) => ({ artifactId: artifact.id, token: (current?.token ?? 0) + 1 }));
  }

  async function openArtifact(artifact: KnowledgeArtifact) {
    setTabs((items) => items.some((tab) => tab.id === artifact.id) ? items : [...items, { id: artifact.id, kind: "note" }]);
    setActive(artifact.id);
    setPreviewLoading(true);
    try {
      const downloadUrl = extractDownloadUrl(await api.getArtifactDownloadUrl(artifact.id));
      if (!downloadUrl) throw new Error("Download URL was not returned by the API");
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to stream file (${response.status})`);
      const blob = await response.blob();
      if (isMarkdownArtifact(artifact, blob.type)) {
        const content = await blob.text();
        setPreviewMarkdown((items) => ({
          ...items,
          [artifact.id]: content || `# ${artifact.name}\n\n_Content is not available for this artifact._`,
        }));
      } else {
        const url = URL.createObjectURL(blob);
        setPreviewUrls((items) => {
          if (items[artifact.id]) URL.revokeObjectURL(items[artifact.id]);
          return { ...items, [artifact.id]: url };
        });
      }
    } catch (error) {
      const errorMessage = message(error, "Failed to load file preview");
      setPreviewMarkdown((items) => ({
        ...items,
        [artifact.id]: `# Preview unavailable\n\n${errorMessage}`,
      }));
    } finally {
      setPreviewLoading(false);
    }
  }
  function openWikiLink(reference: string) {
    const target = artifacts.find(
      (artifact) =>
        normalizeKnowledgeReference(artifact.name) ===
        normalizeKnowledgeReference(reference)
    );
    if (!target) {
      toast.error("Referenced page was not found", {
        description: `No Knowledge Base document matches “${reference}”.`
      });
      return;
    }
    void openArtifact(target);
  }
  function closeTab(id: string) { setTabs((items) => { const next = items.filter((tab) => tab.id !== id); if (active === id) setActive(next.at(-1)?.id ?? "graph"); return next.length ? next : [{ id: "graph", kind: "graph" }]; }); }
  function openDialog(value: typeof dialog) { setName(value?.label ?? ""); setUploadResults([]); setDialog(value); }
  async function submit() {
    if (!dialog || (!name.trim() && dialog.kind !== "delete")) return; setSaving(true);
    try {
      if (dialog.kind === "folder") await api.createFolder(name.trim());
      if (dialog.kind === "file") { const filename = /\.[a-z0-9]+$/i.test(name) ? name : `${name}.md`; await api.uploadArtifact(dialog.folderId ?? folders[0]?.id, new File([`# ${name.replace(/\.md$/i, "")}\n`], filename, { type: "text/markdown" })); }
      if (dialog.kind === "rename" && dialog.folderId) await api.updateFolder(dialog.id!, name.trim());
      if (dialog.kind === "rename" && !dialog.folderId) await api.updateArtifact(dialog.id!, { name: name.trim() });
      if (dialog.kind === "delete" && dialog.folderId) await api.deleteFolder(dialog.id!);
      if (dialog.kind === "delete" && !dialog.folderId) await api.deleteArtifact(dialog.id!);
      setDialog(null); await reload(); toast.success("Knowledge base updated");
    } catch (error) { toast.error(message(error, "Action failed")); } finally { setSaving(false); }
  }
  async function upload(files: FileList | null) { const folderId = dialog?.folderId ?? folders[0]?.id; if (!folderId || !files) return; await Promise.all(Array.from(files).map(async (file) => { try { await api.uploadArtifact(folderId, file); setUploadResults((items) => [...items, { name: file.name, status: "success" }]); } catch { setUploadResults((items) => [...items, { name: file.name, status: "error", message: "Upload failed" }]); } })); await reload(); }

  return <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
    <aside className="flex w-72 shrink-0 flex-col border-r bg-[#fbfbfc]"><div className="p-4 pb-2 text-xs font-medium text-gray-500">Knowledge Directory</div><label className="mx-4 mb-3 mt-3 flex h-9 items-center gap-2 rounded-lg border bg-white px-3"><Search className="h-4 w-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
    <div className="flex-1 overflow-auto px-2">{loading && <LoaderCircle className="mx-auto mt-6 h-5 w-5 animate-spin text-primary-600" />}{folders.map((folder) => <div key={folder.id} className="mb-1"><div className="group flex h-9 items-center rounded-md px-2 hover:bg-gray-100"><button onClick={() => setOpenFolders((items) => items.includes(folder.id) ? items.filter((id) => id !== folder.id) : [...items, folder.id])} className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">{openFolders.includes(folder.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<Folder className="h-4 w-4 text-primary-600" /><span className="truncate">{folder.title}</span></button><Actions onAdd={() => openDialog({ kind: "file", folderId: folder.id })} onRename={() => openDialog({ kind: "rename", id: folder.id, folderId: folder.id, label: folder.title })} onDelete={() => openDialog({ kind: "delete", id: folder.id, folderId: folder.id, label: folder.title })} /></div>{openFolders.includes(folder.id) && <div className="ml-5 border-l pl-2">{folderArtifacts.get(folder.id)?.map((artifact) => <div key={artifact.id} className={cn("group flex h-8 items-center rounded-md", active === artifact.id && "bg-primary-100 text-primary-800")}><button onClick={() => void openArtifact(artifact)} className="flex min-w-0 flex-1 items-center gap-2 px-2 text-sm"><FileText className="h-3.5 w-3.5" /><span className="truncate">{artifact.name}</span></button><Actions onLocate={() => locateArtifact(artifact)} onRename={() => openDialog({ kind: "rename", id: artifact.id, label: artifact.name })} onDelete={() => openDialog({ kind: "delete", id: artifact.id, label: artifact.name })} /></div>)}</div>}</div>)}</div></aside>
    <section className="flex min-w-0 flex-1 flex-col"><div className="flex h-11 shrink-0 overflow-x-auto overflow-y-hidden border-b bg-[#fcfcfd] py-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">{tabs.map((tab) => <button key={tab.id} onClick={() => setActive(tab.id)} className={cn("group flex max-w-52 shrink-0 items-center gap-2 border-b-2 px-4 text-sm", active === tab.id ? "border-primary-600 bg-white text-primary-700" : "border-transparent text-gray-500")}>{tab.kind === "graph" ? <Network className="h-4 w-4" /> : <FileText className="h-4 w-4" />}<span className="truncate">{tab.kind === "graph" ? "Graph View" : artifacts.find((item) => item.id === tab.id)?.name ?? "File"}</span><X onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }} className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" /></button>)}</div><div className="min-h-0 flex-1 overflow-auto">{active === "graph" ? <KnowledgeGraph artifacts={artifacts} entities={entities} onOpen={(item) => void openArtifact(item)} focus={graphFocus} /> : current ? <FilePreview name={current.name} markdown={previewMarkdown[current.id]} url={previewUrls[current.id]} loading={previewLoading} onWikiLinkClick={openWikiLink} /> : null}</div></section>
    <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog?.kind === "upload" ? "Upload files" : dialog?.kind === "delete" ? "Delete item" : dialog?.kind === "rename" ? "Rename item" : `Create ${dialog?.kind}`}</DialogTitle><DialogDescription>{dialog?.kind === "delete" ? `${dialog.label} will be permanently deleted.` : "Changes are saved to the knowledge base API."}</DialogDescription></DialogHeader>{dialog?.kind === "upload" ? <><input ref={input} type="file" multiple onChange={(event) => void upload(event.target.files)} /><div className="space-y-1 text-sm">{uploadResults.map((result, index) => <p key={`${result.name}-${index}`} className={result.status === "success" ? "text-green-600" : "text-red-600"}>{result.name}: {result.status}</p>)}</div></> : dialog?.kind !== "delete" && <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} className="h-10 rounded-md border px-3" />}<DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>{dialog?.kind !== "upload" && <Button variant={dialog?.kind === "delete" ? "destructive" : "default"} disabled={saving} onClick={() => void submit()}>{saving ? "Saving..." : dialog?.kind === "delete" ? "Delete" : "Save"}</Button>}</DialogFooter></DialogContent></Dialog>
  </div>;
}

function Actions({ onAdd, onLocate, onRename, onDelete }: { onAdd?: () => void; onLocate?: () => void; onRename: () => void; onDelete: () => void }) { return <div className="hidden gap-1 group-hover:flex">{onAdd && <button title="New file" onClick={onAdd}><FilePlus2 className="h-3.5 w-3.5" /></button>}{onLocate && <button title="Show in graph" onClick={onLocate}><ZoomIn className="h-3.5 w-3.5" /></button>}<button title="Rename" onClick={onRename}><Pencil className="h-3.5 w-3.5" /></button><button title="Delete" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-red-500" /></button></div>; }
function FilePreview({ name, markdown, url, loading, onWikiLinkClick }: { name: string; markdown?: string; url?: string; loading: boolean; onWikiLinkClick: (reference: string) => void }) {
  if (loading) return <div className="flex h-full min-h-[620px] items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-primary-600" /></div>;
  if (markdown !== undefined) {
    const preview = prepareKnowledgePreview(markdown);
    return <div className="mx-auto w-full max-w-5xl space-y-6 px-10 py-8">
      {preview.before && <MarkdownPreview content={preview.before} onWikiLinkClick={onWikiLinkClick} unwrapWikiLinks />}
      {preview.properties && <PropertiesCard properties={preview.properties} />}
      {preview.after && <MarkdownPreview content={preview.after} onWikiLinkClick={onWikiLinkClick} unwrapWikiLinks />}
    </div>;
  }
  if (url) return <iframe src={url} title={`Preview ${name}`} className="h-full min-h-[620px] w-full border-0" />;
  return <div className="mx-auto w-full max-w-5xl px-10 py-8"><MarkdownPreview content="# Preview unavailable\n\n_Select a file to load its content._" /></div>;
}

type KnowledgeProperties = {
  aliases: string[];
  tags: string[];
  entityType: string;
  keyQuestions: string[];
};

function prepareKnowledgePreview(content: string) {
  const frontMatter = /^\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/.exec(content)?.[1] ?? "";
  const cleaned = content.replace(/^\s*---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "");
  const propertiesHeading = /^#{1,6}\s+Properties\s*$/im.exec(cleaned);
  if (!propertiesHeading) return { before: cleaned.trim(), after: "", properties: null };

  let before = cleaned.slice(0, propertiesHeading.index);
  // Some generated files omit the opening YAML delimiter. Hide that metadata
  // block when it starts with aliases instead of displaying it above Properties.
  const undelimitedMetadata = /^\s*aliases\s*:/i.test(before) ? before : "";
  if (undelimitedMetadata) before = "";

  const sectionStart = propertiesHeading.index + propertiesHeading[0].length;
  const remainder = cleaned.slice(sectionStart);
  const nextHeading = /^#{1,6}\s+.+$/m.exec(remainder);
  const section = nextHeading ? remainder.slice(0, nextHeading.index) : remainder;
  const after = nextHeading ? remainder.slice(nextHeading.index) : "";

  return {
    before: before.trim(),
    after: after.trim(),
    properties: mergeKnowledgeProperties(
      parseKnowledgeProperties(section),
      parseKnowledgeProperties(frontMatter || undelimitedMetadata),
    ),
  };
}

function parseKnowledgeProperties(section: string): KnowledgeProperties {
  const properties: KnowledgeProperties = { aliases: [], tags: [], entityType: "-", keyQuestions: [] };
  let current: keyof KnowledgeProperties | null = null;

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^#{1,6}\s+/, "").replaceAll("**", "").trim();
    if (!line) continue;
    const fieldLine = line.replace(/^[-*]\s+/, "");
    const field = /^(Aliases|Tags|Entity[ _]Type|Key[ _]Questions)\s*:\s*(.*)$/i.exec(fieldLine);
    if (field) {
      const key = field[1].toLowerCase().replace(/[ _]/g, "");
      const value = field[2].trim();
      if (key === "entitytype") { properties.entityType = value || "-"; current = value ? null : "entityType"; }
      else {
        current = key === "aliases" ? "aliases" : key === "tags" ? "tags" : "keyQuestions";
        if (value) properties[current].push(value.replace(/^[-*]\s*/, ""));
      }
      continue;
    }
    if (current === "entityType") { properties.entityType = fieldLine; current = null; }
    else if (current && /^[-*]\s+/.test(line)) properties[current].push(line.replace(/^[-*]\s+/, ""));
  }
  return properties;
}

function mergeKnowledgeProperties(primary: KnowledgeProperties, fallback: KnowledgeProperties): KnowledgeProperties {
  return {
    aliases: primary.aliases.length ? primary.aliases : fallback.aliases,
    tags: primary.tags.length ? primary.tags : fallback.tags,
    entityType: primary.entityType !== "-" ? primary.entityType : fallback.entityType,
    keyQuestions: primary.keyQuestions.length ? primary.keyQuestions : fallback.keyQuestions,
  };
}

function PropertiesCard({ properties }: { properties: KnowledgeProperties }) {
  return <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex h-14 items-center gap-3 border-b border-gray-200 px-4"><Layers3 className="h-5 w-5 text-gray-800"/><h2 className="text-lg font-semibold text-gray-950">Properties</h2></div>
    <PropertyRow icon={<Tag className="h-4 w-4"/>} label="Aliases"><PropertyPills values={properties.aliases} tone="gray"/></PropertyRow>
    <PropertyRow icon={<Hash className="h-4 w-4"/>} label="Tags"><PropertyPills values={properties.tags} tone="blue"/></PropertyRow>
    <PropertyRow icon={<Network className="h-4 w-4"/>} label="Entity Type"><PropertyPills values={properties.entityType === "-" ? [] : [properties.entityType]} tone="gray"/></PropertyRow>
    <PropertyRow icon={<CircleHelp className="h-4 w-4"/>} label="Key Questions" last><div className="w-full rounded-lg bg-gray-50 px-4 py-3">{properties.keyQuestions.length ? <ul className="list-disc space-y-1 pl-4 text-sm leading-6 text-gray-700 marker:text-gray-400">{properties.keyQuestions.map((question)=><li key={question}>{question}</li>)}</ul> : <span className="text-sm text-gray-400">—</span>}</div></PropertyRow>
  </section>;
}

function PropertyRow({ icon, label, children, last = false }: { icon: React.ReactNode; label: string; children: React.ReactNode; last?: boolean }) {
  return <div className={cn("grid min-h-11 grid-cols-[180px_1fr]", !last && "border-b border-gray-200")}><div className="flex items-start gap-3 border-r border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"><span className="mt-0.5 text-gray-500">{icon}</span>{label}</div><div className="flex min-w-0 items-center px-3 py-2">{children}</div></div>;
}

function PropertyPills({ values, tone }: { values: string[]; tone: "blue" | "gray" }) {
  if (!values.length) return <span className="text-sm text-gray-400">[]</span>;
  return <div className="flex flex-wrap gap-1.5">{values.map((value)=><span key={value} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700")}>{value}</span>)}</div>;
}
function normalizeKnowledgeReference(value: string) {
  return value
    .trim()
    .replace(/\.(md|mdown|markdown)$/i, "")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}
function isMarkdownArtifact(artifact: KnowledgeArtifact, responseType: string) {
  return /\.(md|mdown|markdown)$/i.test(artifact.name.trim()) || /(?:text\/markdown|text\/plain)/i.test(responseType || artifact.mimeType || "");
}
function message(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
