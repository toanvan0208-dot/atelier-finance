export type LongSafeFinancialsCsvRow = {
  ticker: string;
  reportType: string;
  year: string;
  item: string;
  itemId: string;
  value: string;
  sourceLabel: string;
  dataMode: string;
  needsReview: string;
  productionApproved: string;
  fetchedAt: string;
  fetchStatus: string;
  error: string;
};

export const LONG_SAFE_FINANCIALS_SOURCE_LABEL = "VNStock financial statements long safe CSV";

export type LongSafeFinancialStatementCandidate = {
  ticker: string;
  fiscalYear: number;
  period: string;
  sourceLabel: string;
  dataMode: "research_only";
  fetchedAt: string | null;
  values: {
    revenue: number | null;
    grossProfit: number | null;
    netIncome: number | null;
    operatingCashFlow: number | null;
    eps: number | null;
  };
  selectedRows: Record<string, { item: string; itemId: string; reportType: string }>;
  missingFields: string[];
  warningCodes: string[];
};

const requiredHeaders = [
  "ticker",
  "reportType",
  "year",
  "item",
  "itemId",
  "value",
  "sourceLabel",
  "dataMode",
  "needsReview",
  "productionApproved",
  "fetchedAt",
  "fetchStatus",
  "error",
] as const;

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

export const parseLongSafeFinancialsCsv = (text: string): LongSafeFinancialsCsvRow[] => {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required headers: ${missingHeaders.join(", ")}`);
  }

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
    return row as LongSafeFinancialsCsvRow;
  });
};

const toNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeValue = (
  field: keyof LongSafeFinancialStatementCandidate["values"],
  value: number,
): number => {
  if (field === "eps" && Math.abs(value) >= 100_000) {
    return value / 1_000;
  }
  return value;
};

const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase();

const isTrue = (value: string): boolean => value.trim().toLowerCase() === "true";

const shouldUseNetRevenueRow = (row: LongSafeFinancialsCsvRow): boolean =>
  row.reportType === "income_statement" && row.itemId === "revenue" && row.item.trim().startsWith("3.");

const fieldForRow = (row: LongSafeFinancialsCsvRow): keyof LongSafeFinancialStatementCandidate["values"] | null => {
  if (shouldUseNetRevenueRow(row)) return "revenue";
  if (row.reportType === "income_statement" && row.itemId === "gross_profit") return "grossProfit";
  if (row.reportType === "income_statement" && row.itemId === "net_profit") return "netIncome";
  if (row.reportType === "cash_flow" && row.itemId === "operating_cash_flow") return "operatingCashFlow";
  if (row.reportType === "income_statement" && row.itemId === "earnings_per_share_vnd") return "eps";
  return null;
};

const sortYearsDesc = (years: number[]): number[] => [...years].sort((a, b) => b - a);

export const buildLongSafeFinancialStatementCandidates = (
  rows: LongSafeFinancialsCsvRow[],
): LongSafeFinancialStatementCandidate[] => {
  const tickers = Array.from(new Set(rows.map((row) => normalizeTicker(row.ticker)).filter(Boolean))).sort();
  const candidates: LongSafeFinancialStatementCandidate[] = [];

  for (const ticker of tickers) {
    const years = sortYearsDesc(
      Array.from(
        new Set(
          rows
            .filter((row) => normalizeTicker(row.ticker) === ticker && /^\d{4}$/.test(row.year))
            .map((row) => Number(row.year)),
        ),
      ),
    );

    for (const fiscalYear of years) {
      const yearRows = rows.filter((row) => normalizeTicker(row.ticker) === ticker && row.year === String(fiscalYear));
      const sourceLabel = yearRows.find((row) => row.sourceLabel.trim())?.sourceLabel.trim() || "VNStock financial statements";
      const fetchedAt = yearRows.find((row) => row.fetchedAt.trim())?.fetchedAt.trim() || null;
      const values: LongSafeFinancialStatementCandidate["values"] = {
        eps: null,
        grossProfit: null,
        netIncome: null,
        operatingCashFlow: null,
        revenue: null,
      };
      const selectedRows: LongSafeFinancialStatementCandidate["selectedRows"] = {};
      const warningCodes = new Set<string>(["VNSTOCK_LONG_SAFE_CSV", "RESEARCH_ONLY", "NEEDS_REVIEW"]);

      for (const row of yearRows) {
        if (row.fetchStatus !== "ok") {
          warningCodes.add(`${row.reportType.toUpperCase()}_FETCH_${row.fetchStatus.toUpperCase() || "UNKNOWN"}`);
          continue;
        }
        if (isTrue(row.productionApproved)) {
          warningCodes.add("PRODUCTION_APPROVED_TRUE_BLOCKED");
          continue;
        }

        const field = fieldForRow(row);
        if (!field) continue;
        const value = toNumber(row.value);
        if (value === null) continue;
        values[field] = normalizeValue(field, value);
        selectedRows[field] = {
          item: row.item,
          itemId: row.itemId,
          reportType: row.reportType,
        };
      }

      const missingFields = (Object.keys(values) as Array<keyof typeof values>).filter((field) => values[field] === null);
      if (missingFields.length > 0) warningCodes.add("PARTIAL_FINANCIAL_STATEMENT");

      candidates.push({
        dataMode: "research_only",
        fetchedAt,
        fiscalYear,
        missingFields,
        period: String(fiscalYear),
        selectedRows,
        sourceLabel,
        ticker,
        values,
        warningCodes: Array.from(warningCodes).sort(),
      });
    }
  }

  return candidates;
};
