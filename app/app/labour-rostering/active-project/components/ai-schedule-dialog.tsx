"use client";

import { Filter, LoaderCircle, Minus, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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

export type AiScheduleRoleOption = {
  code: string;
  id: string;
  memberCount: number;
  name: string;
};

export type AiScheduleRoleSelection = {
  roleId: string;
  totalEmployee: number;
};

export type AiScheduleRuleFlags = {
  costEfficiency: boolean;
  employeeAvailability: boolean;
  locationPreference: boolean;
  workloadOvertimeBalance: boolean;
};

export type AiScheduleRequest = {
  endDate: string;
  projectId: string;
  roles: AiScheduleRoleSelection[];
  rules: AiScheduleRuleFlags;
  startDate: string;
};

type AiScheduleDialogProps = {
  endDate: string;
  isGenerating: boolean;
  onGenerate: (request: AiScheduleRequest) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
  projectLabel: string;
  roles: AiScheduleRoleOption[];
  startDate: string;
};

type RuleKey = keyof AiScheduleRuleFlags;

const RULE_OPTIONS: { key: RuleKey; label: string }[] = [
  { key: "costEfficiency", label: "Cost efficiency" },
  { key: "employeeAvailability", label: "Availability Employee" },
  { key: "locationPreference", label: "Location preference" },
  {
    key: "workloadOvertimeBalance",
    label: "Workload & overtime balance",
  },
];

const AI_CONSIDERATIONS = [
  "Employee availability & current assignments",
  "Skills match & experience level",
  "Certifications & compliance",
  "Workload & overtime balance",
  "Location & travel distance",
  "Performance & reliability",
  "Cost optimization",
  "Company rules & constraints",
];

const RECOMMENDATION_TIPS = [
  "Be specific with required skills",
  "Set realistic experience level",
  "Consider overtime allowance",
  "Add location preference if important",
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return {
    endDate: formatLocalDate(nextWeek),
    startDate: formatLocalDate(today),
  };
};

export function AiScheduleDialog({
  endDate,
  isGenerating,
  onGenerate,
  onOpenChange,
  open,
  projectId,
  projectLabel,
  roles,
  startDate,
}: AiScheduleDialogProps) {
  const [requestStartDate, setRequestStartDate] = useState(startDate);
  const [requestEndDate, setRequestEndDate] = useState(endDate);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [roleSearch, setRoleSearch] = useState("");
  const [ruleSearch, setRuleSearch] = useState("");
  const [rules, setRules] = useState<AiScheduleRuleFlags>({
    costEfficiency: true,
    employeeAvailability: false,
    locationPreference: false,
    workloadOvertimeBalance: false,
  });

  useEffect(() => {
    if (!open) return;
    const defaultDateRange = getDefaultDateRange();
    setRequestStartDate(defaultDateRange.startDate);
    setRequestEndDate(defaultDateRange.endDate);
    setSelectedRoleIds([]);
    setRoleCounts({});
    setRoleSearch("");
    setRuleSearch("");
    setRules({
      costEfficiency: true,
      employeeAvailability: false,
      locationPreference: false,
      workloadOvertimeBalance: false,
    });
  }, [endDate, open, roles, startDate]);

  const selectedRoles = useMemo(
    () => roles.filter((role) => selectedRoleIds.includes(role.id)),
    [roles, selectedRoleIds],
  );

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      `${role.name} ${role.code}`.toLowerCase().includes(query),
    );
  }, [roleSearch, roles]);

  const filteredRules = useMemo(() => {
    const query = ruleSearch.trim().toLowerCase();
    if (!query) return RULE_OPTIONS;
    return RULE_OPTIONS.filter((rule) =>
      rule.label.toLowerCase().includes(query),
    );
  }, [ruleSearch]);

  const hasValidRoleCounts = useMemo(
    () =>
      selectedRoles.length > 0 &&
      selectedRoles.every((role) => {
        const count = roleCounts[role.id];
        return Number.isInteger(count) && count > 0;
      }),
    [roleCounts, selectedRoles],
  );

  const hasValidDateRange =
    Boolean(requestStartDate && requestEndDate) &&
    requestEndDate >= requestStartDate;

  const canGenerate =
    hasValidRoleCounts && hasValidDateRange && !isGenerating;

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((id) => id !== roleId);
      }
      setRoleCounts((counts) => ({
        ...counts,
        [roleId]: Math.max(1, counts[roleId] ?? 1),
      }));
      return [...current, roleId];
    });
  };

  const adjustCount = (roleId: string, delta: number) => {
    setRoleCounts((current) => {
      const next = (current[roleId] ?? 1) + delta;
      return {
        ...current,
        [roleId]: Math.max(1, next),
      };
    });
  };

  const toggleRule = (key: RuleKey) => {
    setRules((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleAnalyze = () => {
    if (!canGenerate) return;
    onGenerate({
      endDate: requestEndDate,
      projectId,
      roles: selectedRoles.map((role) => ({
        roleId: role.id,
        totalEmployee: roleCounts[role.id],
      })),
      rules,
      startDate: requestStartDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[94dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={!isGenerating}
      >
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Filter className="size-4.5" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="text-sm">
                Define Scheduling Request
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                Tell AI what you need for this project and shift.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-3 flex items-start gap-3 rounded-lg border border-primary-300 bg-primary-50/50 p-3 text-primary-700">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <div>
              <h3 className="text-xs font-semibold">How AI Works</h3>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                AI will analyze employee availability, skills, location,
                workload, overtime, certifications, cost, and other factors to
                recommend the best matches for your requirements.
              </p>
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="space-y-3">
              <section className="rounded-lg border bg-white p-3">
                <SectionHeading
                  number="1"
                  title="Basic Information"
                  description="Set project schedule and priority."
                />

                <div className="mt-3">
                  <FieldLabel required>Project</FieldLabel>
                  <Input
                    value={projectLabel}
                    readOnly
                    className="mt-1 h-9 w-full bg-slate-100 text-xs"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Start Date</FieldLabel>
                    <DatePicker
                      className="mt-1"
                      value={requestStartDate}
                      max={requestEndDate || undefined}
                      onChange={setRequestStartDate}
                    />
                  </div>
                  <div>
                    <FieldLabel required>End Date</FieldLabel>
                    <DatePicker
                      className="mt-1"
                      value={requestEndDate}
                      min={requestStartDate || undefined}
                      onChange={setRequestEndDate}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border bg-white p-3">
                <SectionHeading
                  number="2"
                  title="Describe what you want"
                  description="Define employee needs, role, and strategic needs."
                />

                <div className="mt-3">
                  <FieldLabel required>Role</FieldLabel>
                  <div className="mt-1 overflow-hidden rounded-lg border">
                    <div className="relative border-b bg-slate-50">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={roleSearch}
                        onChange={(event) => setRoleSearch(event.target.value)}
                        placeholder="Search by role name or code"
                        className="h-9 w-full border-0 bg-transparent pl-9 text-[11px] shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="max-h-56 space-y-1 overflow-y-auto p-2">
                      {filteredRoles.map((role) => {
                        const selected = selectedRoleIds.includes(role.id);
                        const count = roleCounts[role.id] ?? 1;
                        return (
                          <label
                            key={role.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-[11px] transition-colors",
                              selected && "bg-primary-50/40",
                            )}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleRole(role.id)}
                              className="!border-2 !border-primary-500 !bg-white data-[state=checked]:!border-primary-600 data-[state=checked]:!bg-primary-600"
                            />
                            <span>{role.name}</span>
                            <div
                              className="ml-auto flex items-center gap-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                aria-label={`Decrease ${role.name} count`}
                                disabled={!selected || count <= 1}
                                onClick={() => adjustCount(role.id, -1)}
                                className="flex size-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span
                                className={cn(
                                  "min-w-5 text-center text-xs font-semibold tabular-nums",
                                  !selected && "text-slate-400",
                                )}
                              >
                                {selected ? count : 1}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase ${role.name} count`}
                                disabled={!selected}
                                onClick={() => adjustCount(role.id, 1)}
                                className="flex size-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>
                          </label>
                        );
                      })}
                      {filteredRoles.length === 0 && (
                        <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                          No roles found.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <FieldLabel>Rules / Constraints</FieldLabel>
                  <div className="mt-1 overflow-hidden rounded-lg border">
                    <div className="relative border-b bg-slate-50">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={ruleSearch}
                        onChange={(event) => setRuleSearch(event.target.value)}
                        placeholder="Search rules or constraints"
                        className="h-9 w-full border-0 bg-transparent pl-9 text-[11px] shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="grid gap-2 p-2 sm:grid-cols-2">
                      {filteredRules.map((rule) => (
                        <label
                          key={rule.key}
                          className="flex cursor-pointer items-center gap-2 text-[11px]"
                        >
                          <Checkbox
                            checked={rules[rule.key]}
                            onCheckedChange={() => toggleRule(rule.key)}
                            className="!border-2 !border-primary-500 !bg-white data-[state=checked]:!border-primary-600 data-[state=checked]:!bg-primary-600"
                          />
                          {rule.label}
                        </label>
                      ))}
                      {filteredRules.length === 0 && (
                        <p className="py-3 text-center text-[11px] text-muted-foreground sm:col-span-2">
                          No rules found.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-3">
              <section className="rounded-lg border border-primary-300 bg-primary-50/40 p-3">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                  <Sparkles className="size-3.5" />
                  What AI will consider
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {AI_CONSIDERATIONS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-[10px] leading-4 text-slate-600"
                    >
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  Tips for better recommendation
                </h3>
                <ul className="mt-2 space-y-1 text-[10px] leading-4 text-slate-600">
                  {RECOMMENDATION_TIPS.map((tip) => (
                    <li key={tip} className="flex gap-1.5">
                      <span className="text-amber-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t bg-white px-5 py-3">
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!canGenerate}
              onClick={handleAnalyze}
              className="bg-neutral-900 hover:bg-neutral-800"
            >
              {isGenerating ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              Get AI Recommendation
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({
  description,
  number,
  title,
}: {
  description: string;
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-semibold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-xs font-semibold">{title}</h2>
        <p className="mt-0.5 text-[9px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[10px] font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}
