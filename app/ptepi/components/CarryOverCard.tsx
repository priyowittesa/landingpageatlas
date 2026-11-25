import Link from "next/link";
import { CalendarArrowUp } from "lucide-react";
import { formatRupiahMillions } from "../format";
import { SectionCard } from "./SectionCard";
import { SyntheticDataBadge } from "./SyntheticDataBadge";
import { Tr } from "./Tr";

type CarryOverCardProps = {
  carryOver: {
    nextYear: number;
    total: number;
    projects: { projectId: string; customer: string; value: number }[];
  };
};

/** S2: contract value the plan does not reach by 31 December, carried to next year, per project. */
export function CarryOverCard({ carryOver }: CarryOverCardProps) {
  return (
    <SectionCard
      title="Revenue carried to next year"
      subtitle="Contract value the plan does not reach by 31 Dec"
      badge={<SyntheticDataBadge />}
    >
      <div className="flex items-baseline gap-3">
        <CalendarArrowUp size={16} aria-hidden className="shrink-0 text-primary-700" />
        <p className="text-2xl font-bold tabular-nums">{formatRupiahMillions(carryOver.total)}</p>
        <p className="text-sm text-muted-foreground">
          <Tr>into</Tr> {carryOver.nextYear}
        </p>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {carryOver.projects.map((project) => (
          <li key={project.projectId} className="flex items-center justify-between gap-3 py-2 text-sm">
            <Link href={`/ptepi/project/${project.projectId}`} className="text-primary-800 hover:underline">
              <span className="font-semibold">{project.projectId}</span>{" "}
              <span className="text-gray-700">· {project.customer}</span>
            </Link>
            <span className="tabular-nums">{formatRupiahMillions(project.value)}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
