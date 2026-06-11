export type AnalysisModuleKey =
  | "macro"
  | "industry"
  | "screening"
  | "business"
  | "financials"
  | "valuation"
  | "technical"
  | "risk";

export type AnalysisModuleStatus =
  | "not_started"
  | "in_progress"
  | "minimum_completed"
  | "completed"
  | "needs_update";

export type AnalysisModuleCompletion = {
  moduleKey: AnalysisModuleKey;
  moduleName: string;
  status: AnalysisModuleStatus;
  required: boolean;
  completionPercent: number;
  requiredOutputs: string[];
  completedOutputs: string[];
  missingOutputs: string[];
  evidence?: string;
  summary?: string;
  lastUpdated?: string;
  blockingReason?: string;
  navigateTo: string;
};

export type ChecklistModeId = "standard" | "full_before_simulation";

export type ChecklistMode = {
  id: ChecklistModeId;
  label: string;
  minQuestions: number;
  maxQuestions: number;
  estimatedTime: string;
  description: string;
  structure: string;
  bestFor: string;
};

export type StockChecklistQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "short_text";

export type StockChecklistQuestion = {
  id: string;
  groupId: string;
  questionText: string;
  questionType: StockChecklistQuestionType;
  required: boolean;
  coreQuestion: boolean;
  relatedModule: AnalysisModuleKey | "watchlist";
  options?: string[];
  aiPersonalized?: boolean;
};

export type StockChecklistAnswerStatus =
  | "available"
  | "unsure"
  | "missing"
  | "unknown";

export type StockChecklistAnswer = {
  questionId: string;
  status: StockChecklistAnswerStatus;
  selectedOptions?: string[];
  textAnswer?: string;
  note?: string;
  evidence?: string;
  relatedModule?: string;
};

export type ChecklistReadiness =
  | "locked"
  | "not_enough_understanding"
  | "need_more_analysis"
  | "watchlist_only"
  | "prepare_simulation_with_warning"
  | "ready_for_simulation"
  | "fomo_warning"
  | "unclear_thesis"
  | "missing_critical_data";

export type StockChecklistResult = {
  ticker: string;
  mode: ChecklistModeId;
  readiness: ChecklistReadiness;
  completedRequiredModules: number;
  totalRequiredModules: number;
  totalQuestions: number;
  answeredQuestions: number;
  missingCriticalCount: number;
  unsureCount: number;
  fomoWarning: boolean;
  nextAction: string;
  modulesToRevisit: string[];
};

export type ChecklistQuestionGroup = {
  id: string;
  title: string;
  goal: string;
  relatedModules: Array<AnalysisModuleKey | "watchlist">;
  standardQuestionIds: string[];
  fullQuestionIds: string[];
};

export type ChecklistTickerState = {
  ticker: string;
  companyName: string;
  industry: string;
  currentStatus: string;
  thesis: string;
  confirmingData: string[];
  disconfirmingData: string[];
  mainRisk: string;
  reviewMilestone: string;
  moduleCompletions: AnalysisModuleCompletion[];
  answers: StockChecklistAnswer[];
};

export type ChecklistBlockingModule = {
  moduleKey: AnalysisModuleKey;
  moduleName: string;
  status: AnalysisModuleStatus;
  missingOutputs: string[];
  blockingReason: string;
  navigateTo: string;
};
