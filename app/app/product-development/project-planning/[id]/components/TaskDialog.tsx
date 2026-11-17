"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import FormDateField from "@/components/FormDateField";
import FormSelectField from "@/components/FormSelectField";
import FormTextField from "@/components/FormTextField";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/app/app/master-data/employee/use-employees";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  taskPriorityOptions,
  taskStatusOptions,
  type AddTaskDto,
  type ProjectTask,
} from "../../types";
import { useAddTask, useUpdateTask } from "../../hooks/useProjectPlanning";

type TaskFormValues = Omit<AddTaskDto, "project_id" | "work_package_id">;

const emptyValues = (phase = ""): TaskFormValues => ({
  task_name: "",
  description: "",
  phase,
  assignee_id: "",
  status: "todo",
  priority: "medium",
  start_date: "",
  end_date: "",
  estimate_hours: 0,
  estimate_unit: "hour",
});

function toFormDate(value?: string): string {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  // A date-only value has no timezone and should retain its literal date.
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[2]}/${dateOnly[3]}/${dateOnly[1]}`;

  // API timestamps are UTC instants. Format them in the browser's local
  // timezone so this field matches the date shown in the task table.
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${String(parsed.getMonth() + 1).padStart(2, "0")}/${String(parsed.getDate()).padStart(2, "0")}/${parsed.getFullYear()}`;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  workPackageId,
  phase,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workPackageId: string;
  phase?: string;
  task?: ProjectTask | null;
}) {
  const create = useAddTask();
  const update = useUpdateTask();
  const employeesQuery = useEmployees();
  const employeeOptions = useMemo(
    () =>
      (employeesQuery.data ?? []).map((employee) => ({
        label: employee.code
          ? `${employee.full_name} (${employee.code})`
          : employee.full_name,
        value: employee.id,
      })),
    [employeesQuery.data],
  );
  const isEditing = Boolean(task);
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({ defaultValues: emptyValues(phase) });

  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? {
            task_name: task.task_name,
            description: task.description ?? "",
            phase: task.phase ?? phase ?? "",
            assignee_id: task.assignee?.id ?? "",
            status: task.status,
            priority: task.priority,
            start_date: toFormDate(task.start_date),
            end_date: toFormDate(task.end_date || task.due_date),
            estimate_hours: task.estimate_hours ?? 0,
            estimate_unit: task.estimate_unit ?? "hour",
          }
        : emptyValues(phase),
    );
  }, [open, phase, reset, task]);

  const submit = handleSubmit((values) => {
    const onSuccess = () => onOpenChange(false);
    if (task) {
      update.mutate({
        id: task.id,
        project_id: projectId,
        work_package_id: task.work_package_id || workPackageId,
        ...values,
      }, { onSuccess });
      return;
    }
    create.mutate({
      project_id: projectId,
      work_package_id: workPackageId,
      ...values,
    }, { onSuccess });
  });

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditing ? "Edit Task" : "Add Task"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {task?.phase || phase || "Choose the work package for this task"}
          </DialogDescription>
        </DialogHeader>

        <form id="task-form" onSubmit={submit} className="space-y-3">
          <FormTextField
            label="Task Name"
            name="task_name"
            register={register}
            required
            error={errors.task_name}
            placeholder="e.g. Termination assembly layout"
          />
          <FormTextField
            label="Description"
            name="description"
            register={register}
            as="textarea"
            rows={3}
            placeholder="Describe the expected task output"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSelectField
              label="Assignee"
              name="assignee_id"
              control={control}
              options={employeeOptions}
              placeholder={employeesQuery.isLoading ? "Loading employees..." : "Select employee"}
              emptyMessage={employeesQuery.isError ? "Failed to load employees." : "No employees found."}
              search
              required
            />
            <FormDateField
              label="Due Date"
              name="end_date"
              control={control}
              required
              toYear={new Date().getFullYear() + 10}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSelectField
              label="Status"
              name="status"
              control={control}
              options={taskStatusOptions.map((item) => ({
                label: item.replaceAll("_", " "),
                value: item,
              }))}
            />
            <FormSelectField
              label="Priority"
              name="priority"
              control={control}
              options={taskPriorityOptions.map((item) => ({
                label: item,
                value: item,
              }))}
            />
          </div>
          <FormTextField
            label="Estimate"
            name="estimate_hours"
            register={register}
            type="number"
            placeholder="e.g. 16"
            suffix="Hours"
          />
        </form>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
