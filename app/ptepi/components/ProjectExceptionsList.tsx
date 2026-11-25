import { Tr } from "./Tr";
import { SEVERITY_LABELS } from "../labels";
import type { ProjectExceptionItem } from "../types";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { SEVERITY_TONE } from "./status";

type ProjectExceptionsListProps = {
  items: ProjectExceptionItem[];
};

export function ProjectExceptionsList({ items }: ProjectExceptionsListProps) {
  if (items.length === 0) {
    return <EmptyState title="No exceptions detected" description="This project has no seeded exception." />;
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <li key={item.exceptionNo} className="flex items-start gap-3 p-3">
          <StatusBadge
            tone={SEVERITY_TONE[item.severity]}
            label={SEVERITY_LABELS[item.severity]}
          />
          <span className="text-sm"><Tr>{item.label}</Tr></span>
        </li>
      ))}
    </ul>
  );
}
