"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  BusinessHypothesisCheckStatus,
  BusinessHypothesisFinancialCheck,
  BusinessHypothesisVerificationData,
} from "../types";

type BusinessHypothesisVerificationProps = {
  data: BusinessHypothesisVerificationData;
};

const statusLabel: Record<BusinessHypothesisCheckStatus, string> = {
  confirmed: "Xác nhận",
  not_confirmed: "Chưa xác nhận",
  watch: "Cần theo dõi",
  risk: "Rủi ro",
  missing_data: "Thiếu dữ liệu",
};

const statusVariant: Record<BusinessHypothesisCheckStatus, "success" | "warning" | "danger" | "neutral"> = {
  confirmed: "success",
  not_confirmed: "neutral",
  watch: "warning",
  risk: "danger",
  missing_data: "neutral",
};

function scrollToBlock(id?: string) {
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function BusinessHypothesisVerification({ data }: BusinessHypothesisVerificationProps) {
  const [selected, setSelected] = useState<BusinessHypothesisFinancialCheck | null>(null);

  return (
    <section>
      <Card className="border-border-soft">
        <CardHeader
          description={data.description}
          icon="H"
          title={data.title}
          chip={<Chip variant="neutral">Mock bridge</Chip>}
        />
        <CardBody className="space-y-4">
          <div className="hidden overflow-hidden rounded-[4px] border border-border-soft lg:block">
            <div className="grid grid-cols-[1.1fr_1.15fr_0.8fr_0.55fr] bg-surface-soft px-3 py-2 text-[11px] font-bold uppercase text-subtle">
              <span>Giả thuyết từ Module Doanh nghiệp</span>
              <span>Dữ liệu BCTC cần kiểm tra</span>
              <span>Kết quả sơ bộ</span>
              <span>Đi tới</span>
            </div>
            {data.checks.map((check) => (
              <div key={check.id} className="grid grid-cols-[1.1fr_1.15fr_0.8fr_0.55fr] items-center gap-3 border-t border-border-soft px-3 py-3">
                <button type="button" className="text-left text-sm font-bold text-ink hover:underline" onClick={() => setSelected(check)}>
                  {check.hypothesis}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {check.financialDataToCheck.map((item) => <Chip key={item} size="sm" variant="neutral">{item}</Chip>)}
                </div>
                <div>
                  <Chip size="sm" variant={statusVariant[check.status]}>{statusLabel[check.status]}</Chip>
                  <p className="mt-1 text-xs leading-5 text-muted">{check.preliminaryResult}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => scrollToBlock(check.targetBlockId)}>{check.ctaLabel}</Button>
              </div>
            ))}
          </div>

          <div className="space-y-3 lg:hidden">
            {data.checks.map((check) => (
              <div key={check.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left text-sm font-bold text-ink hover:underline" onClick={() => setSelected(check)}>
                    {check.hypothesis}
                  </button>
                  <Chip size="sm" variant={statusVariant[check.status]}>{statusLabel[check.status]}</Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{check.preliminaryResult}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {check.financialDataToCheck.map((item) => <Chip key={item} size="sm" variant="neutral">{item}</Chip>)}
                </div>
                <Button className="mt-3" size="sm" variant="secondary" onClick={() => scrollToBlock(check.targetBlockId)}>{check.ctaLabel}</Button>
              </div>
            ))}
          </div>

          <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">
            {data.warning}
          </p>
        </CardBody>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Chi tiết giả thuyết cần kiểm chứng</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{selected.hypothesis}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              <p className="text-sm leading-6 text-muted"><strong className="text-ink">Giả thuyết:</strong> {selected.detail.sourceHypothesis}</p>
              <div>
                <p className="text-sm font-bold text-ink">Dòng BCTC cần xác nhận</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.detail.financialLines.map((line) => <Chip key={line} variant="neutral">{line}</Chip>)}
                </div>
              </div>
              <p className="text-sm leading-6 text-muted"><strong className="text-ink">Số liệu hiện tại:</strong> {selected.detail.currentEvidence}</p>
              <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">
                Nếu phủ nhận: {selected.detail.thesisImpact}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
