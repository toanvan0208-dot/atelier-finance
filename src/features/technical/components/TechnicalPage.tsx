import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { pvtDataQuality, pvtObservationData } from "../data/pvtObservation.data";
import { PVTConfirmationScenarios } from "./PVTConfirmationScenarios";
import { PVTFinalConclusion } from "./PVTFinalConclusion";
import { PVTFomoThermometer } from "./PVTFomoThermometer";
import { PVTHeroStatus } from "./PVTHeroStatus";
import { PVTMainChart } from "./PVTMainChart";
import { PVTRiskRewardZone } from "./PVTRiskRewardZone";
import { PVTSignalLayers } from "./PVTSignalLayers";

type TechnicalPageProps = {
  onNavigate: (key: string) => void;
};

export function TechnicalPage({ onNavigate }: TechnicalPageProps) {
  const data = pvtObservationData;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...pvtDataQuality} />
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
