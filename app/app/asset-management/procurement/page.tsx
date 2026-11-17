import { Suspense } from "react";
import { ProcurementList } from "./components/procurement-list";

export default function ProcurementPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading purchase requests...</div>}>
      <ProcurementList />
    </Suspense>
  );
}
