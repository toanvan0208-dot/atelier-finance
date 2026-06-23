import { type VnstockFinancialsCandidateRow, VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL } from "./vnstock-financials-candidate";
import type { FinancialStatementImportRow } from "./financial-statement-import-contract";

export type BuildCandidateImportRowsResult = {
  rows: FinancialStatementImportRow[];
  errors: string[];
};

export const buildCandidateImportRows = (
  candidates: VnstockFinancialsCandidateRow[]
): BuildCandidateImportRowsResult => {
  const errors: string[] = [];
  const groups = new Map<string, FinancialStatementImportRow>();

  for (const c of candidates) {
    if (c.field === "totalDebt" && c.value !== null && c.status === "candidate") {
      errors.push(`totalDebt must not be imported. Found valid candidate for ${c.ticker}.`);
      continue;
    }

    if (!c.fiscalYear) {
      continue;
    }

    const key = `${c.ticker}-${c.fiscalYear}`;
    let row = groups.get(key);
    if (!row) {
      row = {
        ticker: c.ticker,
        fiscalYear: c.fiscalYear,
        periodType: "annual",
        sourceLabel: VNSTOCK_FINANCIALS_CANDIDATE_SOURCE_LABEL,
        dataMode: "research_only",
        productionApproved: false,
      };
      groups.set(key, row);
    }

    if (c.field === "eps" && c.value !== null && c.status === "candidate") {
      row.eps = c.value;
      row.epsUnit = c.unit;
    } else if (c.field === "sharesOutstanding" && c.value !== null && c.status === "candidate") {
      row.sharesOutstanding = c.value;
      row.sharesOutstandingUnit = c.unit;
    }
    // We explicitly ignore everything else, including totalDebt
  }

  return {
    rows: Array.from(groups.values()),
    errors,
  };
};
