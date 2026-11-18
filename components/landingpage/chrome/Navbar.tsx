"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { NavBrand } from "./NavBrand";

const LOGIN_HREF = "/api/auth/signin/keycloak?callbackUrl=%2Fauth%2Fredirect";

// `sections` lists the section ids the scroll-spy maps onto each link (see public/atlas-landing.js).
const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works", sections: "how-it-works" },
  { href: "#solutions", label: "Solutions", sections: "solutions" },
  {
    href: "#platform",
    label: "Platform",
    sections: "platform integrations ontrix nexa get-started"
  },
  { href: "#pricing", label: "Pricing", sections: "pricing" },
  { href: "#trust", label: "Trust", sections: "trust" }
];

function NavLinks() {
  return NAV_LINKS.map((link) => (
    <a key={link.href} href={link.href} data-sec={link.sections}>
      {link.label}
    </a>
  ));
}

function NavActions() {
  return (
    <>
      <a className="btn btn-ghost btn-sm" href={LOGIN_HREF}>
        Log in
      </a>
      <a className="btn btn-primary btn-sm" href="#walkthrough">
        Book an ATLAS walkthrough
      </a>
    </>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

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

  return (
    <header ref={headerRef} className="nav">
      <div>
        <div className="wrap nav-in">
          <NavBrand />
          <nav className="nav-links" aria-label="Primary">
            <NavLinks />
          </nav>
          <div className="nav-cta">
            <NavActions />
          </div>
        </div>
      </div>
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
        <div>
          <NavLinks />
        </div>
        <div className="atlas-mobile-menu-cta">
          <NavActions />
        </div>
      </nav>
    </header>
  );
}
