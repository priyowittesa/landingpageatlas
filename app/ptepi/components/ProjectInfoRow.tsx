import { formatDate, formatDateRange } from "../format";
import { Tr } from "./Tr";
import { HEALTH_LABELS } from "../labels";
import type { ProjectInfo } from "../types";
import { ReasonText } from "./ReasonText";
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
        <dt className="text-sm text-muted-foreground"><Tr>Customer</Tr></dt>
        <dd className="font-semibold">{info.customer}</dd>
        <dd className="text-xs text-muted-foreground">{info.customerFullName}</dd>
      </div>
      <div>
        <dt className="text-sm text-muted-foreground"><Tr>Contract no.</Tr></dt>
        {contractNumbers.map((number) => (
          <dd key={number} className="break-all text-sm font-medium">
            {number}
          </dd>
        ))}
      </div>
      <div>
        <dt className="text-sm text-muted-foreground"><Tr>Contract value</Tr></dt>
        <dd className="font-semibold">
          <RupiahText value={info.contractValue} />
        </dd>
        <dd className="mt-1">
          <SyntheticDataBadge />
        </dd>
      </div>
      <div>
        <dt className="text-sm text-muted-foreground"><Tr>Dates</Tr></dt>
        <dd className="text-sm font-medium">
          {info.startDate || info.endDate
            ? <Tr>{formatDateRange(info.startDate, info.endDate)}</Tr>
            : "Set when the contract is signed"}
        </dd>
        {info.endDateAddendum && (
          <dd className="text-xs text-muted-foreground">
            Extended to {formatDate(info.endDateAddendum)}
          </dd>
        )}
      </div>
      <div>
        <dt className="text-sm text-muted-foreground"><Tr>Lifecycle stage</Tr></dt>
        <dd className="font-semibold"><Tr>{info.stageLabel}</Tr></dd>
        <dd className="mt-1 space-y-1">
          <StatusBadge
            tone={HEALTH_TONE[info.health.rating]}
            label={HEALTH_LABELS[info.health.rating]}
          />
          <ReasonText text={info.health.reason} className="text-xs text-muted-foreground" />
        </dd>
      </div>
    </dl>
  );
}
