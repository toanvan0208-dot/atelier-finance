import { EmptyState, LoadingState } from "@/components/ui";
import { technicalPageData } from "../data/technical.data";
import { PersonalPVTObservation } from "./PersonalPVTObservation";
import { PVTCommandCenter } from "./PVTCommandCenter";
import { PVTCrossModuleAlignment } from "./PVTCrossModuleAlignment";
import { PVTReadinessPanel } from "./PVTReadinessPanel";
import { TechnicalDisclaimer, TechnicalNextActions } from "./TechnicalFooterBlocks";
import { TechnicalHeader } from "./TechnicalHeader";

export function TechnicalPage() {
  const data = technicalPageData;

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

  const canContinueToRisk = data.pvtReadiness.completed === data.pvtReadiness.total;

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6">
      <TechnicalHeader
        canContinueToRisk={canContinueToRisk}
        data={data.header}
        riskDisabledReason={data.pvtReadiness.helperText}
      />
      <PVTCommandCenter data={data.commandCenter} priceVolume={data.priceVolume} />
      <PVTCrossModuleAlignment data={data.pvtAlignment} />
      <PVTReadinessPanel data={data.pvtReadiness} />
      <PersonalPVTObservation data={data.pvtObservation} />

      <div className="space-y-5">
        <TechnicalDisclaimer data={data.disclaimer} />
        <TechnicalNextActions canContinueToRisk={canContinueToRisk} data={data.nextActions} />
      </div>
    </div>
  );
}
