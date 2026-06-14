export type RiskRedesignTone = "low" | "caution" | "high" | "missing";

export type RiskRedesignStatus =
  | "Ổn sơ bộ"
  | "Cần theo dõi"
  | "Cần kiểm tra thêm"
  | "Thiếu dữ liệu"
  | "Rủi ro cao";

export type CriticalRisk = {
  id: string;
  title: string;
  whyItMatters: string;
  priority: "Cao" | "Trung bình cao" | "Trung bình";
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

export type RiskRedesignData = {
  ticker: string;
  companyName: string;
  industry: string;
  overall: {
    status: string;
    score: number | null;
    tone: RiskRedesignTone;
    conclusion: string;
  };
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
