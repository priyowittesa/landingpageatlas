"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type Tenant, useTenants } from "./use-tenants";

const PAGE_SIZES = [5, 10, 20, 50];

export function ManageTenantsSettings() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([
    undefined
  ]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      400
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setPageTokens([undefined]);
  }, [debouncedSearch, pageSize]);

  const query = useTenants({
    pageSize,
    pageToken: pageTokens[page - 1],
    search: debouncedSearch || undefined
  });
  const tenants = query.data?.items ?? [];
  const total = query.data?.totalCount ?? 0;
  const canGoNext = Boolean(query.data?.nextPageToken);

  const goNext = () => {
    const token = query.data?.nextPageToken;
    if (!token) return;
    setPageTokens((tokens) => {
      const next = tokens.slice(0, page);
      next[page] = token;
      return next;
    });
    setPage((current) => current + 1);
  };

  if (selectedTenant) {
    return (
      <TenantDetail
        tenant={selectedTenant}
        onBack={() => setSelectedTenant(null)}
      />
    );
  }

  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold text-gray-950">
        Manage Tenants
      </h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => setPageSize(Number(value))}
        >
          <SelectTrigger className="h-9 w-[92px] px-3 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} Rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name"
            aria-label="Search tenants by name"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="w-10 px-3 py-3">
                  <Checkbox disabled aria-label="Select all tenants" />
                </th>
                <th className="px-2 py-3 font-medium">Company Name</th>
                <th className="px-2 py-3 font-medium">Industry</th>
                <th className="px-2 py-3 font-medium">Company Size</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="w-16 px-3 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {query.isLoading ? (
                <TableMessage message="Loading tenants..." />
              ) : query.isError ? (
                <TableMessage
                  message="Tenant data could not be loaded."
                  action={() => query.refetch()}
                />
              ) : tenants.length === 0 ? (
                <TableMessage
                  message={
                    debouncedSearch
                      ? "No tenants match your search."
                      : "No tenants found."
                  }
                />
              ) : (
                tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="text-gray-700 hover:bg-gray-50/70"
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        disabled
                        aria-label={`Select ${tenant.companyName}`}
                      />
                    </td>
                    <td className="px-2 py-3 font-medium text-gray-950">
                      {tenant.companyName}
                    </td>
                    <td className="px-2 py-3">{tenant.industry}</td>
                    <td className="px-2 py-3">{tenant.companySize}</td>
                    <td className="px-2 py-3">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7"
                        onClick={() => setSelectedTenant(tenant)}
                        aria-label={`View ${tenant.companyName}`}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <span>
          {total
            ? `${Math.min((page - 1) * pageSize + 1, total)}-${Math.min((page - 1) * pageSize + tenants.length, total)} of ${total} tenant(s)`
            : "0 tenant(s)"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft /> Previous
          </Button>
          <span className="min-w-14 text-center">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoNext || query.isFetching}
            onClick={goNext}
          >
            Next <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}

function TableMessage({
  message,
  action
}: {
  message: string;
  action?: () => void;
}) {
  return (
    <tr>
      <td colSpan={6} className="h-40 px-4 text-center text-sm text-gray-500">
        {message}
        {action && (
          <button
            type="button"
            className="ml-2 font-medium text-primary-700 hover:underline"
            onClick={action}
          >
            Try again
          </button>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active" || status === "new";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
      )}
    >
      {status || "active"}
    </span>
  );
}

const MODULES = [
  ["AIMOS", "AI Marketing Operating System", "Active"],
  ["SAFERA", "Safety & Risk Analytics Suite", "Active"],
  ["PRIMOS", "Principal Hospitality System", "Trial"],
  ["SERVORA", "Service Operations Control", "Expired"],
  ["Campaign Manager", "UGC and distribution automation engine", "Active"],
  ["Content Generator", "Direct text-to-creative generator tools", "Active"]
] as const;

function TenantDetail({
  tenant,
  onBack
}: {
  tenant: Tenant;
  onBack: () => void;
}) {
  const joined = tenant.createdAt
    ? new Date(tenant.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      })
    : "Jan 2024";
  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-950 hover:text-primary-700"
        >
          <ArrowLeft className="size-4" />
          {tenant.companyName}
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-normal text-gray-500">Active</span>
        </button>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
          <span>
            Industry:{" "}
            <b className="font-medium text-gray-800">{tenant.industry}</b>
          </span>
          <span>
            Company Size:{" "}
            <b className="font-medium text-gray-800">{tenant.companySize}</b>
          </span>
          <span>
            Joined: <b className="font-medium text-gray-800">{joined}</b>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-xs">
          <b>AI Token Usage</b>
          <span className="text-[10px] text-gray-500">
            Current Period: Jul 1 - Jul 31, 2026
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between text-xs">
          <span>
            <b className="text-sm">15,240</b> / 20,000 tokens used
          </span>
          <span className="text-[10px] text-emerald-600">76% Used</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-[76%] rounded-full bg-primary-700" />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <ConsumptionChart />
          <div className="rounded-md border border-gray-200 p-3">
            <b className="text-[11px]">Usage by Module</b>
            {[
              ["Campaign Manager", "5,200"],
              ["Customer Data", "4,100"],
              ["Strategy Planner", "3,800"],
              ["Content Generator", "2,140"]
            ].map(([name, amount]) => (
              <div
                key={name}
                className="flex justify-between border-b border-gray-100 py-2 text-[10px] last:border-0"
              >
                <span>{name}</span>
                <span className="text-gray-500">{amount} tokens</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold">Subscribed Modules</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map(([name, description, status]) => (
            <div
              key={name}
              className="flex gap-2 rounded-md border border-gray-200 p-3"
            >
              <span
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full",
                  status === "Expired" ? "bg-gray-400" : "bg-emerald-500"
                )}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold">
                  {name}{" "}
                  <span
                    className={cn(
                      "ml-1 rounded px-1 py-0.5 text-[9px] font-normal",
                      status === "Trial"
                        ? "bg-amber-50 text-amber-700"
                        : status === "Expired"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                    )}
                  >
                    {status}
                  </span>
                </div>
                <p className="mt-1 text-[9px] text-gray-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConsumptionChart() {
  const bars = [68, 54, 42, 78, 66];
  return (
    <div className="rounded-md border border-gray-200 p-3">
      <div className="flex justify-between text-[11px]">
        <b>Historical Consumption</b>
        <span>2026</span>
      </div>
      <div className="mt-3 flex h-28 items-end justify-around gap-4 border-b border-gray-200">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >
            <div
              className="w-3 rounded-t bg-primary-700"
              style={{ height: `${height}%` }}
            />
            <span className="mt-1 text-[9px] text-gray-500">
              {["Mar", "Apr", "May", "Jun", "Jul"][index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
