import { Suspense } from "react";

import { PreventiveMaintenanceList } from "./preventive-maintenance-list";

export default function PreventiveMaintenancePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading preventive maintenance...
        </div>
      }
    >
      <PreventiveMaintenanceList />
    </Suspense>
  );
}
