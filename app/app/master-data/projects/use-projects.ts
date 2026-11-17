"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import { ProjectStatus, type Project, type ProjectPayload } from "./types";

const PROJECT_URL = "/v1/construction/project";
const PROJECT_DASHBOARD_SUMMARY_URL = `${PROJECT_URL}/dashboard-summary`;
const PROJECT_TYPE_URL = "/v1/construction/project-type";
const LABOUR_URL = "/v1/construction/labour";
const ROLE_URL = "/v1/construction/role";
const DEPARTMENT_URL = "/v1/construction/department";
const LABOUR_MEMBERS_URL = "/v1/construction-labour/members";
const ENUMS_URL = "/v1/construction/enums";
const axios = axiosConfig(env.apiBaseUrl);
const projectKeys = {
  all: ["construction-projects"] as const,
  detail: (id: string) => ["construction-projects", id] as const,
  projectTypes: ["construction-project-types"] as const,
  dashboardSummary: ["construction-project-dashboard-summary"] as const,
  labours: ["construction-labours"] as const,
  members: (projectId: string) =>
    ["construction-labour-members", projectId] as const,
  rosterMembers: (projectId: string) =>
    ["construction-labour-roster-members", projectId] as const,
  roles: ["construction-roles"] as const,
  departments: ["construction-departments"] as const,
  enums: ["construction-enums", "projects"] as const,
};

export interface LabourOption {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  groupId?: string;
  role_id?: string;
  department_id?: string;
}

export interface LabourMemberPayload {
  department_id?: string;
  end_date?: string;
  group_id?: string;
  labour_id?: string;
  project_id: string;
  responsibility?: string;
  role_in_project: string;
  start_date?: string;
}

export interface LabourMemberUpdate {
  id: string;
  payload: LabourMemberPayload;
}

export interface LabourMemberDateUpdate {
  end_date: string;
  group_id?: string;
  id: string;
  projectId: string;
  start_date: string;
}

export interface LabourMemberBulkDelete {
  ids: string[];
  projectId: string;
}

export interface LabourMemberFilters {
  endDate?: string;
  groupId?: string;
  memberId?: string;
  pageSize?: number;
  pageToken?: string;
  startDate?: string;
}

export interface LabourMemberListFilters extends LabourMemberFilters {
  projectId?: string;
}

export interface LabourMemberOrderPayload {
  end_date: string;
  items: {
    member_id: string;
    position: number;
  }[];
  project_id: string;
  start_date: string;
}

export interface LabourRosterMember {
  department_id: string;
  department_name: string;
  end_date: string;
  group_id: string;
  group_name: string;
  id: string;
  labour_id: string;
  labour_name: string;
  labour_role_name: string;
  member_role_id: string;
  member_role_name: string;
  position?: number;
  project_id: string;
  responsibility: string;
  role_in_project: string;
  start_date: string;
}

export interface LabourRosterGroup {
  group_id: string;
  group_name: string;
}

export interface LabourRosterMembers {
  groups: LabourRosterGroup[];
  members: LabourRosterMember[];
  totalCount: number;
}

export interface ReferenceOption {
  id: string;
  name: string;
}

export interface ProjectEnumOption {
  label: string;
  value: string;
}

export interface ProjectEnums {
  project_priority: ProjectEnumOption[];
  project_status: ProjectEnumOption[];
}

