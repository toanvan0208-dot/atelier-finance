import { Chip } from "@/components/ui";
import type { JourneyData, StepStatus } from "../types";

type SimulationProgressSidebarProps = {
  data: JourneyData;
};

const statusVariant: Record<StepStatus, "neutral" | "accent" | "success" | "warning"> = {
  "Chưa làm": "neutral",
  "Cần xem lại": "warning",
  "Đang làm": "accent",
  "Đã hoàn thành": "success",
};

export function SimulationProgressSidebar({ data }: SimulationProgressSidebarProps) {
  return (
    <aside className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft xl:sticky xl:top-5 xl:self-start">
      <h3 className="text-sm font-bold text-ink">{data.title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
      <div className="mt-4 space-y-2">
        {data.steps.map((step) => (
          <div
            key={step.order}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-ink">
                {String(step.order).padStart(2, "0")}
              </span>
              <Chip size="sm" variant={statusVariant[step.status]}>
                {step.status}
              </Chip>
            </div>
            <p className="text-xs font-bold text-ink">{step.title}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted">{step.question}</p>
            {step.sourceModule ? (
              <p className="mt-2 text-[11px] font-semibold text-subtle">
                Nguồn: {step.sourceModule}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
