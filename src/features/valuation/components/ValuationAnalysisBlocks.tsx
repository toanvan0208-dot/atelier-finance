import { Chip, DataTable, Tabs } from "@/components/ui";
import type {
  CatalystRiskData,
  DetailLabels,
  HistoricalComparisonData,
  MarketExpectationData,
  ScenarioValuationData,
  ValuationMethodsData,
} from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { ScenarioCard } from "./ScenarioCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";
import { ValuationMethodCard } from "./ValuationMethodCard";
import { ValuationSectionCard } from "./ValuationSectionCard";

type SharedBlockProps<T> = {
  data: T;
  detailLabels: DetailLabels;
};

type HistoricalRow = HistoricalComparisonData["rows"][number];

const historicalColumns = [
  {
    key: "metric",
    header: "Chỉ số",
    cell: (row: HistoricalRow) => row.metric,
  },
  {
    key: "current",
    header: "Hiện tại",
    cell: (row: HistoricalRow) => row.current,
  },
  {
    key: "benchmark",
    header: "Mốc so sánh",
    cell: (row: HistoricalRow) => row.benchmark,
  },
  {
    key: "reading",
    header: "Cách đọc",
    cell: (row: HistoricalRow) => row.reading,
  },
];

export function ValuationMethodsBlock({
  data,
  detailLabels,
}: SharedBlockProps<ValuationMethodsData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <Tabs
        ariaLabel="Các phương pháp định giá"
        items={data.methods.map((method) => ({
          value: method.id,
          label: method.name,
          content: <ValuationMethodCard method={method} />,
        }))}
      />
      <div className="mt-4">
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function HistoricalComparisonBlock({
  data,
  detailLabels,
}: SharedBlockProps<HistoricalComparisonData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <DataTable
          caption={data.title}
          columns={historicalColumns}
          getRowKey={(row) => row.metric}
          rows={data.rows}
        />
        <SimpleMetricGrid columns="one" items={data.output} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function MarketExpectationBlock({
  data,
  detailLabels,
}: SharedBlockProps<MarketExpectationData>) {
  return (
    <ValuationSectionCard
      action={<Chip variant={data.output.tone ?? "neutral"}>{data.output.value}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.expectations} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function ScenarioValuationBlock({
  data,
  detailLabels,
}: SharedBlockProps<ScenarioValuationData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-3">
          {data.scenarios.map((scenario) => (
            <ScenarioCard key={scenario.title} data={scenario} />
          ))}
        </div>
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function CatalystRiskValuationBlock({
  data,
  detailLabels,
}: SharedBlockProps<CatalystRiskData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-3">
          <Chip variant="success">{data.catalystTitle}</Chip>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {data.catalysts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-3">
          <Chip variant="danger">{data.riskTitle}</Chip>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {data.risks.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-4">
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}
