import { Suspense } from "react";
import { SupervisorQueue } from "./components/queue/supervisor-queue";

export default function BreakdownTriagePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading breakdown queue...</div>}>
      <SupervisorQueue />
    </Suspense>
  );
}