export interface ProjectListFilters {
  pageSize?: number;
  pageToken?: string;
  projectTypeId?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface ProjectListResult {
  items: Project[];
  nextPageToken: string;
  totalCount: number;
}

export type ProjectDashboardSummary = Record<string, number>;

type LabourApiItem = {
  id?: unknown;
  _id?: unknown;
  labour_id?: unknown;
  employee_id?: unknown;
  name?: unknown;
  full_name?: unknown;
  employee_name?: unknown;
  worker_name?: unknown;
  email?: unknown;
  avatar?: unknown;
  avatar_url?: unknown;
  role?: unknown;
  role_id?: unknown;
  department_id?: unknown;
  group_id?: unknown;
  labour_group_id?: unknown;
  group?: { id?: unknown };
  employee?: {
    id?: unknown;
    _id?: unknown;
    name?: unknown;
    full_name?: unknown;
  };
  user?: {
    id?: unknown;
    _id?: unknown;
    name?: unknown;
    full_name?: unknown;
  };
};

type ProjectApiItem = Omit<Partial<Project>, "status" | "type"> & {
  status?: unknown;
  type?: unknown;
  _id?: string;
  project_id?: string;
  project_type_id?: unknown;
  project_type?: {
    id?: unknown;
  };
  name?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
  project_manager?: {
    name?: string;
    full_name?: string;
  };
  project_manager_name?: string;
  project_team?: unknown;
  project_teams?: unknown;
  team_members?: unknown;
  members?: unknown;
  group_id?: string;
  group?: { id?: string };
};

type ProjectTeamApiItem = {
  id?: unknown;
  _id?: unknown;
  member_id?: unknown;
  labour_member_id?: unknown;
  project_id?: unknown;
  labour_id?: unknown;
  employee_id?: unknown;
  role_id?: unknown;
  member_role_id?: unknown;
  role_in_project_id?: unknown;
  role_in_project?: unknown;
  project_role_id?: unknown;
  department_id?: unknown;
  group_id?: unknown;
  responsibility?: unknown;
  labour?: { id?: unknown; labour_id?: unknown };
  employee?: { id?: unknown; employee_id?: unknown };
  role?: { id?: unknown };
  member_role?: { id?: unknown; role_id?: unknown };
  department?: { id?: unknown };
  labour_name?: string;
};

function normalizeProjectTeam(rawTeam: unknown): Project["project_team"] {
  if (!Array.isArray(rawTeam)) return [];

  return rawTeam.flatMap((raw): Project["project_team"] => {
    if (!raw || typeof raw !== "object") return [];
    const member = raw as ProjectTeamApiItem;
    const labourId =
      member.labour_id ??
      member.employee_id ??
      member.labour?.id ??
      member.labour?.labour_id ??
      member.employee?.id ??
      member.employee?.employee_id;
    if (labourId == null) return [];
    const rawRole =
      member.role_id ??
      member.member_role_id ??
      member.role_in_project_id ??
      member.project_role_id ??
      member.member_role?.id ??
      member.member_role?.role_id ??
      member.role?.id ??
      member.role_in_project;
    const roleId =
      rawRole && typeof rawRole === "object" && !Array.isArray(rawRole)
        ? (rawRole as Record<string, unknown>).id ??
          (rawRole as Record<string, unknown>).role_id ??
          (rawRole as Record<string, unknown>).value
        : rawRole;

    return [
      {
        member_id:
          member.id == null &&
          member._id == null &&
          member.member_id == null &&
          member.labour_member_id == null
            ? undefined
            : String(
                member.id ??
                  member._id ??
                  member.member_id ??
                  member.labour_member_id,
              ),
        labour_id: String(labourId),
        group_id: member.group_id == null ? undefined : String(member.group_id),
        role_id: roleId == null ? "" : String(roleId),
        department_id: String(
          member.department_id ?? member.department?.id ?? "",
        ),
        responsibility: String(member.responsibility ?? ""),
        name: String(member.labour_name ?? ""),
      },
    ];
  });
}

function normalizeProjectStatus(status: unknown): ProjectStatus {
  const normalized = enumResponseValue(status, "PROJECT_STATUS_");
  const legacyStatusMap: Record<string, ProjectStatus> = {
    "0": ProjectStatus.PROJECT_STATUS_UNSPECIFIED,
    "1": ProjectStatus.PROJECT_STATUS_ACTIVE,
    "2": ProjectStatus.PROJECT_STATUS_INACTIVE,
    "3": ProjectStatus.PROJECT_STATUS_COMPLETED,
  };
  return (
    legacyStatusMap[normalized] ??
    (normalized || ProjectStatus.PROJECT_STATUS_UNSPECIFIED)
  );
}

function enumResponseValue(value: unknown, backendPrefix: string): string {
  let result = "";
  if (value == null) return result;
  if (typeof value === "string" || typeof value === "number") {
    result = String(value);
  } else if (typeof value === "object" && !Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    result = String(item.value ?? item.code ?? item.id ?? item.name ?? "");
  }
  const trimmed = result.trim();
  return trimmed.toUpperCase().startsWith(backendPrefix)
    ? trimmed.slice(backendPrefix.length).toLowerCase()
    : trimmed;
}

function normalizeEnumOptions(value: unknown): ProjectEnumOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): ProjectEnumOption[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    return item.label == null || item.value == null
      ? []
      : [{ label: String(item.label), value: String(item.value) }];
  });
}

