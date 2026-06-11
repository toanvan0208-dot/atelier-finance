import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Chip } from "@/components/ui";
import type { ValuationHeaderData } from "../types";

type ValuationHeaderProps = {
  data: ValuationHeaderData;
  canContinueToRisk?: boolean;
  riskDisabledReason?: string;
};

export function ValuationHeader({
  canContinueToRisk = false,
  data,
  riskDisabledReason,
}: ValuationHeaderProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Chip variant="accent">{data.moduleName}</Chip>
          <h1 className="mt-3 font-brand text-2xl font-bold text-ink">
            {data.ticker} - {data.companyName}
          </h1>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">
            {data.previousContext}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[360px] xl:grid-cols-1">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Ngành</p>
            <p className="text-sm font-bold text-ink">{data.industry}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Giá thị trường mẫu</p>
            <p className="text-sm font-bold text-ink">{data.marketPrice}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            <p className="text-[11px] font-bold uppercase text-subtle">Trạng thái</p>
            <p className="text-sm font-bold text-ink">{data.status}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AnalysisNotePopover
          contextTitle={`${data.ticker} - ${data.moduleName}`}
          moduleId="valuation"
          moduleName="Định giá"
          noteType="assumption"
          stockSymbol={data.ticker}
        />
        {data.actions.map((action) => {
          const isRiskAction = action.label.includes("Quản trị rủi ro");
          const disabled = isRiskAction && !canContinueToRisk;

          return (
            <Button key={action.label} disabled={disabled} size="sm" variant={disabled ? "secondary" : action.variant}>
              {disabled ? "Hoàn thành kiểm tra định giá" : action.label}
            </Button>
          );
        })}
      </div>
      {!canContinueToRisk && riskDisabledReason ? (
        <p className="mt-2 text-xs leading-5 text-muted">{riskDisabledReason}</p>
      ) : null}
    </section>
  );
}
