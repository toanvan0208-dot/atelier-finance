import "dotenv/config";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { prisma } from "../src/lib/database/client";

type CsvRow = Record<string, string>;
type TargetTicker = "HPG" | "VNM" | "MWG";
type InvalidImportRow = {
  accepted: false;
  blockers: string[];
  index: number;
  ticker: string;
};
type ValidImportRow = {
  accepted: true;
  asOf: Date;
  closePrice: number;
  collectedAt: Date;
  currency: string;
  exchange: string | null;
  highPrice: number;
  index: number;
  lowPrice: number;
  openPrice: number;
  period: string;
  ticker: TargetTicker;
  tradingDate: Date;
  tradingValue: number;
  volume: number;
  warningCodes: string[];
};
type ImportRow = InvalidImportRow | ValidImportRow;

const targetTickers = new Set<TargetTicker>(["HPG", "VNM", "MWG"]);
const csvPath = process.argv.find((arg) => arg.startsWith("--csv="))?.slice("--csv=".length) ??
  "D:/market_prices_hpg_vnm_mwg_from_2020.csv";
const confirmWrite = process.argv.includes("--confirm-write");
const expectedSourceLabel = "VNStock historical market price";

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsv = (text: string): CsvRow[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
};

const parseDate = (value: string): Date | null => {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value: string): boolean | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
};

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);

