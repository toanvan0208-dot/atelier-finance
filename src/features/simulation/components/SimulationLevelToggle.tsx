"use client";

import { Tabs } from "@/components/ui";
import type { SimulationLevel } from "../types";
import { ToneChip } from "./ToneChip";

type SimulationLevelToggleProps = {
  data: SimulationLevel[];
};

export function SimulationLevelToggle({ data }: SimulationLevelToggleProps) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <h3 className="text-sm font-bold text-ink">Cấp độ mô phỏng</h3>
      <p className="mt-1 text-xs leading-5 text-muted">
        Chọn độ chi tiết phù hợp để ghi nhận, không biến module thành màn hình thao tác giao dịch.
      </p>
      <div className="mt-4">
        <Tabs
          ariaLabel="Cấp độ mô phỏng"
          items={data.map((level) => ({
            value: level.id,
            label: level.label,
            content: (
              <div className="grid gap-3 md:grid-cols-2">
                <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs leading-5 text-muted">
                  {level.description}
                </p>
                <div className="grid gap-2">
                  {level.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-[4px] border border-border-soft bg-surface px-3 py-2"
                    >
                      <span className="text-xs font-semibold text-subtle">{item.label}</span>
                      <span className="text-right text-xs font-bold text-ink">{item.value}</span>
                      {item.tone ? <ToneChip tone={item.tone} /> : null}
                    </div>
                  ))}
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </section>
  );
}
