"use client";

import { useEffect } from "react";

// The interactive parts (applications browser, pricing configurator, FAQ filter, scroll-spy,
// scroll choreography, ...) still live in public/atlas-landing.js and work on the DOM the
// section components render. Loaded after mount so it always finds the markup.
export function useLegacyLandingScript() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/atlas-landing.js?v=20261117e";
    script.dataset.atlasLanding = "true";
    document.body.appendChild(script);
    return () => script.remove();
  }, []);
}
