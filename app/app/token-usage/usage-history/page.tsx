import { TokenUsageGate } from "../components/TokenUsageGate";
import { TokenUsageHistory } from "../components/TokenUsageHistory";

export default function TokenUsageHistoryPage() {
  return (
    <TokenUsageGate>
      <TokenUsageHistory />
    </TokenUsageGate>
  );
}
