/** From this many ";"-joined clauses on, a reason reads better as a list than as a paragraph. */
export const REASON_LIST_MIN = 3;

export type ReasonParts = {
  /** What the list is about, e.g. the stage name before the first item */
  lead: string | null;
  items: string[];
};

const stripDot = (text: string) => text.trim().replace(/\.$/, "");
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The list form of a long reason, or null when it is short enough to stay a sentence. */
export function splitReason(text: string): ReasonParts | null {
  const clauses = stripDot(text).split("; ").map(stripDot);
  const [first, ...rest] = clauses;
  if (first === undefined || clauses.length < REASON_LIST_MIN) return null;

  // "Stage: unit: issue; unit: issue": only the first clause carries the extra stage name.
  const segments = first.split(": ");
  const hasLead = segments.length > 1 && rest.every((clause) => clause.split(": ").length < segments.length);
  const items = hasLead ? [segments.slice(1).join(": "), ...rest] : clauses;

  return {
    lead: hasLead ? (segments[0] ?? null) : null,
    items: items.map((item) => `${capitalise(item)}.`)
  };
}

/** True when the lines under a reason would only repeat what its list already says. */
export function isListedInReason(reason: string, lines: string[]): boolean {
  const items = splitReason(reason)?.items.map(stripDot);
  if (!items || lines.length === 0) return false;
  return lines.every((line) => items.some((item) => item.startsWith(stripDot(line))));
}
