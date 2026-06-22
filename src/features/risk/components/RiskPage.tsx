"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { Chip } from "@/components/ui";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import {
  riskDataQuality,
  riskRedesignDataByTicker,
  riskStatementSnapshotsByTicker,
} from "../data/riskRedesign.data";
import { buildRiskDeskData } from "../lib/build-risk-desk-data";
import {
  buildRiskFinancialsRuntimeConsumption,
  type RiskFinancialsRuntimeConsumption,
} from "../lib/risk-financials-runtime-consumption";
import type { RiskStatementSnapshot } from "../lib/map-risk-to-logic-input";
import { CriticalRiskCards } from "./CriticalRiskCards";
import { RiskFinalConclusion } from "./RiskFinalConclusion";
import { RiskHeroSummary } from "./RiskHeroSummary";
import { RiskSourceMap } from "./RiskSourceMap";
import { StopConditionPanel } from "./StopConditionPanel";
import { ThesisBreakerPanel } from "./ThesisBreakerPanel";

type RiskPageProps = {
  initialFinancialsRuntimeData?: FinancialsRuntimeData;
  onNavigate: (key: string) => void;
};

const navigationChangeEvent = "app:navigation";

const normalizeTicker = (ticker: string | null | undefined): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
};

const useRiskTickerFromUrl = () =>
  useSyncExternalStore(
    (callback) => {
      const timeoutId = window.setTimeout(callback, 0);
      window.addEventListener("popstate", callback);
      window.addEventListener(navigationChangeEvent, callback);
      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("popstate", callback);
        window.removeEventListener(navigationChangeEvent, callback);
      };
    },
    () => normalizeTicker(new URLSearchParams(window.location.search).get("ticker")),
    () => null,
  );

const readableStatus = (value: string): string => {
  const readinessLabel: Record<string, string> = {
    financials_runtime_partial: "Dữ liệu tài chính đang hoàn thiện",
    insufficient_data: "Chưa đủ dữ liệu",
    mixed_source: "Nguồn đang hoàn thiện",
    not_wired: "Chưa có dữ liệu tài chính liên kết",
    partial: "Một phần",
    ready: "Có thể kiểm tra",
    sample_fallback: "Dữ liệu minh họa",
    static_sample: "Dữ liệu tham chiếu",
    unavailable: "Chưa có dữ liệu",
  };

  return readinessLabel[value] ?? value.replaceAll("_", " ");
};

const userFacingWarning = (warning: string): string => {
  const lower = warning.toLowerCase();
  if (lower.includes("fallback")) return "Dữ liệu minh họa không dùng như dữ liệu thật.";
  if (lower.includes("productionapproved") || lower.includes("production-approved")) {
    return "Dữ liệu nghiên cứu, chưa phải dữ liệu chính thức để ra quyết định.";
  }
  if (lower.includes("missing") || lower.includes("unavailable")) {
    return "Dữ liệu thiếu được giữ là Chưa đủ dữ liệu.";
  }
  if (lower.includes("static") || lower.includes("sample")) {
    return "Nguồn dữ liệu đang hoàn thiện; không dùng dữ liệu tham chiếu như dữ liệu thật.";
  }
  return warning;
};

const runtimeSnapshotForRisk = (
  runtimeData: FinancialsRuntimeData | undefined,
  fallbackSnapshot: RiskStatementSnapshot,
): RiskStatementSnapshot | null => {
  if (!runtimeData?.statementSnapshot) return null;
  const runtimeTicker = normalizeTicker(runtimeData.source.ticker);
  const fallbackTicker = normalizeTicker(fallbackSnapshot.ticker);
  if (!runtimeTicker || runtimeTicker !== fallbackTicker) return null;

  return {
    ...fallbackSnapshot,
    ...runtimeData.statementSnapshot,
    ticker: runtimeTicker,
    companyName: fallbackSnapshot.companyName,
    industry: fallbackSnapshot.industry,
    period: runtimeData.statementSnapshot.period ?? String(runtimeData.source.fiscalYear ?? ""),
    sourceName: runtimeData.statementSnapshot.sourceName ?? runtimeData.source.sourceLabel,
    collectedAt: runtimeData.source.asOf,
  };
};

