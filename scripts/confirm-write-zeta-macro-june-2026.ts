import "dotenv/config";
import { createHash } from "node:crypto";
import { Prisma } from "../src/generated/prisma/client.js";
import { prisma } from "../src/lib/database/client.js";

const ZETA_URL = "https://2026-06-zeta.vercel.app/";
const DATA_MODE = "zeta_macro_june_2026_candidate";
const REGION_VN = "VN";
const REGION_GLOBAL = "GLOBAL";

type MacroCandidateRow = {
  indicatorCode: string;
  indicatorName: string;
  description: string;
  category: string;
  defaultUnit: string;
  defaultFrequency: string;
  region: string;
  observationDate: Date;
  periodLabel: string;
  value: number;
  unit: string;
  frequency: string;
  sourceLabel: string;
  sourceUrl: string;
  providerType: string;
  publishedAt: Date | null;
  evidenceSnippet: string;
  semanticCaveats: string[];
};

const sourceUrls = {
  nso: "https://www.nso.gov.vn/bai-top/2026/07/bao-cao-tinh-hinh-kinh-te-xa-hoi-quy-ii-va-sau-thang-dau-nam-2026/",
  pmi: "https://www.pmi.spglobal.com/Public/Home/PressRelease/d05d320a82f840b4b910a30255537863",
  vbma: "https://vbma.org.vn/vi/reports/weekly",
};

const normalizeText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const decodeHtml = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');

const dataCardsFromHtml = (html: string): string[] =>
  [...html.matchAll(/<div class="data-card[\s\S]*?(?=<div class="data-card|<\/section>|<div class="section|$)/g)].map(
    (match) => match[0],
  );

const cardName = (card: string): string | null => {
  const name = card.match(/dc-name">([^<]+)/)?.[1];
  return name ? decodeHtml(name) : null;
};

const cardByName = (html: string, expectedName: string): string => {
  const card = dataCardsFromHtml(html).find((item) => cardName(item) === expectedName);
  if (!card) throw new Error(`Missing data card: ${expectedName}`);
  return card;
};

const parseNumber = (raw: string): number => {
  const cleaned = raw.replace(/[+~]/g, "").trim();
  if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, ""));
  }
  return Number(cleaned.replace(",", "."));
};

const cardValue = (html: string, expectedName: string): number => {
  const card = cardByName(html, expectedName);
  const match = card.match(/dc-value[^>]*>([^<]+)/);
  if (!match?.[1]) throw new Error(`Missing card value: ${expectedName}`);
  return parseNumber(match[1]);
};

