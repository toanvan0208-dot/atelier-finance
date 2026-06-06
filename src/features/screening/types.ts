export type ScreeningOption = {
  value: string;
  label: string;
};

export type ScreeningStockGroupKey = "priority" | "review" | "excluded";

export type ScreeningStockGroup = {
  key: ScreeningStockGroupKey;
  title: string;
  description: string;
  icon: string;
  tone: "success" | "warning" | "danger";
  criteria: string[];
  stocks: ScreeningStock[];
};

export type ScreeningResultGroupLabels = {
  stockCountUnit: string;
};

export type ScreeningStock = {
  ticker: string;
  companyName: string;
  classification: string;
  reason: string;
  strengths: string[];
  checks: string[];
  risks: string[];
  beginnerFit: string;
};

export type ScreeningStockCardLabels = {
  strengths: string;
  checks: string;
  risks: string;
};

export type ScreeningInputData = {
  title: string;
  description: string;
  industryLabel: string;
  riskLabel: string;
  objectiveLabel: string;
  thesisLabel: string;
  industries: ScreeningOption[];
  riskLevels: ScreeningOption[];
  objectives: ScreeningOption[];
  defaultIndustry: string;
  defaultRisk: string;
  defaultObjective: string;
  thesis: string;
};

export type ScreeningContextData = {
  title: string;
  icon: string;
  summary: string;
};

export type BeginnerScreeningData = {
  eyebrow: string;
  title: string;
  description: string;
  mainQuestion: string;
  questionsTitle: string;
  questions: string[];
  metrics: Array<{
    title: string;
    value: string;
    period?: string;
    description: string;
    icon: string;
    status: string;
  }>;
};

export type ScreeningDeepDiveStep = {
  step: string;
  title: string;
  mainQuestion: string;
  goal: string;
  resultStatus: string;
  explanation: string;
  outputs?: string[];
};

export type ScreeningFunnelStepLabels = {
  goal: string;
  resultStatus: string;
};

export type ScreeningDeepDiveData = {
  title: string;
  description: string;
  icon: string;
  collapsedLabel: string;
  expandedLabel: string;
  steps: ScreeningDeepDiveStep[];
};

export type ScreeningComparisonRow = {
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
  columns: {
    criterion: string;
    stockA: string;
    stockB: string;
    stockC: string;
  };
  rows: ScreeningComparisonRow[];
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
  questionsTitle: string;
  questions: string[];
  feedbackTitle: string;
  feedbackLevels: Array<{
    label: string;
    description: string;
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
    icon: string;
  };
  input: ScreeningInputData;
  context: ScreeningContextData;
  beginner: BeginnerScreeningData;
  resultGroupLabels: ScreeningResultGroupLabels;
  stockCardLabels: ScreeningStockCardLabels;
  resultGroups: ScreeningStockGroup[];
  funnelStepLabels: ScreeningFunnelStepLabels;
  deepDive: ScreeningDeepDiveData;
  comparison: ScreeningComparisonData;
  disclaimer: ScreeningDisclaimerData;
  understanding: UnderstandingCheckData;
  nextActions: ScreeningNextActionsData;
};
