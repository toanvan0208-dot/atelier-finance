"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ValuationTrapItem, ValuationTrapRadarData } from "../types";

type ValuationTrapRadarProps = {
  data: ValuationTrapRadarData;
};

const severityLabel: Record<ValuationTrapItem["severity"], string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  unknown: "Chưa đủ dữ liệu",
};

const severityVariant: Record<ValuationTrapItem["severity"], "danger" | "warning" | "success" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "success",
  unknown: "neutral",
};

export function ValuationTrapRadar({ data }: ValuationTrapRadarProps) {
  const [selected, setSelected] = useState<ValuationTrapItem | null>(null);

  return (
    <section>
      <Card className="border-border">
        <CardHeader description={data.description} icon="T" title={data.title} />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.traps.map((trap, index) => (
              <button
                key={trap.id}
                type="button"
                onClick={() => setSelected(trap)}
                className={[
                  "rounded-[4px] border px-3 py-3 text-left transition hover:border-border hover:bg-surface",
                  index === 0 ? "border-warning bg-warning/15" : "border-border-soft bg-surface-soft",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{trap.name}</p>
                  <Chip size="sm" variant={severityVariant[trap.severity]}>{severityLabel[trap.severity]}</Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{trap.whyRelevant}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {trap.dataToCheck.slice(0, 3).map((item) => <Chip key={item} size="sm" variant="neutral">{item}</Chip>)}
                </div>
                {trap.targetModule ? <p className="mt-2 text-[11px] font-bold text-subtle">CTA: {trap.targetModule}</p> : null}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-lg font-bold text-ink">Vì sao đây là bẫy định giá?</h3>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              <p className="text-sm font-bold text-ink">{selected.name}</p>
              <p className="text-sm leading-6 text-muted">{selected.whyRelevant}</p>
              <div>
                <p className="text-sm font-bold text-ink">Dữ liệu cần kiểm chứng</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.dataToCheck.map((item) => <Chip key={item} variant="neutral">{item}</Chip>)}
                </div>
              </div>
              <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">
                Bẫy định giá không có nghĩa là kết luận xấu. Nó chỉ cho biết phần định giá cần hạ độ tin cậy nếu dữ liệu không xác nhận.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
