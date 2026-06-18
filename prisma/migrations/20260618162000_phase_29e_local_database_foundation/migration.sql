-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "exchange" TEXT,
    "companyName" TEXT NOT NULL,
    "companyType" TEXT NOT NULL DEFAULT 'unknown',
    "industryCode" TEXT,
    "industryName" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "dataMode" TEXT NOT NULL DEFAULT 'unknown',
    "profileSourceId" TEXT,
    "profileAsOf" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_profileSourceId_fkey" FOREIGN KEY ("profileSourceId") REFERENCES "DataSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialStatement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyType" TEXT NOT NULL DEFAULT 'unknown',
    "periodType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fiscalYear" INTEGER,
    "fiscalQuarter" INTEGER,
    "reportDate" DATETIME,
    "publishedDate" DATETIME,
    "currency" TEXT,
    "unit" TEXT,
    "revenue" DECIMAL,
    "grossProfit" DECIMAL,
    "netIncome" DECIMAL,
    "operatingCashFlow" DECIMAL,
    "totalAssets" DECIMAL,
    "equity" DECIMAL,
    "totalDebt" DECIMAL,
    "currentAssets" DECIMAL,
    "currentLiabilities" DECIMAL,
    "eps" DECIMAL,
    "bvps" DECIMAL,
    "sharesOutstanding" DECIMAL,
    "marketCap" DECIMAL,
    "enterpriseValue" DECIMAL,
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "collectedAt" DATETIME,
    "qualityStatus" TEXT NOT NULL DEFAULT 'unknown',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialStatement_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "tradingDate" DATETIME NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'day',
    "period" TEXT NOT NULL,
    "openPrice" DECIMAL,
    "highPrice" DECIMAL,
    "lowPrice" DECIMAL,
    "closePrice" DECIMAL,
    "previousClose" DECIMAL,
    "adjustedClosePrice" DECIMAL,
    "volume" DECIMAL,
    "tradingValue" DECIMAL,
    "marketCap" DECIMAL,
    "currency" TEXT,
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "collectedAt" DATETIME,
    "qualityStatus" TEXT NOT NULL DEFAULT 'unknown',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketPrice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketPrice_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "supportedDataGroups" TEXT NOT NULL DEFAULT '[]',
    "usageStatus" TEXT NOT NULL DEFAULT 'unknown',
    "licenseStatus" TEXT NOT NULL DEFAULT 'not_checked',
    "tosStatus" TEXT NOT NULL DEFAULT 'not_checked',
    "accessMethod" TEXT NOT NULL DEFAULT 'unknown',
    "cachingAllowed" TEXT NOT NULL DEFAULT 'unknown',
    "redistributionAllowed" TEXT NOT NULL DEFAULT 'unknown',
    "runtimeDisplayAllowed" TEXT NOT NULL DEFAULT 'unknown',
    "derivedDataAllowed" TEXT NOT NULL DEFAULT 'unknown',
    "attributionText" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "homepageUrl" TEXT,
    "documentationUrl" TEXT,
    "licenseName" TEXT,
    "licenseUrl" TEXT,
    "termsUrl" TEXT,
    "allowsPersonalUse" TEXT NOT NULL DEFAULT 'unknown',
    "allowsAcademicUse" TEXT NOT NULL DEFAULT 'unknown',
    "allowsCommercialUse" TEXT NOT NULL DEFAULT 'unknown',
    "allowsRuntimeDisplay" TEXT NOT NULL DEFAULT 'unknown',
    "allowsCaching" TEXT NOT NULL DEFAULT 'unknown',
    "allowsRedistribution" TEXT NOT NULL DEFAULT 'unknown',
    "allowsDerivedData" TEXT NOT NULL DEFAULT 'unknown',
    "requiresAttribution" TEXT NOT NULL DEFAULT 'unknown',
    "evidenceStatus" TEXT NOT NULL DEFAULT 'missing',
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "notes" TEXT,
    "risks" TEXT NOT NULL DEFAULT '[]',
    "blockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SourceEvidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataQualityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "status" TEXT NOT NULL,
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "qualityStatus" TEXT NOT NULL DEFAULT 'unknown',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "topIssues" TEXT NOT NULL DEFAULT '[]',
    "fieldCoverage" TEXT NOT NULL DEFAULT '[]',
    "safeNextSteps" TEXT NOT NULL DEFAULT '[]',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" TEXT
);

-- CreateTable
CREATE TABLE "ManualImportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'thesis_verification',
    "sourceLabel" TEXT NOT NULL DEFAULT 'manual_upload',
    "sourceType" TEXT NOT NULL DEFAULT 'user_input',
    "dataMode" TEXT NOT NULL DEFAULT 'user_input',
    "targetTicker" TEXT,
    "targetPeriod" TEXT,
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "validRowCount" INTEGER NOT NULL DEFAULT 0,
    "warningRowCount" INTEGER NOT NULL DEFAULT 0,
    "errorRowCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "dataQualityReportId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualImportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManualImportSession_dataQualityReportId_fkey" FOREIGN KEY ("dataQualityReportId") REFERENCES "DataQualityReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManualImportRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rawPayload" TEXT NOT NULL DEFAULT '{}',
    "normalizedPayload" TEXT NOT NULL DEFAULT '{}',
    "ticker" TEXT,
    "period" TEXT,
    "periodType" TEXT NOT NULL DEFAULT 'unknown',
    "asOf" DATETIME,
    "sourceLabel" TEXT NOT NULL DEFAULT 'manual_upload',
    "sourceType" TEXT NOT NULL DEFAULT 'user_input',
    "dataMode" TEXT NOT NULL DEFAULT 'user_input',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "qualityStatus" TEXT NOT NULL DEFAULT 'user_input',
    "warnings" TEXT NOT NULL DEFAULT '[]',
    "errors" TEXT NOT NULL DEFAULT '[]',
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "errorCodes" TEXT NOT NULL DEFAULT '[]',
    "unmappedFields" TEXT NOT NULL DEFAULT '[]',
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "companyId" TEXT,
    "financialStatementId" TEXT,
    "marketPriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualImportRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ManualImportSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManualImportRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManualImportRecord_financialStatementId_fkey" FOREIGN KEY ("financialStatementId") REFERENCES "FinancialStatement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManualImportRecord_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "MarketPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'watching',
    "priority" TEXT,
    "notes" TEXT,
    "thesisSummary" TEXT,
    "dataMode" TEXT NOT NULL DEFAULT 'unknown',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "quantity" DECIMAL,
    "entryPrice" DECIMAL,
    "exitPrice" DECIMAL,
    "openedAt" DATETIME,
    "closedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "thesisSnapshot" TEXT,
    "reflection" TEXT,
    "sourceMode" TEXT NOT NULL DEFAULT 'unknown',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaperTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaperTrade_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssistantInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "sourceMode" TEXT NOT NULL DEFAULT 'unknown',
    "readiness" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssistantInteraction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
