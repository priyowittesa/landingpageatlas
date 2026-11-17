import { z } from "zod";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiSignal } from "./use-signals";

const axios = axiosConfig(env.apiBaseUrl);
const text = z.string().nullish().transform((value) => value ?? "");
const optionalText = z.string().nullish().transform((value) => value ?? undefined);
const metadata = z.object({
  entity: z.object({ id: optionalText, kind: optionalText, name: optionalText })
    .nullish().transform((value) => value ?? undefined),
  severity: optionalText,
  value_tags: z.array(z.string()).nullish().transform((value) => value ?? undefined),
  priority_score: z.number().nullish().transform((value) => value ?? undefined)
}).passthrough();
const signalSchema = z.object({
  id: z.string(), code: z.string(), type: z.string(), confidence: z.number(),
  title: text, description: text, reason_nexa: text, suggested_action: text,
  status: text, module_name: text, created_at: text, created_by: text,
  updated_at: text, updated_by: text, tenant_id: text,
  metrics: z.record(z.string(), z.unknown()).nullish().transform((value) => value ?? null),
  metadata: metadata.nullish().transform((value) => value ?? null),
  flags: z.array(z.object({ id: z.string(), name: z.string() }))
    .nullish().transform((value) => value ?? undefined),
  flag_ids: z.array(z.string()).nullish().transform((value) => value ?? undefined)
}).passthrough();
const pageSchema = z.object({
  items: z.array(signalSchema),
  next_page_token: z.string().nullish()
});

export async function getOnboardingSignals(id: string, signal?: AbortSignal): Promise<ApiSignal[]> {
  const items: ApiSignal[] = [];
  const seen = new Set<string>();
  const tokens = new Set<string>();
  let pageToken = "";
  do {
    const response = await axios.get("/v1/ai-engine/signals", {
      params: {
        onboarding_id: id, is_active: true, page_size: 100,
        ...(pageToken ? { page_token: pageToken } : {})
      },
      signal
    });
    const page = pageSchema.parse(response.data);
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
    pageToken = page.next_page_token ?? "";
    if (pageToken && tokens.has(pageToken)) throw new Error("Signal pagination did not finish. Please try again.");
    tokens.add(pageToken);
  } while (pageToken);
  return items;
}
