"use client";

import {
  LoaderCircle,
  RefreshCw,
  Search,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDisplayValue } from "@/lib/format-display-value";
import {
  useAddProjectMembers,
  useRoles,
  type ReferenceOption,
} from "../../../master-data/projects/use-projects";
import type { Project } from "../../../master-data/projects/types";

type RoleAssignmentPayload = {
  group_id?: string;
  project_id: string;
  responsibility: string;
  role_in_project: string;
};

type AssignRoleDialogProps = {
  assignedRoleIds: string[];
  onAssigned: (roles: ReferenceOption[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: Project;
};

export function AssignRoleDialog({
  assignedRoleIds,
  onAssigned,
  onOpenChange,
  open,
  project,
}: AssignRoleDialogProps) {
  const rolesQuery = useRoles();
  const assignRoles = useAddProjectMembers();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableRoles = useMemo(() => {
    const assigned = new Set(assignedRoleIds);
    return (rolesQuery.data ?? []).filter((role) => !assigned.has(role.id));
  }, [assignedRoleIds, rolesQuery.data]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableRoles;
    return availableRoles.filter((role) =>
      role.name.toLowerCase().includes(query),
    );
  }, [availableRoles, search]);

  const reset = () => {
    setSearch("");
    setSelectedIds([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (assignRoles.isPending) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const toggleRole = (roleId: string) => {
    setSelectedIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  };

  const save = async () => {
    if (!selectedIds.length || assignRoles.isPending) return;

    const selected = availableRoles.filter((role) =>
      selectedIds.includes(role.id),
    );
    const payloads: RoleAssignmentPayload[] = selected.map((role) => ({
      project_id: project.id,
      responsibility: "",
      role_in_project: role.id,
      ...(project.group_id ? { group_id: project.group_id } : {}),
    }));

    try {
      // Role assignments intentionally omit labour_id.
      await assignRoles.mutateAsync(payloads);
      onAssigned(selected);
      reset();
      onOpenChange(false);
    } catch {
      // The shared mutation handler displays the API error and keeps this open.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton={!assignRoles.isPending}
      >
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <UserRoundCog className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="text-sm">Assign Role</DialogTitle>
              <DialogDescription className="text-xs">
                Select master-data roles to add to this project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b px-5 py-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search role..."
              className="h-9 w-full bg-slate-50 pl-9 text-xs"
            />
          </div>
        </div>

        <div className="h-[55vh] min-h-80 overflow-y-auto px-5 py-3">
          {rolesQuery.isLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading roles...
            </div>
          ) : rolesQuery.isError ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <strong className="text-xs">Role data could not be loaded</strong>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => rolesQuery.refetch()}
              >
                <RefreshCw />
                Try Again
              </Button>
            </div>
          ) : filteredRoles.length ? (
            <div className="space-y-2">
              {filteredRoles.map((role) => {
                const selected = selectedIds.includes(role.id);
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary-200 bg-primary-50"
                        : "border-slate-100 hover:bg-slate-50",
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleRole(role.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${formatDisplayValue(role.name)}`}
                    />
                    <span>{formatDisplayValue(role.name)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <UsersRound className="h-5 w-5" />
              </span>
              <strong className="text-xs">No Role Found</strong>
              <p className="mt-1 max-w-xs text-[10px] text-muted-foreground">
                Set up a role in master data before assigning it to this
                project.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => rolesQuery.refetch()}
              >
                <RefreshCw />
                Refresh Role List
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={assignRoles.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedIds.length || assignRoles.isPending}
            onClick={save}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {assignRoles.isPending && (
              <LoaderCircle className="animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
