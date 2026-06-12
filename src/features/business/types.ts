export type BusinessStatus = "Đang phân tích" | "Cần bổ sung dữ liệu" | "Hoàn thành";
export type StepStatus = "Chưa làm" | "Đang làm" | "Đã hoàn thành" | "Cần kiểm tra thêm";
export type AssessmentTone = "success" | "warning" | "danger" | "neutral" | "accent";
export type BusinessMetricStatus = "good" | "watch" | "risk" | "unknown";

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

export type BusinessOperatingMetric = {
  id: string;
  label: string;
  value: string;
  period: string;
  status: BusinessMetricStatus;
  explanation: string;
  isMock?: boolean;
  detail: {
    definition: string;
    whyItMatters: string;
    bctcCheck: string[];
    commonMistake: string;
  };
};

export type BusinessMoneyMachineNode = {
  id: string;
  label: string;
  description: string;
  relatedMetrics: string[];
  bctcChecks: string[];
  riskNote?: string;
};

export type BusinessReadinessItem = {
  id: string;
  label: string;
  status: "done" | "missing" | "needs_check";
  helperText: string;
};

export type BusinessDashboardData = {
  identity: {
    ticker: string;
    companyName: string;
    industry: string;
    model: string;
    customers: string;
    beginnerFit: string;
  };
  moneyMachine: BusinessMoneyMachineNode[];
  operatingMetrics: BusinessOperatingMetric[];
  advantages: Array<{ title: string; description: string; module: string }>;
  risks: Array<{ title: string; description: string; module: string }>;
  readiness: BusinessReadinessItem[];
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
  dashboard: BusinessDashboardData;
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

export type BusinessVerificationModule = "Báo cáo tài chính" | "Phân tích ngành" | "Rủi ro" | "Định giá" | "Tin tức / sự kiện";

export type BusinessDeepDiveData = {
  title: string;
  plainLanguage?: string;
  checklist: string[];
  realWorldSignals: string[];
  verifyIn: BusinessVerificationModule[];
};

export type BusinessJourneySectionBase = {
  id: string;
  question: string;
  shortExplanation: string;
  example: string;
  practicalConclusion: string;
  beginnerRemember: string;
  deepDive: BusinessDeepDiveData;
};

export type BusinessJourneyIdentityData = BusinessJourneySectionBase & {
  ticker: string;
  companyName: string;
  businessType: string;
  simpleDescription: string;
  modelTags: string[];
  cycleType: string;
  coreMessage: string;
};

export type BusinessJourneyCustomersData = BusinessJourneySectionBase & {
  mainCustomers: string[];
  whatTheyBuy: string[];
  whyTheyBuy: string[];
  repeatBehavior: string;
  priceSensitivity: string;
};

export type BusinessJourneyMoneyMachineData = BusinessJourneySectionBase & {
  inputs: string[];
  operations: string[];
  salesChannels: string[];
  cashCollection: string[];
  expansionMethod: string[];
  bottlenecks: string[];
};

export type BusinessJourneyAdvantageItem = {
  advantageName: string;
  howItCreatesMoney: string;
  whatToQuestion: string;
  durabilityLevel: "Cần kiểm chứng" | "Tương đối bền" | "Dễ bị sao chép";
};

export type BusinessJourneyCompetitiveAdvantageData = BusinessJourneySectionBase & {
  advantages: BusinessJourneyAdvantageItem[];
};

export type BusinessJourneyStrategyData = BusinessJourneySectionBase & {
  strategicDirection: string[];
  executionCapability: string[];
  capitalAllocationNotes: string[];
  leadershipConcerns: string[];
  shareholderAlignment: string;
};

export type BusinessJourneyRiskItem = {
  riskName: string;
  riskType: string;
  whyItMatters: string;
  realWorldSignals: string[];
  severity: "Cần theo dõi" | "Quan trọng" | "Cảnh báo";
  practicalConclusion: string;
};

export type BusinessJourneyRiskData = BusinessJourneySectionBase & {
  risks: BusinessJourneyRiskItem[];
};

export type BusinessJourneyBridgeData = {
  title: string;
  businessUnderstandingSummary: string;
  strengthsToVerify: string[];
  weaknessesToVerify: string[];
  financialMetricsToCheck: string[];
  nextModuleSuggestion: string;
};

export type BusinessJourneyData = {
  isLoading: boolean;
  loading: BusinessLoadingData;
  emptyState: BusinessEmptyStateData;
  businessIdentity: BusinessJourneyIdentityData;
  customers: BusinessJourneyCustomersData;
  moneyMachine: BusinessJourneyMoneyMachineData;
  competitiveAdvantage: BusinessJourneyCompetitiveAdvantageData;
  strategyAndLeadership: BusinessJourneyStrategyData;
  nonFinancialRisks: BusinessJourneyRiskData;
  bridgeToFinancialStatements: BusinessJourneyBridgeData;
  beginnerSummary: string[];
};
