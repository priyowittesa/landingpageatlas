import { PurchaseRequestForm } from "../components/purchase-request-form";

export default async function CreateProcurementPage({ searchParams }: { searchParams: Promise<{ work_order_id?: string; source_type?: string }> }) {
  const { work_order_id: workOrderId = "", source_type: sourceType } = await searchParams;
  return <PurchaseRequestForm workOrderId={workOrderId} standalone={sourceType === "manual"} />;
}
