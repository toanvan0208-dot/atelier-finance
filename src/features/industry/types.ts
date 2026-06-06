export type IndustryStatus = "growth" | "neutral" | "weakening";

export type IndustryOutlookTone = "positive" | "neutral" | "negative";

export type IndustryOverviewData = {
  eyebrow: string;
  icon: string;
  title: string;
  description: string;
  sectionTitle: string;
  sectionIcon: string;
  items: Array<{
    id: string;
    label: string;
    value: string;
  }>;
};

export type IndustryHealthData = {
  title: string;
  icon: string;
  status: string;
  statusType: IndustryStatus;
  score: number;
  scoreUnit: string;
  explanation: string;
  metricLabels: {
    status: string;
    scale: string;
  };
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
  columns: {
    ticker: string;
    category: string;
    rationale: string;
    riskNote: string;
  };
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
    columns: {
      category: string;
      dataPoint: string;
      whyItMatters: string;
    };
    rows: DeepDiveTableRow[];
  };
};
