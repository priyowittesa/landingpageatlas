import { requireModuleAccess } from "@/lib/require-auth";
import { OperationalDashboard } from "./OperationalDashboard";

export default async function OperationalDashboardPage() {
  await requireModuleAccess("well-performance", "/well-performance");
  return <OperationalDashboard />;
}
