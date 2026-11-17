import { Button } from "@/components/ui/button";
import { capacityError, enumLabel, formatNumber } from "../api";
import { Badge } from "./Badge";

export function ApiState({ query }: { query: { isPending: boolean; error: unknown; refetch: () => unknown } }) {
  if (query.error) return (
    <div role="alert" className="rounded-lg border border-destructive p-4 text-sm">
      {capacityError(query.error)}
      <Button variant="outline" className="ml-3" onClick={() => void query.refetch()}>Retry</Button>
    </div>
  );
  return query.isPending ? <p role="status" className="p-4 text-sm text-muted-foreground">Loading capacity data...</p> : null;
}

export function StatusBadge({ value }: { value?: string }) {
  const label = enumLabel(value);
  if (label === "-") return <span>-</span>;
  const color = /(_NG|FAILED|REJECTED|CANCELLED)$/.test(value ?? "") ? "red"
    : /WARNING|PENDING|DRAFT/.test(value ?? "") ? "orange"
    : /SCHEDULED|IN_PROGRESS/.test(value ?? "") ? "blue" : "green";
  return <Badge color={color}>{label}</Badge>;
}

export function CapacityValue({ value, status, problem }: { value?: number; status?: string; problem?: string }) {
  return <span className="inline-flex items-center gap-2" title={problem}>
    {formatNumber(value, "%")} <StatusBadge value={status} />
  </span>;
}
