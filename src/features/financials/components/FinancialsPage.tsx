import { EmptyState, LoadingState } from "@/components/ui";
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
import { FinancialsProgressSidebar } from "./FinancialsProgressSidebar";
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

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <FinancialsProgressSidebar data={data.progress} />

        <div className="space-y-5">
          <FinancialSnapshotBlock data={data.snapshot} />
          <IncomeStatementBlock data={data.incomeStatement} />
          <BalanceSheetBlock data={data.balanceSheet} />
          <CashFlowBlock data={data.cashFlow} />
          <ProfitToCashBlock data={data.profitToCash} />
          <EarningsQualityBlock data={data.earningsQuality} />
          <DebtStructureBlock data={data.debtStructure} />
          <WorkingCapitalBlock data={data.workingCapital} />
          <CapitalAllocationFinancialsBlock data={data.capitalAllocation} />
          <FinancialRatioGroups data={data.ratios} />
          <IndustrySpecificFinancialsBlock data={data.industrySpecific} />
          <FinancialWarningSigns data={data.warningSigns} />
          <ValuationBridgeBlock data={data.valuationBridge} />
          <PersonalFinancialsThesis data={data.personalThesis} />
          <FinancialsUnderstandingChecklist data={data.checklist} />
          <FinancialsDisclaimer data={data.disclaimer} />
          <FinancialsNextActions data={data.nextActions} />
        </div>
      </div>
    </div>
  );
}
