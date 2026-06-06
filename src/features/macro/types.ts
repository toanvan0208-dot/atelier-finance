export type MacroMapNode = {
  id: string;
  title: string;
  description: string;
  position: "center" | "left" | "top" | "right";
};

export type MacroTopic = {
  id: string;
  title: string;
  description: string;
  active?: boolean;
};

export type MacroMetric = {
  label: string;
  value: string;
};

export type MacroMetricCard = {
  id: string;
  title: string;
  icon: string;
  value: string;
  period?: string;
  status?: string;
  metrics: MacroMetric[];
};

export type MacroCardCopy = {
  icon: string;
  title: string;
  chip?: string;
};

export type MacroSectionCopy = {
  icon: string;
  title: string;
};

export type MacroTabsCopy = {
  ariaLabel: string;
  global: MacroCardCopy & {
    tabLabel: string;
  };
  vietnam: MacroCardCopy & {
    tabLabel: string;
  };
  warning: MacroCardCopy & {
    tabLabel: string;
  };
};

export type MacroTableRow = {
  factor: string;
  currentState: string;
  watchPoint: string;
};

export type MacroDashboardItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  cadence: string;
  active?: boolean;
};

export type MacroSignal = {
  id: string;
  label: string;
  description: string;
};

export type MacroGuidanceCopy = {
  insight: {
    eyebrow: string;
    title: string;
    description: string;
  };
  explanation: {
    title: string;
    summary: string;
    details: string[];
  };
  nextStep: {
    title: string;
    description: string;
    actionLabel: string;
  };
  summary: {
    title: string;
    items: Array<{
      label: string;
      value: string;
    }>;
  };
};
