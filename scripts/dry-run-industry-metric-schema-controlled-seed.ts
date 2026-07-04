import { readFileSync } from "node:fs";

const PHASE = "159C";

type ControlledMetricSeed = {
  industryCode: string;
  tickerExample: string;
  metricCode: string;
  metricLabelVi: string;
  metricGroup: "demand" | "volume" | "price" | "cost" | "margin" | "working_capital";
  unit: "percent" | "index" | "tonnes" | "currency" | "days" | "turns" | "unknown";
  periodType: "month" | "quarter" | "year" | "unknown";
  sourceCandidate: string;
  value: null;
  missingReason: string;
  productionApproved: false;
  needsReview: true;
};

const readText = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
};

const modelBlock = (schema: string, modelName: string): string => {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? "";
};

const hasModel = (schema: string, modelName: string): boolean => modelBlock(schema, modelName).length > 0;

const industryMetricSchemaDraft = String.raw`
model IndustryMetric {
  id                 String    @id @default(cuid())
  industryCode       String
  metricCode         String
  metricName         String
  metricLabelVi      String
  metricGroup        String
  value              Decimal?
  unit               String
  periodType         String
  periodLabel        String
  observationDate    DateTime
  sourceLabel        String
  sourceUrl          String?
  dataMode           String    @default("research_only")
  productionApproved Boolean   @default(false)
  needsReview        Boolean   @default(true)
  qualityStatus      String    @default("needs_review")
  missingReason      String?
  warningCodes       String    @default("[]")
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  industry       Industry                   @relation(fields: [industryCode], references: [industryCode])
  provenanceRows IndustryMetricProvenance[]

  @@unique([industryCode, metricCode, observationDate, sourceLabel])
  @@index([industryCode])
  @@index([metricCode])
  @@index([observationDate])
  @@index([dataMode])
  @@index([productionApproved])
  @@index([needsReview])
}

model IndustryMetricProvenance {
  id                 String    @id @default(cuid())
  industryMetricId   String
  industryCode       String
  metricCode         String
  observationDate    DateTime
  sourceLabel        String
  sourceUrl          String?
  sourceType         String
  publicationDate    DateTime?
  retrievedAt        DateTime?
  dataMode           String    @default("research_only")
  productionApproved Boolean   @default(false)
  needsReview        Boolean   @default(true)
  payloadChecksum    String?
  evidenceNotes      String?
  warningCodes       String    @default("[]")
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  industryMetric IndustryMetric @relation(fields: [industryMetricId], references: [id])

  @@unique([industryMetricId, sourceLabel, sourceUrl])
  @@index([industryMetricId])
  @@index([industryCode])
  @@index([metricCode])
  @@index([observationDate])
  @@index([sourceLabel])
  @@index([dataMode])
  @@index([productionApproved])
}
`.trim();

