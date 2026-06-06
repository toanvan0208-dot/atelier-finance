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