function extractProjectEnums(payload: unknown): ProjectEnums {
  let current = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      break;
    const object = current as Record<string, unknown>;
    if (
      Array.isArray(object.project_status) ||
      Array.isArray(object.project_priority)
    ) {
      return {
        project_status: normalizeEnumOptions(object.project_status),
        project_priority: normalizeEnumOptions(object.project_priority),
      };
    }
    current = object.data ?? object.enums ?? object.items;
  }
  return { project_status: [], project_priority: [] };
}

function normalizeProject(item: ProjectApiItem, index: number): Project {
  const rawTeam =
    item.project_team ??
    item.project_teams ??
    item.team_members ??
    item.members;
  const projectTeam = normalizeProjectTeam(rawTeam);

  return {
    id: String(item.id ?? item._id ?? item.project_id ?? index),
    group_id: String(item.group_id ?? item.group?.id ?? ""),
    address: String(item.address ?? ""),
    title: String(item.title ?? item.name ?? "Untitled project"),
    client_name: String(item.client_name ?? item.clientName ?? "-"),
    code: String(item.code ?? ""),
    description: String(item.description ?? ""),
    start_date: String(item.start_date ?? item.startDate ?? ""),
    end_date: String(item.end_date ?? item.endDate ?? ""),
    location: String(item.location ?? ""),
    priority: enumResponseValue(item.priority, "PROJECT_PRIORITY_"),
    project_manager_id: String(item.project_manager_id ?? ""),
    project_manager_name: String(
      item.project_manager_name ??
        item.project_manager?.full_name ??
        item.project_manager?.name ??
        "",
    ),
    status: normalizeProjectStatus(item.status),
    progress:
      typeof item.progress === "number" && Number.isFinite(item.progress)
        ? item.progress
        : undefined,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    type: String(
      item.project_type_id ?? item.project_type?.id ?? item.type ?? "",
    ),
    project_team: projectTeam,
  };
}

function extractProjects(payload: unknown): Project[] {
  if (Array.isArray(payload)) return payload.map(normalizeProject);
  if (!payload || typeof payload !== "object") return [];

  const envelope = payload as { data?: unknown; items?: unknown };
  if (Array.isArray(envelope.items))
    return envelope.items.map(normalizeProject);
  if (Array.isArray(envelope.data)) return envelope.data.map(normalizeProject);
  if (envelope.data && typeof envelope.data === "object") {
    const nested = envelope.data as {
      data?: unknown;
      items?: unknown;
      projects?: unknown;
    };
    const list = nested.data ?? nested.items ?? nested.projects;
    if (Array.isArray(list)) return list.map(normalizeProject);
  }
  return [];
}

function extractProjectList(payload: unknown): ProjectListResult {
  const items = extractProjects(payload);
  let current = payload;
  let nextPageToken = "";
  let totalCount: number | undefined;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }
    const envelope = current as Record<string, unknown>;
    const token = envelope.next_page_token ?? envelope.nextPageToken;
    const count = envelope.total_count ?? envelope.totalCount;
    if (token != null) nextPageToken = String(token);
    if (count != null && Number.isFinite(Number(count))) {
      totalCount = Number(count);
    }
    current = envelope.data ?? envelope.result ?? envelope.projects;
  }

  return {
    items,
    nextPageToken,
    totalCount: totalCount ?? items.length,
  };
}

function extractProject(payload: unknown): Project | null {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as { data?: unknown };
  const item =
    envelope.data && typeof envelope.data === "object"
      ? ((envelope.data as { data?: unknown }).data ?? envelope.data)
      : payload;
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  return normalizeProject(item as ProjectApiItem, 0);
}

