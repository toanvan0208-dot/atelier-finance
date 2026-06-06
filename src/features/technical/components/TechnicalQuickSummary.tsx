import { Card, CardBody, CardHeader, MetricCard } from "@/components/ui";
import type { TechnicalQuickSummaryData } from "../types";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type TechnicalQuickSummaryProps = {
  data: TechnicalQuickSummaryData;
};

export function TechnicalQuickSummary({ data }: TechnicalQuickSummaryProps) {
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
          <SimpleMetricGrid columns="two" items={data.answers} />
        </div>
      </CardBody>
    </Card>
  );
}
