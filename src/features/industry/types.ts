import type { ButtonHTMLAttributes } from "react";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export type IndustryStatusLabel = "Đang phân tích" | "Cần bổ sung dữ liệu" | "Hoàn thành";
export type StepStatus = "Chưa làm" | "Đang làm" | "Đã hoàn thành" | "Cần kiểm tra thêm";

export type IndustryAction = {
  label: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  disabled?: ButtonHTMLAttributes<HTMLButtonElement>["disabled"];
};

export type IndustryOption = {
  id: string;
  name: string;
  shortName: string;
  industryType: string;
  status: IndustryStatusLabel;
  description: string;
  keyQuestions: string[];
  quickAnswers: QuickAnswer[];
  tutorNotes: string[];
};

export type FieldItem = {
  label: string;
  value: string;
  tone?: Tone;
};

export type IndustryHeaderData = {
  moduleName: string;
  subtitle: string;
  industryName: string;
  industryType: string;
  status: IndustryStatusLabel;
  actions: IndustryAction[];
};

export type QuickAnswer = {
  question: string;
  answer: string;
  status: string;
  tone: Tone;
};

export type IndustryQuickOverviewData = {
  title: string;
  description: string;
  icon: string;
  answers: QuickAnswer[];
  metrics: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    status: string;
  }>;
};

export type IndustryJourneyStep = {
  group: string;
  title: string;
  question: string;
  status: StepStatus;
  linkedModule: string;
  details: string[];
};

export type IndustryJourneyData = {
  title: string;
  description: string;
  steps: IndustryJourneyStep[];
};

export type IndustryTableColumnKey =
  | "macroVariable"
  | "question"
  | "industryImpact"
  | "transmission"
  | "classification"
  | "timeframe"
  | "dataToWatch"
  | "module"
  | "indicator"
  | "type"
  | "meaning"
  | "source"
  | "frequency"
  | "misread"
  | "template"
  | "why"
  | "linkage"
  | "businessImpact"
  | "financialLine"
  | "valuationImpact"
  | "riskToCarry";

export type IndustryTableRow = Partial<Record<IndustryTableColumnKey, string>>;

export type IndustryTableData = {
  caption: string;
  columns: Array<{
    key: IndustryTableColumnKey;
    header: string;
    align?: "left" | "center" | "right";
  }>;
  rows: IndustryTableRow[];
};

export type IndustryBlockData = {
  id: string;
  stepNumber: number;
  tab: "understand" | "macro" | "data" | "synthesis";
  title: string;
  icon: string;
  centralQuestion: string;
  easyExplanation: string;
  fields?: FieldItem[];
  examples?: Array<{
    title: string;
    content: string;
  }>;
  valueChain?: string[];
  states?: Array<{
    label: string;
    description: string;
    evidence: string;
    pitfall: string;
    tone: Tone;
  }>;
  dataToWatch: string[];
  moduleLinks: string[];
  pitfalls: string[];
  details?: string[];
  table?: IndustryTableData;
  outputPrompts?: string[];
};

export type IndustryInsightPanelData = {
  title: string;
  description: string;
  links: Array<{
    moduleName: string;
    howItConnects: string;
    nextCheck: string;
  }>;
};

export type IndustryTutorData = {
  title: string;
  notes: string[];
};

export type IndustryDisclaimerData = {
  title: string;
  content: string;
};

export type IndustryNextActionsData = {
  title: string;
  description: string;
  actions: IndustryAction[];
};

export type IndustryPageData = {
  isLoading: boolean;
  loading: {
    title: string;
    description: string;
  };
  emptyState: {
    title: string;
    description: string;
    icon: string;
  };
  header: IndustryHeaderData;
  quickOverview: IndustryQuickOverviewData;
  journey: IndustryJourneyData;
  blocks: IndustryBlockData[];
  insightPanel: IndustryInsightPanelData;
  tutor: IndustryTutorData;
  disclaimer: IndustryDisclaimerData;
  nextActions: IndustryNextActionsData;
};

export type IndustryCompassTone = "support" | "pressure" | "watch" | "neutral" | "mixed";

