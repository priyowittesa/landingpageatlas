"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEmployees } from "@/app/app/master-data/employee/use-employees";
import FormTextField from "@/components/FormTextField";
import FormSelectField from "@/components/FormSelectField";
import FormDateField from "@/components/FormDateField";
import { useForm } from "react-hook-form";

import {
  taskPriorityOptions,
  taskStatusOptions,
  type AddTaskDto,
} from "../../../types";
import {
  useAddTask,
  useProject,
  useProjectWorkPackages,
} from "../../../hooks/useProjectPlanning";

const defaultValues: AddTaskDto = {
  project_id: "",
  work_package_id: "",
  task_name: "",
  phase: "",
  assignee_id: "",
  status: "todo",
  priority: "medium",
  start_date: "",
  end_date: "",
  rql_component_id: "",
  cable_type: "",
  termination_end: "End A",
};

export default function NewTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";
  const { data: project, isLoading } = useProject(projectId);
  const { data: workPackages = [] } = useProjectWorkPackages(projectId);
  const employeesQuery = useEmployees();
  const create = useAddTask();

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

  const { control, register, reset, handleSubmit } = useForm<AddTaskDto>({
    defaultValues,
  });

  useEffect(() => {
    if (!isLoading && !project) {
      router.push("/app/product-development/project-planning");
    }
  }, [isLoading, project, router]);

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      { ...values, project_id: projectId },
      {
        onSuccess: () => {
          reset({ ...defaultValues, project_id: projectId });
          router.push(`/app/product-development/project-planning/${projectId}`);
        },
      }
    );
  });

  if (isLoading || !project) {
    return (
      <div className="mx-auto max-w-2xl pb-10 text-xs text-gray-400">
        Loading project...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            router.push(`/app/product-development/project-planning/${projectId}`)
          }
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            router.push(`/app/product-development/project-planning/${projectId}`)
          }
        >
          Cancel
        </Button>
      </div>

      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
          Add Task
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {project.project_no} · {project.name}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-md border bg-white p-5">
        <FormTextField
          label="Project Task Name"
          name="task_name"
          register={register}
          required
          placeholder="e.g. Termination assembly layout"
        />
        <FormSelectField
          label="Work Package"
          name="work_package_id"
          control={control}
          options={workPackages.map((item) => ({ label: item.name, value: item.id }))}
          placeholder="Select work package"
          search
          required
        />
        <FormSelectField
          label="Assigned To"
          name="assignee_id"
          control={control}
          options={employeeOptions}
          placeholder={employeesQuery.isLoading ? "Loading employees..." : "Select employee"}
          emptyMessage={employeesQuery.isError ? "Failed to load employees." : "No employees found."}
          search
        />
        <div className="grid grid-cols-2 gap-3">
          <FormSelectField
            label="Status"
            name="status"
            control={control}
            options={taskStatusOptions.map((s) => ({
              label: s.replace("_", " "),
              value: s,
            }))}
            placeholder="Status"
          />
          <FormSelectField
            label="Priority"
            name="priority"
            control={control}
            options={taskPriorityOptions.map((p) => ({
              label: p,
              value: p,
            }))}
            placeholder="Priority"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormDateField
            label="Start Date"
            name="start_date"
            control={control}
          />
          <FormDateField
            label="End Date"
            name="end_date"
            control={control}
          />
        </div>
        <FormTextField
          label="RQL/Component ID"
          name="rql_component_id"
          register={register}
          placeholder="e.g. AWK"
        />
        <FormTextField
          label="Cable Type"
          name="cable_type"
          register={register}
          placeholder="laxx"
        />
        <FormSelectField
          label="Termination End"
          name="termination_end"
          control={control}
          options={[
            { label: "End A", value: "End A" },
            { label: "End B", value: "End B" },
          ]}
        />

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() =>
              router.push(`/app/product-development/project-planning/${projectId}`)
            }
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary-700 hover:bg-primary-800"
            disabled={create.isPending}
          >
            {create.isPending ? "Saving..." : "Add Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
