-- CreateTable
CREATE TABLE "MarketPriceUnitMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketPriceId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "sourceLabel" TEXT,
    "dataMode" TEXT,
    "asOf" DATETIME,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketPriceUnitMetadata_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "MarketPrice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketPriceUnitMetadata_marketPriceId_field_key" ON "MarketPriceUnitMetadata"("marketPriceId", "field");

-- CreateIndex
CREATE INDEX "MarketPriceUnitMetadata_marketPriceId_idx" ON "MarketPriceUnitMetadata"("marketPriceId");

-- CreateIndex
CREATE INDEX "MarketPriceUnitMetadata_field_idx" ON "MarketPriceUnitMetadata"("field");

-- CreateIndex
CREATE INDEX "MarketPriceUnitMetadata_status_idx" ON "MarketPriceUnitMetadata"("status");
