"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Asset } from "./data";
import { useReportBreakdown, type BreakdownPayload } from "./use-assets";

type Props = { asset: Asset | null; open: boolean; onOpenChange: (open: boolean) => void };
const emptyForm = { breakdown_description: "", severity: "", impact_description: "", occurred_at: "", estimated_return_at: "" };

function toRfc3339(value: string) {
  return new Date(value).toISOString().replace(".000Z", "Z");
}

export function ReportBreakdownDialog({ asset, open, onOpenChange }: Props) {
  const report = useReportBreakdown();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  function close(next: boolean) { if (!next && !report.isPending) { previews.forEach((item) => URL.revokeObjectURL(item.url)); setForm(emptyForm); setFiles([]); setSubmitted(false); } onOpenChange(next); }
  function addFiles(list: FileList | null) { if (!list) return; setFiles((current) => [...current, ...Array.from(list).filter((file) => file.type.startsWith("image/"))].slice(0, 5)); }
  const invalid = !form.breakdown_description.trim() || !form.severity || !form.impact_description.trim() || !form.occurred_at || !form.estimated_return_at || files.length === 0;
  async function submit(event: React.FormEvent) { event.preventDefault(); setSubmitted(true); if (!asset || invalid) return; await report.mutateAsync({ payload: { asset_id: asset.id, ...form, severity: form.severity as BreakdownPayload["severity"], occurred_at: toRfc3339(form.occurred_at), estimated_return_at: toRfc3339(form.estimated_return_at) }, files }); close(false); }

  return <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl"><DialogHeader className="border-b px-6 py-5"><DialogTitle>Report Breakdown</DialogTitle><DialogDescription className="sr-only">Report an equipment breakdown</DialogDescription></DialogHeader>
    <form onSubmit={submit}><div className="mx-6 my-5 overflow-hidden rounded-xl border"><div className="border-b px-5 py-4 text-sm font-semibold">{asset?.code} - {asset?.name}</div><div className="space-y-4 p-5">
      <Field label="Breakdown Description"><textarea value={form.breakdown_description} onChange={(e)=>setForm({...form,breakdown_description:e.target.value})} placeholder="Type here" className="min-h-20 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300"/>{submitted && !form.breakdown_description.trim() && <Error/>}</Field>
      <Field label="Severity"><select value={form.severity} onChange={(e)=>setForm({...form,severity:e.target.value})} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Select severity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>{submitted && !form.severity && <Error/>}</Field>
      <Field label="Impact Description"><textarea value={form.impact_description} onChange={(e)=>setForm({...form,impact_description:e.target.value})} placeholder="Type here" className="min-h-20 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300"/>{submitted && !form.impact_description.trim() && <Error/>}</Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Occurred At"><input type="datetime-local" value={form.occurred_at} onChange={(e)=>setForm({...form,occurred_at:e.target.value})} className="h-10 w-full rounded-lg border px-3 text-sm"/>{submitted && !form.occurred_at && <Error/>}</Field><Field label="Estimated Return to Service"><input type="datetime-local" value={form.estimated_return_at} onChange={(e)=>setForm({...form,estimated_return_at:e.target.value})} className="h-10 w-full rounded-lg border px-3 text-sm"/>{submitted && !form.estimated_return_at && <Error/>}</Field></div>
      <Field label="Photos"><button type="button" onClick={()=>inputRef.current?.click()} onDrop={(e)=>{e.preventDefault();addFiles(e.dataTransfer.files)}} onDragOver={(e)=>e.preventDefault()} className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border bg-gray-50 text-xs text-gray-500 hover:bg-gray-100"><ImagePlus className="h-5 w-5"/>Upload or drag files to here</button><input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>addFiles(e.target.files)}/>{submitted && files.length===0 && <Error/>}
        {previews.length>0 && <div className="mt-3 flex flex-wrap gap-3">{previews.map(({file,url},index)=><div key={`${file.name}-${index}`} className="relative h-20 w-20"><Image src={url} alt={file.name} fill unoptimized className="rounded-lg object-cover"/><button type="button" onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))} className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white"><Trash2 className="h-3 w-3"/></button></div>)}</div>}
      </Field>
    </div></div><DialogFooter className="border-t px-6 py-5"><Button type="button" variant="outline" disabled={report.isPending} onClick={()=>close(false)}>Cancel</Button><Button type="submit" disabled={report.isPending} className="bg-gray-950 hover:bg-gray-800">{report.isPending ? "Reporting..." : "Report"}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block text-xs font-medium">{label} <span className="text-red-500">*</span><div className="mt-2">{children}</div></label>; }
function Error(){return <p className="mt-1 text-[11px] text-red-500">This field is required.</p>}
