"use client";

import { Card, CardBody, SectionHeader } from "@/components/ui";
import type { ScreeningMode, ScreeningModeOption } from "../types";

type ScreeningModeSelectorProps = {
  mode: ScreeningMode;
  options: ScreeningModeOption[];
  onChange: (mode: ScreeningMode) => void;
};

export function ScreeningModeSelector({
  mode,
  onChange,
  options,
}: ScreeningModeSelectorProps) {
  return (
    <section>
      <SectionHeader
        icon="?"
        title="Bạn muốn bắt đầu từ đâu?"
        description="Chỉ một luồng được hiển thị tại một thời điểm để màn hình chính dễ quét hơn."
      />
      <Card>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2" role="radiogroup">
            {options.map((option) => {
              const isActive = option.value === mode;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={[
                    "min-h-[112px] rounded-[4px] border-[1.5px] px-4 py-4 text-left transition",
                    isActive
                      ? "border-border bg-accent-soft shadow-hard-sm"
                      : "border-border-soft bg-surface-soft hover:border-border hover:bg-surface-hover",
                  ].join(" ")}
                  onClick={() => onChange(option.value)}
                >
                  <span className="block text-sm font-bold leading-6 text-ink">
                    {option.title}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-muted">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
