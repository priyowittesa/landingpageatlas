"use client";

import { LoaderCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { RateCardForm } from "../../components/rate-card-form";
import { useRateCard, useUpdateRateCard } from "../../use-rate-cards";

export default function EditRateCardPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: rateCard, isLoading, isError, refetch } = useRateCard(id);
  const updateRateCard = useUpdateRateCard();

  useEffect(() => {
    if (!rateCard) return;

    setBreadcrumbItems([
      { title: "Master Data", href: "/master-data" },
      { title: "Rate Cards", href: "/app/master-data/rate-cards" },
      { title: rateCard.name || rateCard.code || "Rate Card" },
      { title: "Edit" }
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, rateCard, setBreadcrumbItems]);

  if (isLoading) {
    return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading rate card...</div>;
  }

  if (isError || !rateCard) {
    return <div className="flex min-h-80 flex-col items-center justify-center gap-3"><p className="text-sm text-muted-foreground">Rate card data could not be loaded.</p><Button variant="outline" onClick={() => refetch()}>Try Again</Button></div>;
  }

  return (
    <RateCardForm
      title="Edit Rate Card"
      description="Update rate card information."
      initialValues={{
        code: rateCard.code,
        name: rateCard.name,
        role_ids: rateCard.role_ids,
        currency: rateCard.currency,
        base_rate: rateCard.base_rate,
        unit: rateCard.unit,
      }}
      pending={updateRateCard.isPending}
      submitLabel="Save Changes"
      onCancel={() => router.push("/app/master-data/rate-cards")}
      onSubmit={(payload) => updateRateCard.mutate({ id, payload }, { onSuccess: () => router.push("/app/master-data/rate-cards") })}
    />
  );
}
