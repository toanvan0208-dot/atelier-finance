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

const boundaryValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "unavailable";
  return String(value);
};

function RiskFinancialsRuntimeNote({ boundary }: { boundary: RiskFinancialsRuntimeConsumption }) {
  const fields = [
    ["riskSourceMode", boundary.riskSourceMode],
    ["runtimeStatus", boundary.runtimeStatus],
    ["readPath", boundary.readPath],
    ["sourceLabel", boundary.sourceLabel],
    ["dataMode", boundary.dataMode],
    ["fallbackUsed", boundary.fallbackUsed],
    ["productionApproved", boundary.productionApproved],
    ["canClaimRiskDbBacked", boundary.canClaimRiskDbBacked],
  ] as const;
  const readinessRows = [
    ["cashFlowQuality", boundary.calculationReadiness.cashFlowQuality],
    ["earningsQuality", boundary.calculationReadiness.earningsQuality],
    ["leverageRisk", boundary.calculationReadiness.leverageRisk],
    ["liquidityRisk", boundary.calculationReadiness.liquidityRisk],
    ["assetScaledRisk", boundary.calculationReadiness.assetScaledRisk],
    ["dataQualityRisk", boundary.calculationReadiness.dataQualityRisk],
  ] as const;

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">risk runtime boundary</Chip>
            <Chip variant="neutral">{boundary.riskSourceMode}</Chip>
            <Chip variant="neutral">productionApproved:false</Chip>
            <Chip variant="neutral">controlled partial</Chip>
          </div>
          <p className="mt-3 font-semibold">
            Risk uses a mixed source state: static/sample display cards plus controlled Financials runtime metadata when available.
          </p>
          <p className="mt-1">
            Local Financials runtime data is research-only. Missing CFO, earnings, debt, equity, assets, or liquidity inputs keep dependent checks unavailable or not_applicable.
          </p>
          <p className="mt-1">
            Consumed fields: {boundary.consumedFields.length ? boundary.consumedFields.join(", ") : "none"}.
          </p>
          <p className="mt-1">
            Unavailable fields: {boundary.unavailableFields.length ? boundary.unavailableFields.join(", ") : "none"}.
          </p>
          {boundary.warnings.length > 0 ? (
            <p className="mt-2">Boundary warnings: {boundary.warnings.slice(0, 4).join(" | ")}</p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-3 text-xs lg:min-w-[360px]">
          <dl className="grid gap-2">
            {fields.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{boundaryValue(value)}</dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-2 border-t border-[#E8CC82] pt-3">
            {readinessRows.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{boundaryValue(value)}</dd>
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

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...riskDataQuality} />
      <RiskFinancialsRuntimeNote boundary={runtimeConsumption} />
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
