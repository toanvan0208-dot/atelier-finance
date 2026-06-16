"use client";

import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { ModuleStatus, StockIdea } from "../types";
import { ModuleStatusBadge, StatusBadge } from "./WatchlistPrimitives";

type StockIdeaCardProps = {
  data: StockIdea;
  isOpen: boolean;
  onNavigateModule: (moduleKey: string) => void;
  onToggle: (ticker: string) => void;
};

const compactModuleNames = [
  "Vĩ mô",
  "Ngành",
  "Doanh nghiệp",
  "BCTC",
  "Định giá",
  "Rủi ro",
  "PVT",
  "Checklist",
];

function normalized(value: string) {
  return value.toLowerCase();
}

function moduleKeyFromLabel(label: string) {
  const value = normalized(label);

  if (value.includes("bctc") || value.includes("tài chính") || value.includes("tÃ i chÃ­nh")) return "financials";
  if (value.includes("định giá") || value.includes("Ä‘á»‹nh giÃ¡")) return "valuation";
  if (value.includes("rủi ro") || value.includes("rá»§i ro")) return "risk";
  if (value.includes("pvt") || value.includes("price")) return "technical";
  if (value.includes("ngành") || value.includes("ngÃ nh")) return "industry";
  if (value.includes("doanh nghiệp") || value.includes("doanh nghiá»‡p") || value.includes("hiểu")) return "business";
  if (value.includes("checklist") || value.includes("kiểm tra")) return "checklist";
  if (value.includes("mô phỏng") || value.includes("mÃ´ phá»ng")) return "simulation";
  if (value.includes("vĩ mô") || value.includes("vÄ© mÃ´")) return "macro";

  return "business";
}

function getModuleStatus(data: StockIdea, compactName: string) {
  const aliases: Record<string, string[]> = {
    "Vĩ mô": ["Vĩ mô", "VÄ© mÃ´"],
    "Ngành": ["Ngành", "NgÃ nh"],
    "Doanh nghiệp": ["Hiểu doanh nghiệp", "Hiá»ƒu doanh nghiá»‡p", "Doanh nghiệp", "Doanh nghiá»‡p"],
    BCTC: ["BCTC"],
    "Định giá": ["Định giá", "Äá»‹nh giÃ¡"],
    PVT: ["PVT"],
    "Rủi ro": ["Rủi ro", "Rá»§i ro"],
    Checklist: ["Checklist"],
  };
  const names = aliases[compactName] ?? [compactName];
  const fallbackStatus = "ChÆ°a lÃ m" as ModuleStatus;
  return data.progress.find((item) => names.includes(item.moduleName))?.status ?? fallbackStatus;
}

function hasFomoWarning(data: StockIdea) {
  return (
    data.tags.some((tag) => normalized(tag).includes("fomo")) ||
    data.risks.some((risk) => normalized(risk).includes("fomo")) ||
    normalized(data.emotionalState).includes("fomo")
  );
}

function isCompletedStatus(status: string) {
  return status === "Đã xong" || status === "ÄÃ£ xong" || status === "Có thể chuyển tiếp" || status === "CÃ³ thá»ƒ chuyá»ƒn tiáº¿p";
}

function getNextAnalysisModule(data: StockIdea) {
  const nextMissingModule = data.missingModules[0];
  if (nextMissingModule) return moduleKeyFromLabel(nextMissingModule);

  const nextProgressItem = data.progress.find((item) => !isCompletedStatus(item.status));
  if (nextProgressItem) return moduleKeyFromLabel(nextProgressItem.moduleName);

  return "checklist";
}

function getActionTargetModule(data: StockIdea, label?: string) {
  const value = normalized(label ?? "");

  if (value.includes("mô phỏng") || value.includes("mÃ´ phá»ng")) return "simulation";
  if (value.includes("checklist") || value.includes("kiểm tra")) return "checklist";
  if (value.includes("rủi ro") || value.includes("rá»§i ro")) return "risk";
  if (value.includes("ghi nhật") || value.includes("ghi nháº­t")) return "simulation";
  if (value.includes("phân tích") || value.includes("phÃ¢n tÃ­ch")) return getNextAnalysisModule(data);

  return getNextAnalysisModule(data);
}

