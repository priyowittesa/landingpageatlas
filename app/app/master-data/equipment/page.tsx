import { Suspense } from "react";

import { EquipmentList } from "./components/equipment-list";

export default function EquipmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
          Loading equipment...
        </div>
      }
    >
      <EquipmentList />
    </Suspense>
  );
}