"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}

/** Spread into every Recharts series: animation is off when the visitor prefers reduced motion. */
export function useChartAnimation(): { isAnimationActive: boolean } {
  return { isAnimationActive: !usePrefersReducedMotion() };
}
