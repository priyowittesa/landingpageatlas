import type { ComponentPropsWithoutRef } from "react";

// Every top-level section fades in as it scrolls into view (see hooks/useSectionReveal.ts).
export function RevealSection({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      className={[className, "atlas-reveal"].filter(Boolean).join(" ")}
      data-atlas-reveal="true"
    />
  );
}
