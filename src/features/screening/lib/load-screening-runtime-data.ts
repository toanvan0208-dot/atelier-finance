import { loadFinancialsRuntimeData } from "@/features/financials/lib/load-financials-runtime-data";
import { financialsUnitsForValuation } from "@/features/financials/lib/financials-unit-metadata-contract";
import { buildControlledValuationIntegrationBoundary } from "@/features/valuation/lib/controlled-valuation-integration-boundary";
import { prisma } from "@/lib/database/client";
import { loadLatestMacroObservations, type MacroObservationResult } from "@/features/macro/lib/macro-observation-read-path";
import type { RedesignedScreeningCandidate } from "../data/screeningRedesign.data";
import type { ScreeningDataMode, ScreeningReadinessCheck } from "../types";
import { loadScreeningCandidatePayload, type ScreeningCandidatePayload } from "./screening-candidate-read-path";

export type ScreeningRuntimeData = {
  candidates: RedesignedScreeningCandidate[];
  screeningCandidates: ScreeningCandidatePayload[];
  screeningCandidatesStatus?: {
    status: "ready" | "empty" | "error";
    count: number;
    fallbackUsed: boolean;
    message: string;
    error?: string;
  };
  macroContext?: MacroObservationResult;
};

export type LoadScreeningRuntimeDataOptions = {
  preferDb?: boolean;
  allowFinancialsFallback?: boolean;
};

const NO_ZERO_FILL_WARNING =
  "Chưa đủ dữ liệu để kết luận. Hệ thống không tự điền 0 hoặc suy đoán dữ liệu thiếu.";
const SOURCE_WARNING =
  "Dữ liệu hiện tại là dữ liệu nghiên cứu hoặc đã rà soát thủ công, chưa phải dữ liệu chính thức để ra quyết định.";

function buildExcludedCandidate(ticker: string): RedesignedScreeningCandidate {
  return {
    ticker,
    companyName: "N/A",
    exchange: "N/A",
    sector: "N/A",
    industry: "Ngân hàng",
    relatedIndustryKey: "banking",
    dataStatus: "missing",
    dataMode: "research_only",
    productionApproved: false,
    availableFields: [],
    missingFields: ["Dữ liệu ngân hàng chưa được hỗ trợ trên hệ thống."],
    readinessChecks: [],
    canContinueAnalysis: false,
    canCalculatePE: false,
    canCalculatePB: false,
    canAssessDebt: false,
    canAssessRisk: false,
    canCalculateShareMetrics: false,
    warnings: [SOURCE_WARNING, NO_ZERO_FILL_WARNING],
    explanationForBeginner:
      "Cổ phiếu ngân hàng có mô hình kinh doanh và chuẩn mực kế toán riêng biệt, không thể dùng bảng lọc hiện tại để đánh giá.",
    whatToCheckNext: [],
    readinessLabel: "Không được hỗ trợ",
    readinessScoreLabel: "Mức đủ dữ liệu",
    readinessScore: 0,
    sourceStatus: "excluded_bank",
    sourceAsOf: null,
    group: "not-fit",
    groupLabel: "Chưa đủ dữ liệu",
    fitLabel: "Không áp dụng",
    reason: "Cổ phiếu thuộc nhóm ngành ngân hàng chưa được hỗ trợ phân tích.",
    checkFlags: ["Thiếu dữ liệu ngân hàng"],
    nextStep: "Quay lại danh sách theo dõi.",
    metrics: {
      "P/E": "Chưa thể tính",
      "P/B": "Chưa thể tính",
      "Nợ vay": "Chưa thể tính",
      "Rủi ro": "Chưa thể tính",
      "Nguồn": "N/A",
    },
  };
}

