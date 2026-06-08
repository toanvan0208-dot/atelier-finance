export type ScreeningOption = {
  value: string;
  label: string;
  description?: string;
};

export type ScreeningTone = "success" | "warning" | "danger";

export type ScreeningFunnelStatus =
  | "Đạt"
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
  simpleExplanation: string;
  nextDataToCheck: string[];
  relatedModule: string;
};

export type ScreeningStockGroupKey = "priority" | "review" | "excluded";

export type BeginnerFitLevel = "Dễ hiểu" | "Trung bình" | "Khó";

export type ScreeningStock = {
  ticker: string;
  companyName: string;
  classification: string;
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
  explanation: string;
  criteria: string[];
  example: string;
  beginnerMistake: string;
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
  keyStrength: string;
  needToCheck: string;
  beginnerFit: BeginnerFitLevel;
  conclusion: string;
};

export type ScreeningComparisonAdvancedRow = {
  criterion: string;
  stockA: string;
  stockB: string;
  stockC: string;
};

export type ScreeningComparisonData = {
  title: string;
  description: string;
  icon: string;
  caption: string;
  simpleRows: ScreeningComparisonSimpleRow[];
  advancedColumns: {
    criterion: string;
    stockA: string;
    stockB: string;
    stockC: string;
  };
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
  description: string;
  icon: string;
  selectedStockLabel: string;
  stocks: ScreeningOption[];
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

export type ScreeningPageData = {
  isLoading: boolean;
  loading: ScreeningLoadingData;
  emptyState: ScreeningEmptyStateData;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    warningNote: string;
    icon: string;
  };
  input: ScreeningInputData;
  context: ScreeningContextData;
  beginner: BeginnerScreeningData;
  funnel: {
    title: string;
    description: string;
    layers: ScreeningFunnelLayer[];
  };
  resultGroupLabels: ScreeningResultGroupLabels;
  stockCardLabels: ScreeningStockCardLabels;
  resultGroups: ScreeningStockGroup[];
  deepDive: ScreeningDeepDiveData;
  comparison: ScreeningComparisonData;
  disclaimer: ScreeningDisclaimerData;
  understanding: UnderstandingCheckData;
  nextActions: ScreeningNextActionsData;
};