function findMemberList(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth >= 5) return [];

  const envelope = value as Record<string, unknown>;
  const keys = [
    "data",
    "items",
    "members",
    "labour_members",
    "project_members",
    "project_team",
    "results",
    "records",
    "rows",
    "content",
  ];

  for (const key of keys) {
    if (envelope[key] !== undefined) {
      const list = findMemberList(envelope[key], depth + 1);
      if (list.length > 0 || Array.isArray(envelope[key])) return list;
    }
  }

  return [];
}

function extractProjectMembers(
  payload: unknown,
  projectId: string,
): Project["project_team"] {
  const items = findMemberList(payload).filter((raw) => {
    if (!raw || typeof raw !== "object") return false;
    const itemProjectId = (raw as ProjectTeamApiItem).project_id;
    return itemProjectId == null || String(itemProjectId) === projectId;
  });

  return normalizeProjectTeam(items);
}

function rosterString(item: Record<string, unknown>, key: string) {
  return item[key] == null ? "" : String(item[key]);
}

function normalizeRosterMember(
  raw: unknown,
  fallbackGroup?: LabourRosterGroup,
): LabourRosterMember | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const id = rosterString(item, "id") || rosterString(item, "_id");
  if (!id) return null;
  const rawPosition = item.position ?? item.member_position ?? item.sort_order;

  return {
    department_id: rosterString(item, "department_id"),
    department_name: rosterString(item, "department_name"),
    end_date: rosterString(item, "end_date"),
    group_id: rosterString(item, "group_id") || fallbackGroup?.group_id || "",
    group_name:
      rosterString(item, "group_name") ||
      fallbackGroup?.group_name ||
      "Ungrouped",
    id,
    labour_id: rosterString(item, "labour_id"),
    labour_name: rosterString(item, "labour_name"),
    labour_role_name: rosterString(item, "labour_role_name"),
    member_role_id: rosterString(item, "member_role_id"),
    member_role_name: rosterString(item, "member_role_name"),
    position:
      rawPosition == null || Number.isNaN(Number(rawPosition))
        ? undefined
        : Number(rawPosition),
    project_id: rosterString(item, "project_id"),
    responsibility: rosterString(item, "responsibility"),
    role_in_project: rosterString(item, "role_in_project"),
    start_date: rosterString(item, "start_date"),
  };
}

function extractRosterMembers(
  payload: unknown,
  projectId: string,
): LabourRosterMembers {
  let current = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }
    const object = current as Record<string, unknown>;
    if (Array.isArray(object.groups) || Array.isArray(object.items)) break;
    if (!object.data || object.data === current) break;
    current = object.data;
  }

  const envelope =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};
  const memberMap = new Map<string, LabourRosterMember>();
  const groupMap = new Map<string, LabourRosterGroup>();

  const addMember = (member: LabourRosterMember | null) => {
    if (
      !member ||
      (projectId && member.project_id && member.project_id !== projectId)
    ) {
      return;
    }
    const existing = memberMap.get(member.id);

    memberMap.set(
      member.id,
      existing
        ? {
            ...existing,
            ...member,
            group_id: member.group_id || existing.group_id,
            group_name: member.group_name || existing.group_name,
            position: member.position ?? existing.position,
          }
        : member,
    );
  };

  if (Array.isArray(envelope.items)) {
    envelope.items.forEach((raw) => addMember(normalizeRosterMember(raw)));
  }

  if (Array.isArray(envelope.groups)) {
    envelope.groups.forEach((rawGroup) => {
      if (
        !rawGroup ||
        typeof rawGroup !== "object" ||
        Array.isArray(rawGroup)
      ) {
        return;
      }
      const object = rawGroup as Record<string, unknown>;
      const group = {
        group_id: rosterString(object, "group_id"),
        group_name: rosterString(object, "group_name") || "Ungrouped",
      };
      groupMap.set(group.group_id || group.group_name, group);
      if (Array.isArray(object.members)) {
        object.members.forEach((raw) =>
          addMember(normalizeRosterMember(raw, group)),
        );
      }
    });
  }

  memberMap.forEach((member) => {
    const group = {
      group_id: member.group_id,
      group_name: member.group_name || "Ungrouped",
    };
    groupMap.set(group.group_id || group.group_name, group);
  });

  return {
    groups: Array.from(groupMap.values()),
    members: Array.from(memberMap.values()),
    totalCount: Number(envelope.total_count ?? memberMap.size),
  };
}

