import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SEVERITY_LABELS } from "../labels";
import type { AttentionGroup } from "../types";
import { StatusBadge } from "./StatusBadge";
import { SEVERITY_TONE } from "./status";

type NeedsAttentionPanelProps = {
  groups: AttentionGroup[];
};

export function NeedsAttentionPanel({ groups }: NeedsAttentionPanelProps) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.severity} aria-label={SEVERITY_LABELS[group.severity]}>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge
              tone={SEVERITY_TONE[group.severity]}
              label={SEVERITY_LABELS[group.severity]}
            />
            <span className="text-xs text-muted-foreground">
              {group.items.length} exceptions
            </span>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {group.items.map((item) => (
              <li key={item.exceptionNo}>
                <Link
                  href={`/ptepi/project/${item.projectId}`}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 hover:bg-primary-50"
                >
                  <span className="min-w-0">
                    <span className="text-sm font-semibold">{item.projectId}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.customer}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
