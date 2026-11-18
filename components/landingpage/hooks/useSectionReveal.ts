"use client";

import { useEffect } from "react";

const HIDDEN_OFFSET = 24;
const DURATION_MS = 650;
// Same curve as anime.js out(3): 1 - (1 - t)^3.
const EASE_OUT_CUBIC = "cubic-bezier(0.215, 0.61, 0.355, 1)";

// Each part of a section (heading, copy, picture) fades up the first time it enters the
// viewport and fades back out when it leaves. Skipped for reduced motion.
//
// The motion runs through the Web Animations API instead of a JS tween: opacity and transform
// are then animated on the compositor, so big blocks (screenshots with large shadows, the
// ontrix graph) are not repainted by the main thread on every frame while the page scrolls.
export function useSectionReveal() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      typeof Element.prototype.animate !== "function"
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
    const running = new Map<HTMLElement, Animation>();

    const hiddenTransform = `translateY(${HIDDEN_OFFSET}px)`;
    const shownTransform = "translateY(0px)";

    const setState = (target: HTMLElement, show: boolean) => {
      target.style.opacity = show ? "1" : "0";
      target.style.transform = show ? shownTransform : hiddenTransform;
    };

    const play = (target: HTMLElement, show: boolean) => {
      // Start from wherever an interrupted animation currently is.
      const computed = getComputedStyle(target);
      const from = { opacity: computed.opacity, transform: computed.transform };
      running.get(target)?.cancel();

      setState(target, show);
      const to = {
        opacity: show ? "1" : "0",
        transform: show ? shownTransform : hiddenTransform
      };
      const animation = target.animate([from, to], {
        duration: DURATION_MS,
        easing: EASE_OUT_CUBIC
      });
      running.set(target, animation);
      animation.onfinish = () => {
        if (running.get(target) === animation) running.delete(target);
      };
    };

    targets.forEach((target) => {
      setState(target, false);
      visible.set(target, false);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (visible.get(target) === entry.isIntersecting) return;
          visible.set(target, entry.isIntersecting);
          play(target, entry.isIntersecting);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    );
    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      running.forEach((animation) => animation.cancel());
      running.clear();
      originalStyles.forEach((style, target) => {
        target.style.opacity = style.opacity;
        target.style.transform = style.transform;
      });
    };
  }, []);
}
