const PHASE = "159G";

type ReviewedMetricMapping = {
  industryCode: string;
  tickerExample: string;
  sourceKey: string;
  sourceLabel: string;
  sourceFile: string;
  pageNumber: number;
  proposedMetricCode: string;
  proposedMetricLabelVi: string;
  observedValue: string | null;
  normalizedValue: number | null;
  unit: string | null;
  periodLabel: string | null;
  observationDate: string | null;
  reviewStatus: "eligible_for_write_trial" | "needs_metric_split" | "needs_manual_review" | "not_eligible";
  reviewReason: string;
  productionApproved: false;
  needsReview: true;
};

const reviewedMappings: ReviewedMetricMapping[] = [
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    sourceKey: "local_pdf_steel_q1_2026:p3:global_crude_steel_mar_2026",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    sourceFile: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    pageNumber: 3,
    proposedMetricCode: "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION",
    proposedMetricLabelVi: "San luong thep tho toan cau",
    observedValue: "159.9 million tonnes",
    normalizedValue: 159.9,
    unit: "million_tonnes",
    periodLabel: "2026-03",
    observationDate: "2026-03-31",
    reviewStatus: "eligible_for_write_trial",
    reviewReason:
      "Value, unit, period, and global industry scope are clear. It is not the same as company sales volume.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    sourceKey: "local_pdf_steel_q1_2026:p3:global_crude_steel_yoy_mar_2026",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    sourceFile: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    pageNumber: 3,
    proposedMetricCode: "STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY",
    proposedMetricLabelVi: "Tang truong san luong thep tho toan cau YoY",
    observedValue: "-4.2%",
    normalizedValue: -4.2,
    unit: "percent",
    periodLabel: "2026-03",
    observationDate: "2026-03-31",
    reviewStatus: "eligible_for_write_trial",
    reviewReason: "Value, unit, comparison basis, and period are clear.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    sourceKey: "local_pdf_steel_q1_2026:p4:domestic_construction_steel_price_change_q1_2026",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    sourceFile: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    pageNumber: 4,
    proposedMetricCode: "STEEL_DOMESTIC_CONSTRUCTION_PRICE_CHANGE_RANGE",
    proposedMetricLabelVi: "Bien dong gia thep xay dung noi dia",
    observedValue: "1,200-1,450 VND/kg",
    normalizedValue: null,
    unit: "vnd_per_kg_range",
    periodLabel: "2026-Q1",
    observationDate: "2026-03-31",
    reviewStatus: "needs_metric_split",
    reviewReason:
      "Source gives a range. Current IndustryMetric stores one Decimal value, so this needs min/max metric split before write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    sourceKey: "local_pdf_retail_2026:p2:retail_sales_value_4m2026",
    sourceLabel: "Local PDF - Retail sector",
    sourceFile: "D:\\nganh_ban_le.pdf",
    pageNumber: 2,
    proposedMetricCode: "RETAIL_SALES_VALUE_CURRENT_PRICE",
    proposedMetricLabelVi: "Doanh thu ban le hang hoa va dich vu theo gia hien hanh",
    observedValue: "2,546 trillion VND",
    normalizedValue: 2546,
    unit: "vnd_trillion",
    periodLabel: "2026-04 YTD",
    observationDate: "2026-04-30",
    reviewStatus: "eligible_for_write_trial",
    reviewReason: "Value, unit, period, and industry scope are clear from the retail PDF.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    sourceKey: "local_pdf_retail_2026:p2:retail_sales_yoy_4m2026",
    sourceLabel: "Local PDF - Retail sector",
    sourceFile: "D:\\nganh_ban_le.pdf",
    pageNumber: 2,
    proposedMetricCode: "RETAIL_SALES_VALUE_YOY_CURRENT_PRICE",
    proposedMetricLabelVi: "Tang truong doanh thu ban le hang hoa va dich vu YoY",
    observedValue: "11.1%",
    normalizedValue: 11.1,
    unit: "percent",
    periodLabel: "2026-04 YTD",
    observationDate: "2026-04-30",
    reviewStatus: "eligible_for_write_trial",
    reviewReason: "Value, unit, comparison basis, and period are clear from the retail PDF.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    sourceKey: "local_pdf_retail_2026:p2:retail_sales_real_growth_4m2026",
    sourceLabel: "Local PDF - Retail sector",
    sourceFile: "D:\\nganh_ban_le.pdf",
    pageNumber: 2,
    proposedMetricCode: "RETAIL_SALES_REAL_GROWTH",
    proposedMetricLabelVi: "Tang truong thuc doanh thu ban le sau loai tru yeu to gia",
    observedValue: "6.3%",
    normalizedValue: 6.3,
    unit: "percent",
    periodLabel: "2026-04 YTD",
    observationDate: "2026-04-30",
    reviewStatus: "eligible_for_write_trial",
    reviewReason: "Value, unit, period, and inflation-adjusted meaning are clear.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    sourceKey: "local_pdf_retail_2026:gross_margin_not_found",
    sourceLabel: "Local PDF - Retail sector",
    sourceFile: "D:\\nganh_ban_le.pdf",
    pageNumber: 0,
    proposedMetricCode: "RETAIL_GROSS_MARGIN",
    proposedMetricLabelVi: "Bien gop ban le",
    observedValue: null,
    normalizedValue: null,
    unit: null,
    periodLabel: null,
    observationDate: null,
    reviewStatus: "not_eligible",
    reviewReason: "Dry run did not find a reliable gross margin source in this PDF.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    tickerExample: "VNM",
    sourceKey: "local_pdf_consumer_staples_2026:dairy_scope_unclear",
    sourceLabel: "Local PDF - Consumer staples outlook 2026",
    sourceFile: "D:\\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf",
    pageNumber: 0,
    proposedMetricCode: "DAIRY_REVENUE_GROWTH",
    proposedMetricLabelVi: "Tang truong doanh thu nhom sua",
    observedValue: null,
    normalizedValue: null,
    unit: null,
    periodLabel: null,
    observationDate: null,
    reviewStatus: "needs_manual_review",
    reviewReason:
      "Consumer staples PDF has broad consumer and company context, but the dry run did not isolate a dairy-specific industry metric.",
    productionApproved: false,
    needsReview: true,
  },
];