export const loadScreeningRuntimeData = async (
  options: LoadScreeningRuntimeDataOptions = {},
): Promise<ScreeningRuntimeData> => {
  const approvedTickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];
  const companies = await prisma.company.findMany({
    where: { ticker: { in: approvedTickers }, dataMode: "research_only" },
    include: { businessProfiles: true },
  });

  const candidates: RedesignedScreeningCandidate[] = [];

  for (const ticker of approvedTickers) {
    if (ticker === "VCB") {
      candidates.push(buildExcludedCandidate(ticker));
      continue;
    }

    const company = companies.find((c) => c.ticker === ticker);
    const hasCompanyInfo = !!company;
    const businessProfile = company?.businessProfiles?.[0];
    const industry = company?.industryName ?? "N/A";
    const sector = company?.industryName ?? "N/A";

    let financialsData;
    let financialsReadError: string | null = null;
    try {
      financialsData = await loadFinancialsRuntimeData({
        ticker,
        preferDb: options.preferDb,
        allowFallback: options.allowFinancialsFallback,
      });
    } catch (error) {
      financialsData = null;
      financialsReadError = error instanceof Error ? error.message : "Unknown financials runtime read error.";
    }

    const record = financialsData?.statementSnapshot;
    const hasFinancials = !!record && !financialsData?.source.fallbackUsed;
    const hasEps = hasFinancials && record.eps != null;
    const hasDebt = hasFinancials && record.totalDebt != null;
    const hasShares = hasFinancials && record.sharesOutstanding != null;
    const marketPrice =
      typeof record?.closePrice === "number" && Number.isFinite(record.closePrice) ? record.closePrice : null;
    const hasMarketPrice = hasFinancials && marketPrice !== null;

    let canCalculatePE = false;
    let canCalculatePB = false;

    if (financialsData) {
      const units = financialsData.unitMetadata
        ? financialsUnitsForValuation(financialsData.unitMetadata)
        : financialsUnitsForValuation(null);

      const valuationBoundary = buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          asOf: financialsData.source.asOf,
          dataMode: financialsData.source.dataMode,
          equity: record?.totalEquity,
          eps: record?.eps,
          fallbackUsed: financialsData.source.fallbackUsed,
          fiscalYear: financialsData.source.fiscalYear,
          period: record?.period ?? "2025",
          periodType: financialsData.source.periodType ?? record?.periodType ?? null,
          productionApproved: false,
          readPath: financialsData.source.readPath,
          revenue: record?.revenue,
          runtimeStatus: financialsData.runtimeStatus,
          sharesOutstanding: record?.sharesOutstanding,
          sourceLabel: financialsData.source.sourceLabel,
          units,
        },
        persistedValuationInputs: {
          marketPrice,
          units: { marketPrice: "vnd_per_share" },
        },
      });
      canCalculatePE = valuationBoundary.calculation.metrics.pe.status === "ready";
      canCalculatePB = valuationBoundary.calculation.metrics.pb.status === "ready";
    }

    const availableFields: string[] = [];
    const missingFields: string[] = [];

    if (hasCompanyInfo) availableFields.push("Thông tin doanh nghiệp");
    else missingFields.push("Thông tin doanh nghiệp");
    if (businessProfile) availableFields.push("Ngành liên quan");
    else missingFields.push("Ngành liên quan");
    if (hasFinancials) availableFields.push("Dữ liệu tài chính nghiên cứu");
    else missingFields.push("Dữ liệu tài chính");
    if (hasEps) availableFields.push("EPS candidate");
    else missingFields.push("EPS");
    if (hasDebt) availableFields.push("Nợ vay candidate");
    else missingFields.push("Nợ vay");
    if (hasShares) availableFields.push("Số cổ phiếu candidate");
    else missingFields.push("Số lượng cổ phiếu");
    if (hasMarketPrice) availableFields.push("Giá thị trường");
    else missingFields.push("Giá thị trường");

    if (!financialsData?.source.productionApproved) {
      missingFields.push("Nguồn đã phê duyệt sản xuất");
    }

    if (financialsReadError) {
      missingFields.push(`Lỗi đọc dữ liệu tài chính: ${financialsReadError}`);
    }

    const readinessChecks: ScreeningReadinessCheck[] = [
      { key: "company_info", label: "Có thông tin doanh nghiệp", status: hasCompanyInfo ? "available" : "missing", explanation: "" },
      { key: "related_industry", label: "Có ngành liên quan", status: businessProfile ? "available" : "missing", explanation: "" },
      { key: "financials", label: "Có dữ liệu tài chính", status: hasFinancials ? "available" : "missing", explanation: "" },
      { key: "eps", label: "Có EPS", status: hasEps ? "available" : "missing", explanation: "" },
      { key: "total_debt", label: "Có nợ vay", status: hasDebt ? "available" : "missing", explanation: "" },
      { key: "shares_outstanding", label: "Có số cổ phiếu", status: hasShares ? "available" : "missing", explanation: "" },
      { key: "market_price", label: "Có giá thị trường", status: hasMarketPrice ? "available" : "missing", explanation: "" },
      { key: "pe", label: "Có thể tính P/E", status: canCalculatePE ? "available" : "missing", explanation: "" },
      { key: "pb", label: "Có thể tính P/B", status: canCalculatePB ? "available" : "missing", explanation: "" },
      { key: "risk_readiness", label: "Có dữ liệu rủi ro", status: hasDebt ? "partial" : "missing", explanation: "" },
      { key: "source_status_as_of", label: "Có source/status/asOf cơ bản", status: hasFinancials ? "partial" : "missing", explanation: "" },
    ];

    const group =
      hasCompanyInfo && hasFinancials && hasEps && hasDebt && hasShares
        ? "priority"
        : hasCompanyInfo || hasFinancials
          ? "watch"
          : "not-fit";

    const isMissing = group === "not-fit";

    candidates.push({
      ticker,
      companyName: company?.companyName ?? "N/A",
      exchange: company?.exchange ?? "N/A",
      sector,
      industry,
      relatedIndustryKey: company?.industryCode ?? "unknown",
      dataStatus: isMissing ? "missing" : "ready",
      dataMode: (financialsData?.source.dataMode ?? "research_only") as ScreeningDataMode,
      productionApproved: financialsData?.source.productionApproved ?? false,
      availableFields,
      missingFields,
      readinessChecks,
      canContinueAnalysis: !isMissing,
      canCalculatePE,
      canCalculatePB,
      canAssessDebt: hasDebt,
      canAssessRisk: hasDebt,
      canCalculateShareMetrics: hasShares,
      warnings: [
        SOURCE_WARNING,
        NO_ZERO_FILL_WARNING,
        ...(hasFinancials && !hasMarketPrice
          ? [`Thiếu giá thị trường thật cho ${ticker}; không dùng giá minh họa để tính P/E hoặc P/B.`]
          : []),
        ...(financialsReadError ? [`Không đọc được dữ liệu tài chính cho ${ticker}: ${financialsReadError}`] : []),
      ],
      explanationForBeginner: isMissing
        ? "Chưa đủ dữ liệu để đánh giá cổ phiếu này."
        : "Mã này có đủ dữ liệu tối thiểu để tiếp tục đọc doanh nghiệp, BCTC, định giá và rủi ro; trạng thái này không nói cổ phiếu tốt/xấu.",
      whatToCheckNext: ["Doanh thu", "Biên lợi nhuận", "Dòng tiền"],
      readinessLabel: group === "priority" ? "Đủ dữ liệu để phân tích tiếp" : "Cần rà soát thêm dữ liệu thiếu",
      readinessScoreLabel: "Mức đủ dữ liệu",
      readinessScore: availableFields.length,
      sourceStatus: financialsData?.source.sourceLabel ?? "N/A",
      sourceAsOf: financialsData?.source.asOf ?? null,
      group,
      groupLabel:
        group === "priority" ? "Đủ dữ liệu để phân tích tiếp" : group === "watch" ? "Cần bổ sung dữ liệu" : "Chưa đủ dữ liệu",
      fitLabel: group === "priority" ? "Dữ liệu có thể phân tích tiếp" : "Thiếu dữ liệu quan trọng",
      reason:
        group === "priority"
          ? "Có đủ nhóm dữ liệu tối thiểu để chuyển sang bước sau."
          : "Hệ thống đang thiếu dữ liệu nền tảng cho mã này.",
      checkFlags: missingFields,
      nextStep:
        group === "priority"
          ? "Phân tích tiếp ở module doanh nghiệp hoặc xem dữ liệu tài chính."
          : "Chờ dữ liệu hoặc kiểm tra thủ công.",
      metrics: {
        "P/E": canCalculatePE ? "Có thể tính" : "Chưa thể tính",
        "P/B": canCalculatePB ? "Có thể tính" : "Chưa thể tính",
        "Nợ vay": hasDebt ? "Có thể kiểm tra" : "Chưa thể tính",
        "Rủi ro": hasDebt ? "Có thể rà soát" : "Chưa thể tính",
        "Nguồn": financialsData?.source.sourceLabel ?? "N/A",
      },
    });
  }

  let macroContext;
  let screeningCandidates: ScreeningCandidatePayload[] = [];
  let screeningCandidatesStatus: ScreeningRuntimeData["screeningCandidatesStatus"] = {
    status: "empty",
    count: 0,
    fallbackUsed: true,
    message: "Chưa có dữ liệu trong bảng lọc cổ phiếu chuyên dụng; đang dùng bảng kiểm tra dự phòng.",
  };

  try {
    screeningCandidates = await loadScreeningCandidatePayload();
    screeningCandidatesStatus =
      screeningCandidates.length > 0
        ? {
            status: "ready",
            count: screeningCandidates.length,
            fallbackUsed: false,
            message: "Đang đọc dữ liệu từ bảng lọc cổ phiếu chuyên dụng trên Supabase.",
          }
        : {
            status: "empty",
            count: 0,
            fallbackUsed: true,
            message: "Bảng lọc cổ phiếu chuyên dụng đang rỗng; đang dùng bảng kiểm tra dự phòng.",
          };
  } catch (error) {
    screeningCandidates = [];
    screeningCandidatesStatus = {
      status: "error",
      count: 0,
      fallbackUsed: true,
      message: "Không đọc được bảng lọc cổ phiếu chuyên dụng; đang dùng bảng kiểm tra dự phòng.",
      error: error instanceof Error ? error.message : "Unknown ScreeningCandidate read error.",
    };
  }

  try {
    macroContext = await loadLatestMacroObservations({
      indicatorCodes: ["CPI_YOY", "GDP_GROWTH"],
    });
  } catch {
    macroContext = undefined;
  }

  return {
    candidates,
    screeningCandidates,
    screeningCandidatesStatus,
    macroContext,
  };
};
