import { Chip } from "@/components/ui";
import type { ProfitToCashData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleLineChart } from "./SimpleLineChart";
import { SimpleMetricGrid } from "./SimpleMetricGrid";
import { TutorNote } from "./TutorNote";

type ProfitToCashBlockProps = {
  data: ProfitToCashData;
};

export function ProfitToCashBlock({ data }: ProfitToCashBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <Chip variant={data.tone}>{data.classificationLabel}: {data.classification}</Chip>
        <SimpleMetricGrid items={data.fields} />
        <SimpleLineChart series={data.lineSeries} title={data.title} />
        {data.tutor ? <TutorNote data={data.tutor} /> : null}
      </div>
    </FinancialsSectionCard>
  );
}
