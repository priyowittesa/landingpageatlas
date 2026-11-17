import { Suspense } from "react";
import { WorkOrderCostList } from "./work-order-cost-list";
export default function Page() { return <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading work order costs...</div>}><WorkOrderCostList /></Suspense>; }
