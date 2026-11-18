"use client";

import { useEffect } from "react";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap";

export function useLandingFonts() {
  useEffect(() => {
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = FONTS_HREF;
    fonts.dataset.atlasLanding = "true";
    document.head.appendChild(fonts);
    return () => fonts.remove();
  }, []);
}
