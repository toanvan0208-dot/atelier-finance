"use client";

import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockIdea } from "../types";
import { ModuleStatusBadge, StatusBadge } from "./WatchlistPrimitives";

type StockIdeaCardProps = {
  data: StockIdea;
  onOpenDetails?: (ticker: string) => void;
};

const compactModuleNames = ["Vĩ mô", "Ngành", "Doanh nghiệp", "BCTC", "Định giá", "Rủi ro", "PVT", "Checklist"];

function getModuleStatus(data: StockIdea, compactName: string) {
  const aliases: Record<string, string[]> = {
    "Vĩ mô": ["Vĩ mô"],
    Ngành: ["Ngành"],
    "Doanh nghiệp": ["Hiểu doanh nghiệp", "Doanh nghiệp"],
    BCTC: ["BCTC"],
    "Định giá": ["Định giá"],
    PVT: ["PVT"],
    "Rủi ro": ["Rủi ro"],
    Checklist: ["Checklist"],
  };
  const names = aliases[compactName] ?? [compactName];
  return data.progress.find((item) => names.includes(item.moduleName))?.status ?? "Chưa làm";
}

function hasFomoWarning(data: StockIdea) {
  return data.tags.some((tag) => tag.toLowerCase().includes("fomo")) ||
    data.risks.some((risk) => risk.toLowerCase().includes("fomo")) ||
    data.emotionalState.toLowerCase().includes("fomo");
}

export function StockIdeaCard({ data, onOpenDetails }: StockIdeaCardProps) {
  return (
    <Card>
      <CardHeader
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge status={data.status} />
            <Chip variant={data.priority.toLowerCase().includes("cao") ? "warning" : "neutral"}>
              {data.priority}
            </Chip>
          </div>
        }
        description={`${data.companyName} · ${data.industry}`}
        icon={data.ticker.slice(0, 2)}
        title={data.ticker}
      />
      <CardBody className="space-y-4">
        <section className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
          <Chip size="sm" variant="accent">Thesis đang kiểm chứng</Chip>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{data.thesis || "Chưa có thesis rõ."}</p>
        </section>

        <section>
          <p className="text-xs font-bold text-ink">Lý do theo dõi</p>
          <p className="mt-1 text-sm leading-6 text-muted">{data.reason}</p>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">Còn thiếu</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.missingModules.length ? (
                data.missingModules.slice(0, 4).map((module) => <Chip key={module} size="sm" variant="warning">{module}</Chip>)
              ) : (
                <Chip size="sm" variant="success">Đã có nền sơ bộ</Chip>
              )}
            </div>
          </section>
          <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">Cảnh báo chính</p>
            <p className="mt-2 text-xs leading-5 text-muted">{data.risks[0] ?? "Chưa có cảnh báo nổi bật."}</p>
          </section>
        </div>

        <section>
          <p className="mb-2 text-xs font-bold text-ink">Tiến độ 8 bước</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {compactModuleNames.map((moduleName) => (
              <div key={moduleName} className="flex items-center justify-between gap-2 rounded-[3px] border border-border-soft bg-surface-soft px-2 py-1">
                <span className="text-[11px] font-bold text-ink">{moduleName}</span>
                <ModuleStatusBadge status={getModuleStatus(data, moduleName)} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Chip variant="accent">Bước tiếp theo</Chip>
            <span className="text-xs font-bold text-ink">{data.readiness}</span>
          </div>
          <p className="text-xs leading-5 text-muted">{data.nextStep}</p>
        </section>

        {hasFomoWarning(data) ? (
          <p className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs leading-5 text-muted">
            Có dấu hiệu FOMO: cần ghi rõ dữ liệu đang kiểm chứng trước khi tiếp tục theo dõi.
          </p>
        ) : null}

        {data.events[0] ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
            Sự kiện gần nhất: <strong className="text-ink">{data.events[0].label}</strong> · {data.events[0].date}
          </div>
        ) : null}

        <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-ink">Ghi chú gần nhất</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {data.latestNote || "Chưa có ghi chú gần nhất cho mã này."}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-subtle">
                Module: Watchlist · Cập nhật: {data.addedDate}
              </p>
            </div>
            <AnalysisNotePopover
              contextTitle={`Ghi chú phân tích về ${data.ticker}`}
              moduleId={`watchlist-${data.ticker}`}
              moduleName="Watchlist"
              noteType="personal"
              stockSymbol={data.ticker}
              triggerLabel="Xem ghi chú"
            />
          </div>
        </section>

        <div className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs text-muted sm:grid-cols-3">
          <span>Giá: <strong className="text-ink">{data.currentPrice}</strong></span>
          <span>30 ngày: <strong className="text-ink">{data.recentMove}</strong></span>
          <span>Thanh khoản: <strong className="text-ink">{data.liquidity}</strong></span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onOpenDetails?.(data.ticker)}>
            {data.actions[0]?.label ?? "Xem chi tiết"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onOpenDetails?.(data.ticker)}>
            Mở chi tiết
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
