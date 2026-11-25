"use client";

import { Tr } from "./Tr";
import Table from "@/components/Table";
import type { TableColumn } from "@/types/type";
import { STAGE_STATUS_LABELS } from "../labels";
import type { EarningStageRow } from "../types";
import { PercentText } from "./PercentText";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

const STATUS = STAGE_STATUS_LABELS;

const COLUMNS: TableColumn<EarningStageRow>[] = [
  {
    key: "stage",
    header: <Tr>Stage</Tr>,
    render: (row) => (
      <div className="min-w-40">
        <div className="font-semibold">
          {row.stageNo}. <Tr>{row.label}</Tr>
        </div>
        <div className="text-xs text-muted-foreground"><Tr>{row.requiredDocument}</Tr></div>
        <div className="mt-1">
          <SyntheticDataBadge real={row.dataOrigin === "real"} />
        </div>
      </div>
    )
  },
  {
    key: "weight",
    header: <Tr>Weight</Tr>,
    className: "text-right",
    render: (row) => <PercentText fraction={row.weight} />
  },
  {
    key: "stageValue",
    header: <Tr>Stage value</Tr>,
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.stageValue} />
  },
  {
    key: "earnedValue",
    header: <Tr>Earned</Tr>,
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.earnedValue} />
  },
  {
    key: "blockedValue",
    header: <Tr>Blocked</Tr>,
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.blockedValue} />
  },
  {
    key: "signed",
    header: <Tr>Signed BA</Tr>,
    className: "text-right whitespace-nowrap",
    render: (row) => `${row.signedCount} of ${row.requiredCount}`
  },
  {
    key: "status",
    header: <Tr>Status</Tr>,
    render: (row) => (
      <StatusBadge tone={STATUS[row.status].tone} label={STATUS[row.status].label} />
    )
  },

];

type EarningRuleTableProps = {
  stages: EarningStageRow[];
};

export function EarningRuleTable({ stages }: EarningRuleTableProps) {
  return (
    <Table
      name="earning stage"
      columns={COLUMNS}
      data={stages}
      getRowId={(row) => row.stageNo}
    />
  );
}
