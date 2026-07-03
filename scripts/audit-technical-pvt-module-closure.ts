import "dotenv/config";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "../src/lib/database/client";
import { TechnicalPage } from "../src/features/technical/components/TechnicalPage";
import { loadTechnicalRuntimeData } from "../src/features/technical/lib/load-technical-runtime-data";

const TARGET_TICKERS = ["HPG", "VNM", "MWG"] as const;
const DISPLAY_ONLY_TICKERS = ["FPT", "MSN", "VCB"] as const;
const INDEX_SYMBOLS = ["VNINDEX", "VN30", "VNMAT", "VNCONS"] as const;
const SECTOR_PROXY_BY_TICKER: Record<(typeof TARGET_TICKERS)[number], "VNMAT" | "VNCONS"> = {
  HPG: "VNMAT",
  VNM: "VNCONS",
  MWG: "VNCONS",
};
const HISTORICAL_SOURCE_LABEL = "VNStock historical market price";
const EXPECTED_LATEST_DATE = "2026-07-03";

type TargetTicker = (typeof TARGET_TICKERS)[number];
type IndexSymbol = (typeof INDEX_SYMBOLS)[number];

type DateRange = {
  count: number;
  firstDate: string | null;
  latestDate: string | null;
};

type RuntimeAudit = {
  ticker: TargetTicker;
  ok: boolean;
  fallbackUsed: boolean;
  sourceLabel: string | null;
  sourceType: string | null;
  pointsCount: number;
  volumeCount: number;
  chartPointCount: number;
  pvtStatus: string | null;
  latestChartLabel: string | null;
  relativeComputable: boolean;
  sectorProxySymbol: string | null;
  html: string;
  serializedRuntime: string;
};

type Finding = {
  token: string;
  context: string;
};

const dateOnly = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const normalize = (value: string): string =>
  value
    .normalize("NFC")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ");

const snippet = (source: string, index: number): string =>
  source.slice(Math.max(0, index - 45), Math.min(source.length, index + 90));

const findTokens = (source: string, tokens: string[]): Finding[] => {
  const haystack = normalize(source);
  return tokens.flatMap((token) => {
    const needle = normalize(token);
    const findings: Finding[] = [];
    let cursor = haystack.indexOf(needle);
    while (cursor >= 0) {
      findings.push({ token, context: snippet(haystack, cursor) });
      cursor = haystack.indexOf(needle, cursor + needle.length);
    }
    return findings;
  });
};

const findRegex = (source: string, patterns: RegExp[]): Finding[] => {
  const haystack = normalize(source);
  return patterns.flatMap((pattern) =>
    Array.from(haystack.matchAll(pattern)).map((match) => ({
      token: pattern.toString(),
      context: snippet(haystack, match.index ?? 0),
    })),
  );
};

const removeAllowedBanLe = (source: string): string =>
  source
    .replace(/bán lẻ/gi, "")
    .replace(/b&#xE1;n l&#x1EBB;/gi, "");

const collectStringValues = (value: unknown, skipKeys = new Set<string>()): string[] => {
  if (typeof value === "string") return [value];
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectStringValues(item, skipKeys));
  if (typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
    skipKeys.has(key) ? [] : collectStringValues(item, skipKeys),
  );
};

const rangeFromRows = <T extends { tradingDate: Date }>(rows: T[]): DateRange => ({
  count: rows.length,
  firstDate: rows[0] ? dateOnly(rows[0].tradingDate) : null,
  latestDate: rows.at(-1) ? dateOnly(rows.at(-1)?.tradingDate) : null,
});

