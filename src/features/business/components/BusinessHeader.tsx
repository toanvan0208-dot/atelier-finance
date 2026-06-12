import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { BusinessHeaderData } from "../types";

type BusinessHeaderProps = {
  data: BusinessHeaderData;
  canGoToFinancials?: boolean;
  onNavigate?: (moduleKey: string) => void;
};

export function BusinessHeader({
  canGoToFinancials = false,
  data,
  onNavigate,
}: BusinessHeaderProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="accent">{data.moduleName}</Chip>
              <Chip variant="neutral">{data.status}</Chip>
              <Chip variant="neutral">{data.industry}</Chip>
            </div>
            <h1 className="mt-3 font-brand text-2xl font-semibold text-ink">
              {data.ticker} · {data.companyName}
            </h1>
            <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">
              {data.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip variant="neutral">{data.businessType}</Chip>
              <Chip variant="neutral">Mức dễ hiểu: {data.beginnerFit}</Chip>
              <Chip variant="neutral">{data.candidateStatus}</Chip>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {data.actions.map((action) => {
              const isFinancialsAction = action.label.includes("BCTC");
              const disabled = isFinancialsAction && !canGoToFinancials;

              return (
                <Button
                  key={action.label}
                  disabled={disabled}
                  onClick={() => onNavigate?.(isFinancialsAction ? "financials" : "screening")}
                  variant={disabled ? "secondary" : action.variant}
                >
                  {disabled
                    ? "Hoàn thành câu hỏi bắt buộc để sang BCTC"
                    : action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
