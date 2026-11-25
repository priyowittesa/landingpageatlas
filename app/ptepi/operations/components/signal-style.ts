import {
  CalendarClock,
  CircleAlert,
  Lightbulb,
  ListChecks,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Wallet,
  type LucideIcon
} from "lucide-react";
import type { SignalKind, SignalLevel, ValueTag } from "../signals";

/** Icon, label and meaning of each kind of signal; icon and text always travel together. */
export const KIND_STYLE: Record<SignalKind | "all", { label: string; caption: string; Icon: LucideIcon }> = {
  all: { label: "All AI signals", caption: "Everything ATLAS found", Icon: Sparkles },
  insight: { label: "Insights", caption: "What is happening now", Icon: Lightbulb },
  recommendation: { label: "Recommendations", caption: "What to do about it", Icon: ListChecks },
  prediction: { label: "Predictions", caption: "What is likely to happen", Icon: TrendingUp }
};

export const KIND_CHIP: Record<SignalKind, string> = {
  insight: "bg-sky-50 text-sky-900 ring-sky-200",
  recommendation: "bg-primary-50 text-primary-900 ring-primary-200",
  prediction: "bg-indigo-50 text-indigo-900 ring-indigo-200"
};

export const LEVEL_STYLE: Record<SignalLevel, { label: string; Icon: LucideIcon; className: string }> = {
  risk: { label: "Risk", Icon: CircleAlert, className: "bg-red-50 text-red-700 ring-red-200" },
  watch: { label: "Watch", Icon: TriangleAlert, className: "bg-amber-50 text-amber-900 ring-amber-200" }
};

/** What is at stake: revenue, cost, schedule or compliance. */
export const TAG_STYLE: Record<ValueTag, { label: string; meaning: string; Icon: LucideIcon }> = {
  revenue: { label: "Revenue", meaning: "protects revenue and cash", Icon: TrendingUp },
  cost: { label: "Cost", meaning: "protects margin", Icon: Wallet },
  schedule: { label: "Schedule", meaning: "protects the finish date", Icon: CalendarClock },
  compliance: { label: "Compliance", meaning: "protects evidence and rules", Icon: ShieldCheck }
};
