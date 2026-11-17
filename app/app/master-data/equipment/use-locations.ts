"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

const COUNTRY_URL = "/v1/construction/locations/countries";
const STATE_URL = (code: string) =>
  `/v1/construction/locations/countries/${encodeURIComponent(code)}/states`;
const CITY_URL = (code: string) =>
  `/v1/construction/locations/states/${encodeURIComponent(code)}/cities`;

const FIRST_PAGE_SIZE = 20;
const NEXT_PAGE_SIZE = 10;

export interface LocationItem {
  id: string;
  name: string;
  code?: string;
}

export interface LocationPage {
  items: LocationItem[];
  next_page_token: string;
  total_count?: number;
}

interface ListParams {
  page_size?: number;
  page_token?: string;
  search?: string;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeLocation(raw: unknown): LocationItem {
  const row = asObject(raw);
  return {
    id: String(row.id ?? row.code ?? row.uuid ?? ""),
    name: String(row.name ?? row.label ?? row.title ?? row.code ?? ""),
    code: row.code != null ? String(row.code) : undefined,
  };
}

function extractList(payload: unknown): {
  items: LocationItem[];
  nextPageToken: string;
  total_count?: number;
} {
  let items: LocationItem[] = [];
  let nextPageToken = "";
  let totalCount: number | undefined;
  let current: unknown = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const envelope = asObject(current);
    const token = envelope.next_page_token ?? envelope.nextPageToken;
    if (token != null) nextPageToken = String(token);
    const count = envelope.total_count ?? envelope.totalCount;
    if (count != null && Number.isFinite(Number(count))) {
      totalCount = Number(count);
    }
    const value =
      envelope.data ?? envelope.items ?? envelope.results ?? envelope.rows;
    if (Array.isArray(value)) {
      items = value.map(normalizeLocation);
      break;
    }
    current = value;
  }
  if (items.length === 0 && Array.isArray(payload)) {
    items = (payload as unknown[]).map(normalizeLocation);
  }
  return { items, nextPageToken, total_count: totalCount };
}

async function fetchPage(
  url: string,
  params: ListParams,
): Promise<LocationPage> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query[key] = String(value);
  }
  const res = await axios.get(url, { params: query });
  const { items, nextPageToken, total_count } = extractList(res.data);
  return {
    items,
    next_page_token: nextPageToken,
    total_count,
  };
}

export interface UseLocationsOptions {
  /** Only fetch when `true`. Defaults to `true`. */
  enabled?: boolean;
}

export interface UseLocationsResult {
  items: LocationItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  loadMore: () => void;
  /** Force re-fetch from page 1 (e.g. after parent dependency changes). */
  refresh: () => void;
  error: AxiosError<ApiResponseError> | null;
}

function flattenPages(
  pages: LocationPage[] | undefined,
): LocationItem[] {
  if (!pages || pages.length === 0) return [];
  const seen = new Set<string>();
  const merged: LocationItem[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      const key = item.id || item.name;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

export function useCountries(
  options: UseLocationsOptions = {},
  search?: string,
): UseLocationsResult {
  const enabled = options.enabled ?? true;
  const query = useInfiniteQuery<
    LocationPage,
    AxiosError<ApiResponseError>,
    InfiniteData<LocationPage>,
    [string, string, string | undefined],
    string | undefined
  >({
    queryKey: ["locations", "countries", search ?? ""],
    queryFn: ({ pageParam }) =>
      fetchPage(COUNTRY_URL, {
        page_size: pageParam ? NEXT_PAGE_SIZE : FIRST_PAGE_SIZE,
        page_token: pageParam,
        search,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.next_page_token ? lastPage.next_page_token : undefined,
    enabled,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load countries" },
  });

  const items = useMemo(() => flattenPages(query.data?.pages), [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => {
      query.fetchNextPage();
    },
    refresh: () => {
      query.refetch();
    },
    error: query.error,
  };
}

export function useStates(
  countryCode: string | undefined,
  options: UseLocationsOptions = {},
  search?: string,
): UseLocationsResult {
  const enabled = (options.enabled ?? true) && Boolean(countryCode);
  const query = useInfiniteQuery<
    LocationPage,
    AxiosError<ApiResponseError>,
    InfiniteData<LocationPage>,
    [string, string, string | undefined, string | undefined],
    string | undefined
  >({
    queryKey: ["locations", "states", countryCode ?? "all", search ?? ""],
    queryFn: ({ pageParam }) =>
      fetchPage(STATE_URL(countryCode as string), {
        page_size: pageParam ? NEXT_PAGE_SIZE : FIRST_PAGE_SIZE,
        page_token: pageParam,
        search,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.next_page_token ? lastPage.next_page_token : undefined,
    enabled,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load states" },
  });

  const items = useMemo(() => flattenPages(query.data?.pages), [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => {
      query.fetchNextPage();
    },
    refresh: () => {
      query.refetch();
    },
    error: query.error,
  };
}

export function useCities(
  stateCode: string | undefined,
  options: UseLocationsOptions = {},
  search?: string,
): UseLocationsResult {
  const enabled = (options.enabled ?? true) && Boolean(stateCode);
  const query = useInfiniteQuery<
    LocationPage,
    AxiosError<ApiResponseError>,
    InfiniteData<LocationPage>,
    [string, string, string | undefined, string | undefined],
    string | undefined
  >({
    queryKey: ["locations", "cities", stateCode ?? "all", search ?? ""],
    queryFn: ({ pageParam }) =>
      fetchPage(CITY_URL(stateCode as string), {
        page_size: pageParam ? NEXT_PAGE_SIZE : FIRST_PAGE_SIZE,
        page_token: pageParam,
        search,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.next_page_token ? lastPage.next_page_token : undefined,
    enabled,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load cities" },
  });

  const items = useMemo(() => flattenPages(query.data?.pages), [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => {
      query.fetchNextPage();
    },
    refresh: () => {
      query.refetch();
    },
    error: query.error,
  };
}
