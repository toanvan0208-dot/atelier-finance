import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { FinancialsProgressData, StepStatus } from "../types";

type FinancialsProgressSidebarProps = {
  data: FinancialsProgressData;
};

const statusTone: Record<StepStatus, "neutral" | "accent" | "success" | "warning"> = {
  "Chưa làm": "neutral",
  "Đang làm": "accent",
  "Đã hoàn thành": "success",
  "Cần kiểm tra thêm": "warning",
};

export function FinancialsProgressSidebar({ data }: FinancialsProgressSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-20">
      <Card>
        <CardHeader description={data.description} title={data.title} />
        <CardBody>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
            {data.steps.map((step) => (
              <div
                key={step.order}
                className="min-w-[180px] rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2 lg:min-w-0"
              >
                <div className="flex items-start gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-[10px] font-bold text-ink">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-5 text-ink">{step.title}</p>
                    <div className="mt-1">
                      <Chip size="sm" variant={statusTone[step.status]}>
                        {step.status}
                      </Chip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </aside>
  );
}
