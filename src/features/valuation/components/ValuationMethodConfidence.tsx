"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  ValuationConfidence,
  ValuationMethodConfidenceData,
  ValuationMethodConfidenceItem,
} from "../types";

type ValuationMethodConfidenceProps = {
  data: ValuationMethodConfidenceData;
};

const suitabilityLabel: Record<ValuationMethodConfidenceItem["suitability"], string> = {
  primary: "Phù hợp chính",
  reference: "Dùng tham khảo",
  caution: "Cẩn trọng",
  not_suitable: "Không phù hợp",
};

const suitabilityVariant: Record<ValuationMethodConfidenceItem["suitability"], "success" | "accent" | "warning" | "danger" | "neutral"> = {
  primary: "success",
  reference: "accent",
  caution: "warning",
  not_suitable: "neutral",
};

const confidenceLabel: Record<ValuationConfidence, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  unknown: "Chưa rõ",
};

export function ValuationMethodConfidence({ data }: ValuationMethodConfidenceProps) {
  const [selected, setSelected] = useState<ValuationMethodConfidenceItem | null>(null);

  return (
    <section>
      <Card className="border-border-soft">
        <CardHeader description={data.description} icon="P" title={data.title} />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.methods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelected(method)}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-bold text-ink">{method.method}</p>
                  <Chip size="sm" variant={suitabilityVariant[method.suitability]}>{suitabilityLabel[method.suitability]}</Chip>
                </div>
                {method.range ? <p className="mt-2 font-brand text-xl font-bold text-ink">{method.range}</p> : null}
                <p className="mt-2 text-xs leading-5 text-muted">{method.reason}</p>
                <p className="mt-2 text-[11px] font-bold text-subtle">Độ tin cậy: {confidenceLabel[method.confidence]}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Chi tiết phương pháp định giá</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{selected.method}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              <p className="text-sm leading-6 text-muted"><strong className="text-ink">Dùng khi nào?</strong> {selected.detail.whenToUse}</p>
              <div>
                <p className="text-sm font-bold text-ink">Đầu vào cần kiểm tra</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.detail.inputsToCheck.map((item) => <Chip key={item} variant="neutral">{item}</Chip>)}
                </div>
              </div>
              <p className="text-sm leading-6 text-muted"><strong className="text-ink">Khi nào dễ sai?</strong> {selected.detail.failureMode}</p>
              <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">Bẫy người mới: {selected.detail.beginnerTrap}</p>
              <p className="text-xs leading-5 text-muted">Độ tin cậy hiện tại: {confidenceLabel[selected.confidence]}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
