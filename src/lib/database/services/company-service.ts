import { DataMode } from "../../../generated/prisma/client";
import { prisma, type DatabaseClient } from "../client";
import { normalizeTicker, safeLimit, type ServiceOptions } from "./service-utils";

export type ListCompaniesOptions = ServiceOptions & {
  db?: DatabaseClient;
};

export type GetCompanyByTickerOptions = {
  db?: DatabaseClient;
  includeBlocked?: boolean;
};

export const listCompanies = ({
  dataMode,
  includeBlocked = false,
  limit,
  db = prisma,
}: ListCompaniesOptions = {}) =>
  db.company.findMany({
    where: {
      ...(dataMode ? { dataMode } : includeBlocked ? {} : { dataMode: { not: DataMode.blocked } }),
    },
    orderBy: [{ ticker: "asc" }, { exchange: "asc" }],
    take: safeLimit(limit, 100),
    include: {
      profileSource: {
        select: {
          id: true,
          name: true,
          sourceType: true,
          usageStatus: true,
          licenseStatus: true,
          tosStatus: true,
        },
      },
    },
  });

export const getCompanyByTicker = (
  ticker: string,
  { db = prisma, includeBlocked = false }: GetCompanyByTickerOptions = {},
) => {
  const normalizedTicker = normalizeTicker(ticker);

  return db.company.findFirst({
    where: {
      ticker: normalizedTicker,
      ...(includeBlocked ? {} : { dataMode: { not: DataMode.blocked } }),
    },
    include: {
      profileSource: {
        select: {
          id: true,
          name: true,
          sourceType: true,
          usageStatus: true,
          licenseStatus: true,
          tosStatus: true,
        },
      },
    },
  });
};