export function StockIdeaCard({
  data,
  isOpen,
  onNavigateModule,
  onToggle,
}: StockIdeaCardProps) {
  const primaryAction = data.actions[0];

  return (
    <Card>
      <button
        aria-expanded={isOpen}
        className="flex w-full flex-col gap-3 border-b border-border-soft bg-surface-soft/70 px-5 py-4 text-left transition hover:bg-surface-hover md:flex-row md:items-start md:justify-between"
        type="button"
        onClick={() => onToggle(data.ticker)}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-ink">{data.ticker}</h3>
            <StatusBadge status={data.status} />
            <Chip size="sm" variant={data.priority.toLowerCase().includes("cao") ? "warning" : "neutral"}>
              {data.priority}
            </Chip>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">
            {data.companyName} · {data.industry}
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-ink">
            {data.thesis || "Chưa có thesis rõ."}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-muted">
          {isOpen ? "Thu gọn −" : "Xem chi tiết +"}
        </span>
      </button>

      {isOpen ? (
        <CardBody className="space-y-4">
          <section className="rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
            <Chip size="sm" variant="accent">Thesis đang kiểm chứng</Chip>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink">
              {data.thesis || "Chưa có thesis rõ."}
            </p>
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
                  data.missingModules.slice(0, 4).map((module) => (
                    <Chip key={module} size="sm" variant="warning">{module}</Chip>
                  ))
                ) : (
                  <Chip size="sm" variant="success">Đã có nền sơ bộ</Chip>
                )}
              </div>
            </section>
            <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-xs font-bold text-ink">Cảnh báo chính</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                {data.risks[0] ?? "Chưa có cảnh báo nổi bật."}
              </p>
            </section>
          </div>

          {data.logicSummary ? (
            <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="accent">Tóm tắt từ financial logic</Chip>
                <span className="text-[11px] font-semibold text-subtle">Chỉ là ý tưởng cần kiểm tra thêm</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
                  <p className="text-[11px] font-bold text-subtle">Sức khỏe tài chính</p>
                  <p className="mt-1 text-xs font-bold text-ink">
                    {data.logicSummary.financialHealthStatus} · {data.logicSummary.financialHealthScore === null ? "Chưa đủ dữ liệu" : `${data.logicSummary.financialHealthScore}/100`}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{data.logicSummary.financialHealthDetail}</p>
                </div>
                <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
                  <p className="text-[11px] font-bold text-subtle">Định giá</p>
                  <p className="mt-1 text-xs font-bold text-ink">
                    {data.logicSummary.valuationReadiness} · Tin cậy: {data.logicSummary.valuationConfidence}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{data.logicSummary.valuationDetail}</p>
                </div>
                <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
                  <p className="text-[11px] font-bold text-subtle">Rủi ro tổng hợp</p>
                  <p className="mt-1 text-xs font-bold text-ink">
                    {data.logicSummary.overallRiskLevel} · {data.logicSummary.overallRiskScore === null ? "Chưa đủ dữ liệu" : `${data.logicSummary.overallRiskScore}/100`}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{data.logicSummary.overallRiskDetail}</p>
                </div>
                <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
                  <p className="text-[11px] font-bold text-subtle">Chất lượng dữ liệu</p>
                  <p className="mt-1 text-xs font-bold text-ink">{data.logicSummary.dataQualityStatus}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">
                    {data.logicSummary.missingFields.length
                      ? `Thiếu: ${data.logicSummary.missingFields.slice(0, 4).join(", ")}`
                      : "Dữ liệu đủ để đọc sơ bộ, vẫn cần đối chiếu nguồn."}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold text-ink">Cảnh báo từ logic</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {data.logicSummary.topWarnings[0] ?? "Chưa có cảnh báo nổi bật từ dữ liệu hiện có."}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ink">Bước cần kiểm tra</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{data.logicSummary.nextChecks[0]}</p>
                </div>
              </div>
            </section>
          ) : null}

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
            <Button
              size="sm"
              onClick={() => onNavigateModule(getActionTargetModule(data, primaryAction?.label))}
            >
              {primaryAction?.label ?? "Phân tích tiếp"}
            </Button>
          </div>
        </CardBody>
      ) : null}
    </Card>
  );
}
