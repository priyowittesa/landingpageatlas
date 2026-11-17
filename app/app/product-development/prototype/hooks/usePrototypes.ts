"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  AddFeedbackDto,
  AddTestResultDto,
  IterationFile,
  PrototypeFilter,
  PrototypeIteration,
  PrototypeIterationDetail,
  PrototypeListResult,
  PrototypeApprovalDto,
  TestResult,
  IterationFeedback,
} from "../types";

const axios = axiosConfig(env.apiBaseUrl);

const LIST_URL = "/v1/manufacturing/engineering/prototypes";
const DETAIL_URL = "/v1/manufacturing/engineering/prototypes";

function formatFileSize(value: unknown): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return value ? String(value) : "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const prototypeKeys = {
  all: ["product-development-prototypes"] as const,
  list: (params?: PrototypeFilter) =>
    [...prototypeKeys.all, "list", params] as const,
  detail: (id: string) => [...prototypeKeys.all, "detail", id] as const,
  feedbacks: (id: string) => [...prototypeKeys.all, "feedbacks", id] as const,
  tests: (id: string) => [...prototypeKeys.all, "tests", id] as const,
};

function normalizeFile(raw: unknown): IterationFile {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  return {
    id: String(row.id ?? ""),
    file_name: String(row.file_name ?? row.original_name ?? row.name ?? ""),
    file_size: formatFileSize(row.file_size_bytes ?? row.file_size ?? row.size),
    uploaded_by: String(row.uploaded_by ?? row.created_by_name ?? ""),
    uploaded_at: String(row.uploaded_at ?? row.created_at ?? ""),
    url: String(row.url ?? row.file_url ?? row.download_url ?? ""),
    file_type: String(
      row.file_type ?? row.file_extension ?? row.extension ?? row.mime_type ?? ""
    ),
  };
}

function normalizeIteration(raw: unknown): PrototypeIteration {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  const project = (row.project ?? row.project_planning ?? {}) as Record<string, unknown>;
  const designVersion = (row.design_version ?? {}) as Record<string, unknown>;
  const design = (designVersion.design ?? row.design ?? {}) as Record<string, unknown>;
  const assignee = (row.assignee ?? {}) as Record<string, unknown>;
  const requestClassification = (
    row.request_classification && typeof row.request_classification === "object"
      ? row.request_classification
      : {}
  ) as Record<string, unknown>;
  const createdBy = (row.created_by && typeof row.created_by === "object"
    ? row.created_by
    : {}) as Record<string, unknown>;
  const files = Array.isArray(row.build_reference_files)
    ? row.build_reference_files
    : Array.isArray(row.request_documents)
      ? row.request_documents
      : Array.isArray(row.files)
      ? row.files
      : Array.isArray(row.attachments)
        ? row.attachments
        : [];
  const testsTotal = Number(row.tests_total ?? row.count_tests ?? row.test_count ?? 0);
  const testsPassed = Number(
    row.tests_passed ?? row.count_tests_passed ?? row.passed_count ?? 0
  );

  return {
    id: String(row.id ?? ""),
    iteration_no: String(row.iteration_no ?? row.prototype_no ?? row.code ?? ""),
    iteration_index: Number(row.iteration_index ?? row.iteration ?? row.version_no ?? 1),
    name: String(row.name ?? row.title ?? design.name ?? design.title ?? ""),
    revision: String(row.revision ?? row.revision_label ?? designVersion.version_label ?? "Rev A"),
    description: String(row.description ?? ""),
    build_method: String(row.build_method ?? row.manufacturing_method ?? ""),
    status: (row.status as PrototypeIteration["status"]) ?? "draft",
    project: {
      id: String(project.id ?? row.project_id ?? design.project_id ?? ""),
      project_no: String(project.project_no ?? row.project_no ?? row.project_code ?? ""),
      name: String(project.name ?? row.project_name ?? ""),
    },
    assignee: {
      id: String(assignee.id ?? row.project_manager_id ?? ""),
      name: String(
        assignee.name ??
          row.assignee_name ??
          row.project_manager_name ??
          row.created_by_name ??
          "Unassigned"
      ),
      initials: String(assignee.initials ?? ""),
    },
    due_date: String(row.due_date_at ?? row.due_date ?? ""),
    tests_total: testsTotal,
    tests_passed: testsPassed,
    pass_rate: Number(
      row.pass_rate ??
        (testsTotal > 0
          ? Math.round((testsPassed / testsTotal) * 100)
          : 0)
    ),
    test_plan: String(row.test_plan ?? ""),
    technical_notes: String(
      row.request_notes ??
        requestClassification.notes ??
        row.technical_notes ??
        row.notes ??
        row.test_plan ??
        ""
    ),
    requirement_note: String(row.requirement_note ?? row.requirements_note ?? ""),
    created_by: String(
      row.created_by_name ??
        row.project_manager_name ??
        createdBy.name ??
        row.created_by ??
        assignee.name ??
        ""
    ),
    build_reference_files: files.map(normalizeFile),
    created_at: String(row.created_at ?? ""),
  };
}

