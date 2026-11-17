import {
  Activity,
  AlarmClock,
  Check,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "../components/triage-badges";
import { ASSET_HEALTH, ASSETS, WORK_ORDER_HISTORY } from "../lib/data";
import type { AiInsight, InsightType } from "../lib/types";

/** Fabrix stock for parts referenced by insights (snapshot 02 Nov 15:15). */
export interface InsightPart {
  name: string;
  qty: number;
  min: number;
  leadDays: number;
  unit: string;
  location: string;
}

export const INSIGHT_PARTS: Record<string, InsightPart> = {
  "BRG-6310": { name: "Bearing 6310-2RS", qty: 2, min: 1, leadDays: 7, unit: "pcs", location: "Warehouse A · Rack 3" },
  "SEAL-HYD-200": { name: "200 T cylinder seal kit", qty: 1, min: 2, leadDays: 21, unit: "kit", location: "Warehouse A · Rack 7" },
  "NZL-BRN-3": { name: "Burner nozzle 3 GPH", qty: 0, min: 1, leadDays: 14, unit: "pcs", location: "Warehouse B · Rack 2" },
  "REF-R134": { name: "Refrigerant R134a", qty: 3, min: 1, leadDays: 7, unit: "cylinder", location: "Warehouse B · Rack 6" },
  "LMP-IND-24": { name: "Indicator lamp 24 V", qty: 12, min: 4, leadDays: 3, unit: "pcs", location: "Electrical Store · Shelf 1" },
  "OIL-HYD-46": { name: "Hydraulic oil ISO VG 46", qty: 3, min: 1, leadDays: 4, unit: "drum", location: "Oil Store · Bay 1" },
  "SEAL-CMP-22": { name: "Compressor seal kit", qty: 1, min: 2, leadDays: 10, unit: "kit", location: "Warehouse A · Rack 5" },
  "IMP-CF-150": { name: "Pump impeller 150 mm", qty: 1, min: 1, leadDays: 30, unit: "pcs", location: "Warehouse B · Rack 1" },
  "CTR-40A": { name: "Contactor 40 A", qty: 0, min: 2, leadDays: 5, unit: "pcs", location: "Electrical Store · Shelf 1" },
  "HTR-DRY-6K": { name: "Dryer heater 6 kW", qty: 1, min: 1, leadDays: 12, unit: "pcs", location: "Electrical Store · Shelf 4" },
};

export const INSIGHT_TYPES: Record<InsightType, { label: string; icon: LucideIcon; className: string }> = {
  anomaly: { label: "Anomaly", icon: Activity, className: "border-red-200 bg-red-50 text-red-700" },
  prediction: { label: "Prediction", icon: TrendingUp, className: "border-blue-200 bg-blue-50 text-blue-700" },
  recommendation: { label: "Recommendation", icon: Lightbulb, className: "border-primary-200 bg-primary-50 text-primary-700" },
};

export const HISTORY_EVENTS: Record<string, { tone: Tone; icon: LucideIcon }> = {
  Created: { tone: "primary", icon: Sparkles },
  Accepted: { tone: "green", icon: Check },
  Snoozed: { tone: "muted", icon: AlarmClock },
  Dismissed: { tone: "muted", icon: X },
  Reopened: { tone: "blue", icon: RotateCcw },
  "Asked AI": { tone: "primary", icon: MessageSquare },
};

export const DISMISS_REASONS = ["Not relevant", "Already handled", "The data is wrong", "Other"] as const;
export type DismissReason = (typeof DISMISS_REASONS)[number];

export const ASK_SUGGESTIONS = [
  "Which assets are most likely to break down next?",
  "Why does Line 2 Air Compressor keep failing?",
  "Which spare parts could run out?",
  "Summarize today’s breakdowns",
];

/** Canned answer for the mock "Ask AI" chat. `intro`/`outro` may contain **bold** spans. */
export interface AskAnswer {
  intro: string;
  items?: string[];
  ordered?: boolean;
  outro?: string;
  sources?: string[];
}

export interface TodaySummary {
  total: number;
  byPriority: Record<"P1" | "P2" | "P3", number>;
  safetyAssets: string[];
  p1: { asset: string; description: string }[];
  sources: string[];
}

function assetAnswer(id: string, openInsights: AiInsight[]): AskAnswer {
  const asset = ASSETS[id];
  const health = ASSET_HEALTH[id];
  const orders = WORK_ORDER_HISTORY.filter((wo) => wo.assetId === id).sort((a, b) => b.iso.localeCompare(a.iso));
  if (!health || !orders.length) {
    return {
      intro: `**${asset.name}** (${id}) has no breakdown WOs in the last 12 months, so there is no pattern to report yet.`,
      sources: [`${id} · asset master`],
    };
  }
  const labels = Object.fromEntries(
    Object.values(ASSET_HEALTH).flatMap((item) => item?.failureCodes.map((code) => [code.code, code.label]) ?? [])
  );
  const counts = new Map<string, number>();
  orders.forEach((wo) => counts.set(wo.code, (counts.get(wo.code) ?? 0) + 1));
  const insights = openInsights.filter((insight) => insight.assetId === id);
  const mttr = health.mttrHours == null ? "—" : `${health.mttrHours % 1 === 0 ? health.mttrHours.toFixed(0) : health.mttrHours.toFixed(1)} h`;
  return {
    intro: `**${asset.name}** (${id}) had **${orders.length} breakdowns** in the last 12 months, with an average repair time of ${mttr}${health.mtbfHours ? ` and MTBF of ${health.mtbfHours.toLocaleString("en-US")} h` : ""}.`,
    items: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => `${code} (${labels[code] ?? code}): ${count}×, last on ${orders.find((wo) => wo.code === code)?.date}`),
    outro:
      (health.repeat ? "The repeat flag is active: the same failure happened again within 30 days. " : "") +
      (insights.length
        ? `There ${insights.length > 1 ? "are" : "is"} ${insights.length} open insight${insights.length > 1 ? "s" : ""}: “${insights[0].title}”.`
        : ""),
    sources: orders.slice(0, 4).map((wo) => wo.workOrder),
  };
}

