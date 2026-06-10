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
