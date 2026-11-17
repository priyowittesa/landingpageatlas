"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  MessageSquareText,
  Pencil,
  Share2,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponseError } from "@/types/api";
import type { KnowledgeFolder } from "@/app/app/ai-studio/atlas-knowledge-source/types";
import { useGetModules } from "@/app/app/workspace-dashboard/explore-module/use-packages";
import { useGetWorkflowSkills } from "@/components/ai-assistant/useWorkflowSkills";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EMPTY_TASK,
  TASK_EXAMPLES,
  TASK_STATUS_OPTIONS,
  validateTaskDraft,
  savedTaskFromApi,
  scheduleLabel,
  taskDraftFromApi,
  taskPayloadFromDraft,
  taskTypeInfo,
  type ScheduledTask,
  type TaskDraft
} from "./scheduled-data";
import {
  useCreateChatTask,
  useDeleteChatTask,
  useGetChatTask,
  useGetChatTasks,
  useUpdateChatTask
} from "./use-chat-tasks";
import { ScheduledTaskEditor } from "./scheduled-task-editor";
import { ScheduledTaskDetail } from "./scheduled-task-detail";
import { TaskIcon, TaskStatusBadge, TaskTypeBadge } from "./scheduled-ui";

const SCHEDULED_PATH = "/app/synergy-intelligence/scheduled";

function errorMessage(error: Error | null) {
  const message = (error as AxiosError<ApiResponseError> | null)?.response?.data
    ?.message;
  return Array.isArray(message)
    ? message.join(" ")
    : message || error?.message || "Please try again.";
}
function TaskRequestState({
  title,
  message,
  loading,
  onRetry,
  onBack
}: {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  return (
    <div
      className="mx-auto max-w-4xl py-16 text-center"
      role={loading ? "status" : "alert"}
    >
      {loading && (
        <Loader2 className="mx-auto mb-3 size-5 animate-spin text-primary-600" />
      )}
      <h2 className="text-xl font-semibold">{title}</h2>
      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
      <div className="mt-5 flex justify-center gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to scheduled tasks
          </Button>
        )}
      </div>
    </div>
  );
}

