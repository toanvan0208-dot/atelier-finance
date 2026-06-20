import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { pvtDataQuality, pvtObservationData } from "../data/pvtObservation.data";
import type { PVTObservationData } from "../types";
import { PVTConfirmationScenarios } from "./PVTConfirmationScenarios";
import { PVTFinalConclusion } from "./PVTFinalConclusion";
import { PVTFomoThermometer } from "./PVTFomoThermometer";
import { PVTHeroStatus } from "./PVTHeroStatus";
import { PVTMainChart } from "./PVTMainChart";
import { PVTRiskRewardZone } from "./PVTRiskRewardZone";
import { PVTSignalLayers } from "./PVTSignalLayers";

export type TechnicalPageRuntimeData = {
  data: PVTObservationData | null;
  dataQuality: typeof pvtDataQuality;
  source?: {
    sourceType: "local_db_manual_import" | "sample_static_fallback";
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
  };
  fallbackUsed?: boolean;
  warnings?: string[];
};

type TechnicalPageProps = {
  initialRuntimeData?: TechnicalPageRuntimeData;
  onNavigate: (key: string) => void;
};

export function TechnicalPage({ initialRuntimeData, onNavigate }: TechnicalPageProps) {
  const data = initialRuntimeData?.data ?? pvtObservationData;
  const dataQuality = initialRuntimeData?.dataQuality ?? pvtDataQuality;
  const source = initialRuntimeData?.source ?? {
    sourceType: "sample_static_fallback",
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
  };
  const fallbackUsed = initialRuntimeData?.fallbackUsed ?? true;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...dataQuality} />
      <SourceTransparencyStrip
        dataMode={source.dataMode}
        fallbackUsed={fallbackUsed}
        productionApproved={source.productionApproved}
        sourceLabel={source.sourceLabel}
        sourceType={source.sourceType}
      />
      <PVTHeroStatus data={data} />
      <PVTMainChart
        data={data.chart}
        supportLabel={data.keyLevels.support}
        resistanceLabel={data.keyLevels.resistance}
      />
      <PVTSignalLayers layers={data.signalLayers} />
      <PVTConfirmationScenarios
        confirmation={data.confirmation}
        invalidation={data.invalidation}
        scenarios={data.scenarios}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <PVTRiskRewardZone data={data.riskReward} />
        <PVTFomoThermometer data={data.fomo} />
      </div>
      <PVTFinalConclusion
        conclusion={data.finalConclusion}
        actions={data.nextActions}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function SourceTransparencyStrip({
  dataMode,
  fallbackUsed,
  productionApproved,
  sourceLabel,
  sourceType,
}: {
  dataMode: string;
  fallbackUsed: boolean;
  productionApproved: false;
  sourceLabel: string;
  sourceType: "local_db_manual_import" | "sample_static_fallback";
}) {
  const sourceText =
    sourceType === "local_db_manual_import"
      ? `Local DB manual import · ${sourceLabel} · ${dataMode}`
      : `Sample/static fallback · ${dataMode}`;

  return (
    <section
      aria-label="Technical/PVT source transparency"
      className="rounded-[4px] border border-ink/10 bg-surface px-4 py-3 text-xs leading-5 text-muted"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="font-semibold text-ink">
          Source transparency: {sourceText}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            productionApproved:{String(productionApproved)}
          </span>
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            {fallbackUsed ? "sampleFallback" : "researchOnly"}
          </span>
        </div>
      </div>
    </section>
  );
}
