import type { ButtonHTMLAttributes } from "react";

export type TechnicalTone = "neutral" | "accent" | "success" | "warning" | "danger";

export type TechnicalProgressStatus =
  | "Chưa làm"
  | "Đang làm"
  | "Đã hoàn thành"
  | "Cần kiểm tra thêm";

export type TechnicalAction = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export type TechnicalFieldItem = {
  label: string;
  value: string;
  tone?: TechnicalTone;
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

export type TechnicalHeaderData = {
  moduleName: string;
  subtitle: string;
  ticker: string;
  companyName: string;
  industry: string;
  timeframe: string;
  status: string;
  previousContext: string;
  actions: TechnicalAction[];
};

export type TechnicalQuickSummaryData = {
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
  answers: TechnicalFieldItem[];
};

export type PVTReadingPathData = {
  title: string;
  description: string;
  icon: string;
  steps: TechnicalFieldItem[];
};

export type TechnicalProgressStep = {
  order: number;
  title: string;
  question: string;
  summary: string;
  status: TechnicalProgressStatus;
  tone?: TechnicalTone;
  sections: Array<{
    title: string;
    items: string[];
  }>;
  beginnerExplanation?: string;
  example?: string[];
  reminder?: string;
};

export type TechnicalProgressData = {
  title: string;
  description: string;
  steps: TechnicalProgressStep[];
};

export type TechnicalSectionBase = {
  id: string;
  icon: string;
  title: string;
  description?: string;
  tutor?: TutorNoteData;
  details?: string[];
};

export type TimeframeSelectorData = TechnicalSectionBase & {
  defaultValue: string;
  options: TechnicalFieldItem[];
};

export type TrendMapData = TechnicalSectionBase & {
  trends: TechnicalFieldItem[];
};

export type PricePoint = {
  label: string;
  price: number;
  volume: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
  rsi?: number;
};

export type PriceVolumeState = {
  label: string;
  reading: string;
  tone: TechnicalTone;
};

export type PriceVolumeStoryData = TechnicalSectionBase & {
  chartTitle: string;
  volumeTitle: string;
  averageVolume20: string;
  toggles: Array<{ key: string; label: string; enabled: boolean }>;
  points: PricePoint[];
  states: PriceVolumeState[];
  reading: TechnicalFieldItem;
};

export type RelativeStrengthData = TechnicalSectionBase & {
  rows: Array<{ name: string; change: string; note: string }>;
  output: TechnicalFieldItem;
};

export type VolatilityData = TechnicalSectionBase & {
  metrics: TechnicalFieldItem[];
  output: TechnicalFieldItem;
};

export type PricePositionData = TechnicalSectionBase & {
  metrics: TechnicalFieldItem[];
};

export type NewsEvent = {
  date: string;
  title: string;
  type: string;
  relevance: string;
};

export type NewsEventData = TechnicalSectionBase & {
  rows: NewsEvent[];
};

export type MovementExplanationData = TechnicalSectionBase & {
  possibleDrivers: TechnicalFieldItem[];
  uncertaintyNote: string;
};

export type MarketPsychologyData = TechnicalSectionBase & {
  states: string[];
  currentState: string;
  score: number;
};

export type FomoBehaviorData = TechnicalSectionBase & {
  items: Array<{ label: string; checked: boolean }>;
  output: TechnicalFieldItem;
};

export type CrossModuleAlignmentData = TechnicalSectionBase & {
  chain: string[];
  checks: TechnicalFieldItem[];
  output: TechnicalFieldItem;
};

export type PersonalMarketObservationData = TechnicalSectionBase & {
  prompts: string[];
  placeholder: string;
};

export type TechnicalOutputSummaryData = TechnicalSectionBase & {
  items: TechnicalFieldItem[];
};

export type TechnicalDisclaimerData = {
  title: string;
  content: string;
};

export type TechnicalNextActionsData = {
  title: string;
  description: string;
  actions: TechnicalAction[];
};

export type PVTLayer =
  | "price"
  | "volume"
  | "time"
  | "market"
  | "event"
  | "psychology";

export type PVTStatus =
  | "normal"
  | "watch"
  | "risk"
  | "unclear"
  | "aligned"
  | "conflict";

export type PVTMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status: PVTStatus;
  explanation: string;
  isMock?: boolean;
  detail?: {
    definition: string;
    whyItMatters: string;
    commonMistake: string;
  };
};

export type PVTZone = {
  id: string;
  label: string;
  min: number;
  max: number;
  type: "support" | "resistance" | "current" | "neutral";
};

export type PVTEvent = {
  id: string;
  date: string;
  title: string;
  type: "financials" | "industry" | "macro" | "business" | "market";
  priceReaction: string;
  volumeReaction: string;
  status: "possibly_related" | "unclear" | "noise";
  pointIndex: number;
};

export type PVTLayerDetail = {
  layer: PVTLayer;
  label: string;
  question: string;
  observation: string;
  metrics: TechnicalFieldItem[];
  checks: string[];
  commonMistake: string;
  ctaLabel: string;
};

export type PVTReadinessItem = {
  id: string;
  label: string;
  status: "done" | "missing" | "needs_review";
  helperText: string;
};

