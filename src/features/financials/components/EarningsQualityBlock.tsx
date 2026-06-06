import { Chip } from "@/components/ui";
import type { EarningsQualityData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";
import { TutorNote } from "./TutorNote";

type EarningsQualityBlockProps = {
  data: EarningsQualityData;
};

export function EarningsQualityBlock({ data }: EarningsQualityBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant={data.tone}>{data.classificationLabel}: {data.classification}</Chip>
        <SimpleMetricGrid columns="three" items={data.fields} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
      </div>
    </FinancialsSectionCard>
  );
}
