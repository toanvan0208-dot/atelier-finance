export type MacroTone = "support" | "pressure" | "neutral" | "watch" | "mixed";

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