function normalizeTestResult(raw: unknown): TestResult {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  const rawStatus = String(row.status ?? "pending").toLowerCase();
  const status = (
    rawStatus === "passed"
      ? "pass"
      : rawStatus === "failed"
        ? "fail"
        : rawStatus === "testing"
          ? "pending"
          : rawStatus
  ) as TestResult["status"];
  return {
    id: String(row.id ?? ""),
    test_name: String(row.test_name ?? row.name ?? ""),
    criteria: String(row.criteria ?? row.expected_result ?? row.description ?? ""),
    actual_result: String(row.actual_result ?? ""),
    status,
    tested_by: String(row.tested_by ?? row.tested_by_name ?? ""),
    tested_by_id: String(row.tested_by_id ?? ""),
    description: String(row.description ?? ""),
    tested_at: String(row.tested_at ?? row.date ?? ""),
    comments: String(row.comments ?? ""),
  };
}

function normalizeFeedback(raw: unknown): IterationFeedback {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  const createdBy = (row.created_by && typeof row.created_by === "object"
    ? row.created_by
    : {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    author: String(
      row.author ?? row.created_by_name ?? row.commenter_name ?? createdBy.name ?? ""
    ),
    role: String(row.role ?? row.created_by_role ?? createdBy.role ?? ""),
    text: String(row.text ?? row.comment ?? ""),
    category: String(row.category ?? row.comment_type ?? ""),
    source: String(row.source ?? ""),
    source_ref_id: String(row.source_ref_id ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

function extractFeedbacks(payload: unknown): IterationFeedback[] {
  if (Array.isArray(payload)) return payload.map(normalizeFeedback);
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "feedbacks", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizeFeedback);
    if (value && typeof value === "object") {
      const nested = extractFeedbacks(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function extractTests(payload: unknown): TestResult[] {
  if (Array.isArray(payload)) return payload.map(normalizeTestResult);
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "tests", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizeTestResult);
    if (value && typeof value === "object") {
      const nested = extractTests(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function toFeedbackPayload(payload: AddFeedbackDto) {
  return {
    comment: payload.comment ?? payload.text ?? "",
    comment_type: payload.comment_type ?? payload.category ?? "general",
    source: payload.source ?? "web",
    source_ref_id: payload.source_ref_id ?? "",
  };
}

function toRfc3339Date(value?: string) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function toTestPayload(payload: AddTestResultDto) {
  return {
    actual_result: payload.actual_result ?? "",
    date: toRfc3339Date(payload.date ?? payload.tested_at),
    description: payload.description ?? "",
    expected_result: payload.expected_result ?? payload.criteria ?? "",
    name: payload.name ?? payload.test_name ?? "",
    status: payload.status,
    tested_by_id: payload.tested_by_id ?? "",
    tested_by_name: payload.tested_by_name ?? payload.tested_by ?? "",
  };
}

function normalizeIterationDetail(raw: unknown): PrototypeIterationDetail {
  const base = normalizeIteration(raw);
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  return {
    ...base,
    test_results: Array.isArray(row.test_results)
      ? row.test_results.map(normalizeTestResult)
      : [],
    feedback: Array.isArray(row.feedback)
      ? row.feedback.map(normalizeFeedback)
      : [],
  };
}

function extractList(payload: unknown): PrototypeIteration[] {
  if (Array.isArray(payload)) return payload.map(normalizeIteration);
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "iterations", "prototypes", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizeIteration);
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function extractListMeta(payload: unknown): { next_page_token: string; total_count: number } {
  if (!payload || typeof payload !== "object") {
    return { next_page_token: "", total_count: 0 };
  }
  const obj = payload as Record<string, unknown>;
  const nextPageToken = String(obj.next_page_token ?? obj.nextPageToken ?? "");
  const totalCount = Number(obj.total_count ?? obj.totalCount ?? obj.count ?? 0);
  if (nextPageToken || totalCount) {
    return { next_page_token: nextPageToken, total_count: totalCount };
  }
  for (const key of ["data", "pagination", "meta"]) {
    const nested = extractListMeta(obj[key]);
    if (nested.next_page_token || nested.total_count) return nested;
  }
  return { next_page_token: "", total_count: 0 };
}

export function usePrototypeList(params: PrototypeFilter = {}) {
  return useQuery<PrototypeListResult, AxiosError<ApiResponseError>>({
    queryKey: prototypeKeys.list(params),
    queryFn: async () => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "")
          query[key] = String(value);
      }
      const res = await axios.get(LIST_URL, { params: query });
      const items = extractList(res.data);
      const meta = extractListMeta(res.data);
      return {
        items,
        next_page_token: meta.next_page_token,
        total_count: meta.total_count || items.length,
      };
    },
    meta: { errorMessage: "Failed to load prototype iterations" },
  });
}

export function usePrototype(id?: string) {
  return useQuery<PrototypeIterationDetail | null, AxiosError<ApiResponseError>>({
    queryKey: prototypeKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`${DETAIL_URL}/${id}`);
      const data = res.data as Record<string, unknown>;
      const raw = data?.data ?? data?.prototype ?? data?.iteration ?? data?.result ?? data;
      if (!raw || typeof raw !== "object") return null;
      return normalizeIterationDetail(raw);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load prototype iteration" },
  });
}

export function usePrototypeFeedbacks(id?: string) {
  return useQuery<IterationFeedback[], AxiosError<ApiResponseError>>({
    queryKey: prototypeKeys.feedbacks(id ?? ""),
    queryFn: async () => {
      if (!id) return [];
      const res = await axios.get(`${DETAIL_URL}/${id}/feedbacks`, {
        params: { page_size: 100 },
      });
      return extractFeedbacks(res.data);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load prototype feedback" },
  });
}

export function usePrototypeTests(id?: string) {
  return useQuery<TestResult[], AxiosError<ApiResponseError>>({
    queryKey: prototypeKeys.tests(id ?? ""),
    queryFn: async () => {
      if (!id) return [];
      const res = await axios.get(`${DETAIL_URL}/${id}/tests`, {
        params: { page_size: 100 },
      });
      return extractTests(res.data);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load prototype tests" },
  });
}

export function useAddTestResult() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: AddTestResultDto }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.post(`${DETAIL_URL}/${id}/tests`, toTestPayload(payload))).data,
    meta: {
      errorMessage: "Failed to add test result",
      successMessage: "Test result added",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.tests(id) });
    },
  });
}

