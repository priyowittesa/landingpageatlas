"use client";

import { Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import FormSection from "@/components/FormSection";
import FormSelectField from "@/components/FormSelectField";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectPayload } from "../types";
import { useDepartments, useLabours, useRoles } from "../use-projects";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ProjectTeamSection() {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ProjectPayload>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "project_team",
  });
  const { data: labours = [], isLoading: loadingLabours } = useLabours();
  const { data: roles = [], isLoading: loadingRoles } = useRoles();
  const { data: departments = [], isLoading: loadingDepartments } =
    useDepartments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const team = watch("project_team");

  useEffect(() => {
    if (labours.length === 0) return;
    team.forEach((member, index) => {
      const labour = labours.find((item) => item.id === member.labour_id);
      if (!member.role_id && labour?.role_id) {
        setValue(`project_team.${index}.role_id`, labour.role_id);
      }
      if (!member.department_id && labour?.department_id) {
        setValue(`project_team.${index}.department_id`, labour.department_id);
      }
    });
  }, [labours, setValue, team]);

  const existingIds = useMemo(
    () => new Set(team.map((member) => member.labour_id)),
    [team],
  );
  const availableLabours = useMemo(() => {
    const query = search.trim().toLowerCase();
    return labours.filter(
      (labour) =>
        !existingIds.has(labour.id) &&
        (!query ||
          labour.name.toLowerCase().includes(query) ||
          labour.email?.toLowerCase().includes(query) ||
          labour.role?.toLowerCase().includes(query)),
    );
  }, [existingIds, labours, search]);

  const closeDialog = () => {
    setDialogOpen(false);
    setSearch("");
    setSelected([]);
  };

  const addMembers = () => {
    selected.forEach((labourId) => {
      const labour = labours.find((item) => item.id === labourId);
      append({
        labour_id: labourId,
        name: labour?.name ?? "",
        group_id: labour?.groupId ?? "",
        role_id: labour?.role_id ?? "",
        department_id: labour?.department_id ?? "",
        responsibility: "",
      });
    });
    closeDialog();
  };

  return (
    <>
      <FormSection
        title="Project Team"
        subtitle="Add key team members who will be involved in this project."
        icon={Users}
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Team Member
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="min-w-[260px]">Role in Project</TableHead>
                <TableHead className="min-w-[260px]">Department</TableHead>
                <TableHead>Responsibility</TableHead>
                <TableHead className="w-20 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No team members added yet.
                  </TableCell>
                </TableRow>
              )}
              {fields.map((field, index) => {
                const labour = labours.find(
                  (item) => item.id === team[index]?.labour_id,
                );
                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <Avatar>
                          {labour?.avatar && (
                            <AvatarImage
                              src={labour.avatar}
                              alt={labour.name}
                            />
                          )}
                          <AvatarFallback>
                            {initials(labour?.name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {labour?.name ?? "Unknown employee"}
                          </p>
                          {labour?.email && (
                            <p className="text-xs text-muted-foreground">
                              {labour.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      <FormSelectField<ProjectPayload>
                        control={control}
                        name={`project_team.${index}.role_id`}
                        label="Role in Project"
                        hideLabel
                        search
                        searchPlaceholder="Search role..."
                        placeholder={
                          loadingRoles ? "Loading roles..." : "Select role"
                        }
                        emptyMessage="No project role found."
                        error={errors.project_team?.[index]?.role_id}
                        options={roles.map((role) => ({
                          label: role.name,
                          value: role.id,
                        }))}
                      />
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      <FormSelectField<ProjectPayload>
                        control={control}
                        name={`project_team.${index}.department_id`}
                        label="Department"
                        hideLabel
                        search
                        searchPlaceholder="Search department..."
                        placeholder={
                          loadingDepartments
                            ? "Loading departments..."
                            : "Select department"
                        }
                        emptyMessage="No department found."
                        error={errors.project_team?.[index]?.department_id}
                        options={departments.map((department) => ({
                          label: department.name,
                          value: department.id,
                        }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`project_team.${index}.responsibility`}
                        render={({ field: input, fieldState }) => (
                          <div>
                            <Textarea
                              {...input}
                              rows={2}
                              maxLength={1000}
                              placeholder="Describe responsibilities"
                              className="min-w-64 resize-y border border-slate-300 bg-white focus-visible:border-primary dark:border-slate-600 dark:bg-zinc-950"
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-500">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Remove team member"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </FormSection>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-xl">
          <DialogHeader className="border-b p-5">
            <DialogTitle className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              Add Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-5">
            <label htmlFor="member-search" className="font-semibold">
              Search Member
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="member-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member by name or role"
                className="pl-9 w-full"
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {loadingLabours && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading team members...
                </p>
              )}
              {!loadingLabours && availableLabours.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No team member found.
                </p>
              )}
              {availableLabours.map((labour) => (
                <label
                  key={labour.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-3 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(labour.id)}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(labour.id)
                          ? current.filter((id) => id !== labour.id)
                          : [...current, labour.id],
                      )
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <Avatar>
                    {labour.avatar && (
                      <AvatarImage src={labour.avatar} alt={labour.name} />
                    )}
                    <AvatarFallback>{initials(labour.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {labour.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {labour.role ?? labour.email ?? "Team member"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter className="border-t p-5">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={selected.length === 0}
              onClick={addMembers}
            >
              Add Team Member
              {selected.length > 1 ? ` (${selected.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
