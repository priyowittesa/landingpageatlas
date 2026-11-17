"use client";

import {
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  IdCard,
  LoaderCircle,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ConfirmationModal from "@/components/ConfirmationModal";
import MasterDataActions from "@/components/MasterDataActions";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import Table from "@/components/Table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/useUrlState";
import type { TableColumn } from "@/types/type";
import type { Employee } from "@/types/type-employee";
import {
  useDeleteEmployee,
  useEmployeeDepartments,
  useEmployeeList,
  useEmployeeRoles,
  useLabourEnums,
} from "../use-employees";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const EMPLOYEE_SORT_FIELD_MAP: Record<string, string> = {
  code: "code",
  full_name: "full_name",
  department_name: "department",
  position_name: "position",
  role_name: "role",
  type: "employment_type",
};

export default function EmployeePageContent() {
  const router = useRouter();
  const deleteEmployee = useDeleteEmployee();

  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    department: "all",
    role: "all",
    type: "all",
    sortBy: "",
    sortDir: "asc",
  });

  const { page, pageSize, department, role, type, sortBy, sortDir } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [pendingSort, setPendingSort] = useState<
    { by: string; dir: "asc" | "desc" } | null
  >(null);

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

  const backendSortBy = sortBy ? EMPLOYEE_SORT_FIELD_MAP[sortBy] ?? "" : "";
  const backendSortDir: "asc" | "desc" = sortDir === "desc" ? "desc" : "asc";

  // UI reflects pendingSort immediately so the header icon feels responsive
  // while the URL/fetch is debounced.
  const sortByForUI = (pendingSort?.by ?? sortBy) || null;
  const sortDirForUI: "asc" | "desc" =
    pendingSort?.dir ?? (sortDir === "desc" ? "desc" : "asc");

  const filters = useMemo(
    () => ({
      pageSize,
      pageToken: pageTokens[page - 1] ?? "",
      departmentId: department === "all" ? undefined : department,
      roleId: role === "all" ? undefined : role,
      type: type === "all" ? undefined : type,
      search: debouncedSearch || undefined,
      ...(backendSortBy
        ? { sortBy: backendSortBy, sortDir: backendSortDir }
        : {}),
    }),
    [
      debouncedSearch,
      department,
      page,
      pageSize,
      pageTokens,
      role,
      type,
      backendSortBy,
      backendSortDir,
    ],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useEmployeeList(filters);
  const employees = data?.items ?? [];

  const summaryQuery = useEmployeeList({ pageSize: 1000 });
  const allEmployees = summaryQuery.data?.items ?? [];
  const totalCount = summaryQuery.data?.totalCount ?? allEmployees.length;

  const departmentsQuery = useEmployeeDepartments();
  const rolesQuery = useEmployeeRoles();
  const labourEnumsQuery = useLabourEnums();

  const departments = useMemo(
    () => (departmentsQuery.data ?? []).map((option) => ({
      label: option.name,
      value: option.id,
    })),
    [departmentsQuery.data],
  );
  const roles = useMemo(
    () => (rolesQuery.data ?? []).map((option) => ({
      label: option.name,
      value: option.id,
    })),
    [rolesQuery.data],
  );
  const types = useMemo(
    () =>
      (labourEnumsQuery.data?.labour_type ?? []).map((item) => ({
        label: item.label,
        value: normaliseEnumValue(item.value, "LABOUR_TYPE_"),
      })),
    [labourEnumsQuery.data],
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
    search.trim() || department !== "all" || role !== "all" || type !== "all",
  );

  const columns: TableColumn<Employee>[] = [
    {
      key: "code",
      header: "Employee ID",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-primary-700">{row.code || "-"}</span>
      ),
    },
    {
      key: "full_name",
      header: "Full Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatar_url} alt="" />
            <AvatarFallback>{initials(row.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="block font-medium">{row.full_name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "department_name",
      header: "Department",
      sortable: true,
      render: (row) => row.department_name || "-",
    },
    {
      key: "position_name",
      header: "Position",
      sortable: true,
      render: (row) => row.position_name || "-",
    },
    {
      key: "role_name",
      header: "Role",
      sortable: true,
      render: (row) => row.role_name || "-",
    },
    {
      key: "type",
      header: "Employment Type",
      sortable: true,
      render: (row) => (
        <Badge variant="secondary" className="capitalize">
          {displayType(row.type)}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <MasterDataActions
          name={row.full_name}
          editHref={`/app/master-data/employee/${row.id}/edit`}
          onDelete={() => setDeleting(row)}
          disabled={deleteEmployee.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Employee"
        subtitle="Manage all employee data in the system. Add, edit, or delete employee records."
        addBtnLabel="Add Employee"
        handleAdd={() => router.push("/app/master-data/employee/add")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Employees"
          subtitle="All employee records"
          value={totalCount}
          icon={Users}
        />
        <SummaryCard
          title="Departments"
          subtitle="Departments in use"
          value={departments.length}
          icon={Building2}
        />
        <SummaryCard
          title="Positions"
          subtitle="Positions in use"
          value={
            new Set(allEmployees.map((item) => item.position_id).filter(Boolean))
              .size
          }
          icon={BriefcaseBusiness}
        />
        <SummaryCard
          title="Roles"
          subtitle="Roles in use"
          value={roles.length}
          icon={IdCard}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <Table
              name="employee"
              columns={columns}
              data={employees}
              getRowId={(row) => row.id}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search employee by name, ID, email, or phone..."
              sortKey={sortByForUI}
              sortDir={sortDirForUI}
              onSortChange={(key, dir) => {
                setPendingSort({ by: key ?? "", dir });
              }}
              emptyState={
                hasActiveFilters
                  ? {
                      description: "Try changing your search or filters.",
                    }
                  : {
                      description:
                        "You haven't added any employees yet. Get started by creating your first employee record.",
                      actionLabel: "Add Employee",
                      onAction: () => router.push("/app/master-data/employee/add"),
                    }
              }
              filters={[
                {
                  key: "department",
                  placeholder: "All Departments",
                  value: department,
                  onChange: (value) => set("department", value),
                  options: [
                    { label: "All Departments", value: "all" },
                    ...departments,
                  ],
                },
                {
                  key: "role",
                  placeholder: "All Roles",
                  value: role,
                  onChange: (value) => set("role", value),
                  options: [{ label: "All Roles", value: "all" }, ...roles],
                },
                {
                  key: "type",
                  placeholder: "All Employment Types",
                  value: type,
                  onChange: (value) => set("type", value),
                  options: [
                    { label: "All Employment Types", value: "all" },
                    ...types,
                  ],
                },
              ]}
            />
            <div className="flex flex-wrap items-center gap-3 border-t px-5 py-3">
              <p className="mr-auto text-xs text-slate-500">
                Page {page}
                {data?.totalCount
                  ? ` · ${data.totalCount} total employee${data.totalCount === 1 ? "" : "s"}`
                  : ""}
                {isFetching && !isLoading ? " · Updating..." : ""}
              </p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageTokens([""]);
                  setMany({ pageSize: Number(value), page: 1 });
                }}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isFetching}
                onClick={() => {
                  setPageTokens((current) => current.slice(0, page - 1));
                  set("page", Math.max(1, page - 1));
                }}
                aria-label="Previous employee page"
              >
                <ChevronLeft />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.nextPageToken || isFetching}
                onClick={() => set("page", page + 1)}
                aria-label="Next employee page"
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteEmployee.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          });
        }}
        title="Delete employee?"
        description={`Are you sure you want to delete ${deleting?.full_name ?? "this employee"}? This action cannot be undone.`}
        confirmLabel="Delete Employee"
        isLoading={deleteEmployee.isPending}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-slate-500">
      <LoaderCircle className="h-5 w-5 animate-spin" /> Loading employees...
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-slate-600">
        Employee data could not be loaded.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

function normaliseEnumValue(value: string, prefix: string) {
  const trimmed = value.trim();
  if (trimmed.toUpperCase().startsWith(prefix)) {
    return trimmed.slice(prefix.length).toLowerCase();
  }
  return trimmed;
}

function displayType(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
