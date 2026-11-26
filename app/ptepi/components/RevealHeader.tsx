"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { nextScrollReveal } from "./scroll-reveal";

/**
 * A page header that slides away while the reader scrolls down and comes back on the first
 * scroll up. It stays while it holds keyboard focus (see ptepi.css).
 */
export function RevealHeader({ className, children }: { className?: string; children: ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let state = { hidden: false, anchorY: window.scrollY };
    const onScroll = () => {
      state = nextScrollReveal(state, window.scrollY);
      setHidden(state.hidden);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-hidden={hidden} className={cn("ptepi-screen-header", className)}>
      {children}
    </header>
  );
}
