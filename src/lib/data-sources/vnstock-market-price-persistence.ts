import {
  VNSTOCK_RESEARCH_ATTRIBUTION,
  VNSTOCK_RESEARCH_SOURCE_POLICY,
  type VnstockResearchMarketPriceRecord,
} from "./vnstock-research-connector";

type PersistenceSourceMetadata = Partial<typeof VNSTOCK_RESEARCH_SOURCE_POLICY> | null | undefined;

export type VnstockMarketPriceDuplicatePolicy = "skip" | "update";

export type PersistVnstockResearchMarketPricesInput = {
  records: VnstockResearchMarketPriceRecord[];
  sourceMetadata: PersistenceSourceMetadata;
};

export type PersistVnstockResearchMarketPricesOptions = {
  db?: VnstockMarketPricePersistenceDb;
  duplicatePolicy?: VnstockMarketPriceDuplicatePolicy;
};

export type PersistVnstockResearchMarketPricesResult = {
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  rejectedCount: number;
  warnings: string[];
  sourceMetadata: typeof VNSTOCK_RESEARCH_SOURCE_POLICY | null;
  productionApproved: false;
};

type PersistableMarketPriceRecord = VnstockResearchMarketPriceRecord & {
  tradingDate: Date;
  asOfDate: Date;
  retrievedAtDate: Date;
  period: string;
};

type VnstockMarketPricePersistenceTx = {
  dataSource: {
    upsert: (args: unknown) => Promise<{ id: string; name: string }>;
  };
  company: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<{ id: string }>;
  };
  marketPrice: {
    findFirst: (args: unknown) => Promise<{ id: string; dataMode?: string; sourceType?: string } | null>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
};

export type VnstockMarketPricePersistenceDb = {
  $transaction: <T>(fn: (tx: VnstockMarketPricePersistenceTx) => Promise<T>) => Promise<T>;
};

const VNSTOCK_SOURCE_NAME = "vnstock";
const MARKET_DATA_GROUPS = JSON.stringify(["market_prices"]);

const isExpectedSourceMetadata = (
  sourceMetadata: PersistenceSourceMetadata,
): sourceMetadata is typeof VNSTOCK_RESEARCH_SOURCE_POLICY =>
  sourceMetadata !== null &&
  sourceMetadata !== undefined &&
  sourceMetadata.provider === VNSTOCK_RESEARCH_SOURCE_POLICY.provider &&
  sourceMetadata.sourceType === VNSTOCK_RESEARCH_SOURCE_POLICY.sourceType &&
  sourceMetadata.usageScope === VNSTOCK_RESEARCH_SOURCE_POLICY.usageScope &&
  sourceMetadata.productionApproved === false;

const parseRequiredDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const datePeriod = (date: Date): string => date.toISOString().slice(0, 10);

const missingNumericFields = (record: VnstockResearchMarketPriceRecord): string[] =>
  (["open", "high", "low", "close", "volume", "tradingValue"] as const).filter(
    (field) => record[field] === null,
  );

const validateRecord = (
  record: VnstockResearchMarketPriceRecord,
): { record: PersistableMarketPriceRecord | null; warnings: string[] } => {
  const warnings: string[] = [];
  const ticker = record.ticker.trim().toUpperCase();
  const tradingDate = parseRequiredDate(record.date);
  const asOfDate = parseRequiredDate(record.asOf ?? record.date);
  const retrievedAtDate = parseRequiredDate(record.retrievedAt);

  if (!ticker) warnings.push("Market price record rejected because ticker is missing.");
  if (!tradingDate) warnings.push(`Market price record for ${ticker || "unknown"} rejected because date is invalid.`);
  if (!asOfDate) warnings.push(`Market price record for ${ticker || "unknown"} rejected because asOf is invalid.`);
  if (!retrievedAtDate) {
    warnings.push(`Market price record for ${ticker || "unknown"} rejected because retrievedAt is invalid.`);
  }
  if (
    record.sourceProvider !== "vnstock" ||
    record.sourceType !== "third_party_tool" ||
    record.usageScope !== "academic_non_commercial"
  ) {
    warnings.push(`Market price record for ${ticker || "unknown"} rejected because source metadata is invalid.`);
  }
  if (record.productionApproved !== false) {
    warnings.push(`Market price record for ${ticker || "unknown"} rejected because production approval is not false.`);
  }

  if (!ticker || !tradingDate || !asOfDate || !retrievedAtDate || warnings.length > 0) {
    return { record: null, warnings };
  }

  return {
    record: {
      ...record,
      ticker,
      tradingDate,
      asOfDate,
      retrievedAtDate,
      period: datePeriod(tradingDate),
    },
    warnings,
  };
};

const resolveDb = async (
  db: VnstockMarketPricePersistenceDb | undefined,
): Promise<VnstockMarketPricePersistenceDb> => {
  if (db) return db;
  const database = await import("../database/client");
  return database.prisma as unknown as VnstockMarketPricePersistenceDb;
};