const controlledSeedPlan: ControlledMetricSeed[] = [
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    metricCode: "STEEL_FINISHED_SALES_VOLUME",
    metricLabelVi: "San luong thep thanh pham ban ra",
    metricGroup: "volume",
    unit: "tonnes",
    periodType: "month",
    sourceCandidate: "Local PDF candidate - bao-cao-thi-truong-thep-quy-i-2026",
    value: null,
    missingReason: "Needs reviewed numeric extraction from the source table before any write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    metricCode: "STEEL_PRICE_REFERENCE",
    metricLabelVi: "Gia thep tham chieu",
    metricGroup: "price",
    unit: "currency",
    periodType: "month",
    sourceCandidate: "Local PDF candidate - bao-cao-thi-truong-thep-quy-i-2026",
    value: null,
    missingReason: "Needs reviewed numeric extraction and unit confirmation before any write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "STEEL_MATERIALS",
    tickerExample: "HPG",
    metricCode: "STEEL_INPUT_COST_REFERENCE",
    metricLabelVi: "Chi phi dau vao thep tham chieu",
    metricGroup: "cost",
    unit: "currency",
    periodType: "month",
    sourceCandidate: "Local PDF candidate - bao-cao-thi-truong-thep-quy-i-2026",
    value: null,
    missingReason: "Needs reviewed numeric extraction and source permission check before any write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    metricCode: "RETAIL_SALES_INDEX",
    metricLabelVi: "Chi so ban le hang hoa dich vu",
    metricGroup: "demand",
    unit: "index",
    periodType: "month",
    sourceCandidate: "Local PDF candidate - nganh_ban_le",
    value: null,
    missingReason: "Needs reviewed numeric extraction from the source table before any write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    metricCode: "RETAIL_GROSS_MARGIN",
    metricLabelVi: "Bien gop ban le",
    metricGroup: "margin",
    unit: "percent",
    periodType: "quarter",
    sourceCandidate: "Company filing or reviewed industry report candidate",
    value: null,
    missingReason: "Needs source decision because company-only values are not automatically industry values.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "RETAIL",
    tickerExample: "MWG",
    metricCode: "RETAIL_INVENTORY_DAYS",
    metricLabelVi: "So ngay ton kho ban le",
    metricGroup: "working_capital",
    unit: "days",
    periodType: "quarter",
    sourceCandidate: "Company filing or reviewed industry report candidate",
    value: null,
    missingReason: "Needs formula and source review before any write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    tickerExample: "VNM",
    metricCode: "DAIRY_REVENUE_GROWTH",
    metricLabelVi: "Tang truong doanh thu nhom sua",
    metricGroup: "demand",
    unit: "percent",
    periodType: "quarter",
    sourceCandidate: "Local PDF candidate - bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026",
    value: null,
    missingReason: "Needs reviewed numeric extraction and dairy-specific scope check before any write.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    tickerExample: "VNM",
    metricCode: "DAIRY_GROSS_MARGIN",
    metricLabelVi: "Bien gop nhom sua",
    metricGroup: "margin",
    unit: "percent",
    periodType: "quarter",
    sourceCandidate: "Company filing or reviewed industry report candidate",
    value: null,
    missingReason: "Needs source decision because broad consumer data may not equal dairy-specific data.",
    productionApproved: false,
    needsReview: true,
  },
  {
    industryCode: "CONSUMER_STAPLES_DAIRY",
    tickerExample: "VNM",
    metricCode: "DAIRY_INPUT_COST_REFERENCE",
    metricLabelVi: "Chi phi dau vao sua tham chieu",
    metricGroup: "cost",
    unit: "index",
    periodType: "month",
    sourceCandidate: "Reviewed commodity or industry report candidate",
    value: null,
    missingReason: "Needs reviewed source and unit confirmation before any write.",
    productionApproved: false,
    needsReview: true,
  },
];

const schema = readText("prisma/schema.prisma");
const industryMetricModelPresent = hasModel(schema, "IndustryMetric");
const industryMetricProvenanceModelPresent = hasModel(schema, "IndustryMetricProvenance");
const industryModelPresent = hasModel(schema, "Industry");

const seedRowsWithNumericValue = controlledSeedPlan.filter((row) => row.value !== null).length;
const seedRowsProductionApproved = controlledSeedPlan.filter((row) => row.productionApproved).length;
const seedRowsNotNeedsReview = controlledSeedPlan.filter((row) => !row.needsReview).length;
const seedRowsMissingReasonAbsent = controlledSeedPlan.filter(
  (row) => row.value === null && row.missingReason.trim().length === 0,
).length;

const result = {
  phase: PHASE,
  mode: "schema_plus_controlled_seed_dry_run",
  dbWriteAttempted: false,
  schemaChanged: false,
  migrationCreated: false,
  providerFetchAttempted: false,
  rawSourceImportAttempted: false,
  industryMetricWriteAttempted: false,
  industryMetricModelPresent,
  industryMetricProvenanceModelPresent,
  industryRelationAvailable: industryModelPresent,
  schemaDraft: industryMetricSchemaDraft,
  controlledSeedRowsPlanned: controlledSeedPlan.length,
  controlledSeedPlan,
  seedRowsWithNumericValue,
  seedRowsProductionApproved,
  seedRowsNotNeedsReview,
  seedRowsMissingReasonAbsent,
  seedRule: "All controlled seed rows are placeholders for metric identity only; numeric values remain null until reviewed extraction.",
  benchmarkRankingScoringIntroduced: false,
  tradingOrValuationOutputIntroduced: false,
  stockAttractivenessIntroduced: false,
  fakeMetricValueIntroduced: seedRowsWithNumericValue > 0,
  readyForRealMetricImport: false,
  recommendedNextPhase: "Phase 159D - IndustryMetric Migration Draft Review Or Apply Decision",
};

const auditPassed =
  result.mode === "schema_plus_controlled_seed_dry_run" &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.migrationCreated &&
  !result.providerFetchAttempted &&
  !result.rawSourceImportAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.fakeMetricValueIntroduced &&
  result.seedRowsProductionApproved === 0 &&
  result.seedRowsNotNeedsReview === 0 &&
  result.seedRowsMissingReasonAbsent === 0 &&
  !result.readyForRealMetricImport;

console.log(
  JSON.stringify(
    {
      ...result,
      auditPassed,
    },
    null,
    2,
  ),
);

if (!auditPassed) {
  process.exitCode = 1;
}
