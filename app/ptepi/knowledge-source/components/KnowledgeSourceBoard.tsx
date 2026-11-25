"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  CircleCheck,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  LoaderCircle,
  Table2,
  Upload,
  type LucideIcon
} from "lucide-react";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import type { TableColumn, TableFilter } from "@/types/type";
import { cn } from "@/lib/utils";
import { formatDate } from "../../format";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { Tr, useT } from "../../components/Tr";
import type { KnowledgeNote, KnowledgeSource, SourceFolder, SourceStatus } from "../../knowledge/data";
import { filterSources, formatFileSize, getNotesFromSource } from "../../knowledge/logic";

const STATUS: Record<SourceStatus, { label: string; hint: string; variant: "green" | "yellow" | "red" | "secondary"; Icon: LucideIcon; text: string }> = {
  ready: { label: "Ready", hint: "Nexa can answer from it", variant: "green", Icon: CircleCheck, text: "text-green-800" },
  chunking: { label: "Chunking", hint: "Splitting into passages", variant: "yellow", Icon: LoaderCircle, text: "text-amber-900" },
  uploaded: { label: "Uploaded", hint: "Waiting for extraction", variant: "secondary", Icon: Upload, text: "text-gray-700" },
  failed: { label: "Failed", hint: "Scan has no text layer", variant: "red", Icon: CircleAlert, text: "text-red-700" }
};

const TYPE_ICON = { PDF: FileText, DOCX: FileText, XLSX: FileSpreadsheet } as const;

type KnowledgeSourceBoardProps = {
  folders: SourceFolder[];
  sources: KnowledgeSource[];
  notes: KnowledgeNote[];
};

/** Knowledge Source of the demo: the files ATLAS learns from, by folder, with their extraction status. */
export function KnowledgeSourceBoard({ folders, sources, notes }: KnowledgeSourceBoardProps) {
  const t = useT();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const rows = filterSources(sources, { folderId, status, query });
  const folderTitle = folders.find((folder) => folder.id === folderId)?.title ?? "All files";

  const columns: TableColumn<KnowledgeSource>[] = [
    {
      key: "name",
      header: <Tr>File</Tr>,
      render: (row) => {
        const Icon = TYPE_ICON[row.type];
        return (
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Icon size={16} aria-hidden />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-semibold text-gray-950">{row.name}</span>
              <span className="text-xs text-muted-foreground">
                {row.type} · {formatFileSize(row.size)} · {t("Uploaded")} {formatDate(row.uploadedAt)}
              </span>
            </span>
          </span>
        );
      }
    },
    {
      key: "status",
      header: <Tr>Status</Tr>,
      render: (row) => {
        const state = STATUS[row.status];
        return (
          <span className="block leading-tight">
            <Badge variant={state.variant} className={cn("gap-1.5 rounded-full px-2.5 ring-1 ring-inset ring-current/15", state.text)}>
              <state.Icon size={14} aria-hidden className={row.status === "chunking" ? "animate-spin" : undefined} />
              {t(state.label)}
            </Badge>
            <span className="mt-1 block text-xs text-muted-foreground">{t(state.hint)}</span>
          </span>
        );
      }
    },
    {
      key: "extraction",
      header: <Tr>Extraction</Tr>,
      render: (row) => (
        <span className="flex flex-wrap gap-1.5">
          {row.extractKnowledge && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
              <FileText size={12} aria-hidden />
              {t("Knowledge")}
            </span>
          )}
          {row.extractTables && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
              <Table2 size={12} aria-hidden />
              {t("Tables")}
            </span>
          )}
        </span>
      )
    },
    {
      key: "notes",
      header: <Tr>Used in notes</Tr>,
      render: (row) => {
        const used = getNotesFromSource(row.id, notes);
        return used.length > 0 ? (
          <Link href="/ptepi/knowledge-base" className="text-primary-800 hover:underline" title={used.map((note) => note.title).join(", ")}>
            {used.length} {t(used.length === 1 ? "note" : "notes")}
          </Link>
        ) : (
          <span className="text-gray-600">{t("No note yet")}</span>
        );
      }
    }
  ];

  const filters: TableFilter[] = [
    {
      key: "status",
      placeholder: t("All status"),
      value: status,
      onChange: setStatus,
      options: [
        { label: t("All status"), value: "all" },
        ...(Object.keys(STATUS) as SourceStatus[]).map((value) => ({ label: t(STATUS[value].label), value }))
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(15rem,18%)_minmax(0,1fr)]">
      <aside className="ptepi-card h-fit overflow-hidden" aria-label={t("Folders")}>
        <h2 className="border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-4 py-4 text-base font-semibold">
          {t("Folders")}
        </h2>
        <ul className="space-y-1 p-3">
          {[{ id: null, title: "All files", count: sources.length }, ...folders.map((folder) => ({ id: folder.id as string | null, title: folder.title, count: sources.filter((source) => source.folderId === folder.id).length }))].map((folder) => {
            const selected = folder.id === folderId;
            const Icon = selected ? FolderOpen : Folder;
            return (
              <li key={folder.id ?? "all"}>
                <button
                  type="button"
                  onClick={() => setFolderId(folder.id)}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selected ? "bg-primary-50 font-semibold text-primary-900" : "text-gray-800 hover:bg-primary-50/60"
                  )}
                >
                  <Icon size={16} aria-hidden className="shrink-0 text-primary-600" />
                  <span className="min-w-0 flex-1 truncate">{t(folder.title)}</span>
                  <span className="rounded-full bg-gray-100 px-1.5 text-[0.75rem] tabular-nums text-gray-700">{folder.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="ptepi-card min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden className="mt-1 h-5 w-1 shrink-0 rounded-full bg-primary-600" />
            <div>
              <h2 className="text-base font-semibold">{t(folderTitle)}</h2>
              <p className="text-sm text-muted-foreground">{t("Files ATLAS reads into knowledge and tables for Nexa.")}</p>
            </div>
          </div>
          <SyntheticDataBadge />
        </div>
        <div className="p-2">
          <Table
            name="file"
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder={t("Search file name")}
            filters={filters}
            onResetFilters={() => {
              setQuery("");
              setStatus("all");
              setFolderId(null);
            }}
            emptyState={{ description: t("No file matches the filters.") }}
          />
        </div>
      </section>
    </div>
  );
}
