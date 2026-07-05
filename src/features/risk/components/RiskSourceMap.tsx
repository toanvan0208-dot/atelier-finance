"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { RiskDisclosureFieldEvidence, RiskRedesignTone, RiskSource } from "../types";

type RiskSourceMapProps = {
  sources: RiskSource[];
  onNavigate: (key: string) => void;
};

const toneVariant: Record<RiskRedesignTone, "success" | "warning" | "danger" | "neutral"> = {
  ready: "success",
  check: "warning",
  blocked: "danger",
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
        title="Hàng đợi xác minh"
        description="Mỗi dòng chỉ nêu khoảng trống và nơi cần quay lại, không lặp lại phần phân tích của module nguồn."
      />
      <CardBody className="space-y-2">
        {sources.map((source, index) => {
          const isOpen = openIds.includes(source.id);
          const primaryItems = source.missingData.length ? source.missingData : source.evidence;
          const secondaryItems = [...(source.warnings ?? []), ...(source.relatedMetrics ?? []), ...(source.nextChecks ?? [])]
            .filter((item) => !primaryItems.includes(item));

          return (
            <div key={source.id} className="rounded-[4px] border border-border-soft bg-surface-soft">
              <button
                className="grid w-full gap-3 px-4 py-4 text-left md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-start"
                type="button"
                onClick={() => toggle(source.id)}
              >
                <div className="grid h-8 w-8 place-items-center rounded-[3px] border border-border-soft bg-surface text-xs font-bold text-ink">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{source.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{source.mainRisk}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {source.sourceModules.map((module) => (
                      <Chip key={module} size="sm" variant="neutral">{module}</Chip>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Chip size="sm" variant={toneVariant[source.tone]}>{source.status}</Chip>
                  <span className="text-xs font-bold text-muted">{isOpen ? "Thu gọn" : "Chi tiết"}</span>
                </div>
              </button>
              {isOpen ? (
                <div className="grid gap-3 border-t border-border-soft px-4 py-4">
                  <SourceColumn title="Cần xác minh" items={primaryItems} compact />
                  {source.evidenceDetails?.length ? (
                    <DisclosureEvidenceList items={source.evidenceDetails} />
                  ) : null}
                  <div className="rounded-[3px] border border-border-soft bg-surface p-3">
                    <p className="text-[11px] font-bold uppercase text-subtle">Hành động</p>
                    <p className="mt-2 text-xs leading-5 text-muted">Mở module nguồn để kiểm tra dữ liệu gốc, không suy luận tại trang Risk.</p>
                    <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => onNavigate(source.action.moduleKey)}>
                      {source.action.label}
                    </Button>
                  </div>
                </div>
              ) : null}
              {isOpen && secondaryItems.length ? (
                <div className="border-t border-border-soft px-4 py-4">
                  <SourceColumn title="Ghi chú kiểm tra" items={secondaryItems} compact />
                </div>
              ) : null}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}

const evidenceToneVariant: Record<RiskDisclosureFieldEvidence["status"], "success" | "warning" | "neutral"> = {
  backed_by_pdf: "success",
  needs_review: "warning",
  not_found: "neutral",
};

const evidenceStatusLabel: Record<RiskDisclosureFieldEvidence["status"], string> = {
  backed_by_pdf: "Có trang PDF",
  needs_review: "Cần rà soát",
  not_found: "Chưa thấy",
};

function DisclosureEvidenceList({ items }: { items: RiskDisclosureFieldEvidence[] }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-subtle">Bằng chứng PDF local</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.field} className="rounded-[3px] border border-border-soft bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold text-ink">{item.label}</p>
              <Chip size="sm" variant={evidenceToneVariant[item.status]}>
                {evidenceStatusLabel[item.status]}
              </Chip>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{item.note}</p>
            <p className="mt-2 text-[11px] font-bold text-subtle">
              {item.source}
              {item.page ? ` - trang ${item.page}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceColumn({ compact = false, items, title }: { compact?: boolean; items: string[]; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-subtle">{title}</p>
      <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-2 space-y-2"}>
        {items.map((item) => (
          <p key={item} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
