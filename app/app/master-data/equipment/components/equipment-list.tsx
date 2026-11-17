"use client";

import {
  Boxes,
  CheckCircle2,
  Container,
  Lightbulb,
  Package,
  Pencil,
  Tags,
  Tractor,
  TriangleAlert,
  Truck,
  Trash2,
  Wrench,
  Zap,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ConfirmationModal from "@/components/ConfirmationModal";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { cn } from "@/lib/utils";
import type { TableColumn } from "@/types/type";
import {
  EQUIPMENT_OWNERSHIP_LABEL,
  normalizeOwnership,
  normalizeStatus,
  type EquipmentItem
} from "../types";
import {
  useCompanies,
  useDeleteEquipment,
  useEquipmentCategories,
  useEquipmentList
} from "../use-equipment";

type CategoryMeta = { badge: string; thumb: string; icon: LucideIcon };

const EQUIPMENT_SORT_FIELD_MAP: Record<string, string> = {
  code: "code",
  name: "name",
  category: "category",
  model: "model_type",
  ownership: "ownership",
  status: "status",
  location: "location_project",
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  Earthmoving: {
    badge: "bg-primary-100 text-primary-700",
    thumb: "bg-primary-100 text-primary-600",
    icon: Tractor
  },
  Transport: {
    badge: "bg-blue-100 text-blue-700",
    thumb: "bg-blue-100 text-blue-600",
    icon: Truck
  },
  Lifting: {
    badge: "bg-orange-100 text-orange-600",
    thumb: "bg-orange-100 text-orange-600",
    icon: Container
  },
  Power: {
    badge: "bg-green-100 text-green-700",
    thumb: "bg-green-100 text-green-600",
    icon: Zap
  },
  Support: {
    badge: "bg-pink-100 text-pink-600",
    thumb: "bg-pink-100 text-pink-600",
    icon: Lightbulb
  },
  "Material Handling": {
    badge: "bg-sky-100 text-sky-700",
    thumb: "bg-sky-100 text-sky-600",
    icon: Boxes
  }
};

const DEFAULT_CATEGORY_META: CategoryMeta = {
  badge: "bg-gray-100 text-gray-600",
  thumb: "bg-gray-100 text-gray-500",
  icon: Package
};

const STATUS_FILTER_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Under Maintenance", value: "Under Maintenance" },
  { label: "Out of Service", value: "Out of Service" }
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATS_PAGE_SIZE = 1000;

export function EquipmentList() {
  const router = useRouter();

  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    category: "all",
    status: "all",
    ownedBy: "all",
    sortBy: "",
    sortDir: "asc",
  });

  const { page, pageSize, category, status, ownedBy, sortBy, sortDir } = values;
  const [search, setSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [deleting, setDeleting] = useState<EquipmentItem | null>(null);
  const [pendingSort, setPendingSort] = useState<
    { by: string; dir: "asc" | "desc" } | null
  >(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const categories = useEquipmentCategories();
  const companies = useCompanies();
  const deleteEquipment = useDeleteEquipment();

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

  // UI reflects pendingSort immediately so the header icon feels responsive
  // while the URL/fetch is debounced.
  const sortByForUI = (pendingSort?.by ?? sortBy) || null;
  const sortDirForUI: "asc" | "desc" =
    pendingSort?.dir ?? (sortDir === "desc" ? "desc" : "asc");

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of categories.data ?? []) {
      map.set(opt.value, opt.label);
    }
    return map;
  }, [categories.data]);

  const backendSortBy = sortBy ? EQUIPMENT_SORT_FIELD_MAP[sortBy] ?? "" : "";
  const backendSortDir: "asc" | "desc" =
    sortDir === "desc" ? "desc" : "asc";

  const listParams = useMemo(
    () => ({
      category_id: category !== "all" ? category : undefined,
      owned_by_company_id: ownedBy !== "all" ? ownedBy : undefined,
      status: status !== "all" ? status : undefined,
      page_size: pageSize,
      page_token: pageTokens[page - 1] ?? "",
      ...(sortBy
        ? { sort_by: backendSortBy, sort_order: backendSortDir }
        : {}),
    }),
    [
      category,
      ownedBy,
      status,
      pageSize,
      page,
      pageTokens,
      sortBy,
      backendSortBy,
      backendSortDir,
    ]
  );

  const { data } = useEquipmentList(listParams);

  const statsQuery = useEquipmentList({ page_size: STATS_PAGE_SIZE });

  useEffect(() => {
    if (data?.next_page_token) {
      setPageTokens((prev) => {
        if (prev[page] === data.next_page_token) return prev;
        const next = [...prev];
        next[page] = data.next_page_token;
        return next;
      });
    }
  }, [data?.next_page_token, page]);

  const stats = useMemo(() => {
    const items = statsQuery.data?.items ?? [];
    const uniqueCategories = new Set(
      items.map((item) => item.category_id).filter(Boolean)
    );
    let active = 0;
    let underMaintenance = 0;
    let outOfService = 0;
    for (const item of items) {
      const normalized = normalizeStatus(item.status);
      if (normalized === "active") active += 1;
      else if (normalized === "under_maintenance") underMaintenance += 1;
      else if (normalized === "out_of_service") outOfService += 1;
    }
    return {
      total: statsQuery.data?.total_count ?? 0,
      active,
      underMaintenance,
      outOfService,
      categories: uniqueCategories.size
    };
  }, [statsQuery.data]);

  const tableData = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    const items = data?.items ?? [];
    if (!query) return items;
    return items.filter((item) =>
      [item.code, item.name, item.model, item.brand_manufacturer].some(
        (value) => value?.toLowerCase().includes(query)
      )
    );
  }, [data?.items, debouncedSearch]);

  const columns: TableColumn<EquipmentItem>[] = [
    {
      key: "code",
      header: "Equipment Code",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <EquipmentThumb
            categoryName={categoryMap.get(row.category_id) ?? ""}
          />
          <span className="font-semibold text-gray-900">{row.code}</span>
        </div>
      )
    },
    {
      key: "name",
      header: "Equipment Name",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      )
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => (
        <CategoryBadge categoryName={categoryMap.get(row.category_id) ?? ""} />
      )
    },
    {
      key: "model",
      header: "Model / Type",
      sortable: true,
      render: (row) => <span className="text-gray-600">{row.model || "-"}</span>
    },
    {
      key: "ownership",
      header: "Ownership",
      sortable: true,
      render: (row) => (
        <Badge
          variant="secondary"
          className="whitespace-nowrap rounded-full bg-emerald-50 font-medium text-emerald-700"
        >
          {EQUIPMENT_OWNERSHIP_LABEL[normalizeOwnership(row.ownership_type)]}
        </Badge>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: "location",
      header: "Location / Project",
      sortable: true,
      render: (row) => (
        <span className="text-gray-600">
          {row.site_location || row.location || "-"}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-8 w-8 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
          >
            <a
              href={`/app/master-data/equipment/${row.id}/edit`}
              aria-label={`Edit ${row.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleting(row)}
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const handleDelete = () => {
    if (!deleting) return;
    deleteEquipment.mutate(deleting.id, {
      onSuccess: () => setDeleting(null)
    });
  };

  const ownerOptions = useMemo(
    () => [
      { label: "All Owners", value: "all" },
      ...(companies.data ?? [])
    ],
    [companies.data]
  );

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Equipment / Asset"
        subtitle="Manage all equipment and assets used across projects."
        addBtnLabel="Add Equipment"
        handleAdd={() => router.push("/app/master-data/equipment/new")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Equipment"
          value={stats.total}
          subtitle="All equipment & assets"
          icon={Package}
        />
        <SummaryCard
          title="Active"
          value={stats.active}
          subtitle="Currently active"
          icon={CheckCircle2}
        />
        <SummaryCard
          title="Under Maintenance"
          value={stats.underMaintenance}
          subtitle="In maintenance"
          icon={Wrench}
        />
        <SummaryCard
          title="Out of Service"
          value={stats.outOfService}
          subtitle="Not available"
          icon={TriangleAlert}
        />
        <SummaryCard
          title="Total Categories"
          value={stats.categories}
          subtitle="Equipment categories"
          icon={Tags}
        />
      </div>

      <Table
        columns={columns}
        data={tableData}
        getRowId={(row) => row.id}
        name="equipment"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search equipment by name, code, or model..."
        sortKey={sortByForUI}
        sortDir={sortDirForUI}
        onSortChange={(key, dir) => {
          setPendingSort({ by: key ?? "", dir });
        }}
        filters={[
          {
            key: "category",
            placeholder: "All Categories",
            value: category,
            onChange: (value) => set("category", value),
            options: [
              { label: "All Categories", value: "all" },
              ...(categories.data ?? [])
            ]
          },
          {
            key: "status",
            placeholder: "All Status",
            value: status,
            onChange: (value) => set("status", value),
            options: STATUS_FILTER_OPTIONS
          },
          {
            key: "ownedBy",
            placeholder: "All Owners",
            value: ownedBy,
            onChange: (value) => set("ownedBy", value),
            options: ownerOptions
          }
        ]}
        pagination={{
          page,
          pageSize,
          totalEntries: data?.total_count ?? 0,
          onPageChange: (next) => {
            setPageTokens((prev) => (next < prev.length ? prev.slice(0, next) : prev));
            set("page", next);
          },
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onPageSizeChange: (size) => {
            setPageTokens([""]);
            setMany({ pageSize: size, page: 1 });
          }
        }}
      />

      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete equipment?"
        description={`Are you sure you want to delete ${
          deleting?.name ?? "this equipment"
        }? This action cannot be undone.`}
        confirmLabel="Delete Equipment"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function EquipmentThumb({ categoryName }: { categoryName: string }) {
  const meta = CATEGORY_META[categoryName] ?? DEFAULT_CATEGORY_META;
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
        meta.thumb
      )}
    >
      <Icon className="h-4.5 w-4.5" />
    </div>
  );
}

function CategoryBadge({ categoryName }: { categoryName: string }) {
  if (!categoryName) return <span className="text-gray-400">-</span>;
  const meta = CATEGORY_META[categoryName] ?? DEFAULT_CATEGORY_META;
  return (
    <Badge
      variant="secondary"
      className={cn("whitespace-nowrap rounded-full font-medium", meta.badge)}
    >
      {categoryName}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);
  const variant =
    normalized === "active"
      ? "green"
      : normalized === "under_maintenance"
        ? "yellow"
        : "red";
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant={variant} className="whitespace-nowrap rounded-full">
      {label}
    </Badge>
  );
}
