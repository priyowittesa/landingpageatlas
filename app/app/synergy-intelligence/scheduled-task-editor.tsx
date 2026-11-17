"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Loader2 } from "lucide-react";
import type { KnowledgeFolder } from "@/app/app/ai-studio/atlas-knowledge-source/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EMPTY_TASK,
  REPEAT_OPTIONS,
  TASK_TYPES,
  TASK_STATUS_OPTIONS,
  scheduleLabel,
  validateTaskDraft,
  type TaskDraft,
  type TaskModuleOption,
  type TaskType
} from "./scheduled-data";
import { TaskIcon, type TaskIconName } from "./scheduled-ui";

const FALLBACK_TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "America/Chicago",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Jakarta",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Pacific/Auckland"
];
const SUPPORTED_TIMEZONES = [
  ...new Set([
    ...FALLBACK_TIMEZONES,
    ...(Intl.supportedValuesOf?.("timeZone") ?? [])
  ])
].sort();
const subscribeTimezones = () => () => {};
const getTimezones = () => SUPPORTED_TIMEZONES;
const getServerTimezones = () => FALLBACK_TIMEZONES;

function RequiredMark() {
  return (
    <span aria-hidden="true" title="Required" className="ml-0.5 text-red-500">
      *
    </span>
  );
}
function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} role="alert" className="text-xs text-red-600">
      {error}
    </p>
  ) : null;
}
function TaskSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  required = false,
  error,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-950">
        {label}
        {required && <RequiredMark />}
      </label>
      <Select
        key={options.map((option) => option.value).join("|")}
        value={value}
        required={required}
        disabled={disabled}
        onValueChange={onChange}
      >
        <SelectTrigger
          id={id}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-10 rounded-lg px-3 text-gray-950"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={errorId} error={error} />
    </div>
  );
}
function Field({
  label,
  required = false,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: (id: string, errorId?: string) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-950">
        {label}
        {required && <RequiredMark />}
      </label>
      {children(id, error ? errorId : undefined)}
      <FieldError id={errorId} error={error} />
    </div>
  );
}

