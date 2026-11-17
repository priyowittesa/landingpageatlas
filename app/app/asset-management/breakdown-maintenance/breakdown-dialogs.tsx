"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import type { Breakdown, BreakdownInput, Severity } from "./use-breakdowns";
import { useBreakdown, useBreakdownDecision, useCreateBreakdownWorkOrder, useDeleteBreakdownAttachment, useEditBreakdown, useUploadBreakdownAttachments } from "./use-breakdowns";
import { BreakdownPhoto } from "./breakdown-photo";

const localDate=(value:string)=>{ if(!value)return ""; const date=new Date(value); if(Number.isNaN(date.getTime()))return ""; const offset=date.getTimezoneOffset()*60000; return new Date(date.getTime()-offset).toISOString().slice(0,16); };
const rfc3339=(value:string)=>new Date(value).toISOString().replace(".000Z","Z");

type DialogProps = {item:Breakdown|null;open:boolean;onOpenChange:(open:boolean)=>void};
export function EditBreakdownDialog(props:DialogProps){ return <EditBreakdownDialogForm key={`${props.item?.id}-${props.open}`} {...props}/>; }
function EditBreakdownDialogForm({item,open,onOpenChange}:DialogProps){
  const edit=useEditBreakdown(), upload=useUploadBreakdownAttachments(), removePhoto=useDeleteBreakdownAttachment();
  const detail=useBreakdown(open?item?.id:undefined);
  const [form,setForm]=useState(()=>({description:item?.description??"",impact:item?.impactDescription??"",severity:item?.severity??("low" as Severity),occurredAt:localDate(item?.occurredAt??""),estimatedAt:localDate(item?.estimatedReturnAt??"")}));
  if(!item)return null; const invalid=!form.description.trim()||!form.impact.trim()||!form.occurredAt||!form.estimatedAt;
  async function save(){ if(invalid)return; const payload:BreakdownInput={asset_id:item!.assetId,breakdown_description:form.description.trim(),impact_description:form.impact.trim(),severity:form.severity,occurred_at:rfc3339(form.occurredAt),estimated_return_at:rfc3339(form.estimatedAt)}; await edit.mutateAsync({id:item!.id,payload}); onOpenChange(false); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Edit Breakdown</DialogTitle><DialogDescription className="sr-only">Edit breakdown report</DialogDescription></DialogHeader><div className="space-y-4 rounded-xl border p-4"><div className="rounded-lg border p-3 text-sm font-semibold">{item.assetCode} - {item.assetName}</div><Field label="Breakdown Description"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="min-h-20 w-full rounded-lg border p-3 text-sm"/></Field><Field label="Severity"><select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value as Severity})} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field><Field label="Impact Description"><textarea value={form.impact} onChange={e=>setForm({...form,impact:e.target.value})} className="min-h-20 w-full rounded-lg border p-3 text-sm"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Occurred At"><input type="datetime-local" value={form.occurredAt} onChange={e=>setForm({...form,occurredAt:e.target.value})} className="h-10 w-full rounded-lg border px-3 text-sm"/></Field><Field label="Estimated Return to Service"><input type="datetime-local" value={form.estimatedAt} onChange={e=>setForm({...form,estimatedAt:e.target.value})} className="h-10 w-full rounded-lg border px-3 text-sm"/></Field></div><div><p className="text-xs font-medium">Photos</p><label className="mt-2 flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border bg-gray-50 text-xs text-gray-500 has-[:disabled]:cursor-wait has-[:disabled]:opacity-50"><ImagePlus className="h-4 w-4"/>{upload.isPending?"Uploading...":"Upload photos"}<input type="file" multiple accept="image/*" disabled={upload.isPending} className="hidden" onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";if(files.length)upload.mutate({id:item.id,files})}}/></label><PhotoRow item={detail.data??item} onDelete={id=>removePhoto.mutate(id)} deletingId={removePhoto.isPending?removePhoto.variables:undefined}/></div></div><DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button disabled={invalid||edit.isPending} onClick={save}>{edit.isPending?"Saving...":"Save"}</Button></DialogFooter></DialogContent></Dialog>;
}

type ApprovalDialogProps = DialogProps & { items?: Breakdown[]; onCompleted?: (ids: string[]) => void };
export function ApprovalDialog(props:ApprovalDialogProps){ return <ApprovalDialogForm key={`${props.items?.map((row)=>row.id).join(",") ?? props.item?.id}-${props.open}`} {...props}/>; }
function ApprovalDialogForm({item,items,open,onOpenChange,onCompleted}:ApprovalDialogProps){
  const approve=useBreakdownDecision("approval"), decline=useBreakdownDecision("declined");
  const [reason,setReason]=useState("");
  const [remaining,setRemaining]=useState<Breakdown[]>(()=>items?.length?items:item?[item]:[]);
  const [submitting,setSubmitting]=useState(false);
  const [failed,setFailed]=useState(false);
  if(!item)return null;
  async function decide(kind:"approve"|"decline"){
    if(!reason.trim()||submitting)return;
    setSubmitting(true);
    setFailed(false);
    const mutation=kind==="approve"?approve:decline;
    const succeeded:string[]=[];
    const failures:Breakdown[]=[];
    for(const row of remaining){
      try { await mutation.mutateAsync({id:row.id,reason:reason.trim()}); succeeded.push(row.id); }
      catch { failures.push(row); }
    }
    if(succeeded.length)onCompleted?.(succeeded);
    setSubmitting(false);
    if(failures.length){setRemaining(failures);setFailed(true);}
    else onOpenChange(false);
  }
  const bulk=remaining.length>1 || (items?.length??0)>1;
  const current=remaining[0]??item;
  return <Dialog open={open} onOpenChange={(next)=>!submitting&&onOpenChange(next)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Breakdown Approval</DialogTitle><DialogDescription>{bulk?`Approve or decline ${remaining.length} selected breakdowns.`:"Approve or decline breakdown."}</DialogDescription></DialogHeader><div className="space-y-4 rounded-xl border p-4">{bulk?<div className="max-h-32 overflow-y-auto rounded-lg border p-3 text-sm font-semibold">{remaining.map((row)=><div key={row.id}>{row.code} - {row.assetCode} - {row.assetName}</div>)}</div>:<><div className="rounded-lg border p-3 text-sm font-semibold">{current.assetCode} - {current.assetName}</div><Read label="Breakdown Description" value={current.description}/><Read label="Severity" value={current.severity}/><Read label="Impact Description" value={current.impactDescription}/><div className="grid gap-4 sm:grid-cols-2"><Read label="Occurred At" value={formatDate(current.occurredAt)}/><Read label="Estimated Return to Service" value={formatDate(current.estimatedReturnAt)}/></div><PhotoRow item={current}/></>}{failed&&<p role="alert" className="text-sm text-red-600">Some decisions failed. Only the remaining breakdowns will be retried.</p>}<Field label="Reason"><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Type here" className="min-h-20 w-full rounded-lg border p-3 text-sm"/></Field></div><DialogFooter className="sm:justify-between"><Button variant="outline" disabled={submitting} onClick={()=>onOpenChange(false)}>Cancel</Button><div className="flex gap-2"><Button variant="outline" className="border-red-500 text-red-500" disabled={!reason.trim()||submitting} onClick={()=>decide("decline")}>{submitting?"Processing...":`Decline${bulk?` (${remaining.length})`:""}`}</Button><Button disabled={!reason.trim()||submitting} onClick={()=>decide("approve")}>{submitting?"Processing...":`Approve${bulk?` (${remaining.length})`:""}`}</Button></div></DialogFooter></DialogContent></Dialog>;
}

export function CreateBreakdownWorkOrderDialog({open,onOpenChange,items,initialId}:{open:boolean;onOpenChange:(open:boolean)=>void;items:Breakdown[];initialId?:string}){
  return <CreateBreakdownWorkOrderForm key={`${initialId ?? "new"}-${open}`} open={open} onOpenChange={onOpenChange} items={items} initialId={initialId}/>;
}
function CreateBreakdownWorkOrderForm({open,onOpenChange,items,initialId}:{open:boolean;onOpenChange:(open:boolean)=>void;items:Breakdown[];initialId?:string}){
  const create=useCreateBreakdownWorkOrder();
  const [selectedId,setSelectedId]=useState(initialId??"");
  const item=items.find(row=>row.id===selectedId);
  const [title,setTitle]=useState(item?`${item.assetCode} - ${item.assetName}`:"");
  const [description,setDescription]=useState(item?.description??"");
  const [priority,setPriority]=useState("low");
  const [occurredAt,setOccurredAt]=useState(localDate(item?.occurredAt??""));
  const [estimatedAt,setEstimatedAt]=useState(localDate(item?.estimatedReturnAt??""));
  const choose=(id:string)=>{const breakdown=items.find(row=>row.id===id);setSelectedId(id);setTitle(breakdown?`${breakdown.assetCode} - ${breakdown.assetName}`:"");setDescription(breakdown?.description??"");setOccurredAt(localDate(breakdown?.occurredAt??""));setEstimatedAt(localDate(breakdown?.estimatedReturnAt??""));};
  const invalid=!item||!title.trim()||!description.trim()||!priority||!occurredAt||!estimatedAt||new Date(estimatedAt)<new Date(occurredAt);
  async function submit(event:React.FormEvent){event.preventDefault();if(invalid||!item)return;await create.mutateAsync({breakdown_id:item.id,title:title.trim(),problem_description:description.trim(),priority,occurred_at:rfc3339(occurredAt),estimated_return_at:rfc3339(estimatedAt)});onOpenChange(false);}
  const inputClass="h-10 w-full rounded-lg border bg-white px-3 text-sm";
  return <Dialog open={open} onOpenChange={(next)=>!create.isPending&&onOpenChange(next)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Create Work Order from Breakdown</DialogTitle><DialogDescription className="sr-only">Create a work order linked to a breakdown</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><div className="space-y-4 rounded-xl border p-4"><select aria-label="Select breakdown" required value={selectedId} onChange={event=>choose(event.target.value)} className={inputClass}><option value="">Select breakdown</option>{items.map(row=><option key={row.id} value={row.id}>{row.code} - {row.assetCode} - {row.assetName}</option>)}</select><Field label="Work Order Title"><input required value={title} onChange={event=>setTitle(event.target.value)} className={inputClass} placeholder="Enter work order title"/></Field><Field label="Problem Description"><textarea required value={description} onChange={event=>setDescription(event.target.value)} className="min-h-20 w-full rounded-lg border p-3 text-sm" placeholder="Type here"/></Field><Read label="Severity" value={item?.severity??"-"}/><Field label="Priority"><select required value={priority} onChange={event=>setPriority(event.target.value)} className={inputClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field><Read label="Maintenance Type" value="Breakdown"/><Read label="Reported By" value={item?.reportedBy??"-"}/><div className="grid gap-4 sm:grid-cols-2"><Field label="Occurred At"><input required type="datetime-local" value={occurredAt} onChange={event=>setOccurredAt(event.target.value)} className={inputClass}/></Field><Field label="Estimated Return to Service"><input required type="datetime-local" min={occurredAt} value={estimatedAt} onChange={event=>setEstimatedAt(event.target.value)} className={inputClass}/></Field></div></div><DialogFooter><Button type="button" variant="outline" disabled={create.isPending} onClick={()=>onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={invalid||create.isPending}>{create.isPending?"Creating...":"Create"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-xs font-medium">{label} <span className="text-red-500">*</span><div className="mt-2">{children}</div></label>}
function Read({label,value}:{label:string;value:string}){return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm">{value||"-"}</p></div>}
function formatDate(value:string){if(!value)return "-";const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short"}).format(date)}
function PhotoRow({item,onDelete,deletingId}:{item:Breakdown;onDelete?:(id:string)=>void;deletingId?:string}){if(item.attachments.length===0)return null;return <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">{item.attachments.map(photo=><div key={photo.id} className="relative"><BreakdownPhoto {...photo} className="aspect-square h-auto w-full"/>{onDelete&&<button type="button" aria-label={`Delete ${photo.name}`} disabled={Boolean(deletingId)} onClick={()=>onDelete(photo.id)} className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"><Trash2 className="h-3 w-3"/></button>}</div>)}</div>}
