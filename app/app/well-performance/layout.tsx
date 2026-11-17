import { requireModuleAccess } from "@/lib/require-auth";
import { WellPerformanceShell } from "./WellPerformanceShell";

export default async function WellPerformanceLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireModuleAccess("well-performance", "/well-performance");
  return <WellPerformanceShell>{children}</WellPerformanceShell>;
}
