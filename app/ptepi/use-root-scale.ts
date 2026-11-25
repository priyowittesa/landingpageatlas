"use client";

import { useEffect, useState } from "react";

/** Root font size over 16px: 1 up to a 1440px screen, larger on wider ones (see ptepi.css). */
export function useRootScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const read = () => setScale(parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return scale;
}

/** Chart margins in px, grown with the root size. */
export function chartMargin(scale: number, margin = { top: 4, right: 24, bottom: 0, left: 8 }) {
  return {
    top: margin.top * scale,
    right: margin.right * scale,
    bottom: margin.bottom * scale,
    left: margin.left * scale
  };
}