export function ScheduledTasks({
  projects,
  taskId
}: {
  projects: KnowledgeFolder[];
  taskId?: string | null;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const tasksQuery = useGetChatTasks();
  const taskQuery = useGetChatTask(taskId ?? null);
  const modulesQuery = useGetModules();
  const skillsQuery = useGetWorkflowSkills();
  const createTask = useCreateChatTask();
  const updateTask = useUpdateChatTask();
  const deleteTask = useDeleteChatTask();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [description, setDescription] = useState("");
  const [editor, setEditor] = useState<{
    draft?: TaskDraft;
    id?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<ScheduledTask | null>(null);
  const editingQuery = useGetChatTask(editor?.id ?? null);
  const tasks = (tasksQuery.data?.data.items ?? []).map(savedTaskFromApi);
  const task = taskQuery.data?.data
    ? savedTaskFromApi(taskQuery.data.data)
    : null;
  const modules = modulesQuery.data?.items ?? [];
  const skills = skillsQuery.data?.data.items ?? [];
  const filtered = tasks.filter(
    (item) =>
      (filter === "all" || item.status === filter) &&
      item.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const saving = createTask.isPending || updateTask.isPending;
  const saveError = createTask.error ?? updateTask.error;
  const openTask = (id: string) =>
    router.push(`${SCHEDULED_PATH}/${encodeURIComponent(id)}`);
  const openChat = (projectId = "") =>
    router.push(
      `/app/synergy-intelligence/c/new${projectId ? `/${encodeURIComponent(projectId)}` : ""}`
    );
  const openEditor = (
    draft: Partial<TaskDraft> = {},
    existing?: ScheduledTask
  ) => {
    createTask.reset();
    updateTask.reset();
    setEditor(
      existing
        ? { id: existing.id }
        : {
            draft: { ...EMPTY_TASK, emailAddress: user?.email ?? "", ...draft }
          }
    );
  };
  const share = async (id: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${SCHEDULED_PATH}/${encodeURIComponent(id)}`
      );
      toast.success("Task link copied.");
    } catch {
      toast.error(
        "Unable to copy the link. You can copy it from the browser address bar."
      );
    }
  };
  const saveDraft = (draft: TaskDraft) => {
    if (!editor || saving) return;
    if (editor.id) {
      if (!editingQuery.data?.data) return;
      updateTask.mutate(
        {
          id: editor.id,
          payload: taskPayloadFromDraft(draft, editingQuery.data.data)
        },
        { onSuccess: () => setEditor(null) }
      );
    } else {
      createTask.mutate(taskPayloadFromDraft(draft), {
        onSuccess: () => {
          setEditor(null);
          setFilter("all");
          setSearch("");
          setDescription("");
        }
      });
    }
  };
  const toggleStatus = () => {
    if (
      !task ||
      updateTask.isPending ||
      !["active", "paused"].includes(task.status)
    )
      return;
    const draft = {
      ...taskDraftFromApi(task.apiTask),
      status: task.status === "active" ? "paused" : "active"
    };
    if (Object.keys(validateTaskDraft(draft)).length) {
      toast.error(
        "Edit this task to fix its configuration before changing status."
      );
      return;
    }
    updateTask.reset();
    updateTask.mutate({
      id: task.id,
      payload: taskPayloadFromDraft(draft, task.apiTask)
    });
  };
  const requestDelete = (item: ScheduledTask) => {
    deleteTask.reset();
    setDeleting(item);
  };
  const confirmDelete = () => {
    if (!deleting || deleteTask.isPending) return;
    deleteTask.mutate(deleting.id, {
      onSuccess: (_, id) => {
        setDeleting(null);
        if (id === taskId) router.push(SCHEDULED_PATH);
      }
    });
  };
  const editorDraft = editor?.id
    ? editingQuery.data?.data
      ? taskDraftFromApi(editingQuery.data.data)
      : null
    : editor?.draft;
  const back = () => router.push(SCHEDULED_PATH);

  return (
    <div className="workflow-chat-scroll min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-8 sm:py-10">
      {taskId ? (
        taskQuery.isPending ? (
          <TaskRequestState title="Loading task..." loading />
        ) : taskQuery.isError ? (
          <TaskRequestState
            title={
              (taskQuery.error as AxiosError).response?.status === 404
                ? "Task not found"
                : "Unable to load task"
            }
            message={errorMessage(taskQuery.error)}
            onRetry={() => void taskQuery.refetch()}
            onBack={back}
          />
        ) : task ? (
          <>
            <ScheduledTaskDetail
              key={task.id}
              task={task}
              projectName={
                projects.find((project) => project.id === task.projectId)
                  ?.title ||
                (task.projectId ? `Project ${task.projectId}` : "No project")
              }
              skillName={
                skills.find((skill) => skill.id === task.skillId)?.title ||
                (task.skillId ? `Skill ${task.skillId}` : "None")
              }
              moduleNames={task.moduleIds.map(
                (id) =>
                  modules.find((module) => module.id === id)?.name ||
                  `Module ${id}`
              )}
              onBack={back}
              onEdit={() => openEditor({}, task)}
              onShare={() => void share(task.id)}
              onOpenChat={() => openChat(task.projectId)}
              onDelete={() => requestDelete(task)}
              onToggleStatus={toggleStatus}
              statusUpdating={updateTask.isPending}
            />
            {updateTask.isError && !editor && (
              <p
                role="alert"
                className="mx-auto mt-4 max-w-6xl rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                Unable to update task status: {errorMessage(updateTask.error)}
              </p>
            )}
          </>
        ) : (
          <TaskRequestState title="Task not found" onBack={back} />
        )
      ) : (
        <div className="mx-auto max-w-4xl space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back to projects"
                onClick={() => router.push("/app/synergy-intelligence")}
                className="size-6"
              >
                <TaskIcon name="back" size={18} />
              </Button>
              <h2 className="text-xl font-semibold text-gray-950">Scheduled</h2>
              {tasksQuery.isFetching && !tasksQuery.isPending && (
                <Loader2
                  aria-label="Refreshing tasks"
                  className="size-4 animate-spin text-gray-400"
                />
              )}
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative min-w-0 sm:w-50">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <TaskIcon name="search" />
                </span>
                <Input
                  aria-label="Search scheduled tasks by name"
                  placeholder="Search by name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-8 rounded-lg border-gray-200 pl-9"
                />
              </div>
              <Button
                size="sm"
                onClick={() => openEditor()}
                className="rounded-lg text-sm"
              >
                New Task
              </Button>
            </div>
          </header>
          <section className="space-y-4 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <TaskIcon name="sparkles" />
                </span>
                <Input
                  aria-label="Describe a task"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && description.trim()) {
                      event.preventDefault();
                      openEditor({ instructions: description.trim() });
                    }
                  }}
                  placeholder="Describe a task, e.g. Summarize project progress every morning."
                  className="h-8 rounded-lg border-gray-200 pl-9"
                />
              </div>
              <Button
                size="sm"
                onClick={() => openEditor({ instructions: description.trim() })}
                aria-label="Configure a task and select a skill"
                className="rounded-lg text-sm"
              >
                Add Skill
              </Button>
            </div>
            <h3 className="text-xs font-medium text-gray-700">
              START FROM AN EXAMPLE
            </h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {TASK_EXAMPLES.map((example) => (
                <button
                  key={example.title}
                  type="button"
                  onClick={() => openEditor(example.draft)}
                  className="flex items-center gap-3 rounded-lg border border-purple-100 p-4 text-left transition-colors hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-primary-500">
                    <TaskIcon name={example.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-gray-950">
                      {example.title}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {example.subtitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="bg-purple-50">
                {[{ value: "all", label: "All" }, ...TASK_STATUS_OPTIONS].map(
                  ({ value, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="px-3 text-sm"
                    >
                      {label}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
            </Tabs>
            <span className="text-xs text-gray-500">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
          {tasksQuery.isPending ? (
            <TaskRequestState title="Loading tasks..." loading />
          ) : (
            <>
              {tasksQuery.isError && (
                <TaskRequestState
                  title="Unable to load tasks"
                  message={errorMessage(tasksQuery.error)}
                  onRetry={() => void tasksQuery.refetch()}
                />
              )}
              {!tasksQuery.isError && filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center">
                  <h3 className="text-base font-medium text-gray-800">
                    No tasks found
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {search || filter !== "all"
                      ? "Try a different name or change the status filter."
                      : "Create a task to get started."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      if (search || filter !== "all") {
                        setSearch("");
                        setFilter("all");
                      } else openEditor();
                    }}
                  >
                    {search || filter !== "all"
                      ? "Show all tasks"
                      : "Create task"}
                  </Button>
                </div>
              )}
              <div className="space-y-2.5" aria-live="polite">
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-purple-100 p-4"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-primary-500">
                      <TaskIcon name={taskTypeInfo(item.type).icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openTask(item.id)}
                        className="max-w-full truncate text-left text-base font-medium text-gray-950 hover:text-primary-700"
                      >
                        {item.title}
                      </button>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {item.instructions}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <TaskTypeBadge type={item.type} />
                        {item.skillId && (
                          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            <TaskIcon name="skill" size={12} />
                            {skills.find((skill) => skill.id === item.skillId)
                              ?.title || `Skill ${item.skillId}`}
                          </span>
                        )}
                      </div>
                      <dl className="mt-2.5 grid gap-3 border-t border-gray-100 pt-2.5 sm:grid-cols-3">
                        <div>
                          <dt className="text-xs font-medium text-gray-500">
                            SCHEDULE
                          </dt>
                          <dd className="mt-1 text-xs text-gray-600">
                            {scheduleLabel(item)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">
                            NEXT RUN
                          </dt>
                          <dd className="mt-1 text-xs text-gray-600">
                            {item.nextRun}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500">
                            STATUS
                          </dt>
                          <dd className="mt-1">
                            <TaskStatusBadge status={item.status} />
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${item.title}`}
                          className="size-6"
                        >
                          <TaskIcon name="more" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={() => openTask(item.id)}>
                          <Eye className="size-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEditor({}, item)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void share(item.id)}>
                          <Share2 className="size-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => openChat(item.projectId)}
                        >
                          <MessageSquareText className="size-4" />
                          Open chat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => requestDelete(item)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {editor &&
        (editorDraft ? (
          <ScheduledTaskEditor
            key={editor.id ?? "new"}
            initialDraft={editorDraft}
            editing={Boolean(editor.id)}
            projects={projects}
            modules={modules}
            skills={skills}
            modulesLoading={modulesQuery.isPending}
            skillsLoading={skillsQuery.isPending}
            modulesError={modulesQuery.isError}
            skillsError={skillsQuery.isError}
            onRetryModules={() => void modulesQuery.refetch()}
            onRetrySkills={() => void skillsQuery.refetch()}
            saving={saving}
            error={saveError ? errorMessage(saveError) : undefined}
            onClose={() => !saving && setEditor(null)}
            onSave={saveDraft}
          />
        ) : (
          <Dialog open onOpenChange={(open) => !open && setEditor(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingQuery.isError
                    ? "Unable to load task for editing"
                    : "Loading task..."}
                </DialogTitle>
                <DialogDescription>
                  {editingQuery.isError
                    ? errorMessage(editingQuery.error)
                    : "Fetching the saved task configuration."}
                </DialogDescription>
              </DialogHeader>
              {editingQuery.isError ? (
                <Button
                  variant="outline"
                  onClick={() => void editingQuery.refetch()}
                >
                  Retry
                </Button>
              ) : (
                <Loader2 className="mx-auto size-5 animate-spin text-primary-600" />
              )}
            </DialogContent>
          </Dialog>
        ))}
      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) =>
          !open && !deleteTask.isPending && setDeleting(null)
        }
        title="Delete task?"
        description={
          deleteTask.isError
            ? `Unable to delete the task: ${errorMessage(deleteTask.error)}`
            : `Are you sure you want to delete “${deleting?.title ?? "this task"}”? This action cannot be undone.`
        }
        confirmLabel="Delete task"
        isLoading={deleteTask.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
