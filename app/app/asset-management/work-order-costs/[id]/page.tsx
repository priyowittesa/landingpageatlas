import { WorkOrderCostDetailPage } from "./work-order-cost-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkOrderCostDetailPage id={id} />;
}
