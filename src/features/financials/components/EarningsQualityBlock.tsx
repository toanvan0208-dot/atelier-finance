import { Chip } from "@/components/ui";
import type { EarningsQualityData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type EarningsQualityBlockProps = {
  data: EarningsQualityData;
};

export function EarningsQualityBlock({ data }: EarningsQualityBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant={data.tone}>{data.classificationLabel}: {data.classification}</Chip>
        <SimpleMetricGrid columns="three" items={data.fields} />
      </div>
    </FinancialsSectionCard>
  );
}
