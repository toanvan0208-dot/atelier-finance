import { Chip } from "@/components/ui";

export type JourneyHeaderData = {
  stepNumber: number;
  totalSteps: number;
  plainDescription: string;
  status: string;
  nextSuggestion: string;
};

type JourneyHeaderProps = {
  activeLabel: string;
  data: JourneyHeaderData;
};

export function JourneyHeader({ activeLabel, data }: JourneyHeaderProps) {
  const progress = Math.round((data.stepNumber / data.totalSteps) * 100);

  return (
    <section className="mb-6 rounded-[4px] border-[1.5px] border-border bg-surface/95 px-4 py-4 shadow-hard md:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
            Bạn đang ở bước {data.stepNumber}/{data.totalSteps}
          </p>
          <h1 className="mt-1 font-brand text-xl font-bold text-ink md:text-2xl">
            {activeLabel}
          </h1>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">
            {data.plainDescription}
          </p>
        </div>
        <Chip variant="accent">{data.status}</Chip>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-surface-soft">
          <div
            className="h-2 rounded-full bg-accent"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-3 rounded-[4px] border border-border-soft bg-accent-soft/70 px-3 py-2 text-xs leading-5 text-muted">
          {data.nextSuggestion}
        </p>
      </div>
    </section>
  );
}