export type PVTCommandCenterData = {
  title: string;
  ticker: string;
  currentPrice: string;
  timeframe: string;
  observation: {
    price: string;
    volume: string;
    time: string;
    event: string;
    psychology: string;
    warning: string;
  };
  zones: PVTZone[];
  metrics: PVTMetric[];
  events: PVTEvent[];
  layerDetails: PVTLayerDetail[];
  fomoMini: {
    checked: number;
    total: number;
    temperature: "Bình thường" | "Cần theo dõi" | "Nóng" | "Dễ FOMO";
    highlights: string[];
  };
  isMock?: boolean;
};

export type PVTCrossModuleAlignmentItem = {
  id: string;
  module: string;
  question: string;
  status: "aligned" | "unclear" | "conflict" | "needs_check";
  observation: string;
  ctaLabel?: string;
};

export type PVTCrossModuleAlignmentData = {
  title: string;
  description: string;
  items: PVTCrossModuleAlignmentItem[];
  primaryCtaLabel: string;
};

export type PVTReadinessData = {
  title: string;
  description: string;
  completed: number;
  total: number;
  status: "Có thể sang Rủi ro" | "Nên kiểm tra thêm" | "Chưa đủ điều kiện";
  ctaLabel: string;
  disabledCtaLabel: string;
  helperText: string;
  items: PVTReadinessItem[];
};

export type PersonalPVTObservationData = {
  title: string;
  description: string;
  prompts: string[];
  sample: string;
};

export type TechnicalPageData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  detailLabels: DetailLabels;
  header: TechnicalHeaderData;
  commandCenter: PVTCommandCenterData;
  pvtAlignment: PVTCrossModuleAlignmentData;
  pvtReadiness: PVTReadinessData;
  pvtObservation: PersonalPVTObservationData;
  quickSummary: TechnicalQuickSummaryData;
  readingPath: PVTReadingPathData;
  progress: TechnicalProgressData;
  timeframe: TimeframeSelectorData;
  trendMap: TrendMapData;
  priceVolume: PriceVolumeStoryData;
  relativeStrength: RelativeStrengthData;
  volatility: VolatilityData;
  pricePosition: PricePositionData;
  newsEvents: NewsEventData;
  movementExplanation: MovementExplanationData;
  marketPsychology: MarketPsychologyData;
  fomoCheck: FomoBehaviorData;
  crossModuleAlignment: CrossModuleAlignmentData;
  personalObservation: PersonalMarketObservationData;
  outputSummary: TechnicalOutputSummaryData;
  disclaimer: TechnicalDisclaimerData;
  nextActions: TechnicalNextActionsData;
};

export type PVTStatusTone = "positive" | "caution" | "risk" | "neutral";

export type PVTObservationPoint = {
  label: string;
  price: number;
  volume: number;
  ma20: number;
  ma50: number;
};

export type PVTObservationEvent = {
  label: string;
  title: string;
  pointIndex: number;
  note: string;
};

export type PVTSignalLayerId =
  | "price"
  | "volume"
  | "time"
  | "relative_strength"
  | "event_psychology";

export type PVTSignalLayer = {
  id: PVTSignalLayerId;
  title: string;
  shortTitle: string;
  question: string;
  conclusion: string;
  evidence: string[];
  commonMistake: string;
};

export type PVTScenario = {
  name: string;
  condition: string;
  meaning: string;
};

export type PVTRiskRewardZoneData = {
  currentPrice: number;
  supportPrice: number;
  resistancePrice: number;
  upside: string;
  downside: string;
  conclusion: string;
};

export type PVTFomoData = {
  level: "Thấp" | "Trung bình" | "Cao";
  score: number;
  maxScore: number;
  signs: string[];
  conclusion: string;
};

export type PVTLogicMetric = {
  id: string;
  label: string;
  value: string;
  rawValue: number | null;
  status: PVTStatus;
  dataQuality: string;
  warning: string | null;
  missingFields: string[];
};

export type PVTLogicSummary = {
  metrics: PVTLogicMetric[];
  liquidityRisk: {
    level: "low" | "medium" | "high" | "critical" | "unknown";
    score: number | null;
    warnings: string[];
    missingFields: string[];
  };
  dataQualityRisk: {
    level: "low" | "medium" | "high" | "critical" | "unknown";
    score: number | null;
    warnings: string[];
    missingFields: string[];
  };
  warnings: string[];
  missingFields: string[];
};

export type PVTFinalConclusionData = {
  status: string;
  positive: string;
  caution: string;
  nextStep: string;
};

export type PVTNextAction = {
  label: string;
  moduleKey: "watchlist" | "risk" | "valuation" | "checklist";
  primary?: boolean;
};

export type PVTObservationData = {
  ticker: string;
  companyName: string;
  industry: string;
  currentPrice: number;
  status: {
    label: string;
    tone: PVTStatusTone;
    conclusion: string;
  };
  keyLevels: {
    support: string;
    resistance: string;
  };
  volume: {
    currentVsAvg20: number;
    label: string;
    conclusion: string;
  };
  chart: {
    title: string;
    points: PVTObservationPoint[];
    events: PVTObservationEvent[];
    quickRead: Array<{
      question: string;
      answer: string;
    }>;
  };
  signalLayers: PVTSignalLayer[];
  confirmation: string[];
  invalidation: string[];
  scenarios: PVTScenario[];
  riskReward: PVTRiskRewardZoneData;
  fomo: PVTFomoData;
  logicSummary?: PVTLogicSummary;
  finalConclusion: PVTFinalConclusionData;
  nextActions: PVTNextAction[];
};
