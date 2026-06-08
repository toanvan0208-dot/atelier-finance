import { LoadingState } from "@/components/ui";
import { screeningPageData } from "../data/screening.data";
import { BeginnerScreeningSummary } from "./BeginnerScreeningSummary";
import { ScreeningComparisonTable } from "./ScreeningComparisonTable";
import { ScreeningContextSummary } from "./ScreeningContextSummary";
import { ScreeningDeepDive } from "./ScreeningDeepDive";
import { ScreeningDisclaimer } from "./ScreeningDisclaimer";
import { ScreeningInputPanel } from "./ScreeningInputPanel";
import { ScreeningFunnel } from "./ScreeningFunnel";
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
    <div className="mx-auto w-full max-w-[1040px] space-y-8">
      <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
          <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
            {data.hero.icon}
          </span>
          <span>{data.hero.eyebrow}</span>
        </div>
        <h1 className="font-brand text-2xl font-bold leading-tight text-ink">
          {data.hero.title}
        </h1>
        <p className="mt-2 max-w-[68ch] text-sm leading-7 text-muted">
          {data.hero.description}
        </p>
        <p className="mt-3 inline-flex rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
          {data.hero.warningNote}
        </p>
      </section>

      <ScreeningInputPanel data={data.input} />
      <ScreeningContextSummary data={data.context} />
      <ScreeningFunnel
        description={data.funnel.description}
        layers={data.funnel.layers}
        title={data.funnel.title}
      />
      <BeginnerScreeningSummary data={data.beginner} />
      <ScreeningResultGroups
        emptyState={data.emptyState}
        groups={data.resultGroups}
        labels={data.resultGroupLabels}
        stockCardLabels={data.stockCardLabels}
      />
      <ScreeningComparisonTable data={data.comparison} />
      <ScreeningDeepDive data={data.deepDive} />
      <UnderstandingCheck data={data.understanding} />
      <ScreeningNextActions data={data.nextActions} />
      <ScreeningDisclaimer data={data.disclaimer} />
    </div>
  );
}
