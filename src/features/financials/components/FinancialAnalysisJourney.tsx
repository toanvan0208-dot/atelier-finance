"use client";

import { useState, type ReactNode } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";

export type FinancialJourneyGroup = {
  id: string;
  order: number;
  title: string;
  description: string;
  status: "Đang đọc" | "Chưa đọc" | "Đã kiểm tra" | "Cần xem lại";
  includedBlocks: string[];
  content: ReactNode;
};

type FinancialAnalysisJourneyProps = {
  title: string;
  description: string;
  groups: FinancialJourneyGroup[];
};

const statusVariant: Record<FinancialJourneyGroup["status"], "accent" | "neutral" | "success" | "warning"> = {
  "Đang đọc": "accent",
  "Chưa đọc": "neutral",
  "Đã kiểm tra": "success",
  "Cần xem lại": "warning",
};

export function FinancialAnalysisJourney({ description, groups, title }: FinancialAnalysisJourneyProps) {
  const [activeId, setActiveId] = useState(groups[0]?.id ?? "");
  const activeGroup = groups.find((group) => group.id === activeId) ?? groups[0];

  return (
    <section className="space-y-4">
      <Card className="border-border">
        <CardHeader
          chip={<Chip variant="accent">{groups.length} cụm</Chip>}
          description={description}
          icon="J"
          title={title}
        />
        <CardBody className="space-y-4">
          <div
            aria-label={title}
            className="flex overflow-x-auto overflow-y-hidden border-b border-border-soft [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible"
            role="tablist"
          >
            {groups.map((group) => {
              const active = group.id === activeGroup.id;

              return (
                <button
                  key={group.id}
                  aria-controls={`financial-journey-panel-${group.id}`}
                  aria-selected={active}
                  className={[
                    "relative -mb-px min-h-[76px] min-w-[148px] flex-1 rounded-t-[5px] border border-b-0 px-3 py-2 text-left transition",
                    active
                      ? "z-10 border-border bg-surface text-ink shadow-hard-sm"
                      : "border-border-soft bg-surface-soft/80 text-ink hover:bg-surface-hover",
                  ].join(" ")}
                  onClick={() => setActiveId(group.id)}
                  role="tab"
                  type="button"
                >
                  <p className={active ? "font-mono text-[11px] font-bold text-accent" : "font-mono text-[11px] font-bold text-subtle"}>
                    Cụm {group.order}/5
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-4 sm:text-[13px]">
                    {group.title}
                  </p>
                  <div className="mt-1.5">
                    <Chip size="sm" variant={statusVariant[group.status]}>
                      {group.status}
                    </Chip>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-b-[4px] rounded-tr-[4px] border border-border-soft bg-surface px-3 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-ink">{activeGroup.title}</p>
                  <Chip size="sm" variant={statusVariant[activeGroup.status]}>
                    {activeGroup.status}
                  </Chip>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{activeGroup.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeGroup.includedBlocks.map((block) => (
                  <Chip key={block} size="sm" variant="neutral">
                    {block}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div
            id={`financial-journey-panel-${activeGroup.id}`}
            className="space-y-4 border-t border-border-soft pt-4 [&>section]:border-0 [&>section]:shadow-none"
            role="tabpanel"
          >
            {activeGroup.content}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
