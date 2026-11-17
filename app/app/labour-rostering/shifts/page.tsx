import { Suspense } from "react";

import { ShiftList } from "./components/shift-list";

export default function ShiftsPage() {
  return (
    <Suspense>
      <ShiftList />
    </Suspense>
  );
}
