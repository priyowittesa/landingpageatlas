import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export function FormFooter({
  nextLabel,
  onBack,
  onNext,
  isFirst,
  isLast,
  pending
}: {
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={onBack} disabled={pending}>
        {isFirst ? (
          "Cancel"
        ) : (
          <>
            <ArrowLeft size={14} />
            Previous
          </>
        )}
      </Button>

      <Button onClick={onNext} disabled={pending}>
        {pending && <Loader2 size={14} className="animate-spin" />}
        {isLast ? "Complete" : `Next : ${nextLabel}`}{" "}
        {!isLast && <ArrowRight size={14} />}
      </Button>
    </div>
  );
}
