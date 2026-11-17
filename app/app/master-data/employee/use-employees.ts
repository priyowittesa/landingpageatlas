"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  Employee,
  EmployeeForm,
  EmployeePayload,
} from "@/types/type-employee";

const LABOUR_URL = "/v1/construction/labour";
const DEPARTMENT_URL = "/v1/construction/department";
const POSITION_URL = "/v1/construction/position";
const ROLE_URL = "/v1/construction/role";
const ENUMS_URL = "/v1/construction/enums";
const axios = axiosConfig(env.apiBaseUrl);

const employeeKeys = {
  all: ["construction-labours"] as const,
  detail: (id: string) => ["construction-labours", id] as const,
  departments: ["construction-departments"] as const,
  positions: ["construction-positions"] as const,
  roles: ["construction-roles"] as const,
  labourTypes: ["construction-enums", "labour_type"] as const,
};

export interface ReferenceOption {
  id: string;
  name: string;
}

export interface ConstructionEnumOption {
  label: string;
  value: string;
}

export interface ConstructionEnumsResponse {
  labour_gender: ConstructionEnumOption[];
  labour_status: ConstructionEnumOption[];
  labour_type: ConstructionEnumOption[];
  project_priority: ConstructionEnumOption[];
  project_status: ConstructionEnumOption[];
  rate_card_currency: ConstructionEnumOption[];
  rate_card_unit: ConstructionEnumOption[];
}

export type LabourEnums = Pick<
  ConstructionEnumsResponse,
  "labour_gender" | "labour_status" | "labour_type"
>;

const EMPTY_LABOUR_ENUMS: LabourEnums = {
  labour_gender: [],
  labour_status: [],
  labour_type: [],
};

export interface EmployeeListFilters {
  pageSize?: number;
  pageToken?: string;
  departmentId?: string;
  positionId?: string;
  roleId?: string;
  status?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface EmployeeListResult {
  items: Employee[];
  nextPageToken: string;
  totalCount: number;
}

function findList(value: unknown, keys: string[], depth = 0): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 5) return [];

  const object = value as Record<string, unknown>;
  for (const key of keys) {
    if (object[key] === undefined) continue;
    const list = findList(object[key], keys, depth + 1);
    if (list.length || Array.isArray(object[key])) return list;
  }
  return [];
}

function relation(
  item: Record<string, unknown>,
  key: "department" | "position" | "role",
): { id: string; name: string } {
  const nested = item[key];
  const object =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : {};
  return {
    id: String(item[`${key}_id`] ?? object.id ?? object._id ?? ""),
    name: String(
      item[`${key}_name`] ??
        object.name ??
        object.title ??
        (typeof nested === "string" ? nested : ""),
    ),
  };
}

function enumValue(
  value: unknown,
  backendPrefix: "LABOUR_GENDER_" | "LABOUR_STATUS_" | "LABOUR_TYPE_",
): string {
  let result = "";
  if (value == null) return result;
  if (typeof value === "boolean") {
    result = value ? "active" : "inactive";
  } else if (typeof value === "string" || typeof value === "number") {
    result = String(value);
  } else if (typeof value === "object" && !Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    result = String(item.value ?? item.code ?? item.id ?? item.name ?? "");
  }

  const trimmed = result.trim();
  if (trimmed.toUpperCase().startsWith(backendPrefix)) {
    return trimmed.slice(backendPrefix.length).toLowerCase();
  }
  return trimmed;
}

function identifierList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.flatMap((raw): string[] => {
        if (typeof raw === "string" || typeof raw === "number") {
          const id = String(raw).trim();
          return id ? [id] : [];
        }
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

        const item = raw as Record<string, unknown>;
        const id = item.id ?? item._id ?? item.shift_id;
        return id == null || String(id).trim() === "" ? [] : [String(id)];
      }),
    ),
  );
}

