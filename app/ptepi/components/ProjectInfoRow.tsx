import { formatDate, formatDateRange } from "../format";
import { HEALTH_LABELS } from "../labels";
import type { ProjectInfo } from "../types";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";
import { HEALTH_TONE } from "./status";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

type ProjectInfoRowProps = {
  info: ProjectInfo;
};

export function ProjectInfoRow({ info }: ProjectInfoRowProps) {
  const contractNumbers = (info.contractNumber ?? "Not contracted yet").split(";").map((n) => n.trim());
  return (
    <dl className="grid grid-cols-1 gap-5 ptepi-card p-6 sm:grid-cols-2 xl:grid-cols-5">
      <div>
        <dt className="text-sm text-muted-foreground">Customer</dt>
        <dd className="font-semibold">{info.customer}</dd>
        <dd className="text-xs text-muted-foreground">{info.customerFullName}</dd>
      </div>
      <div>
        <dt className="text-sm text-muted-foreground">Contract no.</dt>
        {contractNumbers.map((number) => (
          <dd key={number} className="break-all text-sm font-medium">
            {number}
          </dd>
        ))}
      </div>
      <div>
        <dt className="text-sm text-muted-foreground">Contract value</dt>
        <dd className="font-semibold">
          <RupiahText value={info.contractValue} />
        </dd>
        <dd className="mt-1">
          <SyntheticDataBadge />
        </dd>
      </div>
      <div>
        <dt className="text-sm text-muted-foreground">Dates</dt>
        <dd className="text-sm font-medium">
          {info.startDate || info.endDate
            ? formatDateRange(info.startDate, info.endDate)
            : "Set when the contract is signed"}
        </dd>
        {info.endDateAddendum && (
          <dd className="text-xs text-muted-foreground">
            Extended to {formatDate(info.endDateAddendum)}
          </dd>
        )}
      </div>
      <div>
        <dt className="text-sm text-muted-foreground">Lifecycle stage</dt>
        <dd className="font-semibold">{info.stageLabel}</dd>
        <dd className="mt-1 space-y-1">
          <StatusBadge
            tone={HEALTH_TONE[info.health.rating]}
            label={HEALTH_LABELS[info.health.rating]}
          />
          <div className="text-xs text-muted-foreground">{info.health.reason}</div>
        </dd>
      </div>
    </dl>
  );
}
