import { LoadingState } from "@/components/ui";
import { screeningPageData } from "../data/screening.data";
import { BeginnerScreeningSummary } from "./BeginnerScreeningSummary";
import { ScreeningComparisonTable } from "./ScreeningComparisonTable";
import { ScreeningContextSummary } from "./ScreeningContextSummary";
import { ScreeningDeepDive } from "./ScreeningDeepDive";
import { ScreeningDisclaimer } from "./ScreeningDisclaimer";
import { ScreeningInputPanel } from "./ScreeningInputPanel";
import { ScreeningNextActions } from "./ScreeningNextActions";
import { ScreeningResultGroups } from "./ScreeningResultGroups";
import { UnderstandingCheck } from "./UnderstandingCheck";

export function ScreeningPage() {
  const data = screeningPageData;

  if (data.isLoading) {
    return (
      <LoadingState
        description={data.loading.description}
        title={data.loading.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-7">
      <div>
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
          <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
            {data.hero.icon}
          </span>
          <span>{data.hero.eyebrow}</span>
        </div>
        <h1 className="font-brand text-2xl font-bold text-ink">
          {data.hero.title}
        </h1>
        <p className="mt-2 max-w-[68ch] text-sm leading-7 text-muted">
          {data.hero.description}
        </p>
      </div>

      <ScreeningInputPanel data={data.input} />
      <ScreeningContextSummary data={data.context} />
      <BeginnerScreeningSummary data={data.beginner} />
      <ScreeningResultGroups
        emptyState={data.emptyState}
        groups={data.resultGroups}
        labels={data.resultGroupLabels}
        stockCardLabels={data.stockCardLabels}
      />
      <ScreeningDeepDive
        data={data.deepDive}
        stepLabels={data.funnelStepLabels}
      />
      <ScreeningComparisonTable data={data.comparison} />
      <ScreeningDisclaimer data={data.disclaimer} />
      <UnderstandingCheck data={data.understanding} />
      <ScreeningNextActions data={data.nextActions} />
    </div>
  );
}
