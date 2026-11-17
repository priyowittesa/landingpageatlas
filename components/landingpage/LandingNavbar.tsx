"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

type LandingNavbarProps = { markup: string };

export function LandingNavbar({ markup }: LandingNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const match = markup.match(/^\s*<header\b([^>]*)>([\s\S]*)<\/header>\s*$/i);
  const className = match && /\bclass\s*=\s*(["'])(.*?)\1/i.exec(match[1])?.[2];
  const navMarkup = match?.[2].match(/<nav\b[^>]*class=["']nav-links["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
  const ctaMarkup = match?.[2].match(/<div\b[^>]*class=["']nav-cta["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const desktopQuery = window.matchMedia("(min-width: 1181px)");
    const handleDesktop = () => {
      if (desktopQuery.matches) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktop);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktop);
    };
  }, [isOpen]);

  if (!match) return null;

  return (
    <header ref={headerRef} className={className || undefined}>
      <div dangerouslySetInnerHTML={{ __html: match[2] }} />
      <button
        type="button"
        className="atlas-menu-toggle"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-controls="atlas-mobile-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>
      <nav
        id="atlas-mobile-menu"
        className="atlas-mobile-menu"
        aria-label="Mobile navigation"
        hidden={!isOpen}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) setIsOpen(false);
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: navMarkup }} />
        <div className="atlas-mobile-menu-cta" dangerouslySetInnerHTML={{ __html: ctaMarkup }} />
      </nav>
    </header>
  );
}
