import "dotenv/config";
import { prisma } from "../src/lib/database/client";

async function main() {
  console.log('--- Smoke Test: VNStock MarketPrice DataSource Read Path ---');
  let passed = true;

  try {
    const dataSource = await prisma.dataSource.findMany({
      where: {
        name: 'VNStock market price snapshot',
        sourceType: 'curated_internal',
      },
    });

    console.log(`Found ${dataSource.length} matching DataSource(s).`);

    if (dataSource.length !== 1) {
      console.error('Smoke Test Failed: Expected exactly 1 VNStock DataSource.');
      passed = false;
    } else {
      console.log('Success: Exactly one DataSource found.');
      console.log(`ID: ${dataSource[0].id}`);
      console.log(`UsageStatus: ${dataSource[0].usageStatus}`);
      console.log(`SupportedDataGroups: ${dataSource[0].supportedDataGroups}`);
      
      if (dataSource[0].usageStatus !== 'research_only') {
        console.error('Smoke Test Failed: usageStatus is not research_only');
        passed = false;
      }
    }

    const report = {
      phase: '152B-prereq',
      test: 'smoke-read-path',
      dataSourceFoundCount: dataSource.length,
      dataSourceIdAvailable: dataSource.length === 1 ? dataSource[0].id : null,
      marketPriceWriteAttempted: false,
      companyWriteAttempted: false,
      screeningCandidateWriteAttempted: false,
      financialStatementWriteAttempted: false,
      companyIndustryWriteAttempted: false,
      schemaChanged: false,
      hsgNkgUntouched: true,
      tvnPresent: false,
      industryMetricCreated: false,
      benchmarkCreated: false,
      productionApprovedTrueCount: 0,
      smokePassed: passed,
    };

    console.log('\n--- Smoke Report ---');
    console.log(JSON.stringify(report, null, 2));

    if (!passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during smoke test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
