import { DataMode } from "../../../generated/prisma/client";
import { prisma, type DatabaseClient } from "../client";
import { normalizeTicker, safeLimit, type ServiceOptions } from "./service-utils";

export type FinancialStatementQueryOptions = ServiceOptions & {
  db?: DatabaseClient;
};

const financialStatementSourceSelect = {
  id: true,
  name: true,
  sourceType: true,
  usageStatus: true,
  licenseStatus: true,
  tosStatus: true,
  accessMethod: true,
} as const;

export const getFinancialStatementsByTicker = (
  ticker: string,
  {
    dataMode,
    includeBlocked = false,
    limit,
    db = prisma,
  }: FinancialStatementQueryOptions = {},
) => {
  const normalizedTicker = normalizeTicker(ticker);

  return db.financialStatement.findMany({
    where: {
      ticker: normalizedTicker,
      ...(dataMode ? { dataMode } : includeBlocked ? {} : { dataMode: { not: DataMode.blocked } }),
    },
    orderBy: [
      { fiscalYear: "desc" },
      { fiscalQuarter: "desc" },
      { asOf: "desc" },
      { createdAt: "desc" },
    ],
    take: safeLimit(limit, 40),
    include: {
      source: {
        select: financialStatementSourceSelect,
      },
    },
  });
};

export const getLatestFinancialStatement = async (
  ticker: string,
  options: FinancialStatementQueryOptions = {},
) => {
  const statements = await getFinancialStatementsByTicker(ticker, {
    ...options,
    limit: 1,
  });

  return statements[0] ?? null;
};
