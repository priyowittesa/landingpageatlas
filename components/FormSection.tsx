import { type LucideIcon } from "lucide-react";

export default function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const Icon = icon;

  return (
    <div className="shadow-md p-5 rounded-md space-y-4 bg-white dark:bg-zinc-950 border">
      <div className="flex items-center gap-5">
        {icon && (
          <div className="bg-primary-50 rounded-xl h-12 w-12 flex items-center justify-center">
            {Icon && <Icon className="h-5 w-5 text-primary-700" />}
          </div>
        )}

        <div className="flex flex-col">
          <strong className="text-lg">{title}</strong>
          <span className="text-muted-foreground text-sm">{subtitle}</span>
        </div>
      </div>

      {children}
    </div>
  );
}
