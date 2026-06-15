import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { riskDataQuality, riskRedesignData } from "../data/riskRedesign.data";
import { CriticalRiskCards } from "./CriticalRiskCards";
import { RiskFinalConclusion } from "./RiskFinalConclusion";
import { RiskHeroSummary } from "./RiskHeroSummary";
import { RiskSourceMap } from "./RiskSourceMap";
import { StopConditionPanel } from "./StopConditionPanel";
import { ThesisBreakerPanel } from "./ThesisBreakerPanel";

type RiskPageProps = {
  onNavigate: (key: string) => void;
};

export function RiskPage({ onNavigate }: RiskPageProps) {
  const data = riskRedesignData;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...riskDataQuality} />
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
