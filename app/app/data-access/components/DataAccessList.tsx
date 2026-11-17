"use client";

import { useState } from "react";
import Link from "next/link";
import { Ellipsis, PencilLine } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TableColumn } from "@/types/type";
import {
  filterModuleRows,
  type ConfigurationFilter,
  type PortalModuleRow
} from "../catalog";
import { useDataAccess } from "../use-data-access";
import {
  DesignIcon,
  ErrorState,
  formatUpdated,
  LoadingState,
  ManageConnections
} from "./shared";

export function DataAccessList() {
  const { data, error, isLoading, refetch } = useDataAccess();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConfigurationFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const modules = data?.modules ?? [];
  const configured = modules.filter((module) => module.is_configured).length;
  const filtered = filterModuleRows(modules, query, filter);
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / pageSize))
  );
  const columns: TableColumn<PortalModuleRow>[] = [
    {
      key: "name",
      header: "Module Name",
      className: "min-w-48",
      render: (module) => (
        <Link
          href={`/app/data-access/${encodeURIComponent(module.id)}/edit`}
          className="block hover:text-primary-700"
        >
          <span className="block font-medium">{module.name}</span>
          <span className="text-xs text-gray-500">{module.key}</span>
        </Link>
      )
    },
    {
      key: "submodules",
      header: "Sub-modules",
      className: "min-w-44",
      render: (module) => {
        const count = module.subModules.filter(
          (sub) => sub.is_configured
        ).length;
        if (!module.subModules.length)
          return <span className="text-gray-400">No sub-modules</span>;
        return (
          <div>
            <p className="text-xs text-gray-600">
              {count} of {module.subModules.length} configured
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"
              role="meter"
              aria-label={`${module.name} configured sub-modules`}
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={module.subModules.length}
            >
              <div
                className="h-full rounded-full bg-primary-500"
                style={{
                  width: `${module.subModules.length ? (count / module.subModules.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: "updated",
      header: "Last Updated",
      className: "min-w-44",
      render: (module) =>
        module.updated_at ? (
          <p className="text-xs">{formatUpdated(module.updated_at)}</p>
        ) : (
          <span className="text-gray-400">-</span>
        )
    },
    {
      key: "configuration",
      header: "Configuration",
      render: (module) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            module.is_configured
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {module.is_configured ? "Configured" : "Not configured"}
        </span>
      )
    },
    {
      key: "action",
      header: "Action",
      className: "w-16",
      render: (module) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${module.name}`}
            >
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/app/data-access/${encodeURIComponent(module.id)}/edit`}
              >
                <PencilLine className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Data Access"
          subtitle="Choose which databases and tables each ATLAS module reads its data from."
        />
        <ManageConnections />
      </div>
      {isLoading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState retry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                icon: "modules",
                title: "Total Modules",
                value: modules.length,
                subtitle: "Available modules"
              },
              {
                icon: "configured",
                title: "Configured Modules",
                value: configured,
                subtitle: `${modules.length - configured} still without a data source`
              },
              {
                icon: "sub-modules",
                title: "Not Configured",
                value: modules.length - configured,
                subtitle: "Modules without a data source"
              }
            ].map((stat) => (
              <div
                key={stat.title}
                className="flex items-center gap-5 rounded-xl border bg-white p-5"
              >
                <DesignIcon name={stat.icon} />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">{stat.title}</h2>
                  <p className="text-2xl font-semibold leading-8">
                    {stat.value}
                  </p>
                  <p className="text-xs leading-5 text-gray-500">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Table
            name="module"
            className="[&_th]:bg-gray-50 [&_th]:text-xs [&_th]:font-medium [&_td]:py-3"
            columns={columns}
            data={filtered.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )}
            getRowId={(module) => module.id}
            searchValue={query}
            searchPlaceholder="Search modules..."
            onSearchChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            toolbarActions={
              <div
                aria-label="Module configuration filters"
                className="ml-auto flex max-w-full items-center overflow-x-auto rounded-lg border p-1"
              >
                {(
                  [
                    ["all", "All"],
                    ["configured", "Configured"],
                    ["not-configured", "Not configured"]
                  ] as const
                ).map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={filter === id}
                    onClick={() => {
                      setFilter(id);
                      setPage(1);
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors",
                      filter === id
                        ? "bg-primary-50 font-medium text-primary-700"
                        : "text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            emptyState={{
              description:
                "No modules match your search and configuration filter."
            }}
            pagination={{
              page: currentPage,
              pageSize,
              totalEntries: filtered.length,
              onPageChange: setPage,
              onPageSizeChange: (size) => {
                setPageSize(size);
                setPage(1);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
