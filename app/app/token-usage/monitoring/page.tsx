import { TokenUsageGate } from "../components/TokenUsageGate";
import { TokenUsageMonitoring } from "../components/TokenUsageMonitoring";

export default function TokenUsageMonitoringPage() {
  return (
    <TokenUsageGate requireAdmin>
      <TokenUsageMonitoring />
    </TokenUsageGate>
  );
}
