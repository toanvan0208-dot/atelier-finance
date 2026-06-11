import { EmptyState, LoadingState } from "@/components/ui";
import { riskPageData } from "../data/risk.data";
import {
  ChecklistReadinessPanel,
  RiskAnalysisJourney,
  RiskCaseFile,
  RiskControlRoom,
  RiskDisclaimer,
  RiskEvidenceMap,
  RiskHeader,
  TransparencyGovernancePanel,
} from "./RiskUi";

export function RiskPage() {
  const data = riskPageData;

  if (data.isLoading) {
    return <LoadingState description={data.loading.content} title={data.loading.title} />;
  }

  if (!data.header.ticker) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  const canContinueToChecklist = data.checklistReadiness.completed >= data.checklistReadiness.total;

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6">
      <RiskHeader
        canContinueToChecklist={canContinueToChecklist}
        checklistDisabledReason={data.checklistReadiness.disabledCtaLabel}
        data={data.header}
      />
      <RiskControlRoom data={data.controlRoom} />
      <RiskEvidenceMap data={data.evidenceMap} />
      <RiskAnalysisJourney
        clusters={data.analysisClusters}
        detailLabels={data.detailLabels}
        riskGroups={data.riskGroups}
      />
      <TransparencyGovernancePanel data={data.transparencyGovernance} />
      <RiskCaseFile data={data.caseFile} />
      <ChecklistReadinessPanel data={data.checklistReadiness} />
      <RiskDisclaimer data={data.disclaimer} />
    </div>
  );
}
