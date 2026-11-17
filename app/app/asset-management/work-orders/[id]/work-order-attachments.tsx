"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import { cn } from "@/lib/utils";
import type { WorkOrderAttachment } from "../use-work-orders";
import { useDeleteWorkOrderAttachment, useUploadWorkOrderAttachments, useWorkOrderAttachmentUrl } from "../use-work-orders";

export function WorkOrderAttachments({ workOrderId, attachments, readOnly = false }: { workOrderId: string; attachments: WorkOrderAttachment[]; readOnly?: boolean }) {
  const input = useRef<HTMLInputElement>(null); const upload = useUploadWorkOrderAttachments(workOrderId); const remove = useDeleteWorkOrderAttachment(workOrderId);
  const [dragging, setDragging] = useState(false); const [deleting, setDeleting] = useState<WorkOrderAttachment | null>(null);
  const choose = (list: FileList | File[]) => { const files = Array.from(list).filter((file) => file.type.startsWith("image/")); if (files.length) upload.mutate(files); };
  return <section className="rounded-xl border bg-white p-5 shadow-sm"><header className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4"/>Photos &amp; Attachments</h2>{!readOnly && <Button size="sm" disabled={upload.isPending} onClick={() => input.current?.click()}>{upload.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}Add Photo</Button>}</header>
    <input ref={input} type="file" multiple accept="image/*" className="hidden" onChange={(event) => { if (event.target.files) choose(event.target.files); event.target.value = ""; }}/>
    {!readOnly && <button type="button" disabled={upload.isPending} onClick={() => input.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files); }} className={cn("flex min-h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50 px-4 text-center transition", dragging ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400", upload.isPending && "cursor-wait opacity-60")}>
      {upload.isPending ? <Loader2 className="h-6 w-6 animate-spin text-primary-600"/> : <ImageIcon className="h-6 w-6 text-gray-400"/>}<span className="mt-2 text-sm font-medium text-gray-700">Drop images here or click to upload</span><span className="mt-1 text-xs text-gray-400">Multiple images are supported</span>
    </button>}
    {attachments.length > 0 && <div className={cn("flex flex-wrap gap-3", !readOnly && "mt-4")}>{attachments.map((attachment) => <AttachmentPreview key={attachment.id} attachment={attachment} onDelete={readOnly ? undefined : () => setDeleting(attachment)}/>)}</div>}
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }} title="Delete attachment?" description={`Delete ${deleting?.name ?? "this image"} from this work order?`} confirmLabel="Delete" isLoading={remove.isPending} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }}/>
  </section>;
}

function AttachmentPreview({ attachment, onDelete }: { attachment: WorkOrderAttachment; onDelete?: () => void }) {
  const file = useWorkOrderAttachmentUrl(attachment.id, attachment.url); const source = file.data;
  return <div className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-gray-100">{source ? <button type="button" title={`Open ${attachment.name}`} onClick={() => window.open(source, "_blank", "noopener,noreferrer")} className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105" style={{ backgroundImage: `url(${JSON.stringify(source).slice(1, -1)})` }}/> : <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-[10px] text-gray-500">{file.isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <ImageIcon className="h-5 w-5"/>}<span className="line-clamp-2">{file.isError ? "Unable to load" : attachment.name}</span></div>}{onDelete && <button type="button" aria-label={`Delete ${attachment.name}`} onClick={onDelete} className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"><Trash2 className="h-3 w-3"/></button>}</div>;
}
