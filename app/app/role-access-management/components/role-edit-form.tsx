"use client";

import {
  ArrowLeft,
  Box,
  ChevronDown,
  ChevronRight,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RbacModule } from "@/components/layout/dasbhoard/navigation";
import { useAuthMe } from "@/hooks/useAuthMe";
import { cn } from "@/lib/utils";
import type { Role, RoleAccessLevel } from "../types";
import { useRoleAccess, useSetRoleAccess, useUpdateRole } from "../use-roles";

const ACCESS_LEVELS: Array<{
  value: RoleAccessLevel;
  label: string;
}> = [
  { value: "no_access", label: "No Access" },
  { value: "view_only", label: "View Only" },
  { value: "edit", label: "Edit" },
  { value: "full_access", label: "Full Access" }
];

type ModuleGroup = {
  module: RbacModule;
  features: RbacModule[];
};

export function RoleEditForm({ role }: { role: Role }) {
  const router = useRouter();
  const meQuery = useAuthMe();
  const roleAccessQuery = useRoleAccess(role.id);
  const setRoleAccess = useSetRoleAccess();
  const updateRole = useUpdateRole();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<
    Record<string, RoleAccessLevel>
  >({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState("");

  const moduleGroups = useMemo<ModuleGroup[]>(() => {
    return (meQuery.data?.rbac?.modules ?? [])
      .map((module) => ({
        module,
        features: [...(module.sub_modules ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      }))
      .sort((a, b) => a.module.name.localeCompare(b.module.name));
  }, [meQuery.data?.rbac?.modules]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return moduleGroups;
    return moduleGroups.flatMap((group) => {
      const parentMatches = [
        group.module.name,
        group.module.key,
        group.module.description ?? ""
      ].some((value) => value.toLowerCase().includes(query));
      const matchingFeatures = group.features.filter((feature) =>
        [feature.name, feature.key, feature.description ?? ""].some((value) =>
          value.toLowerCase().includes(query)
        )
      );
      if (!parentMatches && matchingFeatures.length === 0) return [];
      return [
        {
          ...group,
          features: parentMatches ? group.features : matchingFeatures
        }
      ];
    });
  }, [moduleGroups, search]);

  useEffect(() => {
    setExpanded(new Set(moduleGroups.map((group) => group.module.id)));
  }, [moduleGroups]);

  useEffect(() => {
    if (!roleAccessQuery.data) return;
    setPermissions((current) => {
      const fromApi = Object.fromEntries(
        roleAccessQuery.data.map((item) => [item.module_key, item.access_level])
      );

      savingKeys.forEach((moduleKey) => {
        if (current[moduleKey]) fromApi[moduleKey] = current[moduleKey];
      });

      return fromApi;
    });
  }, [roleAccessQuery.data, savingKeys]);

  const changePermission = async (
    moduleKey: string,
    level: RoleAccessLevel
  ) => {
    if (savingKeys.has(moduleKey)) return;

    const previousLevel = permissions[moduleKey] ?? "no_access";
    if (previousLevel === level) return;

    setPermissions((current) => ({ ...current, [moduleKey]: level }));
    setSavingKeys((current) => new Set(current).add(moduleKey));
    try {
      const savedPermission = await setRoleAccess.mutateAsync({
        access_level: level,
        module_key: moduleKey,
        role_id: role.id
      });
      setPermissions((current) => ({
        ...current,
        [moduleKey]: savedPermission.access_level
      }));
    } catch {
      setPermissions((current) =>
        current[moduleKey] === level
          ? { ...current, [moduleKey]: previousLevel }
          : current
      );
    } finally {
      setSavingKeys((current) => {
        const next = new Set(current);
        next.delete(moduleKey);
        return next;
      });
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Role name is required.");
      return;
    }
    try {
      await updateRole.mutateAsync({
        id: role.id,
        payload: { description: description.trim(), name: trimmedName }
      });
    } catch {
      // Toast error already handled by mutation meta.
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <button
          type="button"
          onClick={() => router.push("/app/role-access-management")}
          className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to roles
        </button>
        <h1 className="text-xl font-bold text-gray-950">Edit Role</h1>
        <p className="mt-1 text-xs text-gray-500">
          Edit role details and define its access permissions.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle
          icon={Info}
          title="Basic Information"
          description="Provide the basic details of this role."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              Role Name <span className="text-red-500">*</span>
            </span>
            <Input
              value={name}
              maxLength={100}
              onChange={(event) => {
                setName(event.target.value);
                if (event.target.value.trim()) setNameError("");
              }}
              placeholder="Enter role name"
              className="w-full"
            />
            {nameError ? (
              <span className="mt-1 block text-xs text-red-600">
                {nameError}
              </span>
            ) : (
              <span className="mt-1 block text-[10px] text-gray-400">
                For example: Project Manager
              </span>
            )}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              Description (Optional)
            </span>
            <Textarea
              value={description}
              maxLength={255}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter role description"
              className="w-full resize-none"
            />
            <span className="mt-1 block text-right text-[10px] text-gray-400">
              {description.length}/255
            </span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/app/role-access-management")}
            disabled={updateRole.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={updateRole.isPending}
            onClick={handleSave}
            className="bg-primary-700 hover:bg-primary-600"
          >
            {updateRole.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle
            icon={ShieldCheck}
            title="Assign Permissions"
            description="Select the modules and set the level of access for this role."
          />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by module name"
              className="w-full pl-9"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(280px,1fr)_repeat(4,100px)] border-b px-2 pb-2 text-[10px] font-semibold text-gray-500">
              <span>Module / Feature</span>
              {ACCESS_LEVELS.map((level) => (
                <span key={level.value} className="text-center">
                  {level.label}
                </span>
              ))}
            </div>

            {meQuery.isLoading || roleAccessQuery.isLoading ? (
              <div className="flex min-h-48 items-center justify-center gap-2 text-xs text-gray-500">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading
                permissions...
              </div>
            ) : meQuery.isError ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-xs text-gray-500">
                Module data could not be loaded.
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => meQuery.refetch()}
                >
                  Try Again
                </Button>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center text-xs text-gray-500">
                No module or feature found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredGroups.map((group, index) => (
                  <PermissionGroup
                    key={group.module.id}
                    group={group}
                    colorIndex={index}
                    expanded={
                      search.trim() ? true : expanded.has(group.module.id)
                    }
                    permissions={permissions}
                    savingKeys={savingKeys}
                    onToggle={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(group.module.id))
                          next.delete(group.module.id);
                        else next.add(group.module.id);
                        return next;
                      })
                    }
                    onChange={changePermission}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {roleAccessQuery.isError && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Existing permissions could not be loaded. Only permissions changed
            on this page will be saved.
          </p>
        )}

        <PermissionLegend />
      </section>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Info;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-[10px] text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function PermissionGroup({
  group,
  colorIndex,
  expanded,
  permissions,
  savingKeys,
  onToggle,
  onChange
}: {
  group: ModuleGroup;
  colorIndex: number;
  expanded: boolean;
  permissions: Record<string, RoleAccessLevel>;
  savingKeys: Set<string>;
  onToggle: () => void;
  onChange: (moduleKey: string, level: RoleAccessLevel) => void;
}) {
  const selectableItems = group.features.length
    ? group.features
    : [group.module];
  const colors = [
    "bg-fuchsia-50 text-fuchsia-600",
    "bg-primary-50 text-primary-600",
    "bg-emerald-50 text-emerald-600",
    "bg-amber-50 text-amber-600",
    "bg-sky-50 text-sky-600"
  ];

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-2 py-3 text-left hover:bg-gray-50"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            colors[colorIndex % colors.length]
          )}
        >
          <Box className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-gray-900">
            {group.module.name}
          </span>
          <span className="block truncate text-[10px] text-gray-400">
            {group.module.description || group.module.key}
          </span>
        </span>
      </button>

      {expanded &&
        selectableItems.map((item) => (
          <PermissionRow
            key={item.id}
            item={item}
            value={permissions[item.key] ?? "no_access"}
            saving={savingKeys.has(item.key)}
            onChange={(level) => onChange(item.key, level)}
          />
        ))}
    </div>
  );
}

function PermissionRow({
  item,
  value,
  saving,
  onChange
}: {
  item: RbacModule;
  value: RoleAccessLevel;
  saving: boolean;
  onChange: (level: RoleAccessLevel) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(280px,1fr)_repeat(4,100px)] items-center px-2 py-3 pl-14 hover:bg-gray-50/70">
      <div className="min-w-0 pr-4">
        <p className="truncate text-xs font-medium text-gray-800">
          {item.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-gray-400">
          {item.description || item.key}
        </p>
      </div>
      {ACCESS_LEVELS.map((level) => (
        <label
          key={level.value}
          className="flex cursor-pointer justify-center py-2"
        >
          <input
            type="radio"
            name={`permission-${item.key}`}
            value={level.value}
            checked={value === level.value}
            disabled={!item.key || saving}
            onChange={() => onChange(level.value)}
            className="h-4 w-4 cursor-pointer accent-primary-700"
            aria-label={`${item.name}: ${level.label}`}
          />
        </label>
      ))}
    </div>
  );
}

function PermissionLegend() {
  return (
    <div className="mt-5 rounded-md border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
        <div>
          <p className="text-xs font-semibold text-primary-900">
            Permission Levels
          </p>
          <div className="mt-2 space-y-1 text-[10px] text-gray-600">
            <p>
              <strong>No Access:</strong> Users cannot access this module.
            </p>
            <p>
              <strong>View Only:</strong> Users can view data but cannot make
              changes.
            </p>
            <p>
              <strong>Edit:</strong> Users can create and edit data.
            </p>
            <p>
              <strong>Full Access:</strong> Users have full control including
              delete and configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
