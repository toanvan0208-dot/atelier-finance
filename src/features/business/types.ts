export type BusinessStatus = "Đang phân tích" | "Cần bổ sung dữ liệu" | "Hoàn thành";
export type StepStatus = "Chưa làm" | "Đang làm" | "Đã hoàn thành" | "Cần kiểm tra thêm";
export type AssessmentTone = "success" | "warning" | "danger" | "neutral" | "accent";

export type BusinessAction = {
  label: string;
  description?: string;
  variant: "primary" | "secondary" | "ghost";
};

export type FieldItem = {
  label: string;
  value: string;
};

export type BusinessHeaderData = {
  moduleName: string;
  ticker: string;
  companyName: string;
  industry: string;
  status: BusinessStatus;
  businessType: string;
  beginnerFit: string;
  candidateStatus: string;
  description: string;
  actions: BusinessAction[];
};

export type BusinessQuickSummaryItem = {
  question: string;
  answer: string;
};

export type BusinessQuickSummaryData = {
  title: string;
  description: string;
  icon: string;
  items: BusinessQuickSummaryItem[];
  oneSentenceSummary: string;
};

export type BusinessConclusionData = {
  title: string;
  description: string;
  items: Array<{
    title: string;
    content: string;
  }>;
};

export type BusinessAnalysisBlock = {
  title: string;
  content: string;
  tone?: AssessmentTone;
  fields?: FieldItem[];
  bullets?: string[];
};

export type BusinessAnalysisGroup = {
  id: string;
  label: string;
  question: string;
  intro: string;
  blocks: BusinessAnalysisBlock[];
  output: string;
};

export type BusinessBctcBridgeItem = {
  question: string;
  module: string;
  dataToCheck: string[];
};

export type BusinessBctcBridgeData = {
  title: string;
  description: string;
  ctaLabel: string;
  disabledCtaLabel: string;
  items: BusinessBctcBridgeItem[];
};

export type BusinessMiniCheckData = {
  title: string;
  description: string;
  successMessage: string;
  failureMessage: string;
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>;
};

export type BusinessDisclaimerData = {
  title: string;
  icon: string;
  content: string;
};

export type BusinessNextActionsData = {
  title: string;
  description: string;
  icon: string;
  actions: BusinessAction[];
};

export type BusinessEmptyStateData = {
  title: string;
  description: string;
  icon: string;
};

export type BusinessLoadingData = {
  title: string;
  description: string;
};

export type BusinessPageData = {
  isLoading: boolean;
  loading: BusinessLoadingData;
  emptyState: BusinessEmptyStateData;
  header: BusinessHeaderData;
  quickSummary: BusinessQuickSummaryData;
  conclusion: BusinessConclusionData;
  groups: BusinessAnalysisGroup[];
  bctcBridge: BusinessBctcBridgeData;
  miniCheck: BusinessMiniCheckData;
  disclaimer: BusinessDisclaimerData;
  nextActions: BusinessNextActionsData;
};

export type BusinessProgressStep = {
  order: number;
  title: string;
  status: StepStatus;
};

export type BusinessProgressData = {
  title: string;
  description: string;
  steps: BusinessProgressStep[];
};

export type AiExplanationData = {
  title: string;
  content: string;
};

export type BusinessIdentityData = {
  title: string;
  description: string;
  icon: string;
  fields: FieldItem[];
  ai: AiExplanationData;
};

export type BusinessTypeTag = {
  value: string;
  label: string;
  description: string;
  isActive?: boolean;
};

export type BusinessTypeData = {
  title: string;
  description: string;
  icon: string;
  tags: BusinessTypeTag[];
};

export type ProductCustomerData = {
  title: string;
  description: string;
  icon: string;
  productsTitle: string;
  customersTitle: string;
  products: FieldItem[];
  customers: FieldItem[];
};

export type SegmentMixItem = {
  name: string;
  value: number;
  note: string;
};

export type RevenueSourceData = {
  title: string;
  description: string;
  icon: string;
  revenueTitle: string;
  profitTitle: string;
  fields: FieldItem[];
  revenueMix: SegmentMixItem[];
  profitMix: SegmentMixItem[];
  insufficientDataMessage: string;
};

export type DriverData = {
  title: string;
  description: string;
  icon: string;
  revenueTitle: string;
  costTitle: string;
  revenueDrivers: string[];
  costDrivers: string[];
  note: string;
};

export type DetailSectionData = {
  detailButtonLabel: string;
  collapseButtonLabel: string;
  detailChipLabel: string;
};

export type ValueChainData = {
  title: string;
  description: string;
  icon: string;
  chain: string[];
  activeNode: string;
  powerTitle: string;
  powerItems: FieldItem[];
  conclusion: string;
  details: string[];
  detailLabels: DetailSectionData;
};

export type EcosystemData = {
  title: string;
  description: string;
  icon: string;
  fields: FieldItem[];
  warningTitle: string;
  warning: string;
  details: string[];
  detailLabels: DetailSectionData;
};

export type GovernanceData = {
  title: string;
  description: string;
  icon: string;
  tableCaption: string;
  columns: { label: string; value: string };
  fields: FieldItem[];
  warningTitle: string;
  warning: string;
  details: string[];
  detailLabels: DetailSectionData;
};

export type CapitalAllocationData = {
  title: string;
  description: string;
  icon: string;
  items: FieldItem[];
  assessmentLabel: string;
  assessment: string;
  tone: AssessmentTone;
};

export type IndustryThesisLinkData = {
  title: string;
  description: string;
  icon: string;
  fields: FieldItem[];
};

export type CompetitiveAdvantageItem = {
  name: string;
  evidence: string;
  tone: AssessmentTone;
};

export type CompetitiveAdvantageData = {
  title: string;
  description: string;
  icon: string;
  items: CompetitiveAdvantageItem[];
  details: string[];
  detailLabels: DetailSectionData;
};

export type ScalabilityData = {
  title: string;
  description: string;
  icon: string;
  fields: FieldItem[];
  assessmentLabel: string;
  assessment: string;
  tone: AssessmentTone;
};

export type BusinessRiskItem = {
  title: string;
  description: string;
  level: string;
  tone: AssessmentTone;
};

export type BusinessRiskData = {
  title: string;
  description: string;
  icon: string;
  items: BusinessRiskItem[];
  details: string[];
  detailLabels: DetailSectionData;
};

export type BusinessSectionLabels = {
  aiTitle: string;
  userInputDefault: string;
  evidenceLabel: string;
  assessmentLabel: string;
  warningLabel: string;
};
