-- CreateTable
CREATE TABLE "MarketPriceProvenanceMetadata" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "marketDate" TIMESTAMP(3) NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3),
    "exchange" TEXT,
    "currency" TEXT,
    "priceUnit" TEXT,
    "volumeUnit" TEXT,
    "adjustmentStatus" TEXT NOT NULL,
    "stalenessStatus" TEXT NOT NULL,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "importRunId" TEXT,
    "payloadChecksum" TEXT,
    "warningCodes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPriceProvenanceMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_ticker_idx" ON "MarketPriceProvenanceMetadata"("ticker");

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_marketDate_idx" ON "MarketPriceProvenanceMetadata"("marketDate");

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_sourceLabel_idx" ON "MarketPriceProvenanceMetadata"("sourceLabel");

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_dataMode_idx" ON "MarketPriceProvenanceMetadata"("dataMode");

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_productionApproved_idx" ON "MarketPriceProvenanceMetadata"("productionApproved");

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_stalenessStatus_idx" ON "MarketPriceProvenanceMetadata"("stalenessStatus");

-- CreateIndex
CREATE INDEX "MarketPriceProvenanceMetadata_adjustmentStatus_idx" ON "MarketPriceProvenanceMetadata"("adjustmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPriceProvenanceMetadata_ticker_marketDate_sourceLabel_key" ON "MarketPriceProvenanceMetadata"("ticker", "marketDate", "sourceLabel");
