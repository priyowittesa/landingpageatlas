"use client";

import {
  BadgeDollarSign,
  Tags,
  UserRoundCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ConfirmationModal from "@/components/ConfirmationModal";
import MasterDataActions from "@/components/MasterDataActions";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import type { TableColumn } from "@/types/type";
import type { RateCard } from "../types";
import {
  useDeleteRateCard,
  useRateCardDashboardSummary,
  useRateCardList,
  useRateCardRoles
} from "../use-rate-cards";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function RateCardList() {
  const router = useRouter();
  const deleteRateCard = useDeleteRateCard();

  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    currency: "all",
    unit: "all",
    status: "all",
    sortBy: "",
    sortDir: "asc",
  });

  const {
    page,
    pageSize,
    currency,
    unit,
    status,
    sortBy,
    sortDir
  } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [deleting, setDeleting] = useState<RateCard | null>(null);
  const [pendingSort, setPendingSort] = useState<
    { by: string; dir: "asc" | "desc" } | null
  >(null);
  const [pendingFilters, setPendingFilters] = useState<
    Partial<{ currency: string; unit: string; status: string }>
  >({});

  const { data: roles = [] } = useRateCardRoles();
  const dashboardSummaryQuery = useRateCardDashboardSummary();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  // Page tokens are tied to the previous sort order — reset them when sort changes,
