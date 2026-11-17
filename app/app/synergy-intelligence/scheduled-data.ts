export type TaskType = "scheduled" | "monitor" | "weekly" | "event_trigger";
export type TaskStatus = "active" | "paused" | "completed" | "draft";
export type TaskSchedule = {
  date?: string;
  day_of_month?: number;
  days_of_week?: string[];
  month?: number;
  repeat?: string;
  time?: string;
  timezone?: string;
  ends?: {
    mode: string;
    after_runs?: number;
    on_date?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
export type TaskContext = {
  project_id?: string;
  skill_id?: string;
  [key: string]: unknown;
};
export type TaskDelivery = {
  ask_before_acting: boolean;
  email: { address?: string; enabled: boolean;[key: string]: unknown };
  in_app: boolean;
  push: boolean;
  [key: string]: unknown;
};
export type WorkflowChatTaskPayload = {
  context: TaskContext;
  delivery: TaskDelivery;
  instructions: string;
  module_ids?: string[];
  name: string;
  schedule?: TaskSchedule;
  status: TaskStatus;
  type: TaskType;
};
export type WorkflowChatTask = WorkflowChatTaskPayload & {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  next_run_at?: string;
};
export type TaskDraft = {
  title: string;
  type: string;
  status: string;
  instructions: string;
  repeats: string;
  time: string;
  timezone: string;
  scheduleDate: string;
  dayOfMonth?: number;
  daysOfWeek: string[];
  month?: number;
  ends: string;
  endDate: string;
  runLimit: number;
  skillId: string;
  projectId: string;
  moduleIds: string[];
  emailAddress: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
  approval: boolean;
};
export type ScheduledTask = TaskDraft & {
  id: string;
  created: string;
  nextRun: string;
  apiTask: WorkflowChatTask;
};
export type TaskDraftErrors = Partial<Record<keyof TaskDraft, string>>;
export type TaskModuleOption = { id: string; name: string; status: string };

export const TASK_TYPES = {
  scheduled: {
    label: "Scheduled",
    icon: "clock",
    description: "Runs at a set time, once or on repeat",
    badge: "bg-purple-50 text-purple-700"
  },
  monitor: {
    label: "Monitor",
    icon: "eye",
    description: "Check on repeat, notifies only when something changes",
    badge: "bg-green-50 text-green-600"
  },
  weekly: {
    label: "Weekly",
    icon: "clock",
    description: "Weekly task",
    badge: "bg-purple-50 text-purple-700"
  },
  event_trigger: {
    label: "Event trigger",
    icon: "zap",
    description: "Runs when something happens in a module",
    badge: "bg-blue-50 text-blue-600"
  }
} as const;
export const TASK_STATUSES = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed"
} as const;
export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUSES).map(
  ([value, label]) => ({ value: value as TaskStatus, label })
);
export const REPEAT_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "hourly", label: "Hourly" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "once", label: "Once" }
];
export const EMPTY_TASK: TaskDraft = {
  title: "",
  type: "scheduled",
  status: "draft",
  instructions: "",
  repeats: "daily",
  time: "08:00",
  timezone: "Asia/Jakarta",
  scheduleDate: "",
  dayOfMonth: undefined,
  daysOfWeek: [],
  month: undefined,
  ends: "never",
  endDate: "",
  runLimit: 10,
  skillId: "",
  projectId: "",
  moduleIds: [],
  emailAddress: "",
  inApp: true,
  push: true,
  email: false,
  approval: true
};

function validTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function validateTaskDraft(
  draft: TaskDraft,
  modules: TaskModuleOption[] = []
): TaskDraftErrors {
  const errors: TaskDraftErrors = {};
  if (!draft.title.trim()) errors.title = "Task name is required.";
  if (!draft.instructions.trim())
    errors.instructions = "Instructions are required.";
  if (!Object.hasOwn(TASK_TYPES, draft.type))
    errors.type = "Select a valid task type.";
  if (!Object.hasOwn(TASK_STATUSES, draft.status))
    errors.status = "Select a valid task status.";
  if (!draft.projectId.trim()) errors.projectId = "Select a project.";
  if (!draft.moduleIds.length)
    errors.moduleIds = "Select at least one module.";
  else if (draft.moduleIds.some((id) => !id.trim()))
    errors.moduleIds = "Module IDs cannot be empty.";
  else if (
    draft.moduleIds.some((id) =>
      modules.some(
        (module) => module.id === id && module.status.toLowerCase() !== "active"
      )
    )
  )
    errors.moduleIds = "Remove inactive modules before saving.";
  for (const key of ["inApp", "push", "email", "approval"] as const) {
    if (typeof draft[key] !== "boolean")
      errors[key] = "Choose an on or off value for this delivery setting.";
  }
  if (draft.email && !draft.emailAddress.trim())
    errors.emailAddress =
      "Email address is required when email delivery is enabled.";
  if (draft.type === "scheduled") {
    if (!draft.repeats.trim()) errors.repeats = "Repeat frequency is required.";
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time.trim()))
      errors.time = "Enter a time in HH:mm format.";
    if (!draft.timezone.trim()) errors.timezone = "Time zone is required.";
    else if (!validTimeZone(draft.timezone.trim()))
      errors.timezone = "Enter a valid IANA time zone, such as Asia/Jakarta.";
    if (draft.scheduleDate.trim() && !validDate(draft.scheduleDate.trim()))
      errors.scheduleDate = "Enter a valid date in YYYY-MM-DD format.";
    if (
      draft.dayOfMonth !== undefined &&
      (!Number.isInteger(draft.dayOfMonth) || draft.dayOfMonth < 0)
    )
      errors.dayOfMonth = "Day of month must be a nonnegative integer.";
    if (
      draft.month !== undefined &&
      (!Number.isInteger(draft.month) || draft.month < 0)
    )
      errors.month = "Month must be a nonnegative integer.";
    if (draft.daysOfWeek.some((day) => !day.trim()))
      errors.daysOfWeek = "Day values cannot be empty.";
    if (!["never", "on_date", "after_runs"].includes(draft.ends))
      errors.ends = "Select a valid end mode.";
    if (draft.ends === "on_date" && !validDate(draft.endDate.trim()))
      errors.endDate = "Enter a valid end date in YYYY-MM-DD format.";
    if (
      draft.ends === "after_runs" &&
      (!Number.isInteger(draft.runLimit) || draft.runLimit <= 0)
    )
      errors.runLimit = "Number of runs must be a positive integer.";
  }
  return errors;
}
export function taskTypeInfo(type: string) {
  return (
    TASK_TYPES[type as TaskType] ?? {
      label: type,
      icon: "clock" as const,
      description: "",
      badge: "bg-gray-50 text-gray-600"
    }
  );
}
export function scheduleLabel(task: TaskDraft) {
  if (task.type !== "scheduled") return "Not applicable";
  if (!task.repeats) return "Not provided";
  const repeat =
    REPEAT_OPTIONS.find((option) => option.value === task.repeats)?.label ??
    task.repeats;
  const calendar = [
    task.scheduleDate,
    task.daysOfWeek.join(", "),
    task.dayOfMonth !== undefined ? `day ${task.dayOfMonth}` : "",
    task.month !== undefined ? `month ${task.month}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
  const label =
    task.repeats === "hourly"
      ? "Every hour"
      : `${repeat}${task.time ? ` at ${task.time}` : ""}${task.timezone ? ` ${task.timezone === "Asia/Jakarta" ? "WIB" : task.timezone}` : ""}`;
  return calendar ? `${label} · ${calendar}` : label;
}
export function taskDraftFromApi(task: WorkflowChatTask): TaskDraft {
  return {
    ...EMPTY_TASK,
    title: task.name,
    type: task.type,
    status: task.status ?? "draft",
    instructions: task.instructions,
    repeats: task.schedule?.repeat ?? "",
    time: task.schedule?.time ?? "",
    timezone: task.schedule?.timezone ?? "",
    scheduleDate: task.schedule?.date ?? "",
    dayOfMonth: task.schedule?.day_of_month,
    daysOfWeek: [...(task.schedule?.days_of_week ?? [])],
    month: task.schedule?.month,
    ends: task.schedule?.ends?.mode ?? "never",
    endDate: task.schedule?.ends?.on_date ?? "",
    runLimit: task.schedule?.ends?.after_runs ?? 10,
    skillId: task.context?.skill_id ?? "",
    projectId: task.context?.project_id ?? "",
    moduleIds: task.module_ids ?? [],
    emailAddress: task.delivery?.email?.address ?? "",
    email: task.delivery?.email?.enabled ?? false,
    inApp: task.delivery?.in_app ?? false,
    push: task.delivery?.push ?? false,
    approval: task.delivery?.ask_before_acting ?? false
  };
}
export function savedTaskFromApi(task: WorkflowChatTask): ScheduledTask {
  const draft = taskDraftFromApi(task);
  const date = new Date(task.created_at);
  const created = Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    });
  const nextRunDate = task.next_run_at ? new Date(task.next_run_at) : null;
  return {
    ...draft,
    id: task.id,
    created,
    nextRun:
      nextRunDate && !Number.isNaN(nextRunDate.getTime())
        ? nextRunDate.toLocaleString("en-GB", {
          timeZone: validTimeZone(draft.timezone)
            ? draft.timezone
            : "Asia/Jakarta",
          dateStyle: "medium",
          timeStyle: "short"
        })
        : "Not provided",
    apiTask: task
  };
}
export function taskPayloadFromDraft(
  draft: TaskDraft,
  original?: WorkflowChatTask
): WorkflowChatTaskPayload {
  const errors = validateTaskDraft(draft);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const context = { ...original?.context };
  delete context.project_id;
  delete context.skill_id;
  const ends = { ...(original?.schedule?.ends ?? { mode: "never" }) };
  if (original?.schedule?.ends?.mode !== draft.ends) {
    delete ends.after_runs;
    delete ends.on_date;
  }
  const schedule = { ...original?.schedule };
  for (const key of ["date", "day_of_month", "days_of_week", "month"] as const)
    delete schedule[key];
  const email = { ...original?.delivery?.email, enabled: draft.email };
  delete email.address;
  return {
    context: {
      ...context,
      ...(draft.projectId ? { project_id: draft.projectId } : {}),
      ...(draft.skillId ? { skill_id: draft.skillId } : {})
    },
    delivery: {
      ...original?.delivery,
      ask_before_acting: draft.approval,
      email: {
        ...email,
        ...(draft.emailAddress.trim()
          ? { address: draft.emailAddress.trim() }
          : {})
      },
      in_app: draft.inApp,
      push: draft.push
    },
    instructions: draft.instructions.trim(),
    module_ids: [...draft.moduleIds],
    name: draft.title.trim(),
    status: draft.status as TaskStatus,
    type: draft.type as TaskType,
    ...(draft.type === "scheduled"
      ? {
        schedule: {
          ...schedule,
          repeat: draft.repeats.trim(),
          time: draft.time.trim(),
          timezone: draft.timezone.trim(),
          ...(draft.scheduleDate.trim()
            ? { date: draft.scheduleDate.trim() }
            : {}),
          ...(draft.dayOfMonth !== undefined
            ? { day_of_month: draft.dayOfMonth }
            : {}),
          ...(draft.daysOfWeek.length ||
            original?.schedule?.days_of_week !== undefined
            ? { days_of_week: [...draft.daysOfWeek] }
            : {}),
          ...(draft.month !== undefined ? { month: draft.month } : {}),
          ends: {
            ...ends,
            mode: draft.ends,
            ...(draft.ends === "after_runs"
              ? { after_runs: draft.runLimit }
              : {}),
            ...(draft.ends === "on_date"
              ? { on_date: draft.endDate.trim() }
              : {})
          }
        }
      }
      : {})
  };
}

export const TASK_EXAMPLES = [
  {
    title: "Daily site brief",
    subtitle: "Daily | 07.30",
    icon: "clock",
    draft: {
      title: "Daily site brief",
      instructions:
        "Summarize yesterday across all active sites: daily diaries, inspections, non-conformances and overdue maintenance. End with the top 3 things to focus on today.",
      time: "07:30"
    }
  },
  {
    title: "Watch overdue work orders",
    subtitle: "Monitor | Notifies on change",
    icon: "eye",
    draft: {
      type: "monitor",
      title: "Watch overdue work orders",
      instructions:
        "Check maintenance work orders across all assets. Notify me when a work order becomes overdue by more than 3 days."
    }
  },
  {
    title: "Weekly quality report",
    subtitle: "Weekly report",
    icon: "file",
    draft: {
      type: "weekly",
      title: "Weekly quality report",
      instructions:
        "Create the weekly quality synergy report: inspection pass rate per site, open non-conformances by severity and recent trends.",
      repeats: "weekly"
    }
  },
  {
    title: "When an inspection fails",
    subtitle: "Event | Inspection submitted",
    icon: "zap",
    draft: {
      type: "event_trigger",
      title: "When an inspection fails",
      instructions:
        "When an inspection fails, summarize the findings and draft the next steps for the site supervisor."
    }
  }
] satisfies {
  title: string;
  subtitle: string;
  icon: "clock" | "eye" | "file" | "zap";
  draft: Partial<TaskDraft>;
}[];
