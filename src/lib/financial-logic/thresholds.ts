export const DEFAULT_THRESHOLDS = {
  growth: {
    strong: 0.15,
    moderate: 0.05,
    weak: 0,
    danger: -0.1,
  },
  margin: {
    good: 0.15,
    watch: 0.05,
    risk: 0,
  },
  roe: {
    good: 0.15,
    watch: 0.08,
    risk: 0,
  },
  roa: {
    good: 0.08,
    watch: 0.03,
    risk: 0,
  },
  leverage: {
    debtToEquityWatch: 1,
    debtToEquityRisk: 2,
    liabilitiesToAssetsWatch: 0.6,
    liabilitiesToAssetsRisk: 0.75,
  },
  liquidity: {
    currentRatioGood: 1.5,
    currentRatioWatch: 1,
    quickRatioGood: 1,
    quickRatioWatch: 0.7,
  },
  cashFlow: {
    cfoToNetProfitGood: 0.8,
    cfoToNetProfitWatch: 0.5,
  },
  market: {
    lowTradingValue: 5_000_000_000,
    mediumTradingValue: 20_000_000_000,
  },
  dataQuality: {
    staleDays: 180,
  },
} as const;
