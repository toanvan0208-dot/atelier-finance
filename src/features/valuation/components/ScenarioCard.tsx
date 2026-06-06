import { Chip } from "@/components/ui";
import type { ScenarioData } from "../types";

type ScenarioCardProps = {
  data: ScenarioData;
};

export function ScenarioCard({ data }: ScenarioCardProps) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-3 shadow-hard-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">{data.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{data.assumption}</p>
        </div>
        <Chip variant={data.tone}>{data.price}</Chip>
      </div>
    </div>
  );
}