function RiskFinancialsRuntimeNote({
  boundary,
  ticker,
}: {
  boundary: RiskFinancialsRuntimeConsumption;
  ticker?: string | null;
}) {
  const readinessRows = [
    ["Dòng tiền hoạt động", boundary.calculationReadiness.cashFlowQuality],
    ["Lợi nhuận sau thuế", boundary.calculationReadiness.earningsQuality],
    ["Nợ vay", boundary.calculationReadiness.leverageRisk],
    ["Thanh khoản", boundary.calculationReadiness.liquidityRisk],
    ["Tài sản", boundary.calculationReadiness.assetScaledRisk],
    ["Chất lượng dữ liệu", boundary.calculationReadiness.dataQualityRisk],
  ] as const;
  const warnings = Array.from(new Set(boundary.warnings.map(userFacingWarning))).slice(0, 4);

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">Rủi ro dữ liệu còn thiếu</Chip>
            <Chip variant="neutral">{readableStatus(boundary.riskSourceMode)}</Chip>
            <Chip variant="neutral">Dữ liệu nghiên cứu</Chip>
          </div>
          <p className="mt-3 font-semibold">
            Risk tổng hợp trạng thái dữ liệu hiện có{ticker ? ` cho ${ticker}` : ""}. Phần này không đánh giá rủi ro tài chính thật sự.
          </p>
          <p className="mt-1">
            Các đầu vào local/research cần đọc kèm nguồn và kỳ dữ liệu; thiếu trường nào thì nhánh liên quan giữ trạng thái Chưa đủ dữ liệu.
          </p>
          <p className="mt-1">
            Trường đã dùng: {boundary.consumedFields.length ? boundary.consumedFields.join(", ") : "chưa có"}.
          </p>
          <p className="mt-1">
            Trường còn thiếu: {boundary.unavailableFields.length ? boundary.unavailableFields.join(", ") : "không có trường chính đang thiếu"}.
          </p>
          {warnings.length > 0 ? <p className="mt-2">Ghi chú: {warnings.join(" | ")}</p> : null}
        </div>
        <div className="grid min-w-0 gap-3 text-xs lg:min-w-[360px]">
          <dl className="grid gap-2">
            {readinessRows.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{readableStatus(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function RiskPage({ initialFinancialsRuntimeData, onNavigate }: RiskPageProps) {
  const tickerFromUrl = useRiskTickerFromUrl();
  const ticker = tickerFromUrl ?? normalizeTicker(initialFinancialsRuntimeData?.source.ticker) ?? "FPT";
  const fallbackData = riskRedesignDataByTicker[ticker] ?? riskRedesignDataByTicker.FPT;
  const fallbackSnapshot = riskStatementSnapshotsByTicker[ticker] ?? riskStatementSnapshotsByTicker.FPT;
  const runtimeSnapshot = runtimeSnapshotForRisk(initialFinancialsRuntimeData, fallbackSnapshot);
  const data = useMemo(
    () => (runtimeSnapshot ? buildRiskDeskData(fallbackData, runtimeSnapshot) : fallbackData),
    [fallbackData, runtimeSnapshot],
  );
  const runtimeConsumption = buildRiskFinancialsRuntimeConsumption({
    financialsRuntimeData: runtimeSnapshot ? initialFinancialsRuntimeData : null,
    hasStaticRiskPath: false,
  });
  const dataQuality = {
    ...riskDataQuality,
    asOf: runtimeSnapshot ? initialFinancialsRuntimeData?.source.asOf : null,
    isDemoData: false,
    isResearchOnly: true,
    missingFields: [
      ...data.missingDataSummary.missingFinancialFields,
      ...data.missingDataSummary.unavailableValuationMetrics,
      ...data.missingDataSummary.sourceWarnings.filter((warning) => warning.startsWith("Thiếu")),
    ],
    source: runtimeSnapshot
      ? "Dữ liệu nghiên cứu đã rà soát thủ công"
      : "Nguồn đang hoàn thiện",
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...dataQuality} />
      <RiskFinancialsRuntimeNote boundary={runtimeConsumption} ticker={data.ticker} />
      <RiskHeroSummary data={data} />
      <CriticalRiskCards risks={data.topRisks} onNavigate={onNavigate} />
      <ThesisBreakerPanel items={data.thesisBreakers} onNavigate={onNavigate} />
      <RiskSourceMap sources={data.riskSources} onNavigate={onNavigate} />
      <StopConditionPanel
        stopConditions={data.stopConditions}
        timeline={data.riskTimeline}
        reverseRiskNote={data.reverseRiskNote}
      />
      <RiskFinalConclusion
        conclusion={data.finalConclusion}
        actions={data.nextActions}
        onNavigate={onNavigate}
      />
    </div>
  );
}
