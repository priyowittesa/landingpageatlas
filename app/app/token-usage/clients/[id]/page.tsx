"use client";

import { useParams } from "next/navigation";
import { TokenUsageGate } from "../../components/TokenUsageGate";
import { TokenUsageClientDetail } from "../../components/TokenUsageClientDetail";

export default function TokenUsageClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  return (
    <TokenUsageGate requireAdmin>
      <TokenUsageClientDetail clientId={clientId} />
    </TokenUsageGate>
  );
}
