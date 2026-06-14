import { FORBIDDEN_PATTERNS } from "./forbidden-patterns";
import type {
  GuardrailSeverity,
  GuardrailValidationContext,
  GuardrailValidationResult,
  GuardrailViolation,
} from "./types";

const NEGATION_WINDOW = 28;

const CRITICAL_SAFE_FALLBACK =
  "Cau tra loi nay vi pham guardrails nen khong nen hien thi. Hay chuyen sang giai thich du lieu hien co, du lieu con thieu va cac diem can kiem tra them; khong dua khuyen nghi mua/ban/nam giu, khong du doan gia va khong tu tao so lieu.";

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const maxSeverity = (violations: GuardrailViolation[]): GuardrailSeverity => {
  if (violations.some((violation) => violation.severity === "critical")) return "critical";
  if (violations.some((violation) => violation.severity === "warning")) return "warning";
  if (violations.some((violation) => violation.severity === "info")) return "info";
  return "none";
};

const hasNegationNearMatch = (normalizedAnswer: string, matchIndex: number): boolean => {
  const start = Math.max(0, matchIndex - NEGATION_WINDOW);
  const prefix = normalizedAnswer.slice(start, matchIndex);

  return /\b(khong|khong phai|khong duoc|khong nen|not|must not|should not|no)\b/i.test(prefix);
};

const pushViolation = (
  violations: GuardrailViolation[],
  violation: GuardrailViolation,
): void => {
  const duplicate = violations.some(
    (existing) =>
      existing.code === violation.code && existing.matchedText === violation.matchedText,
  );

  if (!duplicate) {
    violations.push(violation);
  }
};

const collectPatternViolations = (answer: string): GuardrailViolation[] => {
  const normalizedAnswer = normalizeText(answer);
  const violations: GuardrailViolation[] = [];

  for (const forbidden of FORBIDDEN_PATTERNS) {
    const pattern = new RegExp(forbidden.pattern.source, forbidden.pattern.flags.includes("g") ? forbidden.pattern.flags : `${forbidden.pattern.flags}g`);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(normalizedAnswer)) !== null) {
      if (forbidden.allowNegated && hasNegationNearMatch(normalizedAnswer, match.index)) {
        continue;
      }

      pushViolation(violations, {
        code: forbidden.code,
        severity: forbidden.severity,
        message: forbidden.message,
        matchedText: match[0],
      });
    }
  }

  return violations;
};

const answerMentionsCheapPe = (normalizedAnswer: string): boolean =>
  /\bp\/?e\b.{0,60}\b(re|cheap|hap\s+dan|undervalued|dinh\s+gia\s+thap)\b/i.test(
    normalizedAnswer,
  ) ||
  /\b(re|cheap|hap\s+dan|undervalued|dinh\s+gia\s+thap)\b.{0,60}\bp\/?e\b/i.test(
    normalizedAnswer,
  );

const answerMentionsNormalEquityRatios = (normalizedAnswer: string): boolean =>
  /\b(roe|p\/?b)\b.{0,80}\b(tot|cao\s+la\s+tot|re|cheap|hap\s+dan|binh\s+thuong|healthy|attractive)\b/i.test(
    normalizedAnswer,
  );

