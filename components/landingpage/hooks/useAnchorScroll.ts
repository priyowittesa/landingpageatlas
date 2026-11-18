"use client";

import { useEffect } from "react";
import { glideTo } from "../lib/scroll";

function toElement(eventTarget: EventTarget | null) {
  if (eventTarget instanceof Element) return eventTarget;
  if (eventTarget instanceof Node) return eventTarget.parentElement;
  return null;
}

function scrollToY(y: number) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (reducedMotion) window.scrollTo({ top: y, behavior: "auto" });
  else glideTo(y);
}

function scrollTargetOf(section: HTMLElement) {
  if (section.matches("section"))
    return section.querySelector<HTMLElement>(".sec-head") ?? section;
  if (section.matches("details"))
    return section.querySelector<HTMLElement>("summary") ?? section;
  return section;
}

function handleAnchorClick(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;

  const anchor = toElement(event.target)?.closest<HTMLAnchorElement>(
    '.atlas-landing a[href^="#"]'
  );
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (!href || href === "#") return;

  let targetId = href.slice(1);
  try {
    targetId = decodeURIComponent(targetId);
  } catch {
    return;
  }
  const section = targetId === "top" ? null : document.getElementById(targetId);
  if (targetId !== "top" && !section) return;

  event.preventDefault();
  if (targetId === "top") {
    scrollToY(0);
  } else if (section) {
    const navHeight =
      document
        .querySelector<HTMLElement>(".atlas-landing .nav")
        ?.getBoundingClientRect().height ?? 0;
    const top =
      scrollTargetOf(section).getBoundingClientRect().top +
      window.scrollY -
      navHeight -
      20;
    scrollToY(Math.max(0, top));
    if (targetId === "main") {
      section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    }
  }

  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search
  );
}

// In-page links glide to their section instead of jumping, and leave the URL clean.
export function useAnchorScroll() {
  useEffect(() => {
    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);
}
