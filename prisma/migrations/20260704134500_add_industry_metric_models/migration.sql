-- Add Layer 5 industry metric storage.
-- This migration creates schema only. It does not insert metric rows.

CREATE TABLE "IndustryMetric" (
    "id" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricLabelVi" TEXT NOT NULL,
    "metricGroup" TEXT NOT NULL,
    "value" DECIMAL,
    "unit" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceKey" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "qualityStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "missingReason" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndustryMetricProvenance" (
    "id" TEXT NOT NULL,
    "industryMetricId" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "dataMode" TEXT NOT NULL DEFAULT 'research_only',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "payloadChecksum" TEXT,
    "evidenceNotes" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryMetricProvenance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IndustryMetric_industryCode_metricCode_observationDate_sourceKey_key" ON "IndustryMetric"("industryCode", "metricCode", "observationDate", "sourceKey");
CREATE INDEX "IndustryMetric_industryCode_idx" ON "IndustryMetric"("industryCode");
CREATE INDEX "IndustryMetric_metricCode_idx" ON "IndustryMetric"("metricCode");
CREATE INDEX "IndustryMetric_observationDate_idx" ON "IndustryMetric"("observationDate");
CREATE INDEX "IndustryMetric_dataMode_idx" ON "IndustryMetric"("dataMode");
CREATE INDEX "IndustryMetric_productionApproved_idx" ON "IndustryMetric"("productionApproved");
CREATE INDEX "IndustryMetric_needsReview_idx" ON "IndustryMetric"("needsReview");

CREATE UNIQUE INDEX "IndustryMetricProvenance_industryMetricId_sourceKey_key" ON "IndustryMetricProvenance"("industryMetricId", "sourceKey");
CREATE INDEX "IndustryMetricProvenance_industryMetricId_idx" ON "IndustryMetricProvenance"("industryMetricId");
CREATE INDEX "IndustryMetricProvenance_industryCode_idx" ON "IndustryMetricProvenance"("industryCode");
CREATE INDEX "IndustryMetricProvenance_metricCode_idx" ON "IndustryMetricProvenance"("metricCode");
CREATE INDEX "IndustryMetricProvenance_observationDate_idx" ON "IndustryMetricProvenance"("observationDate");
CREATE INDEX "IndustryMetricProvenance_sourceLabel_idx" ON "IndustryMetricProvenance"("sourceLabel");
CREATE INDEX "IndustryMetricProvenance_sourceKey_idx" ON "IndustryMetricProvenance"("sourceKey");
CREATE INDEX "IndustryMetricProvenance_dataMode_idx" ON "IndustryMetricProvenance"("dataMode");
CREATE INDEX "IndustryMetricProvenance_productionApproved_idx" ON "IndustryMetricProvenance"("productionApproved");

ALTER TABLE "IndustryMetric" ADD CONSTRAINT "IndustryMetric_industryCode_fkey" FOREIGN KEY ("industryCode") REFERENCES "Industry"("industryCode") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IndustryMetricProvenance" ADD CONSTRAINT "IndustryMetricProvenance_industryMetricId_fkey" FOREIGN KEY ("industryMetricId") REFERENCES "IndustryMetric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
