"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Terminal, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capacityError, downloadCapacityTemplate, uploadCapacityFile, validateUpload } from "../api";
import { useCapacityMutation } from "../use-capacity";
import { UploadOutput } from "./UploadHistory";

export function UploadPanel({ kind, onClose }: { kind: "marketing-data" | "master-part"; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [dragging, setDragging] = useState(false);
  const upload = useCapacityMutation((selected: File) => uploadCapacityFile(kind, selected));
  const title = kind === "marketing-data" ? "Upload Marketing Data" : "Upload Master Part";
  const selectFile = (selected: File | null) => {
    upload.reset(); setSelectionError(""); setFile(null);
    if (!selected) return;
    try { validateUpload(selected); setFile(selected); }
    catch (error) { setSelectionError(capacityError(error)); }
  };
  return (
    <aside aria-label={title} className="w-full min-w-0 space-y-4 rounded-lg border border-border bg-background p-6 xl:sticky xl:top-20 xl:w-[368px] xl:shrink-0 xl:self-start">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-2.5"><Terminal size={20} className="shrink-0" /><h2 className="text-lg font-semibold">{title}</h2></div>
        <Button variant="secondary" size="icon" className="size-8 shrink-0" disabled={upload.isPending} aria-label="Close upload panel" onClick={onClose}><X size={16} /></Button>
      </div>
      <Button variant="outline" className="w-full" disabled={downloading} onClick={async () => {
        setDownloading(true); setDownloadError("");
        try { await downloadCapacityTemplate(kind); } catch (error) { setDownloadError(capacityError(error)); }
        finally { setDownloading(false); }
      }}><Download size={16} />{downloading ? "Downloading..." : "Download Template"}</Button>
      <label
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-5 text-center text-sm focus-within:ring-2 focus-within:ring-ring ${dragging ? "border-primary bg-primary/5" : "border-border"} ${upload.isPending || !upload.canManage ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50"}`}
        onDragOver={(event) => { event.preventDefault(); if (!upload.isPending && upload.canManage) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); if (!upload.isPending && upload.canManage) selectFile(event.dataTransfer.files[0] ?? null); }}
      >
        <FileSpreadsheet size={24} className="text-muted-foreground" />
        <span className="font-medium">{upload.data ? "Choose another file" : "Click to upload or drag and drop"}</span>
        <span className="text-xs text-muted-foreground">Excel file (.xlsx, up to 10 MB)</span>
        <input aria-label="Excel file (.xlsx, up to 10 MB)" type="file" accept=".xlsx" disabled={upload.isPending || !upload.canManage} className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
      </label>
      {file && !upload.data && <div className="space-y-1 rounded-lg bg-muted p-3">
        <p className="break-all text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB - Ready to upload</p>
      </div>}
      {!upload.data && <Button className="w-full" disabled={!file || upload.isPending || !upload.canManage} onClick={() => file && upload.mutate(file)}><Upload size={16} />{upload.isPending ? "Uploading..." : "Upload"}</Button>}
      {(upload.error || downloadError || selectionError) && <p role="alert" className="break-words text-sm text-destructive">{selectionError || downloadError || capacityError(upload.error)}</p>}
      {upload.data && <UploadOutput result={upload.data} />}
    </aside>
  );
}
