import { Chip } from "@/components/ui";
import type { ProgressStatus, ValuationProgressData } from "../types";

type ValuationProgressSidebarProps = {
  data: ValuationProgressData;
};

const statusTone: Record<ProgressStatus, "neutral" | "accent" | "success" | "warning"> = {
  "Chưa làm": "neutral",
  "Đang làm": "accent",
  "Đã hoàn thành": "success",
  "Cần kiểm tra thêm": "warning",
};

export function ValuationProgressSidebar({ data }: ValuationProgressSidebarProps) {
  return (
    <aside className="xl:sticky xl:top-20 xl:self-start">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
        <h2 className="font-brand text-sm font-bold text-ink">{data.title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
          {data.steps.map((step) => (
            <div
              key={step.order}
              className="min-w-[220px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 xl:min-w-0"
            >
              <div className="flex items-start gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-[10px] font-bold text-ink">
                  {step.order}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-5 text-ink">{step.title}</p>
                  <Chip size="sm" variant={statusTone[step.status]}>{step.status}</Chip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
