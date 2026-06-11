import type { ButtonHTMLAttributes } from "react";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export type StepStatus =
  | "Chưa làm"
  | "Đang làm"
  | "Đã hoàn thành"
  | "Cần xem lại";

export type ActionItem = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
};

export type FieldItem = {
  label: string;
  value: string;
  tone?: Tone;
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

export type SimulationHeaderData = {
  moduleName: string;
  subtitle: string;
  ticker: string;
  companyName: string;
  industry: string;
  mode: string;
  status: string;
  actions: ActionItem[];
};

export type QuickSummaryData = {
  title: string;
  description: string;
  icon: string;
  answers: FieldItem[];
  metrics: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    status: string;
  }>;
};

export type JourneyStep = {
  order: number;
  title: string;
  question: string;
  status: StepStatus;
  sourceModule?: string;
};

export type JourneyData = {
  title: string;
  description: string;
  steps: JourneyStep[];
};

export type SimulationLevel = {
  id: string;
  label: string;
  description: string;
  items: FieldItem[];
};

export type SectionData = {
  id: string;
  icon: string;
  title: string;
  description: string;
  tutor?: TutorNoteData;
  details?: string[];
};

export type ChecklistSectionData = SectionData & {
  items: Array<{ label: string; checked: boolean; source: string }>;
  actions: ActionItem[];
};

export type ModeSectionData = SectionData & {
  modes: Array<{
    title: string;
    description: string;
    suitableFor: string[];
    notSuitableFor: string[];
    active?: boolean;
  }>;
};

export type ReflectionSectionData = SectionData & {
  prompts: string[];
  guidance?: string;
  placeholder: string;
};

export type PositionSectionData = SectionData & {
  fields: FieldItem[];
  reminder: string;
};

export type PortfolioSectionData = SectionData & {
  questions: FieldItem[];
};

export type MilestoneSectionData = SectionData & {
  milestones: FieldItem[];
};

export type PerformanceSectionData = SectionData & {
  metrics: FieldItem[];
  benchmarks: FieldItem[];
  causes: FieldItem[];
};

export type AbnormalMoveSectionData = SectionData & {
  signal: FieldItem[];
  hypotheses: string[];
  checks: FieldItem[];
};

export type ScenarioSectionData = SectionData & {
  scenarios: Array<{
    title: string;
    questions: string[];
    moduleToReview: string;
    tone: Tone;
  }>;
};

export type CaseStudySectionData = SectionData & {
  flow: string[];
  caseTypes: string[];
};

export type JournalSectionData = SectionData & {
  journalFields: string[];
  reviewQuestions: string[];
  resultTypes: FieldItem[];
};

export type NavigationSectionData = SectionData & {
  directions: FieldItem[];
  reminder: string;
};

export type OutputSummaryData = SectionData & {
  fields: string[];
  readiness: FieldItem[];
};

export type SimulationDisclaimerData = {
  title: string;
  content: string;
};

export type SimulationNextActionsData = {
  title: string;
  description: string;
  actions: Array<ActionItem & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">>;
};

export type SimulationPageData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  detailLabels: DetailLabels;
  header: SimulationHeaderData;
  quickSummary: QuickSummaryData;
  journey: JourneyData;
  levels: SimulationLevel[];
  precheck: ChecklistSectionData;
  modes: ModeSectionData;
  thesis: ReflectionSectionData;
  position: PositionSectionData;
  portfolio: PortfolioSectionData;
  milestones: MilestoneSectionData;
  performance: PerformanceSectionData;
  abnormalMove: AbnormalMoveSectionData;
  scenarios: ScenarioSectionData;
  caseStudy: CaseStudySectionData;
  journal: JournalSectionData;
  navigation: NavigationSectionData;
  outputSummary: OutputSummaryData;
  disclaimer: SimulationDisclaimerData;
  nextActions: SimulationNextActionsData;
};

export type SimulationModeId = "current" | "scenario" | "history";

