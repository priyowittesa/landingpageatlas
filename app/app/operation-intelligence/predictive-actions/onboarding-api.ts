import { z } from "zod";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";

const axios = axiosConfig(env.apiBaseUrl);
const base = "/v1/ai-engine/onboardings";
const object = z.record(z.string(), z.unknown());
const onboardingSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["generating", "failed", "ready"]),
  name: z.string().optional(),
  status_message: z.string().nullable().optional(),
  industry_pack_id: z.string().nullable().optional(),
  industry_pack_version: z.string().nullable().optional(),
  datastore_connection_id: z.string().optional(),
  is_active: z.boolean().optional(),
  version: z.number().int().optional(),
  modules: z.array(z.unknown()).optional(),
  datasets: object.optional(),
  metrics: z.array(z.unknown()).optional(),
  detectors: z.array(z.unknown()).optional(),
  actions: z.array(z.unknown()).optional(),
  generation: object.nullable().optional()
}).passthrough();
const envelopeSchema = z.object({
  data: z.unknown(),
  meta: z.object({ warnings: z.array(z.unknown()).optional() }).optional()
});

export type Onboarding = z.infer<typeof onboardingSchema>;
export type OnboardingResponse = { record: Onboarding; warnings: string[] };
export class OnboardingStateChanged extends Error {
  constructor(public record: Onboarding) {
    super("The configuration is no longer ready. Its latest status has been loaded.");
  }
}
export type FormulasResponse = {
  onboarding_id?: string;
  onboarding_version?: number;
  detectors: unknown[];
};

export function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function readResponse(body: unknown): OnboardingResponse {
  const envelope = envelopeSchema.parse(body);
  return {
    record: onboardingSchema.parse(envelope.data),
    warnings: (envelope.meta?.warnings ?? []).map((warning) =>
      displayValue(warning && typeof warning === "object" && "message" in warning ? warning.message : warning)
    )
  };
}

export function engineError(error: unknown) {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  const payload = z.object({
    error: z.object({
      code: z.string().optional(),
      message: z.string().optional(),
      details: z.array(z.object({ path: z.string().optional(), message: z.string().optional() })).optional()
    })
  }).safeParse(response?.data);
  return { status: response?.status, ...(payload.success ? payload.data.error : {}) };
}

export function errorMessage(error: unknown, fallback: string): string {
  const detail = engineError(error);
  if (detail.code === "VERSION_CONFLICT") return "The configuration changed. Review the refreshed configuration, then activate it again.";
  if (detail.code === "GENERATION_RUNNING") return "Generation is already running. Formulas are available once generation finishes.";
  const message = detail.message || (error instanceof Error && !(error instanceof z.ZodError) ? error.message : fallback);
  const fields = detail.details?.map((item) => [item.path, item.message].filter(Boolean).join(": ")).filter(Boolean);
  return [message, ...(fields ?? [])].join("\n");
}

export async function getLatestOnboarding(signal?: AbortSignal): Promise<Onboarding | null> {
  const response = await axios.get(base, { params: { page_size: 1 }, signal });
  const list = z.object({ data: z.array(onboardingSchema) }).parse(response.data);
  return list.data[0] ?? null;
}

export async function getOnboarding(id: string, signal?: AbortSignal): Promise<Onboarding> {
  const response = await axios.get(`${base}/${encodeURIComponent(id)}`, { signal });
  const record = readResponse(response.data).record;
  if (record.id !== id) throw new Error("The onboarding response does not match the requested configuration.");
  return record;
}

export async function createOnboarding(name: string): Promise<OnboardingResponse> {
  const response = await axios.post(base, { name, generate: true });
  return readResponse(response.data);
}

export async function regenerateOnboarding(id: string): Promise<OnboardingResponse> {
  const response = await axios.post(`${base}/${encodeURIComponent(id)}/regenerate`);
  const result = readResponse(response.data);
  if (result.record.id !== id) throw new Error("The onboarding response does not match the requested configuration.");
  return result;
}

export async function activateOnboarding(id: string): Promise<OnboardingResponse> {
  // PUT replaces the entire configuration. Never build it from the sparse list.
  const record = await getOnboarding(id);
  if (record.status !== "ready") throw new OnboardingStateChanged(record);
  if (record.is_active) return { record, warnings: [] };
  const complete = z.object({
    version: z.number().int().positive(),
    modules: z.array(z.unknown()), datasets: object, detectors: z.array(z.unknown())
  }).safeParse(record);
  if (!complete.success) {
    const missing = complete.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`The full configuration is incomplete (${missing}). Reload it before activating.`);
  }
  // Forward optional fields verbatim; the engine owns their validation.
  const payload: Record<string, unknown> = { ...record, is_active: true };
  delete payload.tenant_id;
  const response = await axios.put(`${base}/${encodeURIComponent(id)}`, payload);
  const result = readResponse(response.data);
  if (result.record.id !== id || !result.record.is_active) throw new Error("Activation was not confirmed. Refresh the configuration before trying again.");
  return result;
}

export async function getIndustryPack(id: string, signal?: AbortSignal) {
  const response = await axios.get(`/v1/ai-engine/industry-packs/${encodeURIComponent(id)}`, { signal });
  return z.object({ data: z.object({ name: z.string(), version: z.string().optional() }) }).parse(response.data).data;
}

export async function getOnboardingFormulas(id: string, signal?: AbortSignal): Promise<FormulasResponse> {
  const response = await axios.get(`${base}/${encodeURIComponent(id)}/formulas`, { signal });
  const envelope = envelopeSchema.parse(response.data);
  const result = z.object({
    onboarding_id: z.string().optional(), onboarding_version: z.number().optional(),
    detectors: z.array(z.unknown()).default([])
  }).parse(envelope.data);
  if (result.onboarding_id && result.onboarding_id !== id) throw new Error("The formulas do not match this onboarding.");
  return result;
}

export async function getOpenSignalCounts(id: string, signal?: AbortSignal): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.create(null);
  const seen = new Set<string>();
  const tokens = new Set<string>();
  let pageToken = "";
  do {
    const response = await axios.get("/v1/ai-engine/signals", {
      params: {
        onboarding_id: id, status: "open", is_active: true, page_size: 100,
        ...(pageToken ? { page_token: pageToken } : {})
      }, signal
    });
    // Signals intentionally use the legacy, unwrapped list envelope.
    const page = z.object({
      items: z.array(z.object({ id: z.string(), code: z.string() })),
      next_page_token: z.string().nullish()
    }).parse(response.data);
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const detector = item.code.split(":")[1];
      if (detector) counts[detector] = (counts[detector] ?? 0) + 1;
    }
    pageToken = page.next_page_token ?? "";
    if (pageToken && tokens.has(pageToken)) throw new Error("Signal pagination did not finish. Counts are unavailable.");
    tokens.add(pageToken);
  } while (pageToken);
  return counts;
}
