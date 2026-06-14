export type OverviewPriority = "low" | "medium" | "high";

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

export type OverviewSummaryCard = {
  id: "financial-health" | "valuation" | "risk" | "data-quality";
  title: string;
  status: string;
  value: string;
  summary: string;
  warnings: string[];
  missingFields: string[];
  nextChecks: string[];
  moduleKey: string;
};

export type OverviewCaseDashboardData = {
  activeCase: OverviewCaseData;
  nextBestAction: OverviewNextBestAction;
  summaryCards: OverviewSummaryCard[];
  missingData: OverviewBottleneck[];
  progressMap: OverviewProgressMapItem[];
  actionStatus: OverviewActionStatusData;
  support: OverviewSupportData;
  disclaimer: string;
};
