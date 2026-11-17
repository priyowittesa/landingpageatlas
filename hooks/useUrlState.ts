"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UrlValue = string | number | undefined;

export type UrlDefaults<T extends Record<string, UrlValue>> = T;

const PAGE_KEY = "page";
const PAGE_SIZE_KEY = "pageSize";

function serialize(value: UrlValue): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value);
}

function deserialize<T extends UrlValue>(
  raw: string | null,
  fallback: T,
): T {
  if (raw === null) return fallback;
  if (typeof fallback === "number") {
    const parsed = Number(raw);
    return (Number.isFinite(parsed) ? parsed : fallback) as T;
  }
  return raw as T;
}

/**
 * URL-driven state for pagination / filters.
 *
 * Reads values from the current URL search params, falling back to `defaults`
 * when a key is absent. Setters call `router.replace` with `{ scroll: false }`
 * so the URL updates without scrolling. Setting any non-pagination key also
 * resets `page` to 1 so a fresh filter starts the user back at the top.
 *
 * Default-valued keys are omitted from the URL to keep links clean.
 *
 * Pass a memoized `defaults` reference — the hook reads its keys on every
 * change of `searchParams`, so a fresh object each render is fine for reading
 * but the returned values stay stable when defaults are referentially stable.
 */
export function useUrlState<T extends Record<string, UrlValue>>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultKeys = useMemo(
    () => Object.keys(defaults) as Array<keyof T>,
    [defaults],
  );

  const values = useMemo(() => {
    const next = { ...defaults };
    defaultKeys.forEach((key) => {
      next[key] = deserialize(searchParams.get(String(key)), defaults[key]);
    });
    return next;
  }, [defaultKeys, defaults, searchParams]);

  const writeParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      (Object.keys(next) as Array<string>).forEach((key) => {
        const value = next[key];
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const set = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const stringValue = serialize(value);
      const next: Record<string, string | undefined> = {
        [String(key)]: stringValue,
      };

      const isPageKey = key === (PAGE_KEY as keyof T);
      const isPageSizeKey = key === (PAGE_SIZE_KEY as keyof T);

      if (isPageSizeKey) {
        next[PAGE_KEY] = serialize(defaults.page as UrlValue);
      } else if (!isPageKey) {
        next[PAGE_KEY] = serialize(defaults.page as UrlValue);
      }

      writeParams(next);
    },
    [defaults.page, writeParams],
  );

  const setMany = useCallback(
    (partial: Partial<T>) => {
      const next: Record<string, string | undefined> = {};
      let touchedNonPage = false;
      let touchedPageSize = false;

      (Object.keys(partial) as Array<keyof T>).forEach((key) => {
        const value = partial[key];
        next[String(key)] = serialize(value as UrlValue);
        if (key === (PAGE_SIZE_KEY as keyof T)) touchedPageSize = true;
        else if (key !== (PAGE_KEY as keyof T)) touchedNonPage = true;
      });

      if (touchedNonPage || touchedPageSize) {
        next[PAGE_KEY] = serialize(defaults.page as UrlValue);
      }

      writeParams(next);
    },
    [defaults.page, writeParams],
  );

  const resetPagination = useCallback(() => {
    writeParams({ [PAGE_KEY]: serialize(defaults.page as UrlValue) });
  }, [defaults.page, writeParams]);

  return { values, set, setMany, resetPagination };
}