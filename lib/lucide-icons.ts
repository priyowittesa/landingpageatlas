import * as lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Converts a lucide export name (e.g. `LayoutDashboard`) to the kebab-case name stored by the API. */
export function toKebabIconName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/([A-Za-z])(\d+)/g, "$1-$2")
    .toLowerCase();
}

// Hyphens are ignored so both lucide's official names (`arrow-down-0-1`) and
// names saved by Settings (`arrow-down-01`) resolve to `ArrowDown01`.
const normalizeIconName = (name: string) => name.replace(/-/g, "").toLowerCase();

const isIconExport = (exportName: string, value: unknown): value is LucideIcon =>
  /^[A-Z]/.test(exportName) &&
  !exportName.startsWith("Lucide") &&
  !exportName.endsWith("Icon") &&
  typeof value === "object" &&
  value !== null &&
  "render" in value;

// Built from every named export (not just `icons`) so lucide aliases such as
// `alarm-check` resolve too, matching what DynamicIcon used to accept.
const ICONS_BY_NORMALIZED_NAME = new Map<string, LucideIcon>();
for (const [exportName, value] of Object.entries(lucide)) {
  if (isIconExport(exportName, value)) {
    ICONS_BY_NORMALIZED_NAME.set(normalizeIconName(exportName), value);
  }
}

/**
 * Resolves a kebab-case lucide icon name. This module pulls in the whole icon
 * set, so import it lazily (`import("@/lib/lucide-icons")`) from shared layouts.
 */
export function getLucideIconByName(name: string): LucideIcon | undefined {
  return ICONS_BY_NORMALIZED_NAME.get(normalizeIconName(name));
}
