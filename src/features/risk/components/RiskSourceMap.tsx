"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { RiskRedesignTone, RiskSource } from "../types";

type RiskSourceMapProps = {
  sources: RiskSource[];
  onNavigate: (key: string) => void;
};

const toneVariant: Record<RiskRedesignTone, "success" | "warning" | "danger" | "neutral"> = {
  low: "success",
  caution: "warning",
  high: "danger",
  missing: "neutral",
};

export function RiskSourceMap({ onNavigate, sources }: RiskSourceMapProps) {
  const [openIds, setOpenIds] = useState<string[]>(
    sources.filter((source) => source.defaultOpen).map((source) => source.id)
  );

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <Card>
      <CardHeader
        title="Rủi ro đến từ đâu?"
        description="Gộp các nhóm rủi ro thành 5 nguồn dễ hiểu, chỉ mở sẵn nhóm cần ưu tiên."
      />
      <CardBody className="space-y-3">
        {sources.map((source) => {
          const isOpen = openIds.includes(source.id);

          return (
            <div key={source.id} className="rounded-[4px] border border-border-soft bg-surface-soft">
              <button
                className="flex w-full flex-col gap-2 px-4 py-4 text-left md:flex-row md:items-center md:justify-between"
                type="button"
                onClick={() => toggle(source.id)}
              >
                <div>
                  <p className="text-sm font-bold text-ink">{source.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{source.mainRisk}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Chip size="sm" variant={toneVariant[source.tone]}>{source.status}</Chip>
                  <span className="text-sm font-bold text-muted">{isOpen ? "−" : "+"}</span>
                </div>
              </button>
              {isOpen ? (
                <div className="grid gap-3 border-t border-border-soft px-4 py-4 md:grid-cols-3">
                  <SourceColumn title="Bằng chứng hiện có" items={source.evidence} />
                  <SourceColumn title="Dữ liệu còn thiếu" items={source.missingData} />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-subtle">Module nguồn</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {source.sourceModules.map((module) => (
                        <Chip key={module} size="sm" variant="neutral">{module}</Chip>
                      ))}
                    </div>
                    <Button className="mt-4 w-full" size="sm" variant="secondary" onClick={() => onNavigate(source.action.moduleKey)}>
                      {source.action.label}
                    </Button>
                  </div>
                </div>
              ) : null}
              {isOpen && (source.warnings?.length || source.relatedMetrics?.length || source.nextChecks?.length) ? (
                <div className="grid gap-3 border-t border-border-soft px-4 py-4 md:grid-cols-3">
                  <SourceColumn title="Cảnh báo" items={source.warnings ?? []} />
                  <SourceColumn title="Chỉ số liên quan" items={source.relatedMetrics ?? []} />
                  <SourceColumn title="Bước kiểm tra tiếp" items={source.nextChecks ?? []} />
                </div>
              ) : null}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}

function SourceColumn({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-subtle">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
