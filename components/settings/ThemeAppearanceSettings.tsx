"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Info, Pencil, RotateCcw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  DEFAULT_PRIMARY_SCALE,
  PRIMARY_STEPS,
  applyAppearance,
  generatePrimaryScale,
  type AppearanceSettings,
  type PrimaryScale,
  type PrimaryStep
} from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { updatePortalBranding } from "@/lib/branding-api";

const FONTS = [
  "Arial",
  "Inter",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Lato",
  "Nunito",
  "Open Sans"
];

function loadSettings(): AppearanceSettings {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const saved = JSON.parse(
      localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? "null"
    ) as Partial<AppearanceSettings> | null;
    return {
      primaryScale: { ...DEFAULT_PRIMARY_SCALE, ...saved?.primaryScale },
      fontFamily: saved?.fontFamily || DEFAULT_APPEARANCE.fontFamily
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function ThemeAppearanceSettings() {
  const initial = useMemo(loadSettings, []);
  const [section, setSection] = useState<"color" | "typography">("color");
  const [scale, setScale] = useState<PrimaryScale>(initial.primaryScale);
  const [font, setFont] = useState(initial.fontFamily);
  const [query, setQuery] = useState("");
  const [showFonts, setShowFonts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    const syncFromApi = (event: Event) => {
      const settings = (event as CustomEvent<AppearanceSettings>).detail;
      setScale(settings.primaryScale);
      setFont(settings.fontFamily);
    };
    window.addEventListener("atlas-appearance-updated", syncFromApi);
    return () =>
      window.removeEventListener("atlas-appearance-updated", syncFromApi);
  }, []);
  const previewScale = (nextScale: PrimaryScale) => {
    setScale(nextScale);
    applyAppearance({ primaryScale: nextScale, fontFamily: font });
  };
  const setShade = (step: PrimaryStep, value: string) => {
    const nextScale = { ...scale, [step]: value };
    previewScale(nextScale);
  };
  const choosePrimaryColor = (value: string) =>
    previewScale(generatePrimaryScale(value));
  const save = async () => {
    const settings = { primaryScale: scale, fontFamily: font };
    setIsSaving(true);
    try {
      await updatePortalBranding(settings);
      applyAppearance(settings);
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
      toast.success("Theme & appearance saved");
    } catch {
      toast.error("Failed to save theme & appearance");
    } finally {
      setIsSaving(false);
    }
  };
  const filteredFonts = FONTS.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold text-gray-950">
          Theme &amp; Appearance
        </h2>
        <div className="mt-4 flex gap-1" role="tablist">
          <Tab active={section === "color"} onClick={() => setSection("color")}>
            Theme Color
          </Tab>
          <Tab
            active={section === "typography"}
            onClick={() => setSection("typography")}
          >
            Typography
          </Tab>
        </div>
      </div>
      <div className="border-t border-gray-200 p-5">
        {section === "color" ? (
          <div className="space-y-4">
            <Panel
              title="Primary color"
              description="This is the main color used across ATLAS. A full color scale can be generated automatically."
            >
              <label className="mt-4 block text-xs text-gray-800">
                Primary color
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <input
                  aria-label="Choose primary color"
                  type="color"
                  value={scale[500]}
                  onInput={(event) =>
                    choosePrimaryColor(event.currentTarget.value)
                  }
                  onChange={(event) =>
                    choosePrimaryColor(event.currentTarget.value)
                  }
                  className="h-10 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
                />
                <HexInput value={scale[500]} onChange={choosePrimaryColor} />
                <div className="flex items-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    <strong>Auto-generated</strong>
                    <br />
                    <span className="text-[10px] text-gray-500">
                      10 shades (50-900) from your primary color.
                    </span>
                  </span>
                </div>
              </div>
            </Panel>
            <Panel
              title="Color scale (auto-generated)"
              description="Review and edit any shade if needed."
            >
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5 lg:grid-cols-10">
                {PRIMARY_STEPS.map((step) => (
                  <div key={step} className="min-w-0 text-center">
                    <input
                      aria-label={`Primary ${step} color`}
                      type="color"
                      value={scale[step]}
                      onInput={(event) =>
                        setShade(step, event.currentTarget.value)
                      }
                      onChange={(event) =>
                        setShade(step, event.currentTarget.value)
                      }
                      className="h-16 w-full cursor-pointer rounded-md border border-gray-200 p-0.5"
                    />
                    <div className="my-1 text-[10px] text-gray-700">{step}</div>
                    <HexInput
                      value={scale[step]}
                      onChange={(value) => setShade(step, value)}
                      compact
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                <Info className="h-3.5 w-3.5" />
                Changes apply to components, backgrounds, text, borders, and
                more.
              </div>
            </Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <ActionCard
                title="Regenerate scale"
                description="Generate a new scale based on the current primary color."
                button="Regenerate"
                onClick={() => previewScale(generatePrimaryScale(scale[500]))}
              />
              <ActionCard
                title="Reset to default"
                description="Restore all shades to the ATLAS default palette."
                button="Reset"
                onClick={() => previewScale({ ...DEFAULT_PRIMARY_SCALE })}
              />
            </div>
          </div>
        ) : (
          <Panel
            title="Font Family"
            description="Choose the primary typeface and preview how it renders across different styles."
          >
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-800">
                  Primary font family
                </label>
                <select
                  value={font}
                  onChange={(event) => setFont(event.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs outline-none focus:border-primary-500"
                >
                  {FONTS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="block text-xs text-gray-800">
                  Search Google Fonts
                </label>
                <div className="mt-1 flex h-9 items-center rounded-md border border-gray-200 px-3 focus-within:border-primary-500">
                  <Search className="mr-2 h-4 w-4 text-gray-400" />
                  <input
                    value={query}
                    onFocus={() => setShowFonts(true)}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setShowFonts(true);
                    }}
                    placeholder="Search fonts..."
                    className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none"
                  />
                </div>
                {showFonts && query && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    {filteredFonts.length ? (
                      filteredFonts.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setFont(item);
                            setQuery("");
                            setShowFonts(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          {item}
                          {font === item && (
                            <Check className="h-3.5 w-3.5 text-primary-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No font found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{ fontFamily: `"${font}", Arial, sans-serif` }}
              className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4"
            >
              <div className="text-[10px] font-medium uppercase text-primary-700">
                Live preview ({font})
              </div>
              <div className="mt-1 text-xl font-bold text-gray-950">
                The quick brown fox jumps over the lazy dog (Heading)
              </div>
              <div className="mt-1 text-sm text-gray-700">
                This is body text. Accurately preview line heights and
                readability ratios at a glance. (Body)
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Metadata &amp; Captions — 12px Regular (Caption)
              </div>
            </div>
          </Panel>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            className="rounded-md bg-primary-700 px-4 py-2 text-xs font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Tab({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 pb-3 text-xs",
        active
          ? "border-primary-600 text-primary-700"
          : "border-transparent text-gray-500 hover:text-gray-800"
      )}
    >
      {children}
    </button>
  );
}
function Panel({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      {children}
    </div>
  );
}
function HexInput({
  value,
  onChange,
  compact = false
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-md border border-gray-200 bg-white",
        compact ? "h-7 px-1" : "h-9 px-2"
      )}
    >
      <input
        key={value}
        aria-label="Hex color"
        defaultValue={value.toUpperCase()}
        maxLength={7}
        onBlur={(event) => {
          if (/^#[0-9a-f]{6}$/i.test(event.target.value))
            onChange(event.target.value.toLowerCase());
          else event.target.value = value.toUpperCase();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={cn(
          "min-w-0 border-0 bg-transparent font-mono uppercase outline-none",
          compact ? "w-full text-[9px]" : "w-20 text-xs"
        )}
      />
      <Pencil className="h-3 w-3 shrink-0 text-gray-500" />
    </div>
  );
}
function ActionCard({
  title,
  description,
  button,
  onClick
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div>
        <h3 className="text-xs font-medium text-gray-950">{title}</h3>
        <p className="mt-1 max-w-52 text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="ml-3 rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] hover:bg-gray-50"
      >
        {button === "Reset" && <RotateCcw className="mr-1 inline h-3 w-3" />}
        {button}
      </button>
    </div>
  );
}
