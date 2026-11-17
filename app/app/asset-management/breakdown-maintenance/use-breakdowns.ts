"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction-equipment/breakdowns";

export type Severity = "low" | "medium" | "high" | "critical";
export type Breakdown = {
  id: string; code: string; assetId: string; assetCode: string; assetName: string; model: string;
  project: string; description: string; impactDescription: string; severity: Severity; status: string;
  occurredAt: string; estimatedReturnAt: string; reportedBy: string; reportedAt: string;
  approvalAt: string; approvalBy: string; approvalReason: string;
  workOrderStatus: string; attachments: { id: string; name: string; url?: string }[];
};
export type BreakdownInput = { asset_id: string; breakdown_description: string; severity: Severity; impact_description: string; occurred_at: string; estimated_return_at: string };
export type BreakdownFilters = { search?: string; severity?: string; approval_status?: string; page_size: number; page_token?: string };

function object(value: unknown) { return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>; }
function unwrap(value: unknown) { let current = value; for (let i=0;i<3;i+=1) { const row=object(current); if (!("data" in row)) break; current=row.data; } return object(current); }
function text(value: unknown, fallback="-") { if (value && typeof value === "object") { const row=object(value); return String(row.name ?? row.full_name ?? row.code ?? fallback); } return value == null || value === "" ? fallback : String(value); }
function normalize(raw: unknown, index=0): Breakdown {
  const row=object(raw), asset=object(row.asset ?? row.equipment), reporter=object(row.reported_by ?? row.reporter);
  const rawFiles = row.attachments ?? row.photos ?? row.files;
  return {
    id: String(row.id ?? row.breakdown_id ?? index), code: text(row.breakdown_code ?? row.code),
    assetId: String(row.asset_id ?? asset.id ?? ""), assetCode: text(row.asset_code ?? asset.code),
    assetName: text(row.asset_name ?? asset.name), model: text(row.asset_model ?? row.model ?? asset.model), project: text(row.project_name ?? row.project ?? asset.project),
    description: text(row.breakdown_description ?? row.description, ""), impactDescription: text(row.impact_description ?? row.impact, ""),
    severity: String(row.severity ?? "low").toLowerCase() as Severity, status: text(row.approval_status ?? row.status),
    occurredAt: text(row.occurred_at, ""), estimatedReturnAt: text(row.estimated_return_at, ""),
    reportedBy: text(reporter.name ?? reporter.full_name ?? row.reported_by_name ?? row.reported_by), reportedAt: text(row.reported_at ?? row.created_at, ""),
    approvalAt: text(row.approval_at, ""), approvalBy: text(row.approval_by, ""), approvalReason: text(row.approval_reason, ""),
    workOrderStatus: text(row.work_order_status ?? row.wo_status, "not_yet").replaceAll("_", " "),
    attachments: Array.isArray(rawFiles) ? rawFiles.map((file, i) => { const item=object(file); return { id:String(item.id ?? item.attachment_id ?? i), name:text(item.original_name ?? item.display_name ?? item.file_name ?? item.name, `Photo ${i+1}`), url:item.url ? String(item.url) : item.download_url ? String(item.download_url) : undefined }; }) : [],
  };
}

export function useBreakdowns(filters: BreakdownFilters) {
  return useQuery<{items:Breakdown[];nextPageToken:string;totalCount:number}, AxiosError<ApiResponseError>>({
    queryKey:["asset-management","breakdowns",filters], queryFn:async()=>{ const body=unwrap((await axios.get(URL,{params:filters})).data); const rows=body.items ?? body.breakdowns ?? body.results; return { items:Array.isArray(rows)?rows.map(normalize):[], nextPageToken:String(body.next_page_token ?? body.nextPageToken ?? ""), totalCount:Number(body.total_count ?? body.totalCount ?? 0) }; },
    placeholderData:(previous)=>previous, refetchOnWindowFocus:false, meta:{errorMessage:"Failed to load breakdowns"},
  });
}
export function useBreakdown(id?:string) { return useQuery<Breakdown,AxiosError<ApiResponseError>>({ queryKey:["asset-management","breakdowns",id], enabled:Boolean(id), queryFn:async()=>{ const body=unwrap((await axios.get(`${URL}/${id}`)).data); return normalize(body.breakdown ?? body.item ?? body); }, meta:{errorMessage:"Failed to load breakdown detail"} }); }

function useRefreshMutation<T>(mutationFn:(variables:T)=>Promise<unknown>, successMessage:string) { const client=useQueryClient(); return useMutation<unknown,AxiosError<ApiResponseError>,T>({ mutationFn, onSuccess:()=>client.invalidateQueries({queryKey:["asset-management","breakdowns"]}), meta:{errorMessage:"Breakdown action failed",successMessage} }); }
export function useEditBreakdown() { return useRefreshMutation<{id:string;payload:BreakdownInput}>(async({id,payload})=>(await axios.put(`${URL}/${id}`,payload)).data,"Breakdown updated successfully"); }
export function useUploadBreakdownAttachments() { return useRefreshMutation<{id:string;files:File[]}>(async({id,files})=>{ const data=new FormData(); files.forEach(file=>data.append("files",file)); return (await axios.post(`${URL}/${id}/attachments`,data,{headers:{"Content-Type":"multipart/form-data"}})).data; },"Breakdown photos uploaded successfully"); }
export function useDeleteBreakdownAttachment() { return useRefreshMutation<string>(async(id)=>(await axios.delete(`${URL}/attachments/${id}`)).data,"Breakdown photo deleted successfully"); }
export function useBreakdownDecision(decision:"approval"|"declined") { return useRefreshMutation<{id:string;reason:string}>(async({id,reason})=>(await axios.post(`${URL}/${id}/${decision}`,{reason})).data, decision === "approval" ? "Breakdown approved successfully" : "Breakdown declined successfully"); }
export type BreakdownWorkOrderPayload = {
  breakdown_id: string;
  estimated_return_at: string;
  occurred_at: string;
  priority: string;
  problem_description: string;
  title: string;
};
export function useCreateBreakdownWorkOrder() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, BreakdownWorkOrderPayload>({
    mutationFn: async (payload) => (await axios.post("/v1/construction-equipment/work-orders/from-breakdown", payload)).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "breakdowns"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders"] }),
      ]);
    },
    meta: { errorMessage: "Failed to create work order", successMessage: "Work order created successfully" },
  });
}
export async function getAttachmentUrl(id:string) { const body=unwrap((await axios.get(`${URL}/attachments/${id}/download`)).data); return String(body.url ?? body.download_url ?? ""); }
export function useAttachmentUrl(id:string,url?:string) { return useQuery<string,AxiosError<ApiResponseError>>({ queryKey:["asset-management","breakdown-attachment",id], enabled:Boolean(id)&&!url, queryFn:()=>getAttachmentUrl(id), initialData:url, staleTime:5*60*1000, meta:{errorMessage:"Failed to load breakdown photo"} }); }
