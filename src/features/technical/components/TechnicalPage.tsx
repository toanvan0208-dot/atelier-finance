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
};

type TechnicalPageProps = {
  initialRuntimeData?: TechnicalPageRuntimeData;
  onNavigate: (key: string) => void;
};

export function TechnicalPage({ initialRuntimeData, onNavigate }: TechnicalPageProps) {
  const data = initialRuntimeData?.data ?? pvtObservationData;
  const dataQuality = initialRuntimeData?.dataQuality ?? pvtDataQuality;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...dataQuality} />
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
