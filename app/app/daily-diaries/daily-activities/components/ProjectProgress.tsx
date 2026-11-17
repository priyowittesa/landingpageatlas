export function ProjectProgress({ progress }: { progress: number }) {
  return (
    <div className="pt-1.5 pb-[5px]">
      <div className="mb-1 flex items-center justify-between text-xs leading-4">
        <span className="font-semibold text-neutral-500">Overall Progress</span>
        <span className="text-[11px] font-bold text-primary-500">
          {progress}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Overall Progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-1.5 overflow-hidden rounded-full bg-neutral-200/70"
      >
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
