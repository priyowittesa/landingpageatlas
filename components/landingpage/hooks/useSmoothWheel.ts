"use client";

import { useEffect } from "react";
import { attachSmoothWheel } from "../lib/scroll";

export function useSmoothWheel() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return attachSmoothWheel();
  }, []);
}
