CREATE TABLE "MacroContext" (
    "id" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "contextLanguage" TEXT NOT NULL DEFAULT 'vi',
    "gdpGrowthContext" TEXT,
    "inflationContext" TEXT,
    "interestRateContext" TEXT,
    "exchangeRateContext" TEXT,
    "marketContext" TEXT,
    "sourceLabel" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroContext_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IndustryContext" (
    "id" TEXT NOT NULL,
    "industryCode" TEXT,
    "industryName" TEXT NOT NULL,
    "contextLanguage" TEXT NOT NULL DEFAULT 'vi',
    "industryOverview" TEXT,
    "keyDrivers" TEXT,
    "industryRisks" TEXT,
    "relatedTickers" TEXT[],
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryContext_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MacroContext_asOfDate_sourceLabel_contextLanguage_key" ON "MacroContext"("asOfDate", "sourceLabel", "contextLanguage");
CREATE UNIQUE INDEX "IndustryContext_industryName_asOfDate_sourceLabel_contextLa_key" ON "IndustryContext"("industryName", "asOfDate", "sourceLabel", "contextLanguage");
