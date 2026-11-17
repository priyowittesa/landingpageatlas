import { TokenUsageGate } from "../components/TokenUsageGate";
import { TokenUsageClients } from "../components/TokenUsageClients";

export default function TokenUsageClientsPage() {
  return (
    <TokenUsageGate requireAdmin>
      <TokenUsageClients />
    </TokenUsageGate>
  );
}
