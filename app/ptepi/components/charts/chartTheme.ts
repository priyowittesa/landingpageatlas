/**
 * Chart colours from the app tokens. Plan is grey and dashed, actual is
 * primary-700; green, amber and red are reserved for status.
 */
export const CHART_COLORS = {
  plan: "var(--color-muted-foreground)",
  actual: "var(--color-primary-700)",
  primaryLight: "var(--color-primary-300)",
  pace: "var(--color-primary-500)",
  neutral: "var(--color-muted)",
  good: "var(--color-success)",
  watch: "var(--color-warning)",
  bad: "var(--color-destructive)"
} as const;

export const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: "0.8125rem" } as const;

export const GRID = { strokeDasharray: "3 3", stroke: "var(--color-border)" } as const;

