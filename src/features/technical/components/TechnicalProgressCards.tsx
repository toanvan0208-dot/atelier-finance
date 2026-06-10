"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import type { TechnicalProgressData, TechnicalProgressStatus, TechnicalTone } from "../types";

type TechnicalProgressCardsProps = {
  data: TechnicalProgressData;
};

const statusTone: Record<TechnicalProgressStatus, "neutral" | "accent" | "success" | "warning"> = {
  "Chưa làm": "neutral",
  "Đang làm": "accent",
  "Đã hoàn thành": "success",
  "Cần kiểm tra thêm": "warning",
};

const cardToneClass: Record<TechnicalTone, string> = {
  accent: "border-accent bg-accent-soft/70",
  danger: "border-danger bg-danger/10",
  neutral: "border-border bg-surface",
  success: "border-success bg-success/10",
  warning: "border-warning bg-warning/10",
};

export function TechnicalProgressCards({ data }: TechnicalProgressCardsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeStep = activeIndex !== null ? data.steps[activeIndex] : null;

  return (
    <section className="space-y-4">
      <SectionHeader
        description={data.description}
        icon={data.steps.length}
        title={data.title}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {data.steps.map((step, index) => (
          <button
            key={step.title}
            className={[
              "flex min-h-[172px] flex-col justify-between rounded-[4px] border-[1.5px] px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-hard-sm",
              cardToneClass[step.tone ?? "neutral"],
            ].join(" ")}
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            <span>
              <span className="flex items-start justify-between gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-xs font-bold text-ink">
                  {step.order}
                </span>
                <Chip size="sm" variant={statusTone[step.status]}>
                  {step.status}
                </Chip>
              </span>
              <span className="mt-3 block text-sm font-bold leading-5 text-ink">
                {step.title}
              </span>
              <span className="mt-2 block text-xs font-semibold leading-5 text-muted">
                {step.question}
              </span>
            </span>
            <span className="mt-4 text-[11px] font-bold text-subtle">Xem popup chi tiết</span>
          </button>
        ))}
      </div>

      {activeStep ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
          role="dialog"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="max-h-[92dvh] w-full max-w-[920px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader
                action={
                  <Button size="sm" variant="ghost" onClick={() => setActiveIndex(null)}>
                    Đóng
                  </Button>
                }
                chip={
                  <Chip size="sm" variant={statusTone[activeStep.status]}>
                    {activeStep.status}
                  </Chip>
                }
                description={activeStep.question}
                icon={activeStep.order}
                title={activeStep.title}
              />
              <CardBody className="max-h-[calc(92dvh-112px)] overflow-y-auto">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-4">
                    <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3">
                      <p className="text-xs font-bold text-ink">Ý chính</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink">
                        {activeStep.summary}
                      </p>
                    </div>

                    {activeStep.sections.map((section) => (
                      <div key={section.title}>
                        <p className="mb-2 text-xs font-bold text-ink">{section.title}</p>
                        <div className="grid gap-2">
                          {section.items.map((item) => (
                            <p
                              key={item}
                              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
                            >
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <aside className="space-y-4">
                    {activeStep.beginnerExplanation ? (
                      <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                        <p className="text-xs font-bold text-ink">Giải thích cho người mới</p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {activeStep.beginnerExplanation}
                        </p>
                      </div>
                    ) : null}

                    {activeStep.example?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-bold text-ink">Ví dụ</p>
                        <div className="grid gap-2">
                          {activeStep.example.map((item) => (
                            <p
                              key={item}
                              className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
                            >
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeStep.reminder ? (
                      <div className="rounded-[4px] border border-warning bg-warning/10 px-3 py-3">
                        <p className="text-xs font-bold text-ink">Ghi nhớ</p>
                        <p className="mt-1 text-sm font-bold leading-6 text-ink">
                          {activeStep.reminder}
                        </p>
                      </div>
                    ) : null}
                  </aside>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  );
}
