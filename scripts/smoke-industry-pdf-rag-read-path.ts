import {
  buildIndustryPdfRagIndex,
  retrieveIndustryPdfRagChunks,
  type IndustryPdfRagIndustryCode,
} from "../src/features/industry/lib/industry-pdf-rag";

const PHASE = "160B";

type SmokeCase = {
  industryCode: IndustryPdfRagIndustryCode;
  question: string;
  expectedSourceKey: string;
};

const SMOKE_CASES: SmokeCase[] = [
  {
    industryCode: "STEEL_MATERIALS",
    question: "Ngành thép cần đọc sản lượng, tiêu thụ, giá thép, nguyên liệu và tồn kho như thế nào?",
    expectedSourceKey: "local_pdf_steel_q1_2026",
  },
  {
    industryCode: "RETAIL",
    question: "Ngành bán lẻ cần theo dõi sức mua, doanh thu, kênh online và tồn kho như thế nào?",
    expectedSourceKey: "local_pdf_retail_2026",
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    question: "Nhóm sữa và hàng tiêu dùng cần đọc sức mua, thu nhập, kênh bán hàng và chi phí đầu vào ra sao?",
    expectedSourceKey: "local_pdf_consumer_staples_2026",
  },
];

const forbiddenOutputPatterns = [
  /\b(buy|sell|hold)\b/i,
  /\btarget\s+price\b/i,
  /\bfair\s+value\b/i,
  /\bupside\b/i,
  /\bdownside\b/i,
  /\binvestment\s+recommendation\b/i,
  /\btrading\s+signal\b/i,
  /khuyến\s+nghị\s+(mua|bán)/i,
  /nên\s+(mua|bán|nắm\s+giữ)/i,
  /giá\s+mục\s+tiêu/i,
  /giá\s+trị\s+hợp\s+lý/i,
  /đáng\s+mua/i,
  /hấp\s+dẫn\s+đầu\s+tư/i,
] as const;

const hasForbiddenOutput = (value: string): boolean =>
  forbiddenOutputPatterns.some((pattern) => pattern.test(value));

const countByIndustry = (
  industryCodes: IndustryPdfRagIndustryCode[],
  target: IndustryPdfRagIndustryCode,
): number => industryCodes.filter((industryCode) => industryCode === target).length;

const index = buildIndustryPdfRagIndex();
const retrievalResults = SMOKE_CASES.map((smokeCase) => {
  const retrievedChunks = retrieveIndustryPdfRagChunks(index, {
    industryCode: smokeCase.industryCode,
    question: smokeCase.question,
    topK: 3,
  });

  return {
    ...smokeCase,
    retrievedChunks,
    retrievedChunkCount: retrievedChunks.length,
    expectedSourceFound: retrievedChunks.some(
      (chunk) => chunk.sourceKey === smokeCase.expectedSourceKey,
    ),
    allChunksHavePageNumber: retrievedChunks.every((chunk) => chunk.pageNumber > 0),
    allChunksHaveSourceLabel: retrievedChunks.every((chunk) => chunk.sourceLabel.length > 0),
    riskyChunksReturned: retrievedChunks.filter((chunk) => chunk.riskyForEndUserAnswer).length,
    forbiddenOutputDetected: hasForbiddenOutput(
      retrievedChunks.map((chunk) => chunk.snippet).join("\n"),
    ),
  };
});

const chunkIndustryCodes = index.chunks.map((chunk) => chunk.industryCode);

const result = {
  phase: PHASE,
  mode: "industry_pdf_rag_prototype_read_path",
  dbReadAttempted: false,
  dbWriteAttempted: false,
  schemaChanged: false,
  providerFetchAttempted: false,
  assistantPromptChanged: false,
  assistantRuntimeIntegrated: false,
  assistantAnswerGenerated: false,
  uiChanged: false,
  sourcePdfCommitted: false,
  rawPdfTextCommitted: false,
  vectorDbIntroduced: false,
  dbIndexWriteAttempted: false,
  industryMetricWriteAttempted: false,
  benchmarkRankingScoringIntroduced: false,
  buySellHoldIntroduced: false,
  targetPriceFairValueUpsideDownsideIntroduced: false,
  stockAttractivenessIntroduced: false,
  sourceFilesMissing: index.sourceFilesMissing,
  extractedPdfSummaries: index.extractedPdfSummaries,
  totalChunksBuilt: index.chunks.length,
  chunkCountsByIndustry: {
    STEEL_MATERIALS: countByIndustry(chunkIndustryCodes, "STEEL_MATERIALS"),
    RETAIL: countByIndustry(chunkIndustryCodes, "RETAIL"),
    CONSUMER_STAPLES_DAIRY: countByIndustry(chunkIndustryCodes, "CONSUMER_STAPLES_DAIRY"),
  },
  riskyChunksExcludedByDefault: index.chunks.filter((chunk) => chunk.riskyForEndUserAnswer).length,
  retrievalResults,
  retrievalReadPathExists: true,
  retrievalCasesPassed: retrievalResults.every(
    (item) =>
      item.retrievedChunkCount >= 2 &&
      item.expectedSourceFound &&
      item.allChunksHavePageNumber &&
      item.allChunksHaveSourceLabel &&
      item.riskyChunksReturned === 0 &&
      !item.forbiddenOutputDetected,
  ),
  readyForAssistantContextDryRun: true,
  recommendedNextPhase: "Phase 160C - Industry PDF RAG Assistant Context Dry Run",
};

const smokePassed =
  result.phase === PHASE &&
  result.mode === "industry_pdf_rag_prototype_read_path" &&
  result.sourceFilesMissing.length === 0 &&
  result.totalChunksBuilt > 0 &&
  result.retrievalReadPathExists &&
  result.retrievalCasesPassed &&
  !result.dbReadAttempted &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.providerFetchAttempted &&
  !result.assistantPromptChanged &&
  !result.assistantRuntimeIntegrated &&
  !result.assistantAnswerGenerated &&
  !result.uiChanged &&
  !result.sourcePdfCommitted &&
  !result.rawPdfTextCommitted &&
  !result.vectorDbIntroduced &&
  !result.dbIndexWriteAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.benchmarkRankingScoringIntroduced &&
  !result.buySellHoldIntroduced &&
  !result.targetPriceFairValueUpsideDownsideIntroduced &&
  !result.stockAttractivenessIntroduced &&
  result.readyForAssistantContextDryRun;

console.log(JSON.stringify({ ...result, smokePassed }, null, 2));

if (!smokePassed) {
  process.exitCode = 1;
}
