import { EmptyState, LoadingState, StepAccordion } from "@/components/ui";
import { financialsPageData } from "../data/financials.data";
import { BalanceSheetBlock } from "./BalanceSheetBlock";
import { CapitalAllocationFinancialsBlock } from "./CapitalAllocationFinancialsBlock";
import { CashFlowBlock } from "./CashFlowBlock";
import { DebtStructureBlock } from "./DebtStructureBlock";
import { EarningsQualityBlock } from "./EarningsQualityBlock";
import { FinancialRatioGroups } from "./FinancialRatioGroups";
import { FinancialSnapshotBlock } from "./FinancialSnapshotBlock";
import { FinancialWarningSigns } from "./FinancialWarningSigns";
import { FinancialsDisclaimer } from "./FinancialsDisclaimer";
import { FinancialsHeader } from "./FinancialsHeader";
import { FinancialsNextActions } from "./FinancialsNextActions";
import { FinancialsQuickSummary } from "./FinancialsQuickSummary";
import { FinancialsUnderstandingChecklist } from "./FinancialsUnderstandingChecklist";
import { IncomeStatementBlock } from "./IncomeStatementBlock";
import { IndustrySpecificFinancialsBlock } from "./IndustrySpecificFinancialsBlock";
import { PersonalFinancialsThesis } from "./PersonalFinancialsThesis";
import { ProfitToCashBlock } from "./ProfitToCashBlock";
import { ValuationBridgeBlock } from "./ValuationBridgeBlock";
import { WorkingCapitalBlock } from "./WorkingCapitalBlock";

export function FinancialsPage() {
  const data = financialsPageData;
  const steps = data.progress.steps;

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

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6">
      <FinancialsHeader data={data.header} />
      <FinancialsQuickSummary data={data.quickSummary} />

      <StepAccordion
        title={data.progress.title}
        description={data.progress.description}
        items={[
          { key: "snapshot", order: steps[0].order, title: steps[0].title, status: steps[0].status, content: <FinancialSnapshotBlock data={data.snapshot} /> },
          { key: "income", order: steps[1].order, title: steps[1].title, status: steps[1].status, content: <IncomeStatementBlock data={data.incomeStatement} /> },
          { key: "balance", order: steps[2].order, title: steps[2].title, status: steps[2].status, content: <BalanceSheetBlock data={data.balanceSheet} /> },
          { key: "cashflow", order: steps[3].order, title: steps[3].title, status: steps[3].status, content: <CashFlowBlock data={data.cashFlow} /> },
          { key: "profit-cash", order: steps[4].order, title: steps[4].title, status: steps[4].status, content: <ProfitToCashBlock data={data.profitToCash} /> },
          { key: "earnings-quality", order: steps[5].order, title: steps[5].title, status: steps[5].status, content: <EarningsQualityBlock data={data.earningsQuality} /> },
          { key: "debt", order: steps[6].order, title: steps[6].title, status: steps[6].status, content: <DebtStructureBlock data={data.debtStructure} /> },
          { key: "working-capital", order: steps[7].order, title: steps[7].title, status: steps[7].status, content: <WorkingCapitalBlock data={data.workingCapital} /> },
          { key: "capital-allocation", order: steps[8].order, title: steps[8].title, status: steps[8].status, content: <CapitalAllocationFinancialsBlock data={data.capitalAllocation} /> },
          { key: "ratios", order: steps[9].order, title: steps[9].title, status: steps[9].status, content: <FinancialRatioGroups data={data.ratios} /> },
          { key: "industry-specific", order: steps[10].order, title: steps[10].title, status: steps[10].status, content: <IndustrySpecificFinancialsBlock data={data.industrySpecific} /> },
          { key: "warning", order: steps[11].order, title: steps[11].title, status: steps[11].status, content: <FinancialWarningSigns data={data.warningSigns} /> },
          { key: "valuation-bridge", order: steps[12].order, title: steps[12].title, status: steps[12].status, content: <ValuationBridgeBlock data={data.valuationBridge} /> },
          { key: "personal", order: steps[13].order, title: steps[13].title, status: steps[13].status, content: <PersonalFinancialsThesis data={data.personalThesis} /> },
          { key: "checklist", order: steps[14].order, title: steps[14].title, status: steps[14].status, content: <FinancialsUnderstandingChecklist data={data.checklist} /> },
        ]}
      />

      <div className="space-y-5">
        <FinancialsDisclaimer data={data.disclaimer} />
        <FinancialsNextActions data={data.nextActions} />
      </div>
    </div>
  );
}
