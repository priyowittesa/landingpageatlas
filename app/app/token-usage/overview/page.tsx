import { TokenUsageGate } from "../components/TokenUsageGate";
import { TokenUsageOverview } from "../components/TokenUsageOverview";

export default function TokenUsageOverviewPage() {
  return (
    <TokenUsageGate>
      <TokenUsageOverview />
    </TokenUsageGate>
  );
}
