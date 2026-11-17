"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  file?: File | null;
  name: string;
  mimeType?: string;
  error?: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  url?: string;
};

export function AttachmentPreviewDialog({ error = false, file, loading = false, name, mimeType, open, onOpenChange, url }: Props) {
  const [localUrl, setLocalUrl] = useState("");
  useEffect(() => {
    if (!file || !open) { setLocalUrl(""); return; }
    const next = URL.createObjectURL(file);
    setLocalUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file, open]);
  const source = file ? localUrl : url;
  const type = file?.type || mimeType || (name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "");

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="h-[88vh] grid-rows-[auto_minmax(0,1fr)] gap-3 p-4 sm:max-w-[min(94vw,1000px)]"><DialogHeader className="min-w-0 pr-8"><DialogTitle className="truncate text-base">{name}</DialogTitle><DialogDescription className="sr-only">Attachment preview</DialogDescription></DialogHeader><div className="min-h-0 overflow-hidden rounded-lg border bg-slate-200">{loading ? <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading preview...</div> : error ? <div className="flex h-full items-center justify-center text-sm text-red-600">Failed to get the attachment download link.</div> : source ? type.startsWith("image/") ? <img src={source} alt={name} className="h-full w-full object-contain" /> : <iframe src={source} title={name} className="h-full w-full border-0" /> : <div className="flex h-full items-center justify-center text-sm text-slate-600">Preview is not available.</div>}</div></DialogContent></Dialog>;
}
