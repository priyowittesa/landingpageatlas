export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-success",
    Draft: "bg-warning",
    Inactive: "bg-destructive",
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium text-white ${styles[status] || "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
