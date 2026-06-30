-- Add a reviewed-source provenance sidecar for qualitative IndustryContext rows.
-- Phase 150D creates the migration contract only; it does not insert runtime data.

CREATE TABLE "IndustryContextProvenance" (
    "id" TEXT NOT NULL,
    "industryContextId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "publicationDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "extractedQuote" TEXT,
    "reviewNote" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryContextProvenance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IndustryContextProvenance_industryContextId_ticker_sourceLabel_sourceUrl_key" ON "IndustryContextProvenance"("industryContextId", "ticker", "sourceLabel", "sourceUrl");
CREATE INDEX "IndustryContextProvenance_industryContextId_idx" ON "IndustryContextProvenance"("industryContextId");
CREATE INDEX "IndustryContextProvenance_ticker_idx" ON "IndustryContextProvenance"("ticker");
CREATE INDEX "IndustryContextProvenance_sourceLabel_idx" ON "IndustryContextProvenance"("sourceLabel");
CREATE INDEX "IndustryContextProvenance_dataMode_idx" ON "IndustryContextProvenance"("dataMode");
CREATE INDEX "IndustryContextProvenance_productionApproved_idx" ON "IndustryContextProvenance"("productionApproved");

ALTER TABLE "IndustryContextProvenance" ADD CONSTRAINT "IndustryContextProvenance_industryContextId_fkey" FOREIGN KEY ("industryContextId") REFERENCES "IndustryContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
