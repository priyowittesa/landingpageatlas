"use client";

import {
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import dynamic from "next/dynamic";
import {
  Check,
  Download,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  GripVertical,
  LoaderCircle,
  Maximize2,
  Minimize2,
  MoreVertical,
  Pencil,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OfficeFilePreview } from "@/components/ai-assistant/OfficeFilePreviewDialog";
import { downloadRemoteFile } from "@/components/ai-assistant/useChatFileDownload";
import type {
  DeleteTarget,
  FolderOrderPayload,
  KnowledgeFolder,
  KnowledgeUpload,
  UploadTask
} from "../types";
import {
  extractFolders,
  extractUploads,
  formatFileSize,
  unwrapResponse,
  useKnowledgeApi
} from "../use-knowledge";
import { DeleteKnowledgeDialog } from "./delete-knowledge-dialog";
import { KnowledgeSearchInput } from "./knowledge-search-input";
import { KnowledgeToolbar } from "./knowledge-toolbar";

const OfficeFilePreviewDialog = dynamic(
  () =>
    import("@/components/ai-assistant/OfficeFilePreviewDialog").then(
      (module) => module.OfficeFilePreviewDialog
    ),
  { ssr: false }
);

const formatSize = formatFileSize;

export function KnowledgeSourceList() {
  const knowledgeApi = useKnowledgeApi();
  const [folders, setFolders] = useState<KnowledgeFolder[]>([]);
  const [files, setFiles] = useState<KnowledgeUpload[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [previewFile, setPreviewFile] = useState<OfficeFilePreview | null>(
    null
  );
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const mapped = extractFolders(await knowledgeApi.getFolders());
      setFolders(mapped);
      setFolderId((current) =>
        current && mapped.some((folder) => folder.id === current)
          ? current
          : (mapped[0]?.id ?? null)
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load folders"
      );
    } finally {
      setLoadingFolders(false);
    }
  }, [knowledgeApi]);

  const loadFiles = useCallback(
    async (id: string) => {
      setLoadingFiles(true);
      try {
        const query = new URLSearchParams({ folder_id: id, page_size: "100" });
        if (fileSearch.trim()) query.set("search", fileSearch.trim());
        if (["uploaded", "chunking", "ready", "failed"].includes(status)) {
          query.set("status", status);
        }
        setFiles(
          extractUploads(
            await knowledgeApi.getUploads(Object.fromEntries(query))
          )
        );
        setSelected([]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load uploads"
        );
      } finally {
        setLoadingFiles(false);
      }
    },
    [fileSearch, knowledgeApi, status]
  );

  useEffect(() => {
    const timer = setTimeout(() => void loadFolders(), 0);
    return () => clearTimeout(timer);
  }, [loadFolders]);
  useEffect(() => {
    if (!folderId) return;
    const timer = setTimeout(() => void loadFiles(folderId), 250);
    return () => clearTimeout(timer);
  }, [folderId, loadFiles]);
  const folder = folders.find((item) => item.id === folderId);
  const visibleFolders = useMemo(
    () =>
      folders.filter((item) =>
        item.title.toLowerCase().includes(folderSearch.trim().toLowerCase())
      ),
    [folders, folderSearch]
  );
  const complete = tasks.filter((task) => task.state === "complete").length;
  const active = tasks.filter(
    (task) => task.state === "queued" || task.state === "uploading"
  ).length;
  const progress = tasks.length
    ? Math.round(
        tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
      )
    : 0;

  async function createFolder() {
    const title = newName.trim();
    if (!title) return setAdding(false);
    try {
      await knowledgeApi.createFolder(title);
      setNewName("");
      setAdding(false);
      toast.success("Folder created");
      await loadFolders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
    }
  }
  async function renameFolder(id: string, title: string) {
    setEditing(null);
    if (!title.trim()) return;
    try {
      await knowledgeApi.renameFolder(id, title.trim());
      setFolders((all) =>
        all.map((item) =>
          item.id === id ? { ...item, title: title.trim() } : item
        )
      );
      toast.success("Folder renamed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rename failed");
      void loadFolders();
    }
  }
  async function reorder(over: string) {
    if (!dragging || dragging === over) return setDragging(null);
    const next = [...folders],
      from = next.findIndex((item) => item.id === dragging),
      to = next.findIndex((item) => item.id === over);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setFolders(next);
    setDragging(null);
    try {
      const payload: FolderOrderPayload = {
        items: next.map((item, order) => ({ folder_id: item.id, order }))
      };
      await knowledgeApi.reorderFolders(payload);
      toast.success("Folder order saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Order failed");
      void loadFolders();
    }
  }
  function chooseFiles(input: FileList | File[]) {
    const all = Array.from(input),
      accepted = all.filter((file) => file.size <= 50 * 1048576);
    if (accepted.length !== all.length)
      toast.error("Maximum file size is 50 MB");
    const next = accepted.map(
      (file, index): UploadTask => ({
        key: `${Date.now()}-${index}-${file.name}`,
        file,
        progress: 0,
        state: "queued"
      })
    );
    setTasks(next);
    setUploadOpen(true);
    setMinimized(false);
    if (next.length) void runUploads(next);
  }
  async function runUploads(next: UploadTask[]) {
    if (!folderId) return;
    await Promise.all(
      next.map(async (task) => {
        setTasks((all) =>
          all.map((item) =>
            item.key === task.key ? { ...item, state: "uploading" } : item
          )
        );
        try {
          await knowledgeApi.uploadFile(folderId, task.file, (progress) =>
            setTasks((all) =>
              all.map((item) =>
                item.key === task.key ? { ...item, progress } : item
              )
            )
          );
          setTasks((all) =>
            all.map((item) =>
              item.key === task.key
                ? { ...item, progress: 100, state: "complete" }
                : item
            )
          );
        } catch {
          setTasks((all) =>
            all.map((item) =>
              item.key === task.key ? { ...item, state: "failed" } : item
            )
          );
        }
      })
    );
    toast.success("Upload process finished");
    await loadFiles(folderId);
    await loadFolders();
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const ids =
        deleteTarget.kind === "files"
          ? selected
          : deleteTarget.id
            ? [deleteTarget.id]
            : [];
      if (deleteTarget.kind === "folder")
        await knowledgeApi.deleteFolder(deleteTarget.id!);
      else if (ids.length === 0) throw new Error("No items selected");
      else await Promise.all(ids.map((id) => knowledgeApi.deleteUpload(id)));
      toast.success("Deleted successfully");
      setDeleteTarget(null);
      if (deleteTarget.kind === "folder") await loadFolders();
      else if (folderId) {
        await loadFiles(folderId);
        await loadFolders();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }
  async function download(file: KnowledgeUpload) {
    try {
      const data = unwrapResponse(await knowledgeApi.getDownloadUrl(file.id));
      const url = data.url ?? data.download_url;
      if (typeof url !== "string")
        throw new Error("Download URL was not returned");
      await downloadRemoteFile(url, file.name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  }
  async function preview(file: KnowledgeUpload) {
    setPreviewingId(file.id);
    try {
      const data = unwrapResponse(await knowledgeApi.getDownloadUrl(file.id));
      const url = data.url ?? data.download_url;
      if (typeof url !== "string")
        throw new Error("Preview URL was not returned");
      const extension =
        file.type.toLowerCase() ||
        file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ||
        "";
      setPreviewFile({
        fileId: file.id,
        displayName: file.name,
        fileName: file.name,
        fileUrl: url,
        fileType: extension
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setPreviewingId(null);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-7.5rem)] flex-col">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-neutral-900">
          Upload Knowledge
        </h1>
        <p className="text-sm text-neutral-500">
          Upload and manage your knowledge assets.
        </p>
      </header>
      <div className="grid flex-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-h-72 flex-col rounded-xl border bg-neutral-50/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-neutral-600">Folders</h2>
            <Button
              size="icon"
              className="h-8 w-8"
              onClick={() => setAdding(true)}
              aria-label="Create folder"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          <KnowledgeSearchInput
            value={folderSearch}
            onChange={setFolderSearch}
            ariaLabel="Search folders"
            className="mb-3 w-full"
          />
          <div className="space-y-1">
            {adding && (
              <div className="flex items-center gap-1 py-1">
                <Folder className="h-4 w-4" />
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void createFolder();
                    if (e.key === "Escape") setAdding(false);
                  }}
                  className="h-8 min-w-0"
                  placeholder="Folder Name"
                />
                <button onClick={() => setAdding(false)}>
                  <X className="h-4 w-4 text-red-500" />
                </button>
                <button onClick={() => void createFolder()}>
                  <Check className="h-4 w-4 text-emerald-600" />
                </button>
              </div>
            )}
            {loadingFolders ? (
              <LoaderCircle className="mx-auto my-8 h-5 w-5 animate-spin" />
            ) : (
              visibleFolders.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragging(item.id)}
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={() => void reorder(item.id)}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg py-2 text-sm hover:bg-neutral-100",
                    folderId === item.id && "bg-primary-50 text-primary-800"
                  )}
                >
                  <GripVertical className="h-4 w-4 cursor-grab opacity-0 group-hover:opacity-50" />
                  <button
                    onClick={() => setFolderId(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <Folder className="h-4 w-4 shrink-0" />
                    {editing === item.id ? (
                      <Input
                        autoFocus
                        defaultValue={item.title}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) =>
                          void renameFolder(item.id, e.target.value)
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          void renameFolder(item.id, e.currentTarget.value)
                        }
                        className="h-7 min-w-0"
                      />
                    ) : (
                      <span className="truncate">{item.title}</span>
                    )}
                  </button>
                  <span className="rounded-full bg-neutral-200 px-1.5 text-xs">
                    {item.count_file}
                  </span>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(item.id)}>
                        <Pencil />
                        Rename Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onSelect={() =>
                          setDeleteTarget({ kind: "folder", id: item.id })
                        }
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </aside>
        <main
          className={cn(
            "min-h-[28rem] rounded-xl border bg-white p-5",
            !folder && "flex items-center justify-center"
          )}
        >
          {!folder ? (
            <div className="text-center text-neutral-500">
              <Folder className="mx-auto mb-2 h-8 w-8" />
              <h2 className="text-base font-semibold">No folder open</h2>
              <p className="text-sm">
                Create or select a folder to show files.
              </p>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <h2 className="text-lg font-semibold">{folder.title}</h2>
                <KnowledgeToolbar
                  search={fileSearch}
                  status={status}
                  onSearchChange={setFileSearch}
                  onStatusChange={setStatus}
                  onUpload={() => {
                    setTasks([]);
                    setUploadOpen(true);
                  }}
                />
              </div>
              <div className="">
                <div>
                  {selected.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ kind: "files" })}
                    >
                      <Trash2 />
                      Delete selected
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="text-neutral-500">
                    <tr className="h-10 border-b">
                      <th className="w-10 px-2">
                        <Checkbox
                          checked={
                            files.length > 0 &&
                            files.every((file) => selected.includes(file.id))
                          }
                          onCheckedChange={(checked) =>
                            setSelected(
                              checked ? files.map((file) => file.id) : []
                            )
                          }
                        />
                      </th>
                      <th className="px-2">Name</th>
                      <th className="px-2">Type</th>
                      <th className="px-2">Size</th>
                      <th className="px-2">Status</th>
                      <th className="px-2">Uploaded at</th>
                      <th className="px-2 text-center">Content Extraction</th>
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {loadingFiles ? (
                      <tr>
                        <td colSpan={8} className="h-32 text-center">
                          <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    ) : files.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="h-32 text-center text-neutral-500"
                        >
                          No uploads found.
                        </td>
                      </tr>
                    ) : (
                      files.map((file) => (
                        <tr
                          key={file.id}
                          className="h-[52px] border-b last:border-0"
                        >
                          <td className="px-2">
                            <Checkbox
                              checked={selected.includes(file.id)}
                              onCheckedChange={(checked) =>
                                setSelected((all) =>
                                  checked
                                    ? [...new Set([...all, file.id])]
                                    : all.filter((id) => id !== file.id)
                                )
                              }
                            />
                          </td>
                          <td className="px-2 font-medium">{file.name}</td>
                          <td className="px-2">{file.type}</td>
                          <td className="px-2">{formatSize(file.size)}</td>
                          <td className="px-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs capitalize",
                                ["uploaded", "ready"].includes(file.status)
                                  ? "bg-emerald-50 text-emerald-600"
                                  : file.status === "failed"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-sky-100 text-sky-600"
                              )}
                            >
                              {!["uploaded", "ready", "failed"].includes(
                                file.status
                              ) && (
                                <LoaderCircle className="h-3 w-3 animate-spin" />
                              )}
                              {file.status}
                            </span>
                          </td>
                          <td className="px-2 whitespace-nowrap">
                            {file.uploadedAt &&
                            !Number.isNaN(new Date(file.uploadedAt).valueOf())
                              ? new Intl.DateTimeFormat("en-US", {
                                  dateStyle: "medium"
                                }).format(new Date(file.uploadedAt))
                              : "-"}
                          </td>
                          <td className="px-2">
                            <div className="flex items-center justify-center gap-4 whitespace-nowrap">
                              <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <Checkbox
                                  className="pointer-events-none"
                                  checked={file.isContentExtractionKnowledge}
                                  aria-label="Knowledge extraction"
                                />
                                Knowledge
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                                <Checkbox
                                  className="pointer-events-none"
                                  checked={file.isContentExtractionTable}
                                  aria-label="Table extraction"
                                />
                                Table
                              </label>
                            </div>
                          </td>
                          <td className="px-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                className="p-1"
                                disabled={previewingId === file.id}
                                onClick={() => void preview(file)}
                                title="Preview"
                              >
                                {previewingId === file.id ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => void preview(file)}
                                  >
                                    <Eye />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => void download(file)}
                                  >
                                    <Download />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={() =>
                                      setDeleteTarget({
                                        kind: "file",
                                        id: file.id
                                      })
                                    }
                                  >
                                    <Trash2 />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-neutral-500">
                {selected.length} of {files.length} Row(s) Selected.
              </p>
            </div>
          )}
        </main>
      </div>
      <Dialog
        open={uploadOpen && !minimized}
        onOpenChange={(open) => {
          if (!open && active) setMinimized(true);
          else setUploadOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription className="sr-only">
              Select and monitor files being uploaded.
            </DialogDescription>
          </DialogHeader>
          {tasks.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                chooseFiles(e.dataTransfer.files);
              }}
              className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed"
            >
              <Upload className="mb-4 h-7 w-7" />
              <p className="text-sm font-medium">Drag & drop your files here</p>
              <p className="text-xs text-neutral-500">
                Your files will be automatically processed
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm font-medium">
                {complete} of {tasks.length} files uploaded{" "}
                <span className="text-neutral-500">
                  • {progress}% total progress
                </span>
              </p>
              <div className="max-h-72 space-y-4 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.key}>
                    <div className="flex items-center gap-3">
                      <FileText
                        className={cn(
                          "h-5 w-5",
                          task.state === "complete"
                            ? "text-emerald-600"
                            : "text-primary"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {task.file.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatSize(task.file.size)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs capitalize",
                          task.state === "complete"
                            ? "text-emerald-600"
                            : task.state === "failed"
                              ? "text-red-600"
                              : "text-primary"
                        )}
                      >
                        {task.state}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className={cn(
                          "h-full transition-all",
                          task.state === "complete"
                            ? "bg-emerald-500"
                            : task.state === "failed"
                              ? "bg-red-500"
                              : "bg-primary"
                        )}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-500">or</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.csv,.txt"
            className="hidden"
            onChange={(e) => e.target.files && chooseFiles(e.target.files)}
          />
          <div className="flex justify-center">
            {active ? (
              <Button onClick={() => setMinimized(true)}>
                <Minimize2 />
                Minimize to Background
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => fileInput.current?.click()}
              >
                {tasks.length ? "Upload More Files" : "Browse Files"}
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-neutral-500">
            Supported formats: PDF, DOC, DOCX, CSV, TXT — Max 50MB per file
          </p>
        </DialogContent>
      </Dialog>
      {uploadOpen && minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-5 right-5 z-50 w-72 rounded-lg border border-primary bg-white p-3 text-left shadow-xl"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4 text-primary" />
            <span className="flex-1">
              Uploading {complete} of {tasks.length} files...
            </span>
            <Maximize2 className="h-4 w-4" />
          </div>
          <div className="mt-2 h-1.5 rounded bg-neutral-200">
            <div
              className="h-full rounded bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </button>
      )}
      <DeleteKnowledgeDialog
        open={Boolean(deleteTarget)}
        isPending={deleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
      <OfficeFilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </section>
  );
}
