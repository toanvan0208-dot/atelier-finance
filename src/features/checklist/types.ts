export type AnalysisModuleKey =
  | "macro"
  | "industry"
  | "screening"
  | "business"
  | "financials"
  | "valuation"
  | "technical"
  | "risk";


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
