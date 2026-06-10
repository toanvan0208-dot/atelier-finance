import { Card, CardBody, CardHeader } from "@/components/ui";
import type { BusinessConclusionData } from "../types";

type BusinessConclusionProps = {
  data: BusinessConclusionData;
};

export function BusinessConclusion({ data }: BusinessConclusionProps) {
  return (
    <Card className="bg-accent-soft">
      <CardHeader description={data.description} icon="K" title={data.title} />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="rounded-[4px] border border-border-soft bg-surface px-3 py-3"
            >
              <p className="text-xs font-bold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.content}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