const collectContextViolations = (
  answer: string,
  context: GuardrailValidationContext,
): GuardrailViolation[] => {
  const normalizedAnswer = normalizeText(answer);
  const violations: GuardrailViolation[] = [];

  if (context.eps !== undefined && context.eps !== null && context.eps <= 0 && answerMentionsCheapPe(normalizedAnswer)) {
    violations.push({
      code: "INVALID_PE_INTERPRETATION",
      severity: "critical",
      message: "P/E must not be interpreted as cheap or attractive when EPS is zero or negative.",
      matchedText: "P/E with EPS <= 0",
    });
  }

  const invalidEquity =
    (context.totalEquity !== undefined && context.totalEquity !== null && context.totalEquity <= 0) ||
    (context.bvps !== undefined && context.bvps !== null && context.bvps <= 0);

  if (invalidEquity && answerMentionsNormalEquityRatios(normalizedAnswer)) {
    violations.push({
      code: "INVALID_EQUITY_RATIO_INTERPRETATION",
      severity: "critical",
      message: "ROE/P/B must not be interpreted normally when equity or BVPS is zero or negative.",
      matchedText: "ROE/P/B with equity <= 0",
    });
  }

  const mentionsFairValueOrTarget =
    /\b(fair\s+value|target\s+price|gia\s+tri\s+hop\s+ly|gia\s+muc\s+tieu|muc\s+tieu\s+gia)\b/i.test(
      normalizedAnswer,
    );

  if (
    mentionsFairValueOrTarget &&
    !context.hasFairValueInContext &&
    !context.hasTargetPriceInContext
  ) {
    violations.push({
      code: "FAKE_FAIR_VALUE_OR_TARGET_PRICE",
      severity: "critical",
      message: "Fair value or target price cannot be created when it is not present in context.",
      matchedText: "fair value/target price without context",
    });
  }

  if (context.allowedNumericValues && context.allowedNumericValues.length > 0) {
    const allowed = new Set(context.allowedNumericValues.map((value) => normalizeNumericToken(String(value))));
    const numericTokens = extractNumericTokens(answer);
    const fabricated = numericTokens.filter((token) => !allowed.has(normalizeNumericToken(token)));

    if (fabricated.length > 0) {
      violations.push({
        code: "FABRICATED_NUMERIC_DATA",
        severity: "warning",
        message: "Assistant output contains numeric values that were not provided in context.",
        matchedText: fabricated.slice(0, 5).join(", "),
      });
    }
  }

  return violations;
};

const normalizeNumericToken = (value: string): string => value.replace(/[,\s_]/g, "").replace(/\.$/, "");

const extractNumericTokens = (answer: string): string[] => {
  const matches = answer.match(/\b\d[\d.,_]*%?\b/g);
  return matches ?? [];
};

const sanitizeAnswer = (answer: string, violations: GuardrailViolation[]): string | undefined => {
  if (violations.length === 0) return undefined;

  let sanitized = answer;
  for (const violation of violations) {
    if (!violation.matchedText) continue;
    sanitized = sanitized.replace(new RegExp(escapeRegExp(violation.matchedText), "gi"), "[blocked]");
  }

  return sanitized === answer ? CRITICAL_SAFE_FALLBACK : sanitized;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const validateAssistantOutput = (
  answer: string,
  context: GuardrailValidationContext = {},
): GuardrailValidationResult => {
  const trimmedAnswer = answer.trim();
  const violations = [
    ...collectPatternViolations(trimmedAnswer),
    ...collectContextViolations(trimmedAnswer, context),
  ];
  const severity = maxSeverity(violations);
  const shouldRefuse = severity === "critical";
  const warnings = [];

  if ((context.missingFields?.length ?? 0) > 0) {
    warnings.push({
      code: "MISSING_DATA_PRESENT" as const,
      message: `Context has missing fields: ${context.missingFields?.join(", ")}`,
    });
  }

  if (context.isMockData) {
    warnings.push({
      code: "MOCK_DATA_PRESENT" as const,
      message: "Context contains mock/sample data and must be labeled if used.",
    });
  }

  if (!context.allowedNumericValues || context.allowedNumericValues.length === 0) {
    warnings.push({
      code: "LOW_CONTEXT_NUMERIC_CHECK" as const,
      message: "No allowed numeric context was provided, so fabricated numeric data can only be partially checked.",
    });
  }

  const sanitizedAnswer = sanitizeAnswer(trimmedAnswer, violations);
  if (sanitizedAnswer) {
    warnings.push({
      code: "SANITIZED_ANSWER_AVAILABLE" as const,
      message: "A sanitized answer was produced, but critical violations should normally trigger refusal/regeneration.",
    });
  }

  return {
    isValid: violations.length === 0,
    severity,
    violations,
    sanitizedAnswer,
    shouldRefuse,
    warnings,
  };
};
