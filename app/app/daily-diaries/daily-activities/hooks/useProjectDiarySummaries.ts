"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type {
  DailyDiariesDto,
  DailyDiariesItem
} from "@/types/type-daily-diaries";

const axios = axiosConfig(env.apiBaseUrl);

export function useProjectDiarySummaries(enabled: boolean) {
  return useQuery({
    // Share the diary prefix so saves, approvals and duplicates invalidate this.
    queryKey: ["getDailyDiaries", "project-summaries"],
    enabled,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const diaries: DailyDiariesItem[] = [];
      const tokens = new Set<string>();
      let pageToken: string | undefined;
      do {
        const response = await axios.get<DailyDiariesDto<DailyDiariesItem>>(
          "/v1/construction-diary/diaries",
          {
            params: { page_size: "100", page_token: pageToken },
            signal
          }
        );
        diaries.push(...response.data.items);
        pageToken = response.data.next_page_token || undefined;
        if (pageToken && tokens.has(pageToken)) {
          throw new Error("Unable to load all diary summary pages");
        }
        if (pageToken) tokens.add(pageToken);
      } while (pageToken);
      return diaries;
    },
    meta: { errorMessage: "Failed to load diary summaries" }
  });
}
