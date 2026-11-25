"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, BrainCircuit, Database, UserRound, type LucideIcon } from "lucide-react";
import Table from "@/components/Table";
import type { TableColumn, TableFilter } from "@/types/type";
import { cn } from "@/lib/utils";
import { formatDate } from "../../format";
import { SectionCard } from "../../components/SectionCard";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { Tr, useT } from "../../components/Tr";
import { useActionsStore } from "../../store/actions-store";
import { useRoleStore } from "../../store/role-store";
import { getDemoRole } from "../../store/roles";
import type { EpiAction } from "../../store/actions-store";
import { getSessionEvents, type AuditActorKind, type AuditCategory, type AuditEvent } from "../logic";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ACTOR: Record<AuditActorKind, { Icon: LucideIcon; className: string }> = {
  AI: { Icon: BrainCircuit, className: "bg-primary-50 text-primary-800" },
  Agent: { Icon: Bot, className: "bg-blue-50 text-blue-800" },
  Person: { Icon: UserRound, className: "bg-green-50 text-green-800" },
  System: { Icon: Database, className: "bg-gray-100 text-gray-700" }
};

const CATEGORIES: AuditCategory[] = ["AI answer", "Alert", "Approval", "Change"];

type AuditLogBoardProps = {
  events: AuditEvent[];
  seeds: EpiAction[];
};

/** S8 audit log: who did what and when, seeded from the demo data plus this session's changes. */
export function AuditLogBoard({ events, seeds }: AuditLogBoardProps) {
  const t = useT();
  const actions = useActionsStore((state) => state.actions);
  const roleId = useRoleStore((state) => state.roleId);
  const [category, setCategory] = useState(ALL);
  const [actor, setActor] = useState(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const actorLabel = `${t(getDemoRole(roleId).label)} (${t("demo role")})`;
  const all = useMemo(
    () => [...getSessionEvents(seeds, actions, actorLabel), ...events],
    [seeds, actions, actorLabel, events]
  );
  const needle = search.trim().toLowerCase();
  const rows = all.filter(
    (event) =>
      (category === ALL || event.category === category) &&
      (actor === ALL || event.actorKind === actor) &&
      (!needle || `${event.who} ${event.what} ${event.projectId ?? ""} ${event.detail ?? ""}`.toLowerCase().includes(needle))
  );

  const columns: TableColumn<AuditEvent>[] = [
    {
      key: "when",
      header: <Tr>When</Tr>,
      className: "whitespace-nowrap",
      render: (row) =>
        row.when ? (
          <span className="tabular-nums">{formatDate(row.when)}</span>
        ) : (
          <span className="font-medium text-primary-800"><Tr>This session</Tr></span>
        )
    },
    {
      key: "who",
      header: <Tr>Who</Tr>,
      render: (row) => {
        const { Icon, className } = ACTOR[row.actorKind];
        return (
          <span className="flex items-start gap-2">
            <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", className)}>
              <Icon size={14} aria-hidden />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-medium text-gray-950">{row.who}</span>
              <span className="text-xs text-muted-foreground"><Tr>{row.actorKind}</Tr></span>
            </span>
          </span>
        );
      }
    },
    {
      key: "what",
      header: <Tr>What</Tr>,
      render: (row) => (
        <span className="block min-w-64 max-w-xl leading-snug">
          <span className="block text-gray-950">{row.what}</span>
          {row.detail && <span className="block text-xs text-muted-foreground">{row.detail}</span>}
        </span>
      )
    },
    {
      key: "category",
      header: <Tr>Type</Tr>,
      render: (row) => (
        <span className="whitespace-nowrap rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-900">
          <Tr>{row.category}</Tr>
        </span>
      )
    },
    {
      key: "project",
      header: <Tr>Project</Tr>,
      render: (row) =>
        row.href ? (
          <Link href={row.href} className="whitespace-nowrap font-medium text-primary-800 hover:underline">
            {row.projectId ?? <Tr>Open</Tr>}
          </Link>
        ) : (
          row.projectId ?? "-"
        )
    }
  ];

  const filters: TableFilter[] = [
    {
      key: "category",
      placeholder: t("All types"),
      value: category,
      onChange: (value) => {
        setCategory(value);
        setPage(1);
      },
      options: [{ label: t("All types"), value: ALL }, ...CATEGORIES.map((item) => ({ label: t(item), value: item }))]
    },
    {
      key: "actor",
      placeholder: t("All actors"),
      value: actor,
      onChange: (value) => {
        setActor(value);
        setPage(1);
      },
      options: [
        { label: t("All actors"), value: ALL },
        ...(Object.keys(ACTOR) as AuditActorKind[]).map((item) => ({ label: t(item), value: item }))
      ]
    }
  ];

  return (
    <SectionCard
      title="Audit log"
      subtitle="AI answers, alerts, approvals and changes, newest first"
      badge={<SyntheticDataBadge />}
      flush
    >
      <Table
        name="event"
        columns={columns}
        data={rows.slice((page - 1) * pageSize, page * pageSize)}
        getRowId={(row) => row.id}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t("Search who, what or project")}
        filters={filters}
        onResetFilters={() => {
          setCategory(ALL);
          setActor(ALL);
          setSearch("");
          setPage(1);
        }}
        emptyState={{ description: t("No event matches the filters.") }}
        pagination={{
          page,
          pageSize,
          totalEntries: rows.length,
          onPageChange: setPage,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          }
        }}
      />
    </SectionCard>
  );
}