const cardYoYGrowth = (html: string, expectedName: string): number => {
  const card = cardByName(html, expectedName);
  const label = decodeHtml(card.match(/dc-label">([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]+>/g, " ") ?? "");
  const match = label.match(/([+-]?[0-9]+(?:[,.][0-9]+)?)%\s*YoY/i);
  if (!match?.[1]) throw new Error(`Missing YoY growth in card label: ${expectedName}`);
  return parseNumber(match[1]);
};

const valueAfter = (text: string, label: string, pattern: RegExp): number => {
  const labelIndex = text.indexOf(label);
  if (labelIndex < 0) throw new Error(`Missing label: ${label}`);
  const windowText = text.slice(labelIndex, labelIndex + 500);
  const match = windowText.match(pattern);
  if (!match?.[1]) throw new Error(`Missing value after label: ${label}`);
  return Number(match[1].replace(",", "."));
};

const endOfMonthUtc = (year: number, month: number): Date =>
  new Date(Date.UTC(year, month, 0, 0, 0, 0));

const sourceLabel = (source: keyof typeof sourceUrls): string => `zeta_2026_06:${source}`;

const buildRows = (html: string, text: string): MacroCandidateRow[] => {
  if (!text.includes("Vietnam Macro Dashboard") && !text.includes("BÁO CÁO VĨ MÔ")) {
    throw new Error("Fetched page does not look like the expected Zeta macro dashboard.");
  }

  const q2Date = endOfMonthUtc(2026, 6);
  const juneDate = endOfMonthUtc(2026, 6);
  const vbmaDate = new Date("2026-06-26T00:00:00Z");
  const publishedNso = new Date("2026-07-03T00:00:00Z");
  const publishedPmi = new Date("2026-07-01T00:00:00Z");
  const publishedVbma = new Date("2026-06-27T00:00:00Z");

  const rows: MacroCandidateRow[] = [
    {
      indicatorCode: "GDP_GROWTH",
      indicatorName: "GDP growth Q2 2026",
      description: "Vietnam GDP growth in Q2 2026 from the NSO social-economic report.",
      category: "growth",
      defaultUnit: "percent_yoy",
      defaultFrequency: "quarterly",
      region: REGION_VN,
      observationDate: q2Date,
      periodLabel: "2026-Q2",
      value: cardValue(html, "GDP"),
      unit: "percent_yoy",
      frequency: "quarterly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "GDP").slice(0, 360),
      semanticCaveats: ["Quarterly GDP growth, not annual full-year GDP growth."],
    },
    {
      indicatorCode: "INDUSTRIAL_PRODUCTION_GROWTH",
      indicatorName: "Industrial production growth Q2 2026",
      description: "Vietnam industrial production growth in Q2 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "percent_yoy",
      defaultFrequency: "quarterly",
      region: REGION_VN,
      observationDate: q2Date,
      periodLabel: "2026-Q2",
      value: cardValue(html, "IIP"),
      unit: "percent_yoy",
      frequency: "quarterly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "IIP").slice(0, 360),
      semanticCaveats: ["Industrial production growth is a production-side indicator, not a listed-company revenue metric."],
    },
    {
      indicatorCode: "PMI_MANUFACTURING",
      indicatorName: "Vietnam Manufacturing PMI June 2026",
      description: "S&P Global Vietnam Manufacturing PMI for June 2026.",
      category: "growth",
      defaultUnit: "index",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: cardValue(html, "PMI Sản xuất (S&P)"),
      unit: "index",
      frequency: "monthly",
      sourceLabel: sourceLabel("pmi"),
      sourceUrl: sourceUrls.pmi,
      providerType: "sp_global_pmi_via_zeta",
      publishedAt: publishedPmi,
      evidenceSnippet: cardByName(html, "PMI Sản xuất (S&P)").slice(0, 360),
      semanticCaveats: ["PMI is an index; values above 50 generally indicate expansion, not growth percentage."],
    },
    {
      indicatorCode: "EXPORT_GROWTH",
      indicatorName: "Export growth June 2026",
      description: "Vietnam export growth in June 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "percent_yoy",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: cardYoYGrowth(html, "Xuất khẩu"),
      unit: "percent_yoy",
      frequency: "monthly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "Xuất khẩu").slice(0, 360),
      semanticCaveats: ["Monthly export growth; do not infer a company-specific export impact without industry and company data."],
    },
    {
      indicatorCode: "IMPORT_GROWTH",
      indicatorName: "Import growth June 2026",
      description: "Vietnam import growth in June 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "percent_yoy",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: cardYoYGrowth(html, "Nhập khẩu"),
      unit: "percent_yoy",
      frequency: "monthly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "Nhập khẩu").slice(0, 360),
      semanticCaveats: ["Monthly import growth; can reflect production demand and input cost pressure, not a standalone signal."],
    },
    {
      indicatorCode: "TRADE_BALANCE",
      indicatorName: "Trade balance June 2026",
      description: "Vietnam trade balance in June 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "billion_usd",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: cardValue(html, "Cán cân thương mại"),
      unit: "billion_usd",
      frequency: "monthly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "Cán cân thương mại").slice(0, 360),
      semanticCaveats: ["Trade balance is an aggregate macro figure, not a sector-level profitability measure."],
    },
    {
      indicatorCode: "CPI_YOY",
      indicatorName: "CPI YoY June 2026",
      description: "Vietnam consumer price inflation YoY in June 2026 from NSO-derived dashboard data.",
      category: "inflation",
      defaultUnit: "percent_yoy",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: cardValue(html, "CPI YoY"),
      unit: "percent_yoy",
      frequency: "monthly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "CPI YoY").slice(0, 360),
      semanticCaveats: ["Monthly CPI YoY, more timely than annual World Bank CPI but still needs source review."],
    },
    {
      indicatorCode: "CPI_MOM",
      indicatorName: "CPI MoM June 2026",
      description: "Vietnam consumer price inflation MoM in June 2026 from NSO-derived dashboard data.",
      category: "inflation",
      defaultUnit: "percent_mom",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: valueAfter(cardByName(html, "CPI YoY"), "MoM", /([+-]?[0-9]+(?:[.,][0-9]+)?)%/),
      unit: "percent_mom",
      frequency: "monthly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "CPI YoY").slice(0, 360),
      semanticCaveats: ["Month-on-month CPI is volatile; read with YoY CPI and core inflation."],
    },
    {
      indicatorCode: "CORE_INFLATION",
      indicatorName: "Core inflation June 2026",
      description: "Vietnam core inflation in June 2026 from NSO-derived dashboard data.",
      category: "inflation",
      defaultUnit: "percent_yoy",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: juneDate,
      periodLabel: "2026-06",
      value: valueAfter(cardByName(html, "CPI YoY"), "Cơ bản", /([0-9]+(?:[.,][0-9]+)?)%/),
      unit: "percent_yoy",
      frequency: "monthly",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "CPI YoY").slice(0, 360),
      semanticCaveats: ["Core inflation excludes volatile items; use as supporting context, not a standalone conclusion."],
    },
    {
      indicatorCode: "CREDIT_GROWTH",
      indicatorName: "Credit growth to 26 June 2026",
      description: "Vietnam credit growth as of 26 June 2026 from NSO-derived dashboard data.",
      category: "rates",
      defaultUnit: "percent_ytd",
      defaultFrequency: "monthly",
      region: REGION_VN,
      observationDate: vbmaDate,
      periodLabel: "2026-06-26",
      value: cardValue(html, "Tăng trưởng tín dụng"),
      unit: "percent_ytd",
      frequency: "monthly_ytd",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "Tăng trưởng tín dụng").slice(0, 360),
      semanticCaveats: ["Credit growth is YTD/system-level; do not substitute for loan quality or bank-specific growth."],
    },
    {
      indicatorCode: "USD_VND",
      indicatorName: "USD/VND central rate 26 June 2026",
      description: "USD/VND central exchange rate from VBMA weekly report context.",
      category: "fx",
      defaultUnit: "vnd_per_usd",
      defaultFrequency: "daily",
      region: REGION_VN,
      observationDate: vbmaDate,
      periodLabel: "2026-06-26",
      value: cardValue(html, "Tỷ giá trung tâm USD/VND"),
      unit: "vnd_per_usd",
      frequency: "daily",
      sourceLabel: sourceLabel("vbma"),
      sourceUrl: sourceUrls.vbma,
      providerType: "vbma_weekly_via_zeta",
      publishedAt: publishedVbma,
      evidenceSnippet: cardByName(html, "Tỷ giá trung tâm USD/VND").slice(0, 360),
      semanticCaveats: ["Exchange-rate context from VBMA weekly report; verify exact rate type before production use."],
    },
    {
      indicatorCode: "DXY",
      indicatorName: "US Dollar Index context 26 June 2026",
      description: "Dollar strength proxy shown in the VBMA weekly report context.",
      category: "fx",
      defaultUnit: "index",
      defaultFrequency: "daily",
      region: REGION_GLOBAL,
      observationDate: vbmaDate,
      periodLabel: "2026-06-26",
      value: cardValue(html, "Chỉ số USD (DXY)"),
      unit: "index",
      frequency: "daily",
      sourceLabel: sourceLabel("vbma"),
      sourceUrl: sourceUrls.vbma,
      providerType: "vbma_weekly_via_zeta",
      publishedAt: publishedVbma,
      evidenceSnippet: cardByName(html, "Chỉ số USD (DXY)").slice(0, 360),
      semanticCaveats: ["Dashboard labels this as DXY; verify whether it is ICE DXY or a broad dollar proxy before production use."],
    },
    {
      indicatorCode: "BRENT_OIL_PRICE",
      indicatorName: "Brent oil price context 26 June 2026",
      description: "Brent oil price context from the VBMA weekly report.",
      category: "inflation",
      defaultUnit: "usd_per_barrel",
      defaultFrequency: "daily",
      region: REGION_GLOBAL,
      observationDate: vbmaDate,
      periodLabel: "2026-06-26",
      value: cardValue(html, "Giá dầu Brent"),
      unit: "usd_per_barrel",
      frequency: "daily",
      sourceLabel: sourceLabel("vbma"),
      sourceUrl: sourceUrls.vbma,
      providerType: "vbma_weekly_via_zeta",
      publishedAt: publishedVbma,
      evidenceSnippet: cardByName(html, "Giá dầu Brent").slice(0, 360),
      semanticCaveats: ["Energy price context; not a Vietnam company-specific input cost measure."],
    },
  ];

  const fdiRegistered = cardValue(html, "FDI đăng ký");
  const fdiDisbursed = cardValue(html, "FDI thực hiện");
  const retail = cardYoYGrowth(html, "Bán lẻ & DV tiêu dùng");

  rows.push(
    {
      indicatorCode: "FDI_REGISTERED",
      indicatorName: "Registered FDI first 6 months 2026",
      description: "Registered FDI in the first six months of 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "billion_usd",
      defaultFrequency: "ytd",
      region: REGION_VN,
      observationDate: q2Date,
      periodLabel: "2026-6M",
      value: fdiRegistered,
      unit: "billion_usd",
      frequency: "six_month_ytd",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "FDI đăng ký").slice(0, 360),
      semanticCaveats: ["Six-month cumulative registered FDI; not realized disbursement."],
    },
    {
      indicatorCode: "FDI_DISBURSED",
      indicatorName: "Disbursed FDI first 6 months 2026",
      description: "Disbursed FDI in the first six months of 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "billion_usd",
      defaultFrequency: "ytd",
      region: REGION_VN,
      observationDate: q2Date,
      periodLabel: "2026-6M",
      value: fdiDisbursed,
      unit: "billion_usd",
      frequency: "six_month_ytd",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "FDI thực hiện").slice(0, 360),
      semanticCaveats: ["Six-month cumulative realized FDI; not a direct listed-company metric."],
    },
    {
      indicatorCode: "RETAIL_SALES_GROWTH",
      indicatorName: "Retail sales growth first 6 months 2026",
      description: "Retail sales growth in the first six months of 2026 from NSO-derived dashboard data.",
      category: "growth",
      defaultUnit: "percent_yoy",
      defaultFrequency: "ytd",
      region: REGION_VN,
      observationDate: q2Date,
      periodLabel: "2026-6M",
      value: retail,
      unit: "percent_yoy",
      frequency: "six_month_ytd",
      sourceLabel: sourceLabel("nso"),
      sourceUrl: sourceUrls.nso,
      providerType: "nso_report_via_zeta",
      publishedAt: publishedNso,
      evidenceSnippet: cardByName(html, "Bán lẻ & DV tiêu dùng").slice(0, 360),
      semanticCaveats: ["Retail sales is aggregate demand context, not a direct forecast for a retailer."],
    },
  );

  return rows;
};