export function askAnswer(question: string, openInsights: AiInsight[], today: TodaySummary): AskAnswer {
  const text = question.toLowerCase();
  if (text.includes("most likely") || text.includes("break down next") || text.includes("next")) {
    return {
      intro: "Four assets show patterns that usually come before another breakdown:",
      ordered: true,
      items: [
        "**Line 2 Air Compressor** (CMP-L2-01): bearing failures 18 days apart, down from 295, and a new report today.",
        "**Hydraulic Press 05** (HYD-PR-05): seal leaks every 35–163 days, the fifth reported today.",
        "**Overhead Crane 02** (CRN-OH-02): 3 indicator-lamp failures in 50 days.",
        "**Utility Chiller 1** (CHL-UT-01): refrigerant topped up twice in 31 days.",
      ],
      outro: "Each one has an open insight with suggested actions.",
      sources: ["WO-10231", "WO-09877", "WO-10102", "WO-10415", "WO-10402", "BR-2026-1102-014", "BR-2026-1102-009"],
    };
  }
  if (text.includes("compressor") || text.includes("cmp-l2")) return assetAnswer("CMP-L2-01", openInsights);
  if (text.includes("spare") || text.includes("stock") || text.includes("run out") || text.includes("part")) {
    return {
      intro: "Five parts are at or below minimum stock in Fabrix:",
      ordered: true,
      items: ["NZL-BRN-3", "CTR-40A", "SEAL-HYD-200", "SEAL-CMP-22", "IMP-CF-150"].map((id) => {
        const part = INSIGHT_PARTS[id];
        return `**${part.name}** (${id}): ${part.qty} in stock, min ${part.min}, lead time ${part.leadDays} days.`;
      }),
      outro:
        "The most urgent are the burner nozzle (needed for today’s Utility Boiler 1 report) and the press seal kit (the last one will likely be used today).",
      sources: ["Fabrix inventory · 02 Nov 15:15", "BR-2026-1102-012", "BR-2026-1102-009"],
    };
  }
  if (text.includes("today") || text.includes("summar")) {
    const { total, byPriority, safetyAssets, p1, sources } = today;
    return {
      intro:
        `There ${total === 1 ? "is" : "are"} **${total} breakdown reports** today: ${byPriority.P1} P1, ${byPriority.P2} P2 and ${byPriority.P3} P3.` +
        (safetyAssets.length ? ` ${safetyAssets.length} has a safety signal (${safetyAssets.join(", ")}).` : ""),
      items: p1.map((report) => `**${report.asset}**: ${report.description}`),
      outro: "Two of today’s reports are linked to stock risks: the boiler nozzle and the press seal kit.",
      sources,
    };
  }
  const hit = Object.keys(ASSETS).find((id) => {
    const name = ASSETS[id].name.toLowerCase();
    return (
      text.includes(id.toLowerCase()) ||
      text.includes(name) ||
      name
        .split(" ")
        .filter((word) => word.length > 3 && !/line|unit|utility|main/.test(word))
        .some((word) => text.includes(word))
    );
  });
  if (hit) return assetAnswer(hit, openInsights);
  return {
    intro:
      "I can answer questions about breakdown history, asset health, open reports, and spare-part stock for the assets in this plant. Try asking about a specific asset, for example “How is Hydraulic Press 05 doing?”",
  };
}