const loadRuntimeAudit = async (ticker: TargetTicker): Promise<RuntimeAudit> => {
  const runtime = await loadTechnicalRuntimeData({
    ticker,
    from: "2020-01-01",
    to: EXPECTED_LATEST_DATE,
    sourceLabel: HISTORICAL_SOURCE_LABEL,
    preferDb: true,
    allowFallback: false,
  });
  const component = React.createElement(TechnicalPage, {
    initialRuntimeData: runtime as React.ComponentProps<typeof TechnicalPage>["initialRuntimeData"],
    onNavigate: () => undefined,
  });
  const html = renderToStaticMarkup(component);
  const data = runtime.data;

  return {
    ticker,
    ok: runtime.ok,
    fallbackUsed: runtime.fallbackUsed,
    sourceLabel: runtime.source?.sourceLabel ?? null,
    sourceType: runtime.source?.sourceType ?? null,
    pointsCount: data?.pvtChartSeries?.points.count ?? 0,
    volumeCount: data?.pvtChartSeries?.volume.count ?? 0,
    chartPointCount: data?.chart.points.length ?? 0,
    pvtStatus: data?.pvtChartSeries?.status ?? null,
    latestChartLabel: data?.chart.points.at(-1)?.label ?? null,
    relativeComputable: data?.relativeMetrics?.isComputable ?? false,
    sectorProxySymbol: data?.relativeMetrics?.sectorProxySymbol ?? null,
    html,
    serializedRuntime: JSON.stringify(runtime),
  };
};

const alignedCount = (
  stockDates: Set<string>,
  indexRows: Array<{ tradingDate: Date }>,
): number => indexRows.filter((row) => stockDates.has(dateOnly(row.tradingDate) ?? "")).length;

