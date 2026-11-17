import { z } from "zod";

export const RATE_CARD_CURRENCIES = ["IDR", "USD"] as const;
export const RATE_CARD_UNITS = ["Hour", "Day", "Week", "Month"] as const;
export const RATE_CARD_STATUSES = ["active", "inactive"] as const;

export const rateCardSchema = z.object({
  code: z.string().trim().min(1, "Rate card code is required."),
  name: z.string().trim().min(1, "Rate card name is required."),
  role_ids: z
    .array(z.string())
    .min(1, "Select at least one applicable role."),
  currency: z.enum(RATE_CARD_CURRENCIES),
  base_rate: z
    .number({ error: "Base rate is required." })
    .positive("Base rate must be greater than zero."),
  unit: z.enum(RATE_CARD_UNITS),
});

export type RateCardPayload = z.infer<typeof rateCardSchema>;

export interface RoleOption {
  id: string;
  name: string;
}

export interface RateCard extends RateCardPayload {
  id: string;
  applicable_roles: RoleOption[];
  status: (typeof RATE_CARD_STATUSES)[number];
}

export const EMPTY_RATE_CARD: RateCardPayload = {
  code: "",
  name: "",
  role_ids: [],
  currency: "IDR",
  base_rate: 0,
  unit: "Hour",
};

export function calculateDailyRate(baseRate: number, unit: RateCardPayload["unit"]) {
  if (!Number.isFinite(baseRate)) return 0;
  const factors: Record<RateCardPayload["unit"], number> = {
    Hour: 8,
    Day: 1,
    Week: 1 / 5,
    Month: 1 / 22,
  };
  return baseRate * factors[unit];
}
