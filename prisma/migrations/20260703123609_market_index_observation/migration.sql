/*
  Warnings:

  - Made the column `dataMode` on table `FinancialStatementUnitMetadata` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FinancialStatementUnitMetadata" ALTER COLUMN "dataMode" SET NOT NULL,
ALTER COLUMN "dataMode" SET DEFAULT 'research_only';

-- CreateTable
CREATE TABLE "MacroIndicator" (
    "id" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "indicatorName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultUnit" TEXT,
    "defaultFrequency" TEXT,
    "regionScope" TEXT,
    "sourceLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroObservation" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(65,30),
    "unit" TEXT,
    "frequency" TEXT,
    "periodLabel" TEXT,
    "sourceLabel" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroObservationProvenance" (
    "id" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "retrievedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "payloadChecksum" TEXT,
    "rawPayloadSnippet" TEXT,
    "warningCodes" TEXT,
    "evidenceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroObservationProvenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketIndexObservation" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "indexName" TEXT,
    "tradingDate" TIMESTAMP(3) NOT NULL,
    "openPoint" DECIMAL(65,30),
    "highPoint" DECIMAL(65,30),
    "lowPoint" DECIMAL(65,30),
    "closePoint" DECIMAL(65,30) NOT NULL,
    "pointUnit" TEXT NOT NULL,
    "volume" BIGINT,
    "volumeUnit" TEXT,
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "dataMode" "DataMode" NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "warningCodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketIndexObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicator_indicatorCode_key" ON "MacroIndicator"("indicatorCode");

-- CreateIndex
CREATE INDEX "MacroObservation_indicatorId_idx" ON "MacroObservation"("indicatorId");

-- CreateIndex
CREATE INDEX "MacroObservation_indicatorCode_idx" ON "MacroObservation"("indicatorCode");

-- CreateIndex
CREATE INDEX "MacroObservation_region_idx" ON "MacroObservation"("region");

-- CreateIndex
CREATE INDEX "MacroObservation_observationDate_idx" ON "MacroObservation"("observationDate");

-- CreateIndex
CREATE INDEX "MacroObservation_sourceLabel_idx" ON "MacroObservation"("sourceLabel");

-- CreateIndex
CREATE INDEX "MacroObservation_dataMode_idx" ON "MacroObservation"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "MacroObservation_indicatorCode_region_observationDate_sourc_key" ON "MacroObservation"("indicatorCode", "region", "observationDate", "sourceLabel");

-- CreateIndex
CREATE INDEX "MacroObservationProvenance_indicatorCode_idx" ON "MacroObservationProvenance"("indicatorCode");

-- CreateIndex
CREATE INDEX "MacroObservationProvenance_region_idx" ON "MacroObservationProvenance"("region");

-- CreateIndex
CREATE INDEX "MacroObservationProvenance_observationDate_idx" ON "MacroObservationProvenance"("observationDate");

-- CreateIndex
CREATE INDEX "MacroObservationProvenance_sourceLabel_idx" ON "MacroObservationProvenance"("sourceLabel");

-- CreateIndex
CREATE INDEX "MacroObservationProvenance_dataMode_idx" ON "MacroObservationProvenance"("dataMode");

-- CreateIndex
CREATE UNIQUE INDEX "MacroObservationProvenance_indicatorCode_region_observation_key" ON "MacroObservationProvenance"("indicatorCode", "region", "observationDate", "sourceLabel");

-- CreateIndex
CREATE INDEX "MarketIndexObservation_symbol_tradingDate_idx" ON "MarketIndexObservation"("symbol", "tradingDate");

-- CreateIndex
CREATE INDEX "MarketIndexObservation_sourceId_idx" ON "MarketIndexObservation"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketIndexObservation_symbol_tradingDate_sourceId_key" ON "MarketIndexObservation"("symbol", "tradingDate", "sourceId");

-- AddForeignKey
ALTER TABLE "MacroObservation" ADD CONSTRAINT "MacroObservation_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "MacroIndicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketIndexObservation" ADD CONSTRAINT "MarketIndexObservation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "CompanyIndustry_ticker_industryCode_roleType_sourceLabel_source" RENAME TO "CompanyIndustry_ticker_industryCode_roleType_sourceLabel_so_key";

-- RenameIndex
ALTER INDEX "IndustryContextProvenance_industryContextId_ticker_sourceLabel_" RENAME TO "IndustryContextProvenance_industryContextId_ticker_sourceLa_key";

-- RenameIndex
ALTER INDEX "IndustryPeerGroup_industryCode_peerTicker_peerRole_sourceLabel_" RENAME TO "IndustryPeerGroup_industryCode_peerTicker_peerRole_sourceLa_key";
