import { Button } from "@/components/ui";
import type { ValuationNextActionsData } from "../types";

type ValuationNextActionsProps = {
  data: ValuationNextActionsData;
};

export function ValuationNextActions({ data }: ValuationNextActionsProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">{data.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.actions.map((action) => (
          <Button
            key={action.label}
            disabled={action.disabled}
            size="sm"
            variant={action.variant}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
