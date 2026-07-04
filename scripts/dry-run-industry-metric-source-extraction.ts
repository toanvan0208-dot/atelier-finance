import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const PHASE = "159F";

type SourcePdf = {
  industryCode: string;
  tickerExample: string;
  sourceKey: string;
  sourceLabel: string;
  filePath: string;
  metricCandidates: MetricCandidate[];
};

type MetricCandidate = {
  metricCode: string;
  metricLabelVi: string;
  keywords: string[];
  expectedUnit: string;
  expectedPeriodType: string;
};

type ExtractedPage = {
  pageNumber: number;
  text: string;
};

type ExtractedPdf = {
  filePath: string;
  pageCount: number;
  metadata: Record<string, string | null>;
  pages: ExtractedPage[];
};

const PYTHON_CANDIDATES = [
  "C:\\Users\\ADMIN\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
  "python",
] as const;

const PDF_EXTRACT_SCRIPT = String.raw`
import json
import sys
import pdfplumber

output = []
for path in sys.argv[1:]:
    with pdfplumber.open(path) as pdf:
        output.append({
            "filePath": path,
            "pageCount": len(pdf.pages),
            "metadata": {str(k): (None if v is None else str(v)) for k, v in (pdf.metadata or {}).items()},
            "pages": [
                {"pageNumber": index + 1, "text": page.extract_text() or ""}
                for index, page in enumerate(pdf.pages)
            ],
        })

print(json.dumps(output, ensure_ascii=False))
`;

const SOURCE_PDFS: SourcePdf[] = [
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    sourceKey: "local_pdf_steel_q1_2026",
    sourceLabel: "Local PDF - Steel market Q1 2026",
    filePath: "D:\\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf",
    metricCandidates: [
      {
        metricCode: "STEEL_FINISHED_SALES_VOLUME",
        metricLabelVi: "San luong thep thanh pham ban ra",
        keywords: ["san luong", "tieu thu", "ban hang", "thep thanh pham"],
        expectedUnit: "tonnes",
        expectedPeriodType: "quarter_or_month",
      },
      {
        metricCode: "STEEL_PRICE_REFERENCE",
        metricLabelVi: "Gia thep tham chieu",
        keywords: ["gia thep", "HRC", "gia ban", "bien dong gia"],
        expectedUnit: "currency_or_index",
        expectedPeriodType: "month_or_quarter",
      },
      {
        metricCode: "STEEL_INPUT_COST_REFERENCE",
        metricLabelVi: "Chi phi dau vao thep tham chieu",
        keywords: ["quang sat", "than", "nguyen lieu", "chi phi dau vao"],
        expectedUnit: "currency_or_index",
        expectedPeriodType: "month_or_quarter",
      },
    ],
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    sourceKey: "local_pdf_retail_2026",
    sourceLabel: "Local PDF - Retail sector",
    filePath: "D:\\nganh_ban_le.pdf",
    metricCandidates: [
      {
        metricCode: "RETAIL_SALES_INDEX",
        metricLabelVi: "Chi so ban le hang hoa dich vu",
        keywords: ["ban le", "doanh thu ban le", "tong muc ban le", "tieu dung"],
        expectedUnit: "index_or_percent",
        expectedPeriodType: "month_or_year",
      },
      {
        metricCode: "RETAIL_GROSS_MARGIN",
        metricLabelVi: "Bien gop ban le",
        keywords: ["bien gop", "gross margin", "loi nhuan gop"],
        expectedUnit: "percent",
        expectedPeriodType: "quarter_or_year",
      },
      {
        metricCode: "RETAIL_INVENTORY_DAYS",
        metricLabelVi: "So ngay ton kho ban le",
        keywords: ["ton kho", "inventory", "vong quay"],
        expectedUnit: "days_or_turns",
        expectedPeriodType: "quarter_or_year",
      },
    ],
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    tickerExample: "VNM",
    sourceKey: "local_pdf_consumer_staples_2026",
    sourceLabel: "Local PDF - Consumer staples outlook 2026",
    filePath: "D:\\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf",
    metricCandidates: [
      {
        metricCode: "DAIRY_REVENUE_GROWTH",
        metricLabelVi: "Tang truong doanh thu nhom sua",
        keywords: ["sua", "doanh thu", "tang truong", "hang tieu dung"],
        expectedUnit: "percent",
        expectedPeriodType: "quarter_or_year",
      },
      {
        metricCode: "DAIRY_GROSS_MARGIN",
        metricLabelVi: "Bien gop nhom sua",
        keywords: ["sua", "bien gop", "gross margin", "loi nhuan gop"],
        expectedUnit: "percent",
        expectedPeriodType: "quarter_or_year",
      },
      {
        metricCode: "DAIRY_INPUT_COST_REFERENCE",
        metricLabelVi: "Chi phi dau vao sua tham chieu",
        keywords: ["sua bot", "nguyen lieu", "chi phi", "gia dau vao"],
        expectedUnit: "index_or_currency",
        expectedPeriodType: "month_or_quarter",
      },
    ],
  },
];

const EXCLUDED_SOURCE_CONTEXT_PATTERNS = [
  "kha quan",
  "trung lap",
  "kem tich cuc",
  "gia muc tieu",
  "target price",
  "fair value",
  "upside",
  "downside",
] as const;

const normalizeForSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const compactText = (value: string): string => value.replace(/\s+/g, " ").trim();

const numericHints = (value: string): string[] => {
  const matches = value.match(/(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d+)?\s*(?:%|ty|trieu|nghin|tan|VND|USD|x)?/gi);
  return [...new Set(matches ?? [])].slice(0, 8);
};

