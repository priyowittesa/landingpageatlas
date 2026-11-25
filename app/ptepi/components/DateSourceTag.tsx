import { Calculator, FileCheck2 } from "lucide-react";
import type { DateSource } from "../types";
import { Tr } from "./Tr";

/** Where a date comes from, so an estimate is never read as a commitment. Icon + text. */
export function DateSourceTag({ source }: { source: DateSource }) {
  const vendor = source === "vendor-reported";
  const Icon = vendor ? FileCheck2 : Calculator;
  return (
    <span
      className={
        vendor
          ? "inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[0.75rem] font-semibold text-blue-800 ring-1 ring-inset ring-blue-200"
          : "inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[0.75rem] font-semibold text-primary-800 ring-1 ring-inset ring-primary-200"
      }
    >
      <Icon size={12} aria-hidden />
      <Tr>{vendor ? "Vendor-reported" : "ATLAS-estimated"}</Tr>
    </span>
  );
}
