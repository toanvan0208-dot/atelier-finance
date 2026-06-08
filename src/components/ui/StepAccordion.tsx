import type { ReactNode } from "react";
import { Chip } from "./Chip";

export type StepAccordionItem = {
  key: string;
  order: number;
  title: string;
  status: string;
  description?: string;
  meta?: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

type StepAccordionProps = {
  title: string;
  description?: string;
  items: StepAccordionItem[];
};

function getStatusVariant(status: string): "neutral" | "accent" | "success" | "warning" | "danger" {
  if (status.includes("Đã") || status.includes("Hoàn thành") || status.includes("Có thể")) {
    return "success";
  }
  if (status.includes("Đang")) {
    return "accent";
  }
  if (status.includes("Cần") || status.includes("Chưa phù hợp")) {
    return "warning";
  }
  if (status.includes("Tạm") || status.includes("Rủi ro")) {
    return "danger";
  }

  return "neutral";
}

export function StepAccordion({ description, items, title }: StepAccordionProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
            ) : null}
          </div>
          <Chip variant="accent">{items.length} bước</Chip>
        </div>
      </div>

      {items.map((item, index) => (
        <details
          key={item.key}
          className="group rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft"
          open={item.defaultOpen ?? index === 0}
        >
          <summary className="cursor-pointer list-none border-b border-border-soft bg-surface-soft/80 px-4 py-4 transition hover:bg-surface-hover">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft font-mono text-xs font-bold text-ink">
                  {item.order}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Bấm để mở phần phân tích chi tiết của bước này.
                    </p>
                  )}
                  {item.meta ? (
                    <p className="mt-1 text-[11px] font-semibold text-subtle">{item.meta}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip size="sm" variant={getStatusVariant(item.status)}>
                  {item.status}
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
