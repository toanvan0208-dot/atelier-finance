export const VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL =
  "vnstock_financials_candidate" as const;

export const VNSTOCK_FINANCIALS_TARGET_FIELDS = [
  "eps",
  "totalDebt",
  "sharesOutstanding",
] as const;

export type VnstockFinancialsTargetField =
  (typeof VNSTOCK_FINANCIALS_TARGET_FIELDS)[number];

export type VnstockFinancialsCandidateStatus =
  | "candidate"
  | "missing"
  | "needs_review"
  | "ambiguous";

export type RawVnstockFinancialField = {
  provider: string;
  method: string;
  rawKey: string;
  value: unknown;
  period?: string | null;
  asOf?: string | null;
  unit?: string | null;
  label?: string | null;
};

export type VnstockFinancialsCandidateRow = {
  ticker: string;
  fiscalYear: number | null;
  period: string | null;
  field: VnstockFinancialsTargetField;
  value: number | null;
  unit: string;
  sourceLabel: typeof VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL;
  dataMode: "research_only";
  productionApproved: false;
  status: VnstockFinancialsCandidateStatus;
  rawPath: string | null;
  provenanceNote: string;
  caveat: string | null;
};

export type NormalizeVnstockFinancialsCandidateInput = {
  ticker: string;
  fields: RawVnstockFinancialField[];
};

const EPS_KEYS = ["eps_basic_vnd", "earnings_per_share_vnd"] as const;
const TOTAL_DEBT_KEYS = [
  "total_debt",
  "total_borrowings",
  "interest_bearing_debt",
] as const;
const DEBT_COMPONENT_KEYS = [
  "short_term_borrowings",
  "long_term_borrowings",
] as const;
const LIABILITY_KEYS = ["liabilities", "total_liabilities"] as const;
const SHARES_KEYS = ["outstanding_shares"] as const;

const normalizedKey = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const finiteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const rawPath = (field: RawVnstockFinancialField): string =>
  `${field.provider}.${field.method}.${field.rawKey}`;

const fiscalYearFrom = (field?: RawVnstockFinancialField): number | null => {
  const candidate = field?.period ?? field?.asOf?.slice(0, 4) ?? null;
  if (!candidate || !/^\d{4}$/.test(candidate.slice(0, 4))) return null;
  return Number(candidate.slice(0, 4));
};

const baseRow = ({
  ticker,
  field,
}: {
  ticker: string;
  field: VnstockFinancialsTargetField;
}): Omit<
  VnstockFinancialsCandidateRow,
  | "fiscalYear"
  | "period"
  | "value"
  | "unit"
  | "status"
  | "rawPath"
  | "provenanceNote"
  | "caveat"
> => ({
  ticker,
  field,
  sourceLabel: VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL,
  dataMode: "research_only",
  productionApproved: false,
});

const findField = (
  fields: RawVnstockFinancialField[],
  keys: readonly string[],
): RawVnstockFinancialField | undefined =>
  fields.find((field) => keys.includes(normalizedKey(field.rawKey)));

const missingRow = (
  ticker: string,
  field: VnstockFinancialsTargetField,
  caveat: string,
): VnstockFinancialsCandidateRow => ({
  ...baseRow({ ticker, field }),
  fiscalYear: null,
  period: null,
  value: null,
  unit: "unknown",
  status: "missing",
  rawPath: null,
  provenanceNote: "No explicit safe VNStock field was present in the probe payload.",
  caveat,
});

const candidateFromExplicitField = ({
  ticker,
  targetField,
  raw,
  defaultUnit,
  bankCaveat,
}: {
  ticker: string;
  targetField: VnstockFinancialsTargetField;
  raw: RawVnstockFinancialField;
  defaultUnit: string;
  bankCaveat: string | null;
}): VnstockFinancialsCandidateRow => {
  const value = finiteNumber(raw.value);
  const period = raw.period ?? raw.asOf ?? null;
  const unit = raw.unit?.trim() || defaultUnit;
  const unitNeedsReview = unit.toLowerCase() === "unknown";

  return {
    ...baseRow({ ticker, field: targetField }),
    fiscalYear: fiscalYearFrom(raw),
    period,
    value,
    unit,
    status: value === null || unitNeedsReview ? "needs_review" : "candidate",
    rawPath: rawPath(raw),
    provenanceNote:
      value === null
        ? "The explicit field was present, but its value was empty or non-finite and was kept null."
        : unitNeedsReview
          ? "The explicit field and value were present, but its unit requires review."
        : "Direct candidate mapping from an explicitly named VNStock field; no value was derived.",
    caveat:
      bankCaveat ??
      (unitNeedsReview
        ? "The provider payload did not expose an accepted explicit unit."
        : null),
  };
};

