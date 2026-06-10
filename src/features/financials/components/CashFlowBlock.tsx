import type { CashFlowData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type CashFlowBlockProps = {
  data: CashFlowData;
};

export function CashFlowBlock({ data }: CashFlowBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <SimpleMetricGrid columns="three" items={data.cards} />
      </div>
    </FinancialsSectionCard>
  );
}
