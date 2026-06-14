export type FinancialDataStatus = "Đầy đủ" | "Thiếu dữ liệu" | "Cần kiểm tra thêm";
export type StepStatus = "Chưa làm" | "Đang làm" | "Đã hoàn thành" | "Cần kiểm tra thêm";
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "accent";
export type ChecklistStatus = "Đã hiểu" | "Cần xem lại" | "Chưa rõ";

export type FinancialAction = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
};

export type FinancialsHeaderData = {
  moduleName: string;
  ticker: string;
  companyName: string;
  industry: string;
  reportPeriod: string;
  dataStatus: FinancialDataStatus;
  previousModuleLink: string;
  actions: FinancialAction[];
};

export type QuickSummaryItem = {
  question: string;
  answer: string;
  status: string;
  tone: StatusTone;
};

export type QuickSummaryMetric = {
  title: string;
  value: string;
  description: string;
  icon: string;
  status: string;
};

export type FinancialsQuickSummaryData = {
  title: string;
  description: string;
  icon: string;
  metrics: QuickSummaryMetric[];
  items: QuickSummaryItem[];
};

export type ProgressStep = {
  order: number;
  title: string;
  status: StepStatus;
};

export type FinancialsProgressData = {
  title: string;
  description: string;
  steps: ProgressStep[];
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

export type FieldItem = {
  label: string;
  value: string;
  tone?: StatusTone;
};

export type SeriesPoint = {
  label: string;
  value: number;
};

export type LineSeries = {
  name: string;
  tone: StatusTone;
  points: SeriesPoint[];
};

export type BarSeries = {
  label: string;
  value: number;
  tone: StatusTone;
};

export type StatementRow = {
  item: string;
  value: string;
  note: string;
};

export type FinancialBlockBase = {
  title: string;
  description: string;
  icon: string;
  tutor?: TutorNoteData;
};

export type FinancialSnapshotData = FinancialBlockBase & {
  statusLabel: string;
  status: string;
  lineChartTitle: string;
  barChartTitle: string;
  lineSeries: LineSeries[];
  barSeries: BarSeries[];
  metrics: FieldItem[];
  details: string[];
  detailLabels: DetailLabels;
};

export type IncomeStatementData = FinancialBlockBase & {
  tableCaption: string;
  flowTitle: string;
  checkQuestion: string;
  columns: {
    item: string;
    value: string;
    note: string;
  };
  rows: StatementRow[];
  flow: string[];
};

export type BalanceSheetData = FinancialBlockBase & {
  equation: string;
  groups: Array<{
    title: string;
    items: FieldItem[];
  }>;
};

export type CashFlowData = FinancialBlockBase & {
  cards: FieldItem[];
};

export type ProfitToCashData = FinancialBlockBase & {
  classificationLabel: string;
  classification: string;
  tone: StatusTone;
  lineSeries: LineSeries[];
  fields: FieldItem[];
};

export type EarningsQualityData = FinancialBlockBase & {
  classificationLabel: string;
  classification: string;
  tone: StatusTone;
  fields: FieldItem[];
};

export type DebtStructureData = FinancialBlockBase & {
  classificationLabel: string;
  classification: string;
  tone: StatusTone;
  fields: FieldItem[];
  timelineTitle: string;
  timeline: FieldItem[];
  details: string[];
  detailLabels: DetailLabels;
};

export type WorkingCapitalData = FinancialBlockBase & {
  classificationLabel: string;
  classification: string;
  tone: StatusTone;
  flow: string[];
  fields: FieldItem[];
};

export type CapitalAllocationFinancialsData = FinancialBlockBase & {
  classificationLabel: string;
  classification: string;
  tone: StatusTone;
  fields: FieldItem[];
};

export type RatioItem = {
  name: string;
  value: string;
  trend: string;
  industryCompare: string;
  explanation: string;
  status: string;
  tone: StatusTone;
};

export type RatioGroup = {
  value: string;
  title: string;
  question: string;
  ratios: RatioItem[];
};

export type FinancialRatioGroupsData = FinancialBlockBase & {
  groups: RatioGroup[];
  details: string[];
  detailLabels: DetailLabels;
};

export type IndustryCriteriaGroup = {
  value: string;
  title: string;
  criteria: string[];
};

export type IndustrySpecificFinancialsData = FinancialBlockBase & {
  groups: IndustryCriteriaGroup[];
  details: string[];
  detailLabels: DetailLabels;
};

export type FinancialWarningSignsData = FinancialBlockBase & {
  classificationLabel: string;
  classification: string;
  warning: string;
  tone: StatusTone;
  items: string[];
  visibleItemCount: number;
  detailLabels: DetailLabels;
};

export type ValuationBridgeItem = {
  source: string;
  usage: string;
};

export type ValuationBridgeData = FinancialBlockBase & {
  rows: ValuationBridgeItem[];
  columns: {
    source: string;
    usage: string;
  };
  tableCaption: string;
  details: string[];
  detailLabels: DetailLabels;
};

export type PersonalFinancialsThesisData = FinancialBlockBase & {
  prompts: string[];
  placeholder: string;
};

export type FinancialChecklistItem = {
  text: string;
  status: ChecklistStatus;
};

export type FinancialChecklistData = FinancialBlockBase & {
  items: FinancialChecklistItem[];
};

export type FinancialsDisclaimerData = {
  title: string;
  icon: string;
  content: string;
};

export type FinancialsNextActionsData = {
  title: string;
  description: string;
  icon: string;
  actions: FinancialAction[];
};

export type FinancialMetricStatus =
  | "good"
  | "watch"
  | "risk"
  | "neutral"
  | "unknown";

export type FinancialCoreMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  period: string;
  change?: string;
  status: FinancialMetricStatus;
  explanation: string;
  source?: string;
  updatedAt?: string;
  isMock?: boolean;
  detail?: {
    definition: string;
    whyItMatters: string;
    relatedStatement: string;
    commonMistake: string;
  };
};

