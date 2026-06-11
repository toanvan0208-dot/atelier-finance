import { Card, CardBody, CardHeader } from "@/components/ui";
import type { PersonalPVTObservationData } from "../types";

type PersonalPVTObservationProps = {
  data: PersonalPVTObservationData;
};

export function PersonalPVTObservation({ data }: PersonalPVTObservationProps) {
  return (
    <Card className="border-border-soft">
      <CardHeader description={data.description} icon="G" title={data.title} />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {data.prompts.map((prompt) => (
            <label key={prompt} className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <span className="text-xs font-bold text-ink">{prompt}</span>
              <textarea className="min-h-16 rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border" />
            </label>
          ))}
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Mẫu ghi chú</p>
          <p className="mt-1 text-sm leading-6 text-muted">{data.sample}</p>
        </div>
      </CardBody>
    </Card>
  );
}
