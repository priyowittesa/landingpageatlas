import { Suspense } from "react";

import EmployeePageContent from "./components/EmployeePageContent";

export default function MasterDataEmployeePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
          Loading employees...
        </div>
      }
    >
      <EmployeePageContent />
    </Suspense>
  );
}