export function useUpdateTestResult() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    {
      id: string;
      test_result_id: string;
      payload: AddTestResultDto;
    }
  >({
    mutationFn: async ({ id, test_result_id, payload }) =>
      (
        await axios.put(`${DETAIL_URL}/${id}/tests/${test_result_id}`, toTestPayload(payload))
      ).data,
    meta: {
      errorMessage: "Failed to update test result",
      successMessage: "Test result updated",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.tests(id) });
    },
  });
}

export function useDeleteTestResult() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; test_result_id: string }
  >({
    mutationFn: async ({ id, test_result_id }) =>
      (await axios.delete(`${DETAIL_URL}/${id}/tests/${test_result_id}`)).data,
    meta: {
      errorMessage: "Failed to delete test result",
      successMessage: "Test result deleted",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.tests(id) });
    },
  });
}

export function useAddFeedback() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: AddFeedbackDto }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.post(`${DETAIL_URL}/${id}/feedbacks`, toFeedbackPayload(payload))).data,
    meta: {
      errorMessage: "Failed to post feedback",
      successMessage: "Feedback posted",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.feedbacks(id) });
    },
  });
}


export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; feedbackId: string; payload: AddFeedbackDto }
  >({
    mutationFn: async ({ id, feedbackId, payload }) =>
      (
        await axios.put(
          `${DETAIL_URL}/${id}/feedbacks/${feedbackId}`,
          toFeedbackPayload(payload)
        )
      ).data,
    meta: {
      errorMessage: "Failed to update feedback",
      successMessage: "Feedback updated",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.feedbacks(id) });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; feedbackId: string }
  >({
    mutationFn: async ({ id, feedbackId }) =>
      (await axios.delete(`${DETAIL_URL}/${id}/feedbacks/${feedbackId}`)).data,
    meta: {
      errorMessage: "Failed to delete feedback",
      successMessage: "Feedback deleted",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.feedbacks(id) });
    },
  });
}

export function useCreatePrototypeApproval() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: PrototypeApprovalDto }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.post(`${DETAIL_URL}/${id}/approvals`, payload)).data,
    meta: {
      errorMessage: "Failed to submit prototype decision",
      successMessage: "Prototype decision submitted",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: prototypeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: prototypeKeys.all });
    },
  });
}
