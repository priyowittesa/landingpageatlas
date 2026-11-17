import type { LucideIcon } from "lucide-react";

export function EmployeeSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex items-start gap-2 border-b pb-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary-700 text-white">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-5">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}
