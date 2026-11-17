"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, Clock3, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { FrequencyTypeAudit } from "../types";
import { useFrequencyType, useFrequencyTypeAudits, useFrequencyTypeCategories, useFrequencyTypeUnits } from "../use-frequency-types";
import { FrequencyTypeDialog } from "../frequency-type-list";

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};

export function FrequencyTypeDetail({ id }: { id: string }) {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("all");
  const detail = useFrequencyType(id);
  const audits = useFrequencyTypeAudits(id, {
    activityType: activity === "all" ? undefined : activity,
    search,
    pageSize: 10,
  });
  const categories = useFrequencyTypeCategories();
  const units = useFrequencyTypeUnits();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const item = detail.data;

  useEffect(() => {
    setBreadcrumbs([
      { title: "Construction" },
      { title: "Frequency Type", href: "/app/asset-management/frequency-type" },
      { title: "Detail" },
    ]);
    return clearBreadcrumbs;
  }, [clearBreadcrumbs, setBreadcrumbs]);

  const logs = useMemo(() => {
    const all = audits.data?.pages.flatMap((page) => page.items) ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((log) => {
      const matchesActivity = activity === "all" || log.action === activity;
      const matchesSearch = !term || [log.action, log.actorName, log.description, ...Object.keys(log.dataAfter), ...Object.values(log.dataAfter).map(String)].some((value) => value.toLowerCase().includes(term));
      return matchesActivity && matchesSearch;
    });
  }, [activity, audits.data?.pages, search]);

  if (detail.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading frequency type...</div>;
  if (detail.isError || !item) return <div className="flex min-h-80 flex-col items-center justify-center gap-3"><p className="text-sm text-muted-foreground">Frequency type data could not be loaded.</p><Button variant="outline" onClick={() => detail.refetch()}>Try Again</Button></div>;

  return <div className="space-y-5 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Link href="/app/asset-management/frequency-type" aria-label="Back to frequency types"><ArrowLeft className="h-5 w-5" /></Link><h1 className="text-2xl font-bold">{item.code}: {item.name}</h1><span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{titleCase(item.status)}</span></div>
      <div className="flex gap-2"><Button size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit Data</Button><Button variant="outline" size="sm" onClick={() => audits.refetch()}><Clock3 className="h-4 w-4" />Audit Log</Button></div>
    </header>

    <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-5 text-sm font-semibold">Frequency Type Information</h2><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Info label="Frequency Code" value={item.code} /><Info label="Frequency Type Name" value={item.name} /><Info label="Category" value={item.category_name} /><Info label="Unit" value={item.unit_name} /><div className="sm:col-span-2 lg:col-span-4"><Info label="Description" value={item.description || "-"} /></div></dl></section>

    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4" />Audit Trail &amp; Change History</h2><div className="flex gap-2"><Input className="h-9 w-56" placeholder="Search history..." value={search} onChange={(event) => setSearch(event.target.value)} /><Select value={activity} onValueChange={setActivity}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Activities</SelectItem><SelectItem value="new_registration">New Registration</SelectItem><SelectItem value="information_change">Information Change</SelectItem><SelectItem value="status_change">Status Change</SelectItem><SelectItem value="removed">Removed</SelectItem></SelectContent></Select></div></div>
      {audits.isLoading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading audit history...</p> : audits.isError ? <div className="py-12 text-center"><p className="text-sm text-red-600">Audit history could not be loaded.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => audits.refetch()}>Try Again</Button></div> : logs.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No audit history found.</p> : <div className="divide-y">{logs.map((log) => <AuditItem key={log.id} log={log} />)}</div>}
      {audits.hasNextPage ? <div className="pt-5 text-center"><Button variant="outline" size="sm" disabled={audits.isFetchingNextPage} onClick={() => audits.fetchNextPage()}>+ {audits.isFetchingNextPage ? "Loading..." : "Load More"}</Button></div> : null}
    </section>

    <FrequencyTypeDialog open={editing} item={item} onOpenChange={setEditing} categories={categories.data ?? []} units={units.data ?? []} />
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 text-sm font-semibold">{value}</dd></div>;
}

function auditKind(log: FrequencyTypeAudit) {
  if (log.action === "status_change" || log.statusBefore || log.statusAfter) return "status";
  if (log.action === "new_registration" || log.action.includes("creat") || log.action.includes("add")) return "created";
  if (log.action === "removed" || log.action.includes("delet") || log.action.includes("remov")) return "deleted";
  return "updated";
}

function AuditItem({ log }: { log: FrequencyTypeAudit }) {
  const kind = auditKind(log);
  const title = kind === "status" ? "Status Change" : kind === "created" ? "New Registration" : kind === "deleted" ? "Removed" : "Information Change";
  const subtitle = log.description || (kind === "created" ? "Initialized the initial frequency type master data" : kind === "status" ? "Updated the frequency type status" : "Updated frequency type information");
  const changes = buildChanges(log);
  return <article className="grid gap-4 py-5 md:grid-cols-[140px_1fr]"><div><time className="text-xs font-semibold">{date(log.createdAt)}</time><p className="mt-1 text-xs text-muted-foreground">{log.actorName}</p></div><div className="relative border-l border-gray-200 pl-5"><span className={`absolute -left-1.5 top-0 h-3 w-3 rounded-full ring-4 ring-white ${kind === "status" ? "bg-emerald-500" : kind === "updated" ? "bg-blue-500" : kind === "deleted" ? "bg-red-500" : "bg-gray-500"}`} /><h3 className="text-xs font-semibold">{title} <span className="font-normal text-muted-foreground">- {subtitle}</span></h3>{changes.length ? <div className="mt-3 rounded-md border bg-gray-50 p-3 text-xs">{changes.map((change) => <div key={change.label} className="grid gap-2 py-1 sm:grid-cols-[110px_1fr_20px_1fr]"><span className="text-muted-foreground">{change.label}</span><span>{change.before || "-"}</span><span>→</span><strong>{change.after || "-"}</strong></div>)}</div> : null}</div></article>;
}

function buildChanges(log: FrequencyTypeAudit) {
  if (log.statusBefore || log.statusAfter) return [{ label: "Status", before: titleCase(log.statusBefore), after: titleCase(log.statusAfter) }];
  const keys = [...new Set([...Object.keys(log.dataBefore), ...Object.keys(log.dataAfter)])].filter((key) => !key.endsWith("_id") && !["id", "updated_at", "created_at"].includes(key));
  return keys.flatMap((key) => {
    const before = log.dataBefore[key]; const after = log.dataAfter[key];
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    return [{ label: titleCase(key), before: before == null ? "" : String(before), after: after == null ? "" : String(after) }];
  });
}
