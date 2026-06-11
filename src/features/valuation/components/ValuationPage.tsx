import { EmptyState, LoadingState } from "@/components/ui";
import { valuationPageData } from "../data/valuation.data";
import { RiskReadinessPanel } from "./RiskReadinessPanel";
import { ValuationDisclaimer } from "./ValuationDisclaimer";
import { ValuationCommandCenter } from "./ValuationCommandCenter";
import { ValuationGroups } from "./ValuationGroups";
import { ValuationHeader } from "./ValuationHeader";
import { ValuationInputReadiness } from "./ValuationInputReadiness";
import { ValuationMethodConfidence } from "./ValuationMethodConfidence";
import { ValuationNextActions } from "./ValuationNextActions";
import { ValuationThesisNote } from "./ValuationThesisNote";
import { ValuationTrapRadar } from "./ValuationTrapRadar";

export function ValuationPage() {
  const data = valuationPageData;

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

  const canContinueToRisk = data.riskReadiness.completed === data.riskReadiness.total;

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-7">
      <ValuationHeader
        canContinueToRisk={canContinueToRisk}
        data={data.header}
        riskDisabledReason={data.riskReadiness.helperText}
      />
      <ValuationCommandCenter data={data.commandCenter} />
      <ValuationInputReadiness data={data.inputReadiness} />
      <ValuationMethodConfidence data={data.methodConfidence} />
      <ValuationGroups groups={data.groups} />
      <ValuationTrapRadar data={data.trapRadar} />
      <RiskReadinessPanel data={data.riskReadiness} />
      <ValuationThesisNote data={data.thesisNote} />
      <ValuationDisclaimer data={data.disclaimer} />
      <ValuationNextActions canContinueToRisk={canContinueToRisk} data={data.nextActions} />
    </div>
  );
}
