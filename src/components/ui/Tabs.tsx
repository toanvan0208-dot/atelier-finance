"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
};

export function Tabs({
  ariaLabel,
  defaultValue,
  items,
  onChange,
  value,
}: TabsProps) {
  const generatedId = useId();
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items.find((item) => !item.disabled)?.value ?? items[0]?.value
  );
  const activeValue = value ?? internalValue;
  const activeItem = items.find((item) => item.value === activeValue);

  function handleChange(nextValue: string) {
    setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  return (
    <div>
      <div
        className="flex gap-2 overflow-x-auto border-b border-border-soft pb-2"
        role="tablist"
        aria-label={ariaLabel}
      >
        {items.map((item) => {
          const isActive = item.value === activeValue;
          const tabId = `${generatedId}-tab-${item.value}`;
          const panelId = `${generatedId}-panel-${item.value}`;

          return (
            <button
              key={item.value}
              id={tabId}
              className={cn(
                "min-h-9 shrink-0 rounded-[3px] border-[1.5px] px-3 text-xs font-bold transition",
                isActive
                  ? "border-border bg-accent-soft text-accent shadow-hard-sm"
                  : "border-border-soft bg-surface text-muted hover:border-border hover:bg-surface-hover hover:text-ink",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              disabled={item.disabled}
              type="button"
              role="tab"
              aria-controls={panelId}
              aria-selected={isActive}
              onClick={() => handleChange(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div
          id={`${generatedId}-panel-${activeItem.value}`}
          className="pt-5"
          role="tabpanel"
          aria-labelledby={`${generatedId}-tab-${activeItem.value}`}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