function normalizeEmployee(raw: unknown, index: number): Employee {
  const item =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const department = relation(item, "department");
  const position = relation(item, "position");
  const role = relation(item, "role");

  return {
    id: String(item.id ?? item._id ?? item.labour_id ?? index),
    address: String(item.address ?? ""),
    code: String(item.code ?? item.employee_code ?? ""),
    date_of_birth: String(item.date_of_birth ?? item.birth_date ?? ""),
    department_id: department.id,
    department_name: department.name,
    email: String(item.email ?? ""),
    full_name: String(item.full_name ?? item.name ?? "Unnamed employee"),
    gender: enumValue(
      item.gender ?? item.labour_gender,
      "LABOUR_GENDER_",
    ),
    phone_number: String(item.phone_number ?? item.phone ?? ""),
    position_id: position.id,
    position_name: position.name,
    preferred_name: String(item.preferred_name ?? ""),
    role_id: role.id,
    role_name: role.name,
    type: enumValue(
      item.type ?? item.labour_type ?? item.employment_type,
      "LABOUR_TYPE_",
    ),
    available_shift_ids: identifierList(
      item.available_shift_ids ?? item.available_shifts ?? item.shifts,
    ),
    status: enumValue(
      item.status ??
        item.labour_status ??
        item.employment_status ??
        item.is_active,
      "LABOUR_STATUS_",
    ),
    contract_end_date: String(item.contract_end_date ?? ""),
    rate_card_id: String(
      item.rate_card_id ??
        item.default_rate_card_id ??
        item.default_rate_card ??
        (
          item.rate_card &&
          typeof item.rate_card === "object" &&
          !Array.isArray(item.rate_card)
            ? (item.rate_card as Record<string, unknown>).id
            : ""
        ) ??
        "",
    ),
    cost_rate: String(item.cost_rate ?? ""),
    note: String(item.note ?? item.notes ?? ""),
    avatar_url:
      item.avatar_url == null && item.avatar == null
        ? undefined
        : String(item.avatar_url ?? item.avatar),
  };
}

function extractEmployees(payload: unknown): Employee[] {
  return findList(payload, [
    "data",
    "items",
    "labours",
    "labour",
    "employees",
    "results",
    "records",
    "rows",
  ]).map(normalizeEmployee);
}

function extractEmployee(payload: unknown): Employee | null {
  let current = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    const nested = object.data ?? object.labour ?? object.employee ?? object.item;
    if (!nested || Array.isArray(nested)) break;
    current = nested;
  }
  return current && typeof current === "object" && !Array.isArray(current)
    ? normalizeEmployee(current, 0)
    : null;
}

function extractReferences(payload: unknown, collectionKey: string): ReferenceOption[] {
  return findList(payload, [
    "data",
    "items",
    collectionKey,
    collectionKey.replace(/s$/, ""),
    "results",
    "records",
  ]).flatMap((raw): ReferenceOption[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const singular = collectionKey.replace(/s$/, "");
    const id = item.id ?? item._id ?? item[`${singular}_id`];
    const name = item.name ?? item.title ?? item.label ?? item.code;
    return id == null || name == null
      ? []
      : [{ id: String(id), name: String(name) }];
  });
}

function normalizeEnumOptions(value: unknown): ConstructionEnumOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): ConstructionEnumOption[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    if (item.label == null || item.value == null) return [];
    return [{ label: String(item.label), value: String(item.value) }];
  });
}

function extractLabourEnums(payload: unknown): LabourEnums {
  let current = payload;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return EMPTY_LABOUR_ENUMS;
    }

    const object = current as Record<string, unknown>;
    if (
      Array.isArray(object.labour_gender) ||
      Array.isArray(object.labour_status) ||
      Array.isArray(object.labour_type)
    ) {
      return {
        labour_gender: normalizeEnumOptions(object.labour_gender),
        labour_status: normalizeEnumOptions(object.labour_status),
        labour_type: normalizeEnumOptions(object.labour_type),
      };
    }

    current = object.data ?? object.enums ?? object.items;
  }

  return EMPTY_LABOUR_ENUMS;
}

export function employeeToForm(employee: Employee): EmployeeForm {
  return {
    address: employee.address,
    code: employee.code,
    date_of_birth: toFormDate(employee.date_of_birth),
    department_id: employee.department_id,
    email: employee.email,
    full_name: employee.full_name,
    gender: employee.gender,
    phone_number: employee.phone_number,
    position_id: employee.position_id,
    preferred_name: employee.preferred_name ?? "",
    role_id: employee.role_id,
    type: employee.type,
    available_shift_ids: employee.available_shift_ids ?? [],
    status: employee.status,
    contract_end_date: toFormDate(employee.contract_end_date),
    rate_card_id: employee.rate_card_id,
    cost_rate: employee.cost_rate,
    note: employee.note,
  };
}

function toFormDate(value: string): string {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : value;
}

