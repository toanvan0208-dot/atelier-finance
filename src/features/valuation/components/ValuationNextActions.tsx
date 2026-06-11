import { Button } from "@/components/ui";
import type { ValuationNextActionsData } from "../types";

type ValuationNextActionsProps = {
  data: ValuationNextActionsData;
  canContinueToRisk?: boolean;
};

export function ValuationNextActions({ canContinueToRisk = false, data }: ValuationNextActionsProps) {
  const primaryAction = canContinueToRisk
    ? data.actions.find((action) => action.label.includes("Quản trị rủi ro")) ?? data.actions[0]
    : data.actions.find((action) => action.label.includes("Ghi chú")) ?? data.actions[0];
  const secondaryActions = data.actions.filter((action) => action.label !== primaryAction.label);

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">{data.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          disabled={primaryAction.disabled || (!canContinueToRisk && primaryAction.label.includes("Quản trị rủi ro"))}
          size="sm"
          variant="primary"
        >
          {primaryAction.label}
        </Button>
        <div className="flex flex-wrap gap-2">
          {secondaryActions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled || (!canContinueToRisk && action.label.includes("Quản trị rủi ro"))}
              size="sm"
              variant="secondary"
            >
              {action.label.includes("Quản trị rủi ro") && !canContinueToRisk ? "Hoàn thành kiểm tra định giá" : action.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
