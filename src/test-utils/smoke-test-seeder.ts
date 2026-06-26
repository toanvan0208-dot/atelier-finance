import { getPostgresTestDatabase } from "./postgres-test-database";

export async function seedSmokeTestsFixture(db: ReturnType<typeof getPostgresTestDatabase>) {
  const reviewedLabel = "annual_report_2025_pdf_reviewed_preview";
  const candidateLabel = "vnstock_financials_candidate";
  const dataMode = "research_only";
  const testFixtureLabel = "postgres_test_fixture";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getOrCreateSource = async (name: string, sourceType: any, usageStatus: any) => {
    let s = await db.prisma.dataSource.findFirst({ where: { name, sourceType } });
    if (!s) {
      try {
        s = await db.prisma.dataSource.create({ data: { name, sourceType, usageStatus } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.code !== "P2002") throw e;
        s = await db.prisma.dataSource.findFirst({ where: { name, sourceType } });
      }
    }
    return s!;
  };

  const sourceReviewed = await getOrCreateSource(reviewedLabel, "user_input", "research_only");
  const sourceCandidate = await getOrCreateSource(candidateLabel, "unknown", "unknown");
  const sourceTestFixture = await getOrCreateSource(testFixtureLabel, "unknown", "research_only");

  const getOrCreateCompany = async (ticker: string) => {
    let c = await db.prisma.company.findFirst({ where: { ticker, dataMode } });
    if (!c) {
      c = await db.prisma.company.create({
        data: { ticker, country: "VN", currency: "VND", dataMode, companyName: ticker }
      });
    }
    return c;
  };

  const companies = [
    { ticker: "FPT", eps: 5216, shares: 1703507121, debt: 21073.487486139 },
    { ticker: "HPG", eps: 1973, shares: 7675465855, debt: 92174.151302217 },
    { ticker: "MSN", eps: 2710, shares: 1520491927, debt: 64877.178 },
    { ticker: "VNM", eps: 3000, shares: 2000000000, debt: 5000 },
    { ticker: "MWG", eps: 4000, shares: 1500000000, debt: 8000 }
  ];

  for (const c of companies) {
    const comp = await getOrCreateCompany(c.ticker);
    
    let stmt = await db.prisma.financialStatement.findFirst({
      where: { ticker: c.ticker, sourceId: sourceReviewed.id, dataMode }
    });
    if (!stmt) {
      stmt = await db.prisma.financialStatement.create({
        data: {
          companyId: comp.id,
          sourceId: sourceReviewed.id,
          sourceLabel: reviewedLabel,
          ticker: c.ticker,
          periodType: "year",
          period: "2025",
          fiscalYear: 2025,
          dataMode,
          sourceType: "user_input",
          currency: "VND",
          asOf: new Date("2026-06-21T00:00:00Z"),
          collectedAt: new Date(),
          qualityStatus: "usable_with_caution",
          readiness: "ready",
          eps: c.eps,
          sharesOutstanding: c.shares,
          totalDebt: c.debt,
          missingFields: "[]",
          warningCodes: "[]",
          errorCodes: "[]",
        }
      });
      const units = { eps: "vnd_per_share", sharesOutstanding: "shares", totalDebt: "billion_vnd" };
      for (const [field, unit] of Object.entries(units)) {
        await db.prisma.financialStatementUnitMetadata.create({
          data: {
            financialStatementId: stmt.id,
            field, status: "explicit", unit, sourceLabel: reviewedLabel, dataMode, productionApproved: false
          }
        });
      }
    }

    if (c.ticker === "MSN") {
      const msnCand = await db.prisma.financialStatement.findFirst({
        where: { ticker: c.ticker, sourceId: sourceCandidate.id, dataMode }
      });
      if (!msnCand) {
        await db.prisma.financialStatement.create({
          data: {
            companyId: comp.id,
            sourceId: sourceCandidate.id,
            sourceLabel: candidateLabel,
            ticker: c.ticker,
            periodType: "year",
            period: "2025",
            fiscalYear: 2025,
            dataMode,
            sourceType: "unknown",
            currency: "VND",
            asOf: new Date("2026-06-21T00:00:00Z"),
            collectedAt: new Date(),
            qualityStatus: "usable_with_caution",
            readiness: "ready",
            missingFields: "[]",
            warningCodes: "[]",
            errorCodes: "[]",
          }
        });
      }
    }
  }

  const vcb = await getOrCreateCompany("VCB");
  const vcbStmt = await db.prisma.financialStatement.findFirst({
    where: { ticker: "VCB", sourceId: sourceTestFixture.id, dataMode }
  });
  if (!vcbStmt) {
    await db.prisma.financialStatement.create({
      data: {
        companyId: vcb.id,
        sourceId: sourceTestFixture.id,
        sourceLabel: testFixtureLabel,
        ticker: "VCB",
        periodType: "year",
        period: "2025",
        fiscalYear: 2025,
        dataMode,
        sourceType: "unknown",
        currency: "VND",
        asOf: new Date("2026-06-21T00:00:00Z"),
        collectedAt: new Date(),
        qualityStatus: "usable_with_caution",
        readiness: "ready",
        missingFields: "[]",
        warningCodes: "[]",
        errorCodes: "[]",
        eps: 1000,
        sharesOutstanding: 100000,
      }
    });
  }
}