// and debounce so a rapid burst of header clicks only fires one fetch.
  useEffect(() => {
    if (!pendingSort) return;
    const timeout = window.setTimeout(() => {
      setMany({
        sortBy: pendingSort.by,
        sortDir: pendingSort.dir,
        page: 1,
      });
      setPageTokens([""]);
      setPendingSort(null);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [pendingSort, setMany]);

  // Debounce filter dropdown changes so a rapid burst of selections only fires one
  // fetch. Reset page tokens because they are tied to the previous filter state.
  useEffect(() => {
    if (Object.keys(pendingFilters).length === 0) return;
    const timeout = window.setTimeout(() => {
      setMany({ ...pendingFilters, page: 1 });
      setPageTokens([""]);
      setPendingFilters({});
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [pendingFilters, setMany]);

  // UI reflects pendingSort immediately so the header icon feels responsive
  // while the URL/fetch is debounced.
  const sortByForUI = (pendingSort?.by ?? sortBy) || null;
  const sortDirForUI: "asc" | "desc" =
    pendingSort?.dir ?? (sortDir === "desc" ? "desc" : "asc");

  const currencyForUI = pendingFilters.currency ?? currency;
  const unitForUI = pendingFilters.unit ?? unit;
  const statusForUI = pendingFilters.status ?? status;

  const filters = useMemo(
    () => ({
      pageSize,
      pageToken: pageTokens[page - 1] ?? "",
      currency: currency === "all" ? undefined : currency,
      unit: unit === "all" ? undefined : unit,
      status: status === "all" ? undefined : status,
      search: debouncedSearch || undefined,
      ...(sortBy
        ? { sortBy, sortDir: sortDirForUI }
        : {}),
    }),
    [
      debouncedSearch,
      page,
      pageSize,
      pageTokens,
      currency,
      unit,
      status,
      sortBy,
      sortDirForUI,
    ],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useRateCardList(filters);
  const rateCards = data?.items ?? [];

  const summaryValue = (...keys: string[]) => {
    if (dashboardSummaryQuery.isLoading) return "…";
    for (const key of keys) {
      if (dashboardSummaryQuery.data?.[key] != null) {
        return dashboardSummaryQuery.data[key];
      }
    }
    return 0;
  };

  const roleNames = useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles],
  );

  useEffect(() => {
    if (!data?.nextPageToken) return;
    setPageTokens((current) => {
      if (current[page] === data.nextPageToken) return current;
      const next = [...current];
      next[page] = data.nextPageToken;
      return next;
    });
  }, [data?.nextPageToken, page]);

  const hasActiveFilters = Boolean(
    search.trim() || currency !== "all" || unit !== "all" || status !== "all",
  );

  const columns: TableColumn<RateCard>[] = [
    {
      key: "code",
      header: "Rate Card Code",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-primary-700">{row.code || "-"}</span>
      ),
    },
    {
      key: "name",
      header: "Rate Card Name",
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "roles",
      header: "Roles",
      render: (row) => {
        const names = row.applicable_roles.map(
          (role) => roleNames.get(role.id) ?? role.name,
        );
        return (
          <span className="block max-w-64 whitespace-normal text-muted-foreground">
            {names.join(", ") || "-"}
          </span>
        );
      },
    },
    {
      key: "base_rate",
      header: "Base Rate",
      render: (row) => (
        <span className="font-semibold">
          {formatMoney(row.base_rate, row.currency)}
        </span>
      ),
    },
    {
      key: "unit",
      header: "Per Unit",
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <MasterDataActions
          name={row.name}
          editHref={`/app/master-data/rate-cards/${row.id}/edit`}
          onDelete={() => setDeleting(row)}
          disabled={deleteRateCard.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Rate Card"
        subtitle="Manage all rate card data in the system. Add, edit, or deactivate rate card records."
        addBtnLabel="Add Rate Card"
        handleAdd={() => router.push("/app/master-data/rate-cards/new")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Rate Cards"
          value={summaryValue("total_rate_cards", "total_rate_card", "total")}
          subtitle="All records"
          icon={BadgeDollarSign}
        />
        <SummaryCard
          title="Active Rate Cards"
          value={summaryValue("active_rate_cards", "active_rate_card", "active")}
          subtitle="Currently active"
          icon={UserRoundCheck}
        />
        <SummaryCard
          title="Applicable Roles"
          value={summaryValue(
            "applicable_roles",
            "applicable_role",
            "total_applicable_roles",
            "total_roles",
            "roles",
          )}
          subtitle="Roles in use"
          icon={Tags}
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading rate cards...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Rate card data could not be loaded.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={rateCards}
          getRowId={(row) => row.id}
          name="rate card"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search rate card by name, code, or role..."
          sortKey={sortByForUI}
          sortDir={sortDirForUI}
          onSortChange={(key, dir) => {
            setPendingSort({ by: key ?? "", dir });
          }}
          filters={[
            {
              key: "currency",
              placeholder: "All Currencies",
              value: currencyForUI,
              onChange: (value) =>
                setPendingFilters((prev) => ({ ...prev, currency: value })),
              options: [
                { label: "All Currencies", value: "all" },
                { label: "IDR", value: "IDR" },
                { label: "USD", value: "USD" },
              ],
            },
            {
              key: "unit",
              placeholder: "All Units",
              value: unitForUI,
              onChange: (value) =>
                setPendingFilters((prev) => ({ ...prev, unit: value })),
              options: [
                { label: "All Units", value: "all" },
                ...["Hour", "Day", "Week", "Month"].map((value) => ({
                  label: value,
                  value,
                })),
              ],
            },
            {
              key: "status",
              placeholder: "All Status",
              value: statusForUI,
              onChange: (value) =>
                setPendingFilters((prev) => ({ ...prev, status: value })),
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          ]}
          emptyState={
            hasActiveFilters
              ? { description: "Try changing your search or filters." }
              : {
                  description:
                    "You haven't added any rate cards yet. Get started by creating your first rate card record.",
                  actionLabel: "Add Rate Card",
                  onAction: () => router.push("/app/master-data/rate-cards/new"),
                }
          }
          pagination={{
            page,
            pageSize,
            totalEntries: data?.totalCount ?? 0,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: (next) => {
              setPageTokens((prev) =>
                next < prev.length ? prev.slice(0, next) : prev,
              );
              set("page", next);
            },
            onPageSizeChange: (size) => {
              setPageTokens([""]);
              setMany({ pageSize: size, page: 1 });
            },
          }}
        />
      )}

      {isFetching && !isLoading ? (
        <p className="text-right text-xs text-slate-500">Updating...</p>
      ) : null}

      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete rate card?"
        description={`Are you sure you want to delete ${deleting?.name ?? "this rate card"}? This action cannot be undone.`}
        confirmLabel="Delete Rate Card"
        isLoading={deleteRateCard.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteRateCard.mutate(deleting.id, {
              onSuccess: () => setDeleting(null),
            });
          }
        }}
      />
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
