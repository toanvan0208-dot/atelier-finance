import type { ReactNode } from "react";
import { Chip } from "@/components/ui";
import type { BusinessProgressData, BusinessProgressStep, StepStatus } from "../types";

type BusinessStepAccordionItem = {
  step: BusinessProgressStep;
  content: ReactNode;
};

type BusinessStepAccordionProps = {
  data: BusinessProgressData;
  items: BusinessStepAccordionItem[];
};

const statusTone: Record<StepStatus, "neutral" | "accent" | "success" | "warning"> = {
  "Chưa làm": "neutral",
  "Cần kiểm tra thêm": "warning",
  "Đang làm": "accent",
  "Đã hoàn thành": "success",
};

export function BusinessStepAccordion({ data, items }: BusinessStepAccordionProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">{data.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
          </div>
          <Chip variant="accent">{items.length} bước</Chip>
        </div>
      </div>

      {items.map((item, index) => (
        <details
          key={item.step.order}
          className="group rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft"
          open={index === 0}
        >
          <summary className="cursor-pointer list-none border-b border-border-soft bg-surface-soft/80 px-4 py-4 transition hover:bg-surface-hover">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft font-mono text-xs font-bold text-ink">
                  {item.step.order}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{item.step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Bấm để mở phần phân tích chi tiết của bước này.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip size="sm" variant={statusTone[item.step.status]}>
                  {item.step.status}
                </Chip>
                <span className="text-xs font-bold text-subtle group-open:hidden">
                  Mở
                </span>
                <span className="hidden text-xs font-bold text-subtle group-open:inline">
                  Thu gọn
                </span>
              </div>
            </div>
          </summary>
          <div className="px-4 py-4">{item.content}</div>
        </details>
      ))}
    </section>
  );
}
