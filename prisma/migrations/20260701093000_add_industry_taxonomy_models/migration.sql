-- Add taxonomy and mapping tables for the Industry module.
-- Phase 150I adds schema support only; it does not insert runtime taxonomy data.

CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "displayNameVi" TEXT NOT NULL,
    "sectorCode" TEXT,
    "sectorName" TEXT,
    "classificationSystem" TEXT NOT NULL,
    "description" TEXT,
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyIndustry" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "roleType" TEXT NOT NULL DEFAULT 'ambiguous',
    "segmentDescription" TEXT,
    "mappingConfidence" TEXT NOT NULL DEFAULT 'missing',
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "extractedQuote" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIndustry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustryPeerGroup" (
    "id" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "peerTicker" TEXT NOT NULL,
    "peerRole" TEXT NOT NULL DEFAULT 'ambiguous',
    "inclusionReason" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "extractedQuote" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryPeerGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Industry_industryCode_key" ON "Industry"("industryCode");
CREATE INDEX "Industry_sectorCode_idx" ON "Industry"("sectorCode");
CREATE INDEX "Industry_classificationSystem_idx" ON "Industry"("classificationSystem");
CREATE INDEX "Industry_dataMode_idx" ON "Industry"("dataMode");
CREATE INDEX "Industry_productionApproved_idx" ON "Industry"("productionApproved");

CREATE UNIQUE INDEX "CompanyIndustry_ticker_industryCode_roleType_sourceLabel_sourceUrl_key" ON "CompanyIndustry"("ticker", "industryCode", "roleType", "sourceLabel", "sourceUrl");
CREATE INDEX "CompanyIndustry_ticker_idx" ON "CompanyIndustry"("ticker");
CREATE INDEX "CompanyIndustry_industryCode_idx" ON "CompanyIndustry"("industryCode");
CREATE INDEX "CompanyIndustry_roleType_idx" ON "CompanyIndustry"("roleType");
CREATE INDEX "CompanyIndustry_dataMode_idx" ON "CompanyIndustry"("dataMode");
CREATE INDEX "CompanyIndustry_productionApproved_idx" ON "CompanyIndustry"("productionApproved");

CREATE UNIQUE INDEX "IndustryPeerGroup_industryCode_peerTicker_peerRole_sourceLabel_sourceUrl_key" ON "IndustryPeerGroup"("industryCode", "peerTicker", "peerRole", "sourceLabel", "sourceUrl");
CREATE INDEX "IndustryPeerGroup_industryCode_idx" ON "IndustryPeerGroup"("industryCode");
CREATE INDEX "IndustryPeerGroup_peerTicker_idx" ON "IndustryPeerGroup"("peerTicker");
CREATE INDEX "IndustryPeerGroup_peerRole_idx" ON "IndustryPeerGroup"("peerRole");
CREATE INDEX "IndustryPeerGroup_dataMode_idx" ON "IndustryPeerGroup"("dataMode");
CREATE INDEX "IndustryPeerGroup_productionApproved_idx" ON "IndustryPeerGroup"("productionApproved");

ALTER TABLE "CompanyIndustry" ADD CONSTRAINT "CompanyIndustry_industryCode_fkey" FOREIGN KEY ("industryCode") REFERENCES "Industry"("industryCode") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustryPeerGroup" ADD CONSTRAINT "IndustryPeerGroup_industryCode_fkey" FOREIGN KEY ("industryCode") REFERENCES "Industry"("industryCode") ON DELETE RESTRICT ON UPDATE CASCADE;
