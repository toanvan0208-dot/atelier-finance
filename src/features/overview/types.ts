export type OverviewStepStatus =
  | "not_started"
  | "in_progress"
  | "needs_check"
  | "draft_done"
  | "warning";

export type OverviewPriority = "low" | "medium" | "high";

export type OverviewAlertSeverity = "soft" | "watch" | "important";

export type OverviewPipelineStep = {
  id: string;
  label: string;
  moduleKey: string;
  status: OverviewStepStatus;
  shortOutput: string;
  ctaLabel: string;
};

export type OverviewCurrentCase = {
  hasCase: boolean;
  ticker?: string;
  companyName?: string;
  industry?: string;
  currentStage: string;
  progressLabel: string;
  temporaryThesis?: string;
  missingData: string[];
  mainWarning?: string;
};

export type OverviewNextAction = {
  id: string;
  title: string;
  relatedModule: string;
  reason: string;
  priority: OverviewPriority;
  primaryAction: string;
  secondaryAction?: string;
  targetModuleKey?: string;
  secondaryTargetModuleKey?: string;
};

export type OverviewMissingDataItem = {
  id: string;
  label: string;
  relatedModule: string;
  reason: string;
  ctaLabel: string;
  moduleKey: string;
};

export type OverviewProfileStatus = {
  status: "complete" | "incomplete" | "needs_update";
  summary: string;
  ctaLabel: string;
  moduleKey: string;
};

export type OverviewAlert = {
  id: string;
  title: string;
  severity: OverviewAlertSeverity;
  relatedModule: string;
  reason: string;
  ctaLabel: string;
  moduleKey: string;
};

export type OverviewWatchlistIdea = {
  ticker: string;
  company: string;
  currentStep: string;
  mainWarning: string;
  nextAction: string;
  moduleKey: string;
};

export type OverviewLearningLesson = {
  title: string;
  duration: string;
  reason: string;
  moduleKey: string;
};

export type OverviewPracticeItem = {
  id: string;
  title: string;
  status: string;
  helperText: string;
  ctaLabel: string;
  moduleKey: string;
};

export type OverviewState = {
  isMock: boolean;
  currentCase: OverviewCurrentCase;
  nextAction: OverviewNextAction;
  pipeline: OverviewPipelineStep[];
  missingData: OverviewMissingDataItem[];
  profileStatus: OverviewProfileStatus;
  alerts: OverviewAlert[];
  watchlist: {
    total: number;
    ideas: OverviewWatchlistIdea[];
  };
  learning: {
    currentStep: string;
    lessons: OverviewLearningLesson[];
  };
  practice: OverviewPracticeItem[];
  disclaimer: string;
};

export type OverviewCaseStatus =
  | "Mới bắt đầu phân tích"
  | "Đang kiểm chứng dữ liệu"
  | "Có thesis sơ bộ nhưng chưa đủ tin cậy"
  | "Đủ để đưa vào Watchlist"
  | "Sẵn sàng sang Kiểm tra cổ phiếu"
  | "Cần quay lại phân tích";

export type OverviewCaseData = {
  ticker: string;
  companyName: string;
  industry: string;
  caseStatus: OverviewCaseStatus;
  currentStage: string;
  temporaryThesis: string;
  mainWarning: string;
  notReadyFor: string[];
};

export type OverviewNextBestAction = {
  title: string;
  module: string;
  reason: string;
  priority: "Cao" | "Vừa" | "Thấp";
  cta: {
    label: string;
    moduleKey: string;
  };
  secondaryActions: Array<{
    title: string;
    moduleKey: string;
  }>;
};

export type OverviewBottleneck = {
  title: string;
  whyItMatters: string;
  consequence: string;
  priority: "Cao" | "Vừa" | "Thấp";
  targetModule: string;
  moduleKey: string;
};

export type OverviewProgressStatus =
  | "Hoàn thành sơ bộ"
  | "Đang làm"
  | "Thiếu dữ liệu"
  | "Chưa làm"
  | "Cần quay lại"
  | "Khóa/chưa đủ điều kiện";

export type OverviewProgressMapItem = {
  id: string;
  title: string;
  status: OverviewProgressStatus;
  summary: string;
  moduleKey: string;
};

export type OverviewActionStatusData = {
  canDo: string[];
  shouldNotDoYet: string[];
  unlockConditions: string[];
  conclusion: string;
};

export type OverviewSupportData = {
  watchlist: Array<{
    ticker: string;
    status: string;
    note: string;
  }>;
  learning: Array<{
    title: string;
    reason: string;
    moduleKey: string;
  }>;
  profile: {
    status: string;
    message: string;
    moduleKey: string;
  };
};

export type OverviewCaseDashboardData = {
  activeCase: OverviewCaseData;
  nextBestAction: OverviewNextBestAction;
  missingData: OverviewBottleneck[];
  progressMap: OverviewProgressMapItem[];
  actionStatus: OverviewActionStatusData;
  support: OverviewSupportData;
  disclaimer: string;
};
