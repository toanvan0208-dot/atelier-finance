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

export type ValuationStatus =
  | "undervalued"
  | "within_range"
  | "overvalued"
  | "unclear"
  | "insufficient_data";

export type ValuationConfidence = "high" | "medium" | "low" | "unknown";

export type ValuationMetricStatus =
  | "reasonable"
  | "watch"
  | "risk"
  | "neutral"
  | "missing";

export type ValuationMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  period: string;
  status: ValuationMetricStatus;
  explanation: string;
  isMock?: boolean;
  detail?: {
    definition: string;
    whyItMatters: string;
    commonMistake: string;
  };
};

export type ValuationRangePoint = {
  id: string;
  label: string;
  value: number;
  tone: "bear" | "base" | "bull" | "market" | "range";
};

export type ValuationSensitivityItem = {
  id: string;
  name: string;
  currentValue: string;
  impact: string;
  sensitivity: "high" | "medium" | "low";
  isMock?: boolean;
};

export type ValuationCommandCenterData = {
  title: string;
  ticker: string;
  companyName: string;
  currentPrice: string;
  referenceRange: string;
  status: ValuationStatus;
  marginOfSafety: "Rõ" | "Mỏng" | "Không rõ" | "Chưa tính được";
  confidence: ValuationConfidence;
  primaryMethod: string;
  summary: string;
  warning: string;
  range: {
    minDomain: number;
    maxDomain: number;
    bear: number;
    base: number;
    bull: number;
    referenceMin: number;
    referenceMax: number;
    market: number;
  };
  metrics: ValuationMetric[];
  sensitivity: ValuationSensitivityItem[];
  nextCheckpoint: {
    title: string;
    description: string;
    ctaLabel: string;
  };
  isMock?: boolean;
};

export type ValuationInputReadinessItem = {
  id: string;
  label: string;
  status: "done" | "needs_check" | "risk" | "missing";
  helperText: string;
};

export type ValuationInputReadinessData = {
  title: string;
  confidenceLabel: "Cao" | "Trung bình" | "Thấp";
  completed: number;
  total: number;
  warning: string;
  concernItems: string[];
  items: ValuationInputReadinessItem[];
};

export type ValuationMethodConfidenceItem = {
  id: string;
  method: string;
  suitability: "primary" | "reference" | "caution" | "not_suitable";
  confidence: ValuationConfidence;
  reason: string;
  range?: string;
  detail: {
    whenToUse: string;
    inputsToCheck: string[];
    failureMode: string;
    beginnerTrap: string;
  };
};

export type ValuationMethodConfidenceData = {
  title: string;
  description: string;
  methods: ValuationMethodConfidenceItem[];
};

export type ValuationTrapItem = {
  id: string;
  name: string;
  severity: "high" | "medium" | "low" | "unknown";
  whyRelevant: string;
  dataToCheck: string[];
  targetModule?: string;
};

export type ValuationTrapRadarData = {
  title: string;
  description: string;
  traps: ValuationTrapItem[];
};

export type RiskReadinessItem = {
  id: string;
  label: string;
  status: "done" | "needs_review" | "missing";
  helperText: string;
};

export type RiskReadinessData = {
  title: string;
  description: string;
  completed: number;
  total: number;
  status: "Có thể sang Rủi ro" | "Nên kiểm tra thêm" | "Chưa đủ điều kiện";
  ctaLabel: string;
  disabledCtaLabel: string;
  helperText: string;
  items: RiskReadinessItem[];
};

export type ValuationThesisNoteData = {
  title: string;
  description: string;
  primaryMethod: string;
  referenceRange: string;
  keyAssumption: string;
  changeConditions: string[];
  trapsToWatch: string[];
  draftConclusion: string;
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
  commandCenter: ValuationCommandCenterData;
  inputReadiness: ValuationInputReadinessData;
  methodConfidence: ValuationMethodConfidenceData;
  trapRadar: ValuationTrapRadarData;
  riskReadiness: RiskReadinessData;
  thesisNote: ValuationThesisNoteData;
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

export type ValuationRangeStatus = "Rẻ hấp dẫn" | "Đang nằm trong vùng giá trị hợp lý" | "Đắt / rủi ro" | "Cần kiểm tra thêm";

export type ValuationSummaryData = {
  ticker: string;
  companyName: string;
  currentPrice: number | null;
  fairValueRange: {
    low: number;
    high: number;
    status: ValuationRangeStatus;
    marginOfSafety: "Dày" | "Mỏng" | "Không rõ";
    confidence: "Cao" | "Trung bình" | "Thấp";
    conclusion: string;
  };
};

export type ValuationAssumption = {
  title: string;
  description: string;
  sensitivity: "Rất cao" | "Cao" | "Trung bình" | "Thấp";
};

export type ValuationUncertainty = {
  title: string;
  status: "Đã ổn" | "Cần theo dõi" | "Rủi ro cao";
  description: string;
  targetModule?: string;
};

export type ValuationMethodChoice = {
  name: string;
  role: "Chính" | "Đối chiếu" | "Kiểm tra độ nhạy" | "Chỉ tham khảo";
  explanation: string;
  confidence: "Cao" | "Trung bình" | "Thấp";
};

export type ValuationRangeRow = {
  method: string;
  keyAssumption: string;
  range: string;
  confidence: "Cao" | "Trung bình" | "Thấp" | "Thấp đến trung bình";
  risk: string;
};

export type ValuationScenarioSafetyItem = {
  name: "Kịch bản xấu" | "Kịch bản cơ sở" | "Kịch bản tốt";
  range: string;
  explanation: string;
  tone: "downside" | "base" | "upside";
};

export type ValuationTrapSimple = {
  title: string;
  description: string;
  targetModule?: string;
};

export type ValuationFinalConclusionData = {
  status: "Chưa đủ rẻ rõ ràng" | "Có thể theo dõi tiếp" | "Cần kiểm tra thêm trước khi kết luận";
  pricePosition: string;
  marginOfSafety: string;
  keyRisk: string;
  nextStep: string;
};

export type ValuationNextStepAction = {
  label: string;
  moduleKey: string;
  variant: "primary" | "secondary" | "ghost";
};

export type ValuationRefactoredData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  summary: ValuationSummaryData;
  assumptions: {
    intro: string;
    sensitiveNote: string;
    items: ValuationAssumption[];
  };
  uncertainties: ValuationUncertainty[];
  methods: ValuationMethodChoice[];
  ranges: {
    rows: ValuationRangeRow[];
    combinedRange: string;
    explanation: string;
  };
  scenarios: {
    currentPrice: number | null;
    baseRange: string;
    conclusion: string;
    items: ValuationScenarioSafetyItem[];
  };
  traps: ValuationTrapSimple[];
  finalConclusion: ValuationFinalConclusionData;
  nextActions: ValuationNextStepAction[];
};
