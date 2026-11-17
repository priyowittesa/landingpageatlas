import AddButton from "./AddButton";

export default function PageHeader({
  title,
  subtitle,
  handleAdd,
  addBtnLabel,
}: {
  title: string;
  subtitle: string;
  addBtnLabel?: string;
  handleAdd?: () => void;
}) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
          {title}
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">{subtitle}</p>
      </div>

      {handleAdd && <AddButton label={addBtnLabel ?? ""} onClick={handleAdd} />}
    </header>
  );
}
