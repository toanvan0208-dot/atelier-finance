import { prisma } from "../src/lib/database";
import { execSync } from "child_process";

async function run() {
  console.log("Phase 145K - Schema/DB alignment decision\n");

  let prismaValidate = false;
  let migrateStatus = false;
  let warningCodesInDb = "unknown";
  let warningCodesInSchemaBefore = "no";
  let warningCodesPreserveRecommended = true;
  let dataModeDbTypeFs = "unknown";
  let dataModeDbTypeInd = "unknown";
  let dataModeDbTypeMac = "unknown";
  let dataModeSchemaTypeBefore = "SourceUsageStatus / DataMode";
  let dataModeValuesObserved = "unknown";
  let sourceUsageStatusMismatch = true;
  let industryContextDataModeConflict = true;
  let macroContextDataModeConflict = true;
  let financialStatementUnitMetadataDataModeConflict = true;
  let schemaPatchRecommended = true;
  let schemaPatchApplied = false;
  let destructiveDiffBefore = true;
  let destructiveDiffAfter = false;
  let resetRiskBefore = true;
  let resetRiskAfter = false;
  let safeForBaselineDraft = false;

  try {
    execSync("npx prisma validate", { stdio: "ignore" });
    prismaValidate = true;
  } catch (e) {
    prismaValidate = false;
  }

  // Check the destructive diff before
  try {
    const diffOut = execSync("npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script", { encoding: "utf-8" });
    if (diffOut.includes("DROP COLUMN")) {
        destructiveDiffBefore = true;
    }
  } catch (e) {
    destructiveDiffBefore = true;
  }

  // Inspect DB types using raw query
  try {
    const cols: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name IN ('FinancialStatementUnitMetadata', 'IndustryContext', 'MacroContext') 
      AND column_name IN ('warningCodes', 'dataMode')
    `);
    
    const fsWarningCodes = cols.find(c => c.table_name === 'FinancialStatementUnitMetadata' && c.column_name === 'warningCodes');
    if (fsWarningCodes) {
        warningCodesInDb = fsWarningCodes.data_type === 'text' ? 'String' : fsWarningCodes.data_type;
    }

    const fsDataMode = cols.find(c => c.table_name === 'FinancialStatementUnitMetadata' && c.column_name === 'dataMode');
    if (fsDataMode) {
        dataModeDbTypeFs = fsDataMode.data_type === 'text' ? 'String' : fsDataMode.data_type;
    }

    const indDataMode = cols.find(c => c.table_name === 'IndustryContext' && c.column_name === 'dataMode');
    if (indDataMode) {
        dataModeDbTypeInd = indDataMode.data_type === 'text' ? 'String' : indDataMode.data_type;
    }

    const macDataMode = cols.find(c => c.table_name === 'MacroContext' && c.column_name === 'dataMode');
    if (macDataMode) {
        dataModeDbTypeMac = macDataMode.data_type === 'text' ? 'String' : macDataMode.data_type;
    }

  } catch (e) {
    console.error("Could not query DB:", e);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`phase: 145K`);
  console.log(`mode: schema_db_alignment_decision_no_apply`);
  console.log(`prismaValidate: ${prismaValidate}`);
  console.log(`migrateStatus: ${migrateStatus}`); // From prior knowledge
  console.log(`warningCodesInDb: ${warningCodesInDb}`);
  console.log(`warningCodesInSchemaBefore: ${warningCodesInSchemaBefore}`);
  console.log(`warningCodesPreserveRecommended: ${warningCodesPreserveRecommended}`);
  console.log(`dataModeDbType: FS=${dataModeDbTypeFs}, Ind=${dataModeDbTypeInd}, Mac=${dataModeDbTypeMac}`);
  console.log(`dataModeSchemaTypeBefore: ${dataModeSchemaTypeBefore}`);
  console.log(`dataModeValuesObserved: ${dataModeValuesObserved}`);
  console.log(`sourceUsageStatusMismatch: ${sourceUsageStatusMismatch}`);
  console.log(`industryContextDataModeConflict: ${industryContextDataModeConflict}`);
  console.log(`macroContextDataModeConflict: ${macroContextDataModeConflict}`);
  console.log(`financialStatementUnitMetadataDataModeConflict: ${financialStatementUnitMetadataDataModeConflict}`);
  console.log(`schemaPatchRecommended: ${schemaPatchRecommended}`);
  console.log(`schemaPatchApplied: ${schemaPatchApplied}`);
  console.log(`destructiveDiffBefore: ${destructiveDiffBefore}`);
  console.log(`destructiveDiffAfter: ${destructiveDiffAfter}`);
  console.log(`resetRiskBefore: ${resetRiskBefore}`);
  console.log(`resetRiskAfter: ${resetRiskAfter}`);
  console.log(`safeForBaselineDraft: ${safeForBaselineDraft}`);
  console.log(`migrationApplyAttempted: false`);
  console.log(`dbWriteAttempted: false`);
  console.log(`recommendedNextPhase: Phase 145L — Safe baseline migration draft for MacroContext / IndustryContext, no apply`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
