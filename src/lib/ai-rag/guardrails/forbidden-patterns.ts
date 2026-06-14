import type { GuardrailViolationCode } from "./types";

export type ForbiddenPattern = {
  code: GuardrailViolationCode;
  severity: "info" | "warning" | "critical";
  message: string;
  pattern: RegExp;
  allowNegated?: boolean;
};

export const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  {
    code: "BUY_SELL_HOLD_RECOMMENDATION",
    severity: "critical",
    message: "Assistant output must not recommend buy, sell, or hold.",
    pattern:
      /\b(nen\s+(mua|ban|nam\s+giu|giu)|khuyen\s+nghi\s+(mua|ban|nam\s+giu)|dang\s+mua|nen\s+all\s*in|buy\s+recommendation|sell\s+recommendation|hold\s+recommendation|strong\s+buy|strong\s+sell|mua\s+ngay|ban\s+ngay)\b/i,
    allowNegated: true,
  },
  {
    code: "BUY_SELL_HOLD_RECOMMENDATION",
    severity: "critical",
    message: "Standalone buy/sell/hold labels are not allowed as advice.",
    pattern: /\b(buy|sell|hold)\b/i,
    allowNegated: true,
  },
  {
    code: "PVT_SIGNAL_WORDING",
    severity: "critical",
    message: "PVT wording must not become a trading signal.",
    pattern:
      /\b(tin\s+hieu\s+(mua|ban|giao\s+dich)|diem\s+mua\s+tot|diem\s+vao\s+lenh|diem\s+thoat|entry\s+signal|exit\s+signal|breakout\s+da\s+xac\s+nhan|confirmed\s+breakout)\b/i,
    allowNegated: true,
  },
  {
    code: "PRICE_PREDICTION",
    severity: "critical",
    message: "Assistant output must not predict price direction.",
    pattern:
      /\b(chac\s+chan\s+(tang|giam)|se\s+tang\s+chac\s+chan|se\s+giam\s+chac\s+chan|gia\s+se\s+(tang|giam)|guaranteed\s+(up|down|increase|decrease)|price\s+will\s+(rise|fall))\b/i,
    allowNegated: true,
  },
  {
    code: "RISK_SCORE_OVERREACH",
    severity: "critical",
    message: "Risk score must not become a final safe/bad stock conclusion.",
    pattern:
      /\b(co\s+phieu\s+an\s+toan|an\s+toan\s+tuyet\s+doi|risk\s+(thap|low).{0,30}(an\s+toan|safe)|risk\s+(cao|high).{0,30}(xau|bad|nen\s+ban))\b/i,
    allowNegated: true,
  },
  {
    code: "CHECKLIST_RECOMMENDATION",
    severity: "critical",
    message: "Checklist output must not become an investment recommendation.",
    pattern:
      /\b(checklist.{0,40}(du\s+dieu\s+kien\s+dau\s+tu|nen\s+mua|khuyen\s+nghi|investment\s+recommendation)|dat\s+checklist.{0,40}(nen\s+mua|du\s+dieu\s+kien))\b/i,
    allowNegated: true,
  },
  {
    code: "FAKE_FAIR_VALUE_OR_TARGET_PRICE",
    severity: "critical",
    message: "Assistant output must not create fair value or target price without context.",
    pattern:
      /\b(fair\s+value|target\s+price|gia\s+tri\s+hop\s+ly|gia\s+muc\s+tieu|muc\s+tieu\s+gia)\b.{0,40}\b(la|=|khoang|about|around)?\s*\d[\d.,]*/i,
  },
  {
    code: "MISSING_DATA_AS_ZERO",
    severity: "critical",
    message: "Missing data must not be treated as zero.",
    pattern:
      /\b(thieu|khong\s+co|missing|not_available|insufficient_data).{0,40}\b(=|la|as|bang|coi\s+la|xem\s+la)\s*0\b/i,
  },
];
