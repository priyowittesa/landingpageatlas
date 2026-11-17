"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  Pencil,
  Plus,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TableColumn } from "@/types/type";
import {
  FREQUENCY_LABELS,
  STATUS_REVERSE_MAP,
  type FrequencyType,
  type InspectionTemplateItem,
  type TemplateStatus
} from "../types";
import { useTemplateList } from "../use-templates";

const statusClass: Record<TemplateStatus, string> = {
  Draft: "bg-blue-50 text-blue-700",
  Archived: "bg-amber-50 text-amber-700",
  Published: "bg-emerald-50 text-emerald-700"
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const API_PAGE_SIZE = 100;
const statuses: TemplateStatus[] = ["Draft", "Published", "Archived"];
const frequencies: FrequencyType[] = ["daily", "weekly", "monthly", "custom"];
type StatusFilter = TemplateStatus | "all";
type FrequencyFilter = FrequencyType | "all";

export function TemplateList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: "asset" | "quality" =
    searchParams.get("tab") === "quality" ? "quality" : "asset";

  // Asset tab state
  const [assetSearch, setAssetSearch] = useState("");
  const [assetStatus, setAssetStatus] = useState<StatusFilter>("all");
  const [assetFrequency, setAssetFrequency] = useState<FrequencyFilter>("all");
  const [assetPage, setAssetPage] = useState(1);
  const [assetPageSize, setAssetPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [assetSortKey, setAssetSortKey] = useState<string | null>(null);
  const [assetSortDir, setAssetSortDir] = useState<"asc" | "desc">("asc");

  // Quality tab state
  const [qualitySearch, setQualitySearch] = useState("");
  const [qualityStatus, setQualityStatus] = useState<StatusFilter>("all");
  const [qualityPage, setQualityPage] = useState(1);
  const [qualityPageSize, setQualityPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [qualitySortKey, setQualitySortKey] = useState<string | null>(null);
  const [qualitySortDir, setQualitySortDir] = useState<"asc" | "desc">("asc");

  const assetQuery = useTemplateList({
    category: "asset",
    status: assetStatus === "all" ? undefined : STATUS_REVERSE_MAP[assetStatus],
    frequency_type: assetFrequency === "all" ? undefined : assetFrequency,
    page_size: API_PAGE_SIZE
  });

  const qualityQuery = useTemplateList({
    category: "quality",
    status:
      qualityStatus === "all" ? undefined : STATUS_REVERSE_MAP[qualityStatus],
    page_size: API_PAGE_SIZE
  });

  const filteredAssets = useMemo(() => {
    const value = assetSearch.trim().toLowerCase();
    return (assetQuery.data?.items ?? []).filter(
      (template) =>
        (!value ||
          [template.code, template.name, template.machine ?? ""].some((item) =>
            item.toLowerCase().includes(value)
          )) &&
        (assetStatus === "all" || template.status === assetStatus) &&
        (assetFrequency === "all" || template.frequency === assetFrequency)
    );
  }, [assetFrequency, assetQuery.data?.items, assetSearch, assetStatus]);

  const sortedAssets = useMemo(() => {
    if (!assetSortKey) return filteredAssets;
    return [...filteredAssets].sort((a, b) => {
      const aVal = String(Reflect.get(a, assetSortKey) ?? "").toLowerCase();
      const bVal = String(Reflect.get(b, assetSortKey) ?? "").toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return assetSortDir === "desc" ? -cmp : cmp;
    });
  }, [filteredAssets, assetSortKey, assetSortDir]);

  const assetTotalPages = Math.max(
    1,
    Math.ceil(sortedAssets.length / assetPageSize)
  );
  const currentAssetPage = Math.min(assetPage, assetTotalPages);
  const assetPaginated = sortedAssets.slice(
    (currentAssetPage - 1) * assetPageSize,
    currentAssetPage * assetPageSize
  );

  const filteredQuality = useMemo(() => {
    const value = qualitySearch.trim().toLowerCase();
    return (qualityQuery.data?.items ?? []).filter(
      (template) =>
        (!value ||
          template.name.toLowerCase().includes(value) ||
          (template.products ?? []).some((p) =>
            p.toLowerCase().includes(value)
          )) &&
        (qualityStatus === "all" || template.status === qualityStatus)
    );
  }, [qualityQuery.data?.items, qualitySearch, qualityStatus]);

  const sortedQuality = useMemo(() => {
    if (!qualitySortKey) return filteredQuality;
    return [...filteredQuality].sort((a, b) => {
      const aVal = String(Reflect.get(a, qualitySortKey) ?? "").toLowerCase();
      const bVal = String(Reflect.get(b, qualitySortKey) ?? "").toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return qualitySortDir === "desc" ? -cmp : cmp;
    });
  }, [filteredQuality, qualitySortKey, qualitySortDir]);

  const qualityTotalPages = Math.max(
    1,
    Math.ceil(sortedQuality.length / qualityPageSize)
  );
  const currentQualityPage = Math.min(qualityPage, qualityTotalPages);
  const qualityPaginated = sortedQuality.slice(
    (currentQualityPage - 1) * qualityPageSize,
    currentQualityPage * qualityPageSize
  );

  const hasActiveAssetFilters = Boolean(
    assetSearch.trim() || assetStatus !== "all" || assetFrequency !== "all"
  );
  const hasActiveQualityFilters = Boolean(
    qualitySearch.trim() || qualityStatus !== "all"
  );

  const assetColumns: TableColumn<InspectionTemplateItem>[] = [
    {
      key: "code",
      header: "Asset Code",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-primary-700">{row.code || "-"}</span>
      )
    },
    {
      key: "name",
      header: "Asset Name",
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.frequency
            ? (FREQUENCY_LABELS[row.frequency] ?? row.frequency)
            : "-"}
        </span>
      )
    },
    {
      key: "version",
      header: "Version",
      render: (row) =>
        row.version ? (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 font-normal"
          >
            {row.version}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.status ? (
          <Badge variant="secondary" className={statusClass[row.status]}>
            {row.status}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) =>
        row.status ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                router.push(
                  `/app/inspection/templates/${row.familyId}/${row.id}/view?category=asset`
                )
              }
              aria-label={`View ${row.name}`}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              onClick={() =>
                router.push(
                  `/app/inspection/templates/${row.familyId}/${row.id}/edit?category=asset`
                )
              }
              aria-label={`Edit ${row.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <Button
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                router.push(
                  `/app/inspection/templates/new?asset=${row.id}&assetName=${encodeURIComponent(row.name)}`
                )
              }
              aria-label={`Create inspection template for ${row.name}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )
    }
  ];

  const qualityColumns: TableColumn<InspectionTemplateItem>[] = [
    {
      key: "name",
      header: "Template Name",
      sortable: true,
      render: (row) => (
        <span className="block max-w-64 whitespace-normal font-semibold text-primary-700">
          {row.name}
        </span>
      )
    },
    {
      key: "products",
      header: "Products/Parts",
      render: (row) => (
        <div className="flex max-w-64 flex-wrap gap-1">
          {(row.products ?? []).map((product) => (
            <Badge
              key={product}
              variant="secondary"
              className="bg-gray-100 text-gray-600 font-normal"
            >
              {product}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.status ? (
          <Badge variant="secondary" className={statusClass[row.status]}>
            {row.status}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
    },
    {
      key: "revision",
      header: "Revisions",
      render: (row) =>
        row.revision ? (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 font-normal"
          >
            {row.revision}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              router.push(
                `/app/inspection/templates/${row.familyId}/${row.id}/view?category=quality`
              )
            }
            aria-label={`View ${row.name}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
            onClick={() =>
              router.push(
                `/app/inspection/templates/${row.familyId}/${row.id}/edit?category=quality`
              )
            }
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Inspection Templates"
        subtitle="Build and publish checklists for assets and quality"
        addBtnLabel="New Template"
        handleAdd={
          tab === "quality"
            ? () =>
                router.push("/app/inspection/templates/new?category=quality")
            : undefined
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            router.replace(`/app/inspection/templates?tab=${v}`);
          }}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto justify-start rounded-lg border border-gray-200 bg-white p-1 h-auto">
            <TabsTrigger
              value="asset"
              className="px-6 rounded-md py-2 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:shadow-none text-gray-500"
            >
              <WrenchIcon className="h-4 w-4 mr-1.5" />
              Asset Inspection
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="px-6 rounded-md py-2 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:shadow-none text-gray-500"
            >
              <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
              Quality Inspection
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          className="gap-1.5 self-end sm:self-auto"
          onClick={() =>
            router.push(
              `/app/inspection/templates/generate?category=${tab}`
            )
          }
        >
          <SparklesIcon className="h-4 w-4" /> Generate from Document
        </Button>
      </div>

      {/* Asset Inspection Tab */}
      {tab === "asset" && (
        <>
          {assetQuery.isLoading ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          ) : assetQuery.isError ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
              <p className="text-sm text-muted-foreground">
                Template data could not be loaded.
              </p>
              <Button variant="outline" onClick={() => assetQuery.refetch()}>
                Try Again
              </Button>
            </div>
          ) : (
            <Table
              columns={assetColumns}
              data={assetPaginated}
              getRowId={(row) => row.id}
              name="asset inspection template"
              searchValue={assetSearch}
              onSearchChange={(value) => {
                setAssetSearch(value);
                setAssetPage(1);
              }}
              searchPlaceholder="Search templates by code, name, or machine..."
              sortKey={assetSortKey}
              sortDir={assetSortDir}
              onSortChange={(key, dir) => {
                setAssetSortKey(key);
                setAssetSortDir(dir);
              }}
              filters={[
                {
                  key: "status",
                  placeholder: "All Status",
                  value: assetStatus,
                  onChange: (value) => {
                    setAssetStatus(value as StatusFilter);
                    setAssetPage(1);
                  },
                  options: [
                    { label: "All Status", value: "all" },
                    ...statuses.map((value) => ({ label: value, value }))
                  ]
                },
                {
                  key: "frequency",
                  placeholder: "All Frequencies",
                  value: assetFrequency,
                  onChange: (value) => {
                    setAssetFrequency(value as FrequencyFilter);
                    setAssetPage(1);
                  },
                  options: [
                    { label: "All Frequencies", value: "all" },
                    ...frequencies.map((value) => ({
                      label: FREQUENCY_LABELS[value] ?? value,
                      value
                    }))
                  ]
                }
              ]}
              onResetFilters={() => {
                setAssetStatus("all");
                setAssetFrequency("all");
                setAssetPage(1);
              }}
              emptyState={
                hasActiveAssetFilters
                  ? { description: "Try changing your search or filters." }
                  : {
                      description:
                        "No asset templates found. Select an asset from the list to create an inspection template."
                    }
              }
              pagination={{
                page: currentAssetPage,
                pageSize: assetPageSize,
                totalEntries: sortedAssets.length,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onPageChange: setAssetPage,
                onPageSizeChange: (size) => {
                  setAssetPageSize(size);
                  setAssetPage(1);
                }
              }}
            />
          )}

          {assetQuery.isFetching && !assetQuery.isLoading ? (
            <p className="text-right text-xs text-slate-500">Updating...</p>
          ) : null}
        </>
      )}

      {/* Quality Inspection Tab */}
      {tab === "quality" && (
        <>
          {qualityQuery.isLoading ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          ) : qualityQuery.isError ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
              <p className="text-sm text-muted-foreground">
                Template data could not be loaded.
              </p>
              <Button variant="outline" onClick={() => qualityQuery.refetch()}>
                Try Again
              </Button>
            </div>
          ) : (
            <Table
              columns={qualityColumns}
              data={qualityPaginated}
              getRowId={(row) => row.id}
              name="quality inspection template"
              searchValue={qualitySearch}
              onSearchChange={(value) => {
                setQualitySearch(value);
                setQualityPage(1);
              }}
              searchPlaceholder="Search quality inspection templates..."
              sortKey={qualitySortKey}
              sortDir={qualitySortDir}
              onSortChange={(key, dir) => {
                setQualitySortKey(key);
                setQualitySortDir(dir);
              }}
              filters={[
                {
                  key: "status",
                  placeholder: "All Status",
                  value: qualityStatus,
                  onChange: (value) => {
                    setQualityStatus(value as StatusFilter);
                    setQualityPage(1);
                  },
                  options: [
                    { label: "All Status", value: "all" },
                    ...statuses.map((value) => ({ label: value, value }))
                  ]
                }
              ]}
              onResetFilters={() => {
                setQualityStatus("all");
                setQualityPage(1);
              }}
              emptyState={
                hasActiveQualityFilters
                  ? { description: "Try changing your search or filters." }
                  : {
                      description:
                        "You haven't added any quality inspection templates yet. Get started by creating your first template.",
                      actionLabel: "New Template",
                      onAction: () =>
                        router.push(
                          "/app/inspection/templates/new?category=quality"
                        )
                    }
              }
              pagination={{
                page: currentQualityPage,
                pageSize: qualityPageSize,
                totalEntries: sortedQuality.length,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onPageChange: setQualityPage,
                onPageSizeChange: (size) => {
                  setQualityPageSize(size);
                  setQualityPage(1);
                }
              }}
            />
          )}

          {qualityQuery.isFetching && !qualityQuery.isLoading ? (
            <p className="text-right text-xs text-slate-500">Updating...</p>
          ) : null}
        </>
      )}
    </div>
  );
}
