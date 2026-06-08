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
};