function extractLabours(payload: unknown): LabourOption[] {
  let items: unknown = payload;

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const envelope = payload as {
      data?: unknown;
      items?: unknown;
      labours?: unknown;
    };
    items = envelope.data ?? envelope.items ?? envelope.labours;

    if (items && typeof items === "object" && !Array.isArray(items)) {
      const nested = items as {
        data?: unknown;
        items?: unknown;
        labours?: unknown;
        labour?: unknown;
      };
      items = nested.data ?? nested.items ?? nested.labours ?? nested.labour;
    }
  }

  if (!Array.isArray(items)) return [];

  return items.flatMap((rawItem): LabourOption[] => {
    if (!rawItem || typeof rawItem !== "object") return [];
    const item = rawItem as LabourApiItem;
    const id =
      item.id ??
      item._id ??
      item.labour_id ??
      item.employee_id ??
      item.employee?.id ??
      item.employee?._id ??
      item.user?.id ??
      item.user?._id;
    const name =
      item.full_name ??
      item.name ??
      item.employee_name ??
      item.worker_name ??
      item.employee?.full_name ??
      item.employee?.name ??
      item.user?.full_name ??
      item.user?.name;

    if (id == null || name == null) return [];
    return [
      {
        id: String(id),
        name: String(name),
        email: item.email == null ? undefined : String(item.email),
        role_id: item.role_id == null ? undefined : String(item.role_id),
        department_id:
          item.department_id == null ? undefined : String(item.department_id),
        avatar:
          item.avatar_url == null && item.avatar == null
            ? undefined
            : String(item.avatar_url ?? item.avatar),
        role:
          item.role == null || typeof item.role === "object"
            ? undefined
            : String(item.role),
        groupId:
          item.group_id == null &&
          item.labour_group_id == null &&
          item.group?.id == null
            ? undefined
            : String(item.group_id ?? item.labour_group_id ?? item.group?.id),
      },
    ];
  });
}

function extractReferenceOptions(
  payload: unknown,
  collectionKey: string,
): ReferenceOption[] {
  let items: unknown = payload;
  if (items && typeof items === "object" && !Array.isArray(items)) {
    const envelope = items as Record<string, unknown>;
    items = envelope.data ?? envelope.items ?? envelope[collectionKey];
    if (items && typeof items === "object" && !Array.isArray(items)) {
      const nested = items as Record<string, unknown>;
      items = nested.data ?? nested.items ?? nested[collectionKey];
    }
  }
  if (!Array.isArray(items)) return [];
  return items.flatMap((raw): ReferenceOption[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const id =
      item.id ?? item._id ?? item[`${collectionKey.replace(/s$/, "")}_id`];
    const name = item.name ?? item.title ?? item.label;
    return id == null || name == null
      ? []
      : [{ id: String(id), name: String(name) }];
  });
}

export function useProjects() {
  return useQuery<Project[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const response = await axios.get(PROJECT_URL);
      return extractProjects(response.data);
    },
    meta: { errorMessage: "Failed to load projects" },
  });
}

