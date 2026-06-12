import { useMemo, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { FinancialReadingDeskData, FinancialReadingStep } from "../types";
import { CashQualitySection } from "./CashQualitySection";
import { MetricExplanationTooltip } from "./MetricExplanationTooltip";
import { RiskCheckSection } from "./RiskCheckSection";
import { StatementMapSection } from "./StatementMapSection";

type FinancialReadingJourneyProps = {
  data: FinancialReadingDeskData;
  activeStepId: string;
  onActiveStepChange: (stepId: string) => void;
};

const statusVariant: Record<FinancialReadingStep["status"], "success" | "warning" | "neutral"> = {
  "Đã kiểm tra": "success",
  "Đang đọc": "warning",
  "Cần xem lại": "warning",
  "Chưa đọc": "neutral",
};

export function FinancialReadingJourney({ activeStepId, data, onActiveStepChange }: FinancialReadingJourneyProps) {
  const [showDetails, setShowDetails] = useState(true);
  const activeStep = data.readingSteps.find((step) => step.id === activeStepId) ?? data.readingSteps[0];
  const metricById = useMemo(() => new Map(data.metrics.map((metric) => [metric.id, metric])), [data.metrics]);
  const activeMetrics = activeStep.metricIds.map((metricId) => metricById.get(metricId)).filter(Boolean);

  return (
    <section id="financial-reading-journey" className="scroll-mt-6 rounded-[8px] border-[1.5px] border-border bg-canvas shadow-hard">
      <div className="border-b border-border-soft p-5">
        <h2 className="text-xl font-extrabold text-ink">Lộ trình đọc báo cáo tài chính</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Mở từng bước để chỉ thấy các chỉ số cần đọc ở thời điểm đó. Các phần sâu hơn nằm trong chi tiết của bước.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
        <nav className="border-b border-border-soft p-4 lg:border-b-0 lg:border-r">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {data.readingSteps.map((step) => {
              const isActive = step.id === activeStep.id;
              return (
                <button
                  key={step.id}
                  className={cn(
                    "min-w-[230px] rounded-[6px] border p-3 text-left transition lg:min-w-0 lg:w-full",
                    isActive
                      ? "border-border bg-accent-soft shadow-hard-sm"
                      : "border-border-soft bg-surface hover:border-border hover:bg-surface-hover"
                  )}
                  type="button"
                  onClick={() => {
                    onActiveStepChange(step.id);
                    setShowDetails(true);
                  }}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-muted">Bước {step.order}</span>
                    <Chip size="sm" variant={statusVariant[step.status]}>
                      {step.status}
                    </Chip>
                  </span>
                  <span className="mt-2 block text-sm font-extrabold text-ink">{step.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-5 p-5">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted">Câu hỏi chính</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink">{activeStep.mainQuestion}</h3>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setShowDetails((value) => !value)}>
                {showDetails ? "Ẩn chi tiết" : activeStep.detailTitle}
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              <span className="font-bold text-ink">Vì sao cần xem? </span>
              {activeStep.whyItMatters}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              <span className="font-bold text-ink">Đọc như thế nào? </span>
              {activeStep.readingGuide}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-extrabold text-ink">Chỉ số của bước này</h4>
            <div className="grid gap-3 xl:grid-cols-2">
              {activeMetrics.map((metric) => (metric ? <MetricExplanationTooltip key={metric.id} metric={metric} /> : null))}
            </div>
          </div>

          {showDetails ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[6px] border border-accent-green/40 bg-accent-green/5 p-4">
                  <h4 className="text-sm font-extrabold text-ink">Khi nào là dấu hiệu tốt?</h4>
                  <ul className="mt-3 space-y-2 text-sm leading-5 text-muted">
                    {activeStep.goodSigns.map((sign) => (
                      <li key={sign}>{sign}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[6px] border border-danger/40 bg-danger/5 p-4">
                  <h4 className="text-sm font-extrabold text-ink">Khi nào là dấu hiệu xấu?</h4>
                  <ul className="mt-3 space-y-2 text-sm leading-5 text-muted">
                    {activeStep.badSigns.map((sign) => (
                      <li key={sign}>{sign}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {activeStep.id === "three-statements" ? <StatementMapSection items={data.statementMap} metrics={data.metrics} /> : null}
              {activeStep.id === "cash-quality" ? <CashQualitySection data={data.cashQuality} /> : null}
              {activeStep.id === "financial-risk" ? <RiskCheckSection data={data.riskCheck} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
