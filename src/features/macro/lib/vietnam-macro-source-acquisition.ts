export type VietnamMacroSourceShape =
  | "api_candidate"
  | "csv_excel_candidate"
  | "html_static_table_candidate"
  | "html_dynamic_or_unstable"
  | "pdf_or_document_candidate"
  | "provider_candidate"
  | "manual_review_required"
  | "source_assessment_needed"
  | "missing_source_url"
  | "blocked";

export type VietnamMacroSourceAcquisitionItem = {
  indicatorCode:
    | "USD_VND"
    | "EXPORT_GROWTH"
    | "CREDIT_GROWTH"
    | "PUBLIC_INVESTMENT";
  frontendMetricId: string;
  frontendVisible: true;
  currentRuntimeMapping: string;
  sourceCandidateStatus:
    | "clear_url_candidate"
    | "candidate_without_url"
    | "semantic_mapping_review_required";
  selectedSource: string | null;
  sourceUrl: string | null;
  sourceUrlStatus:
    | "reachable"
    | "missing_source_url"
    | "semantic_mapping_review_required";
  providerFetchAttempted: boolean;
  providerFetchSucceeded: boolean;
  httpStatus: number | null;
  contentType: string | null;
  sourceShape: VietnamMacroSourceShape;
  parserReadiness: "ready_for_parser_dry_run" | "blocked";
  readyForParserDryRun: boolean;
  blockedReasons: string[];
  dbBackedStatus: "not_db_backed";
  needsReviewStatus: "needs_review";
  productionReadinessStatus: "not_production_approved";
  numericValuesExtracted: 0;
  candidateMacroRows: 0;
  candidateProvenanceRows: 0;
};

export const PHASE_149B_TARGET_INDICATORS = [
  "USD_VND",
  "EXPORT_GROWTH",
  "CREDIT_GROWTH",
  "PUBLIC_INVESTMENT",
] as const;

export const PHASE_149B_VIETNAM_MACRO_SOURCE_ACQUISITION: VietnamMacroSourceAcquisitionItem[] = [
  {
    indicatorCode: "USD_VND",
    frontendMetricId: "usd-vnd",
    frontendVisible: true,
    currentRuntimeMapping: "usd-vnd -> USD_VND",
    sourceCandidateStatus: "clear_url_candidate",
    selectedSource: "Vietcombank Exchange Rate XML API",
    sourceUrl: "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx",
    sourceUrlStatus: "reachable",
    providerFetchAttempted: true,
    providerFetchSucceeded: true,
    httpStatus: 200,
    contentType: "text/xml; charset=utf-8",
    sourceShape: "api_candidate",
    parserReadiness: "ready_for_parser_dry_run",
    readyForParserDryRun: true,
    blockedReasons: [],
    dbBackedStatus: "not_db_backed",
    needsReviewStatus: "needs_review",
    productionReadinessStatus: "not_production_approved",
    numericValuesExtracted: 0,
    candidateMacroRows: 0,
    candidateProvenanceRows: 0,
  },
  {
    indicatorCode: "EXPORT_GROWTH",
    frontendMetricId: "exports",
    frontendVisible: true,
    currentRuntimeMapping: "exports -> EXPORT_GROWTH",
    sourceCandidateStatus: "candidate_without_url",
    selectedSource: "GSO trade statistics candidate",
    sourceUrl: null,
    sourceUrlStatus: "missing_source_url",
    providerFetchAttempted: false,
    providerFetchSucceeded: false,
    httpStatus: null,
    contentType: null,
    sourceShape: "missing_source_url",
    parserReadiness: "blocked",
    readyForParserDryRun: false,
    blockedReasons: ["missing_source_url"],
    dbBackedStatus: "not_db_backed",
    needsReviewStatus: "needs_review",
    productionReadinessStatus: "not_production_approved",
    numericValuesExtracted: 0,
    candidateMacroRows: 0,
    candidateProvenanceRows: 0,
  },
  {
    indicatorCode: "CREDIT_GROWTH",
    frontendMetricId: "credit-growth",
    frontendVisible: true,
    currentRuntimeMapping: "credit-growth -> CREDIT_GROWTH",
    sourceCandidateStatus: "semantic_mapping_review_required",
    selectedSource: "SBV official publication candidate",
    sourceUrl: null,
    sourceUrlStatus: "missing_source_url",
    providerFetchAttempted: false,
    providerFetchSucceeded: false,
    httpStatus: null,
    contentType: null,
    sourceShape: "manual_review_required",
    parserReadiness: "blocked",
    readyForParserDryRun: false,
    blockedReasons: ["missing_source_url", "semantic_mapping_review_required"],
    dbBackedStatus: "not_db_backed",
    needsReviewStatus: "needs_review",
    productionReadinessStatus: "not_production_approved",
    numericValuesExtracted: 0,
    candidateMacroRows: 0,
    candidateProvenanceRows: 0,
  },
  {
    indicatorCode: "PUBLIC_INVESTMENT",
    frontendMetricId: "public-investment",
    frontendVisible: true,
    currentRuntimeMapping: "public-investment -> PUBLIC_INVESTMENT",
    sourceCandidateStatus: "semantic_mapping_review_required",
    selectedSource: "GSO public investment candidate",
    sourceUrl: null,
    sourceUrlStatus: "missing_source_url",
    providerFetchAttempted: false,
    providerFetchSucceeded: false,
    httpStatus: null,
    contentType: null,
    sourceShape: "source_assessment_needed",
    parserReadiness: "blocked",
    readyForParserDryRun: false,
    blockedReasons: ["missing_source_url", "semantic_mapping_review_required"],
    dbBackedStatus: "not_db_backed",
    needsReviewStatus: "needs_review",
    productionReadinessStatus: "not_production_approved",
    numericValuesExtracted: 0,
    candidateMacroRows: 0,
    candidateProvenanceRows: 0,
  },
];
