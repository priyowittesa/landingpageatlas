import { X } from "lucide-react";

export function FormModal({
  title,
  children,
  onClose,
  description,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {description && (
              <span className="block text-xs text-gray-500">{description}</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-t">{children}</div>
      </div>
    </div>
  );
}
