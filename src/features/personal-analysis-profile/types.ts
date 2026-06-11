export type KnowledgeLevel = "beginner" | "basic" | "intermediate" | "advanced";

export type ProfileGoal =
  | "learn"
  | "track_one_stock"
  | "compare_stocks"
  | "build_watchlist"
  | "prepare_decision";

export type RiskAppetite = "conservative" | "balanced" | "aggressive";

export type InterfaceMode = "guided" | "dashboard" | "deep_dive";

export type ExplanationDepth = "detailed" | "balanced" | "brief";

export type PersonalAnalysisProfile = {
  knowledgeLevel: KnowledgeLevel;
  goal: ProfileGoal;
  riskAppetite: RiskAppetite;
  interfaceMode: InterfaceMode;
  explanationDepth: ExplanationDepth;
  updatedAt: string;
};

export type ProfileOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};
