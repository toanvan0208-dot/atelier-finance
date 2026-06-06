"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "./Button";

type ExpandableInsightProps = {
  title: ReactNode;
  summary: ReactNode;
  children: ReactNode;
  openLabel?: ReactNode;
  closeLabel?: ReactNode;
};

export function ExpandableInsight({
  children,
  closeLabel = "Thu gọn",
  openLabel = "Xem thêm",
  summary,
  title,
}: ExpandableInsightProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{summary}</p>
        </div>
        <Button
          size="sm"
          variant={isOpen ? "secondary" : "ghost"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? closeLabel : openLabel}
        </Button>
      </div>
      {isOpen ? <div className="mt-4 border-t border-border-soft pt-4">{children}</div> : null}
    </section>
  );
}
