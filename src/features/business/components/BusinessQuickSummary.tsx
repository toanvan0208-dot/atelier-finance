import { Card, CardBody, SectionHeader } from "@/components/ui";
import type { BusinessQuickSummaryData } from "../types";

type BusinessQuickSummaryProps = {
  data: BusinessQuickSummaryData;
};

export function BusinessQuickSummary({ data }: BusinessQuickSummaryProps) {
  return (
    <section>
      <SectionHeader
        description={data.description}
        icon={data.icon}
        title={data.title}
      />
      <div className="space-y-4">
        <Card>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.items.map((item) => (
                <div
                  key={item.question}
                  className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
                >
                  <p className="text-xs font-bold text-ink">{item.question}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