export function useProjectList(filters: ProjectListFilters = {}) {
  return useQuery<ProjectListResult, AxiosError<ApiResponseError>>({
    queryKey: [...projectKeys.all, "list", filters],
    queryFn: async () => {
      const response = await axios.get(PROJECT_URL, {
        params: {
          page_size: filters.pageSize,
          page_token: filters.pageToken || undefined,
          project_type_id: filters.projectTypeId || undefined,
          search: filters.search || undefined,
          status: filters.status || undefined,
          sort_by: filters.sortBy || undefined,
          sort_order: filters.sortDir || undefined,
        },
      });
      return extractProjectList(response.data);
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load projects" },
  });
}

export function useProjectDashboardSummary() {
  return useQuery<ProjectDashboardSummary, AxiosError<ApiResponseError>>({
    queryKey: projectKeys.dashboardSummary,
    queryFn: async () => {
      const response = await axios.get(PROJECT_DASHBOARD_SUMMARY_URL);
      let current: unknown = response.data;

      for (let depth = 0; depth < 5; depth += 1) {
        if (!current || typeof current !== "object" || Array.isArray(current)) {
          return {};
        }
        const object = current as Record<string, unknown>;
        const summary = Object.fromEntries(
          Object.entries(object).flatMap(([key, rawValue]) => {
            const count =
              typeof rawValue === "number" ? rawValue : Number(rawValue);
            return Number.isFinite(count) ? [[key, count]] : [];
          }),
        );
        if (Object.keys(summary).length) return summary;
        current = object.data ?? object.summary ?? object.result;
      }
      return {};
    },
    meta: { errorMessage: "Failed to load project dashboard summary" },
  });
}

export function useProjectTypes() {
  return useQuery<ReferenceOption[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.projectTypes,
    queryFn: async () =>
      extractReferenceOptions(
        (
          await axios.get(PROJECT_TYPE_URL, {
            params: { page_size: 1000 },
          })
        ).data,
        "project_types",
      ),
    meta: { errorMessage: "Failed to load project types" },
  });
}

export function useProject(id: string) {
  return useQuery<Project | null, AxiosError<ApiResponseError>>({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await axios.get(`${PROJECT_URL}/${id}`);
      return extractProject(response.data);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load project details" },
  });
}

export function useLabours() {
  return useQuery<LabourOption[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.labours,
    queryFn: async () => {
      const response = await axios.get(LABOUR_URL);
      return extractLabours(response.data);
    },
    meta: { errorMessage: "Failed to load project managers" },
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery<Project["project_team"], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.members(projectId),
    queryFn: async () => {
      const response = await axios.get(LABOUR_MEMBERS_URL, {
        params: { project_id: projectId },
      });
      return extractProjectMembers(response.data, projectId);
    },
    enabled: Boolean(projectId),
    meta: { errorMessage: "Failed to load project team members" },
  });
}

export function useRosterProjectMembers(
  projectId: string,
  filters: LabourMemberFilters = {},
) {
  return useQuery<LabourRosterMembers, AxiosError<ApiResponseError>>({
    queryKey: [...projectKeys.rosterMembers(projectId), filters],
    queryFn: async () => {
      const response = await axios.get(LABOUR_MEMBERS_URL, {
        params: {
          end_date: filters.endDate,
          group_id: filters.groupId,
          member_id: filters.memberId,
          page_size: filters.pageSize,
          page_token: filters.pageToken,
          project_id: projectId,
          start_date: filters.startDate,
        },
      });
      return extractRosterMembers(response.data, projectId);
    },
    enabled: Boolean(projectId),
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load rostering members" },
  });
}

export function useLabourMembers(filters: LabourMemberListFilters = {}) {
  return useQuery<LabourRosterMembers, AxiosError<ApiResponseError>>({
    queryKey: ["construction-labour-members-list", filters],
    queryFn: async () => {
      const response = await axios.get(LABOUR_MEMBERS_URL, {
        params: {
          end_date: filters.endDate,
          group_id: filters.groupId,
          member_id: filters.memberId,
          page_size: filters.pageSize,
          page_token: filters.pageToken,
          project_id: filters.projectId,
          start_date: filters.startDate,
        },
      });
      return extractRosterMembers(response.data, filters.projectId ?? "");
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load labour members" },
  });
}

export function useRoles() {
  return useQuery<ReferenceOption[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.roles,
    queryFn: async () =>
      extractReferenceOptions(
        (await axios.get(ROLE_URL, { params: { page_size: 1000 } })).data,
        "roles",
      ),
    meta: { errorMessage: "Failed to load project roles" },
  });
}

export function useDepartments() {
  return useQuery<ReferenceOption[], AxiosError<ApiResponseError>>({
    queryKey: projectKeys.departments,
    queryFn: async () =>
      extractReferenceOptions(
        (await axios.get(DEPARTMENT_URL)).data,
        "departments",
      ),
    meta: { errorMessage: "Failed to load departments" },
  });
}

