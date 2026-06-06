import { Card, CardBody, CardHeader, MetricCard } from "@/components/ui";
import type { ValuationQuickSummaryData } from "../types";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type ValuationQuickSummaryProps = {
  data: ValuationQuickSummaryData;
};

export function ValuationQuickSummary({ data }: ValuationQuickSummaryProps) {
  return (
    <Card>
      <CardHeader
        description={data.description}
        icon={data.icon}
        title={data.title}
      />
      <CardBody>
        <div className="grid gap-3 xl:grid-cols-3">
          {data.metrics.map((metric) => (
            <MetricCard
              key={metric.title}
              description={metric.description}
              icon={metric.icon}
              status={metric.status}
              title={metric.title}
              value={metric.value}
            />
          ))}
        </div>
        <div className="mt-4">
          <SimpleMetricGrid columns="two" items={data.items} />
        </div>
      </CardBody>
    </Card>
  );
}
