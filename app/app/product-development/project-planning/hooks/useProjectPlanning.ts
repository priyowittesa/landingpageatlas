"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  AddTaskDto,
  AddWorkPackageDto,
  ProjectFilter,
  ProjectPlanning,
  ProjectPlanningListResponse,
  ProjectTask,
  ProjectTimelineEntry,
  ProjectWorkPackage,
  UpdateTaskDto,
} from "../types";

const axios = axiosConfig(env.apiBaseUrl);

const BASE_URL = "/v1/manufacturing/engineering/project-planning";
const PROJECT_PLANNING_LIST_URL = BASE_URL;

export const projectKeys = {
  all: ["product-development-projects"] as const,
  list: (params?: ProjectFilter) =>
    [...projectKeys.all, "list", params] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  workPackages: (id: string) => [...projectKeys.all, "work-packages", id] as const,
  tasks: (id: string, workPackageIds: string[] = []) =>
    [...projectKeys.all, "tasks", id, workPackageIds] as const,
  timeline: (id: string) => [...projectKeys.all, "timeline", id] as const,
};

function normalizeProject(raw: unknown): ProjectPlanning {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const summary = (row.summary ?? {}) as Record<string, unknown>;
  const pm = (row.project_manager ?? {}) as Record<string, unknown>;
  const source = (row.source_request ?? {}) as Record<string, unknown>;
  const customerRow = row.customer;
  const statusDesign = String(row.status_design ?? "").trim();
  const statusPrototype = String(row.status_prototype ?? "").trim();
  const hasLifecycleStatuses =
    Object.prototype.hasOwnProperty.call(row, "status_design") ||
    Object.prototype.hasOwnProperty.call(row, "status_prototype");
  const bothStagesApproved =
    statusDesign.toLowerCase() === "approved" &&
    statusPrototype.toLowerCase() === "approved";
  const currentStage: ProjectPlanning["current_stage"] = hasLifecycleStatuses
    ? bothStagesApproved
      ? "completed"
      : statusPrototype
        ? "prototype"
        : statusDesign
          ? "design"
          : "planning"
    : ((row.current_stage as ProjectPlanning["current_stage"]) ?? "planning");
  const totalTasks = Number(summary.total ?? row.count_tasks ?? 0);
  const completedTasks = Number(
    summary.completed_tasks ?? row.count_tasks_completed ?? 0,
  );
  const inProgressTasks = Number(
    summary.in_progress_tasks ?? row.count_tasks_in_progress ?? 0,
  );
  const progressPercent = Number(
    row.progress_percent ??
      summary.progress_percent ??
      (totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0),
  );

  return {
    id: String(row.id ?? ""),
    project_no: String(row.project_no ?? row.code ?? ""),
    name: String(row.name ?? row.title ?? row.code ?? ""),
    category: (row.category as ProjectPlanning["category"]) ?? "planning",
    current_stage: currentStage,
    status_design: statusDesign,
    design_id: String(row.design_id ?? ""),
    status_prototype: statusPrototype,
    prototype_id: String(row.prototype_id ?? ""),
    customer:
      typeof customerRow === "string"
        ? customerRow
        : String((customerRow as Record<string, unknown>)?.name ?? ""),
    project_manager: {
      id: String(pm.id ?? row.project_manager_id ?? ""),
      name: String(pm.name ?? row.project_manager_name ?? ""),
    },
    start_date: String(row.start_date ?? row.start_date_at ?? ""),
    due_date: String(row.due_date ?? row.due_date_at ?? ""),
    source_request: {
      id: String(source.id ?? row.request_id ?? ""),
      request_no: String(source.request_no ?? row.code ?? ""),
      name: String(source.name ?? ""),
      approved_at: String(source.approved_at ?? ""),
      due_date: String(source.due_date ?? ""),
    },
    classification: String(row.classification ?? "New Product Design"),
    progress_percent: progressPercent,
    summary: {
      total: totalTasks,
      done: Number(summary.done ?? row.count_tasks_completed ?? 0),
      active: Number(summary.active ?? row.count_tasks_in_progress ?? 0),
      blocked: Number(summary.blocked ?? 0),
      work_packages: Number(
        summary.work_packages ?? row.count_work_packages ?? 0,
      ),
      in_progress_tasks: inProgressTasks,
      completed_tasks: completedTasks,
      progress_percent: progressPercent,
    },
    risk_tags: Array.isArray(row.risk_tags)
      ? row.risk_tags.map((t) => String(t))
      : [],
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function normalizeTask(
  raw: unknown,
  workPackage?: ProjectWorkPackage,
): ProjectTask {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const assignee = (row.assignee ?? {}) as Record<string, unknown>;
  const labour = (row.labour ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    work_package_id: String(row.work_package_id ?? workPackage?.id ?? ""),
    task_name: String(row.task_name ?? row.title ?? row.name ?? ""),
    description: String(row.description ?? ""),
    phase: String(row.phase ?? row.work_package_name ?? workPackage?.name ?? ""),
    assignee: {
      id: String(assignee.id ?? labour.id ?? row.labour_id ?? ""),
      name: String(
        assignee.name ??
          assignee.full_name ??
          labour.full_name ??
          labour.name ??
          row.labour_full_name ??
          row.labour_name ??
          "Unassigned",
      ),
    },
    status: (row.status as ProjectTask["status"]) ?? "todo",
    priority: (row.priority as ProjectTask["priority"]) ?? "medium",
    impact: (row.impact as ProjectTask["impact"]) ?? "medium",
    start_date: String(row.start_date ?? ""),
    end_date: String(row.end_date ?? row.due_date_at ?? ""),
    due_date: String(row.due_date ?? row.due_date_at ?? ""),
    estimate_hours: Number(
      row.estimate_hours ?? row.estimate_value ?? row.estimate ?? 0,
    ),
    estimate_unit: String(row.estimate_unit ?? "hour"),
    progress_percent: Number(row.progress_percent ?? 0),
    rql_component_id: String(row.rql_component_id ?? ""),
    cable_type: String(row.cable_type ?? ""),
    termination_end: String(row.termination_end ?? ""),
    is_phase_header: Boolean(row.is_phase_header),
  };
}

function normalizeWorkPackage(raw: unknown): ProjectWorkPackage {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const owner = (row.owner ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? row.work_package_id ?? ""),
    name: String(row.name ?? row.title ?? row.phase ?? "Work Package"),
    status: String(row.status ?? "in_progress"),
    owner_name: String(row.owner_name ?? owner.name ?? ""),
    allocated_hours: Number(row.allocated_hours ?? row.estimate_value ?? 0),
  };
}

function normalizeTimelineEntry(raw: unknown): ProjectTimelineEntry {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    timestamp: String(row.timestamp ?? row.created_at ?? ""),
    actor: String(row.actor ?? row.user ?? ""),
    description: String(row.description ?? row.text ?? ""),
  };
}

