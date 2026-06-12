export type MacroTone = "support" | "pressure" | "neutral" | "watch" | "mixed";

export type MacroDashboardMode = "guided" | "detailed";

export type MacroMetricStatus = MacroTone;

export type MacroMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  period: string;
  change?: string;
  status: MacroMetricStatus;
  explanation: string;
  source?: string;
  updatedAt?: string;
  isMock?: boolean;
  sparkline?: number[];
  detail?: {
    definition: string;
    currentReading: string;
    whyItMatters: string;
    transmission: string[];
    affectedSectors: string[];
    nextChecks: string[];
  };
};

export type MacroSectorTile = {
  id: string;
  name: string;
  status: MacroMetricStatus;
  horizon?: "Ngắn hạn" | "Trung hạn" | "Dài hạn" | "Cả hai";
  shortReason: string;
  detail: {
    whyAffected: string;
    keyChecks: string[];
    nextModule: string[];
    warning: string;
  };
};

export type MacroRegime = {
  label: string;
  score: number;
  status: MacroMetricStatus;
  summary: string;
  warning: string;
};

export type MacroOverviewDashboardData = {
  regime: MacroRegime;
  metrics: MacroMetric[];
  sectorTiles: MacroSectorTile[];
};

export type MacroDataMeta = {
  source: string;
  period: string;
  updatedAt: string;
  status: "mock" | "placeholder" | "stale" | "fresh";
};

export type MacroAction = {
  label: string;
  targetModule: string;
  variant?: "primary" | "secondary" | "ghost";
};

export type MacroEvidencePoint = {
  label: string;
  value: string;
  tone: MacroTone;
};

export type MacroSnapshotData = {
  eyebrow: string;
  title: string;
  description: string;
  currentState: string;
  stateTone: MacroTone;
  supportPoints: MacroEvidencePoint[];
  pressurePoints: MacroEvidencePoint[];
  unconfirmedData: MacroEvidencePoint[];
  nextQuestions: string[];
  affectedSectors: string[];
  actions: MacroAction[];
  meta: MacroDataMeta;
};

export type MacroTransmissionChain = {
  id: string;
  title: string;
  macroVariable: string;
  simpleMeaning: string;
  impactChannel: string[];
  relatedSectors: string[];
  verificationData: string[];
  linkedModules: string[];
  tone: MacroTone;
  meta: MacroDataMeta;
};

export type MacroInsightCardData = {
  id: string;
  title: string;
  question: string;
  status: string;
  tone: MacroTone;
  simpleMeaning: string;
  transmission: string;
  relatedSectors: string[];
  verificationData: string[];
  linkedModules: string[];
  actions: MacroAction[];
  meta: MacroDataMeta;
};

export type MacroSectorImpactItem = {
  sector: string;
  reason: string;
  macroVariables: string[];
  verificationData: string[];
  risks: string[];
  horizon: "Ngắn hạn" | "Dài hạn" | "Cả hai";
  action: MacroAction;
};

export type MacroSectorImpactGroup = {
  id: string;
  title: string;
  tone: MacroTone;
  description: string;
  items: MacroSectorImpactItem[];
};

export type MacroWarningSignal = {
  id: string;
  cadence: "Tháng" | "Quý" | "Khủng hoảng";
  signal: string;
  status:
    | "Tín hiệu xanh"
    | "Tín hiệu vàng"
    | "Tín hiệu đỏ"
    | "Chưa đủ dữ liệu";
  tone: MacroTone;
  evidence: string;
  meaning: string;
  relatedSectors: string[];
  nextAction: string;
  meta: MacroDataMeta;
};

export type MacroThesisOption = {
  id: string;
  label: string;
  value: string;
  tutorNote: string;
};

export type MacroThesisQuestion = {
  id: string;
  label: string;
  prompt: string;
  options: MacroThesisOption[];
};

export type MacroThesisBuilderData = {
  title: string;
  description: string;
  tutorRule: string;
  questions: MacroThesisQuestion[];
};

export type MacroJourneyData = {
  overview: {
    eyebrow: string;
    icon: string;
    title: string;
    description: string;
    centralQuestion: string;
  };
  dashboard: MacroOverviewDashboardData;
  snapshot: MacroSnapshotData;
  transmissionChains: MacroTransmissionChain[];
  globalInsights: MacroInsightCardData[];
  vietnamInsights: MacroInsightCardData[];
  sectorImpactGroups: MacroSectorImpactGroup[];
  warningSignals: MacroWarningSignal[];
  thesisBuilder: MacroThesisBuilderData;
  disclaimer: {
    title: string;
    content: string;
  };
};

export type MacroThesisDraft = Record<string, MacroThesisOption>;

export type MacroCompassTone = "support" | "pressure" | "watch" | "neutral" | "mixed";

export type MacroCompassAction = {
  label: string;
  targetModule?: string;
  targetAnchor?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export type MacroCompassPoint = {
  label: string;
  value: string;
  tone: MacroCompassTone;
};

export type MacroCompassMetric = {
  id: string;
  name: string;
  value: string;
  status: string;
  tone: MacroCompassTone;
  simpleMeaning: string;
  marketImpact: string;
  relatedSectors: string[];
  confidence: string;
  group: "world" | "growth" | "inflation" | "currency" | "policy";
};

export type MacroTransmissionItem = {
  label: string;
  text: string;
};

export type MacroTransmissionPath = {
  id: string;
  title: string;
  tone: MacroCompassTone;
  termIds: string[];
  steps: MacroTransmissionItem[];
};

export type MacroAffectedSector = {
  id: string;
  sector: string;
  group: string;
  tone: MacroCompassTone;
  macroDriver: string;
  mechanism: string;
  impactLevel: string;
  nextCheck: string;
};

export type MacroEarlyWarning = {
  id: string;
  title: string;
  level: "Thấp" | "Trung bình" | "Cao";
  tone: MacroCompassTone;
  why: string;
  confirmingData: string;
  affected: string[];
  nextAction: string;
  isPrimary: boolean;
};

export type MacroTermDefinition = {
  id: string;
  label: string;
  definition: string;
};

export type MacroConclusionBlock = {
  title: string;
  content: string;
  tone: MacroCompassTone;
};

export type MacroCompassData = {
  header: {
    title: string;
    description: string;
    question: string;
  };
  currentPicture: {
    state: string;
    tone: MacroCompassTone;
    summary: string;
    supports: MacroCompassPoint[];
    pressures: MacroCompassPoint[];
    unconfirmed: MacroCompassPoint[];
    actions: MacroCompassAction[];
  };
  terms: MacroTermDefinition[];
  transmissionPaths: MacroTransmissionPath[];
  worldMetrics: MacroCompassMetric[];
  vietnamMetrics: MacroCompassMetric[];
  affectedSectors: MacroAffectedSector[];
  warnings: MacroEarlyWarning[];
  conclusion: {
    blocks: MacroConclusionBlock[];
    warning: string;
    actions: MacroCompassAction[];
  };
};
