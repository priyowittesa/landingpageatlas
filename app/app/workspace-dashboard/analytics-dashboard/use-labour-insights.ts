"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { Insight, InsightCategory, InsightSeverity } from "./mock-data";

const axios = axiosConfig(env.apiBaseUrl);
const URL = `${env.apiBaseUrl}/v1/construction-labour/ai-insights`;
const KEY = ["rostering-ai-insights"] as const;

/** The three cards the dashboard has room for. */
const PAGE_SIZE = 3;

export type LabourInsightsFilter = { project_id?: string };

export type LabourInsights = {
  items: Insight[];
  totalCount: number;
  /** Generation time of the newest insight; null when there is none. */
  latestAt: string | null;
};

function object(value: unknown) {
  return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
}
/** The list may come wrapped in one or more `data` envelopes. */
function unwrap(value: unknown) {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    const row = object(current);
    if (!("data" in row) || Array.isArray(row.data)) break;
    current = row.data;
  }
  return current;
}
function text(value: unknown) {
  return value == null ? "" : String(value);
}

const CATEGORIES: InsightCategory[] = ["ANOMALY", "PREDICTION", "RECOMMENDATION"];
const SEVERITIES: InsightSeverity[] = ["High", "Medium", "Low"];

/** API insight (snake_case, lowercase type and severity) → the card shown on the dashboard. */
export function normalizeLabourInsight(raw: unknown, index = 0): Insight {
  const row = object(raw);
  const type = text(row.type).toUpperCase() as InsightCategory;
  const severity = text(row.severity).toLowerCase();
  const capitalized = (severity.charAt(0).toUpperCase() + severity.slice(1)) as InsightSeverity;
  // "Based on roster records · All Projects · Last 7 days", like the design.
  const basis = [row.data_source, row.data_scope, row.data_period].map(text).filter(Boolean);
  return {
    id: text(row.id) || String(index),
    category: CATEGORIES.includes(type) ? type : "RECOMMENDATION",
    severity: SEVERITIES.includes(capitalized) ? capitalized : "Low",
    title: text(row.title),
    description: text(row.description),
    source: basis.length ? `Based on ${basis.join(" · ")}` : "",
    actions: [],
  };
}

/** Active AI insights for Labour Rostering, newest first, optionally for one project. */
export function useLabourInsights(filter: LabourInsightsFilter = {}, enabled = true) {
  return useQuery<LabourInsights, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, filter] as const,
    enabled,
    queryFn: async () => {
      const res = await axios.get(URL, { params: { ...filter, page_size: PAGE_SIZE } });
      const body = unwrap(res.data);
      const envelope = object(body);
      const rows = Array.isArray(body) ? body : (envelope.items ?? envelope.insights ?? envelope.results ?? envelope.data ?? []);
      const list = Array.isArray(rows) ? rows : [];
      const latestAt = list
        .map((row) => text(object(row).generated_at ?? object(row).created_at))
        .filter(Boolean)
        .sort()
        .pop();
      return {
        items: list.map(normalizeLabourInsight),
        totalCount: Number(envelope.total_count ?? envelope.totalCount ?? list.length) || list.length,
        latestAt: latestAt ?? null,
      };
    },
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load AI insights" },
  });
}

/** Asks the AI to scan the rosters again; the insight list reloads once it is done. */
export function useScanLabourInsights() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, void>({
    mutationFn: async () => (await axios.post(`${URL}/scan`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
    meta: { errorMessage: "Failed to get AI insights", successMessage: "AI insights updated" },
  });
}

/** "just now", "2 min ago", "3 h ago", "4 d ago". */
export function timeAgo(value: string | null, now = Date.now()) {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.floor(Math.max(0, now - time) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
