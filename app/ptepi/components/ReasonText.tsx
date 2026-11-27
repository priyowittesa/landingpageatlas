"use client";

import { cn } from "@/lib/utils";
import { splitReason } from "./reason-list";
import { useT } from "./Tr";

type ReasonTextProps = {
  /** English reason; clauses are joined by "; " */
  text: string;
  className?: string;
  /** Show only this many items and count the rest */
  limit?: number;
};

/** A reason as a sentence, or as a bulleted list when it names many items. */
export function ReasonText({ text, className, limit }: ReasonTextProps) {
  const t = useT();
  const translated = t(text);
  const parts = splitReason(translated);
  if (!parts) return <p className={className}>{translated}</p>;

  const shown = parts.items.slice(0, limit);
  const hidden = parts.items.length - shown.length;

  return (
    <div className={cn("space-y-1.5", className)}>
      {parts.lead && <p className="font-semibold">{parts.lead}</p>}
      <ul className="list-disc space-y-1 pl-5">
        {shown.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className="pl-5 font-medium text-primary-800">
          +{hidden} {t("more")}
        </p>
      )}
    </div>
  );
}