export const normalizeVnstockFinancialsCandidate = ({
  ticker,
  fields,
}: NormalizeVnstockFinancialsCandidateInput): VnstockFinancialsCandidateRow[] => {
  const normalizedTicker = ticker.trim().toUpperCase();
  const bankCaveat =
    normalizedTicker === "VCB"
      ? "VCB is a bank; industrial-company debt mappings must not be forced onto its banking statement."
      : null;

  const epsRaw = findField(fields, EPS_KEYS);
  const eps = epsRaw
    ? candidateFromExplicitField({
        ticker: normalizedTicker,
        targetField: "eps",
        raw: epsRaw,
        defaultUnit: "vnd_per_share",
        bankCaveat,
      })
    : missingRow(
        normalizedTicker,
        "eps",
        "EPS was not inferred from profit and shares.",
      );

  const explicitDebt = findField(fields, TOTAL_DEBT_KEYS);
  const debtComponents = fields.filter((field) =>
    DEBT_COMPONENT_KEYS.includes(
      normalizedKey(field.rawKey) as (typeof DEBT_COMPONENT_KEYS)[number],
    ),
  );
  const liabilities = findField(fields, LIABILITY_KEYS);

  let totalDebt: VnstockFinancialsCandidateRow;
  if (explicitDebt && normalizedTicker !== "VCB") {
    totalDebt = candidateFromExplicitField({
      ticker: normalizedTicker,
      targetField: "totalDebt",
      raw: explicitDebt,
      defaultUnit: "unknown",
      bankCaveat,
    });
  } else if (explicitDebt && normalizedTicker === "VCB") {
    totalDebt = {
      ...baseRow({ ticker: normalizedTicker, field: "totalDebt" }),
      fiscalYear: fiscalYearFrom(explicitDebt),
      period: explicitDebt.period ?? explicitDebt.asOf ?? null,
      value: null,
      unit: explicitDebt.unit?.trim() || "unknown",
      status: "needs_review",
      rawPath: rawPath(explicitDebt),
      provenanceNote:
        "An explicitly named debt field was present, but the banking statement mapping was not accepted automatically.",
      caveat: bankCaveat,
    };
  } else if (debtComponents.length > 0) {
    const first = debtComponents[0];
    totalDebt = {
      ...baseRow({ ticker: normalizedTicker, field: "totalDebt" }),
      fiscalYear: fiscalYearFrom(first),
      period: first.period ?? first.asOf ?? null,
      value: null,
      unit: "unknown",
      status: "needs_review",
      rawPath: debtComponents.map(rawPath).join(" + "),
      provenanceNote:
        "Borrowing components were present, but this preview does not sum them into totalDebt.",
      caveat:
        bankCaveat ??
        "Component coverage and units require review before any derived total-debt candidate is allowed.",
    };
  } else if (liabilities) {
    totalDebt = {
      ...baseRow({ ticker: normalizedTicker, field: "totalDebt" }),
      fiscalYear: fiscalYearFrom(liabilities),
      period: liabilities.period ?? liabilities.asOf ?? null,
      value: null,
      unit: liabilities.unit?.trim() || "unknown",
      status: "ambiguous",
      rawPath: rawPath(liabilities),
      provenanceNote:
        "A liabilities field was present and was explicitly rejected as a totalDebt mapping.",
      caveat:
        bankCaveat ?? "Total liabilities must never be substituted for total debt.",
    };
  } else {
    totalDebt = missingRow(
      normalizedTicker,
      "totalDebt",
      bankCaveat ?? "No explicit total debt or borrowings field was present.",
    );
  }

  const sharesRaw = findField(fields, SHARES_KEYS);
  const sharesOutstanding = sharesRaw
    ? candidateFromExplicitField({
        ticker: normalizedTicker,
        targetField: "sharesOutstanding",
        raw: sharesRaw,
        defaultUnit: "shares",
        bankCaveat,
      })
    : missingRow(
        normalizedTicker,
        "sharesOutstanding",
        "Charter capital, share capital, and listed volume were not used as substitutes.",
      );

  return [eps, totalDebt, sharesOutstanding];
};
