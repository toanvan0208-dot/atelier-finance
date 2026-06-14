import type { DetectedUserIntent, RetrievalIntent, RetrievalSafetyLevel } from "./types";

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const hasAny = (text: string, patterns: RegExp[]): boolean => patterns.some((pattern) => pattern.test(text));

const collectSignals = (text: string, candidates: Array<[string, RegExp[]]>): string[] =>
  candidates.filter(([, patterns]) => hasAny(text, patterns)).map(([label]) => label);

const maintainerPatterns = [
  /\b(tao|sua|cap\s+nhat|review|chuan\s+hoa|to\s+chuc)\b.{0,30}\b(rag|knowledge|document|doc|tai\s+lieu)\b/i,
  /\b(metadata|template|indexing|governance|maintainer|chunk|retrieval\s+rule)\b/i,
];

const pvtPatterns = [
  /\b(pvt|price\s+volume\s+time|volume|khoi\s+luong|thanh\s+khoan|trading\s+value|gia\s+tri\s+giao\s+dich|breakout|vuot\s+dinh|bien\s+dong\s+gia)\b/i,
];

const financialPatterns = [
  /\b(doanh\s+thu|loi\s+nhuan|bao\s+cao\s+tai\s+chinh|bang\s+can\s+doi|dong\s+tien|cfo|cash\s+flow|von\s+chu|no\s+vay|tai\s+san|bien\s+loi\s+nhuan)\b/i,
];

const valuationPatterns = [
  /\b(valuation|dinh\s+gia|p\/?e|p\/?b|eps|bvps|fair\s+value|target\s+price|gia\s+tri\s+hop\s+ly|gia\s+muc\s+tieu|re\s+khong|dat\s+khong)\b/i,
];

const riskPatterns = [
  /\b(risk|rui\s+ro|risk\s+score|diem\s+rui\s+ro|an\s+toan|xau|debt|no\s+vay|don\s+bay)\b/i,
];

const checklistPatterns = [
  /\b(checklist|phan\s+bien|luan\s+diem|kiem\s+tra\s+gi|missing\s+evidence|bang\s+kiem)\b/i,
];

const adviceSafetyPatterns = [
  /\b(nen\s+mua|nen\s+ban|nen\s+nam\s+giu|co\s+nen\s+mua|co\s+nen\s+ban|buy|sell|hold|all\s*in|bat\s+day|chot\s+loi|khuyen\s+nghi)\b/i,
];

const pvtSignalSafetyPatterns = [
  /\b(tin\s+hieu\s+mua|tin\s+hieu\s+ban|entry|exit|diem\s+mua|diem\s+vao|diem\s+ra|breakout|xac\s+nhan)\b/i,
];

const pricePredictionPatterns = [
  /\b(du\s+doan\s+gia|gia\s+se|chac\s+chan\s+tang|chac\s+chan\s+giam|price\s+prediction|target\s+price)\b/i,
];

const fakeValuationPatterns = [
  /\b(fair\s+value|target\s+price|gia\s+tri\s+hop\s+ly|gia\s+muc\s+tieu|muc\s+tieu\s+gia)\b/i,
];

const invalidFinancialPatterns = [
  /\b(cfo\s+am|dong\s+tien\s+am|von\s+chu\s+am|equity\s+am|eps\s+am|eps\s+<=?\s*0|p\/?e|p\/?b|no\s+vay)\b/i,
];

const riskOverreachPatterns = [
  /\b(risk\s+(thap|low).{0,30}(an\s+toan|safe)|risk\s+(cao|high).{0,30}(xau|bad)|risk\s+score.{0,50}(an\s+toan|safe|xau|bad)|diem\s+rui\s+ro.{0,30}(an\s+toan|xau))\b/i,
];

const checklistRecommendationPatterns = [
  /\b(checklist.{0,40}(nen\s+mua|khuyen\s+nghi|du\s+dieu\s+kien|dau\s+tu)|checklist\s+tot.{0,30}nen\s+mua)\b/i,
];

const metricDefinitionPatterns = [
  /\b(roe|roa|eps|cfo|fcf|p\/?e|p\/?b|p\/?s|debt\s*\/?\s*equity|current\s+ratio|bien\s+loi\s+nhuan|gross\s+margin|net\s+margin)\b/i,
];

const resolveIntent = (text: string, activeModule?: string): RetrievalIntent => {
  const normalizedModule = normalizeText(activeModule ?? "");

  if (hasAny(text, maintainerPatterns)) return "maintainer";
  if (hasAny(text, pvtPatterns) || normalizedModule === "technical") return "pvt";
  if (hasAny(text, valuationPatterns) || normalizedModule === "valuation") return "valuation";
  if (hasAny(text, riskPatterns) || normalizedModule === "risk") return "risk";
  if (hasAny(text, checklistPatterns) || normalizedModule === "checklist") return "checklist";
  if (hasAny(text, financialPatterns) || normalizedModule === "financials") return "financial_statements";

  return "unknown";
};

const resolveSafetyLevel = (risks: string[]): RetrievalSafetyLevel => {
  if (
    risks.some((risk) =>
      [
        "advice_request",
        "pvt_signal_request",
        "price_prediction_request",
        "fake_valuation_request",
        "risk_score_overreach",
        "checklist_recommendation",
      ].includes(risk),
    )
  ) {
    return "critical";
  }

  if (risks.length > 0) return "high";
  return "low";
};

export const detectUserIntent = (userQuestion: string, activeModule?: string): DetectedUserIntent => {
  const text = normalizeText(userQuestion);
  const intent = resolveIntent(text, activeModule);
  const matchedSignals = collectSignals(text, [
    ["maintainer", maintainerPatterns],
    ["pvt", pvtPatterns],
    ["financial_statements", financialPatterns],
    ["valuation", valuationPatterns],
    ["risk", riskPatterns],
    ["checklist", checklistPatterns],
    ["metric_definition", metricDefinitionPatterns],
  ]);
  const safetyRisks = collectSignals(text, [
    ["advice_request", adviceSafetyPatterns],
    ["pvt_signal_request", pvtSignalSafetyPatterns],
    ["price_prediction_request", pricePredictionPatterns],
    ["fake_valuation_request", fakeValuationPatterns],
    ["invalid_financial_ratio_or_missing_data", invalidFinancialPatterns],
    ["risk_score_overreach", riskOverreachPatterns],
    ["checklist_recommendation", checklistRecommendationPatterns],
  ]);

  return {
    intent,
    safetyLevel: resolveSafetyLevel(safetyRisks),
    matchedSignals,
    isMaintainerIntent: intent === "maintainer",
    isEndUserFinancialQuestion: intent !== "maintainer",
    safetyRisks,
  };
};

export const hasMetricDefinitionSignal = (userQuestion: string): boolean =>
  hasAny(normalizeText(userQuestion), metricDefinitionPatterns);

export const hasFinancialRiskSignal = (userQuestion: string): boolean =>
  hasAny(normalizeText(userQuestion), invalidFinancialPatterns);

export const hasValuationSafetySignal = (userQuestion: string): boolean =>
  hasAny(normalizeText(userQuestion), [...fakeValuationPatterns, ...invalidFinancialPatterns, ...metricDefinitionPatterns]);
