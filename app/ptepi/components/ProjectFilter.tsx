"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Check,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  Hourglass,
  Layers,
  TriangleAlert
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatRupiahMillions } from "../format";
import { getProjectIdFromPath, switchProjectPath } from "../navigation";
import { useProjectStore } from "../store/project-store";
import type { ProjectFilterOption, StatusGroup } from "../types";

const TONE_ICON = {
  good: { Icon: CircleCheck, label: "On track", pillClassName: "bg-green-50 text-green-800" },
  watch: { Icon: TriangleAlert, label: "Watch", pillClassName: "bg-amber-50 text-amber-900" },
  bad: { Icon: CircleAlert, label: "At risk", pillClassName: "bg-red-50 text-red-700" }
} as const;

/** Lifecycle groups of the list, the work in flight first. Icon and label carry the meaning, color only adds to it. */
const GROUPS: {
  id: StatusGroup;
  label: string;
  Icon: typeof CircleCheck;
  tileClassName: string;
  headingClassName: string;
}[] = [
  {
    id: "in-progress",
    label: "In progress",
    Icon: Activity,
    tileClassName: "bg-primary-100 text-primary-800",
    headingClassName: "text-primary-700"
  },
  {
    id: "completed",
    label: "Completed",
    Icon: CircleCheckBig,
    tileClassName: "bg-green-50 text-green-800",
    headingClassName: "text-green-700"
  },
  {
    id: "pipeline",
    label: "Pipeline",
    Icon: Hourglass,
    tileClassName: "bg-gray-100 text-gray-700",
    headingClassName: "text-gray-600"
  }
];

/** Keeps the selected project in step with the URL on project routes. */
export function useSyncProjectFromPath() {
  const pathname = usePathname();
  const setProject = useProjectStore((state) => state.setProject);
  useEffect(() => {
    const fromPath = getProjectIdFromPath(pathname);
    if (fromPath) setProject(fromPath);
  }, [pathname, setProject]);
}

type ProjectFilterProps = {
  options: ProjectFilterOption[];
  /** Adds an "All projects" entry (the default view of the portfolio screens) */
  allowAll?: boolean;
};

/** Project filter for the top of a screen. On project routes it opens the same screen for the chosen project. */
export function ProjectFilter({ options, allowAll = false }: ProjectFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const storeProjectId = useProjectStore((state) => state.projectId);
  const setProject = useProjectStore((state) => state.setProject);
  const [open, setOpen] = useState(false);

  const projectId = getProjectIdFromPath(pathname) ?? storeProjectId;
  const selected = options.find((option) => option.id === projectId) ?? null;
  const selectedGroup = selected ? GROUPS.find((group) => group.id === selected.statusGroup) : undefined;

  const choose = (next: string | null) => {
    setOpen(false);
    setProject(next);
    if (next) {
      const target = switchProjectPath(pathname, next);
      if (target !== pathname.replace(/\/+$/, "")) router.push(target);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter by project"
          className="group flex h-11 min-w-56 cursor-pointer items-center gap-3 rounded-xl border border-primary-200 bg-gradient-to-b from-white to-primary-50/70 py-1.5 pl-1.5 pr-3 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-300 data-[state=open]:border-primary-400 data-[state=open]:ring-2 data-[state=open]:ring-primary-100"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
            {selectedGroup ? <selectedGroup.Icon size={16} aria-hidden /> : <Layers size={16} aria-hidden />}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-primary-800">
              {selectedGroup ? `Project · ${selectedGroup.label}` : "Project"}
            </span>
            <span className="block truncate text-sm font-semibold text-gray-900">
              {selected ? `${selected.id} · ${selected.customer}` : "All projects"}
            </span>
          </span>
          <ChevronsUpDown size={16} aria-hidden className="shrink-0 text-primary-700" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] overflow-hidden rounded-xl border-primary-100 p-0 shadow-xl">
        <Command>
          <CommandInput placeholder="Search project or customer" />
          <CommandList className="max-h-80">
            <CommandEmpty>No project found.</CommandEmpty>
            {allowAll && (
              <CommandGroup>
                <CommandItem value="all projects" onSelect={() => choose(null)} className="gap-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Layers size={16} aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium">All projects</span>
                  {selected === null && <Check size={16} aria-hidden className="text-primary-700" />}
                </CommandItem>
              </CommandGroup>
            )}
            {GROUPS.map((group) => {
              const items = options.filter((option) => option.statusGroup === group.id);
              if (items.length === 0) return null;
              return (
                <CommandGroup
                  key={group.id}
                  heading={
                    <span className="flex items-center gap-1.5">
                      <group.Icon size={12} aria-hidden className={group.headingClassName} />
                      {group.label}
                      <span className="ml-auto rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold tabular-nums text-gray-700">
                        {items.length}
                      </span>
                    </span>
                  }
                >
                  {items.map((option) => {
                    const health = TONE_ICON[option.tone];
                    return (
                      <CommandItem
                        key={option.id}
                        value={`${option.id} ${option.customer} ${option.stageLabel} ${group.label}`}
                        onSelect={() => choose(option.id)}
                        className="gap-3 py-2"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            group.tileClassName
                          )}
                        >
                          <group.Icon size={16} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900">{option.id}</span>
                            {option.tone !== "good" && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold",
                                  health.pillClassName
                                )}
                              >
                                <health.Icon size={10} aria-hidden />
                                {health.label}
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {option.customer} · {option.stageLabel}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-gray-700">
                          {formatRupiahMillions(option.contractValue)}
                        </span>
                        {selected?.id === option.id && <Check size={16} aria-hidden className="text-primary-700" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