export type FinancialWarningSignal = {
  id: string;
  title: string;
  severity: "light" | "watch" | "serious";
  explanation: string;
  targetBlockId: string;
  ctaLabel: string;
};

export type FinancialPriorityReadingItem = {
  id: string;
  priority: string;
  target: string;
  reason: string;
  targetBlockId: string;
};

export type FinancialHealthCommandCenterData = {
  title: string;
  ticker: string;
  companyName: string;
  period: string;
  healthStatus: "Khỏe sơ bộ" | "Cần theo dõi" | "Có rủi ro" | "Dữ liệu trái chiều" | "Chưa đủ dữ liệu";
  score: number;
  conclusion: string;
  warning: string;
  isMock?: boolean;
  metrics: FinancialCoreMetric[];
  warningSignals: FinancialWarningSignal[];
  priorityReadingPath: FinancialPriorityReadingItem[];
  valuationReadinessSummary: {
    completed: number;
    total: number;
    status: "Có thể sang định giá" | "Nên kiểm tra thêm" | "Chưa đủ điều kiện";
    helperText: string;
  };
};

export type BusinessHypothesisCheckStatus =
  | "confirmed"
  | "not_confirmed"
  | "watch"
  | "risk"
  | "missing_data";

export type BusinessHypothesisFinancialCheck = {
  id: string;
  hypothesis: string;
  financialDataToCheck: string[];
  preliminaryResult: string;
  status: BusinessHypothesisCheckStatus;
  targetBlockId?: string;
  ctaLabel: string;
  isMock?: boolean;
  detail: {
    sourceHypothesis: string;
    financialLines: string[];
    currentEvidence: string;
    thesisImpact: string;
  };
};

export type BusinessHypothesisVerificationData = {
  title: string;
  description: string;
  warning: string;
  checks: BusinessHypothesisFinancialCheck[];
};

export type FinancialStatementMapItem = {
  id: string;
  title: string;
  mainQuestion: string;
  keyLines: string[];
  targetBlockId?: string;
};

export type FinancialStatementMapData = {
  title: string;
  description: string;
  items: FinancialStatementMapItem[];
  qualityNode: FinancialStatementMapItem;
};

export type FinancialConclusionCheckpointData = {
  title: string;
  status: "Xác nhận sơ bộ thesis" | "Chưa đủ dữ liệu" | "Có điểm cần theo dõi" | "Có rủi ro đáng chú ý";
  conclusion: string;
  supportingEvidence: string[];
  cautionPoints: string[];
  weakeningConditions: string[];
  ctaLabel: string;
};

