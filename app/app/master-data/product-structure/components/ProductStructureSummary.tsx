import StatusBadge from "./ProductStructureStatusBadge";
import type {
  ProductNode,
  ProductionLineGroup,
  LineItem,
  PartItem,
} from "../types";

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-lg border border-border p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-foreground">
        {typeof children === "string" || typeof children === "number" ? (
          <p className="text-sm font-semibold">{children}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function ProductSummaryCard({ data }: { data: ProductNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <SummaryField label="Product Code">{data.code}</SummaryField>
      <SummaryField label="Product Name">{data.name}</SummaryField>
      <SummaryField label="Status">
        <StatusBadge status={data.status} />
      </SummaryField>
    </div>
  );
}

export function GroupSummaryCard({ data }: { data: ProductionLineGroup }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <SummaryField label="Group Code">{data.groupCode}</SummaryField>
      <SummaryField label="Group Name">{data.groupName}</SummaryField>
      <SummaryField label="Production Lines">
        {data.productionLines} {data.productionLines === 1 ? "line" : "lines"}
      </SummaryField>
      <SummaryField label="Status">
        <StatusBadge status={data.status} />
      </SummaryField>
    </div>
  );
}

export function LineSummaryCard({ data }: { data: LineItem }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <SummaryField label="Line Code">{data.code}</SummaryField>
      <SummaryField label="Line Name">{data.name}</SummaryField>
      <SummaryField label="Status">
        <StatusBadge status={data.status} />
      </SummaryField>
    </div>
  );
}

export function PartSummaryCard({ data }: { data: PartItem }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <SummaryField label="Part Number">{data.number}</SummaryField>
      <SummaryField label="Part Name">{data.name}</SummaryField>
      <SummaryField label="Status">
        <StatusBadge status={data.status} />
      </SummaryField>
    </div>
  );
}