const eligibleForWriteTrial = reviewedMappings.filter(
  (mapping) => mapping.reviewStatus === "eligible_for_write_trial",
);
const notEligible = reviewedMappings.filter((mapping) => mapping.reviewStatus !== "eligible_for_write_trial");
const productionApprovedTrueCount = reviewedMappings.filter((mapping) => mapping.productionApproved).length;
const needsReviewFalseCount = reviewedMappings.filter((mapping) => !mapping.needsReview).length;
const eligibleRowsMissingValue = eligibleForWriteTrial.filter(
  (mapping) =>
    mapping.normalizedValue === null ||
    mapping.unit === null ||
    mapping.periodLabel === null ||
    mapping.observationDate === null,
).length;

const result = {
  phase: PHASE,
  mode: "reviewed_industry_metric_source_mapping_dry_run",
  dbWriteAttempted: false,
  schemaChanged: false,
  migrationCreated: false,
  providerFetchAttempted: false,
  rawSourceImportAttempted: false,
  industryMetricWriteAttempted: false,
  industryMetricProvenanceWriteAttempted: false,
  reviewedMappings,
  reviewedMappingCount: reviewedMappings.length,
  eligibleForWriteTrialCount: eligibleForWriteTrial.length,
  notEligibleOrNeedsMoreReviewCount: notEligible.length,
  eligibleRowsMissingValue,
  productionApprovedTrueCount,
  needsReviewFalseCount,
  eligibleWriteTrialRows: eligibleForWriteTrial,
  blockedOrDeferredRows: notEligible,
  benchmarkRankingScoringIntroduced: false,
  tradingOrValuationOutputIntroduced: false,
  stockAttractivenessIntroduced: false,
  readyForControlledWriteTrial: eligibleForWriteTrial.length > 0 && eligibleRowsMissingValue === 0,
  readyForRealMetricImport: false,
  recommendedNextPhase: "Phase 159H - IndustryMetric Controlled Write Trial",
};

const auditPassed =
  result.mode === "reviewed_industry_metric_source_mapping_dry_run" &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.migrationCreated &&
  !result.providerFetchAttempted &&
  !result.rawSourceImportAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.industryMetricProvenanceWriteAttempted &&
  result.eligibleForWriteTrialCount === 5 &&
  result.eligibleRowsMissingValue === 0 &&
  result.productionApprovedTrueCount === 0 &&
  result.needsReviewFalseCount === 0 &&
  result.readyForControlledWriteTrial &&
  !result.readyForRealMetricImport;

console.log(JSON.stringify({ ...result, auditPassed }, null, 2));

if (!auditPassed) {
  process.exitCode = 1;
}
