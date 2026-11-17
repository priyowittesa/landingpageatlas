"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { TableColumn } from "@/types/type";

const axios = axiosConfig(env.apiBaseUrl);
const NON_CONFORMANCE_URL = "/v1/manufacturing/inspection/non-conformance";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type NonConformance = {
  id: string;
  itemName: string;
  inspectionName: string;
  raisedBy: string;
  raisedDate: string;
  status: string;
};

function formatDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function normalizeNonConformance(raw: unknown): NonConformance {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    itemName: String(row.item_name ?? ""),
    inspectionName: String(row.inspection_name ?? ""),
    raisedBy: String(row.raised_by ?? ""),
    raisedDate: formatDate(String(row.raised_date ?? "")),
    status: String(row.status ?? "open").toLowerCase()
  };
}

function statusClass(status: string) {
  return status === "closed"
    ? "bg-red-100 text-red-600"
    : "bg-emerald-100 text-emerald-600";
}

export default function NonConformancePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { data, isLoading, isError, refetch } = useQuery<
    NonConformance[],
    AxiosError<ApiResponseError>
  >({
    queryKey: ["non-conformances"],
    queryFn: async () => {
      const res = await axios.get(NON_CONFORMANCE_URL, {
        params: { page_size: 100 }
      });
      const rows = (res.data?.data ?? res.data)?.rows;
      return Array.isArray(rows) ? rows.map(normalizeNonConformance) : [];
    },
    meta: { errorMessage: "Failed to load non-conformances" }
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data ?? []).filter((nc) => {
      const matchesStatus = status === "all" || nc.status === status;
      const matchesSearch =
        !query ||
        [nc.itemName, nc.inspectionName, nc.raisedBy].some((value) =>
          value.toLowerCase().includes(query)
        );
      return matchesStatus && matchesSearch;
    });
  }, [data, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const setFilter = (value: "all" | "open" | "closed") => {
    setStatus(value);
    setPage(1);
  };

  const columns: TableColumn<NonConformance>[] = [
    {
      key: "itemName",
      header: "Item",
      render: (row) => (
        <span className="block max-w-56 truncate font-semibold text-primary-700">
          {row.itemName || "-"}
        </span>
      )
    },
    {
      key: "inspectionName",
      header: "Inspection",
      render: (row) => (
        <span className="block max-w-72 whitespace-normal text-muted-foreground">
          {row.inspectionName || "-"}
        </span>
      )
    },
    {
      key: "raisedBy",
      header: "Raised By",
      render: (row) => (
        <span className="font-medium">{row.raisedBy || "-"}</span>
      )
    },
    {
      key: "raisedDate",
      header: "Raised Date",
      className: "text-muted-foreground"
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(row.status)}`}
        >
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Non-Conformance"
        subtitle="Track and resolve failed checks"
      />

      <Tabs
        value={status}
        onValueChange={(v) => setFilter(v as "all" | "open" | "closed")}
      >
        <TabsList className="w-full max-w-64 justify-start rounded-lg border border-gray-200 bg-white p-1 h-auto">
          {(["all", "open", "closed"] as const).map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 rounded-md py-2 capitalize data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:shadow-none text-gray-500"
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading non-conformances...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Non-conformance data could not be loaded.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={paginated}
          getRowId={(row) => row.id}
          name="non-conformance"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search by item, inspection, or raised by..."
          filters={[
            {
              key: "status",
              placeholder: "All Status",
              value: status,
              onChange: (value) =>
                setFilter(value as "all" | "open" | "closed"),
              options: [
                { label: "All Status", value: "all" },
                { label: "Open", value: "open" },
                { label: "Closed", value: "closed" }
              ]
            }
          ]}
          onRowClick={(row) =>
            router.push(`/app/inspection/non-conformance/${row.id}`)
          }
          emptyState={{
            description:
              search.trim() || status !== "all"
                ? "Try changing your search or filters."
                : "There are no non-conformances to resolve."
          }}
          pagination={{
            page: currentPage,
            pageSize,
            totalEntries: filtered.length,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            }
          }}
        />
      )}
    </div>
  );
}
