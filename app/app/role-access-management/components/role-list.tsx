"use client";

import { ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ConfirmationModal from "@/components/ConfirmationModal";
import MasterDataActions from "@/components/MasterDataActions";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TableColumn } from "@/types/type";
import type { Role, RolePayload } from "../types";
import {
  useCreateRole,
  useDeleteRole,
  useRoles
} from "../use-roles";

const PAGE_SIZE = 100;
const EMPTY_PAYLOAD: RolePayload = { name: "", description: "" };

export function RoleList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleName, setRoleName] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const { data: roleOptionsData } = useRoles({ page_size: PAGE_SIZE });
  const { data, isLoading, isError, refetch } = useRoles({
    name: roleName === "all" ? debouncedSearch || undefined : roleName,
    page_size: PAGE_SIZE
  });
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const roles = data?.items ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);
  const roleNameOptions = useMemo(
    () =>
      Array.from(new Set((roleOptionsData?.items ?? []).map((role) => role.name)))
        .sort((first, second) => first.localeCompare(second))
        .map((name) => ({ label: name, value: name })),
    [roleOptionsData]
  );

  const columns: TableColumn<Role>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Role Name",
        sortable: true,
        render: (row) => <span className="font-semibold">{row.name}</span>
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className="block max-w-md whitespace-normal text-muted-foreground">
            {row.description || "-"}
          </span>
        )
      },
      {
        key: "created_at",
        header: "Created",
        render: (row) => formatDate(row.created_at)
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (row) => (
          <MasterDataActions
            name={row.name}
            editHref={`/app/role-access-management/${row.id}/edit`}
            onDelete={() => setDeleting(row)}
            disabled={deleteRole.isPending}
          />
        )
      }
    ],
    [deleteRole.isPending]
  );

  const saveRole = async (payload: RolePayload) => {
    await createRole.mutateAsync(payload);
    setFormOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Role Access Management"
        subtitle="Manage the roles available for construction projects."
        addBtnLabel="Add Role"
        handleAdd={() => {
          setFormOpen(true);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Total Roles"
          value={data?.total_count ?? 0}
          subtitle="All role records"
          icon={Users}
        />
        <SummaryCard
          title="Displayed Roles"
          value={roles.length}
          subtitle="Roles in the current result"
          icon={ShieldCheck}
        />
      </div>
      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading roles...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Role data could not be loaded.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={roles}
          getRowId={(row) => row.id}
          name="role"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setRoleName("all");
          }}
          searchPlaceholder="Search role by name..."
          filters={[
            {
              key: "role-name",
              placeholder: "Filter by role name",
              value: roleName,
              onChange: (value) => {
                setRoleName(value);
                setSearch("");
              },
              options: [
                { label: "All Role Names", value: "all" },
                ...roleNameOptions
              ]
            }
          ]}
          emptyState={{
            description: "You haven't created any roles yet.",
            actionLabel: "Add Role",
            onAction: () => {
              setFormOpen(true);
            }
          }}
        />
      )}

      <RoleDialog
        open={formOpen}
        pending={createRole.isPending}
        onOpenChange={setFormOpen}
        onSave={saveRole}
      />
      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete role?"
        description={`Are you sure you want to delete ${deleting?.name ?? "this role"}? This action cannot be undone.`}
        confirmLabel="Delete Role"
        isLoading={deleteRole.isPending}
        onConfirm={() => {
          if (deleting)
            deleteRole.mutate(deleting.id, {
              onSuccess: () => setDeleting(null)
            });
        }}
      />
    </div>
  );
}

function RoleDialog({
  open,
  pending,
  onOpenChange,
  onSave
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: RolePayload) => Promise<void>;
}) {
  const [payload, setPayload] = useState<RolePayload>(EMPTY_PAYLOAD);
  useEffect(() => {
    if (open) setPayload(EMPTY_PAYLOAD);
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
          <DialogDescription>
            Provide a name and optional description for this role.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(payload);
          }}
          className="space-y-4"
        >
          <Input
            required
            value={payload.name}
            onChange={(event) =>
              setPayload({ ...payload, name: event.target.value })
            }
            placeholder="Role name"
            className="w-full"
          />
          <Textarea
            value={payload.description}
            onChange={(event) =>
              setPayload({ ...payload, description: event.target.value })
            }
            placeholder="Description"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}