const main = async () => {
  const stockRows = Object.fromEntries(
    await Promise.all(
      TARGET_TICKERS.map(async (ticker) => [
        ticker,
        await prisma.marketPrice.findMany({
          where: { ticker, sourceLabel: HISTORICAL_SOURCE_LABEL },
          orderBy: { tradingDate: "asc" },
          select: {
            tradingDate: true,
            closePrice: true,
            volume: true,
            tradingValue: true,
          },
        }),
      ]),
    ),
  ) as Record<TargetTicker, Array<{ tradingDate: Date; closePrice: unknown; volume: unknown; tradingValue: unknown }>>;

  const indexRows = Object.fromEntries(
    await Promise.all(
      INDEX_SYMBOLS.map(async (symbol) => [
        symbol,
        await prisma.marketIndexObservation.findMany({
          where: { symbol },
          orderBy: { tradingDate: "asc" },
          select: { tradingDate: true, closePoint: true, productionApproved: true },
        }),
      ]),
    ),
  ) as Record<IndexSymbol, Array<{ tradingDate: Date; closePoint: unknown; productionApproved: boolean }>>;

  const runtimeAudits = await Promise.all(TARGET_TICKERS.map(loadRuntimeAudit));
  const htmlByTicker = Object.fromEntries(runtimeAudits.map((audit) => [audit.ticker, audit.html])) as Record<
    TargetTicker,
    string
  >;
  const combinedHtml = Object.values(htmlByTicker).join("\n");
  const combinedRuntimeTextValues = runtimeAudits
    .flatMap((audit) => collectStringValues(JSON.parse(audit.serializedRuntime), new Set(["label"])))
    .join("\n");
  const combinedUiAndReadPath = `${combinedHtml}\n${combinedRuntimeTextValues}`;

  const noTickerRuntime = await loadTechnicalRuntimeData({ allowFallback: false });
  const fptMsnVcbRuntime = await Promise.all(
    DISPLAY_ONLY_TICKERS.map((ticker) =>
      loadTechnicalRuntimeData({
        ticker,
        from: "2020-01-01",
        to: EXPECTED_LATEST_DATE,
        sourceLabel: HISTORICAL_SOURCE_LABEL,
        preferDb: true,
        allowFallback: false,
      }),
    ),
  );

  const primaryForbiddenTokens = [
    "FOMO",
    "Kiểm tra FOMO sâu hơn",
    "Cảnh báo tâm lý thị trường",
    "Tỷ lệ rủi ro/lợi nhuận",
    "risk/reward",
    "Chart uses",
    "DB-backed",
    "sample",
    "demo",
    "mock",
    "fallback",
    "Dữ liệu minh họa",
    "2026-06-01",
  ];
  const fomoFindings = findTokens(combinedHtml, ["FOMO", "Kiểm tra FOMO sâu hơn", "Cảnh báo tâm lý thị trường"]);
  const riskRewardFindings = findTokens(combinedHtml, ["Tỷ lệ rủi ro/lợi nhuận", "risk/reward"]);
  const supportResistanceFindings = findRegex(combinedHtml, [/\bhỗ trợ\b/giu, /\bkháng cự\b/giu]);
  const technicalEnglishFindings = findTokens(combinedHtml, ["Chart uses", "DB-backed"]);
  const demoFindings = findTokens(combinedHtml, ["demo", "Dữ liệu minh họa", "Dữ liệu dự phòng"]);
  const mockFindings = findTokens(combinedHtml, ["mock"]);
  const fallbackAsRealFindings = runtimeAudits.filter((audit) => audit.fallbackUsed);
  const oldDemoDateFindings = [
    ...findTokens(combinedHtml, ["2026-06-01"]),
    ...runtimeAudits
      .filter((audit) => audit.latestChartLabel !== EXPECTED_LATEST_DATE)
      .map((audit) => ({
        token: "latestChartLabel",
        context: `${audit.ticker} latestChartLabel=${audit.latestChartLabel ?? "null"}`,
      })),
  ];

  const guardrailSource = removeAllowedBanLe(combinedUiAndReadPath);
  const benchmarkRankingScoringFindings = findTokens(guardrailSource, [
    "xếp hạng",
    "ranking",
    "scoring",
    "benchmark score",
  ]);
  const tradingSignalFindings = findTokens(guardrailSource, [
    "tín hiệu mua",
    "tín hiệu bán",
    "vào lệnh",
    "thoát hàng",
  ]);
  const buySellHoldFindings = findRegex(guardrailSource, [/\bmua\b/giu, /\bbán\b/giu, /\bnắm giữ\b/giu]);
  const targetPriceFindings = findTokens(guardrailSource, [
    "target price",
    "giá mục tiêu",
    "fair value",
    "giá trị hợp lý",
  ]);
  const upsideDownsideFindings = findTokens(guardrailSource, ["upside", "downside"]);
  const attractivenessFindings = findTokens(guardrailSource, ["hấp dẫn", "đáng mua"]);
  const relativeRecommendationFindings = findTokens(guardrailSource, [
    "mạnh hơn",
    "yếu hơn",
    "vượt trội",
    "kém hơn",
    "dẫn sóng",
  ]);

  const zeroFillDetected = runtimeAudits.some((audit) => {
    const data = JSON.parse(audit.serializedRuntime) as {
      data?: {
        volume?: { currentVsAvg20?: number | null };
        relativeMetrics?: Record<string, number | string | boolean | null | string[]>;
      };
    };
    const relativeValues = Object.entries(data.data?.relativeMetrics ?? {}).filter(([key, value]) =>
      key.startsWith("relativeTo") && value === 0,
    );
    return data.data?.volume?.currentVsAvg20 === 0 || relativeValues.length > 0;
  });

  const displayOnlyRows = await prisma.screeningCandidate.findMany({
    where: { ticker: { in: [...DISPLAY_ONLY_TICKERS] } },
    select: { ticker: true, analysisEligible: true },
  });
  const hsgNkgMarketPriceCount = await prisma.marketPrice.count({
    where: { ticker: { in: ["HSG", "NKG"] } },
  });
  const tvnMarketPriceCount = await prisma.marketPrice.count({ where: { ticker: "TVN" } });
  const tvnCandidateCount = await prisma.screeningCandidate.count({ where: { ticker: "TVN" } });
  const productionApprovedTrueCount =
    (await prisma.marketPriceUnitMetadata.count({
      where: {
        productionApproved: true,
        marketPrice: { ticker: { in: [...TARGET_TICKERS] } },
      },
    })) +
    (await prisma.marketIndexObservation.count({
      where: { productionApproved: true, symbol: { in: [...INDEX_SYMBOLS] } },
    })) +
    (await prisma.screeningCandidate.count({
      where: { productionApproved: true, ticker: { in: [...TARGET_TICKERS, ...DISPLAY_ONLY_TICKERS] } },
    })) +
    (await prisma.screeningCandidateMetric.count({
      where: { productionApproved: true, candidate: { ticker: { in: [...TARGET_TICKERS, ...DISPLAY_ONLY_TICKERS] } } },
    }));

  const ranges = {
    HPG: rangeFromRows(stockRows.HPG),
    VNM: rangeFromRows(stockRows.VNM),
    MWG: rangeFromRows(stockRows.MWG),
    VNINDEX: rangeFromRows(indexRows.VNINDEX),
    VN30: rangeFromRows(indexRows.VN30),
    VNMAT: rangeFromRows(indexRows.VNMAT),
    VNCONS: rangeFromRows(indexRows.VNCONS),
  };

  const alignedIntersection = Object.fromEntries(
    TARGET_TICKERS.flatMap((ticker) => {
      const stockDates = new Set(stockRows[ticker].map((row) => dateOnly(row.tradingDate) ?? ""));
      const sector = SECTOR_PROXY_BY_TICKER[ticker];
      return [
        [`${ticker}_VNINDEX`, alignedCount(stockDates, indexRows.VNINDEX)],
        [`${ticker}_VN30`, alignedCount(stockDates, indexRows.VN30)],
        [`${ticker}_${sector}`, alignedCount(stockDates, indexRows[sector])],
      ];
    }),
  ) as Record<string, number>;

  const historicalSourceUsed = runtimeAudits.every(
    (audit) =>
      audit.ok &&
      !audit.fallbackUsed &&
      audit.sourceType === "local_db_manual_import" &&
      audit.sourceLabel === HISTORICAL_SOURCE_LABEL,
  );
  const noSnapshotOnlyGuard = runtimeAudits.every((audit) => audit.pointsCount > 1 && audit.chartPointCount > 1);
  const latestExpected = Object.values(ranges).every((range) => range.latestDate === EXPECTED_LATEST_DATE);
  const relativeAligned = Object.values(alignedIntersection).every((count) => count > 60);
  const timeSeriesVisible = runtimeAudits.every(
    (audit) => audit.pointsCount > 1 && audit.chartPointCount > 1 && audit.pvtStatus === "computed_from_market_price_series",
  );
  const volumeVisible = runtimeAudits.every((audit) => audit.volumeCount > 1);
  const pvtObservationOnly = !tradingSignalFindings.length && !buySellHoldFindings.length;
  const relativeMarketSectorVisible = runtimeAudits.every(
    (audit) => audit.relativeComputable && audit.sectorProxySymbol === SECTOR_PROXY_BY_TICKER[audit.ticker],
  );
  const fptMsnVcbRemainDisplayOnly =
    displayOnlyRows.every((row) => row.analysisEligible === false) &&
    fptMsnVcbRuntime.every((runtime) => !runtime.ok && runtime.data === null && runtime.fallbackUsed === false);

  const hpgClosurePassed =
    ranges.HPG.count > 1 &&
    ranges.HPG.latestDate === EXPECTED_LATEST_DATE &&
    runtimeAudits.find((audit) => audit.ticker === "HPG")?.ok === true &&
    runtimeAudits.find((audit) => audit.ticker === "HPG")?.relativeComputable === true;
  const vnmClosurePassed =
    ranges.VNM.count > 1 &&
    ranges.VNM.latestDate === EXPECTED_LATEST_DATE &&
    runtimeAudits.find((audit) => audit.ticker === "VNM")?.ok === true &&
    runtimeAudits.find((audit) => audit.ticker === "VNM")?.relativeComputable === true;
  const mwgClosurePassed =
    ranges.MWG.count > 1 &&
    ranges.MWG.latestDate === EXPECTED_LATEST_DATE &&
    runtimeAudits.find((audit) => audit.ticker === "MWG")?.ok === true &&
    runtimeAudits.find((audit) => audit.ticker === "MWG")?.relativeComputable === true;

  const summary = {
    phase: "157A",
    mode: "closure_audit",
    hpgClosurePassed,
    vnmClosurePassed,
    mwgClosurePassed,
    hpgMarketPriceRows: ranges.HPG.count,
    vnmMarketPriceRows: ranges.VNM.count,
    mwgMarketPriceRows: ranges.MWG.count,
    vnindexRows: ranges.VNINDEX.count,
    vn30Rows: ranges.VN30.count,
    vnmatRows: ranges.VNMAT.count,
    vnconsRows: ranges.VNCONS.count,
    timeSeriesVisible,
    pvtObservationOnly,
    relativeMarketSectorVisible,
    fomoAbsent: fomoFindings.length === 0,
    riskRewardAbsent: riskRewardFindings.length === 0,
    supportResistanceWordingAbsent: supportResistanceFindings.length === 0,
    technicalEnglishPrimaryCopyAbsent: technicalEnglishFindings.length === 0,
    demoCopyDetected: demoFindings.length > 0,
    mockCopyDetected: mockFindings.length > 0,
    fallbackAsRealDetected: fallbackAsRealFindings.length > 0,
    oldDemoDateDetected: oldDemoDateFindings.length > 0,
    zeroFillDetected,
    benchmarkRankingScoringDetected:
      benchmarkRankingScoringFindings.length > 0 || relativeRecommendationFindings.length > 0,
    tradingSignalDetected: tradingSignalFindings.length > 0,
    buySellHoldDetected: buySellHoldFindings.length > 0,
    targetPriceOrFairValueDetected: targetPriceFindings.length > 0,
    upsideDownsideDetected: upsideDownsideFindings.length > 0,
    stockAttractivenessDetected: attractivenessFindings.length > 0,
    fptMsnVcbRemainDisplayOnly,
    hsgNkgTouched: hsgNkgMarketPriceCount > 0,
    tvnPresent: tvnMarketPriceCount + tvnCandidateCount > 0,
    productionApprovedTrueCount,
    dbWriteAttempted: false,
    schemaChanged: false,
    providerFetchAttempted: false,
    closureAuditPassed: false,
  };

  summary.closureAuditPassed =
    summary.hpgClosurePassed &&
    summary.vnmClosurePassed &&
    summary.mwgClosurePassed &&
    ranges.VNINDEX.latestDate === EXPECTED_LATEST_DATE &&
    ranges.VN30.latestDate === EXPECTED_LATEST_DATE &&
    ranges.VNMAT.latestDate === EXPECTED_LATEST_DATE &&
    ranges.VNCONS.latestDate === EXPECTED_LATEST_DATE &&
    historicalSourceUsed &&
    noSnapshotOnlyGuard &&
    latestExpected &&
    relativeAligned &&
    summary.timeSeriesVisible &&
    volumeVisible &&
    summary.pvtObservationOnly &&
    summary.relativeMarketSectorVisible &&
    summary.fomoAbsent &&
    summary.riskRewardAbsent &&
    summary.supportResistanceWordingAbsent &&
    summary.technicalEnglishPrimaryCopyAbsent &&
    !summary.demoCopyDetected &&
    !summary.mockCopyDetected &&
    !summary.fallbackAsRealDetected &&
    !summary.oldDemoDateDetected &&
    !summary.zeroFillDetected &&
    !summary.benchmarkRankingScoringDetected &&
    !summary.tradingSignalDetected &&
    !summary.buySellHoldDetected &&
    !summary.targetPriceOrFairValueDetected &&
    !summary.upsideDownsideDetected &&
    !summary.stockAttractivenessDetected &&
    summary.fptMsnVcbRemainDisplayOnly &&
    !summary.hsgNkgTouched &&
    !summary.tvnPresent &&
    summary.productionApprovedTrueCount === 0;

  const evidence = {
    ...summary,
    evidence: {
      expectedLatestDate: EXPECTED_LATEST_DATE,
      historicalSourceLabel: HISTORICAL_SOURCE_LABEL,
      ranges,
    runtimeAudits: runtimeAudits.map((audit) => ({
      ticker: audit.ticker,
      ok: audit.ok,
      fallbackUsed: audit.fallbackUsed,
      sourceLabel: audit.sourceLabel,
      sourceType: audit.sourceType,
      pointsCount: audit.pointsCount,
      volumeCount: audit.volumeCount,
      chartPointCount: audit.chartPointCount,
      pvtStatus: audit.pvtStatus,
      latestChartLabel: audit.latestChartLabel,
      relativeComputable: audit.relativeComputable,
      sectorProxySymbol: audit.sectorProxySymbol,
    })),
      alignedIntersection,
      noTickerRoute: {
        ok: noTickerRuntime.ok,
        dataPresent: noTickerRuntime.data !== null,
        fallbackUsed: noTickerRuntime.fallbackUsed,
      },
      displayOnlyRows,
      findings: {
        primaryForbiddenTokens,
        fomoFindings,
        riskRewardFindings,
        supportResistanceFindings,
        technicalEnglishFindings,
        demoFindings,
        mockFindings,
        oldDemoDateFindings,
        benchmarkRankingScoringFindings,
        relativeRecommendationFindings,
        tradingSignalFindings,
        buySellHoldFindings,
        targetPriceFindings,
        upsideDownsideFindings,
        attractivenessFindings,
      },
    },
  };

  console.log(JSON.stringify(evidence, null, 2));
  if (!summary.closureAuditPassed) {
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