export function useProjectEnums() {
  return useQuery<ProjectEnums, AxiosError<ApiResponseError>>({
    queryKey: projectKeys.enums,
    queryFn: async () => extractProjectEnums((await axios.get(ENUMS_URL)).data),
    meta: { errorMessage: "Failed to load project enums" },
  });
}

export function useAddProjectMembers() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown[],
    AxiosError<ApiResponseError>,
    LabourMemberPayload[]
  >({
    mutationFn: async (members) =>
      Promise.all(
        members.map(
          async (member) => (await axios.post(LABOUR_MEMBERS_URL, member)).data,
        ),
      ),
    meta: {
      errorMessage: "Failed to add project team members",
      successMessage: "Project team members added successfully",
    },
    onSuccess: (_, members) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.labours });
      const projectId = members[0]?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(projectId),
        });
        queryClient.invalidateQueries({
          queryKey: projectKeys.members(projectId),
        });
        queryClient.invalidateQueries({
          queryKey: projectKeys.rosterMembers(projectId),
        });
      }
    },
  });
}

export function useUpdateProjectMembers() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown[],
    AxiosError<ApiResponseError>,
    LabourMemberUpdate[]
  >({
    mutationFn: async (members) =>
      Promise.all(
        members.map(
          async ({ id, payload }) =>
            (await axios.put(`${LABOUR_MEMBERS_URL}/${id}`, payload)).data,
        ),
      ),
    meta: {
      errorMessage: "Failed to update project team members",
      successMessage: "Project team members updated successfully",
    },
    onSuccess: (_, members) => {
      const projectId = members[0]?.payload.project_id;
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(projectId),
        });
        queryClient.invalidateQueries({
          queryKey: projectKeys.members(projectId),
        });
        queryClient.invalidateQueries({
          queryKey: projectKeys.rosterMembers(projectId),
        });
      }
    },
  });
}

export function useUpdateProjectMemberDates() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    LabourMemberDateUpdate
  >({
    mutationFn: async ({ end_date, group_id, id, start_date }) =>
      (
        await axios.put(`${LABOUR_MEMBERS_URL}/${id}`, {
          end_date,
          ...(group_id ? { group_id } : {}),
          start_date,
        })
      ).data,
    meta: {
      errorMessage: "Failed to update member dates",
      successMessage: "Member dates updated successfully",
    },
    onSuccess: async (_, { projectId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(projectId),
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: projectKeys.members(projectId),
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: projectKeys.rosterMembers(projectId),
          refetchType: "active",
        }),
      ]);
    },
  });
}

export function useUpdateProjectMemberOrder() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    LabourMemberOrderPayload
  >({
    mutationFn: async (payload) =>
      (await axios.put(`${LABOUR_MEMBERS_URL}/order`, payload)).data,
    meta: {
      errorMessage: "Failed to update member order",
      successMessage: "Member order updated successfully",
    },
    onSuccess: (_, payload) =>
      queryClient.invalidateQueries({
        queryKey: projectKeys.rosterMembers(payload.project_id),
      }),
  });
}

export function useBulkDeleteProjectMembers() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    LabourMemberBulkDelete
  >({
    mutationFn: async ({ ids }) =>
      (
        await axios.post(`${LABOUR_MEMBERS_URL}/bulk`, {
          ids,
        })
      ).data,
    meta: {
      errorMessage: "Failed to delete project team members",
      successMessage: "Project team members deleted successfully",
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.rosterMembers(projectId),
      });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, ProjectPayload>({
    mutationFn: async (payload) => {
      const { type, ...projectPayload } = payload;
      return (
        await axios.post(PROJECT_URL, {
          ...projectPayload,
          project_type_id: type,
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to create project",
      successMessage: "Project created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: ProjectPayload }
  >({
    mutationFn: async ({ id, payload }) => {
      const { project_team: _projectTeam, type, ...projectPayload } = payload;
      return (
        await axios.put(`${PROJECT_URL}/${id}`, {
          ...projectPayload,
          project_type_id: type,
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to update project",
      successMessage: "Project updated successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${PROJECT_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete project",
      successMessage: "Project deleted successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