const buildEvidenceNotes = (row: MacroCandidateRow): string =>
  JSON.stringify({
    semanticCaveats: row.semanticCaveats,
    scrapedFrom: ZETA_URL,
    originalSourceUrl: row.sourceUrl,
    extractionMethod: "HTML text regex extraction from Zeta macro dashboard",
  });

const warningCodesFor = (row: MacroCandidateRow): string =>
  JSON.stringify([
    "CANDIDATE_ONLY",
    "NEEDS_REVIEW",
    "PRODUCTION_APPROVED_FALSE",
    "SCRAPED_FROM_DERIVED_DASHBOARD",
    row.providerType,
  ]);

const payloadChecksum = (payload: string): string =>
  createHash("sha256").update(payload).digest("hex");

const fetchRows = async (): Promise<{ html: string; text: string; rows: MacroCandidateRow[] }> => {
  const response = await fetch(ZETA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${ZETA_URL}: HTTP ${response.status}`);
  }
  const html = await response.text();
  const text = normalizeText(html);
  const rows = buildRows(html, text);
  return { html, text, rows };
};

const upsertRow = async (row: MacroCandidateRow, checksum: string, confirmWrite: boolean) => {
  if (!confirmWrite) return { createdObservation: false, createdProvenance: false };

  const existingObservation = await prisma.macroObservation.findUnique({
    where: {
      indicatorCode_region_observationDate_sourceLabel: {
        indicatorCode: row.indicatorCode,
        region: row.region,
        observationDate: row.observationDate,
        sourceLabel: row.sourceLabel,
      },
    },
  });
  const existingProvenance = await prisma.macroObservationProvenance.findUnique({
    where: {
      indicatorCode_region_observationDate_sourceLabel: {
        indicatorCode: row.indicatorCode,
        region: row.region,
        observationDate: row.observationDate,
        sourceLabel: row.sourceLabel,
      },
    },
  });

  const indicator = await prisma.macroIndicator.upsert({
    where: { indicatorCode: row.indicatorCode },
    update: {
      indicatorName: row.indicatorName,
      description: row.description,
      category: row.category,
      defaultUnit: row.defaultUnit,
      defaultFrequency: row.defaultFrequency,
      regionScope: row.region,
      sourceLabel: row.sourceLabel,
      isActive: true,
    },
    create: {
      indicatorCode: row.indicatorCode,
      indicatorName: row.indicatorName,
      description: row.description,
      category: row.category,
      defaultUnit: row.defaultUnit,
      defaultFrequency: row.defaultFrequency,
      regionScope: row.region,
      sourceLabel: row.sourceLabel,
      isActive: true,
    },
  });

  await prisma.macroObservation.upsert({
    where: {
      indicatorCode_region_observationDate_sourceLabel: {
        indicatorCode: row.indicatorCode,
        region: row.region,
        observationDate: row.observationDate,
        sourceLabel: row.sourceLabel,
      },
    },
    update: {
      value: new Prisma.Decimal(row.value),
      unit: row.unit,
      frequency: row.frequency,
      periodLabel: row.periodLabel,
      dataMode: DATA_MODE,
      productionApproved: false,
      needsReview: true,
    },
    create: {
      indicatorId: indicator.id,
      indicatorCode: row.indicatorCode,
      region: row.region,
      observationDate: row.observationDate,
      value: new Prisma.Decimal(row.value),
      unit: row.unit,
      frequency: row.frequency,
      periodLabel: row.periodLabel,
      sourceLabel: row.sourceLabel,
      dataMode: DATA_MODE,
      productionApproved: false,
      needsReview: true,
    },
  });

  await prisma.macroObservationProvenance.upsert({
    where: {
      indicatorCode_region_observationDate_sourceLabel: {
        indicatorCode: row.indicatorCode,
        region: row.region,
        observationDate: row.observationDate,
        sourceLabel: row.sourceLabel,
      },
    },
    update: {
      providerType: row.providerType,
      dataMode: DATA_MODE,
      productionApproved: false,
      needsReview: true,
      sourceUrl: row.sourceUrl,
      retrievedAt: new Date(),
      publishedAt: row.publishedAt,
      payloadChecksum: checksum,
      rawPayloadSnippet: row.evidenceSnippet,
      warningCodes: warningCodesFor(row),
      evidenceNotes: buildEvidenceNotes(row),
    },
    create: {
      indicatorCode: row.indicatorCode,
      region: row.region,
      observationDate: row.observationDate,
      sourceLabel: row.sourceLabel,
      providerType: row.providerType,
      dataMode: DATA_MODE,
      productionApproved: false,
      needsReview: true,
      sourceUrl: row.sourceUrl,
      retrievedAt: new Date(),
      publishedAt: row.publishedAt,
      payloadChecksum: checksum,
      rawPayloadSnippet: row.evidenceSnippet,
      warningCodes: warningCodesFor(row),
      evidenceNotes: buildEvidenceNotes(row),
    },
  });

  return {
    createdObservation: !existingObservation,
    createdProvenance: !existingProvenance,
  };
};

async function run() {
  const confirmWrite = process.argv.includes("--confirm-write");
  const { html, rows } = await fetchRows();
  const checksum = payloadChecksum(html);
  const countsByIndicator = rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.indicatorCode] = (counts[row.indicatorCode] ?? 0) + 1;
    return counts;
  }, {});

  const expectedRequired = [
    "GDP_GROWTH",
    "PMI_MANUFACTURING",
    "EXPORT_GROWTH",
    "CPI_YOY",
    "CREDIT_GROWTH",
    "USD_VND",
    "DXY",
    "BRENT_OIL_PRICE",
  ];
  const missingRequired = expectedRequired.filter((code) => !countsByIndicator[code]);
  if (missingRequired.length > 0) {
    throw new Error(`Missing required scraped indicators: ${missingRequired.join(", ")}`);
  }

  let rowsCreated = 0;
  let rowsUpdated = 0;
  let provenanceCreated = 0;
  let provenanceUpdated = 0;
  for (const row of rows) {
    const result = await upsertRow(row, checksum, confirmWrite);
    if (!confirmWrite) continue;
    if (result.createdObservation) rowsCreated += 1;
    else rowsUpdated += 1;
    if (result.createdProvenance) provenanceCreated += 1;
    else provenanceUpdated += 1;
  }

  const readBack = confirmWrite
    ? await prisma.macroObservation.findMany({
        where: {
          dataMode: DATA_MODE,
          indicatorCode: { in: rows.map((row) => row.indicatorCode) },
        },
      })
    : [];
  const productionApprovedTrueCount = readBack.filter((row) => row.productionApproved).length;
  const needsReviewFalseCount = readBack.filter((row) => !row.needsReview).length;

  const summary = {
    source: ZETA_URL,
    confirmWrite,
    rowsExtracted: rows.length,
    countsByIndicator,
    rowsCreated,
    rowsUpdated,
    provenanceCreated,
    provenanceUpdated,
    readBackRows: readBack.length,
    productionApprovedTrueCount,
    needsReviewFalseCount,
    dataMode: DATA_MODE,
    guardrails: {
      writesRequireConfirmFlag: !confirmWrite || rowsCreated + rowsUpdated === rows.length,
      requiredIndicatorsPresent: missingRequired.length === 0,
      productionApprovedFalseOnly: productionApprovedTrueCount === 0,
      needsReviewTrueOnly: needsReviewFalseCount === 0,
      fedFundsNotWrittenFromForecast: !countsByIndicator.FED_FUNDS_RATE,
      policyRateNotWrittenFromInterbankOrBondData: !countsByIndicator.POLICY_RATE,
      marketForeignNetFlowNotWrittenFromBondMarketData: !countsByIndicator.FOREIGN_NET_FLOW,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();

  if (confirmWrite) {
    const passed =
      summary.rowsExtracted >= 15 &&
      summary.readBackRows >= summary.rowsExtracted &&
      summary.guardrails.requiredIndicatorsPresent &&
      summary.guardrails.productionApprovedFalseOnly &&
      summary.guardrails.needsReviewTrueOnly &&
      summary.guardrails.fedFundsNotWrittenFromForecast &&
      summary.guardrails.policyRateNotWrittenFromInterbankOrBondData &&
      summary.guardrails.marketForeignNetFlowNotWrittenFromBondMarketData;
    if (!passed) process.exit(1);
  }
}

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
