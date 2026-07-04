import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PHASE = "159D";

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

const gitStatus = (paths: string[]): string[] => {
  try {
    const output = execFileSync("git", ["status", "--short", "--", ...paths], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return ["git_status_unavailable"];
  }
};

const prismaModelDraft = String.raw`
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
  sourceKey          String
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

  @@unique([industryCode, metricCode, observationDate, sourceKey])
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
  sourceKey          String
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

  @@unique([industryMetricId, sourceKey])
  @@index([industryMetricId])
  @@index([industryCode])
  @@index([metricCode])
  @@index([observationDate])
  @@index([sourceLabel])
  @@index([sourceKey])
  @@index([dataMode])
  @@index([productionApproved])
}
`.trim();

const sqlMigrationDraft = String.raw`
-- Draft only. Do not run from this phase.
CREATE TABLE "IndustryMetric" (
  "id" TEXT NOT NULL,
  "industryCode" TEXT NOT NULL,
  "metricCode" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "metricLabelVi" TEXT NOT NULL,
  "metricGroup" TEXT NOT NULL,
  "value" DECIMAL,
  "unit" TEXT NOT NULL,
  "periodType" TEXT NOT NULL,
  "periodLabel" TEXT NOT NULL,
  "observationDate" TIMESTAMP(3) NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceKey" TEXT NOT NULL,
  "dataMode" TEXT NOT NULL DEFAULT 'research_only',
  "productionApproved" BOOLEAN NOT NULL DEFAULT false,
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "qualityStatus" TEXT NOT NULL DEFAULT 'needs_review',
  "missingReason" TEXT,
  "warningCodes" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IndustryMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustryMetricProvenance" (
  "id" TEXT NOT NULL,
  "industryMetricId" TEXT NOT NULL,
  "industryCode" TEXT NOT NULL,
  "metricCode" TEXT NOT NULL,
  "observationDate" TIMESTAMP(3) NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceKey" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "publicationDate" TIMESTAMP(3),
  "retrievedAt" TIMESTAMP(3),
  "dataMode" TEXT NOT NULL DEFAULT 'research_only',
  "productionApproved" BOOLEAN NOT NULL DEFAULT false,
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "payloadChecksum" TEXT,
  "evidenceNotes" TEXT,
  "warningCodes" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IndustryMetricProvenance_pkey" PRIMARY KEY ("id")
);
`.trim();

const schema = readText("prisma/schema.prisma");
const schemaStatus = gitStatus(["prisma/schema.prisma"]);
const migrationStatus = gitStatus(["prisma/migrations"]);

const industryModelPresent = hasModel(schema, "Industry");
const industryMetricModelPresent = hasModel(schema, "IndustryMetric");
const industryMetricProvenanceModelPresent = hasModel(schema, "IndustryMetricProvenance");
const schemaHasUncommittedChanges = schemaStatus.length > 0;
const migrationFolderHasUncommittedChanges = migrationStatus.length > 0;

const blockersToApplyMigration = [
  ...(schemaHasUncommittedChanges ? ["prisma/schema.prisma has uncommitted changes outside this phase."] : []),
  ...(migrationFolderHasUncommittedChanges ? ["prisma/migrations has uncommitted migration work outside this phase."] : []),
  ...(!industryModelPresent ? ["Industry model is missing, so relation target is not available."] : []),
  ...(industryMetricModelPresent ? ["IndustryMetric already exists; applying this draft would need a different migration."] : []),
  ...(industryMetricProvenanceModelPresent
    ? ["IndustryMetricProvenance already exists; applying this draft would need a different migration."]
    : []),
];

const result = {
  phase: PHASE,
  mode: "migration_apply_decision_dry_run",
  dbWriteAttempted: false,
  schemaChanged: false,
  migrationCreated: false,
  providerFetchAttempted: false,
  rawSourceImportAttempted: false,
  industryMetricWriteAttempted: false,
  industryMetricModelPresent,
  industryMetricProvenanceModelPresent,
  industryRelationAvailable: industryModelPresent,
  schemaHasUncommittedChanges,
  migrationFolderHasUncommittedChanges,
  schemaStatus,
  migrationStatus,
  prismaModelDraft,
  sqlMigrationDraft,
  designAdjustmentFrom159C: "Use sourceKey in unique constraints so nullable sourceUrl cannot weaken duplicate protection.",
  applyMigrationNow: false,
  blockersToApplyMigration,
  benchmarkRankingScoringIntroduced: false,
  tradingOrValuationOutputIntroduced: false,
  stockAttractivenessIntroduced: false,
  readyForRealMetricImport: false,
  recommendedNextPhase:
    blockersToApplyMigration.length > 0
      ? "Phase 159E - Clean-Worktree IndustryMetric Migration Apply"
      : "Phase 159E - Apply IndustryMetric Migration Locally",
};

const auditPassed =
  result.mode === "migration_apply_decision_dry_run" &&
  !result.dbWriteAttempted &&
  !result.schemaChanged &&
  !result.migrationCreated &&
  !result.providerFetchAttempted &&
  !result.rawSourceImportAttempted &&
  !result.industryMetricWriteAttempted &&
  !result.applyMigrationNow &&
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
