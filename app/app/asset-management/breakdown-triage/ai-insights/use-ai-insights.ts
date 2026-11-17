"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { AiInsight, InsightSeverity, InsightStatus, InsightType } from "../lib/types";
import type { DismissReason } from "./insight-data";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/predictive-breakdown/ai-insights";
const KEY = ["asset-management", "ai-insights"] as const;

export type AiInsightFilters = {
  search?: string;
  type?: InsightType;
  severity?: string;
  status?: InsightStatus;
  page_size: number;
  page_token?: string;
};
export type AiInsightEventFilters = { search?: string; event_type?: string; page_size: number; page_token?: string };

export type AiInsightSummary = {
  open: number;
  highSeverity: number;
  assetsAffected: number;
  accepted: number;
  lastAnalyzedAt: string;
};

export type AiInsightEvent = {
  id: string;
  insightId: string | null;
  event: string;
  detail: string;
  by: string;
  at: string;
  insightTitle: string;
  insightCode: string;
  assetCode: string;
};

/** API event_type → label shown in the History tab. */
export const EVENT_TYPES: Record<string, string> = {
  created: "Created",
  accepted: "Accepted",
  snoozed: "Snoozed",
  dismissed: "Dismissed",
  reopened: "Reopened",
  asked_ai: "Asked AI",
};

const DISMISS_REASON_VALUES: Record<DismissReason, string> = {
  "Not relevant": "not_relevant",
  "Already handled": "already_handled",
  "The data is wrong": "wrong_data",
  Other: "other",
};

function object(value: unknown) { return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>; }
function unwrap(value: unknown) { let current = value; for (let i = 0; i < 3; i += 1) { const row = object(current); if (!("data" in row)) break; current = row.data; } return object(current); }
function text(value: unknown, fallback = "") { if (value && typeof value === "object") { const row = object(value); return String(row.name ?? row.full_name ?? row.code ?? fallback); } return value == null || value === "" ? fallback : String(value); }
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function capitalize(value: string) { return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value; }

/** "02 Nov 15:15", matching the timestamps the page used before the API. */
export function formatInsightTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${day} ${time}`;
}

function normalizeEvent(raw: unknown, index = 0): AiInsightEvent {
  const row = object(raw), insight = object(row.insight), actor = object(row.actor);
  const type = text(row.event_type ?? row.event ?? row.type).toLowerCase();
  return {
    id: text(row.id, String(index)),
    insightId: text(row.insight_id ?? insight.id) || null,
    event: EVENT_TYPES[type] ?? capitalize(type.replaceAll("_", " ")),
    detail: text(row.details ?? row.detail ?? row.note ?? row.description),
    by: text(row.actor_name ?? actor.name ?? actor.full_name ?? row.actor ?? row.by, "Atlas AI"),
    at: formatInsightTime(text(row.occurred_at ?? row.created_at ?? row.at)),
    insightTitle: text(row.insight_title ?? insight.title),
    insightCode: text(row.insight_code ?? insight.code),
    assetCode: text(row.asset_code ?? insight.asset_code),
  };
}

function normalizeInsight(raw: unknown, index = 0): AiInsight {
  const row = object(raw), asset = object(row.asset);
  const status = text(row.status, "open").toLowerCase() as InsightStatus;
  const confidence = Number(row.confidence ?? 0);
  const snoozedUntil = formatInsightTime(text(row.snoozed_until));
  // Events are newest first; the detail timeline expects oldest first.
  const log = list(row.events ?? row.activity).map(normalizeEvent).filter((event) => event.event !== "Created").reverse();
  return {
    id: text(row.id, String(index)),
    code: text(row.code),
    type: text(row.type, "recommendation").toLowerCase() as InsightType,
    severity: capitalize(text(row.severity, "low")) as InsightSeverity,
    assetId: text(row.asset_id ?? asset.id) || null,
    assetCode: text(row.asset_code ?? asset.code),
    assetName: text(row.asset_name ?? asset.name),
    codes: [],
    reportId: text(row.report_code) || null,
    partId: text(row.part_code) || null,
    confidence: confidence > 1 ? confidence / 100 : confidence,
    createdAt: formatInsightTime(text(row.generated_at ?? row.created_at)),
    title: text(row.title),
    description: text(row.description),
    basis: text(row.basis),
    why: list(row.reasons).map((reason) => text(reason)).filter(Boolean),
    suggestion: text(row.suggested_action),
    kind: text(row.action_kind, "config").toLowerCase() as AiInsight["kind"],
    actionLabel: text(row.action_label, "Accept"),
    qty: row.suggested_quantity != null ? Number(row.suggested_quantity) : row.quantity != null ? Number(row.quantity) : undefined,
    status,
    snoozedUntil: snoozedUntil || undefined,
    outcome:
      text(row.outcome ?? row.resolution) ||
      (status === "snoozed" && snoozedUntil ? `Snoozed until ${snoozedUntil}. It returns to Open automatically.` : undefined),
    log: log.map((event) => ({ event: event.detail ? `${event.event} · ${event.detail}` : event.event, by: event.by, at: event.at })),
    modelName: text(row.model_name),
    modelVersion: text(row.model_version),
    evidence: list(row.evidence).map((item) => {
      const evidence = object(item);
      return {
        sourceType: text(evidence.source_type),
        sourceCode: text(evidence.source_code),
        observedAt: formatInsightTime(text(evidence.observed_at)),
        snapshot: object(evidence.snapshot),
      };
    }),
  };
}

function page(body: Record<string, unknown>) {
  return {
    nextPageToken: text(body.next_page_token ?? body.nextPageToken),
    totalCount: Number(body.total_count ?? body.totalCount ?? 0),
  };
}

export function useAiInsights(filters: AiInsightFilters) {
  return useQuery<
    { items: AiInsight[]; typeCounts: Partial<Record<InsightType, number>>; nextPageToken: string; totalCount: number },
    AxiosError<ApiResponseError>
  >({
    queryKey: [...KEY, "list", filters],
    queryFn: async () => {
      const body = unwrap((await axios.get(URL, { params: filters })).data);
      const counts = object(body.type_counts);
      return {
        items: list(body.items ?? body.insights ?? body.results).map(normalizeInsight),
        typeCounts: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)])),
        ...page(body),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load AI insights" },
  });
}

export function useAiInsightSummary() {
  return useQuery<AiInsightSummary, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, "summary"],
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/summary`)).data);
      return {
        open: Number(body.open_count ?? 0),
        highSeverity: Number(body.open_high_severity_count ?? 0),
        assetsAffected: Number(body.assets_affected_count ?? 0),
        accepted: Number(body.accepted_last_30d_count ?? 0),
        lastAnalyzedAt: formatInsightTime(text(body.last_analyzed_at)),
      };
    },
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load AI insight summary" },
  });
}

