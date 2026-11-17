"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { APPEARANCE_STORAGE_KEY, applyAppearance, type AppearanceSettings } from "@/lib/appearance";
import { getPortalBranding } from "@/lib/branding-api";
export function AppearanceProvider() {
  const { status, data: session } = useSession();
  const loadedForToken = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (stored) applyAppearance(JSON.parse(stored) as AppearanceSettings);
    } catch { localStorage.removeItem(APPEARANCE_STORAGE_KEY); }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    if (loadedForToken.current === session.accessToken) return;
    loadedForToken.current = session.accessToken;

    void getPortalBranding()
      .then((settings) => {
        applyAppearance(settings);
        localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent("atlas-appearance-updated", { detail: settings }));
      })
      .catch(() => {
        loadedForToken.current = null;
      });
  }, [status, session?.accessToken]);

  return null;
}
