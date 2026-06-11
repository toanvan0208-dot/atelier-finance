import type { ButtonHTMLAttributes } from "react";

export type RiskTone = "neutral" | "accent" | "success" | "warning" | "danger";
export type RiskStatus =
  | "Cần theo dõi"
  | "Cần kiểm tra thêm"
  | "Chưa phù hợp để quyết định vội";

export type RiskAction = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export type RiskFieldItem = {
  label: string;
  value: string;
  tone?: RiskTone;
};

export type TutorNoteData = {
  title: string;
  content: string;
};

export type DetailLabels = {
  detailButtonLabel: string;
  collapseButtonLabel: string;
  detailChipLabel: string;
};

export type RiskHeaderData = {
  moduleName: string;
  subtitle: string;
  ticker: string;
  companyName: string;
  industry: string;
  reviewStatus: string;
  previousContext: string;
  actions: RiskAction[];
};

export type RiskOverviewData = {
  title: string;
  description: string;
  icon: string;
  reminder: string;
  metrics: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    status: string;
  }>;
};

export type RiskJourneyStep = {
  order: number;
  title: string;
  question: string;
  status: RiskStatus;
  source: string;
  detailButtonLabel: string;
};

export type RiskJourneyData = {
  title: string;
  description: string;
  steps: RiskJourneyStep[];
};

export type RiskStatusLegendData = {
  title: string;
  description: string;
  items: Array<{
    status: RiskStatus;
    description: string;
    reason: string;
    source: string;
    nextCheck: string;
  }>;
};

export type RiskDetailGroup = {
  id: string;
  order: number;
  title: string;
  centralQuestion: string;
  plainExplanation: string;
  whyCare: string;
  dataToReview: string[];
  watchSigns: string[];
  checkFurther: string[];
  sourceModules: string[];
  sourceActionLabel: string;
  status: RiskStatus;
  statusReason: string;
  mainQuestions: string[];
  advancedQuestions: string[];
  evidence: RiskFieldItem[];
  tutor?: TutorNoteData;
  reflectionPrompt?: string;
};

export type RiskFinalNoteData = {
  title: string;
  description: string;
  readiness: RiskStatus;
  readinessReminder: string;
  fields: RiskFieldItem[];
  prompts: string[];
  placeholder: string;
};

export type RiskDisclaimerData = {
  title: string;
  content: string;
};

export type RiskNextActionsData = {
  title: string;
  description: string;
  actions: RiskAction[];
};

export type RiskSeverity = "low" | "medium" | "high" | "unknown";

export type RiskEvidenceStrength = "weak" | "medium" | "strong" | "missing";

export type RiskTimeHorizon = "short" | "medium" | "long" | "mixed";

export type RiskControlStatus =
  | "ok"
  | "watch"
  | "risk"
  | "missing_data"
  | "conflict";

export type RiskControlItem = {
  id: string;
  title: string;
  group: string;
  severity: RiskSeverity;
  evidenceStrength: RiskEvidenceStrength;
  horizon: RiskTimeHorizon;
  summary: string;
  sourceModules: string[];
  missingEvidence?: string[];
  ctaLabel?: string;
  targetModule?: string;
  isMock?: boolean;
};

export type MissingEvidenceItem = {
  id: string;
  label: string;
  module: string;
  reason: string;
  ctaLabel: string;
};

export type RiskControlRoomData = {
  title: string;
  ticker: string;
  companyName: string;
  status: "Rủi ro thấp sơ bộ" | "Cần theo dõi" | "Có rủi ro trọng yếu" | "Thiếu dữ liệu" | "Dữ liệu trái chiều";
  score: number;
  conclusion: string;
  warning: string;
  topRisks: RiskControlItem[];
  missingEvidence: MissingEvidenceItem[];
  checklistReadinessSummary: {
    completed: number;
    total: number;
    status: "Có thể sang Checklist" | "Nên kiểm tra thêm" | "Chưa đủ điều kiện";
    helperText: string;
  };
  isMock?: boolean;
};

export type RiskEvidenceSource = {
  id: string;
  module: "industry" | "business" | "financials" | "valuation" | "technical" | "portfolio" | "behavior";
  label: string;
  relatedRisks: string[];
  availableEvidence: string[];
  missingEvidence: string[];
  status: RiskControlStatus;
};

export type RiskEvidenceMapData = {
  title: string;
  description: string;
  sources: RiskEvidenceSource[];
};

export type RiskJourneyCluster = {
  id: string;
  title: string;
  description: string;
  groupIds: string[];
  status: "Đang kiểm tra" | "Cần xem lại" | "Đã ghi nhận" | "Thiếu dữ liệu";
};

export type TransparencyCheckItem = {
  id: string;
  label: string;
  status: RiskControlStatus;
  explanation: string;
  dataToCheck: string[];
  severity: RiskSeverity;
};

export type TransparencyGovernanceData = {
  title: string;
  description: string;
  items: TransparencyCheckItem[];
};

export type RiskCaseFileData = {
  title: string;
  description: string;
  topRisks: string[];
  missingEvidence: string[];
  thesisBreakers: string[];
  monitorRisks: string[];
  checklistConditions: string[];
  notePrompts: string[];
};

export type ChecklistReadinessItem = {
  id: string;
  label: string;
  status: "done" | "missing" | "needs_review";
  helperText: string;
};

export type ChecklistReadinessData = {
  title: string;
  description: string;
  completed: number;
  total: number;
  status: "Có thể sang Checklist" | "Nên kiểm tra thêm" | "Chưa đủ điều kiện";
  ctaLabel: string;
  disabledCtaLabel: string;
  helperText: string;
  items: ChecklistReadinessItem[];
};

export type RiskPageData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  detailLabels: DetailLabels;
  header: RiskHeaderData;
  controlRoom: RiskControlRoomData;
  evidenceMap: RiskEvidenceMapData;
  analysisClusters: RiskJourneyCluster[];
  transparencyGovernance: TransparencyGovernanceData;
  caseFile: RiskCaseFileData;
  checklistReadiness: ChecklistReadinessData;
  overview: RiskOverviewData;
  journey: RiskJourneyData;
  statusLegend: RiskStatusLegendData;
  riskGroups: RiskDetailGroup[];
  finalNote: RiskFinalNoteData;
  disclaimer: RiskDisclaimerData;
  nextActions: RiskNextActionsData;
};
