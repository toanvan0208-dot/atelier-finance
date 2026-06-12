import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationRefactoredData } from "../types";

type ValuationAssumptionPanelProps = {
  data: ValuationRefactoredData["assumptions"];
};

function sensitivityVariant(sensitivity: string) {
  if (sensitivity === "Rất cao") return "danger" as const;
  if (sensitivity === "Cao") return "warning" as const;
  return "neutral" as const;
}

export function ValuationAssumptionPanel({ data }: ValuationAssumptionPanelProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-bold leading-7 text-ink">Vùng giá này đang dựa trên giả định nào?</h2>
        <p className="mt-1 max-w-[76ch] text-sm leading-6 text-muted">{data.intro}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.items.map((item) => (
          <Card key={item.title} className="border-border-soft">
            <CardBody className="space-y-2 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                <Chip size="sm" variant={sensitivityVariant(item.sensitivity)}>
                  {item.sensitivity}
                </Chip>
              </div>
              <p className="text-sm leading-6 text-muted">{item.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>
      <p className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm font-bold leading-6 text-ink">
        {data.sensitiveNote}
      </p>
    </section>
  );
}
