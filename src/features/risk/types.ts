export type RiskRedesignTone = "ready" | "check" | "blocked" | "missing";

export type RiskRedesignStatus =
  | "Có thể kiểm tra tiếp"
  | "Cần kiểm tra thêm"
  | "Chưa đủ dữ liệu"
  | "Dữ liệu nghiên cứu"
  | "Đã có nguồn"
  | "Thiếu nguồn"
  | "Cần rà soát"
  | "Không đủ cơ sở";

export type RiskDisclosureReview = {
  ticker: string;
  auditor: string | null;
  auditOpinion: string | null;
  reportPublishedDate: string | null;
  filingStatus: "available" | "missing" | "needs_review" | "unknown";
  relatedPartyNotes: string | null;
  fieldEvidence?: RiskDisclosureFieldEvidence[];
  sourceUrl: string | null;
  sourceType: "company_disclosure" | "exchange" | "official" | "unknown";
  needsReview: true;
  productionApproved: false;
};

export type RiskDisclosureFieldEvidence = {
  field: "auditor" | "auditOpinion" | "reportPublishedDate" | "relatedPartyNotes";
  label: string;
  status: "backed_by_pdf" | "not_found" | "needs_review";
  source: string;
  page: number | null;
  note: string;
};

export type RiskDisclosureReadiness = {
  status: "Đã có nguồn" | "Thiếu nguồn" | "Cần rà soát" | "Không đủ cơ sở";
  tone: RiskRedesignTone;
  availableFields: string[];
  missingFields: string[];
  reviewNotes: string[];
};

export type CriticalRisk = {
  id: string;
  title: string;
  whyItMatters: string;
  priority: "Cần kiểm tra" | "Theo dõi" | "Bổ sung dữ liệu";
  affectedModules: string[];
  earlyWarnings: string[];
  targetModule?: string;
};

export type ThesisBreaker = {
  id: string;
  label: string;
  statement: string;
  targetModule?: string;
};

export type RiskSource = {
  id: string;
  title: string;
  status: RiskRedesignStatus;
  tone: RiskRedesignTone;
  mainRisk: string;
  evidence: string[];
  warnings?: string[];
  missingData: string[];
  relatedMetrics?: string[];
  evidenceDetails?: RiskDisclosureFieldEvidence[];
  nextChecks?: string[];
  sourceModules: string[];
  action: {
    label: string;
    moduleKey: string;
  };
  defaultOpen?: boolean;
};

export type TransparencyGovernanceCheck = {
  id: string;
  title: string;
  status: RiskRedesignStatus;
  tone: RiskRedesignTone;
  whyItMatters: string;
  dataToCheck: string[];
};

export type RiskTimelineData = {
  shortTerm: string[];
  mediumTerm: string[];
  longTerm: string[];
};

export type RiskFinalConclusionData = {
  biggestRisk: string;
  missingData: string;
  thesisBreaker: string;
  readiness: string;
  nextStep: string;
};

export type RiskNextActionItem = {
  label: string;
  moduleKey: "checklist" | "watchlist" | "financials" | "valuation" | "business" | "technical" | "risk";
  primary?: boolean;
};

export type MissingDataRiskSummary = {
  ticker: string;
  companyName: string;
  dataMode: "research_only" | "manual_reviewed" | "sample" | "unavailable";
  productionApproved: false;
  overallDataReadiness: "ready" | "partial" | "missing";
  sourceWarnings: string[];
  missingFinancialFields: string[];
  unavailableValuationMetrics: string[];
  incompleteContextAreas: string[];
  conclusionWarnings: string[];
  whatToCheckNext: string[];
  riskSummaryLabel:
    | "Cần kiểm tra dữ liệu"
    | "Chưa đủ dữ liệu"
    | "Dữ liệu nghiên cứu"
    | "Có thể phân tích tiếp nhưng còn hạn chế";
};

export type RiskRedesignData = {
  ticker: string;
  companyName: string;
  industry: string;
  overall: {
    status: string;
    tone: RiskRedesignTone;
    conclusion: string;
  };
  disclosureReview: RiskDisclosureReview;
  disclosureReadiness: RiskDisclosureReadiness;
  missingDataSummary: MissingDataRiskSummary;
  topRisks: CriticalRisk[];
  missingEvidence: string[];
  thesisBreakers: ThesisBreaker[];
  riskSources: RiskSource[];
  transparency: TransparencyGovernanceCheck[];
  stopConditions: string[];
  riskTimeline: RiskTimelineData;
  reverseRiskNote: string;
  finalConclusion: RiskFinalConclusionData;
  nextActions: RiskNextActionItem[];
};
