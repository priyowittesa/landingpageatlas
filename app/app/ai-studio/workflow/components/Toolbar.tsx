"use client";

import { type ReactNode, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  Pencil,
  Check,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { validateWorkflow } from "../lib/workflowValidation";
import type { ScheduleConfig } from "../types";
import { useGetEnum } from "@/hooks/useGetEnum";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

export function Toolbar({
  folderName,
  workflowName,
  onRename,
  onBack,
  onSave,
  isSaving,
  onRun,
  isRunning,
  onSetSchedule,
  isScheduling,
  onZoomIn,
  onZoomOut,
  onFitView
}: {
  folderName?: string;
  workflowName?: string;
  onRename?: (name: string) => Promise<void>;
  onBack?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  onRun?: () => void;
  isRunning?: boolean;
  onSetSchedule?: (schedule: {
    schedule_config: ScheduleConfig;
    schedule_enabled: boolean;
    schedule_timezone: string;
    schedule_type: string;
    schedule_cron_expression?: string;
  }) => void;
  isScheduling?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}) {
  const workflowStatus = useWorkflowStore((s) => s.workflowStatus);
  const publish = useWorkflowStore((s) => s.publish);
  const setValidationErrors = useWorkflowStore((s) => s.setValidationErrors);
  const validationErrors = useWorkflowStore((s) => s.validationErrors);

  const [showResults, setShowResults] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const { data: scheduleTypes } = useGetEnum("workflow_schedule_type");

  const [scheduleType, setScheduleType] = useState("daily");
  const [everyNMinutes, setEveryNMinutes] = useState("15");
  const [everyNHours, setEveryNHours] = useState("2");
  const [everyNDays, setEveryNDays] = useState("1");
  const [everyNWeeks, setEveryNWeeks] = useState("1");
  const [everyNMonths, setEveryNMonths] = useState("1");
  const [triggerHour, setTriggerHour] = useState("7pm");
  const [triggerMinute, setTriggerMinute] = useState("0");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["monday"]);
  const [dayOfMonth, setDayOfMonth] = useState("15");
  const [month, setMonth] = useState("8");
  const [dayOfYear, setDayOfYear] = useState("1");
  const [runDate, setRunDate] = useState("");
  const [runTime, setRunTime] = useState("19:01");
  const [cronExpression, setCronExpression] = useState("");

  const DAYS_OF_WEEK = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];

  const toggleDayOfWeek = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleRun = () => {
    const { nodes, edges } = useWorkflowStore.getState();
    const result = validateWorkflow(nodes, edges, true);
    setValidationErrors(result.errors);
    setShowResults(true);

    if (!result.valid) {
      toast.error("Workflow validation failed", {
        description: result.errors[0]
      });
      return;
    }

    toast.success("Workflow validation passed!", {
      description: result.warnings.length
        ? `${result.warnings.length} warning(s)`
        : "No issues found."
    });
    onRun?.();
  };

  const handlePublish = () => {
    const { nodes, edges } = useWorkflowStore.getState();
    const result = validateWorkflow(nodes, edges);
    if (!result.valid) {
      toast.error("Cannot publish: validation failed", {
        description: result.errors[0]
      });
      return;
    }
    publish();
    onSave?.();
    toast.success("Workflow published!", {
      description: "Status updated to published."
    });
  };

  const handleSetSchedule = () => {
    // Parse hour from "7pm" format
    const hourMatch = triggerHour.match(/^(\d+)(am|pm)$/);
    const hourNum = hourMatch
      ? (parseInt(hourMatch[1], 10) % 12) + (hourMatch[2] === "pm" ? 12 : 0)
      : 0;
    const minuteNum = parseInt(triggerMinute, 10) || 0;

    const scheduleConfig: ScheduleConfig = {};
    let scheduleCronExpression: string | undefined;

    switch (scheduleType) {
      case "run_once":
        scheduleConfig.date = runDate;
        scheduleConfig.time = runTime;
        break;
      case "every_x_minutes":
        scheduleConfig.every_n_minutes = parseInt(everyNMinutes, 10) || 15;
        break;
      case "hourly":
        scheduleConfig.every_n_hours = parseInt(everyNHours, 10) || 2;
        scheduleConfig.minute = minuteNum;
        break;
      case "daily":
        scheduleConfig.every_n_days = parseInt(everyNDays, 10) || 1;
        scheduleConfig.hour = hourNum;
        scheduleConfig.minute = minuteNum;
        break;
      case "weekly":
        scheduleConfig.every_n_weeks = parseInt(everyNWeeks, 10) || 1;
        scheduleConfig.days_of_week = daysOfWeek;
        scheduleConfig.hour = hourNum;
        scheduleConfig.minute = minuteNum;
        break;
      case "monthly":
        scheduleConfig.every_n_months = parseInt(everyNMonths, 10) || 1;
        scheduleConfig.day_of_month = parseInt(dayOfMonth, 10);
        scheduleConfig.hour = hourNum;
        scheduleConfig.minute = minuteNum;
        break;
      case "yearly":
        scheduleConfig.month = parseInt(month, 10);
        scheduleConfig.day = parseInt(dayOfYear, 10);
        scheduleConfig.hour = hourNum;
        scheduleConfig.minute = minuteNum;
        break;
      case "custom_cron":
        scheduleCronExpression = cronExpression;
        break;
    }

    onSetSchedule?.({
      schedule_config: scheduleConfig,
      schedule_enabled: true,
      schedule_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      schedule_type: scheduleType,
      schedule_cron_expression: scheduleCronExpression
    });

    setScheduleOpen(false);
    toast.success("Schedule saved", {
      description: `Schedule type: ${scheduleType}`
    });
  };

  const handleRename = async () => {
    if (isSaving || isScheduling || isRenaming) return;
    const name = editedName.trim();
    if (!name) {
      toast.error("Workflow name cannot be empty");
      return;
    }
    if (name === workflowName) {
      setIsEditingName(false);
      return;
    }
    if (!onRename) return;

    setIsRenaming(true);
    try {
      await onRename(name);
      setIsEditingName(false);
      toast.success("Workflow renamed");
    } catch {
      // Keep the editor open so the name can be retried.
      return;
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <span>{folderName ?? "Folder"}</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              aria-label="Workflow name"
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
              onFocus={(event) => event.target.select()}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleRename();
                if (event.key === "Escape") setIsEditingName(false);
              }}
              disabled={isRenaming}
              className="h-8 w-36 rounded border border-gray-300 px-2 text-sm font-medium text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:w-48"
            />
            <button
              type="button"
              onClick={() => void handleRename()}
              disabled={isSaving || isScheduling || isRenaming}
              aria-label="Save workflow name"
              title="Save name"
              className="rounded p-1 text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              {isRenaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingName(false)}
              disabled={isRenaming}
              aria-label="Cancel workflow rename"
              title="Cancel"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-900">
              {workflowName ?? "Untitled"}
            </span>
            {onRename && (
              <button
                type="button"
                onClick={() => {
                  setEditedName(workflowName ?? "");
                  setIsEditingName(true);
                }}
                disabled={!workflowName || isSaving || isScheduling}
                aria-label="Rename workflow"
                title="Rename workflow"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Saved
          </span>
        )}

        {showResults && validationErrors.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{validationErrors.length} error(s)</span>
          </div>
        )}
        {showResults && validationErrors.length === 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Valid</span>
          </div>
        )}

        {workflowStatus === "published" && (
          <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            Published
          </span>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        <div className="mx-1 h-6 w-px bg-gray-200" />

        <button
          onClick={onZoomOut}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomIn}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={onFitView}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          title="Fit view"
        >
          <Maximize className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-gray-200" />

        <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-md border border-gray-200 bg-white px-8 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50">
              Schedule
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-68.5 p-3.5">
            <div className="space-y-3">
              <ScheduleField label="Schedule Type">
                <select
                  value={scheduleType}
                  onChange={(event) => setScheduleType(event.target.value)}
                  className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
                >
                  {scheduleTypes?.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </ScheduleField>

              {scheduleType === "run_once" && (
                <>
                  <ScheduleField label="Date">
                    <input
                      type="date"
                      value={runDate}
                      onChange={(event) => setRunDate(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Time">
                    <input
                      type="time"
                      value={runTime}
                      onChange={(event) => setRunTime(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                </>
              )}

              {scheduleType === "every_x_minutes" && (
                <ScheduleField label="Every N Minutes">
                  <input
                    type="number"
                    min="1"
                    value={everyNMinutes}
                    onChange={(event) => setEveryNMinutes(event.target.value)}
                    className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                  />
                </ScheduleField>
              )}

              {scheduleType === "hourly" && (
                <>
                  <ScheduleField label="Every N Hours">
                    <input
                      type="number"
                      min="1"
                      value={everyNHours}
                      onChange={(event) => setEveryNHours(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Minute">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={triggerMinute}
                      onChange={(event) => setTriggerMinute(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                </>
              )}

              {scheduleType === "daily" && (
                <>
                  <ScheduleField label="Every N Days">
                    <input
                      type="number"
                      min="1"
                      value={everyNDays}
                      onChange={(event) => setEveryNDays(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Trigger at Hour">
                    <select
                      value={triggerHour}
                      onChange={(event) => setTriggerHour(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
                    >
                      {Array.from({ length: 24 }, (_, hour) => {
                        const suffix = hour < 12 ? "am" : "pm";
                        const label = `${hour % 12 || 12}${suffix}`;
                        return <option key={label}>{label}</option>;
                      })}
                    </select>
                  </ScheduleField>
                  <ScheduleField label="Trigger at Minute">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={triggerMinute}
                      onChange={(event) => setTriggerMinute(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                </>
              )}

              {scheduleType === "weekly" && (
                <>
                  <ScheduleField label="Every N Weeks">
                    <input
                      type="number"
                      min="1"
                      value={everyNWeeks}
                      onChange={(event) => setEveryNWeeks(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Days of Week">
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDayOfWeek(day)}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs capitalize",
                            daysOfWeek.includes(day)
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </ScheduleField>
                  <ScheduleField label="Trigger at Hour">
                    <select
                      value={triggerHour}
                      onChange={(event) => setTriggerHour(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
                    >
                      {Array.from({ length: 24 }, (_, hour) => {
                        const suffix = hour < 12 ? "am" : "pm";
                        const label = `${hour % 12 || 12}${suffix}`;
                        return <option key={label}>{label}</option>;
                      })}
                    </select>
                  </ScheduleField>
                  <ScheduleField label="Trigger at Minute">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={triggerMinute}
                      onChange={(event) => setTriggerMinute(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                </>
              )}

              {scheduleType === "monthly" && (
                <>
                  <ScheduleField label="Every N Months">
                    <input
                      type="number"
                      min="1"
                      value={everyNMonths}
                      onChange={(event) => setEveryNMonths(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Day of Month">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(event) => setDayOfMonth(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Trigger at Hour">
                    <select
                      value={triggerHour}
                      onChange={(event) => setTriggerHour(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
                    >
                      {Array.from({ length: 24 }, (_, hour) => {
                        const suffix = hour < 12 ? "am" : "pm";
                        const label = `${hour % 12 || 12}${suffix}`;
                        return <option key={label}>{label}</option>;
                      })}
                    </select>
                  </ScheduleField>
                  <ScheduleField label="Trigger at Minute">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={triggerMinute}
                      onChange={(event) => setTriggerMinute(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                </>
              )}

              {scheduleType === "yearly" && (
                <>
                  <ScheduleField label="Month">
                    <select
                      value={month}
                      onChange={(event) => setMonth(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i, 1).toLocaleString("default", {
                            month: "long"
                          })}
                        </option>
                      ))}
                    </select>
                  </ScheduleField>
                  <ScheduleField label="Day">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfYear}
                      onChange={(event) => setDayOfYear(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                  <ScheduleField label="Trigger at Hour">
                    <select
                      value={triggerHour}
                      onChange={(event) => setTriggerHour(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
                    >
                      {Array.from({ length: 24 }, (_, hour) => {
                        const suffix = hour < 12 ? "am" : "pm";
                        const label = `${hour % 12 || 12}${suffix}`;
                        return <option key={label}>{label}</option>;
                      })}
                    </select>
                  </ScheduleField>
                  <ScheduleField label="Trigger at Minute">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={triggerMinute}
                      onChange={(event) => setTriggerMinute(event.target.value)}
                      className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                    />
                  </ScheduleField>
                </>
              )}

              {scheduleType === "custom_cron" && (
                <ScheduleField label="Cron Expression">
                  <input
                    type="text"
                    placeholder="1 19 * * MON-FRI"
                    value={cronExpression}
                    onChange={(event) => setCronExpression(event.target.value)}
                    className="h-7 w-full rounded-md border border-gray-200 px-2 text-sm outline-none focus:border-gray-400"
                  />
                </ScheduleField>
              )}
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={() => setScheduleOpen(false)}
                  className="flex-1 rounded-md bg-gray-100 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetSchedule}
                  disabled={isScheduling}
                  className="flex-1 rounded-md bg-gray-900 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isScheduling ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Set Schedule"
                  )}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
        </button>
        {/* <button
          onClick={handlePublish}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white",
            workflowStatus === "published"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-primary-600 hover:bg-primary-700"
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Publish
        </button> */}
      </div>
    </div>
  );
}

function ScheduleField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-gray-900">{label}</span>
      {children}
    </label>
  );
}
