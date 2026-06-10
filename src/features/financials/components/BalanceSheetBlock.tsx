import { Chip } from "@/components/ui";
import type { BalanceSheetData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";
import { SimpleMetricGrid } from "./SimpleMetricGrid";

type BalanceSheetBlockProps = {
  data: BalanceSheetData;
};

export function BalanceSheetBlock({ data }: BalanceSheetBlockProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft/70 px-4 py-3 text-center shadow-soft">
          <Chip variant="accent">{data.equation}</Chip>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {data.groups.map((group) => (
            <div key={group.title} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="mb-3 text-sm font-bold text-ink">{group.title}</p>
              <SimpleMetricGrid columns="one" items={group.items} />
            </div>
          ))}
        </div>
      </div>
    </FinancialsSectionCard>
  );
}
