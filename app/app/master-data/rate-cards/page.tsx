import { Suspense } from "react";

import { RateCardList } from "./components/rate-card-list";

export default function RateCardsPage() {
  return (
    <Suspense>
      <RateCardList />
    </Suspense>
  );
}
