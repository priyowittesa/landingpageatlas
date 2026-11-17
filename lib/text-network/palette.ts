export const COMMUNITY_PALETTE = [
  "#b8e2f2", "#36b34a", "#e8363f", "#f5a742", "#c3e36f", "#f2867b",
  "#2f86c4", "#b689e0", "#f1d34a", "#4fd2bf", "#e46bb3", "#9aa6b8",
] as const;

export const communityColor = (index: number) => COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length];

export type Rgb = { r: number; g: number; b: number };

/** Parses #rgb, #rrggbb and rgb()/rgba() strings. Returns null for anything else. */
export function parseColor(value: string): Rgb | null {
  const color = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(color);
  return rgb ? { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) } : null;
}

export const rgba = ({ r, g, b }: Rgb, alpha: number) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${Math.max(0, Math.min(1, alpha))})`;

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });

/** Colour with alpha for any parseable colour; falls back to the input when it cannot be parsed. */
export function withAlpha(color: string, alpha: number) {
  const parsed = parseColor(color);
  return parsed ? rgba(parsed, alpha) : color;
}
