import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { Chip } from "@/components/ui";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { riskDataQuality, riskRedesignData } from "../data/riskRedesign.data";
import {
  buildRiskFinancialsRuntimeConsumption,
  type RiskFinancialsRuntimeConsumption,
} from "../lib/risk-financials-runtime-consumption";
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

const readinessLabel: Record<string, string> = {
  insufficient_data: "Chưa đủ dữ liệu",
  mixed_source: "Nguồn hỗn hợp, cần kiểm tra",
  partial: "Một phần",
  ready: "Có thể kiểm tra",
  unavailable: "Chưa có dữ liệu",
};

const readableStatus = (value: string): string => readinessLabel[value] ?? value.replaceAll("_", " ");

function RiskFinancialsRuntimeNote({ boundary, ticker }: { boundary: RiskFinancialsRuntimeConsumption; ticker?: string | null }) {
  const readinessRows = [
    ["Chất lượng dòng tiền", boundary.calculationReadiness.cashFlowQuality],
    ["Chất lượng lợi nhuận", boundary.calculationReadiness.earningsQuality],
    ["Đòn bẩy", boundary.calculationReadiness.leverageRisk],
    ["Thanh khoản", boundary.calculationReadiness.liquidityRisk],
    ["Quy mô tài sản", boundary.calculationReadiness.assetScaledRisk],
    ["Chất lượng dữ liệu", boundary.calculationReadiness.dataQualityRisk],
  ] as const;

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">Kiểm tra rủi ro</Chip>
            <Chip variant="neutral">{readableStatus(boundary.riskSourceMode)}</Chip>
            <Chip variant="neutral">Dữ liệu nghiên cứu</Chip>
            <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
          </div>
          <p className="mt-3 font-semibold">
            Risk dùng dữ liệu tài chính hiện có{ticker ? ` cho ${ticker}` : ""} để kiểm tra từng nhánh. Nợ vay đã có dữ liệu thì nhánh đòn bẩy có thể được kiểm tra.
          </p>
          <p className="mt-1">
            Các đầu vào local/research vẫn cần đọc kèm nguồn và kỳ dữ liệu; thiếu trường nào thì nhánh liên quan vẫn giữ trạng thái chưa đủ dữ liệu.
          </p>
          <p className="mt-1">
            Trường đã dùng: {boundary.consumedFields.length ? boundary.consumedFields.join(", ") : "chưa có"}.
          </p>
          <p className="mt-1">
            Trường còn thiếu: {boundary.unavailableFields.length ? boundary.unavailableFields.join(", ") : "không có trường chính đang thiếu"}.
          </p>
          {boundary.warnings.length > 0 ? (
            <p className="mt-2">Ghi chú: {boundary.warnings.slice(0, 4).join(" | ")}</p>
          ) : null}
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
  const data = riskRedesignData;
  const runtimeConsumption = buildRiskFinancialsRuntimeConsumption({
    financialsRuntimeData: initialFinancialsRuntimeData,
  });
  const dataQuality = initialFinancialsRuntimeData
    ? {
        ...riskDataQuality,
        asOf: initialFinancialsRuntimeData.source.asOf,
        isDemoData: false,
        isResearchOnly: true,
        missingFields: runtimeConsumption.unavailableFields,
        source: "Bản ghi đã rà soát, dùng cho nghiên cứu",
      }
    : riskDataQuality;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...dataQuality} />
      <RiskFinancialsRuntimeNote boundary={runtimeConsumption} ticker={initialFinancialsRuntimeData?.source.ticker} />
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
