"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { animate, remove } from "animejs";
import { LandingNavbar } from "./LandingNavbar";
import { LANDING_SECTION_COMPONENTS, LandingSection } from "./sections";

type LandingParts = {
  lead: string;
  navbar: string;
  mainBeforeSections: string;
  sections: string[];
  mainAfterSections: string;
  tail: string;
} | null;

function splitLandingMarkup(html: string): LandingParts {
  const navbarMatch = /<header\b[^>]*>[\s\S]*?<\/header>/i.exec(html);
  const mainOpen = /<main\b[^>]*>/i.exec(html);
  if (!navbarMatch || !mainOpen) return null;

  const mainStart = mainOpen.index + mainOpen[0].length;
  const closePattern = /<\/main\s*>/gi;
  closePattern.lastIndex = mainStart;
  const mainClose = closePattern.exec(html);
  if (!mainClose) return null;

  const mainContent = html.slice(mainStart, mainClose.index);
  const sectionPattern = /<section\b[\s\S]*?<\/section>/gi;
  const matches = [...mainContent.matchAll(sectionPattern)];
  if (matches.length === 0) return null;

  const sections = matches.map((match) => match[0]);
  const first = matches[0];
  const last = matches[matches.length - 1];

  return {
    lead: html.slice(0, navbarMatch.index),
    navbar: navbarMatch[0],
    mainBeforeSections: mainContent.slice(0, first.index),
    sections,
    mainAfterSections: mainContent.slice(last.index! + last[0].length),
    tail: html.slice(mainClose.index + mainClose[0].length)
  };
}

let glideFrame = 0;

// Native `behavior: "smooth"` has a fixed, short duration. This glide is slower and
// scales with distance (1.1s – 2.2s), easing in and out; any user input cancels it.
function glideTo(targetY: number) {
  cancelAnimationFrame(glideFrame);
  // The wheel inertia may still be easing toward the spot the user scrolled to. Both loops call
  // scrollTo every frame, so without this the wheel one wins and drags the page back.
  window.dispatchEvent(new Event("atlas:scroll-jump"));
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.min(Math.max(0, targetY), Math.max(0, maxY));
  const distance = endY - startY;
  if (Math.abs(distance) < 2) return;

  const duration = Math.min(2200, Math.max(1100, 700 + Math.abs(distance) * 0.35));
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const cancelEvents = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  const stop = () => {
    cancelAnimationFrame(glideFrame);
    cancelEvents.forEach((name) => window.removeEventListener(name, stop));
  };
  cancelEvents.forEach((name) =>
    window.addEventListener(name, stop, { passive: true })
  );

  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) glideFrame = requestAnimationFrame(step);
    else stop();
  };
  glideFrame = requestAnimationFrame(step);
}

function canScrollInside(start: Element | null, deltaY: number) {
  for (let el = start; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
    }
  }
  return false;
}

// Mouse-wheel inertia: the wheel moves a target position and the page eases toward it
// every frame, so notches glide instead of jumping. Native scrolling is untouched for
// touch, keyboard, zoom, horizontal gestures and nested scrollers.
function attachSmoothWheel() {
  let target = window.scrollY;
  let position = target;
  let frame = 0;
  let last = 0;
  const EASE = 0.075; // per 16.7ms frame; lower = slower, floatier

  const tick = (now: number) => {
    const dt = Math.min(48, now - last) / 16.7;
    last = now;
    // Browsers snap scroll positions to whole pixels; keep our own float position or
    // sub-pixel steps stall a few pixels short of the target.
    if (Math.abs(window.scrollY - position) > 2) position = window.scrollY;
    const k = 1 - Math.pow(1 - EASE, dt);
    position += (target - position) * k;
    if (Math.abs(target - position) < 0.5) {
      position = target;
      window.scrollTo(0, target);
      frame = 0;
      return;
    }
    window.scrollTo(0, position);
    frame = requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.shiftKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      event.deltaY === 0
    )
      return;
    if (canScrollInside(event.target as Element | null, event.deltaY)) return;

    event.preventDefault();
    const unit =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (!frame) target = position = window.scrollY;
    target = Math.min(Math.max(0, target + event.deltaY * unit), max);
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  // Keyboard, scrollbar drags and anchor glides move the page on their own: resync.
  const onScroll = () => {
    if (!frame) target = position = window.scrollY;
  };

  // The page moves itself (a filter change jumps back to the list): drop the glide so it cannot undo the jump.
  const onJump = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    target = position = window.scrollY;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("atlas:scroll-jump", onJump);
  return () => {
    window.removeEventListener("atlas:scroll-jump", onJump);
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
  };
}

