import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OpenProjectButton({
  projectId,
  compact = false
}: {
  projectId: string;
  compact?: boolean;
}) {
  return (
    <Button
      asChild
      className={cn(
        "h-10 rounded-lg bg-primary-700 px-6 text-sm font-medium text-white hover:bg-primary-800",
        compact ? "w-full @min-[64rem]:w-[165px]" : "flex-1"
      )}
    >
      <Link href={`/app/daily-diaries/daily-activities/${projectId.toLowerCase()}`}>
        Open Projects
        <Image
          src="/images/daily-diaries/arrow-right.svg"
          alt=""
          width={16}
          height={16}
        />
      </Link>
    </Button>
  );
}