export function ScheduledTaskEditor({
  initialDraft,
  editing,
  projects,
  modules,
  skills,
  modulesLoading,
  skillsLoading,
  modulesError,
  skillsError,
  onRetryModules,
  onRetrySkills,
  saving,
  error,
  onClose,
  onSave
}: {
  initialDraft: TaskDraft;
  editing: boolean;
  projects: KnowledgeFolder[];
  modules: TaskModuleOption[];
  skills: { id: string; title: string }[];
  modulesLoading: boolean;
  skillsLoading: boolean;
  modulesError: boolean;
  skillsError: boolean;
  onRetryModules: () => void;
  onRetrySkills: () => void;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const timezones = useSyncExternalStore(
    subscribeTimezones,
    getTimezones,
    getServerTimezones
  );
  const [submitted, setSubmitted] = useState(false);
  const [daysOfWeekText, setDaysOfWeekText] = useState(
    initialDraft.daysOfWeek.join(", ")
  );
  const formId = useId();
  const errors = submitted ? validateTaskDraft(draft, modules) : {};
  const update = (patch: Partial<TaskDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const selectType = (type: TaskType) =>
    update({
      type,
      ...(type === "scheduled"
        ? {
            repeats: draft.repeats || EMPTY_TASK.repeats,
            time: draft.time || EMPTY_TASK.time,
            timezone: draft.timezone || EMPTY_TASK.timezone
          }
        : {})
    });
  const repeatOptions = [
    ...REPEAT_OPTIONS,
    ...(draft.repeats &&
    !REPEAT_OPTIONS.some((option) => option.value === draft.repeats)
      ? [{ value: draft.repeats, label: draft.repeats }]
      : [])
  ];
  const timezoneOptions = [
    ...new Set([...timezones, ...(draft.timezone ? [draft.timezone] : [])])
  ]
    .sort()
    .map((timezone) => ({ value: timezone, label: timezone }));
  const skillOptions = [
    { value: "none", label: "None" },
    ...skills.map((skill) => ({ value: skill.id, label: skill.title })),
    ...(draft.skillId && !skills.some((skill) => skill.id === draft.skillId)
      ? [
          {
            value: draft.skillId,
            label: `Unavailable skill (${draft.skillId})`
          }
        ]
      : [])
  ];
  const projectOptions = [
    ...projects.map((project) => ({ value: project.id, label: project.title })),
    ...(draft.projectId &&
    !projects.some((project) => project.id === draft.projectId)
      ? [
          {
            value: draft.projectId,
            label: `Unavailable project (${draft.projectId})`
          }
        ]
      : [])
  ];
  const moduleOptions = [
    ...modules.filter(
      (module) =>
        module.id.trim() &&
        (module.status.toLowerCase() === "active" ||
          draft.moduleIds.includes(module.id))
    ),
    ...draft.moduleIds
      .filter((id) => !modules.some((module) => module.id === id))
      .map((id) => ({
        id,
        name: `Unavailable module (${id || "empty ID"})`,
        status: "unknown"
      }))
  ];
  const endOptions = [
    { value: "never", label: "Never" },
    { value: "on_date", label: "On a date" },
    { value: "after_runs", label: "After a number of runs" }
  ];
  const delivery: {
    key: "inApp" | "push" | "email" | "approval";
    title: string;
    description: string;
    icon: TaskIconName;
  }[] = [
    {
      key: "inApp",
      title: "In-app",
      description: "Results post in the task’s chat and the bell",
      icon: "in-app"
    },
    {
      key: "push",
      title: "Push",
      description: "Desktop and mobile notifications",
      icon: "push"
    },
    {
      key: "email",
      title: "Email",
      description: "Send results to the email address below",
      icon: "mail"
    },
    {
      key: "approval",
      title: "Ask before acting",
      description:
        "Hold the task for approval before it sends a message or changes data",
      icon: "shield"
    }
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/10" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => saving && event.preventDefault()}
          onInteractOutside={(event) => saving && event.preventDefault()}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[600px] flex-col border-l border-gray-200 bg-white shadow-[-4px_0_10px_rgba(0,0,0,0.08)] outline-none"
        >
          <form
            noValidate
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              if (saving) return;
              setSubmitted(true);
              if (Object.keys(validateTaskDraft(draft, modules)).length === 0)
                onSave(draft);
              else {
                const form = event.currentTarget;
                requestAnimationFrame(() =>
                  form
                    .querySelector<HTMLElement>(
                      '[aria-invalid="true"], [data-invalid="true"]'
                    )
                    ?.focus()
                );
              }
            }}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 px-5 py-4">
              <DialogTitle className="text-xl font-medium text-gray-900">
                {editing ? "Edit Task" : "New Task"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Save this task to Synergy Intelligence. Fields marked with an
                asterisk are required.
              </DialogDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={saving}
                aria-label="Close task editor"
                onClick={onClose}
                className="size-7 rounded-full bg-gray-100"
              >
                <TaskIcon name="close" />
              </Button>
            </header>
            <fieldset
              disabled={saving}
              className="workflow-chat-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6"
            >
              <p className="text-xs text-gray-500">
                <span aria-hidden="true" className="text-red-500">
                  *
                </span>{" "}
                Required field
              </p>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <Field label="Task name" required error={errors.title}>
                {(id, errorId) => (
                  <Input
                    id={id}
                    autoFocus
                    required
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errorId}
                    maxLength={120}
                    value={draft.title}
                    onChange={(event) => update({ title: event.target.value })}
                    placeholder="e.g. Daily synergy brief"
                    className="rounded-lg border-gray-200"
                  />
                )}
              </Field>
              <fieldset>
                <legend
                  id={`${formId}-type-label`}
                  className="mb-1.5 text-sm font-medium text-gray-950"
                >
                  Type
                  <RequiredMark />
                </legend>
                <div
                  role="group"
                  aria-labelledby={`${formId}-type-label`}
                  data-invalid={Boolean(errors.type)}
                  aria-describedby={
                    errors.type ? `${formId}-type-error` : undefined
                  }
                  tabIndex={-1}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {(Object.keys(TASK_TYPES) as TaskType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={draft.type === type}
                      onClick={() => selectType(type)}
                      className={cn(
                        "flex gap-2 rounded-md border p-2 text-left",
                        draft.type === type
                          ? "border-primary-700 bg-purple-50 text-primary-700"
                          : "border-gray-200 text-gray-950"
                      )}
                    >
                      <span className="mt-1">
                        <TaskIcon
                          name={TASK_TYPES[type].icon}
                          className={
                            draft.type === type
                              ? "text-primary-700"
                              : "text-gray-500"
                          }
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium sm:text-base">
                          {TASK_TYPES[type].label}
                        </span>
                        <span className="mt-1 block text-xs font-normal leading-4 text-gray-500">
                          {TASK_TYPES[type].description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <FieldError id={`${formId}-type-error`} error={errors.type} />
              </fieldset>
              <TaskSelect
                label="Status"
                required
                error={errors.status}
                value={draft.status}
                options={TASK_STATUS_OPTIONS}
                onChange={(status) => update({ status })}
              />
              <Field label="Instructions" required error={errors.instructions}>
                {(id, errorId) => (
                  <>
                    <Textarea
                      id={id}
                      required
                      aria-invalid={Boolean(errors.instructions)}
                      aria-describedby={errorId}
                      value={draft.instructions}
                      onChange={(event) =>
                        update({ instructions: event.target.value })
                      }
                      placeholder="What should Synergy Intelligence do each time this runs?"
                      className="min-h-24 rounded-lg border-gray-200 text-sm"
                    />
                    <p className="text-xs leading-4 text-gray-500">
                      Write it the way you would ask in chat. The task uses the
                      skill and data you pick below.
                    </p>
                  </>
                )}
              </Field>
              {draft.type === "scheduled" && (
                <fieldset className="space-y-4">
                  <legend className="mb-3 text-sm font-medium text-gray-500">
                    SCHEDULE
                    <RequiredMark />
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <TaskSelect
                      label="Repeats"
                      required
                      error={errors.repeats}
                      value={draft.repeats}
                      options={repeatOptions}
                      onChange={(repeats) => update({ repeats })}
                    />
                    <Field label="Time" required error={errors.time}>
                      {(id, errorId) => (
                        <Input
                          id={id}
                          type="time"
                          step={60}
                          required
                          aria-invalid={Boolean(errors.time)}
                          aria-describedby={errorId}
                          value={draft.time}
                          onChange={(event) =>
                            update({ time: event.target.value })
                          }
                          className="rounded-lg border-gray-200"
                        />
                      )}
                    </Field>
                  </div>
                  <TaskSelect
                    label="Time zone"
                    required
                    error={errors.timezone}
                    value={draft.timezone}
                    options={timezoneOptions}
                    placeholder="Select a time zone"
                    onChange={(timezone) => update({ timezone })}
                  />
                  <div className="flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                    <TaskIcon name="globe" size={12} />
                    {draft.timezone || "Time zone not provided"}
                  </div>
                  <fieldset className="space-y-3">
                    <legend className="mb-2 text-sm font-medium text-gray-950">
                      Calendar settings
                    </legend>
                    <p className="text-xs text-gray-500">
                      Optional. Leave unused calendar values blank.
                    </p>
                    <Field label="Date" error={errors.scheduleDate}>
                      {(id, errorId) => (
                        <Input
                          id={id}
                          type="date"
                          value={draft.scheduleDate}
                          aria-invalid={Boolean(errors.scheduleDate)}
                          aria-describedby={errorId}
                          onChange={(event) =>
                            update({ scheduleDate: event.target.value })
                          }
                        />
                      )}
                    </Field>
                    <Field label="Days of week" error={errors.daysOfWeek}>
                      {(id, errorId) => (
                        <>
                          <Input
                            id={id}
                            value={daysOfWeekText}
                            aria-invalid={Boolean(errors.daysOfWeek)}
                            aria-describedby={errorId}
                            placeholder="Comma-separated day values"
                            onChange={(event) => {
                              setDaysOfWeekText(event.target.value);
                              update({
                                daysOfWeek: event.target.value
                                  .split(",")
                                  .map((day) => day.trim())
                                  .filter(Boolean)
                              });
                            }}
                          />
                          <p className="text-xs text-gray-500">
                            Use the day values expected by the API;
                            capitalization is preserved.
                          </p>
                        </>
                      )}
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Day of month" error={errors.dayOfMonth}>
                        {(id, errorId) => (
                          <Input
                            id={id}
                            type="number"
                            min={0}
                            step={1}
                            value={draft.dayOfMonth ?? ""}
                            aria-invalid={Boolean(errors.dayOfMonth)}
                            aria-describedby={errorId}
                            onChange={(event) =>
                              update({
                                dayOfMonth:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value)
                              })
                            }
                          />
                        )}
                      </Field>
                      <Field label="Month" error={errors.month}>
                        {(id, errorId) => (
                          <Input
                            id={id}
                            type="number"
                            min={0}
                            step={1}
                            value={draft.month ?? ""}
                            aria-invalid={Boolean(errors.month)}
                            aria-describedby={errorId}
                            onChange={(event) =>
                              update({
                                month:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value)
                              })
                            }
                          />
                        )}
                      </Field>
                    </div>
                  </fieldset>
                  <fieldset className="space-y-2">
                    <legend
                      id={`${formId}-ends-label`}
                      className="mb-2 text-sm font-medium text-gray-950"
                    >
                      Ends
                      <RequiredMark />
                    </legend>
                    <div
                      role="group"
                      aria-labelledby={`${formId}-ends-label`}
                      data-invalid={Boolean(errors.ends)}
                      aria-describedby={
                        errors.ends ? `${formId}-ends-error` : undefined
                      }
                      tabIndex={-1}
                      className="flex flex-wrap gap-1.5"
                    >
                      {endOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={draft.ends === option.value}
                          onClick={() => update({ ends: option.value })}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-normal",
                            draft.ends === option.value
                              ? "border-primary-500 bg-purple-50 text-primary-600"
                              : "border-gray-200 text-gray-500"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <FieldError
                      id={`${formId}-ends-error`}
                      error={errors.ends}
                    />
                    {draft.ends === "on_date" && (
                      <Field label="End date" required error={errors.endDate}>
                        {(id, errorId) => (
                          <Input
                            id={id}
                            type="date"
                            required
                            aria-invalid={Boolean(errors.endDate)}
                            aria-describedby={errorId}
                            value={draft.endDate}
                            onChange={(event) =>
                              update({ endDate: event.target.value })
                            }
                          />
                        )}
                      </Field>
                    )}
                    {draft.ends === "after_runs" && (
                      <Field
                        label="Number of runs"
                        required
                        error={errors.runLimit}
                      >
                        {(id, errorId) => (
                          <Input
                            id={id}
                            type="number"
                            required
                            min={1}
                            step={1}
                            aria-invalid={Boolean(errors.runLimit)}
                            aria-describedby={errorId}
                            value={draft.runLimit}
                            onChange={(event) =>
                              update({ runLimit: Number(event.target.value) })
                            }
                          />
                        )}
                      </Field>
                    )}
                  </fieldset>
                </fieldset>
              )}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">
                  CONTEXT
                  <RequiredMark />
                </h3>
                <p className="text-xs text-gray-500">
                  Skill is optional. Select a project and at least one module.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <TaskSelect
                    label="Skill"
                    value={draft.skillId || "none"}
                    options={skillOptions}
                    disabled={skillsLoading}
                    onChange={(skillId) =>
                      update({ skillId: skillId === "none" ? "" : skillId })
                    }
                  />
                  <TaskSelect
                    label="Project"
                    required
                    error={errors.projectId}
                    value={draft.projectId}
                    options={projectOptions}
                    placeholder="Select a project"
                    onChange={(projectId) => update({ projectId })}
                  />
                </div>
                {skillsError && (
                  <p role="alert" className="text-xs text-red-600">
                    Unable to load skills. Existing selection is preserved.{" "}
                    <button
                      type="button"
                      onClick={onRetrySkills}
                      className="text-xs underline"
                    >
                      Retry
                    </button>
                  </p>
                )}
                <fieldset>
                  <legend
                    id={`${formId}-modules-label`}
                    className="mb-2 text-sm font-medium text-gray-950"
                  >
                    Data it can use
                    <RequiredMark />
                  </legend>
                  <p className="mb-2 text-xs text-gray-500">
                    Select at least one module. Only active modules can be
                    selected.
                  </p>
                  {modulesLoading && (
                    <p className="text-xs text-gray-500">Loading modules...</p>
                  )}
                  {modulesError && (
                    <p role="alert" className="mb-2 text-xs text-red-600">
                      Unable to load modules. Existing selections are preserved.{" "}
                      <button
                        type="button"
                        onClick={onRetryModules}
                        className="text-xs underline"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                  <div
                    role="group"
                    aria-labelledby={`${formId}-modules-label`}
                    data-invalid={Boolean(errors.moduleIds)}
                    aria-describedby={
                      errors.moduleIds ? `${formId}-modules-error` : undefined
                    }
                    tabIndex={-1}
                    className="flex flex-wrap gap-1.5"
                  >
                    {moduleOptions.map((module) => (
                      <button
                        key={module.id}
                        type="button"
                        aria-pressed={draft.moduleIds.includes(module.id)}
                        disabled={modulesLoading}
                        onClick={() =>
                          update({
                            moduleIds: draft.moduleIds.includes(module.id)
                              ? draft.moduleIds.filter((id) => id !== module.id)
                              : [...draft.moduleIds, module.id]
                          })
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-normal",
                          draft.moduleIds.includes(module.id)
                            ? "border-primary-300 bg-purple-50 text-primary-700"
                            : "border-gray-200 text-gray-500"
                        )}
                      >
                        {module.name}
                        {module.status.toLowerCase() !== "active" &&
                          module.status !== "unknown" &&
                          " (inactive)"}
                      </button>
                    ))}
                  </div>
                  <FieldError
                    id={`${formId}-modules-error`}
                    error={errors.moduleIds}
                  />
                  {!modulesLoading &&
                    !modulesError &&
                    moduleOptions.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No active modules available.
                      </p>
                    )}
                </fieldset>
              </section>
              <section>
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  DELIVERY
                  <RequiredMark />
                </h3>
                <p
                  id={`${formId}-delivery-help`}
                  className="mb-2 text-xs text-gray-500"
                >
                  Each delivery setting is required. Both on and off are valid
                  values.
                </p>
                {delivery.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 border-b border-gray-200 py-3"
                  >
                    <TaskIcon
                      name={item.icon}
                      size={22}
                      className="text-gray-500"
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`${formId}-${item.key}`}
                        className="text-base font-medium text-gray-950"
                      >
                        {item.title}
                        <RequiredMark />
                      </label>
                      <p className="mt-1 text-xs leading-4 text-gray-500">
                        {item.description}
                      </p>
                      <FieldError
                        id={`${formId}-${item.key}-error`}
                        error={errors[item.key]}
                      />
                    </div>
                    <Switch
                      id={`${formId}-${item.key}`}
                      checked={draft[item.key]}
                      aria-invalid={Boolean(errors[item.key])}
                      aria-describedby={
                        errors[item.key]
                          ? `${formId}-${item.key}-error`
                          : `${formId}-delivery-help`
                      }
                      onCheckedChange={(checked) =>
                        update({ [item.key]: checked })
                      }
                      className="data-[state=checked]:bg-primary-700"
                    />
                  </div>
                ))}
                <div className="mt-4">
                  <Field
                    label="Email address"
                    required={draft.email}
                    error={errors.emailAddress}
                  >
                    {(id, errorId) => (
                      <Input
                        id={id}
                        type="email"
                        required={draft.email}
                        aria-invalid={Boolean(errors.emailAddress)}
                        aria-describedby={errorId}
                        maxLength={254}
                        value={draft.emailAddress}
                        onChange={(event) =>
                          update({ emailAddress: event.target.value })
                        }
                        placeholder="you@company.com"
                        className="rounded-lg border-gray-200"
                      />
                    )}
                  </Field>
                </div>
              </section>
            </fieldset>
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
              <p className="mr-auto text-xs text-gray-500">
                {scheduleLabel(draft)}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onClose}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-lg">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Create task"}
              </Button>
            </footer>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
