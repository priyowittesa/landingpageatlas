"use client";

import { useRouter } from "next/navigation";

import { RateCardForm } from "../components/rate-card-form";
import { useCreateRateCard } from "../use-rate-cards";

export default function NewRateCardPage() {
  const router = useRouter();
  const createRateCard = useCreateRateCard();

  return (
    <RateCardForm
      title="Add Rate Card"
      description="Create a new rate card record in the system."
      pending={createRateCard.isPending}
      submitLabel="Save Rate Card"
      onCancel={() => router.push("/app/master-data/rate-cards")}
      onSubmit={(payload) => createRateCard.mutate(payload, { onSuccess: () => router.push("/app/master-data/rate-cards") })}
    />
  );
}
