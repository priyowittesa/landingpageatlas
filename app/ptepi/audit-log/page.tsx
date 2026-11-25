import { History } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { epiData } from "../data";
import { buildSeedActions } from "../store/action-helpers";
import { AuditLogBoard } from "./components/AuditLogBoard";
import { getAuditEvents } from "./logic";

export default function AuditLogPage() {
  const seeds = buildSeedActions(epiData);
  return (
    <div className="space-y-8">
      <ScreenHeader
        icon={History}
        title="Audit log"
        subtitle="Who did what and when: AI answers, alerts, approvals and changes. Changes made in this browser are added on top."
      />
      <AuditLogBoard events={getAuditEvents(epiData, seeds)} seeds={seeds} />
    </div>
  );
}