export type SimulationStatus =
  | "Chưa đủ điều kiện tạo mô phỏng"
  | "Có thể mô phỏng với cảnh báo"
  | "Sẵn sàng tạo mô phỏng"
  | "Đang theo dõi thesis"
  | "Cần cập nhật sau dữ liệu mới"
  | "Đến hạn hậu kiểm"
  | "Đã hậu kiểm";

export type SimulationPhaseId =
  | "prepare"
  | "thesis"
  | "position"
  | "tracking"
  | "review";

export type SimulationPhaseStatus = "Chưa làm" | "Đang làm" | "Tạm đủ" | "Cần bổ sung";

export type ThesisHealth =
  | "Chưa có thesis"
  | "Cần kiểm tra thêm"
  | "Đang đứng vững"
  | "Yếu đi"
  | "Cần cập nhật sau dữ liệu mới";

export type SimulationThesisFormState = {
  mainThesis: string;
  whyFollow: string;
  confirmingData: string;
  disconfirmingData: string;
  mainRisk: string;
  weakenCondition: string;
  reviewDate: string;
  moduleToRecheck: string;
};

export type SimulationPositionState = {
  capital: number;
  weight: number;
  referencePrice: number;
  created: boolean;
};

export type SimulationPvtInterpretation =
  | "Biến động chưa ảnh hưởng thesis"
  | "Biến động xác nhận thesis"
  | "Biến động làm thesis yếu đi"
  | "Cần kiểm tra thêm ở PVT"
  | "Cần kiểm tra thêm ở Tin tức/Rủi ro";

export type ScenarioThesisResult =
  | "Thesis vẫn đứng vững"
  | "Thesis yếu đi nhưng chưa gãy"
  | "Thesis bị phủ định một phần"
  | "Cần quay lại module liên quan";

export type ReflectionState = {
  initialThought: string;
  supportingData: string;
  weakeningData: string;
  emotionCheck: string;
  processLesson: string;
  nextCheck: string;
  completed: boolean;
};

export type SimulationModeChoice = {
  id: SimulationModeId;
  title: string;
  description: string;
  bestFor: string[];
  primaryOutput: string;
};

export type SimulationChecklistItem = {
  label: string;
  sourceModule: string;
  status: "Đã có" | "Cần bổ sung" | "Chưa rõ";
  note: string;
};

export type PVTCompactData = {
  toggles: string[];
  cards: FieldItem[];
  questions: string[];
};

export type ReviewMilestoneGroup = {
  title: string;
  examples: string[];
};

export type SimulationJournalPrompt = {
  label: string;
  prompt: string;
};

export type CurrentSimulationData = {
  stock: {
    ticker: string;
    companyName: string;
    industry: string;
    startDate: string;
    startPrice: number;
    currentPrice: number;
    followedDays: string;
    thesisStatus: string;
  };
  flow: string[];
  precheck: SimulationChecklistItem[];
  thesisPrompts: string[];
  pvt: PVTCompactData;
  defaultCapital: number;
  defaultWeight: number;
  reviewMilestones: ReviewMilestoneGroup[];
  dashboard: {
    header: FieldItem[];
    thesisPanel: FieldItem[];
    positionNotes: FieldItem[];
  };
  journalPrompts: SimulationJournalPrompt[];
};

export type ScenarioImpactLevel = {
  label: string;
  description: string;
  value: string;
};

export type ScenarioGroup = {
  id: string;
  title: string;
  examples: string[];
};

export type ScenarioModeData = {
  steps: string[];
  groups: ScenarioGroup[];
  impactLevels: ScenarioImpactLevel[];
  transmissionExample: string[];
  tutorQuestions: string[];
  outputFields: string[];
};

export type HistoricalCaseCard = {
  id: string;
  caseName: string;
  tickerOrGroup: string;
  startPoint: string;
  type: string;
  mainLesson: string;
  difficulty: string;
  lockedData: string;
  skill: string;
};

