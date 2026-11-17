import { Suspense } from "react";
import { ScoringConfiguration } from "./scoring-configuration";

export default function ScoringPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading scoring configuration...</div>}>
      <ScoringConfiguration />
    </Suspense>
  );
}
