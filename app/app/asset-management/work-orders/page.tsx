import { Suspense } from "react";
import { WorkOrderList } from "./work-order-list";

export default function Page() {
  return <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading work orders...</div>}><WorkOrderList /></Suspense>;
}
