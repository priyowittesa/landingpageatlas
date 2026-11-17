"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

export type RefOption = { label: string; value: string };

/**
 * Query keys here MUST match the ones used by the dropdown queries
 * (see equipment `use-equipment.ts` -> ["construction-ref", <key>]) so that
 * creating a new record invalidates and refreshes the matching dropdown.
 */
const REF_URLS = {
  "equipment-category": "/v1/construction/equipment-category",
  "units-of-measure": "/v1/construction/units-of-measure",
  companies: "/v1/construction/companies",
  department: "/v1/construction/department",
  position: "/v1/construction/position",
  project: "/v1/construction/project",
  "equipment-type-class": "/v1/construction/equipment-type-class",
} as const;

type RefKey = keyof typeof REF_URLS;

/** Digs into a create response to build a { label, value } option for auto-select. */
function extractCreatedOption(payload: unknown): RefOption {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    if (object.id ?? object._id ?? object.uuid) break;
    const nested = object.data ?? object.item ?? object.result;
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) break;
    current = nested;
  }
  const item = (current && typeof current === "object" ? current : {}) as Record<
    string,
    unknown
  >;
  const value = String(item.id ?? item._id ?? item.uuid ?? item.code ?? "");
  const label = String(
    item.name ?? item.label ?? item.title ?? item.code ?? value,
  );
  return { label, value };
}

function useCreateRef<TPayload>(
  key: RefKey,
  messages: { successMessage: string; errorMessage: string },
) {
  const queryClient = useQueryClient();
  return useMutation<RefOption, AxiosError<ApiResponseError>, TPayload>({
    mutationFn: async (payload) =>
      extractCreatedOption((await axios.post(REF_URLS[key], payload)).data),
    meta: messages,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["construction-ref", key] }),
  });
}

export type EquipmentCategoryPayload = {
  name: string;
  description?: string;
  sort_order?: number;
};

export type UnitOfMeasurePayload = {
  code: string;
  label: string;
  measure_type?: string;
  sort_order?: number;
};

export type CompanyPayload = {
  name: string;
  registration_no?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active?: boolean;
};

export type DepartmentPayload = {
  name: string;
  cost_center_code?: string;
  description?: string;
  is_active?: boolean;
};

export type PositionPayload = {
  name: string;
  description?: string;
  is_active?: boolean;
};

export type ProjectPayload = {
  title: string;
  code?: string;
  client_name?: string;
  description?: string;
  location?: string;
  address?: string;
  priority?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  project_manager_id?: string;
  project_type_id?: string;
  tags?: string[];
};

export function useCreateEquipmentCategory() {
  return useCreateRef<EquipmentCategoryPayload>("equipment-category", {
    successMessage: "Category created successfully",
    errorMessage: "Failed to create category",
  });
}

export function useCreateUnitOfMeasure() {
  return useCreateRef<UnitOfMeasurePayload>("units-of-measure", {
    successMessage: "Unit created successfully",
    errorMessage: "Failed to create unit",
  });
}

export function useCreateCompany() {
  return useCreateRef<CompanyPayload>("companies", {
    successMessage: "Company created successfully",
    errorMessage: "Failed to create company",
  });
}

export function useCreateDepartment() {
  return useCreateRef<DepartmentPayload>("department", {
    successMessage: "Department created successfully",
    errorMessage: "Failed to create department",
  });
}

export function useCreatePosition() {
  return useCreateRef<PositionPayload>("position", {
    successMessage: "Position created successfully",
    errorMessage: "Failed to create position",
  });
}

export function useCreateProject() {
  return useCreateRef<ProjectPayload>("project", {
    successMessage: "Project created successfully",
    errorMessage: "Failed to create project",
  });
}

export type EquipmentTypeClassPayload = {
  category_id: string;
  name: string;
};

export function useCreateEquipmentTypeClass() {
  const queryClient = useQueryClient();
  return useMutation<RefOption, AxiosError<ApiResponseError>, EquipmentTypeClassPayload>({
    mutationFn: async (payload) =>
      extractCreatedOption(
        (await axios.post(REF_URLS["equipment-type-class"], payload)).data,
      ),
    meta: {
      successMessage: "Type / Class created successfully",
      errorMessage: "Failed to create type / class",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["construction-ref", "equipment-type-class"],
      }),
  });
}
