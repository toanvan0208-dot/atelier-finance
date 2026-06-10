import { Card, CardBody, Chip, SectionHeader, Tabs } from "@/components/ui";
import type { TabItem } from "@/components/ui";
import type { ScreeningDeepDiveData, ScreeningDeepDiveStep } from "../types";

type ScreeningDeepDiveProps = {
  data: ScreeningDeepDiveData;
};

function StepContent({ step }: { step: ScreeningDeepDiveStep }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
      <div className="space-y-4">
        <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Câu hỏi lọc</p>
          <p className="mt-1 text-base font-bold leading-7 text-ink">{step.question}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-ink">
            Dữ liệu hệ thống dùng để trả lời
          </p>
          <div className="flex flex-wrap gap-2">
            {step.dataPoints.map((point) => (
              <Chip key={point} size="sm" variant="neutral">
                {point}
              </Chip>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Cách đọc đơn giản</p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.simpleReading}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Kết quả sơ bộ hiện tại</p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.currentResult}</p>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Ảnh hưởng đến kết quả lọc</p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.impact}</p>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">Bước tiếp theo</p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.nextStep}</p>
        </div>
        <details className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
          <summary className="cursor-pointer text-xs font-bold text-accent">
            Xem cách hệ thống chấm cửa lọc này
          </summary>
          <p className="mt-3 text-xs leading-5 text-muted">{step.scoring}</p>
        </details>
      </div>
    </div>
  );
}

function shortLabel(step: ScreeningDeepDiveStep) {
  if (step.id === "industry") return "Bối cảnh";
  if (step.id === "business-model") return "Dễ hiểu DN";
  if (step.id === "financial-warning") return "Tài chính sơ bộ";
  if (step.id === "valuation") return "Định giá sơ bộ";
  if (step.id === "liquidity") return "Thanh khoản";
  return step.title;
}

export function ScreeningDeepDive({ data }: ScreeningDeepDiveProps) {
  const tabs: TabItem[] = [
    {
      value: "overview",
      label: "Tổng quan",
      content: (
        <div className="grid gap-3">
          {data.steps.map((step, index) => (
            <div
              key={step.id}
              className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]"
            >
              <div>
                <p className="font-mono text-[11px] font-bold text-subtle">
                  Cửa {index + 1}
                </p>
                <p className="mt-1 text-sm font-bold text-ink">{step.title}</p>
              </div>
              <p className="text-xs leading-5 text-muted">{step.question}</p>
              <p className="text-xs leading-5 text-muted">{step.currentResult}</p>
            </div>
          ))}
        </div>
      ),
    },
    ...data.steps.map((step) => ({
      value: step.id,
      label: shortLabel(step),
      content: <StepContent step={step} />,
    })),
  ];

  return (
    <section>
      <SectionHeader description={data.description} icon={data.icon} title={data.title} />
      <Card>
        <CardBody>
          <Tabs ariaLabel="Giải thích 5 cửa sơ lọc" items={tabs} />
        </CardBody>
      </Card>
    </section>
  );
}
