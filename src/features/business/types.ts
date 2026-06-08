export type BusinessStatus = "Đang phân tích" | "Cần bổ sung dữ liệu" | "Hoàn thành";
export type StepStatus = "Chưa làm" | "Đang làm" | "Đã hoàn thành" | "Cần kiểm tra thêm";
export type AssessmentTone = "success" | "warning" | "danger" | "neutral" | "accent";

export type BusinessAction = {
  label: string;
  variant: "primary" | "secondary" | "ghost";
};

export type BusinessHeaderData = {
  moduleName: string;
  ticker: string;
  companyName: string;
  industry: string;
  status: BusinessStatus;
  businessType: string;
  assumedRiskProfile: string;
  previousModuleLink: string;
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
  metrics: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    status: string;
  }>;
  items: BusinessQuickSummaryItem[];
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

export type FieldItem = {
  label: string;
  value: string;
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
  columns: {
    label: string;
    value: string;
  };
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

export type BusinessSectionLabels = {
  aiTitle: string;
  userInputDefault: string;
  evidenceLabel: string;
  assessmentLabel: string;
  warningLabel: string;
};

export type BusinessPageData = {
  isLoading: boolean;
  loading: BusinessLoadingData;
  emptyState: BusinessEmptyStateData;
  header: BusinessHeaderData;
  quickSummary: BusinessQuickSummaryData;
  progress: BusinessProgressData;
  labels: BusinessSectionLabels;
  contentHeader: {
    eyebrow: string;
    title: string;
    description: string;
    icon: string;
  };
  identity: BusinessIdentityData;
  businessType: BusinessTypeData;
  productCustomer: ProductCustomerData;
  revenueSource: RevenueSourceData;
  drivers: DriverData;
  valueChain: ValueChainData;
  ecosystem: EcosystemData;
  governance: GovernanceData;
  capitalAllocation: CapitalAllocationData;
  industryThesis: IndustryThesisLinkData;
  competitiveAdvantage: CompetitiveAdvantageData;
  scalability: ScalabilityData;
  risks: BusinessRiskData;
  disclaimer: BusinessDisclaimerData;
  nextActions: BusinessNextActionsData;
};
