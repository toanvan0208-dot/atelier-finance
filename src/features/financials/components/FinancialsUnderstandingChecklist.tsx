import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ChecklistStatus, FinancialChecklistData } from "../types";

type FinancialsUnderstandingChecklistProps = {
  data: FinancialChecklistData;
};

const statusVariant: Record<ChecklistStatus, "success" | "warning" | "neutral"> = {
  "Đã hiểu": "success",
  "Cần xem lại": "warning",
  "Chưa rõ": "neutral",
};

export function FinancialsUnderstandingChecklist({ data }: FinancialsUnderstandingChecklistProps) {
  return (
    <Card>
      <CardHeader description={data.description} icon={data.icon} title={data.title} />
      <CardBody>
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div
              key={item.text}
              className="flex items-start justify-between gap-3 rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2"
            >
              <p className="text-sm leading-6 text-muted">
                <span className="font-mono text-xs font-bold text-ink">{index + 1}. </span>
                {item.text}
              </p>
              <Chip size="sm" variant={statusVariant[item.status]}>{item.status}</Chip>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
