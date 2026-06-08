export type OverviewStatus =
  | "Chưa bắt đầu"
  | "Đang làm"
  | "Đã hoàn thành"
  | "Cần xem lại"
  | "Thiếu dữ liệu"
  | "Chưa sẵn sàng"
  | "Xuyên suốt";

export type OverviewModule = {
  id: string;
  name: string;
  group: "Chuẩn bị" | "Phân tích" | "Thực hành & quyết định";
  status: OverviewStatus;
  goal: string;
  action: string;
  moduleKey: string;
  completedSteps: number;
  totalSteps: number;
  missingData?: string;
};

export type OverviewState = {
  userStage: string;
  totalProgress: {
    completedSteps: number;
    totalSteps: number;
  };
  nextBestAction: {
    title: string;
    reason: string;
    priority: string;
    relatedModule: string;
    primaryAction: string;
    primaryModuleKey: string;
    secondaryAction: string;
    secondaryModuleKey: string;
  };
  investorProfile: {
    goal: string;
    riskAppetite: string;
    timeHorizon: string;
    financialKnowledge: string;
    decisionHabit: string;
    behaviorFlags: string[];
  };
  learning: {
    recommendedLessons: Array<{
      title: string;
      duration: string;
      usedIn: string;
    }>;
    weakTopics: string[];
  };
  modules: OverviewModule[];
  macroSector: {
    supports: string[];
    pressures: string[];
    sectorsToReview: string[];
    emptyState: string;
  };
  watchlist: {
    total: number;
    newlyAdded: number;
    missingThesis: number;
    needReview: number;
    readyForSimulation: number;
    paused: number;
    ideas: Array<{
      ticker: string;
      company: string;
      status: string;
      missing: string;
      nextStep: string;
    }>;
  };
  practice: Array<{
    title: string;
    goal: string;
    metric: string;
    secondaryMetric: string;
    action: string;
    moduleKey: string;
  }>;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    module: string;
    action: string;
    moduleKey: string;
  }>;
};
