"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Code, FlaskConical, Link2, Link2Off, PlugZap, ServerCog, Workflow as WorkflowIcon } from "lucide-react";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { TableColumn, TableFilter } from "@/types/type";
import { formatDate } from "../../format";
import { KpiCard } from "../../components/KpiCard";
import { SectionCard } from "../../components/SectionCard";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { Tr, useT } from "../../components/Tr";
import { useConnectionsStore } from "../../store/connections-store";
import type { ConnectionEnvironment, MasterConnection, Workflow } from "../../workflows/data";
import { getConnectionStats, getConnectionUsage, getWorkflowsAtRisk } from "../../workflows/logic";
import { CONNECTOR_STYLE } from "../../workflows/components/flow-style";

const ALL = "all";

const ENVIRONMENT: Record<ConnectionEnvironment, { label: string; variant: "green" | "yellow" | "secondary"; Icon: typeof Code; text: string }> = {
  production: { label: "Production", variant: "green", Icon: ServerCog, text: "text-green-800" },
  staging: { label: "Staging", variant: "yellow", Icon: FlaskConical, text: "text-amber-900" },
  development: { label: "Development", variant: "secondary", Icon: Code, text: "text-gray-700" }
};

type ConnectionsBoardProps = {
  connections: MasterConnection[];
  workflows: Workflow[];
};

/** Master Connections of the demo: the systems ATLAS reads and writes, with an active switch per connection. */
export function ConnectionsBoard({ connections, workflows }: ConnectionsBoardProps) {
  const t = useT();
  const active = useConnectionsStore((state) => state.active);
  const setActive = useConnectionsStore((state) => state.setActive);
  const [search, setSearch] = useState("");
  const [environment, setEnvironment] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const stats = getConnectionStats(connections, active, workflows);
  const atRisk = getWorkflowsAtRisk(workflows, active);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return connections.filter((connection) => {
      const isActive = active[connection.id];
      if (environment !== ALL && connection.environment !== environment) return false;
      if (status !== ALL && (status === "active") !== isActive) return false;
      return !needle || `${connection.name} ${connection.system} ${CONNECTOR_STYLE[connection.type].label}`.toLowerCase().includes(needle);
    });
  }, [connections, active, search, environment, status]);

  const columns: TableColumn<MasterConnection>[] = [
    {
      key: "name",
      header: <Tr>Connection</Tr>,
      render: (row) => (
        <span className="block leading-tight">
          <span className="block font-semibold text-gray-950">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.system}</span>
        </span>
      )
    },
    {
      key: "type",
      header: <Tr>Type</Tr>,
      render: (row) => {
        const { Icon, label } = CONNECTOR_STYLE[row.type];
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon size={16} aria-hidden className="text-primary-700" />
            {label}
          </span>
        );
      }
    },
    {
      key: "environment",
      header: <Tr>Environment</Tr>,
      render: (row) => {
        const env = ENVIRONMENT[row.environment];
        return (
          <Badge variant={env.variant} className={`gap-1.5 rounded-full px-2.5 ring-1 ring-inset ring-current/15 ${env.text}`}>
            <env.Icon size={14} aria-hidden />
            {t(env.label)}
          </Badge>
        );
      }
    },
    {
      key: "usedBy",
      header: <Tr>Used by</Tr>,
      render: (row) => {
        const used = getConnectionUsage(row.id, workflows);
        return (
          <Link href="/ptepi/workflows" className="inline-flex items-center gap-1.5 text-primary-800 hover:underline" title={used.map((item) => item.name).join(", ")}>
            <WorkflowIcon size={16} aria-hidden />
            {used.length} {t(used.length === 1 ? "workflow" : "workflows")}
          </Link>
        );
      }
    },
    { key: "lastSync", header: <Tr>Last sync</Tr>, render: (row) => <span className="tabular-nums">{formatDate(row.lastSync)}</span> },
    { key: "createdAt", header: <Tr>Created</Tr>, render: (row) => <span className="tabular-nums">{formatDate(row.createdAt)}</span> },
    {
      key: "active",
      header: <Tr>Active</Tr>,
      render: (row) => {
        const isActive = active[row.id];
        return (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={isActive} onCheckedChange={(checked) => setActive(row.id, checked)} aria-label={`${t("Active")}: ${row.name}`} />
            <span className={isActive ? "text-green-800" : "font-medium text-red-700"}>{t(isActive ? "Active" : "Inactive")}</span>
          </label>
        );
      }
    }
  ];

  const filters: TableFilter[] = [
    {
      key: "environment",
      placeholder: t("All environments"),
      value: environment,
      onChange: setEnvironment,
      options: [
        { label: t("All environments"), value: ALL },
        { label: t("Production"), value: "production" },
        { label: t("Staging"), value: "staging" },
        { label: t("Development"), value: "development" }
      ]
    },
    {
      key: "status",
      placeholder: t("All status"),
      value: status,
      onChange: setStatus,
      options: [
        { label: t("All status"), value: ALL },
        { label: t("Active"), value: "active" },
        { label: t("Inactive"), value: "inactive" }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total connections" value={stats.total} subtitle="Client systems configured for ATLAS" icon={Link2} />
        <KpiCard title="Active" value={stats.active} subtitle="Read or written on schedule" icon={Activity} tone="good" />
        <KpiCard
          title="Inactive"
          value={stats.inactive}
          subtitle={atRisk.length > 0 ? `${atRisk.length} ${t(atRisk.length === 1 ? "workflow stops" : "workflows stop")} ${t("on its next run")}` : "No workflow depends on them"}
          icon={Link2Off}
          tone={stats.inactive > 0 ? "watch" : "good"}
        />
        <KpiCard title="In use" value={stats.inUse} subtitle="Connections used by at least one workflow" icon={WorkflowIcon} />
      </div>

      {atRisk.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-800" role="status">
          <PlugZap size={16} aria-hidden />
          <span>
            {t("Switching a connection off stops the workflows that use it")}: <strong>{atRisk.map((item) => item.name).join(", ")}</strong>.
          </span>
          <Link href="/ptepi/workflows" className="ml-auto font-semibold underline underline-offset-2 hover:text-red-900">
            {t("Open Workflow Studio")}
          </Link>
        </p>
      )}

      <SectionCard title="Connections" subtitle="External services ATLAS reads from and writes to." badge={<SyntheticDataBadge />} flush>
        <Table
          name="connection"
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("Search connection, system or type")}
          filters={filters}
          onResetFilters={() => {
            setSearch("");
            setEnvironment(ALL);
            setStatus(ALL);
          }}
          emptyState={{ description: t("No connection matches the filters.") }}
        />
      </SectionCard>
    </div>
  );
}
