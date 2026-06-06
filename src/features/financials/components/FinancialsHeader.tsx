import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { FinancialsHeaderData } from "../types";

type FinancialsHeaderProps = {
  data: FinancialsHeaderData;
};

export function FinancialsHeader({ data }: FinancialsHeaderProps) {
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
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {data.actions.map((action) => (
              <Button key={action.label} variant={action.variant}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
