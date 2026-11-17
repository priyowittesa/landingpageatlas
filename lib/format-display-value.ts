const DISPLAY_ACRONYMS = new Set([
  "API",
  "CEO",
  "CSV",
  "HR",
  "HSE",
  "HSEQ",
  "ID",
  "IT",
  "QA",
  "QHSE",
  "UI",
  "UX",
  "WFH",
]);

export function formatDisplayValue(
  value: string | null | undefined,
  fallback = "-",
) {
  const normalized = value?.trim().replace(/_+/g, " ");
  if (!normalized) return fallback;

  return normalized
    .split(/\s+/)
    .map((word) => {
      const uppercaseWord = word.toLocaleUpperCase();
      if (DISPLAY_ACRONYMS.has(uppercaseWord)) return uppercaseWord;

      return word
        .toLocaleLowerCase()
        .replace(
          /(^|[-/()])(\p{L})/gu,
          (_, prefix: string, letter: string) =>
            `${prefix}${letter.toLocaleUpperCase()}`,
        );
    })
    .join(" ");
}
