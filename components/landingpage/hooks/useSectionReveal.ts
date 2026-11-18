"use client";

import { useEffect } from "react";
import { animate, remove } from "animejs";

const HIDDEN_OFFSET = 24;

// Each part of a section (heading, copy, picture) fades up the first time it enters the
// viewport and fades back out when it leaves. Skipped for reduced motion.
export function useSectionReveal() {
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
      target.style.transform = `translateY(${HIDDEN_OFFSET}px)`;
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
            translateY: entry.isIntersecting ? 0 : HIDDEN_OFFSET,
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
}
