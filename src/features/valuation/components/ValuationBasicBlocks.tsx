import { Chip, DataTable } from "@/components/ui";
import type {
  BusinessTypeData,
  ChecklistData,
  DetailLabels,
  MarketPricingData,
  MethodMappingRow,
  MethodSelectionData,
  NormalizedInputData,
} from "../types";
import { ChecklistItem } from "./ChecklistItem";
import { DetailToggleCard } from "./DetailToggleCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";
import { ValuationSectionCard } from "./ValuationSectionCard";

type SharedBlockProps<T> = {
  data: T;
  detailLabels: DetailLabels;
};

const methodColumns = [
  {
    key: "businessType",
    header: "Loại doanh nghiệp",
    cell: (row: MethodMappingRow) => row.businessType,
  },
  {
    key: "preferredMethod",
    header: "Phương pháp",
    cell: (row: MethodMappingRow) => row.preferredMethod,
  },
  {
    key: "note",
    header: "Ghi chú",
    cell: (row: MethodMappingRow) => row.note,
  },
];

export function ValuationPrecheckBlock({
  data,
  detailLabels,
}: SharedBlockProps<ChecklistData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-3">
        {data.items.map((item) => (
          <ChecklistItem
            key={item.label}
            checked={item.checked}
            label={item.label}
          />
        ))}
        <SimpleMetricGrid columns="one" items={data.output} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function NormalizedInputBlock({
  data,
  detailLabels,
}: SharedBlockProps<NormalizedInputData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.checks} />
        <SimpleMetricGrid columns="three" items={data.output} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function BusinessTypeValuationBlock({
  data,
  detailLabels,
}: SharedBlockProps<BusinessTypeData>) {
  return (
    <ValuationSectionCard
      action={<Chip variant="accent">{data.selectedType}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.types} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function MarketPricingBlock({
  data,
  detailLabels,
}: SharedBlockProps<MarketPricingData>) {
  return (
    <ValuationSectionCard
      action={<Chip variant={data.output.tone ?? "neutral"}>{data.output.value}</Chip>}
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.metrics} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}

export function MethodSelectionBlock({
  data,
  detailLabels,
}: SharedBlockProps<MethodSelectionData>) {
  return (
    <ValuationSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <DataTable
          caption={data.title}
          columns={methodColumns}
          getRowKey={(row) => row.businessType}
          rows={data.rows}
        />
        <SimpleMetricGrid columns="three" items={data.output} />
        <DetailToggleCard details={data.details} labels={detailLabels} />
      </div>
    </ValuationSectionCard>
  );
}
