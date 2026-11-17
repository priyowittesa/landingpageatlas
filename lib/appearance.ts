export const PRIMARY_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type PrimaryStep = (typeof PRIMARY_STEPS)[number];
export type PrimaryScale = Record<PrimaryStep, string>;

export const DEFAULT_PRIMARY_SCALE: PrimaryScale = {
  50: "#f2ebfd", 100: "#d6c2f9", 200: "#c3a4f7", 300: "#a77bf3", 400: "#9651f1",
  500: "#7c3aed", 600: "#7135d8", 700: "#5829a8", 800: "#442082", 900: "#341864",
};
export const APPEARANCE_STORAGE_KEY = "atlas-appearance";
export type AppearanceSettings = { primaryScale: PrimaryScale; fontFamily: string };
export const DEFAULT_APPEARANCE: AppearanceSettings = { primaryScale: DEFAULT_PRIMARY_SCALE, fontFamily: "Arial" };

const normalizeHex = (hex: string) => {
  const value = hex.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(value)) return `#${value.split("").map((part) => part + part).join("")}`.toLowerCase();
  return /^[0-9a-f]{6}$/i.test(value) ? `#${value.toLowerCase()}` : null;
};
const mix = (hex: string, target: number, amount: number) => {
  const value = normalizeHex(hex) ?? DEFAULT_PRIMARY_SCALE[500];
  const channels = [1, 3, 5].map((start) => parseInt(value.slice(start, start + 2), 16));
  return `#${channels.map((channel) => Math.round(channel + (target - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
};
export function generatePrimaryScale(color: string): PrimaryScale {
  const base = normalizeHex(color) ?? DEFAULT_PRIMARY_SCALE[500];
  return { 50: mix(base, 255, .94), 100: mix(base, 255, .8), 200: mix(base, 255, .64), 300: mix(base, 255, .44), 400: mix(base, 255, .22), 500: base, 600: mix(base, 0, .08), 700: mix(base, 0, .28), 800: mix(base, 0, .44), 900: mix(base, 0, .58) };
}
export function applyAppearance(settings: AppearanceSettings) {
  const root = document.documentElement;
  if (settings.fontFamily !== "Arial" && !document.querySelector(`link[data-atlas-font="${settings.fontFamily}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.atlasFont = settings.fontFamily;
    link.href = `https://fonts.googleapis.com/css2?family=${settings.fontFamily.replaceAll(" ", "+")}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }
  PRIMARY_STEPS.forEach((step) => root.style.setProperty(`--atlas-primary-${step}`, settings.primaryScale[step]));
  root.style.setProperty("--primary", settings.primaryScale[500]);
  root.style.setProperty("--app-font-sans", `"${settings.fontFamily}", Arial, Helvetica, sans-serif`);
}
