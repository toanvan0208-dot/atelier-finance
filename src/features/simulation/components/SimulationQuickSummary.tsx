import { MetricCard } from "@/components/ui";
import type { QuickSummaryData } from "../types";
import { ToneChip } from "./ToneChip";

type SimulationQuickSummaryProps = {
  data: QuickSummaryData;
};

export function SimulationQuickSummary({ data }: SimulationQuickSummaryProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
      <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-xs font-bold text-accent">
            {data.icon}
          </span>
          <h3 className="text-sm font-bold text-ink">{data.title}</h3>
        </div>
        <p className="text-xs leading-5 text-muted">{data.description}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.answers.map((answer) => (
            <div
              key={answer.label}
              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
            >
              <p className="text-[11px] font-semibold text-subtle">{answer.label}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{answer.value}</p>
                {answer.tone ? <ToneChip tone={answer.tone} /> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {data.metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          description={metric.description}
          icon={metric.icon}
          status={metric.status}
          title={metric.title}
          value={metric.value}
        />
      ))}
    </div>
  );
}