export type ValuationReadinessItem = {
  id: string;
  label: string;
  status: "done" | "missing" | "needs_review";
  helperText: string;
};

export type ValuationReadinessData = {
  title: string;
  description: string;
  completed: number;
  total: number;
  status: "Có thể sang định giá" | "Nên kiểm tra thêm" | "Chưa đủ điều kiện";
  ctaLabel: string;
  disabledCtaLabel: string;
  helperText: string;
  items: ValuationReadinessItem[];
};

export type FinancialsPageData = {
  isLoading: boolean;
  loading: TutorNoteData;
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  header: FinancialsHeaderData;
  quickSummary: FinancialsQuickSummaryData;
  healthCommandCenter: FinancialHealthCommandCenterData;
  businessHypothesisVerification: BusinessHypothesisVerificationData;
  statementMap: FinancialStatementMapData;
  conclusionCheckpoint: FinancialConclusionCheckpointData;
  valuationReadiness: ValuationReadinessData;
  progress: FinancialsProgressData;
  snapshot: FinancialSnapshotData;
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
  profitToCash: ProfitToCashData;
  earningsQuality: EarningsQualityData;
  debtStructure: DebtStructureData;
  workingCapital: WorkingCapitalData;
  capitalAllocation: CapitalAllocationFinancialsData;
  ratios: FinancialRatioGroupsData;
  industrySpecific: IndustrySpecificFinancialsData;
  warningSigns: FinancialWarningSignsData;
  valuationBridge: ValuationBridgeData;
  personalThesis: PersonalFinancialsThesisData;
  checklist: FinancialChecklistData;
  disclaimer: FinancialsDisclaimerData;
  nextActions: FinancialsNextActionsData;
};

export type FinancialDeskMetricStatus = "good" | "watch" | "risk" | "neutral" | "unknown";

export type FinancialDeskMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  period: string;
  status: FinancialDeskMetricStatus;
  definition: string;
  howToRead: string;
  goodSignal: string;
  badSignal: string;
  dataQuality?: string;
  warning?: string | null;
  missingFields?: string[];
  logicKey?: string;
};

export type FinancialDeskWarning = {
  id: string;
  title: string;
  severity: "watch" | "risk" | "serious";
  summary: string;
  cause: string;
  targetStepId: string;
};

export type FinancialReadingStep = {
  id: string;
  order: number;
  title: string;
  status: "Đã kiểm tra" | "Đang đọc" | "Cần xem lại" | "Chưa đọc";
  mainQuestion: string;
  whyItMatters: string;
  metricIds: string[];
  readingGuide: string;
  goodSigns: string[];
  badSigns: string[];
  detailTitle: string;
};

export type FinancialStatementDeskItem = {
  id: string;
  title: string;
  mainQuestion: string;
  keyLines: string[];
  relatedMetricIds: string[];
};

export type FinancialConclusionReadiness =
  | "Có thể chuyển"
  | "Cần kiểm tra thêm"
  | "Chưa nên định giá";

export type FinancialValuationNavigationStatus = "ready" | "needs_review" | "not_ready";

export type FinancialReadingDeskData = {
  ticker: string;
  companyName: string;
  period: string;
  preliminaryConclusion: {
    status: string;
    summary: string;
    score: number;
    scoreNote: string;
  };
  nextReadingStep: {
    stepId: string;
    title: string;
    reason: string;
  };
  valuationReadiness: {
    status: FinancialConclusionReadiness;
    logicStatus: FinancialValuationNavigationStatus;
    canContinue: boolean;
    missing: string[];
    reason: string;
    nextStepSuggestion: string;
    usableMethods: string[];
  };
  warnings: FinancialDeskWarning[];
  metrics: FinancialDeskMetric[];
  statementMap: FinancialStatementDeskItem[];
  readingSteps: FinancialReadingStep[];
  cashQuality: {
    title: string;
    summary: string;
    checks: string[];
  };
  riskCheck: {
    title: string;
    summary: string;
    checks: string[];
  };
  conclusion: {
    confirmed: string[];
    notConfirmed: string[];
    weakeningSignals: string[];
    readiness: {
      status: FinancialConclusionReadiness;
      reason: string;
    };
  };
};