function extractList<T>(
  payload: unknown,
  normalizer: (raw: unknown) => T
): T[] {
  if (Array.isArray(payload)) return payload.map(normalizer);
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of [
    "data",
    "items",
    "projects",
    "work_packages",
    "tasks",
    "timelines",
    "rows",
    "results",
  ]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizer);
    if (value && typeof value === "object") {
      const nested = extractList(value, normalizer);
      if (nested.length) return nested;
    }
  }
  return [];
}

function extractNextPageToken(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const value = payload as Record<string, unknown>;
  const token = value.next_page_token ?? value.nextPageToken;
  if (token !== undefined && token !== null) return String(token);
  for (const key of ["data", "pagination", "meta"]) {
    const nested = extractNextPageToken(value[key]);
    if (nested) return nested;
  }
  return "";
}

function toApiDate(value?: string): string | undefined {
  if (!value) return undefined;

  const formDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (formDate) {
    const [, month, day, year] = formDate;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    ).toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function useProjectList(params: ProjectFilter = {}) {
  return useQuery<ProjectPlanningListResponse, AxiosError<ApiResponseError>>({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "")
          query[key] = String(value);
      }
      const res = await axios.get(PROJECT_PLANNING_LIST_URL, { params: query });
      return {
        items: extractList(res.data, normalizeProject),
        next_page_token: extractNextPageToken(res.data),
      };
    },
    meta: { errorMessage: "Failed to load projects" },
  });
}

export function useProject(id?: string) {
  return useQuery<ProjectPlanning | null, AxiosError<ApiResponseError>>({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`${BASE_URL}/${id}`);
      const data = res.data as Record<string, unknown>;
      const raw = data?.data ?? data?.project ?? data;
      if (!raw || typeof raw !== "object") return null;
      return normalizeProject(raw);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load project" },
  });
}

export function useProjectWorkPackages(projectId?: string) {
  return useQuery<ProjectWorkPackage[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.workPackages(projectId ?? ""),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await axios.get(`${BASE_URL}/${projectId}/work-packages`);
      return extractList(res.data, normalizeWorkPackage);
    },
    enabled: Boolean(projectId),
    meta: { errorMessage: "Failed to load project work packages" },
  });
}

