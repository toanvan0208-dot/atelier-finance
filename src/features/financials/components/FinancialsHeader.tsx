import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { FinancialsHeaderData } from "../types";

type FinancialsHeaderProps = {
  data: FinancialsHeaderData;
  canContinueToValuation?: boolean;
  valuationDisabledReason?: string;
};

export function FinancialsHeader({
  canContinueToValuation = false,
  data,
  valuationDisabledReason,
}: FinancialsHeaderProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="accent">{data.moduleName}</Chip>
              <Chip variant="warning">{data.dataStatus}</Chip>
              <Chip variant="neutral">{data.industry}</Chip>
              <Chip variant="neutral">{data.reportPeriod}</Chip>
            </div>
            <h1 className="mt-3 font-brand text-2xl font-semibold text-ink">
              {data.ticker} · {data.companyName}
            </h1>
            <p className="mt-2 max-w-[68ch] text-sm leading-6 text-muted">
              {data.previousModuleLink}
            </p>
          </div>
          <div className="lg:max-w-[280px]">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <AnalysisNotePopover
                contextTitle={`${data.ticker} - ${data.moduleName}`}
                moduleId="financials"
                moduleName="BCTC"
                noteType="follow_up"
                stockSymbol={data.ticker}
              />
              {data.actions.map((action) => {
                const isValuationAction = action.label.includes("Định Giá") || action.label.includes("Định giá");
                const disabled = isValuationAction && !canContinueToValuation;

                return (
                  <Button key={action.label} disabled={disabled} variant={disabled ? "secondary" : action.variant}>
                    {disabled ? "Hoàn thành kiểm tra BCTC" : action.label}
                  </Button>
                );
              })}
            </div>
            {!canContinueToValuation && valuationDisabledReason ? (
              <p className="mt-2 text-xs leading-5 text-muted lg:text-right">{valuationDisabledReason}</p>
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
