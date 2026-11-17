"use client";

import type { ReactNode } from "react";
import {
  Loader2,
  MessageSquareText,
  Pencil,
  Share2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { scheduleLabel, type ScheduledTask } from "./scheduled-data";
import {
  TaskIcon,
  TaskStatusBadge,
  TaskTypeBadge,
  type TaskIconName
} from "./scheduled-ui";

function DetailCard({
  title,
  icon,
  children
}: {
  title: string;
  icon: TaskIconName;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-5 rounded-xl border border-gray-200 p-5">
      <h3 className="flex items-center gap-3 text-base font-semibold text-gray-900">
        <span className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-primary-500">
          <TaskIcon name={icon} />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
function Details({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[80px_minmax(0,1fr)] gap-2 text-sm"
        >
          <dt className="text-gray-500">{item.label}</dt>
          <dd className="min-w-0 break-words text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ScheduledTaskDetail({
  task,
  projectName,
  skillName,
  moduleNames,
  onBack,
  onEdit,
  onShare,
  onOpenChat,
  onDelete,
  onToggleStatus,
  statusUpdating
}: {
  task: ScheduledTask;
  projectName: string;
  skillName: string;
  moduleNames: string[];
  onBack: () => void;
  onEdit: () => void;
  onShare: () => void;
  onOpenChat: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  statusUpdating: boolean;
}) {
  const endLabel =
    task.ends === "on_date"
      ? task.endDate || "Not provided"
      : task.ends === "after_runs"
        ? task.apiTask.schedule?.ends?.after_runs
          ? `After ${task.runLimit} runs`
          : "Not provided"
        : task.ends === "never"
          ? "Never"
          : task.ends;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to scheduled tasks"
            onClick={onBack}
            className="mt-0.5 size-6"
          >
            <TaskIcon name="back" size={18} />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-950">
              {task.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <TaskTypeBadge type={task.type} />
              <TaskStatusBadge status={task.status} />
              <span className="text-xs text-gray-500">
                Next run: {task.nextRun}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Task actions">
                <TaskIcon name="more" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit} disabled={statusUpdating}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onShare}>
                <Share2 className="size-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onOpenChat}>
                <MessageSquareText className="size-4" />
                Start chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onDelete}
                disabled={statusUpdating}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="A run-now endpoint has not been supplied."
          >
            <TaskIcon name="run" />
            Run now
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              statusUpdating || !["active", "paused"].includes(task.status)
            }
            aria-busy={statusUpdating}
            onClick={onToggleStatus}
            title={
              ["active", "paused"].includes(task.status)
                ? undefined
                : "Set the task to Active in the editor before pausing it."
            }
          >
            {statusUpdating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <TaskIcon name={task.status === "paused" ? "play" : "pause"} />
            )}
            {statusUpdating
              ? "Saving..."
              : task.status === "paused"
                ? "Resume"
                : "Pause"}
          </Button>
          <Button size="sm" onClick={onEdit} disabled={statusUpdating}>
            <TaskIcon name="edit" />
            Edit
          </Button>
        </div>
      </header>
      <section className="space-y-6 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-3 text-base font-semibold text-gray-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-primary-500">
              <TaskIcon name="instructions" />
            </span>
            Instructions
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            disabled={statusUpdating}
          >
            Edit
          </Button>
        </div>
        <p className="text-base leading-6 text-gray-600">{task.instructions}</p>
      </section>
      <div className="grid gap-3 xl:grid-cols-3">
        <DetailCard title="Schedule" icon="schedule">
          {task.type === "scheduled" ? (
            <Details
              items={[
                { label: "Repeats", value: scheduleLabel(task) },
                ...(task.scheduleDate
                  ? [{ label: "Date", value: task.scheduleDate }]
                  : []),
                ...(task.daysOfWeek.length
                  ? [{ label: "Days", value: task.daysOfWeek.join(", ") }]
                  : []),
                ...(task.dayOfMonth !== undefined
                  ? [{ label: "Day of month", value: String(task.dayOfMonth) }]
                  : []),
                ...(task.month !== undefined
                  ? [{ label: "Month", value: String(task.month) }]
                  : []),
                { label: "Next run", value: task.nextRun },
                { label: "Ends", value: endLabel },
                { label: "Time zone", value: task.timezone || "Not provided" },
                { label: "Created", value: task.created }
              ]}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Not applicable to this task type.
            </p>
          )}
        </DetailCard>
        <DetailCard title="Context" icon="context">
          <Details
            items={[
              { label: "Skill", value: skillName },
              { label: "Project", value: projectName },
              {
                label: "Data",
                value: moduleNames.length ? (
                  <div className="flex flex-wrap gap-1">
                    {moduleNames.map((module, index) => (
                      <span
                        key={task.moduleIds[index]}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                ) : (
                  "None selected"
                )
              },
              {
                label: "Chat",
                value: (
                  <button
                    type="button"
                    onClick={onOpenChat}
                    className="text-left text-primary-700 hover:underline"
                  >
                    Start a chat about this task
                  </button>
                )
              }
            ]}
          />
        </DetailCard>
        <DetailCard title="Delivery" icon="delivery">
          <Details
            items={[
              {
                label: "Notify",
                value:
                  [
                    task.inApp && "In-app",
                    task.push && "Push",
                    task.email && "Email"
                  ]
                    .filter(Boolean)
                    .join(" | ") || "Off"
              },
              ...(task.email && task.emailAddress
                ? [{ label: "Email", value: task.emailAddress }]
                : []),
              {
                label: "Approval",
                value: task.approval ? "Ask before acting" : "Not required"
              },
              {
                label: "Share link",
                value: (
                  <button
                    type="button"
                    onClick={onShare}
                    className="text-primary-700 hover:underline"
                  >
                    Copy link
                  </button>
                )
              }
            ]}
          />
        </DetailCard>
      </div>
      <section className="space-y-3 rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900">Run history</h3>
        <p className="text-sm text-gray-500">
          Run history and manual run controls are not included in the supplied
          task API.
        </p>
      </section>
    </div>
  );
}
