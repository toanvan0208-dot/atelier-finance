import { Card, CardBody, CardHeader } from "@/components/ui";
import type { IndustryOverviewData } from "../types";

type IndustryOverviewProps = {
  data: IndustryOverviewData;
};

export function IndustryOverview({ data }: IndustryOverviewProps) {
  return (
    <Card>
      <CardHeader icon={data.sectionIcon} title={data.sectionTitle} />
      <CardBody>
        <div className="grid gap-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
