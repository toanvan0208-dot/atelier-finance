import { useState } from "react";
import { Button, Chip } from "@/components/ui";
import type { FinancialReadingDeskData } from "../types";
import { WarningInsightCard } from "./WarningInsightCard";

type FinancialsOverviewPanelProps = {
  data: FinancialReadingDeskData;
  onFocusStep: (stepId: string) => void;
};

export function FinancialsOverviewPanel({ data, onFocusStep }: FinancialsOverviewPanelProps) {
  const [openWarningId, setOpenWarningId] = useState(data.warnings[0]?.id ?? "");

  return (
    <section className="rounded-[8px] border-[1.5px] border-border bg-canvas shadow-hard">
      <div className="border-b border-border-soft p-5">
        <p className="text-xs font-bold uppercase text-muted">Bàn đọc báo cáo tài chính</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Tổng quan sức khỏe tài chính</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {data.ticker} · {data.period} · chỉ hỗ trợ đọc và kiểm tra dữ liệu.
            </p>
          </div>
          <Chip variant="warning">{data.preliminaryConclusion.status}</Chip>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.05fr_1.25fr]">
        <article className="rounded-[6px] border border-border-soft bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-ink">Kết luận sơ bộ có điều kiện</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{data.preliminaryConclusion.summary}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-muted">Điểm phụ</p>
              <p className="text-2xl font-extrabold text-ink">{data.preliminaryConclusion.score}/100</p>
            </div>
          </div>
          <p className="mt-3 rounded-[4px] border border-border-soft bg-neutral px-3 py-2 text-xs leading-5 text-muted">
            {data.preliminaryConclusion.scoreNote}
          </p>
        </article>

        <article className="rounded-[6px] border border-border-soft bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-ink">Top 3 cảnh báo cần đọc</h3>
            <Chip variant="danger">Ưu tiên</Chip>
          </div>
          <div className="space-y-3">
            {data.warnings.map((warning) => (
              <WarningInsightCard
                key={warning.id}
                isOpen={openWarningId === warning.id}
                warning={warning}
                onOpenCause={() => {
                  setOpenWarningId((current) => (current === warning.id ? "" : warning.id));
                  onFocusStep(warning.targetStepId);
                }}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[6px] border border-border-soft bg-surface p-4">
          <h3 className="text-base font-extrabold text-ink">Bước nên đọc tiếp</h3>
          <p className="mt-2 text-sm font-bold text-ink">{data.nextReadingStep.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{data.nextReadingStep.reason}</p>
          <Button
            className="mt-4"
            size="sm"
            variant="secondary"
            onClick={() => onFocusStep(data.nextReadingStep.stepId)}
          >
            Mở bước này
          </Button>
        </article>

        <article className="rounded-[6px] border border-border-soft bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-ink">Sẵn sàng định giá?</h3>
            <Chip variant="warning">{data.valuationReadiness.status}</Chip>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{data.valuationReadiness.reason}</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
            {data.valuationReadiness.missing.map((item) => (
              <li key={item} className="rounded-[4px] border border-border-soft bg-neutral px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