const marketPriceData = ({
  companyId,
  sourceId,
  sourceName,
  record,
}: {
  companyId: string;
  sourceId: string;
  sourceName: string;
  record: PersistableMarketPriceRecord;
}) => {
  const missingFields = missingNumericFields(record);

  return {
    companyId,
    ticker: record.ticker,
    tradingDate: record.tradingDate,
    periodType: "day",
    period: record.period,
    openPrice: record.open,
    highPrice: record.high,
    lowPrice: record.low,
    closePrice: record.close,
    volume: record.volume,
    tradingValue: record.tradingValue,
    sourceId,
    sourceLabel: sourceName,
    sourceType: "unknown",
    dataMode: "research_only",
    asOf: record.asOfDate,
    collectedAt: record.retrievedAtDate,
    qualityStatus: missingFields.length > 0 || record.warnings.length > 0 ? "partial" : "usable_with_caution",
    readiness: missingFields.length > 0 || record.warnings.length > 0 ? "needs_review" : "ready",
    missingFields: JSON.stringify(missingFields),
    warningCodes: JSON.stringify(record.warnings.length > 0 ? ["VNSTOCK_RECORD_WARNING"] : []),
    errorCodes: "[]",
  };
};

export const persistVnstockResearchMarketPrices = async (
  input: PersistVnstockResearchMarketPricesInput,
  { db, duplicatePolicy = "skip" }: PersistVnstockResearchMarketPricesOptions = {},
): Promise<PersistVnstockResearchMarketPricesResult> => {
  const warnings: string[] = [];

  if (!isExpectedSourceMetadata(input.sourceMetadata)) {
    return {
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      rejectedCount: input.records.length,
      warnings: ["Vnstock market price persistence rejected because source metadata is missing or unsafe."],
      sourceMetadata: null,
      productionApproved: false,
    };
  }

  const validatedRecords = input.records.map(validateRecord);
  const records = validatedRecords.flatMap((result) => (result.record ? [result.record] : []));
  warnings.push(...validatedRecords.flatMap((result) => result.warnings));

  const client = await resolveDb(db);

  return client.$transaction(async (tx) => {
    const source = await tx.dataSource.upsert({
      where: {
        name_sourceType: {
          name: VNSTOCK_SOURCE_NAME,
          sourceType: "unknown",
        },
      },
      update: {
        supportedDataGroups: MARKET_DATA_GROUPS,
        usageStatus: "research_only",
        licenseStatus: "needs_review",
        tosStatus: "needs_review",
        accessMethod: "unknown",
        cachingAllowed: "unknown",
        redistributionAllowed: "unknown",
        runtimeDisplayAllowed: "unknown",
        derivedDataAllowed: "unknown",
        attributionText: VNSTOCK_RESEARCH_ATTRIBUTION,
        notes: "Vnstock market prices are stored only for controlled local academic research validation.",
      },
      create: {
        name: VNSTOCK_SOURCE_NAME,
        sourceType: "unknown",
        supportedDataGroups: MARKET_DATA_GROUPS,
        usageStatus: "research_only",
        licenseStatus: "needs_review",
        tosStatus: "needs_review",
        accessMethod: "unknown",
        cachingAllowed: "unknown",
        redistributionAllowed: "unknown",
        runtimeDisplayAllowed: "unknown",
        derivedDataAllowed: "unknown",
        attributionText: VNSTOCK_RESEARCH_ATTRIBUTION,
        notes: "Vnstock market prices are stored only for controlled local academic research validation.",
      },
    });

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const record of records) {
      const company =
        (await tx.company.findFirst({
          where: {
            ticker: record.ticker,
          },
          orderBy: [{ dataMode: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        })) ??
        (await tx.company.create({
          data: {
            ticker: record.ticker,
            exchange: null,
            companyName: `${record.ticker} research company`,
            country: "VN",
            currency: "VND",
            dataMode: "research_only",
            profileSourceId: source.id,
            profileAsOf: record.asOfDate,
          },
          select: { id: true },
        }));

      const manualConflict = await tx.marketPrice.findFirst({
        where: {
          ticker: record.ticker,
          tradingDate: record.tradingDate,
          dataMode: "user_input",
        },
        select: { id: true, dataMode: true, sourceType: true },
      });

      if (manualConflict) {
        warnings.push(
          `Manual/user market price for ${record.ticker} ${record.period} was left unchanged; Vnstock research record is stored separately if not already present.`,
        );
      }

      const existing = await tx.marketPrice.findFirst({
        where: {
          ticker: record.ticker,
          tradingDate: record.tradingDate,
          sourceId: source.id,
          dataMode: "research_only",
        },
        select: { id: true, dataMode: true, sourceType: true },
      });

      const data = marketPriceData({
        companyId: company.id,
        sourceId: source.id,
        sourceName: source.name,
        record,
      });

      if (!existing) {
        await tx.marketPrice.create({ data });
        insertedCount += 1;
        continue;
      }

      if (existing.dataMode === "user_input" || existing.sourceType === "user_input") {
        skippedCount += 1;
        warnings.push(`Existing user/manual market price for ${record.ticker} ${record.period} was not overwritten.`);
        continue;
      }

      if (duplicatePolicy === "update") {
        await tx.marketPrice.update({
          where: { id: existing.id },
          data,
        });
        updatedCount += 1;
        continue;
      }

      skippedCount += 1;
      warnings.push(`Duplicate Vnstock research market price for ${record.ticker} ${record.period} was skipped.`);
    }

    return {
      insertedCount,
      updatedCount,
      skippedCount,
      rejectedCount: input.records.length - records.length,
      warnings,
      sourceMetadata: VNSTOCK_RESEARCH_SOURCE_POLICY,
      productionApproved: false,
    };
  });
};
