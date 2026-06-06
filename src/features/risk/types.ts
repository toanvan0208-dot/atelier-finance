import type { ButtonHTMLAttributes } from "react";

export type RiskTone = "neutral" | "accent" | "success" | "warning" | "danger";
export type RiskStatus =
  | "Cần theo dõi"
  | "Cần kiểm tra thêm"
  | "Chưa phù hợp để quyết định vội";

export type RiskAction = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export type RiskFieldItem = {
  label: string;
  value: string;
  tone?: RiskTone;
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

export type RiskHeaderData = {
  moduleName: string;
  subtitle: string;
  ticker: string;
  companyName: string;
  industry: string;
  reviewStatus: string;
  previousContext: string;
  actions: RiskAction[];
};

export type RiskOverviewData = {
  title: string;
  description: string;
  icon: string;
  reminder: string;
  metrics: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    status: string;
  }>;
};

export type RiskJourneyStep = {
  order: number;
  title: string;
  question: string;
  status: RiskStatus;
  source: string;
  detailButtonLabel: string;
};

export type RiskJourneyData = {
  title: string;
  description: string;
  steps: RiskJourneyStep[];
};

export type RiskStatusLegendData = {
  title: string;
  description: string;
  items: Array<{
    status: RiskStatus;
    description: string;
    reason: string;
    source: string;
    nextCheck: string;
  }>;
};

export type RiskDetailGroup = {
  id: string;
  order: number;
  title: string;
  centralQuestion: string;
  plainExplanation: string;
  whyCare: string;
  dataToReview: string[];
  watchSigns: string[];
  checkFurther: string[];
  sourceModules: string[];
  sourceActionLabel: string;
  status: RiskStatus;
  statusReason: string;
  mainQuestions: string[];
  advancedQuestions: string[];
  evidence: RiskFieldItem[];
  tutor?: TutorNoteData;
  reflectionPrompt?: string;
};

export type RiskFinalNoteData = {
  title: string;
  description: string;
  readiness: RiskStatus;
  readinessReminder: string;
  fields: RiskFieldItem[];
  prompts: string[];
  placeholder: string;
};

export type RiskDisclaimerData = {
  title: string;
  content: string;
};

export type RiskNextActionsData = {
  title: string;
  description: string;
  actions: RiskAction[];
};

export type RiskPageData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  detailLabels: DetailLabels;
  header: RiskHeaderData;
  overview: RiskOverviewData;
  journey: RiskJourneyData;
  statusLegend: RiskStatusLegendData;
  riskGroups: RiskDetailGroup[];
  finalNote: RiskFinalNoteData;
  disclaimer: RiskDisclaimerData;
  nextActions: RiskNextActionsData;
};
