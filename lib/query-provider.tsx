"use client";

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { ApiResponseError, MutationMeta, QueryMeta } from "@/types/api";

/** Error envelope used by some endpoints (e.g. /v1/auth/change-password). */
type NestedErrorResponse = {
  error?: { code?: string; message?: string; request_id?: string };
};

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<
    ApiResponseError & NestedErrorResponse
  >;
  const data = axiosError?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (data?.message) {
    const msg = data.message;
    return Array.isArray(msg) ? msg[0] : msg;
  }
  return fallback;
}

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const meta = query.meta as QueryMeta | undefined;
            const status = (error as AxiosError).response?.status;
            if (
              status !== undefined &&
              meta?.suppressErrorStatuses?.includes(status)
            ) {
              return;
            }
            const message = getErrorMessage(
              error,
              meta?.errorMessage ?? "Something went wrong"
            );
            toast.error("Error", { description: message });
          }
        }),
        mutationCache: new MutationCache({
          onSuccess: (_data, _vars, _ctx, mutation) => {
            const meta = mutation.options.meta as MutationMeta | undefined;
            if (meta?.successMessage) {
              toast.success("Success", { description: meta.successMessage });
            }
          },
          onError: (error, _vars, _ctx, mutation) => {
            const meta = mutation.options.meta as MutationMeta | undefined;
            const status = (error as AxiosError).response?.status;
            if (
              status !== undefined &&
              meta?.suppressErrorStatuses?.includes(status)
            ) {
              return;
            }
            const message = getErrorMessage(
              error,
              meta?.errorMessage ?? "Something went wrong"
            );
            toast.error("Error", { description: message });
          }
        }),
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 300_000,
            retry: 2,
            refetchOnWindowFocus: true
          },
          mutations: { retry: 0 }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