/** Full insight with evidence and timeline; the list item is shown while it loads. */
export function useAiInsight(id: string | undefined, placeholder?: AiInsight) {
  return useQuery<AiInsight, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/${id}`)).data);
      return normalizeInsight(body.insight ?? body.item ?? body);
    },
    placeholderData: placeholder,
    meta: { errorMessage: "Failed to load AI insight" },
  });
}

export function useAiInsightEvents(filters: AiInsightEventFilters, enabled = true) {
  return useQuery<{ items: AiInsightEvent[]; nextPageToken: string; totalCount: number }, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, "events", filters],
    enabled,
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/events`, { params: filters })).data);
      return { items: list(body.items ?? body.events ?? body.results).map(normalizeEvent), ...page(body) };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load AI insight history" },
  });
}

function useInsightMutation<T>(mutationFn: (variables: T) => Promise<unknown>, successMessage: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, T>({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
    meta: { errorMessage: "AI insight action failed", successMessage },
  });
}

export type AcceptInsightPayload = {
  id: string;
  note?: string;
  inspect?: { assignee_id: string; assignee_name: string; due_date: string };
  purchase?: { quantity: number };
};
export function useAcceptInsight(successMessage: string) {
  return useInsightMutation<AcceptInsightPayload>(async ({ id, ...body }) => (await axios.post(`${URL}/${id}/accept`, body)).data, successMessage);
}
export function useDismissInsight() {
  return useInsightMutation<{ id: string; reason: DismissReason; note?: string }>(
    async ({ id, reason, note }) => (await axios.post(`${URL}/${id}/dismiss`, { reason: DISMISS_REASON_VALUES[reason], note })).data,
    "Insight dismissed"
  );
}
export function useSnoozeInsight() {
  return useInsightMutation<{ id: string; until: Date }>(
    async ({ id, until }) => (await axios.post(`${URL}/${id}/snooze`, { snoozed_until: until.toISOString() })).data,
    "Insight snoozed"
  );
}
export function useAskAi() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (question) => (await axios.post(`${URL}/ask-ai`, { question })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: [...KEY, "events"] }),
    meta: { errorMessage: "Failed to record question" },
  });
}
/** Re-runs the equipment manufacturing AI sync so insights pick up the latest schedule. */
export function useSyncSchedule() {
  return useInsightMutation<void>(
    async () => (await axios.post("/v1/construction/equipment/sync-manufacturing-ai")).data,
    "Schedule synced"
  );
}
export function useReopenInsight() {
  return useInsightMutation<string>(async (id) => (await axios.post(`${URL}/${id}/reopen`)).data, "Insight reopened");
}
