"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningInputData, ScreeningOption, ScreeningStockGroup } from "../types";

type ScreeningInputPanelProps = {
  data: ScreeningInputData;
  resultGroups?: ScreeningStockGroup[];
  onIndustryChange?: (industry: string) => void;
};

function getSelectedLabel(items: ScreeningOption[], value: string, fallback: string) {
  return items.find((item) => item.value === value)?.label ?? fallback;
}

function ChoiceGroup({
  activeValue,
  items,
  label,
  onChange,
}: {
  activeValue: string;
  items: ScreeningOption[];
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
        {label}
      </p>
      <div className="grid gap-2">
        {items.map((item) => {
          const isActive = item.value === activeValue;

          return (
            <button
              key={item.value}
              className={[
                "rounded-[4px] border-[1.5px] px-3 py-2 text-left transition",
                isActive
                  ? "border-border bg-accent-soft shadow-hard-sm"
                  : "border-border-soft bg-surface hover:border-border hover:bg-surface-hover",
              ].join(" ")}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(item.value)}
            >
              <span className="block text-xs font-bold text-ink">{item.label}</span>
              {item.description ? (
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {item.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ScreeningInputPanel({
  data,
  resultGroups = [],
  onIndustryChange,
}: ScreeningInputPanelProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(data.defaultIndustry);
  const [selectedRisk, setSelectedRisk] = useState(data.defaultRisk);
  const [selectedObjective, setSelectedObjective] = useState(data.defaultObjective);
  const [isOpen, setIsOpen] = useState(false);

  function handleIndustryChange(value: string) {
    setSelectedIndustry(value);
    onIndustryChange?.(value);
  }

  const sentence = useMemo(() => {
    const industry = getSelectedLabel(
      data.industries,
      selectedIndustry,
      data.sentenceTemplate.industryFallback
    );
    const risk = getSelectedLabel(
      data.riskLevels,
      selectedRisk,
      data.sentenceTemplate.riskFallback
    );
    const objective = getSelectedLabel(
      data.objectives,
      selectedObjective,
      data.sentenceTemplate.objectiveFallback
    );

    return `${data.sentenceTemplate.prefix} ${industry} phù hợp với ${risk} để ${objective.toLowerCase()}.`;
  }, [data, selectedIndustry, selectedObjective, selectedRisk]);

  const selectedIndustryLabel = getSelectedLabel(
    data.industries,
    selectedIndustry,
    data.sentenceTemplate.industryFallback
  );
  const selectedRiskLabel = getSelectedLabel(
    data.riskLevels,
    selectedRisk,
    data.sentenceTemplate.riskFallback
  );
  const selectedObjectiveLabel = getSelectedLabel(
    data.objectives,
    selectedObjective,
    data.sentenceTemplate.objectiveFallback
  );
  const priorityCount = resultGroups.find((group) => group.key === "priority")?.stocks.length ?? 0;
  const reviewCount = resultGroups.find((group) => group.key === "review")?.stocks.length ?? 0;
  const excludedCount = resultGroups.find((group) => group.key === "excluded")?.stocks.length ?? 0;

  return (
    <>
      <Card className="border-border bg-surface">
        <CardHeader description={data.description} icon="F" title="Screening Command Center" />
        <CardBody className="space-y-4">
          <div className="rounded-[4px] border border-accent bg-accent-soft px-4 py-4">
            <p className="text-sm font-bold leading-6 text-ink">{sentence}</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Câu lọc đang được thu gọn để màn hình chính tập trung vào kết quả và luận điểm bối cảnh.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: data.industryLabel, value: selectedIndustryLabel },
              { label: data.riskLabel, value: selectedRiskLabel },
              { label: data.objectiveLabel, value: selectedObjectiveLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "Đáng phân tích tiếp", value: priorityCount },
              { label: "Theo dõi thêm", value: reviewCount },
              { label: "Chưa phù hợp", value: excludedCount },
            ].map((item) => (
              <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-ink">{item.value} mã</p>
              </div>
            ))}
          </div>

          {selectedRisk === "high" ? (
            <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
              {data.highRiskWarning}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
            <Button size="sm" variant="primary" onClick={() => setIsOpen(true)}>
              Mở câu lọc
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                handleIndustryChange(data.defaultIndustry);
                setSelectedRisk(data.defaultRisk);
                setSelectedObjective(data.defaultObjective);
              }}
            >
              Đặt lại về mẫu dễ hiểu
            </Button>
          </div>
        </CardBody>
      </Card>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[92dvh] w-full max-w-[920px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-accent">Câu lọc của tôi</p>
                <h2 className="mt-1 text-lg font-bold leading-tight text-ink">Chọn tiêu chí lọc cổ phiếu</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{data.description}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                Đóng
              </Button>
            </div>

            <div className="max-h-[calc(92dvh-92px)] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="space-y-5">
                <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
                  <p className="text-base font-bold leading-7 text-ink">{sentence}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{data.example}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
                  <ChoiceGroup
                    activeValue={selectedIndustry}
                    items={data.industries}
                    label={data.industryLabel}
                    onChange={handleIndustryChange}
                  />
                  <ChoiceGroup
                    activeValue={selectedRisk}
                    items={data.riskLevels}
                    label={data.riskLabel}
                    onChange={setSelectedRisk}
                  />
                  <ChoiceGroup
                    activeValue={selectedObjective}
                    items={data.objectives}
                    label={data.objectiveLabel}
                    onChange={setSelectedObjective}
                  />
                </div>

                {selectedRisk === "high" ? (
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
                    {data.highRiskWarning}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft bg-surface-soft px-4 py-3 sm:px-5">
              <Button size="sm" variant="secondary">
                Lưu câu lọc
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    handleIndustryChange(data.defaultIndustry);
                    setSelectedRisk(data.defaultRisk);
                    setSelectedObjective(data.defaultObjective);
                  }}
                >
                  Đặt lại về mẫu dễ hiểu
                </Button>
                <Button size="sm" variant="primary" onClick={() => setIsOpen(false)}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
