import type { ExceptionSeverity, HealthRating } from "../types";
import type { StatusTone } from "./StatusBadge";

/** The one mapping from a rating to a StatusBadge tone. The badge adds icon and text. */
export const HEALTH_TONE: Record<HealthRating, StatusTone> = {
  "on-track": "good",
  watch: "watch",
  "at-risk": "bad"
};

export const SEVERITY_TONE: Record<ExceptionSeverity, StatusTone> = {
  high: "bad",
  medium: "watch"
};
