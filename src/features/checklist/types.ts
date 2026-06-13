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

export type CheckThinkingMode = "understanding" | "stock";

export type ThinkingModuleId = AnalysisModuleKey;

export type ThinkingQuestionCount = 5 | 10 | 15;

export type ThinkingQuestionDifficulty = "easy" | "medium" | "hard";

export type ThinkingQuestionType =
  | "multiple_choice"
  | "true_false_explain"
  | "scenario"
  | "stock_application";

export type ThinkingModuleCard = {
  id: ThinkingModuleId;
  label: string;
  shortLabel: string;
  description: string;
  competencyFocus: string[];
  status: "ready" | "needs_practice" | "new";
  lastScore?: number;
};

export type ThinkingQuestion = {
  id: string;
  moduleId: ThinkingModuleId;
  type: ThinkingQuestionType;
  difficulty: ThinkingQuestionDifficulty;
  competency: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  commonMistake: string;
  relatedPaths: Array<{
    label: string;
    moduleKey: AnalysisModuleKey;
  }>;
};

export type QuestionCountOption = {
  value: ThinkingQuestionCount;
  label: string;
  description: string;
  estimatedTime: string;
};

export type ThinkingCompetencyScore = {
  competency: string;
  score: number;
  maxScore: number;
  feedback: string;
  nextAction: string;
};

export type ThinkingScoreResult = {
  totalScore: number;
  maxScore: number;
  headline: string;
  feedback: string;
  competencyScores: ThinkingCompetencyScore[];
};

export type StockReadinessStatus =
  | "done"
  | "needs_review"
  | "missing_data"
  | "not_started";

export type ChecklistLogicStatus =
  | "completed"
  | "needs_review"
  | "insufficient_data"
  | "not_applicable"
  | "unknown";

export type ChecklistLogicStep = {
  id: string;
  label: string;
  status: ChecklistLogicStatus;
  value: string;
  summary: string;
  warnings: string[];
  missingFields: string[];
  targetModule: AnalysisModuleKey | "watchlist";
};

export type ChecklistLogicGroup = {
  id: string;
  title: string;
  summary: string;
  steps: ChecklistLogicStep[];
};

export type StockModuleReadiness = {
  moduleKey: AnalysisModuleKey;
  moduleName: string;
  status: StockReadinessStatus;
  confidence: number;
  summary: string;
  missingEvidence: string[];
};

export type MissingEvidenceQuestion = {
  id: string;
  question: string;
  whyItMatters: string;
  targetModule: AnalysisModuleKey;
};

export type FomoCheckItem = {
  id: string;
  label: string;
  riskSignal: string;
  saferReframe: string;
};

export type StockFinalReadinessStatus =
  | "not_enough_data"
  | "return_to_analysis"
  | "watchlist_only"
  | "simulation_with_warning"
  | "ready";

export type StockFinalReadiness = {
  status: StockFinalReadinessStatus;
  label: string;
  tone: "danger" | "warning" | "success" | "neutral";
  summary: string;
  reasons: string[];
  nextActions: Array<{
    label: string;
    moduleKey?: AnalysisModuleKey | "watchlist" | "simulation";
    primary?: boolean;
  }>;
};

export type StockReadinessData = {
  ticker: string;
  companyName: string;
  industry: string;
  currentThesis: string;
  moduleReadiness: StockModuleReadiness[];
  missingEvidenceQuestions: MissingEvidenceQuestion[];
  fomoChecks: FomoCheckItem[];
  finalReadiness: StockFinalReadiness;
  logicChecklistGroups?: ChecklistLogicGroup[];
  logicWarnings?: string[];
  logicMissingFields?: string[];
};

export type CheckThinkingData = {
  hero: {
    title: string;
    subtitle: string;
    modeCards: Array<{
      mode: CheckThinkingMode;
      title: string;
      description: string;
      helper: string;
    }>;
  };
  modules: ThinkingModuleCard[];
  questionCountOptions: QuestionCountOption[];
  questionBank: Record<ThinkingModuleId, ThinkingQuestion[]>;
  thinkingScore: ThinkingScoreResult;
  stockReadinessByTicker: StockReadinessData[];
};
