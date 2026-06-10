export type ScreeningMode = "context" | "ticker";

export type ScreeningOption = {
  value: string;
  label: string;
  description?: string;
};

export type ScreeningTone = "success" | "warning" | "danger";

export type ScreeningFunnelStatus =
  | "Đạt"
  | "Đạt sơ bộ"
  | "Cần kiểm tra"
  | "Cảnh báo"
  | "Không đủ dữ liệu";

export type ScreeningFunnelLayer = {
  id: string;
  title: string;
  icon: string;
  question: string;
  explanation: string;
  status: ScreeningFunnelStatus;
  criteria: string[];
  example: string;
  beginnerMistake: string;
};

export type StockFunnelReview = {
  layer: string;
  status: ScreeningFunnelStatus;
  dataPoints: string[];
  simpleExplanation: string;
  nextDataToCheck: string[];
  relatedModule: string;
};

export type ScreeningStockGroupKey = "priority" | "review" | "excluded";

export type BeginnerFitLevel = "Dễ hiểu" | "Trung bình" | "Khó";

export type ScreeningStock = {
  ticker: string;
  companyName: string;
  sector: string;
  classification: string;
  groupKey: ScreeningStockGroupKey;
  reason: string;
  mainReason: string;
  needToCheck: string;
  strengths: string[];
  checks: string[];
  risks: string[];
  beginnerFit: string;
  beginnerFitLevel: BeginnerFitLevel;
  conclusion: string;
  funnel: StockFunnelReview[];
};

export type ScreeningStockGroup = {
  key: ScreeningStockGroupKey;
  title: string;
  description: string;
  icon: string;
  tone: ScreeningTone;
  criteria: string[];
  stocks: ScreeningStock[];
};

export type ScreeningResultGroupLabels = {
  stockCountUnit: string;
};

export type ScreeningStockCardLabels = {
  reason: string;
  needToCheck: string;
  beginnerFit: string;
  status: string;
  note: string;
  explainAction: string;
  compareAction: string;
  nextAction: string;
};

export type ScreeningInputData = {
  title: string;
  description: string;
  sentenceTemplate: {
    prefix: string;
    industryFallback: string;
    riskFallback: string;
    objectiveFallback: string;
  };
  example: string;
  highRiskWarning: string;
  industryLabel: string;
  riskLabel: string;
  objectiveLabel: string;
  industries: ScreeningOption[];
  riskLevels: ScreeningOption[];
  objectives: ScreeningOption[];
  defaultIndustry: string;
  defaultRisk: string;
  defaultObjective: string;
};

export type ScreeningContextData = {
  title: string;
  subtitle: string;
  icon: string;
  summariesByIndustry: Record<
    string,
    {
      tailwind: string;
      risks: string;
      confirmations: string;
      priority: string;
    }
  >;
};

export type BeginnerScreeningData = {
  items: Array<{
    label: string;
    value: string;
    tone: "neutral" | "accent" | ScreeningTone;
  }>;
};

export type ScreeningDeepDiveStep = {
  id: string;
  title: string;
  question: string;
  dataPoints: string[];
  simpleReading: string;
  currentResult: string;
  impact: string;
  nextStep: string;
  scoring: string;
};

export type ScreeningDeepDiveData = {
  title: string;
  description: string;
  icon: string;
  steps: ScreeningDeepDiveStep[];
};

export type ScreeningComparisonSimpleRow = {
  ticker: string;
  keptReason: string;
  needToCheck: string;
  beginnerFit: BeginnerFitLevel;
  nextStep: string;
};

export type ScreeningComparisonAdvancedRow = {
  ticker: string;
  financial: string;
  valuation: string;
  liquidity: string;
  catalyst: string;
  riskFit: string;
};

export type ScreeningComparisonData = {
  title: string;
  description: string;
  icon: string;
  caption: string;
  simpleRows: ScreeningComparisonSimpleRow[];
  advancedRows: ScreeningComparisonAdvancedRow[];
};

export type ScreeningDisclaimerData = {
  title: string;
  icon: string;
  content: string;
};

export type UnderstandingCheckData = {
  title: string;
  description: string;
  icon: string;
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    feedback: string;
  }>;
};

export type ScreeningNextActionsData = {
  title: string;
  contextDescription: string;
  tickerDescription: string;
  icon: string;
  selectedStockLabel: string;
  actions: Array<{
    label: string;
    description: string;
    variant: "primary" | "secondary" | "ghost";
  }>;
};

export type ScreeningEmptyStateData = {
  title: string;
  description: string;
  icon: string;
};

export type ScreeningLoadingData = {
  title: string;
  description: string;
};

export type ScreeningModeOption = {
  value: ScreeningMode;
  title: string;
  description: string;
};

export type ScreeningTickerInputData = {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  buttonLabel: string;
  helper: string;
  emptyError: string;
  missingError: string;
  lengthError: string;
};

export type ScreeningFunnelSummaryData = {
  contextTitle: string;
  tickerTitle: string;
  contextText: string;
  tickerText: string;
};

export type ScreeningPageData = {
  isLoading: boolean;
  loading: ScreeningLoadingData;
  emptyState: ScreeningEmptyStateData;
  modeOptions: ScreeningModeOption[];
  tickerInput: ScreeningTickerInputData;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    warningNote: string;
    progressLabel: string;
    progressValue: number;
    statusLabel: string;
    icon: string;
  };
  input: ScreeningInputData;
  context: ScreeningContextData;
  funnelSummary: ScreeningFunnelSummaryData;
  stockCardLabels: ScreeningStockCardLabels;
  resultGroupLabels: ScreeningResultGroupLabels;
  resultGroups: ScreeningStockGroup[];
  stocksByTicker: Record<string, ScreeningStock>;
  deepDive: ScreeningDeepDiveData;
  comparison: ScreeningComparisonData;
  disclaimer: ScreeningDisclaimerData;
  understanding: UnderstandingCheckData;
  nextActions: ScreeningNextActionsData;
};
