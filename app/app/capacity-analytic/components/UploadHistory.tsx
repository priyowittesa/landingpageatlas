"use client";

import { useState } from "react";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import type { UploadResult } from "../api-types";
import { capacityError, capacityWrite, formatNumber } from "../api";
import { useCapacityAccess, useCapacityMutation, useCapacityQuery } from "../use-capacity";
import { ApiState, StatusBadge } from "./ApiState";
import { ApiTable } from "./ApiTable";
import { selectClass } from "./CapacityFilters";

type UnmatchedPart = { id: string; part_number: string; product_label?: string; year: number; month: number; plan_type?: string; order_qty?: number; tentative_qty?: number; resolved?: boolean; resolved_at?: string };

export function UploadHistory({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState("marketing");
  const [selectedId, setSelectedId] = useState("");
  const [state, setState] = useState("waiting");
  const [confirmRemap, setConfirmRemap] = useState(false);
  const { canManage } = useCapacityAccess();
  const detail = useCapacityQuery<UploadResult>(`/uploads/${encodeURIComponent(selectedId)}`, undefined, !!selectedId);
  const remap = useCapacityMutation(() => capacityWrite<{ resolved_part_numbers?: string[]; waiting_part_count: number }>("/unmatched-parts/remap"));
  return <Dialog open onOpenChange={(open) => !open && !remap.isPending && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader><DialogTitle>Upload History & Unmatched Parts</DialogTitle></DialogHeader>
      <label className="space-y-1 text-sm">Upload Type<select aria-label="Upload Type" className={selectClass} value={kind} onChange={(e) => { setKind(e.target.value); setSelectedId(""); }}>
        <option value="marketing">Marketing Data</option><option value="master_part">Master Part</option>
      </select></label>
      <ApiTable<UploadResult> title="Upload History" path="/uploads" params={{ kind }} getRowId={(row) => row.id} columns={[
        { key: "file_name", header: "File" },
        { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
        { key: "imported_rows", header: "Imported Rows", render: (row) => formatNumber(row.imported_rows) },
        { key: "created_at", header: "Uploaded", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
        { key: "details", header: "Details", render: (row) => <Button variant="ghost" onClick={() => setSelectedId(row.id)}>View Output</Button> },
      ]} />
      {selectedId && <section aria-label="Upload Details" className="space-y-3 rounded-lg border p-4">
        <ApiState query={detail} />
        {detail.data && <UploadOutput result={detail.data} />}
      </section>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm">Mapping State<select aria-label="Mapping State" className={selectClass} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="waiting">Waiting</option><option value="resolved">Resolved</option><option value="all">All</option>
        </select></label>
        {canManage && <Button disabled={remap.isPending} onClick={() => { remap.reset(); setConfirmRemap(true); }}>Remap Unmatched Parts</Button>}
      </div>
      <ApiTable<UnmatchedPart> title="Unmatched Parts" path="/unmatched-parts" params={{ state }} getRowId={(row) => row.id} columns={[
        { key: "part_number", header: "Part Number" },
        { key: "product_label", header: "Product" },
        { key: "year", header: "Year" }, { key: "month", header: "Month" },
        { key: "plan_type", header: "Plan" },
        { key: "order_qty", header: "Order", render: (row) => formatNumber(row.order_qty) },
        { key: "tentative_qty", header: "Tentative", render: (row) => formatNumber(row.tentative_qty) },
        { key: "resolved", header: "Mapping", render: (row) => row.resolved ? "Resolved" : "Waiting" },
      ]} />
      {remap.error && <p role="alert" className="text-sm text-destructive">{capacityError(remap.error)}</p>}
      {remap.isSuccess && <p role="status" className="text-sm text-emerald-700">Mapped {remap.data.resolved_part_numbers?.length ?? 0} part numbers; {remap.data.waiting_part_count} still waiting. The dashboard and mapping lists have been refreshed.</p>}
      <ConfirmationModal open={confirmRemap} onOpenChange={(open) => { if (!remap.isPending) setConfirmRemap(open); }}
        title="Remap Unmatched Parts?" description="Retry mapping waiting marketing records against the current master parts." confirmLabel="Remap" isLoading={remap.isPending}
        onConfirm={async () => { try { await remap.mutateAsync(); setConfirmRemap(false); } catch { /* Keep confirmation open. */ } }} />
    </DialogContent>
  </Dialog>;
}

export function UploadOutput({ result }: { result: UploadResult }) {
  const bytes = result.file_size_bytes ? Number(result.file_size_bytes) : undefined;
  const size = bytes == null || !Number.isFinite(bytes) ? "-" : bytes < 1024 * 1024 ? `${formatNumber(bytes / 1024)} KB` : `${formatNumber(bytes / (1024 * 1024))} MB`;
  return <div className="space-y-3">
    <div className="space-y-2 rounded-[10px] bg-muted p-3">
      <div className="flex items-start gap-2.5"><File size={18} className="shrink-0" /><p className="min-w-0 break-all text-sm font-medium">{result.file_name}</p></div>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{size}{result.created_at ? ` - ${new Date(result.created_at).toLocaleString()}` : ""}</p><StatusBadge value={result.status} /></div>
      <p className="text-xs text-muted-foreground">{formatNumber(result.imported_rows)} of {formatNumber(result.total_rows)} rows imported</p>
      {result.unmatched_count != null && <p className="text-xs text-muted-foreground">{formatNumber(result.unmatched_count)} unmatched parts</p>}
    </div>
    <h3 className="text-xs font-medium text-muted-foreground">Processing Output</h3>
    <div role="log" aria-label="Processing Output" className="max-h-[65vh] space-y-2 overflow-y-auto rounded-[10px] bg-gray-900 p-4 font-mono text-xs leading-[18px]">
      {(result.log ?? []).map((line, index) => <p key={index} className={`break-words whitespace-pre-wrap ${line.level.toLowerCase() === "error" ? "text-red-400" : line.level.toLowerCase() === "warning" ? "text-amber-400" : "text-emerald-400"}`}>{line.message}</p>)}
      {!result.log?.length && <p className="text-gray-400">No processing output was returned.</p>}
    </div>
  </div>;
}