export function LandingPage({ html }: { html: string }) {
  const parts = splitLandingMarkup(html);

  const handleAnchorScroll = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    const eventTarget = event.target;
    const target =
      eventTarget instanceof Element
        ? eventTarget
        : eventTarget instanceof Node
          ? eventTarget.parentElement
          : null;
    if (!target) return;
    const anchor = target.closest<HTMLAnchorElement>(
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
    const section =
      targetId === "top" ? null : document.getElementById(targetId);
    if (targetId !== "top" && !section) return;

    event.preventDefault();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const behavior: ScrollBehavior = "auto";
    const scrollToY = (y: number) =>
      reducedMotion
        ? window.scrollTo({ top: y, behavior })
        : glideTo(y);
    if (targetId === "top") {
      scrollToY(0);
    } else if (section) {
      const navHeight =
        document
          .querySelector<HTMLElement>(".atlas-landing .nav")
          ?.getBoundingClientRect().height ?? 0;
      const scrollTarget = section.matches("section")
        ? (section.querySelector<HTMLElement>(".sec-head") ?? section)
        : section.matches("details")
          ? (section.querySelector<HTMLElement>("summary") ?? section)
          : section;
      const top =
        scrollTarget.getBoundingClientRect().top +
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
  };

  useEffect(() => {
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap";
    fonts.dataset.atlasLanding = "true";
    document.head.appendChild(fonts);

    const handleLoginClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const loginLink = target.closest<HTMLAnchorElement>(
        '.atlas-landing a[href="/api/auth/signin/keycloak?callbackUrl=%2Fauth%2Fredirect"]'
      );
      if (!loginLink) return;

      event.preventDefault();
      void signIn("keycloak", { callbackUrl: "/auth/redirect" });
    };

    document.addEventListener("click", handleLoginClick);
    document.addEventListener("click", handleAnchorScroll, true);

    return () => {
      document.removeEventListener("click", handleLoginClick);
      document.removeEventListener("click", handleAnchorScroll, true);
      fonts.remove();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return attachSmoothWheel();
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/atlas-landing.js?v=20261117e";
    script.dataset.atlasLanding = "true";
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;

    const sections = document.querySelectorAll<HTMLElement>(
      ".atlas-landing main > section[data-atlas-reveal]"
    );
    const targets = Array.from(sections).flatMap((section) =>
      Array.from(
        section.querySelectorAll<HTMLElement>(
          ":scope > .wrap > *, :scope > .hero-pic-wrap"
        )
      ).filter(
        // .sol grows to thousands of px when all applications are open; an 8% visibility
        // threshold is never reached on a phone, so it would stay hidden. It animates its own cards.
        (target) =>
          target.getBoundingClientRect().height > 0 && !target.matches(".sol, .cfg")
      )
    );
    const originalStyles = new Map(
      targets.map((target) => [
        target,
        { opacity: target.style.opacity, transform: target.style.transform }
      ])
    );
    const visible = new Map<HTMLElement, boolean>();

    targets.forEach((target) => {
      target.style.opacity = "0";
      target.style.transform = "translateY(24px)";
      visible.set(target, false);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (visible.get(target) === entry.isIntersecting) return;
          visible.set(target, entry.isIntersecting);
          remove(target);
          animate(target, {
            opacity: entry.isIntersecting ? 1 : 0,
            translateY: entry.isIntersecting ? 0 : 24,
            duration: 650,
            ease: "out(3)"
          });
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    );
    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      originalStyles.forEach((style, target) => {
        remove(target);
        target.style.opacity = style.opacity;
        target.style.transform = style.transform;
      });
    };
  }, []);

  if (!parts) {
    return (
      <div
        className="atlas-landing"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="atlas-landing">
      <div dangerouslySetInnerHTML={{ __html: parts.lead }} />
      <LandingNavbar markup={parts.navbar} />
      <main id="main">
        <div dangerouslySetInnerHTML={{ __html: parts.mainBeforeSections }} />
        {parts.sections.map((markup, index) => {
          const Section = LANDING_SECTION_COMPONENTS[index] ?? LandingSection;
          return <Section key={index} markup={markup} />;
        })}
        <div dangerouslySetInnerHTML={{ __html: parts.mainAfterSections }} />
      </main>
      <div
        className="atlas-landing-tail"
        dangerouslySetInnerHTML={{ __html: parts.tail }}
      />
    </div>
  );
}