function buildEmployeePayload(payload: EmployeeForm): EmployeePayload {
  const toApiDate = (value: string | undefined) => {
    const dateMatch = (value ?? "").match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
    );
    return dateMatch
      ? `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`
      : (value ?? "");
  };

  return {
    address: payload.address ?? "",
    code: payload.code,
    date_of_birth: toApiDate(payload.date_of_birth),
    department_id: payload.department_id ?? "",
    email: payload.email,
    full_name: payload.full_name,
    gender: payload.gender ?? "",
    phone_number: payload.phone_number,
    position_id: payload.position_id ?? "",
    preferred_name: payload.preferred_name ?? "",
    role_id: payload.role_id ?? "",
    type: payload.type ?? "",
    available_shift_ids: payload.available_shift_ids,
    status: payload.status,
    contract_end_date: toApiDate(payload.contract_end_date),
    rate_card_id: payload.rate_card_id ?? "",
    cost_rate: payload.cost_rate ?? "",
    note: payload.note ?? "",
  };
}

function extractEmployeeList(payload: unknown): EmployeeListResult {
  const items = extractEmployees(payload);
  let current = payload;
  let nextPageToken = "";
  let totalCount: number | undefined;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const envelope = current as Record<string, unknown>;
    const token = envelope.next_page_token ?? envelope.nextPageToken;
    const count = envelope.total_count ?? envelope.totalCount;
    if (token != null) nextPageToken = String(token);
    if (count != null && Number.isFinite(Number(count))) {
      totalCount = Number(count);
    }
    current = envelope.data ?? envelope.result ?? envelope.labours;
  }

  return {
    items,
    nextPageToken,
    totalCount: totalCount ?? items.length,
  };
}

export function useEmployees() {
  return useQuery<Employee[], AxiosError<ApiResponseError>>({
    queryKey: employeeKeys.all,
    queryFn: async () => extractEmployees((await axios.get(LABOUR_URL)).data),
    meta: { errorMessage: "Failed to load employees" },
  });
}

export function useEmployeeList(filters: EmployeeListFilters = {}) {
  return useQuery<EmployeeListResult, AxiosError<ApiResponseError>>({
    queryKey: [...employeeKeys.all, "list", filters],
    queryFn: async () => {
      const response = await axios.get(LABOUR_URL, {
        params: {
          page_size: filters.pageSize,
          page_token: filters.pageToken || undefined,
          department_id: filters.departmentId || undefined,
          position_id: filters.positionId || undefined,
          role_id: filters.roleId || undefined,
          status: filters.status || undefined,
          type: filters.type || undefined,
          search: filters.search || undefined,
          sort_by: filters.sortBy || undefined,
          sort_order: filters.sortDir || undefined,
        },
      });
      return extractEmployeeList(response.data);
    },
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load employees" },
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee | null, AxiosError<ApiResponseError>>({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => extractEmployee((await axios.get(`${LABOUR_URL}/${id}`)).data),
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load employee details" },
  });
}

function useReferences(url: string, key: readonly string[], collectionKey: string) {
  return useQuery<ReferenceOption[], AxiosError<ApiResponseError>>({
    queryKey: key,
    queryFn: async () => extractReferences((await axios.get(url)).data, collectionKey),
    meta: { errorMessage: `Failed to load ${collectionKey}` },
  });
}

export function useEmployeeDepartments() {
  return useReferences(DEPARTMENT_URL, employeeKeys.departments, "departments");
}

export function useEmployeePositions() {
  return useReferences(POSITION_URL, employeeKeys.positions, "positions");
}

export function useEmployeeRoles() {
  return useReferences(ROLE_URL, employeeKeys.roles, "roles");
}

export function useLabourEnums() {
  return useQuery<LabourEnums, AxiosError<ApiResponseError>>({
    queryKey: employeeKeys.labourTypes,
    queryFn: async () =>
      extractLabourEnums((await axios.get(ENUMS_URL)).data),
    meta: { errorMessage: "Failed to load labour enums" },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, EmployeeForm>({
    mutationFn: async (payload) =>
      (
        await axios.post(LABOUR_URL, {
          ...buildEmployeePayload(payload),
          temporary_password: "Qwerty123*",
        })
      ).data,
    meta: {
      errorMessage: "Failed to create employee",
      successMessage: "Employee created successfully",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: EmployeeForm }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.put(`${LABOUR_URL}/${id}`, buildEmployeePayload(payload))).data,
    meta: {
      errorMessage: "Failed to update employee",
      successMessage: "Employee updated successfully",
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${LABOUR_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete employee",
      successMessage: "Employee deleted successfully",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
