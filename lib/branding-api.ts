import { axiosConfig } from "@/lib/axios";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PRIMARY_SCALE,
  PRIMARY_STEPS,
  type AppearanceSettings,
  type PrimaryScale,
} from "@/lib/appearance";
import { env } from "@/lib/env";

const BRANDING_URL = "/v1/portal/branding";
const axios = axiosConfig(env.apiBaseUrl);

export type BrandingPayload = {
  primary_color: string;
  primary_color_scale: Record<string, string>;
  primary_font_family: string;
};

function unwrapBrandingResponse(payload: unknown): unknown {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    if ("primary_color_scale" in object || "primary_color" in object) break;
    const nested = object.data ?? object.branding ?? object.item;
    if (!nested) break;
    current = nested;
  }
  return current;
}

export function brandingToAppearance(payload: unknown): AppearanceSettings {
  const raw = unwrapBrandingResponse(payload);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_APPEARANCE;
  const branding = raw as Partial<BrandingPayload>;
  const rawScale = branding.primary_color_scale ?? {};
  const scale = { ...DEFAULT_PRIMARY_SCALE } as PrimaryScale;
  PRIMARY_STEPS.forEach((step) => {
    const value = rawScale[String(step)];
    if (/^#[0-9a-f]{6}$/i.test(value ?? "")) scale[step] = value.toLowerCase();
  });
  if (/^#[0-9a-f]{6}$/i.test(branding.primary_color ?? "")) {
    scale[500] = branding.primary_color!.toLowerCase();
  }
  return {
    primaryScale: scale,
    fontFamily: branding.primary_font_family?.trim() || DEFAULT_APPEARANCE.fontFamily,
  };
}

export function appearanceToBranding(settings: AppearanceSettings): BrandingPayload {
  return {
    primary_color: settings.primaryScale[500],
    primary_color_scale: Object.fromEntries(PRIMARY_STEPS.map((step) => [String(step), settings.primaryScale[step]])),
    primary_font_family: settings.fontFamily,
  };
}

export async function getPortalBranding(): Promise<AppearanceSettings> {
  return brandingToAppearance((await axios.get(BRANDING_URL)).data);
}

export async function updatePortalBranding(settings: AppearanceSettings): Promise<void> {
  await axios.put(BRANDING_URL, appearanceToBranding(settings));
}
