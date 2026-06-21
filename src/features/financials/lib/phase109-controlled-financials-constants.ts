export const PHASE109_CONTROLLED_FINANCIALS_SOURCE_LABEL = "phase109_controlled_local_financials" as const;
export const PHASE109_CONTROLLED_FINANCIALS_DATA_MODE = "research_only" as const;
export const PHASE109_CONTROLLED_FINANCIALS_AS_OF = "2026-06-22" as const;
export const PHASE109_CONTROLLED_FINANCIALS_PERIOD = "2024" as const;
export const PHASE109_CONTROLLED_FINANCIALS_TICKERS = ["FPT", "MWG", "VNM"] as const;

export type Phase109ControlledFinancialsTicker = (typeof PHASE109_CONTROLLED_FINANCIALS_TICKERS)[number];
