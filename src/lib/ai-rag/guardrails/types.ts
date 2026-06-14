export type GuardrailSeverity = "none" | "info" | "warning" | "critical";

export type GuardrailViolationCode =
  | "BUY_SELL_HOLD_RECOMMENDATION"
  | "PRICE_PREDICTION"
  | "FAKE_FAIR_VALUE_OR_TARGET_PRICE"
  | "MISSING_DATA_AS_ZERO"
  | "FABRICATED_NUMERIC_DATA"
  | "INVALID_PE_INTERPRETATION"
  | "INVALID_EQUITY_RATIO_INTERPRETATION"
  | "PVT_SIGNAL_WORDING"
  | "RISK_SCORE_OVERREACH"
  | "CHECKLIST_RECOMMENDATION";

export type GuardrailWarningCode =
  | "MISSING_DATA_PRESENT"
  | "MOCK_DATA_PRESENT"
  | "LOW_CONTEXT_NUMERIC_CHECK"
  | "SANITIZED_ANSWER_AVAILABLE";

export type GuardrailValidationContext = {
  module?: "overview" | "financials" | "valuation" | "technical" | "risk" | "checklist" | "learning" | "general" | string;
  missingFields?: string[];
  isMockData?: boolean;
  eps?: number | null;
  totalEquity?: number | null;
  bvps?: number | null;
  allowedNumericValues?: Array<number | string>;
  hasFairValueInContext?: boolean;
  hasTargetPriceInContext?: boolean;
};

export type GuardrailViolation = {
  code: GuardrailViolationCode;
  severity: Exclude<GuardrailSeverity, "none">;
  message: string;
  matchedText?: string;
};

export type GuardrailWarning = {
  code: GuardrailWarningCode;
  message: string;
};

export type GuardrailValidationResult = {
  isValid: boolean;
  severity: GuardrailSeverity;
  violations: GuardrailViolation[];
  sanitizedAnswer?: string;
  shouldRefuse: boolean;
  warnings: GuardrailWarning[];
};
