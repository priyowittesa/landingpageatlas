import { parseColor, type Rgb } from "@/lib/text-network/palette";

export type CanvasTheme = {
  background: string;
  label: string;
  labelRgb: Rgb;
  dim: string;
  dimRgb: Rgb;
  edgeAlpha: number;
  isDark: boolean;
};

const FALLBACK: CanvasTheme = { background: "#000000", label: "#f1f5f9", labelRgb: { r: 241, g: 245, b: 249 }, dim: "#27272a", dimRgb: { r: 39, g: 39, b: 42 }, edgeAlpha: 0.5, isDark: true };

let probe: CanvasRenderingContext2D | null = null;

/** Resolves any CSS colour (including oklch / color-mix) to rgb via a 1×1 canvas. */
function resolveRgb(color: string): Rgb | null {
  const direct = parseColor(color);
  if (direct) return direct;
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

const hex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

/** Reads the --tn-* CSS variables (globals.css) from the element, so canvases follow the Atlas theme. */
export function readCanvasTheme(element: Element | null): CanvasTheme {
  if (typeof window === "undefined" || !element) return FALLBACK;
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const background = resolveRgb(read("--tn-bg") || FALLBACK.background) ?? { r: 0, g: 0, b: 0 };
  const label = resolveRgb(read("--tn-label") || FALLBACK.label) ?? FALLBACK.labelRgb;
  const dim = resolveRgb(read("--tn-dim") || FALLBACK.dim) ?? { r: 39, g: 39, b: 42 };
  const edgeAlpha = Number.parseFloat(read("--tn-edge-alpha"));
  return {
    background: hex(background),
    label: hex(label),
    labelRgb: label,
    dim: hex(dim),
    dimRgb: dim,
    edgeAlpha: Number.isFinite(edgeAlpha) ? edgeAlpha : FALLBACK.edgeAlpha,
    isDark: 0.2126 * background.r + 0.7152 * background.g + 0.0722 * background.b < 128,
  };
}
