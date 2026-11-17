import { TokenUsageGate } from "../components/TokenUsageGate";
import { TokenUsageAuditTrail } from "../components/TokenUsageAuditTrail";

export default function TokenUsageAuditTrailPage() {
  return (
    <TokenUsageGate requireAdmin>
      <TokenUsageAuditTrail />
    </TokenUsageGate>
  );
}
