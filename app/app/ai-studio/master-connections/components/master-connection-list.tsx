"use client";

import { Activity, Link2, Link2Off } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import MasterDataActions from "@/components/MasterDataActions";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { TableColumn } from "@/types/type";
import type { MasterConnection } from "../types";
import { useDeleteConnection, useMasterConnections, useMasterConnectionStats, useUpdateConnection } from "../use-master-connections";
import { ConnectionDialog } from "./connection-dialog";

export function MasterConnectionList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [environment, setEnvironment] = useState("all");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MasterConnection | null>(null);
  const [deleting, setDeleting] = useState<MasterConnection | null>(null);

  function resetPagination() {
    setPage(1);
    setPageTokens([""]);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPagination();
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({
      environment: environment === "all" ? undefined : environment,
      status: status === "all" ? undefined : status,
      search: debouncedSearch || undefined,
      pageSize,
      pageToken: pageTokens[page - 1] ?? "",
    }),
    [environment, status, debouncedSearch, pageSize, pageTokens, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useMasterConnections(filters);
  const connections = data?.items ?? [];
  const { data: stats } = useMasterConnectionStats();
  const remove = useDeleteConnection();
  const update = useUpdateConnection();

  function handlePageChange(nextPage: number) {
    if (nextPage === page + 1) {
      const nextToken = data?.nextPageToken;
      if (nextToken) {
        setPageTokens((current) => {
          const next = current.slice(0, page);
          next[page] = nextToken;
          return next;
        });
      }
    } else if (nextPage > 1 && !pageTokens[nextPage - 1]) {
      return;
    }
    setPage(nextPage);
  }

  const totalEntries = useMemo(() => {
    const rawTotal =
      data?.totalCount ??
      (debouncedSearch || environment !== "all" || status !== "all"
        ? connections.length
        : stats?.total ?? connections.length);
    if (data?.nextPageToken) {
      return Math.max(rawTotal, page * pageSize + 1);
    }
    return rawTotal;
  }, [
    data?.totalCount,
    data?.nextPageToken,
    debouncedSearch,
    environment,
    status,
    connections.length,
    stats?.total,
    page,
    pageSize,
  ]);

  const columns: TableColumn<MasterConnection>[] = [
    { key: "name", header: "Connection Name", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "nodeType", header: "Type", render: (row) => <span className="capitalize">{row.nodeType.replaceAll("_", " ")}</span> },
    { key: "environment", header: "Environment", render: (row) => <EnvironmentBadge value={row.environment} /> },
    { key: "createdAt", header: "Created At", render: (row) => row.createdAt && !Number.isNaN(new Date(row.createdAt).valueOf()) ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(row.createdAt)) : "-" },
    { key: "status", header: "Active", render: (row) => <Switch checked={row.status === "active"} disabled={update.isPending} aria-label={`Toggle ${row.name}`} onCheckedChange={(checked) => update.mutate({ id: row.id, payload: { status: checked ? "active" : "inactive" } })} /> },
    { key: "actions", header: "Actions", className: "text-right", render: (row) => <MasterDataActions name={row.name} onEdit={() => { setEditing(row); setDialogOpen(true); }} onDelete={() => setDeleting(row)} disabled={remove.isPending} /> },
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Master Connections"
        subtitle="Add and manage all your external service connections."
        addBtnLabel="Add New"
        handleAdd={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Total Connections" value={stats?.total ?? 0} subtitle="All configured connections" icon={Link2} />
        <SummaryCard title="Active" value={stats?.active ?? 0} subtitle="Currently active" icon={Activity} />
        <SummaryCard title="Inactive" value={stats?.inactive ?? 0} subtitle="Currently inactive" icon={Link2Off} />
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading connections...</div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">Connection data could not be loaded.</p>
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={connections}
          getRowId={(row) => row.id}
          name="connection"
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search connection by name or type..."
          filters={[
            {
              key: "environment",
              placeholder: "All Environments",
              value: environment,
              onChange: (value) => {
                setEnvironment(value);
                resetPagination();
              },
              options: [
                { label: "All Environments", value: "all" },
                { label: "Development", value: "development" },
                { label: "Staging", value: "staging" },
                { label: "Production", value: "production" },
              ],
            },
            {
              key: "status",
              placeholder: "All Status",
              value: status,
              onChange: (value) => {
                setStatus(value);
                resetPagination();
              },
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          ]}
          pagination={{
            page,
            pageSize,
            totalEntries,
            pageSizeOptions: [10, 25, 50, 100],
            canPageChange: (targetPage) =>
              !isFetching &&
              (targetPage <= 1 ||
                Boolean(pageTokens[targetPage - 1]) ||
                (targetPage === page + 1 && Boolean(data?.nextPageToken))),
            onPageChange: handlePageChange,
            onPageSizeChange: (size) => {
              setPageSize(size);
              resetPagination();
            },
          }}
          emptyState={{
            description: "No external service connections have been configured yet.",
            actionLabel: "Add Connection",
            onAction: () => setDialogOpen(true),
          }}
        />
      )}

      {isFetching && !isLoading && (
        <p className="text-right text-xs text-muted-foreground">Updating...</p>
      )}

      {dialogOpen && (
        <ConnectionDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          connection={editing}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        />
      )}
      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete connection?"
        description={`Are you sure you want to delete ${deleting?.name ?? "this connection"}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </div>
  );
}

function EnvironmentBadge({ value }: { value: MasterConnection["environment"] }) {
  const colors = value === "production" ? "bg-emerald-50 text-emerald-700" : value === "staging" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${colors}`}>{value}</span>;
}
