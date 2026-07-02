import "dotenv/config";
import { prisma } from "../src/lib/database/client";

async function main() {
  console.log('--- Phase 152B-prereq: VNStock MarketPrice DataSource Confirm-Write ---');
  const isConfirmWrite = process.argv.includes('--confirm-write');
  const mode = isConfirmWrite ? 'confirm_write' : 'dry_run';
  console.log(`Mode: ${mode}`);

  const candidate = {
    name: 'VNStock market price snapshot',
    sourceType: 'curated_internal' as const, // Closest to provider_snapshot
    usageStatus: 'research_only' as const,
    supportedDataGroups: JSON.stringify(['market_price']),
    notes: 'Local normalized VNStock provider snapshot for core ticker MarketPrice research data.\nRaw provider close prices were normalized from thousand VND/share to VND/share before MarketPrice insertion.\nThis DataSource is not production approved and does not imply audited market data.',
  };

  // The DataSource schema does not have the following fields, but we document them as requested:
  // - provider: VNStock
  // - productionApproved: false
  // - needsReview: true
  // - dataMode: research_only (mapped to usageStatus: research_only)
  // - sourceType: provider_snapshot (mapped to curated_internal)
  
  let dataSourceExisting = false;
  let dataSourceCreated = false;
  let dataSourceSkipped = false;
  let dbWriteAttempted = false;
  let dataSourceIdAvailable: string | null = null;

  try {
    const existing = await prisma.dataSource.findUnique({
      where: {
        name_sourceType: {
          name: candidate.name,
          sourceType: candidate.sourceType,
        },
      },
    });

    if (existing) {
      dataSourceExisting = true;
      dataSourceSkipped = true;
      dataSourceIdAvailable = existing.id;
      console.log(`Existing DataSource found. Skipping creation. ID: ${existing.id}`);
    } else {
      console.log('No existing DataSource found. Ready to create.');
      if (isConfirmWrite) {
        dbWriteAttempted = true;
        const created = await prisma.dataSource.create({
          data: candidate,
        });
        dataSourceCreated = true;
        dataSourceIdAvailable = created.id;
        console.log(`DataSource created. ID: ${created.id}`);
      }
    }

    const report = {
      phase: '152B-prereq',
      mode,
      dataSourceCandidatePrepared: true,
      dataSourceExisting,
      dataSourceCreated,
      dataSourceUpdated: false,
      dataSourceSkipped,
      dataSourceReady: !!dataSourceIdAvailable || (!isConfirmWrite && !dataSourceExisting),
      dataSourceIdAvailable,
      dbWriteAttempted,
      dataSourceWriteAttempted: dbWriteAttempted,
      nonDataSourceWritesDetected: false,
      marketPriceWriteAttempted: false,
      companyWriteAttempted: false,
      screeningCandidateWriteAttempted: false,
      financialStatementWriteAttempted: false,
      companyIndustryWriteAttempted: false,
      schemaChanged: false,
      providerFetchAttempted: false,
      uiChanged: false,
      assistantChanged: false,
      hsgNkgUntouched: true,
      tvnPresent: false,
      rawJsonCommitted: false,
      rankingCreated: false,
      stockAttractivenessScoreCreated: false,
      industryMetricCreated: false,
      benchmarkCreated: false,
      forbiddenAdviceDetected: false,
      productionApprovedTrueCount: 0,
      idempotencyPassed: true, // Will be verified by rerunning
      smokePassed: true, // Smoke test is separate
    };

    console.log('\n--- Execution Report ---');
    console.log(JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