export type IndustryCompassAction = {
  label: string;
  targetModule?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export type IndustryCompassPoint = {
  title: string;
  description: string;
};

export type IndustryValueChainStage = {
  title: string;
  role: string;
  whoEarns: string;
  risk: string;
  metric: string;
};

export type IndustryMacroDriver = {
  factor: string;
  direction: "Hỗ trợ" | "Gây áp lực" | "Trái chiều" | "Cần theo dõi";
  strength: "Mạnh" | "Trung bình" | "Yếu" | "Chưa rõ";
  mechanism: string;
  chain: string[];
  checkNext: string;
  tone: IndustryCompassTone;
};

export type IndustrySignalMetric = {
  name: string;
  sampleStatus: string;
  simpleRead: string;
  goodSignal: string;
  badSignal: string;
  frequency: string;
  relatedStep: string;
};

export type IndustryCompanyGroup = {
  title: "Đáng phân tích tiếp" | "Cần theo dõi thêm" | "Chưa phù hợp với người mới";
  description: string;
  tickers: string[];
  role: string;
  why: string;
  checks: string[];
  tone: IndustryCompassTone;
};

export type IndustryConclusionBlock = {
  title: string;
  content: string;
};

export type IndustryAnalysisCluster = {
  title: string;
  question: string;
  stepRange: [number, number];
  output: string;
};

export type IndustryCompassOption = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  industryType: string;
  statusLabel: string;
  statusTone: IndustryCompassTone;
  sensitivityTags: string[];
  quickPicture: {
    summary: string;
    supports: IndustryCompassPoint[];
    pressures: IndustryCompassPoint[];
    firstData: string[];
    nextStep: string;
  };
  moneyMap: {
    sells: string;
    customers: string;
    revenueSource: string;
    pricingPower: string;
    biggestCosts: string;
    marginDependsOn: string;
    cashPoint: string;
    winnersWhenGood: string;
    pressureWhenBad: string;
    valueChain: IndustryValueChainStage[];
  };
  macroDrivers: IndustryMacroDriver[];
  dataSignals: {
    leading: IndustrySignalMetric[];
    confirming: IndustrySignalMetric[];
    warning: IndustrySignalMetric[];
  };
  companyGroups: IndustryCompanyGroup[];
  conclusion: {
    blocks: IndustryConclusionBlock[];
    warning: string;
    actions: IndustryCompassAction[];
  };
};

export type IndustryCompassData = {
  industries: IndustryCompassOption[];
  clusters: IndustryAnalysisCluster[];
  termTips: Record<string, string>;
};

// Legacy types kept so old, unused component files still type-check.
export type IndustryStatus = "growth" | "neutral" | "weakening";
export type IndustryOutlookTone = "positive" | "neutral" | "negative";
export type IndustryOverviewData = {
  eyebrow: string;
  icon: string;
  title: string;
  description: string;
  sectionTitle: string;
  sectionIcon: string;
  items: Array<{ id: string; label: string; value: string }>;
};
export type IndustryHealthData = {
  title: string;
  icon: string;
  status: string;
  statusType: IndustryStatus;
  score: number;
  scoreUnit: string;
  explanation: string;
  metricLabels: { status: string; scale: string };
  scaleValue: string;
};
export type IndustryImpactFactor = {
  id: string;
  label: string;
  icon: string;
  description: string;
  impactLevel: string;
};
export type IndustryImpactFactorsData = {
  title: string;
  icon: string;
  factors: IndustryImpactFactor[];
};
export type IndustryOutlookData = {
  title: string;
  icon: string;
  tone: IndustryOutlookTone;
  label: string;
  reasonsTitle: string;
  watchItemsTitle: string;
  reasons: string[];
  watchItems: string[];
};
export type IndustryGroupImpact = {
  id: string;
  title: string;
  description: string;
};
export type IndustryBeneficiariesData = {
  title: string;
  icon: string;
  beneficiariesTitle: string;
  disadvantagedTitle: string;
  beneficiaries: IndustryGroupImpact[];
  disadvantaged: IndustryGroupImpact[];
};
export type RepresentativeStock = {
  id: string;
  ticker: string;
  name: string;
  category: string;
  rationale: string;
  riskNote: string;
};
export type RepresentativeStocksData = {
  title: string;
  icon: string;
  caption: string;
  columns: { ticker: string; category: string; rationale: string; riskNote: string };
  stocks: RepresentativeStock[];
};
export type DeepDiveSection = {
  id: string;
  title: string;
  description?: string;
  items: string[];
};
export type DeepDiveTableRow = {
  category: string;
  dataPoint: string;
  whyItMatters: string;
};
export type IndustryDeepDiveData = {
  title: string;
  icon: string;
  triggerLabel: string;
  sections: DeepDiveSection[];
  dataTable: {
    title: string;
    icon: string;
    columns: { category: string; dataPoint: string; whyItMatters: string };
    rows: DeepDiveTableRow[];
  };
};
