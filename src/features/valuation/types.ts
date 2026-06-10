import type { ButtonHTMLAttributes } from "react";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export type ProgressStatus =
  | "Chưa làm"
  | "Đang làm"
  | "Đã hoàn thành"
  | "Cần kiểm tra thêm";

export type Reliability = "Cao" | "Trung bình" | "Thấp";

export type FieldItem = {
  label: string;
  value: string;
  tone?: Tone;
};

export type ActionItem = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
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

export type ValuationHeaderData = {
  moduleName: string;
  ticker: string;
  companyName: string;
  industry: string;
  marketPrice: string;
  status: string;
  previousContext: string;
  actions: ActionItem[];
};

export type ValuationQuickSummaryData = {
  title: string;
  description: string;
  icon: string;
  metrics: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    status: string;
  }>;
  items: FieldItem[];
};

export type ProgressStep = {
  order: number;
  title: string;
  status: ProgressStatus;
};

export type ValuationProgressData = {
  title: string;
  description: string;
  steps: ProgressStep[];
};

export type ValuationSectionData = {
  id: string;
  icon: string;
  title: string;
  description?: string;
  tutor?: TutorNoteData;
  details?: string[];
};

export type ChecklistData = ValuationSectionData & {
  items: Array<{ label: string; checked: boolean }>;
  output: FieldItem[];
};

export type NormalizedInputData = ValuationSectionData & {
  checks: FieldItem[];
  output: FieldItem[];
};

export type BusinessTypeData = ValuationSectionData & {
  selectedType: string;
  types: FieldItem[];
};

export type MarketPricingData = ValuationSectionData & {
  metrics: FieldItem[];
  output: FieldItem;
};

export type MethodMappingRow = {
  businessType: string;
  preferredMethod: string;
  note: string;
};

export type MethodSelectionData = ValuationSectionData & {
  rows: MethodMappingRow[];
  output: FieldItem[];
};

export type ValuationMethod = {
  id: string;
  name: string;
  purpose: string;
  whenToUse: string;
  failureMode: string;
  range: string;
  reliability: Reliability;
  tone: Tone;
};

export type ValuationMethodsData = ValuationSectionData & {
  methods: ValuationMethod[];
};

export type HistoricalComparisonData = ValuationSectionData & {
  rows: Array<{
    metric: string;
    current: string;
    benchmark: string;
    reading: string;
  }>;
  output: FieldItem[];
};

export type MarketExpectationData = ValuationSectionData & {
  expectations: FieldItem[];
  output: FieldItem;
};

export type ScenarioData = {
  title: string;
  price: string;
  assumption: string;
  tone: Tone;
};

export type ScenarioValuationData = ValuationSectionData & {
  scenarios: ScenarioData[];
};

export type CatalystRiskData = ValuationSectionData & {
  catalystTitle: string;
  riskTitle: string;
  catalysts: string[];
  risks: string[];
};

export type MarginOfSafetyData = ValuationSectionData & {
  items: FieldItem[];
};

export type ConfidenceData = ValuationSectionData & {
  methods: Array<{
    method: string;
    reliability: Reliability;
    reason: string;
    tone: Tone;
  }>;
};

export type RangeSummaryData = ValuationSectionData & {
  ranges: Array<{
    method: string;
    min: number;
    max: number;
    label: string;
    tone: Tone;
  }>;
  minDomain: number;
  maxDomain: number;
};

export type ValuationTutorData = ValuationSectionData & {
  explanations: FieldItem[];
  questions: string[];
};

export type PersonalThesisData = ValuationSectionData & {
  prompts: string[];
  placeholder: string;
};

export type ValuationInputRow = {
  data: string;
  status: string;
  note: string;
};

export type ValuationMethodLogicRow = {
  businessType: string;
  mainMethod: string;
  reason: string;
};

export type ValuationMetricRow = {
  metric: string;
  current: string;
  comparison: string;
  reading: string;
};

export type ValuationWorkbenchMethod = {
  method: string;
  inputs: string[];
  formula: string;
  assumptions: string;
  range: string;
  reliability: Reliability;
  failureMode: string;
};

export type ValuationScenarioRow = {
  scenario: string;
  assumption: string;
  range: string;
  tone: Tone;
};

export type ValuationTrapRow = {
  trap: string;
  meaning: string;
};

export type ValuationGroup = {
  id: string;
  label: string;
  question: string;
  summary: string;
  inputRows?: ValuationInputRow[];
  methodRows?: ValuationMethodLogicRow[];
  metricRows?: ValuationMetricRow[];
  workbenchMethods?: ValuationWorkbenchMethod[];
  scenarioRows?: ValuationScenarioRow[];
  reliabilityRows?: Array<{ method: string; reliability: Reliability; reason: string }>;
  catalysts?: string[];
  risks?: string[];
  traps?: ValuationTrapRow[];
  prompts?: string[];
  output: string;
};

export type ValuationDisclaimerData = {
  title: string;
  content: string;
};

export type ValuationNextActionsData = {
  title: string;
  description: string;
  actions: Array<ActionItem & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">>;
};

export type ValuationPageData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  detailLabels: DetailLabels;
  header: ValuationHeaderData;
  quickSummary: ValuationQuickSummaryData;
  groups: ValuationGroup[];
  disclaimer: ValuationDisclaimerData;
  nextActions: ValuationNextActionsData;
  progress?: ValuationProgressData;
  precheck?: ChecklistData;
  normalizedInput?: NormalizedInputData;
  businessType?: BusinessTypeData;
  marketPricing?: MarketPricingData;
  methodSelection?: MethodSelectionData;
  valuationMethods?: ValuationMethodsData;
  historicalComparison?: HistoricalComparisonData;
  marketExpectation?: MarketExpectationData;
  scenarios?: ScenarioValuationData;
  catalystRisk?: CatalystRiskData;
  marginOfSafety?: MarginOfSafetyData;
  confidence?: ConfidenceData;
  rangeSummary?: RangeSummaryData;
  tutor?: ValuationTutorData;
  personalThesis?: PersonalThesisData;
};
