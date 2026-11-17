"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/predictive-breakdown/synonyms";
const KEY = ["asset-management", "synonyms"] as const;

export const SYNONYM_CATEGORIES = ["symptom", "component", "action"] as const;
export type SynonymCategory = (typeof SYNONYM_CATEGORIES)[number];
export const CATEGORY_LABELS: Record<SynonymCategory, string> = { symptom: "Symptom", component: "Component", action: "Action" };

export interface SynonymTerm {
  id: string;
  term: string;
  synonyms: string[];
  category: SynonymCategory;
  isActive: boolean;
  /** Reports matched in the last 30 days, when the API reports it. */
  uses: number | null;
  updatedBy: string;
  updatedAt: string;
}

export type SynonymDraft = { term: string; synonyms: string[]; category: SynonymCategory; isActive: boolean };
export type SynonymFilters = { search?: string; category?: SynonymCategory; page_size: number; page_token?: string };

export interface SynonymPreview {
  /** Concatenating every segment's text gives the input back; a recognized one names its primary term. */
  segments: { text: string; term: string | null; word: string | null }[];
  normalizedText: string;
  normalizedCount: number;
  recognizedCount: number;
}

function object(value: unknown) { return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>; }
function unwrap(value: unknown) { let current = value; for (let i = 0; i < 3; i += 1) { const row = object(current); if (!("data" in row)) break; current = row.data; } return object(current); }
function text(value: unknown, fallback = "") { if (value && typeof value === "object") { const row = object(value); return String(row.name ?? row.full_name ?? row.word ?? row.synonym ?? fallback); } return value == null || value === "" ? fallback : String(value); }
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

/** "02 Nov 2026", the date format the dictionary used before the API. */
export function formatSynonymDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function normalizeTerm(raw: unknown, index = 0): SynonymTerm {
  const row = object(raw);
  const category = text(row.category, "symptom").toLowerCase() as SynonymCategory;
  const uses = row.match_count_30d ?? row.matches_30d ?? row.match_count ?? row.uses;
  return {
    id: text(row.id, String(index)),
    term: text(row.term),
    synonyms: list(row.synonyms).map((synonym) => text(synonym)).filter(Boolean),
    category: SYNONYM_CATEGORIES.includes(category) ? category : "symptom",
    isActive: row.is_active == null ? true : Boolean(row.is_active),
    uses: uses == null ? null : number(uses),
    updatedBy: text(row.updated_by_name ?? row.updated_by ?? row.created_by_name ?? row.created_by),
    updatedAt: text(row.updated_at ?? row.created_at),
  };
}

const body = (draft: SynonymDraft) => ({ term: draft.term, synonyms: draft.synonyms, category: draft.category, is_active: draft.isActive });

export function useSynonyms(filters: SynonymFilters) {
  return useQuery<
    {
      items: SynonymTerm[];
      categoryCounts: Partial<Record<SynonymCategory, number>>;
      activeTermCount: number;
      termCount: number;
      lastChangedAt: string;
      nextPageToken: string;
      totalCount: number;
    },
    AxiosError<ApiResponseError>
  >({
    queryKey: [...KEY, "list", filters],
    queryFn: async () => {
      const data = unwrap((await axios.get(URL, { params: filters })).data);
      const counts = object(data.category_counts);
      return {
        items: list(data.items ?? data.terms ?? data.results).map(normalizeTerm),
        categoryCounts: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key.toLowerCase(), number(value)])),
        activeTermCount: number(data.active_term_count),
        termCount: number(data.term_count),
        lastChangedAt: text(data.last_changed_at),
        nextPageToken: text(data.next_page_token ?? data.nextPageToken),
        totalCount: number(data.total_count ?? data.totalCount),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load synonym terms" },
  });
}

/** Matches `text` against the saved dictionary; empty text skips the request. */
export function useSynonymPreview(value: string) {
  return useQuery<SynonymPreview, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, "preview", value],
    enabled: Boolean(value.trim()),
    queryFn: async () => {
      const data = unwrap((await axios.post(`${URL}/preview`, { text: value })).data);
      const segments = list(data.segments).map((raw) => {
        const segment = object(raw);
        const term = text(segment.term ?? segment.primary_term);
        const word = text(segment.matched_word ?? segment.word ?? segment.match);
        return { text: text(segment.text), term: term || null, word: word || null };
      });
      return {
        segments,
        normalizedText: text(data.normalized_text),
        normalizedCount: number(data.normalized_count),
        recognizedCount: number(data.recognized_count ?? data.match_count, segments.filter((segment) => segment.term).length),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to test synonym matching" },
  });
}

function useSynonymMutation<T>(mutationFn: (variables: T) => Promise<unknown>, errorMessage: string, suppressErrorStatuses?: number[]) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, T>({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
    meta: { errorMessage, suppressErrorStatuses },
  });
}

/** 400 and 409 (a word already used by another term) are shown in the dialog instead of a toast. */
export function useSaveSynonym() {
  return useSynonymMutation<{ id?: string; draft: SynonymDraft }>(
    async ({ id, draft }) => (id ? axios.put(`${URL}/${id}`, body(draft)) : axios.post(URL, body(draft))),
    "Failed to save term",
    [400, 409]
  );
}
export function useSetSynonymActive() {
  return useSynonymMutation<{ id: string; isActive: boolean }>(
    async ({ id, isActive }) => axios.patch(`${URL}/${id}/active`, { is_active: isActive }),
    "Failed to change term status"
  );
}
export function useDeleteSynonym() {
  return useSynonymMutation<string>(async (id) => axios.delete(`${URL}/${id}`), "Failed to delete term");
}
