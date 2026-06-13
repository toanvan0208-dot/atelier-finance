import type { ButtonHTMLAttributes } from "react";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export type ActionItem = {
  label: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  disabled?: ButtonHTMLAttributes<HTMLButtonElement>["disabled"];
};

export type FieldItem = {
  label: string;
  value: string;
  tone?: Tone;
};

export type ModuleStatus =
  | "Chưa làm"
  | "Đang làm"
  | "Đã xong"
  | "Chưa sẵn sàng"
  | "Có thể chuyển tiếp"
  | "Đang mô phỏng"
  | "Đã hậu kiểm";

export type ModuleProgressItem = {
  moduleName: string;
  status: ModuleStatus;
  question: string;
  actionLabel: string;
};

export type WatchlistStatus =
  | "Mới thêm"
  | "Đang phân tích"
  | "Cần xem lại"
  | "Có sự kiện"
  | "Sẵn sàng mô phỏng"
  | "Đang mô phỏng"
  | "Tạm loại"
  | "Lưu trữ";

export type WatchlistPipelineStatus =
  | "new"
  | "analyzing"
  | "needs_review"
  | "ready_for_simulation"
  | "simulating"
  | "paused"
  | "archived";

export type WatchlistPriority = "low" | "medium" | "high";

export type WatchlistModuleKey =
  | "macro"
  | "industry"
  | "business"
  | "financials"
  | "valuation"
  | "technical"
  | "risk"
  | "checklist"
  | "simulation"
  | "journal";

export type ThesisStatus =
  | "missing"
  | "draft"
  | "testing"
  | "partially_confirmed"
  | "partially_rejected"
  | "paused";

export type WatchlistSortBy =
  | "priority"
  | "reviewDate"
  | "missingThesis"
  | "eventDate"
  | "progress"
  | "recentlyAdded";

export type WatchlistFilterState = {
  industry?: string;
  pipelineStatus?: WatchlistStatus | "all";
  priority?: string;
  missingModule?: string;
  mainRisk?: string;
  hasEvent?: boolean;
  thesisStatus?: ThesisStatus | "all";
  readyForSimulation?: boolean;
  pausedOnly?: boolean;
  fomoWarning?: boolean;
  search?: string;
  sortBy: WatchlistSortBy;
};

export type WatchlistActionQueueItem = {
  id: string;
  ticker: string;
  title: string;
  reason: string;
  priority: WatchlistPriority;
  relatedModule?: string;
  ctaLabel: string;
  moduleKey?: string;
  reviewDate?: string;
};

export type WatchlistJournalEntry = {
  id: string;
  ticker: string;
  createdAt: string;
  type:
    | "added"
    | "thesis_updated"
    | "module_completed"
    | "risk_found"
    | "valuation_updated"
    | "event_added"
    | "paused"
    | "resumed"
    | "personal_note";
  relatedModule?: string;
  content: string;
  previousStatus?: WatchlistStatus;
  nextStatus?: WatchlistStatus;
};

export type ActionableWatchlistStatus =
  | "Mới thêm"
  | "Đang phân tích"
  | "Cần xem lại"
  | "Sẵn sàng mô phỏng"
  | "Đang mô phỏng"
  | "Tạm loại";

export type WatchlistHeaderData = {
  moduleName: string;
  subtitle: string;
  totalIdeas: number;
  reviewCount: number;
  simulationReadyCount: number;
  actions: ActionItem[];
};

export type OverviewItem = {
  title: string;
  value: string;
  description: string;
  icon: string;
  status: string;
};

export type WatchlistGroup = {
  id: string;
  label: string;
  description: string;
  count: number;
};

export type WatchlistFiltersData = {
  title: string;
  description: string;
  filters: FieldItem[];
  sorts: string[];
};

export type AddStockIdeaFormData = {
  title: string;
  description: string;
  fields: string[];
  reasonSuggestions: string[];
  softWarning: string;
};

export type StockEvent = {
  label: string;
  date: string;
  tone: Tone;
};

export type SoftAlert = {
  title: string;
  content: string;
  tone: Tone;
};

export type WatchlistLogicSummary = {
  ticker: string;
  companyName: string;
  financialHealthStatus: string;
  financialHealthScore: number | null;
  financialHealthDetail: string;
  valuationReadiness: string;
  valuationConfidence: string;
  valuationDetail: string;
  overallRiskLevel: string;
  overallRiskScore: number | null;
  overallRiskDetail: string;
  dataQualityStatus: string;
  topWarnings: string[];
  missingFields: string[];
  nextChecks: string[];
  notFinancialAdvice: true;
};

export type StockIdea = {
  ticker: string;
  companyName: string;
  industry: string;
  exchange: string;
  currentPrice: string;
  recentMove: string;
  liquidity: string;
  addedDate: string;
  ideaSource: string;
  status: WatchlistStatus;
  priority: string;
  emotionalState: string;
  reason: string;
  validationQuestion: string;
  thesis: string;
  catalyst?: string;
  confirmingData: string[];
  invalidatingData: string[];
  risks: string[];
  missingModules: string[];
  completedModules: string[];
  dataToUpdate: string[];
  events: StockEvent[];
  latestNote: string;
  nextStep: string;
  readiness: string;
  moveToSimulation: string;
  pauseReason?: string;
  lesson?: string;
  tags: string[];
  progress: ModuleProgressItem[];
  alerts: SoftAlert[];
  actions: ActionItem[];
  logicSummary?: WatchlistLogicSummary;
};

export type TrackingProfileData = {
  title: string;
  fields: Array<keyof StockIdea | "modulesDone" | "modulesMissing" | "eventSummary">;
};

export type WatchlistDisclaimerData = {
  title: string;
  content: string;
};

export type WatchlistNextActionsData = {
  title: string;
  description: string;
  actions: ActionItem[];
};

export type SimulationTrackingItem = {
  ticker: string;
  companyName: string;
  thesisStatus: string;
  startedAt: string;
  startPrice: string;
  currentPrice: string;
  simulatedCapital: string;
  simulatedWeight: string;
  simulatedQuantity: string;
  nextReviewMilestone: string;
  journalStatus: string;
  requiredUpdate: string;
  linkedModules: string[];
  softWarning: string;
  actions: ActionItem[];
};

export type SimulationTrackingData = {
  title: string;
  description: string;
  emptyState: string;
  items: SimulationTrackingItem[];
};

export type WatchlistPageData = {
  isLoading: boolean;
  loading: {
    title: string;
    content: string;
  };
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  header: WatchlistHeaderData;
  overview: OverviewItem[];
  groups: WatchlistGroup[];
  filters: WatchlistFiltersData;
  addForm: AddStockIdeaFormData;
  selectedTicker: string;
  ideas: StockIdea[];
  profile: TrackingProfileData;
  simulationTracking: SimulationTrackingData;
  tutorNotes: string[];
  disclaimer: WatchlistDisclaimerData;
  nextActions: WatchlistNextActionsData;
};
