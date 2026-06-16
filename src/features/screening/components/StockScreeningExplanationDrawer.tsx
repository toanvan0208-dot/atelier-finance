"use client";

import { useEffect } from "react";
import { Button, Chip } from "@/components/ui";
import type { ScreeningStock, StockFunnelReview } from "../types";

type StockScreeningExplanationDrawerProps = {
  stock: ScreeningStock | null;
  onClose: () => void;
};

function statusTone(status: StockFunnelReview["status"]) {
  if (status === "Đạt") return "success";
  if (status === "Cần kiểm tra") return "warning";
  if (status === "Cảnh báo") return "danger";
  return "neutral";
}

export function StockScreeningExplanationDrawer({
  onClose,
  stock,
}: StockScreeningExplanationDrawerProps) {
  useEffect(() => {
    if (!stock) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, stock]);

  if (!stock) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-ink/30"
        type="button"
        aria-label="Đóng phần giải thích"
        onClick={onClose}
      />
      <aside
        className="absolute bottom-0 right-0 top-auto flex max-h-[88dvh] w-full flex-col rounded-t-[4px] border-[1.5px] border-border bg-surface shadow-hard-lg md:top-0 md:max-h-none md:w-[460px] md:rounded-none md:border-y-0 md:border-r-0"
        aria-modal="true"
        role="dialog"
        aria-labelledby="stock-screening-drawer-title"
      >
        <header className="border-b border-border-soft bg-surface-soft px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                {stock.ticker} - {stock.companyName}
              </p>
              <h2
                id="stock-screening-drawer-title"
                className="mt-1 font-brand text-lg font-bold text-ink"
              >
                Vì sao được xếp vào nhóm này?
              </h2>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
            <Chip variant="accent">{stock.classification}</Chip>
            <p className="mt-2 text-sm leading-6 text-muted">{stock.mainReason}</p>
            <p className="mt-2 text-[11px] font-semibold text-subtle">
              Đây chỉ là dữ liệu cần kiểm tra thêm.
            </p>
          </div>

          <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <h3 className="text-sm font-bold text-ink">Số liệu chính</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {stock.metrics.map((metric) => (
                <div key={metric.id} className="rounded-[4px] bg-surface px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
                    {metric.isMock ? <Chip size="sm" variant="neutral">Mock</Chip> : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink">{metric.value}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted">{metric.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-3">
            {stock.funnel.map((item) => (
              <section
                key={item.layer}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-ink">{item.layer}</h3>
                  <Chip size="sm" variant={statusTone(item.status)}>
                    {item.status}
                  </Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {item.simpleExplanation}
                </p>
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                    Cần xem tiếp
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.nextDataToCheck.map((label) => (
                      <Chip key={label} size="sm" variant="neutral">
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Button className="mt-3" size="sm" variant="ghost">
                  Mở module {item.relatedModule}
                </Button>
              </section>
            ))}
          </div>

          <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3">
            <h3 className="text-sm font-bold text-ink">Bước tiếp theo nên làm</h3>
            <ol className="mt-2 space-y-1 text-xs leading-5 text-muted">
              <li>1. Mở hồ sơ doanh nghiệp</li>
              <li>2. Xem báo cáo tài chính</li>
              <li>3. So sánh với mã cùng ngành</li>
              <li>4. Thêm vào watchlist để theo dõi</li>
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
