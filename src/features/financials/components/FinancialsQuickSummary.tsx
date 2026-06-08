import { Card, CardBody, Chip, SectionHeader } from "@/components/ui";
import type { FinancialsQuickSummaryData } from "../types";

type FinancialsQuickSummaryProps = {
  data: FinancialsQuickSummaryData;
};

export function FinancialsQuickSummary({ data }: FinancialsQuickSummaryProps) {
  return (
    <section>
      <SectionHeader description={data.description} icon={data.icon} title={data.title} />
      <div className="space-y-4">
        <Card>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.items.map((item) => (
                <div
                  key={item.question}
                  className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-ink">{item.question}</p>
                    <Chip size="sm" variant={item.tone}>{item.status}</Chip>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
