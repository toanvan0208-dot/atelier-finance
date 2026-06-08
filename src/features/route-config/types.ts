export type RouteGoalId =
  | "learn_from_scratch"
  | "analyze_stock"
  | "find_ideas"
  | "simulate_first"
  | "review_decision"
  | "research_project";

export type JourneyModeId =
  | "step_by_step"
  | "fast_to_gap"
  | "learn_first"
  | "analyze_first"
  | "simulate_review";

export type AIExplanationLevelId =
  | "plain_language"
  | "basic_with_examples"
  | "more_detail"
  | "key_points_only";

export type AssetInputMode = "ticker" | "industry" | "none";

export type RouteOption = {
  id: string;
  title: string;
  description: string;
  suitableWhen: string[];
  suggestedPath: string[];
};

export type StuckPoint = {
  id: string;
  label: string;
  lesson: string;
  warning?: string;
};

export type RouteConfigState = {
  primaryGoal: RouteGoalId;
  secondaryGoal: RouteGoalId | "";
  journeyMode: JourneyModeId;
  aiExplanationLevel: AIExplanationLevelId;
  stuckPoints: string[];
  customStuckPoint: string;
  assetInputMode: AssetInputMode;
  selectedTicker: string;
  selectedIndustry: string;
};

export type PersonalizedRoute = {
  goalLabel: string;
  secondaryGoalLabel: string;
  journeyModeLabel: string;
  aiLevelLabel: string;
  stuckPointLabels: string[];
  assetLabel: string;
  recommendedPath: string[];
  recommendedLessons: string[];
  softWarnings: string[];
  nextAction: {
    label: string;
    moduleKey: string;
  };
};
