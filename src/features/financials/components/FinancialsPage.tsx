import { EmptyState, LoadingState } from "@/components/ui";
import { financialsPageData } from "../data/financials.data";
import { BalanceSheetBlock } from "./BalanceSheetBlock";
import { BusinessHypothesisVerification } from "./BusinessHypothesisVerification";
import { CapitalAllocationFinancialsBlock } from "./CapitalAllocationFinancialsBlock";
import { CashFlowBlock } from "./CashFlowBlock";
import { DebtStructureBlock } from "./DebtStructureBlock";
import { EarningsQualityBlock } from "./EarningsQualityBlock";
import { FinancialAnalysisJourney, type FinancialJourneyGroup } from "./FinancialAnalysisJourney";
import { FinancialConclusionCheckpoint } from "./FinancialConclusionCheckpoint";
import { FinancialHealthCommandCenter } from "./FinancialHealthCommandCenter";
import { FinancialRatioGroups } from "./FinancialRatioGroups";
import { FinancialSnapshotBlock } from "./FinancialSnapshotBlock";
import { FinancialStatementMap } from "./FinancialStatementMap";
import { FinancialWarningSigns } from "./FinancialWarningSigns";
import { FinancialsDisclaimer } from "./FinancialsDisclaimer";
import { FinancialsHeader } from "./FinancialsHeader";
import { FinancialsUnderstandingChecklist } from "./FinancialsUnderstandingChecklist";
import { IncomeStatementBlock } from "./IncomeStatementBlock";
import { IndustrySpecificFinancialsBlock } from "./IndustrySpecificFinancialsBlock";
import { PersonalFinancialsThesis } from "./PersonalFinancialsThesis";
import { ProfitToCashBlock } from "./ProfitToCashBlock";
import { ValuationBridgeBlock } from "./ValuationBridgeBlock";
import { ValuationReadinessPanel } from "./ValuationReadinessPanel";
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

  const journeyGroups: FinancialJourneyGroup[] = [
    {
      id: "quick-health",
      order: 1,
      title: "Nhìn nhanh sức khỏe tài chính",
      description: "Bắt đầu từ snapshot, chỉ số lõi và cảnh báo nhanh trước khi đọc sâu.",
      status: "Đã kiểm tra",
      includedBlocks: ["Snapshot", "Chỉ số lõi", "Cảnh báo nhanh"],
      content: (
        <div id="snapshot" className="scroll-mt-6">
          <FinancialSnapshotBlock data={data.snapshot} />
        </div>
      ),
    },
    {
      id: "three-statements",
      order: 2,
      title: "Đọc 3 báo cáo chính",
      description: "Đọc KQKD, bảng cân đối và lưu chuyển tiền tệ như một dòng chảy.",
      status: "Đang đọc",
      includedBlocks: ["KQKD", "Cân đối", "Dòng tiền"],
      content: (
        <>
          <div id="income" className="scroll-mt-6">
            <IncomeStatementBlock data={data.incomeStatement} />
          </div>
          <div id="balance" className="scroll-mt-6">
            <BalanceSheetBlock data={data.balanceSheet} />
          </div>
          <div id="cashflow" className="scroll-mt-6">
            <CashFlowBlock data={data.cashFlow} />
          </div>
        </>
      ),
    },
    {
      id: "quality-cash",
      order: 3,
      title: "Kiểm tra chất lượng lợi nhuận và dòng tiền",
      description: "So lợi nhuận kế toán với tiền thật và tách khoản bất thường.",
      status: "Cần xem lại",
      includedBlocks: ["LNST vs CFO", "Chất lượng lợi nhuận"],
      content: (
        <>
          <div id="profit-cash" className="scroll-mt-6">
            <ProfitToCashBlock data={data.profitToCash} />
          </div>
          <div id="earnings-quality" className="scroll-mt-6">
            <EarningsQualityBlock data={data.earningsQuality} />
          </div>
        </>
      ),
    },
    {
      id: "financial-risk",
      order: 4,
      title: "Kiểm tra rủi ro tài chính",
      description: "Tập trung vào nợ vay, vốn lưu động, tồn kho, khoản phải thu và cảnh báo.",
      status: "Cần xem lại",
      includedBlocks: ["Nợ vay", "Vốn lưu động", "Cảnh báo"],
      content: (
        <>
          <div id="debt" className="scroll-mt-6">
            <DebtStructureBlock data={data.debtStructure} />
          </div>
          <div id="working-capital" className="scroll-mt-6">
            <WorkingCapitalBlock data={data.workingCapital} />
          </div>
          <div id="warning" className="scroll-mt-6">
            <FinancialWarningSigns data={data.warningSigns} />
          </div>
        </>
      ),
    },
    {
      id: "valuation-bridge",
      order: 5,
      title: "Kết luận BCTC và nối sang định giá",
      description: "Đọc phân bổ vốn, nhóm chỉ số, đặc thù ngành và cầu nối sang định giá.",
      status: "Chưa đọc",
      includedBlocks: ["Phân bổ vốn", "Chỉ số", "Đặc thù ngành", "Cầu nối"],
      content: (
        <>
          <div id="capital-allocation" className="scroll-mt-6">
            <CapitalAllocationFinancialsBlock data={data.capitalAllocation} />
          </div>
          <div id="ratios" className="scroll-mt-6">
            <FinancialRatioGroups data={data.ratios} />
          </div>
          <div id="industry-specific" className="scroll-mt-6">
            <IndustrySpecificFinancialsBlock data={data.industrySpecific} />
          </div>
          <div id="valuation-bridge" className="scroll-mt-6">
            <ValuationBridgeBlock data={data.valuationBridge} />
          </div>
        </>
      ),
    },
  ];
  const canContinueToValuation = data.valuationReadiness.completed === data.valuationReadiness.total;

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6">
      <FinancialsHeader
        canContinueToValuation={canContinueToValuation}
        data={data.header}
        valuationDisabledReason={data.valuationReadiness.helperText}
      />
      <FinancialHealthCommandCenter data={data.healthCommandCenter} />
      <BusinessHypothesisVerification data={data.businessHypothesisVerification} />
      <FinancialStatementMap data={data.statementMap} />
      <FinancialAnalysisJourney
        title="Lộ trình đọc BCTC theo 5 cụm"
        description="Các block phân tích cũ vẫn được giữ, nhưng chỉ mở cụm đang cần đọc."
        groups={journeyGroups}
      />
      <FinancialConclusionCheckpoint data={data.conclusionCheckpoint} />
      <ValuationReadinessPanel data={data.valuationReadiness} />
      <div id="personal" className="scroll-mt-6">
        <PersonalFinancialsThesis data={data.personalThesis} />
      </div>
      <div id="checklist" className="scroll-mt-6">
        <FinancialsUnderstandingChecklist data={data.checklist} />
      </div>
      <FinancialsDisclaimer data={data.disclaimer} />
    </div>
  );
}