async function run() {
  const source = await prisma.dataSource.upsert({
    where: {
      name_sourceType: {
        name: expectedSourceLabel,
        sourceType: "user_input",
      },
    },
    update: {
      accessMethod: "manual_upload",
      cachingAllowed: "unknown",
      derivedDataAllowed: "unknown",
      licenseStatus: "needs_review",
      notes: "Local HPG/VNM/MWG market price history imported from controlled CSV on D drive.",
      redistributionAllowed: "unknown",
      runtimeDisplayAllowed: "unknown",
      supportedDataGroups: JSON.stringify(["market_prices", "technical_pvt"]),
      tosStatus: "needs_review",
      usageStatus: "research_only",
    },
    create: {
      accessMethod: "manual_upload",
      cachingAllowed: "unknown",
      derivedDataAllowed: "unknown",
      licenseStatus: "needs_review",
      name: expectedSourceLabel,
      notes: "Local HPG/VNM/MWG market price history imported from controlled CSV on D drive.",
      redistributionAllowed: "unknown",
      runtimeDisplayAllowed: "unknown",
      sourceType: "user_input",
      supportedDataGroups: JSON.stringify(["market_prices", "technical_pvt"]),
      tosStatus: "needs_review",
      usageStatus: "research_only",
    },
    select: { id: true, name: true },
  });

  const rows = parseCsv(readFileSync(resolve(csvPath), "utf-8"));
  const accepted: ImportRow[] = rows.flatMap<ImportRow>((row, index) => {
  const ticker = row.ticker?.trim().toUpperCase() as TargetTicker;
  const tradingDate = parseDate(row.time ?? "");
  const sourceLabel = row.sourceLabel?.trim();
  const dataMode = row.dataMode?.trim();
  const productionApproved = parseBoolean(row.productionApproved ?? "");
  const needsReview = parseBoolean(row.needsReview ?? "");
  const priceUnit = row.priceUnit?.trim();
  const volumeUnit = row.volumeUnit?.trim();
  const liquidityUnit = row.liquidityUnit?.trim();
  const currency = row.currency?.trim();
  const warningCodes = (row.warningCodes ?? "").split(";").map((item) => item.trim()).filter(Boolean);

  const blockers = [
    targetTickers.has(ticker) ? "" : "ticker_not_allowed",
    tradingDate ? "" : "trading_date_invalid",
    sourceLabel === expectedSourceLabel ? "" : "source_label_unexpected",
    dataMode === "research_only" ? "" : "data_mode_unexpected",
    productionApproved === false ? "" : "production_approval_not_false",
    needsReview === true ? "" : "needs_review_not_true",
    priceUnit === "vnd_per_share" ? "" : "price_unit_unexpected",
    volumeUnit === "shares" ? "" : "volume_unit_unexpected",
    liquidityUnit === "vnd" ? "" : "liquidity_unit_unexpected",
    currency === "VND" ? "" : "currency_unexpected",
  ].filter(Boolean);

  const openPrice = parseNumber(row.openPrice ?? "");
  const highPrice = parseNumber(row.highPrice ?? "");
  const lowPrice = parseNumber(row.lowPrice ?? "");
  const closePrice = parseNumber(row.closePrice ?? "");
  const volume = parseNumber(row.volume ?? "");
  const tradingValue = parseNumber(row.liquidity ?? "");

  if (openPrice === null || highPrice === null || lowPrice === null || closePrice === null) {
    blockers.push("ohlc_missing");
  }
  if (volume === null) blockers.push("volume_missing");
  if (tradingValue === null) blockers.push("trading_value_missing");

  if (blockers.length > 0 || !tradingDate) {
    return [{
      accepted: false as const,
      blockers,
      index: index + 1,
      ticker: row.ticker ?? "",
    }];
  }

  return [{
    accepted: true as const,
    asOf: parseDate(row.actualEndDate ?? "") ?? tradingDate,
    closePrice: closePrice as number,
    collectedAt: new Date(),
    currency: currency ?? "VND",
    exchange: row.exchange?.trim() || null,
    highPrice: highPrice as number,
    index: index + 1,
    lowPrice: lowPrice as number,
    openPrice: openPrice as number,
    period: dateOnly(tradingDate),
    ticker,
    tradingDate,
    tradingValue: tradingValue as number,
    volume: volume as number,
    warningCodes,
  }];
  });

  const invalid = accepted.filter((row): row is InvalidImportRow => !row.accepted);
  const valid = accepted.filter((row): row is ValidImportRow => row.accepted);

  let created = 0;
  let updated = 0;
  let metadataUpserted = 0;
  let provenanceUpserted = 0;

  if (confirmWrite && invalid.length === 0) {
    await prisma.$transaction(async (tx) => {
    for (const row of valid) {
      const company =
        (await tx.company.findFirst({
          where: { ticker: row.ticker },
          orderBy: [{ dataMode: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        })) ??
        (await tx.company.create({
          data: {
            companyName: `${row.ticker} research company`,
            country: "VN",
            currency: "VND",
            dataMode: "research_only",
            exchange: row.exchange,
            profileAsOf: row.asOf,
            profileSourceId: source.id,
            ticker: row.ticker,
          },
          select: { id: true },
        }));

      const existing = await tx.marketPrice.findFirst({
        where: {
          dataMode: "research_only",
          sourceId: source.id,
          ticker: row.ticker,
          tradingDate: row.tradingDate,
        },
        select: { id: true },
      });

      const marketPriceData = {
        asOf: row.asOf,
        closePrice: row.closePrice,
        collectedAt: row.collectedAt,
        companyId: company.id,
        currency: row.currency,
        dataMode: "research_only" as const,
        errorCodes: "[]",
        highPrice: row.highPrice,
        lowPrice: row.lowPrice,
        missingFields: "[]",
        openPrice: row.openPrice,
        period: row.period,
        periodType: "day" as const,
        qualityStatus: "usable_with_caution" as const,
        readiness: "needs_review" as const,
        sourceId: source.id,
        sourceLabel: source.name,
        sourceType: "user_input" as const,
        ticker: row.ticker,
        tradingDate: row.tradingDate,
        tradingValue: row.tradingValue,
        volume: row.volume,
        warningCodes: JSON.stringify(row.warningCodes),
      };

      const marketPrice = existing
        ? await tx.marketPrice.update({ where: { id: existing.id }, data: marketPriceData, select: { id: true } })
        : await tx.marketPrice.create({ data: marketPriceData, select: { id: true } });

      if (existing) updated += 1;
      else created += 1;

      for (const [field, unit, value] of [
        ["marketPrice", "vnd_per_share", row.closePrice],
        ["volume", "shares", row.volume],
        ["tradingValue", "vnd", row.tradingValue],
      ] as const) {
        await tx.marketPriceUnitMetadata.upsert({
          where: { marketPriceId_field: { field, marketPriceId: marketPrice.id } },
          update: {
            asOf: row.asOf,
            dataMode: "research_only",
            productionApproved: false,
            source: "local_research",
            sourceLabel: source.name,
            status: "ready",
            unit,
            warningCodes: "[]",
          },
          create: {
            asOf: row.asOf,
            dataMode: "research_only",
            field,
            marketPriceId: marketPrice.id,
            productionApproved: false,
            source: "local_research",
            sourceLabel: source.name,
            status: "ready",
            unit,
            warningCodes: "[]",
          },
        });
        metadataUpserted += 1;
      }

      await tx.marketPriceProvenanceMetadata.upsert({
        where: {
          ticker_marketDate_sourceLabel: {
            marketDate: row.tradingDate,
            sourceLabel: source.name,
            ticker: row.ticker,
          },
        },
        update: {
          adjustmentStatus: "needs_review",
          currency: row.currency,
          dataMode: "research_only",
          exchange: row.exchange,
          fallbackUsed: false,
          fetchedAt: row.collectedAt,
          needsReview: true,
          priceUnit: "vnd_per_share",
          productionApproved: false,
          providerName: "VNStock",
          providerType: "third_party_tool",
          stalenessStatus: "historical_series",
          volumeUnit: "shares",
          warningCodes: row.warningCodes,
        },
        create: {
          adjustmentStatus: "needs_review",
          currency: row.currency,
          dataMode: "research_only",
          exchange: row.exchange,
          fallbackUsed: false,
          fetchedAt: row.collectedAt,
          marketDate: row.tradingDate,
          needsReview: true,
          priceUnit: "vnd_per_share",
          productionApproved: false,
          providerName: "VNStock",
          providerType: "third_party_tool",
          sourceLabel: source.name,
          stalenessStatus: "historical_series",
          ticker: row.ticker,
          volumeUnit: "shares",
          warningCodes: row.warningCodes,
        },
      });
      provenanceUpserted += 1;
    }
    }, { maxWait: 20_000, timeout: 300_000 });
  }

  const counts = await prisma.marketPrice.groupBy({
    by: ["ticker"],
    where: {
      sourceId: source.id,
      ticker: { in: [...targetTickers] },
    },
    _count: { _all: true },
    _min: { tradingDate: true },
    _max: { tradingDate: true },
  });

  console.log(JSON.stringify({
    mode: confirmWrite ? "confirm_write" : "dry_run",
    csvPath,
    sourceLabel: source.name,
    totalRows: rows.length,
    validRows: valid.length,
    invalidRows: invalid.length,
    invalidSamples: invalid.slice(0, 5),
    created,
    updated,
    metadataUpserted,
    provenanceUpserted,
    dbCounts: counts.map((item) => ({
      ticker: item.ticker,
      count: item._count._all,
      from: item._min.tradingDate ? dateOnly(item._min.tradingDate) : null,
      to: item._max.tradingDate ? dateOnly(item._max.tradingDate) : null,
    })),
    productionApproved: false,
  }, null, 2));

  if (invalid.length > 0) {
    process.exitCode = 1;
  }
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
