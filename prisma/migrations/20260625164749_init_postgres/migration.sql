-- CreateEnum
CREATE TYPE "DataMode" AS ENUM ('sample', 'demo', 'user_input', 'research_only', 'production_approved', 'blocked', 'unknown');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('official', 'exchange', 'licensed_vendor', 'company_disclosure', 'curated_internal', 'user_input', 'unknown');

-- CreateEnum
CREATE TYPE "SourceUsageStatus" AS ENUM ('approved', 'needs_legal_review', 'blocked', 'research_only', 'unknown');

-- CreateEnum
CREATE TYPE "LegalReviewStatus" AS ENUM ('not_checked', 'needs_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "SourceAccessMethod" AS ENUM ('official_api', 'official_download', 'licensed_feed', 'public_file', 'public_web', 'manual_fixture', 'manual_upload', 'scraping', 'scraped', 'private_api', 'undocumented_api', 'private_or_undocumented_api', 'unknown');

-- CreateEnum
CREATE TYPE "SourceEvidenceStatus" AS ENUM ('verified', 'partially_verified', 'missing', 'conflicting');

-- CreateEnum
CREATE TYPE "PermissionFlag" AS ENUM ('true', 'false', 'unknown');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('non_financial', 'bank', 'securities', 'insurance', 'unknown');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('session', 'day', 'month', 'quarter', 'year', 'ttm', 'manual', 'unknown');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('ready', 'needs_review', 'not_ready', 'insufficient_data', 'unknown');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('good', 'usable_with_caution', 'partial', 'missing', 'stale', 'sample', 'demo', 'user_input', 'blocked', 'unknown');

-- CreateEnum
CREATE TYPE "ManualImportStatus" AS ENUM ('draft', 'validated', 'needs_review', 'failed', 'persisted');

-- CreateEnum
CREATE TYPE "PaperTradeAction" AS ENUM ('open_position', 'close_position', 'observe_position');

-- CreateEnum
CREATE TYPE "PaperTradeStatus" AS ENUM ('planned', 'open', 'closed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "exchange" TEXT,
    "companyName" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL DEFAULT 'unknown',
    "industryCode" TEXT,
    "industryName" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "dataMode" "DataMode" NOT NULL DEFAULT 'unknown',
    "profileSourceId" TEXT,
    "profileAsOf" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL DEFAULT 'unknown',
    "periodType" "PeriodType" NOT NULL,
    "period" TEXT NOT NULL,
    "fiscalYear" INTEGER,
    "fiscalQuarter" INTEGER,
    "reportDate" TIMESTAMP(3),
    "publishedDate" TIMESTAMP(3),
    "currency" TEXT,
    "unit" TEXT,
    "revenue" DECIMAL(65,30),
    "grossProfit" DECIMAL(65,30),
    "netIncome" DECIMAL(65,30),
    "operatingCashFlow" DECIMAL(65,30),
    "totalAssets" DECIMAL(65,30),
    "equity" DECIMAL(65,30),
    "totalDebt" DECIMAL(65,30),
    "currentAssets" DECIMAL(65,30),
    "currentLiabilities" DECIMAL(65,30),
    "eps" DECIMAL(65,30),
    "bvps" DECIMAL(65,30),
    "sharesOutstanding" DECIMAL(65,30),
    "marketCap" DECIMAL(65,30),
    "enterpriseValue" DECIMAL(65,30),
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "dataMode" "DataMode" NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "collectedAt" TIMESTAMP(3),
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'unknown',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatementUnitMetadata" (
    "id" TEXT NOT NULL,
    "financialStatementId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "dataMode" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatementUnitMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "tradingDate" TIMESTAMP(3) NOT NULL,
    "periodType" "PeriodType" NOT NULL DEFAULT 'day',
    "period" TEXT NOT NULL,
    "openPrice" DECIMAL(65,30),
    "highPrice" DECIMAL(65,30),
    "lowPrice" DECIMAL(65,30),
    "closePrice" DECIMAL(65,30),
    "previousClose" DECIMAL(65,30),
    "adjustedClosePrice" DECIMAL(65,30),
    "volume" DECIMAL(65,30),
    "tradingValue" DECIMAL(65,30),
    "marketCap" DECIMAL(65,30),
    "currency" TEXT,
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "dataMode" "DataMode" NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "collectedAt" TIMESTAMP(3),
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'unknown',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPriceUnitMetadata" (
    "id" TEXT NOT NULL,
    "marketPriceId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "sourceLabel" TEXT,
    "dataMode" TEXT,
    "asOf" TIMESTAMP(3),
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPriceUnitMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "supportedDataGroups" TEXT NOT NULL DEFAULT '[]',
    "usageStatus" "SourceUsageStatus" NOT NULL DEFAULT 'unknown',
    "licenseStatus" "LegalReviewStatus" NOT NULL DEFAULT 'not_checked',
    "tosStatus" "LegalReviewStatus" NOT NULL DEFAULT 'not_checked',
    "accessMethod" "SourceAccessMethod" NOT NULL DEFAULT 'unknown',
    "cachingAllowed" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "redistributionAllowed" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "runtimeDisplayAllowed" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "derivedDataAllowed" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "attributionText" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceEvidence" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "documentationUrl" TEXT,
    "licenseName" TEXT,
    "licenseUrl" TEXT,
    "termsUrl" TEXT,
    "allowsPersonalUse" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "allowsAcademicUse" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "allowsCommercialUse" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "allowsRuntimeDisplay" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "allowsCaching" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "allowsRedistribution" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "allowsDerivedData" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "requiresAttribution" "PermissionFlag" NOT NULL DEFAULT 'unknown',
    "evidenceStatus" "SourceEvidenceStatus" NOT NULL DEFAULT 'missing',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "notes" TEXT,
    "risks" TEXT NOT NULL DEFAULT '[]',
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityReport" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "status" TEXT NOT NULL,
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'unknown',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "topIssues" TEXT NOT NULL DEFAULT '[]',
    "fieldCoverage" TEXT NOT NULL DEFAULT '[]',
    "safeNextSteps" TEXT NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" TEXT,

    CONSTRAINT "DataQualityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualImportSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'thesis_verification',
    "sourceLabel" TEXT NOT NULL DEFAULT 'manual_upload',
    "sourceType" "SourceType" NOT NULL DEFAULT 'user_input',
    "dataMode" "DataMode" NOT NULL DEFAULT 'user_input',
    "targetTicker" TEXT,
    "targetPeriod" TEXT,
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "validRowCount" INTEGER NOT NULL DEFAULT 0,
    "warningRowCount" INTEGER NOT NULL DEFAULT 0,
    "errorRowCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ManualImportStatus" NOT NULL DEFAULT 'draft',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "dataQualityReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualImportRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rawPayload" TEXT NOT NULL DEFAULT '{}',
    "normalizedPayload" TEXT NOT NULL DEFAULT '{}',
    "ticker" TEXT,
    "period" TEXT,
    "periodType" "PeriodType" NOT NULL DEFAULT 'unknown',
    "asOf" TIMESTAMP(3),
    "sourceLabel" TEXT NOT NULL DEFAULT 'manual_upload',
    "sourceType" "SourceType" NOT NULL DEFAULT 'user_input',
    "dataMode" "DataMode" NOT NULL DEFAULT 'user_input',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'user_input',
    "warnings" TEXT NOT NULL DEFAULT '[]',
    "errors" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "unmappedFields" TEXT NOT NULL DEFAULT '[]',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "companyId" TEXT,
    "financialStatementId" TEXT,
    "marketPriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'watching',
    "priority" TEXT,
    "notes" TEXT,
    "thesisSummary" TEXT,
    "dataMode" "DataMode" NOT NULL DEFAULT 'unknown',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "action" "PaperTradeAction" NOT NULL,
    "quantity" DECIMAL(65,30),
    "entryPrice" DECIMAL(65,30),
    "exitPrice" DECIMAL(65,30),
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "status" "PaperTradeStatus" NOT NULL DEFAULT 'planned',
    "thesisSnapshot" TEXT,
    "reflection" TEXT,
    "sourceMode" "DataMode" NOT NULL DEFAULT 'unknown',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "activeModule" TEXT NOT NULL DEFAULT 'overview',
    "ticker" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "provider" TEXT,
    "llmStatus" TEXT,
    "moduleContext" TEXT NOT NULL DEFAULT '{}',
    "dataQualityContext" TEXT NOT NULL DEFAULT '{}',
    "allowedNumericValues" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT,
    "sourceMode" "DataMode" NOT NULL DEFAULT 'unknown',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Company_ticker_idx" ON "Company"("ticker");

-- CreateIndex
CREATE INDEX "Company_companyType_idx" ON "Company"("companyType");

-- CreateIndex
CREATE INDEX "Company_dataMode_idx" ON "Company"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "Company_ticker_exchange_key" ON "Company"("ticker", "exchange");

-- CreateIndex
CREATE INDEX "FinancialStatement_companyId_period_idx" ON "FinancialStatement"("companyId", "period");

-- CreateIndex
CREATE INDEX "FinancialStatement_ticker_period_idx" ON "FinancialStatement"("ticker", "period");

-- CreateIndex
CREATE INDEX "FinancialStatement_sourceId_asOf_idx" ON "FinancialStatement"("sourceId", "asOf");

-- CreateIndex
CREATE INDEX "FinancialStatement_dataMode_idx" ON "FinancialStatement"("dataMode");

-- CreateIndex
CREATE INDEX "FinancialStatement_readiness_idx" ON "FinancialStatement"("readiness");

-- CreateIndex
CREATE INDEX "FinancialStatementUnitMetadata_financialStatementId_idx" ON "FinancialStatementUnitMetadata"("financialStatementId");

-- CreateIndex
CREATE INDEX "FinancialStatementUnitMetadata_field_idx" ON "FinancialStatementUnitMetadata"("field");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatementUnitMetadata_financialStatementId_field_key" ON "FinancialStatementUnitMetadata"("financialStatementId", "field");

-- CreateIndex
CREATE INDEX "MarketPrice_companyId_tradingDate_idx" ON "MarketPrice"("companyId", "tradingDate");

-- CreateIndex
CREATE INDEX "MarketPrice_ticker_tradingDate_idx" ON "MarketPrice"("ticker", "tradingDate");

-- CreateIndex
CREATE INDEX "MarketPrice_sourceId_asOf_idx" ON "MarketPrice"("sourceId", "asOf");

-- CreateIndex
CREATE INDEX "MarketPrice_dataMode_idx" ON "MarketPrice"("dataMode");

-- CreateIndex
CREATE INDEX "MarketPrice_readiness_idx" ON "MarketPrice"("readiness");

-- CreateIndex
CREATE INDEX "MarketPriceUnitMetadata_marketPriceId_idx" ON "MarketPriceUnitMetadata"("marketPriceId");

-- CreateIndex
CREATE INDEX "MarketPriceUnitMetadata_field_idx" ON "MarketPriceUnitMetadata"("field");

-- CreateIndex
CREATE INDEX "MarketPriceUnitMetadata_status_idx" ON "MarketPriceUnitMetadata"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPriceUnitMetadata_marketPriceId_field_key" ON "MarketPriceUnitMetadata"("marketPriceId", "field");

-- CreateIndex
CREATE INDEX "DataSource_usageStatus_idx" ON "DataSource"("usageStatus");

-- CreateIndex
CREATE INDEX "DataSource_sourceType_idx" ON "DataSource"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_name_sourceType_key" ON "DataSource"("name", "sourceType");

-- CreateIndex
CREATE INDEX "SourceEvidence_sourceId_idx" ON "SourceEvidence"("sourceId");

-- CreateIndex
CREATE INDEX "SourceEvidence_evidenceStatus_idx" ON "SourceEvidence"("evidenceStatus");

-- CreateIndex
CREATE INDEX "DataQualityReport_scopeType_scopeId_idx" ON "DataQualityReport"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "DataQualityReport_readiness_idx" ON "DataQualityReport"("readiness");

-- CreateIndex
CREATE INDEX "DataQualityReport_qualityStatus_idx" ON "DataQualityReport"("qualityStatus");

-- CreateIndex
CREATE INDEX "ManualImportSession_userId_createdAt_idx" ON "ManualImportSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ManualImportSession_dataMode_idx" ON "ManualImportSession"("dataMode");

-- CreateIndex
CREATE INDEX "ManualImportSession_status_idx" ON "ManualImportSession"("status");

-- CreateIndex
CREATE INDEX "ManualImportSession_readiness_idx" ON "ManualImportSession"("readiness");

-- CreateIndex
CREATE INDEX "ManualImportRecord_ticker_period_idx" ON "ManualImportRecord"("ticker", "period");

-- CreateIndex
CREATE INDEX "ManualImportRecord_dataMode_idx" ON "ManualImportRecord"("dataMode");

-- CreateIndex
CREATE INDEX "ManualImportRecord_readiness_idx" ON "ManualImportRecord"("readiness");

-- CreateIndex
CREATE UNIQUE INDEX "ManualImportRecord_sessionId_rowIndex_key" ON "ManualImportRecord"("sessionId", "rowIndex");

-- CreateIndex
CREATE INDEX "Watchlist_userId_status_idx" ON "Watchlist"("userId", "status");

-- CreateIndex
CREATE INDEX "Watchlist_companyId_idx" ON "Watchlist"("companyId");

-- CreateIndex
CREATE INDEX "Watchlist_dataMode_idx" ON "Watchlist"("dataMode");

-- CreateIndex
CREATE INDEX "PaperTrade_userId_status_idx" ON "PaperTrade"("userId", "status");

-- CreateIndex
CREATE INDEX "PaperTrade_companyId_idx" ON "PaperTrade"("companyId");

-- CreateIndex
CREATE INDEX "PaperTrade_sourceMode_idx" ON "PaperTrade"("sourceMode");

-- CreateIndex
CREATE INDEX "AssistantInteraction_userId_createdAt_idx" ON "AssistantInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantInteraction_ticker_activeModule_idx" ON "AssistantInteraction"("ticker", "activeModule");

-- CreateIndex
CREATE INDEX "AssistantInteraction_sourceMode_idx" ON "AssistantInteraction"("sourceMode");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_profileSourceId_fkey" FOREIGN KEY ("profileSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatement" ADD CONSTRAINT "FinancialStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatement" ADD CONSTRAINT "FinancialStatement_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementUnitMetadata" ADD CONSTRAINT "FinancialStatementUnitMetadata_financialStatementId_fkey" FOREIGN KEY ("financialStatementId") REFERENCES "FinancialStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPriceUnitMetadata" ADD CONSTRAINT "MarketPriceUnitMetadata_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "MarketPrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceEvidence" ADD CONSTRAINT "SourceEvidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImportSession" ADD CONSTRAINT "ManualImportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImportSession" ADD CONSTRAINT "ManualImportSession_dataQualityReportId_fkey" FOREIGN KEY ("dataQualityReportId") REFERENCES "DataQualityReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImportRecord" ADD CONSTRAINT "ManualImportRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ManualImportSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImportRecord" ADD CONSTRAINT "ManualImportRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImportRecord" ADD CONSTRAINT "ManualImportRecord_financialStatementId_fkey" FOREIGN KEY ("financialStatementId") REFERENCES "FinancialStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualImportRecord" ADD CONSTRAINT "ManualImportRecord_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "MarketPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperTrade" ADD CONSTRAINT "PaperTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperTrade" ADD CONSTRAINT "PaperTrade_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantInteraction" ADD CONSTRAINT "AssistantInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantInteraction" ADD CONSTRAINT "AssistantInteraction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