export type HistoricalCaseData = {
  zones: string[];
  cases: HistoricalCaseCard[];
  lockedWorkspace: {
    asOfDate: string;
    warning: string;
    tabs: FieldItem[];
  };
  decisionOptions: string[];
  requiredFields: string[];
  replayTimeline: Array<{
    milestone: string;
    newData: string[];
    reflectionQuestion: string;
  }>;
  postReviewTypes: FieldItem[];
};

export type SimulationExperienceData = {
  title: string;
  subtitle: string;
  modePrompt: string;
  modes: SimulationModeChoice[];
  current: CurrentSimulationData;
  scenario: ScenarioModeData;
  history: HistoricalCaseData;
  disclaimer: SimulationDisclaimerData;
  paperTrading: PaperTradingData;
};

export type SimulatedOrderSide = "buy" | "sell";

export type SimulatedOrderStatus = "draft" | "submitted" | "filled" | "cancelled";

export type SimulatedPositionStatus =
  | "normal"
  | "near_stop_loss"
  | "near_target"
  | "profit"
  | "loss"
  | "need_review"
  | "low_liquidity";

export type SimulatedStockStatus =
  | "watching"
  | "has_position"
  | "near_stop_loss"
  | "near_target"
  | "low_liquidity"
  | "need_review";

export interface SimulatedAccountSummary {
  totalCapital: number;
  cash: number;
  positionValue: number;
  unrealizedPnLPercent: number;
  realizedPnLPercent: number;
  capitalUsagePercent: number;
  openPositions: number;
  closedOrders: number;
  updatedAt: string;
}

export interface SimulatedStockQuote {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  tradingValue: number;
  liquidityLabel: "Thấp" | "Trung bình" | "Cao";
  ma20Status: "Trên MA20" | "Dưới MA20" | "Sát MA20";
  ma50Status: "Trên MA50" | "Dưới MA50" | "Sát MA50";
  volumeVsAvg20: number;
  status: SimulatedStockStatus;
}

export interface SimulatedOrder {
  id: string;
  symbol: string;
  side: SimulatedOrderSide;
  price: number;
  quantity: number;
  value: number;
  fee: number;
  tax?: number;
  stopLoss?: number;
  target?: number;
  reason: string;
  status: SimulatedOrderStatus;
  createdAt: string;
}

export interface SimulatedPosition {
  id: string;
  symbol: string;
  name: string;
  openedAt: string;
  averagePrice: number;
  currentPrice: number;
  quantity: number;
  marketValue: number;
  weight: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  stopLoss?: number;
  target?: number;
  status: SimulatedPositionStatus;
  openReason: string;
}

export interface ClosedSimulatedPosition {
  id: string;
  symbol: string;
  name: string;
  openedAt: string;
  closedAt: string;
  openPrice: number;
  closePrice: number;
  quantity: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  closeReason: string;
  lesson: string;
}

export interface SimulationHistoryEvent {
  id: string;
  timestamp: string;
  symbol?: string;
  type:
    | "order_created"
    | "position_opened"
    | "stop_loss_updated"
    | "target_updated"
    | "note_added"
    | "position_closed"
    | "scenario_reviewed";
  title: string;
  description: string;
}

export interface PossibleScenario {
  id: string;
  symbol: string;
  type:
    | "positive"
    | "base"
    | "negative"
    | "stop_loss"
    | "target"
    | "low_liquidity"
    | "market_risk"
    | "behavior";
  title: string;
  condition: string;
  signalsToWatch: string[];
  impactOnPosition: string;
  suggestedSimulationResponse: string;
  relatedModules: string[];
}

export interface PaperTradingData {
  account: SimulatedAccountSummary;
  quotes: SimulatedStockQuote[];
  openPositions: SimulatedPosition[];
  closedPositions: ClosedSimulatedPosition[];
  historyEvents: SimulationHistoryEvent[];
  scenarios: PossibleScenario[];
}
