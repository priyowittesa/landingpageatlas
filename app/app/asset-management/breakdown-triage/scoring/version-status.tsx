import { Check, Pencil } from "lucide-react";
import { StatusPill } from "../components/triage-badges";
import type { ScoringStatus } from "./use-scoring-configurations";

export function VersionStatusBadge({ status }: { status: ScoringStatus }) {
  switch (status) {
    case "active":
      return <StatusPill tone="green" icon={Check}>Active</StatusPill>;
    case "draft":
      return <StatusPill tone="primary" icon={Pencil}>Draft</StatusPill>;
    default:
      return <StatusPill tone="muted">Archived</StatusPill>;
  }
}
