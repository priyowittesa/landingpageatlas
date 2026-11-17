import { TokenUsageGate } from "../components/TokenUsageGate";
import { TokenUsageUpcomingChanges } from "../components/TokenUsageUpcomingChanges";

export default function TokenUsageUpcomingChangesPage() {
  return (
    <TokenUsageGate requireAdmin>
      <TokenUsageUpcomingChanges />
    </TokenUsageGate>
  );
}