export function useAddWorkPackage() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, AddWorkPackageDto>({
    mutationFn: async ({ project_id, ...body }) =>
      (
        await axios.post(`${BASE_URL}/${project_id}/work-packages`, body)
      ).data,
    meta: {
      errorMessage: "Failed to add work package",
      successMessage: "Work package added successfully",
    },
    onSuccess: (_data, { project_id }) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.workPackages(project_id),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project_id) });
    },
  });
}

export function useDeleteWorkPackage() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { project_id: string; work_package_id: string }
  >({
    mutationFn: async ({ project_id, work_package_id }) =>
      (
        await axios.delete(
          `${BASE_URL}/${project_id}/work-packages/${work_package_id}`,
        )
      ).data,
    meta: {
      errorMessage: "Failed to delete work package",
      successMessage: "Work package deleted successfully",
    },
    onSuccess: (_data, { project_id }) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.workPackages(project_id),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project_id) });
    },
  });
}

export function useProjectTasks(
  projectId?: string,
  workPackages: ProjectWorkPackage[] = [],
) {
  const workPackageIds = workPackages.map((item) => item.id).filter(Boolean);
  return useQuery<ProjectTask[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.tasks(projectId ?? "", workPackageIds),
    queryFn: async () => {
      if (!projectId) return [];
      const responses = await Promise.all(
        workPackages.map(async (workPackage) => {
          const res = await axios.get(
            `${BASE_URL}/${projectId}/work-packages/${workPackage.id}/tasks`,
          );
          return extractList(res.data, (raw) => normalizeTask(raw, workPackage));
        }),
      );
      return responses.flat();
    },
    enabled: Boolean(projectId) && workPackageIds.length > 0,
    meta: { errorMessage: "Failed to load project tasks" },
  });
}

export function useProjectTimeline(projectId?: string) {
  return useQuery<ProjectTimelineEntry[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.timeline(projectId ?? ""),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await axios.get(`${BASE_URL}/${projectId}/timelines`);
      return extractList(res.data, normalizeTimelineEntry);
    },
    enabled: Boolean(projectId),
    meta: { errorMessage: "Failed to load project timeline" },
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, AddTaskDto>({
    mutationFn: async (payload) => {
      const { project_id, work_package_id, ...values } = payload;
      const body = {
        title: values.task_name,
        description: values.description ?? "",
        due_date_at: toApiDate(values.end_date || values.due_date),
        estimate_unit: values.estimate_unit ?? "hour",
        estimate_value: String(values.estimate_hours ?? 0),
        priority: values.priority,
        status: values.status,
        labour_id: values.assignee_id ?? "",
      };
      return (
        await axios.post(
          `${BASE_URL}/${project_id}/work-packages/${work_package_id}/tasks`,
          body,
        )
      ).data;
    },
    meta: {
      errorMessage: "Failed to add task",
      successMessage: "Task added successfully",
    },
    onSuccess: (_data, { project_id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    UpdateTaskDto
  >({
    mutationFn: async (payload) => {
      const { id, project_id, work_package_id, ...values } = payload;
      const body = {
        ...(values.task_name !== undefined && { title: values.task_name }),
        ...(values.description !== undefined && {
          description: values.description,
        }),
        ...((values.end_date !== undefined || values.due_date !== undefined) && {
          due_date_at: toApiDate(values.end_date || values.due_date),
        }),
        ...(values.estimate_unit !== undefined && {
          estimate_unit: values.estimate_unit,
        }),
        ...(values.estimate_hours !== undefined && {
          estimate_value: String(values.estimate_hours),
        }),
        ...(values.priority !== undefined && { priority: values.priority }),
        ...(values.status !== undefined && { status: values.status }),
        ...(values.assignee_id !== undefined && {
          labour_id: values.assignee_id,
        }),
      };
      return (
        await axios.put(
          `${BASE_URL}/${project_id}/work-packages/${work_package_id}/tasks/${id}`,
          body,
        )
      ).data;
    },
    meta: {
      errorMessage: "Failed to update task",
      successMessage: "Task updated successfully",
    },
    onSuccess: (_data, { project_id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; project_id: string; work_package_id: string }
  >({
    mutationFn: async ({ id, project_id, work_package_id }) =>
      (
        await axios.delete(
          `${BASE_URL}/${project_id}/work-packages/${work_package_id}/tasks/${id}`,
        )
      ).data,
    meta: {
      errorMessage: "Failed to delete task",
      successMessage: "Task deleted",
    },
    onSuccess: (_data, { project_id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(project_id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project_id) });
    },
  });
}

export function useUpdateProjectStage() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; stage: ProjectPlanning["current_stage"] }
  >({
    mutationFn: async ({ id, stage }) =>
      (await axios.post(`${BASE_URL}/${id}/stage`, { stage })).data,
    meta: {
      errorMessage: "Failed to update project stage",
      successMessage: "Project stage updated",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
