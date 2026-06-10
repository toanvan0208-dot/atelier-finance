import { Chip } from "@/components/ui";
import type { FinancialSnapshotData } from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleBarChart } from "./SimpleBarChart";
import { SimpleLineChart } from "./SimpleLineChart";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type FinancialSnapshotBlockProps = {
  data: FinancialSnapshotData;
};

export function FinancialSnapshotBlock({ data }: FinancialSnapshotBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant="warning">{data.statusLabel}: {data.status}</Chip>
        <div className="grid gap-3 lg:grid-cols-2">
          <SimpleLineChart series={data.lineSeries} title={data.lineChartTitle} />
          <SimpleBarChart bars={data.barSeries} title={data.barChartTitle} />
        </div>
        <SimpleMetricGrid columns="two" items={data.metrics} />
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </FinancialsSectionCard>
  );
}
