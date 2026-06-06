import { SectionHeader } from "@/components/ui";
import type { PVTReadingPathData } from "../types";

type PVTReadingPathProps = {
  data: PVTReadingPathData;
};

export function PVTReadingPath({ data }: PVTReadingPathProps) {
  return (
    <section>
      <SectionHeader
        description={data.description}
        icon={data.icon}
        title={data.title}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.steps.map((step) => (
          <div
            key={step.label}
            className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 shadow-soft"
          >
            <p className="font-brand text-sm font-bold text-ink">{step.label}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{step.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
