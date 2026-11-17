import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

export default function AddButton({
  label,
  onClick,
  disabled = false,
  className,
  iconSize = 16,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
}) {
  return (
    <Button
      className={cn(
        `h-9 gap-2 bg-primary-700 px-4 hover:bg-primary-800`,
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Plus size={iconSize} />
      {label}
    </Button>
  );
}