const findPython = (): string => {
  const candidate = PYTHON_CANDIDATES.find((path) => {
    if (path === "python") return true;
    return existsSync(path);
  });

  if (!candidate) {
    throw new Error("No Python executable available for PDF extraction.");
  }

  return candidate;
};

const extractPdfs = (filePaths: string[]): ExtractedPdf[] => {
  const output = execFileSync(findPython(), ["-c", PDF_EXTRACT_SCRIPT, ...filePaths], {
    encoding: "utf-8",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    maxBuffer: 64 * 1024 * 1024,
  });

  return JSON.parse(output) as ExtractedPdf[];
};

const sourceFilesMissing = SOURCE_PDFS.filter((source) => !existsSync(source.filePath)).map(
  (source) => source.filePath,
);
const extractedPdfs = sourceFilesMissing.length === 0 ? extractPdfs(SOURCE_PDFS.map((source) => source.filePath)) : [];

const extractedByPath = new Map(extractedPdfs.map((pdf) => [pdf.filePath.toLowerCase(), pdf]));

const candidateFindings = SOURCE_PDFS.flatMap((source) => {
  const pdf = extractedByPath.get(source.filePath.toLowerCase());
  if (!pdf) return [];

  return source.metricCandidates.map((metric) => {
    let excludedPageHits = 0;
    const keywordHits = pdf.pages
      .map((page) => {
        const normalizedText = normalizeForSearch(page.text);
        const pageHasExcludedContext = EXCLUDED_SOURCE_CONTEXT_PATTERNS.some((pattern) =>
          normalizedText.includes(pattern),
        );
        if (pageHasExcludedContext) {
          excludedPageHits += 1;
          return null;
        }

        const matchedKeywords = metric.keywords.filter((keyword) => normalizedText.includes(normalizeForSearch(keyword)));
        if (matchedKeywords.length === 0) return null;

        const compact = compactText(page.text);
        const firstKeyword = matchedKeywords[0] ?? "";
        const keywordIndex = normalizeForSearch(compact).indexOf(normalizeForSearch(firstKeyword));
        const start = Math.max(0, keywordIndex - 120);
        const snippet = compact.slice(start, start + 360);

        return {
          pageNumber: page.pageNumber,
          matchedKeywords,
          snippet,
          numericHints: numericHints(snippet),
        };
      })
      .filter((hit): hit is NonNullable<typeof hit> => hit !== null)
      .slice(0, 4);

    return {
      industryCode: source.industryCode,
      tickerExample: source.tickerExample,
      metricCode: metric.metricCode,
      metricLabelVi: metric.metricLabelVi,
      expectedUnit: metric.expectedUnit,
      expectedPeriodType: metric.expectedPeriodType,
      sourceKey: source.sourceKey,
      sourceLabel: source.sourceLabel,
      sourceFilePresent: true,
      pageCount: pdf.pageCount,
      keywordHitCount: keywordHits.length,
      excludedPageHits,
      keywordHits,
      extractedValue: null,
      extractionStatus: keywordHits.length > 0 ? "candidate_found_needs_review" : "not_found_needs_review",
      missingReason:
        keywordHits.length > 0
          ? "Candidate numeric hints found, but value, unit, period, and source permission still need manual review."
          : "No reliable text match found in dry run; keep value null.",
      productionApproved: false,
      needsReview: true,
    };
  });
});

const result = {
  phase: PHASE,
  mode: "industry_metric_source_extraction_dry_run",
  dbWriteAttempted: false,
  schemaChanged: false,
  migrationCreated: false,
  providerFetchAttempted: false,
  rawSourceImportAttempted: false,
  industryMetricWriteAttempted: false,
  industryMetricProvenanceWriteAttempted: false,
  sourceFilesChecked: SOURCE_PDFS.length,
  sourceFilesMissing,
  extractedPdfSummaries: extractedPdfs.map((pdf) => ({
    filePath: pdf.filePath,
    pageCount: pdf.pageCount,
    title: pdf.metadata.Title ?? null,
    creationDate: pdf.metadata.CreationDate ?? null,
  })),
  candidateRowsPlanned: candidateFindings.length,
  candidateRowsWithExtractedValue: candidateFindings.filter((candidate) => candidate.extractedValue !== null).length,
  candidateRowsProductionApproved: candidateFindings.filter((candidate) => candidate.productionApproved).length,
  candidateRowsNeedingReview: candidateFindings.filter((candidate) => candidate.needsReview).length,
  excludedInvestmentContextPageHits: candidateFindings.reduce((sum, candidate) => sum + candidate.excludedPageHits, 0),
  candidateFindings,
  benchmarkRankingScoringIntroduced: false,
  tradingOrValuationOutputIntroduced: false,
  stockAttractivenessIntroduced: false,
  readyForRealMetricImport: false,
  recommendedNextPhase: "Phase 159G - Reviewed IndustryMetric Source Mapping",
};

const auditPassed =
  result.sourceFilesMissing.length === 0 &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.migrationCreated &&
  !result.providerFetchAttempted &&
  !result.rawSourceImportAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.industryMetricProvenanceWriteAttempted &&
  result.candidateRowsWithExtractedValue === 0 &&
  result.candidateRowsProductionApproved === 0 &&
  result.candidateRowsNeedingReview === result.candidateRowsPlanned &&
  !result.readyForRealMetricImport;

console.log(JSON.stringify({ ...result, auditPassed }, null, 2));

if (!auditPassed) {
  process.exitCode = 1;
}
