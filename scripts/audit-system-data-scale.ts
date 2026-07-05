import { prisma } from "../src/lib/database/client";
import {
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculatePsRatio,
} from "../src/lib/financial-logic";

const tickers = ["HPG", "FPT", "MWG", "VNM", "MSN", "HSG", "NKG"];

type DecimalLike = { toString(): string };

const toNumber = (value: DecimalLike | number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(typeof value === "object" ? value.toString() : value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ratio = (a: number | null, b: number | null): number | null => {
  if (a === null || b === null || b === 0) return null;
  return a / b;
};

const classifyPriceScale = (price: number | null): string => {
  if (price === null) return "missing";
  if (price > 1_000) return "looks_vnd_per_share";
  if (price > 1 && price < 1_000) return "looks_thousand_vnd_per_share";
  return "suspicious_low_price";
};

const classifyShareScale = (shares: number | null): string => {
  if (shares === null) return "missing";
  if (shares > 100_000_000) return "looks_shares";
  if (shares > 100 && shares < 100_000) return "looks_million_shares";
  return "suspicious_share_scale";
};

const round = (value: number | null, digits = 6): number | null =>
  value === null ? null : Number(value.toFixed(digits));

const auditTicker = async (ticker: string) => {
  const [market, financial] = await Promise.all([
    prisma.marketPrice.findFirst({
      where: { ticker },
      orderBy: [{ tradingDate: "desc" }, { asOf: "desc" }, { createdAt: "desc" }],
      include: { unitMetadata: true },
    }),
    prisma.financialStatement.findFirst({
      where: { ticker },
      orderBy: [
        { fiscalYear: "desc" },
        { fiscalQuarter: "desc" },
        { asOf: "desc" },
        { createdAt: "desc" },
      ],
    }),
  ]);

  const closePrice = toNumber(market?.closePrice);
  const adjustedClosePrice = toNumber(market?.adjustedClosePrice);
  const valuationClosePrice = adjustedClosePrice ?? closePrice;
  const eps = toNumber(financial?.eps);
  const bvps = toNumber(financial?.bvps);
  const sharesOutstanding = toNumber(financial?.sharesOutstanding);
  const revenue = toNumber(financial?.revenue);
  const equity = toNumber(financial?.equity);
  const netIncome = toNumber(financial?.netIncome);
  const computedPe = calculatePeRatio({
    closePrice: valuationClosePrice,
    eps,
  });
  const computedPb = calculatePbRatio({
    closePrice: valuationClosePrice,
    bvps,
  });
  const computedPs = calculatePsRatio({
    closePrice: valuationClosePrice,
    revenue,
    sharesOutstanding,
  });
  const computedMarketCap = calculateMarketCap({
    closePrice: valuationClosePrice,
    sharesOutstanding,
  });
  const closeToAdjustedRatio = ratio(closePrice, adjustedClosePrice);
  const priceToEps = ratio(valuationClosePrice, eps);

  const findings = [
    closeToAdjustedRatio !== null && closeToAdjustedRatio >= 900 && closeToAdjustedRatio <= 1_100
      ? "adjustedClosePrice_appears_1000x_smaller_than_closePrice"
      : null,
    closeToAdjustedRatio !== null && closeToAdjustedRatio >= 90 && closeToAdjustedRatio <= 110
      ? "adjustedClosePrice_appears_100x_smaller_than_closePrice"
      : null,
    classifyPriceScale(valuationClosePrice) !== "looks_vnd_per_share"
      ? `valuation_price_scale_${classifyPriceScale(valuationClosePrice)}`
      : null,
    classifyShareScale(sharesOutstanding) !== "looks_shares"
      ? `shares_scale_${classifyShareScale(sharesOutstanding)}`
      : null,
    computedPe.value !== null && computedPe.value < 0.1 ? "pe_suspiciously_low_possible_price_scale_issue" : null,
    computedPb.value !== null && computedPb.value < 0.1 ? "pb_suspiciously_low_possible_price_scale_issue" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    ticker,
    market: market
      ? {
          tradingDate: market.tradingDate.toISOString().slice(0, 10),
          closePrice,
          adjustedClosePrice,
          valuationClosePrice,
          priceScale: classifyPriceScale(valuationClosePrice),
          closeToAdjustedRatio: round(closeToAdjustedRatio, 3),
          sourceLabel: market.sourceLabel,
          dataMode: market.dataMode,
          unitMetadataCount: market.unitMetadata.length,
          unitMetadata: market.unitMetadata.map((item) => ({
            field: item.field,
            unit: item.unit,
            status: item.status,
            warningCodes: item.warningCodes,
          })),
        }
      : null,
    financials: financial
      ? {
          period: financial.period,
          periodType: financial.periodType,
          revenue,
          netIncome,
          equity,
          eps,
          bvps,
          sharesOutstanding,
          sharesScale: classifyShareScale(sharesOutstanding),
          sourceLabel: financial.sourceLabel,
          dataMode: financial.dataMode,
        }
      : null,
    recomputedMetrics: {
      pe: round(computedPe.value),
      pb: round(computedPb.value),
      ps: round(computedPs.value),
      marketCap: round(computedMarketCap.value, 0),
      priceToEps: round(priceToEps),
    },
    findings,
  };
};

const main = async () => {
  const results = [];
  for (const ticker of tickers) {
    results.push(await auditTicker(ticker));
  }

  const findings = results.flatMap((result) =>
    result.findings.map((finding) => ({ ticker: result.ticker, finding })),
  );

  console.log(
    JSON.stringify(
      {
        mode: "system_data_scale_audit",
        dbWriteAttempted: false,
        providerFetchAttempted: false,
        tickers,
        findingCount: findings.length,
        findings,
        results,
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
