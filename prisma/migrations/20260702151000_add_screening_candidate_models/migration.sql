-- Phase 151M adds dedicated Screening candidate storage.
-- This migration creates schema only; it does not seed HSG/NKG candidate data.
-- The models are for research_only / needsReview screening candidates, not IndustryMetric,
-- valuation/risk benchmarks, rankings, scores, or investment advice.

CREATE TABLE "ScreeningCandidate" (
  "id" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "companyName" TEXT,
  "industryCode" TEXT,
  "peerRole" TEXT,
  "coverageLevel" TEXT NOT NULL,
  "screeningEligible" BOOLEAN NOT NULL DEFAULT true,
  "analysisEligible" BOOLEAN NOT NULL DEFAULT false,
  "dataMode" TEXT NOT NULL DEFAULT 'research_only',
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "productionApproved" BOOLEAN NOT NULL DEFAULT false,
  "warningCodes" TEXT NOT NULL DEFAULT '[]',
  "caveats" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScreeningCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScreeningCandidateMetric" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "metricCode" TEXT NOT NULL,
  "value" DECIMAL(65,30),
  "unit" TEXT,
  "period" TEXT,
  "periodType" TEXT,
  "providerPeriod" TEXT,
  "snapshotDate" TIMESTAMP(3),
  "fiscalYearEnd" TIMESTAMP(3),
  "statementScope" TEXT,
  "sourceType" TEXT,
  "sourceLabel" TEXT,
  "sourceUrl" TEXT,
  "extractedQuote" TEXT,
  "reviewNote" TEXT,
  "warningCodes" TEXT NOT NULL DEFAULT '[]',
  "dataMode" TEXT NOT NULL DEFAULT 'research_only',
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "productionApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScreeningCandidateMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScreeningCandidateProvenance" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "metricId" TEXT,
  "ticker" TEXT NOT NULL,
  "metricCode" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "retrievedAt" TIMESTAMP(3),
  "publicationDate" TIMESTAMP(3),
  "extractedQuote" TEXT,
  "reviewNote" TEXT,
  "payloadChecksum" TEXT,
  "warningCodes" TEXT NOT NULL DEFAULT '[]',
  "dataMode" TEXT NOT NULL DEFAULT 'research_only',
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "productionApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScreeningCandidateProvenance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScreeningCandidate_ticker_key" ON "ScreeningCandidate"("ticker");
CREATE INDEX "ScreeningCandidate_coverageLevel_idx" ON "ScreeningCandidate"("coverageLevel");
CREATE INDEX "ScreeningCandidate_screeningEligible_idx" ON "ScreeningCandidate"("screeningEligible");
CREATE INDEX "ScreeningCandidate_analysisEligible_idx" ON "ScreeningCandidate"("analysisEligible");
CREATE INDEX "ScreeningCandidate_dataMode_idx" ON "ScreeningCandidate"("dataMode");
CREATE INDEX "ScreeningCandidate_needsReview_idx" ON "ScreeningCandidate"("needsReview");
CREATE INDEX "ScreeningCandidate_productionApproved_idx" ON "ScreeningCandidate"("productionApproved");

CREATE UNIQUE INDEX "ScreeningCandidateMetric_candidateId_metricCode_key" ON "ScreeningCandidateMetric"("candidateId", "metricCode");
CREATE INDEX "ScreeningCandidateMetric_ticker_idx" ON "ScreeningCandidateMetric"("ticker");
CREATE INDEX "ScreeningCandidateMetric_metricCode_idx" ON "ScreeningCandidateMetric"("metricCode");
CREATE INDEX "ScreeningCandidateMetric_dataMode_idx" ON "ScreeningCandidateMetric"("dataMode");
CREATE INDEX "ScreeningCandidateMetric_needsReview_idx" ON "ScreeningCandidateMetric"("needsReview");
CREATE INDEX "ScreeningCandidateMetric_productionApproved_idx" ON "ScreeningCandidateMetric"("productionApproved");

CREATE INDEX "ScreeningCandidateProvenance_candidateId_idx" ON "ScreeningCandidateProvenance"("candidateId");
CREATE INDEX "ScreeningCandidateProvenance_metricId_idx" ON "ScreeningCandidateProvenance"("metricId");
CREATE INDEX "ScreeningCandidateProvenance_ticker_idx" ON "ScreeningCandidateProvenance"("ticker");
CREATE INDEX "ScreeningCandidateProvenance_metricCode_idx" ON "ScreeningCandidateProvenance"("metricCode");
CREATE INDEX "ScreeningCandidateProvenance_sourceLabel_idx" ON "ScreeningCandidateProvenance"("sourceLabel");
CREATE INDEX "ScreeningCandidateProvenance_sourceType_idx" ON "ScreeningCandidateProvenance"("sourceType");
CREATE INDEX "ScreeningCandidateProvenance_dataMode_idx" ON "ScreeningCandidateProvenance"("dataMode");
CREATE INDEX "ScreeningCandidateProvenance_needsReview_idx" ON "ScreeningCandidateProvenance"("needsReview");
CREATE INDEX "ScreeningCandidateProvenance_productionApproved_idx" ON "ScreeningCandidateProvenance"("productionApproved");

ALTER TABLE "ScreeningCandidateMetric"
  ADD CONSTRAINT "ScreeningCandidateMetric_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "ScreeningCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScreeningCandidateProvenance"
  ADD CONSTRAINT "ScreeningCandidateProvenance_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "ScreeningCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScreeningCandidateProvenance"
  ADD CONSTRAINT "ScreeningCandidateProvenance_metricId_fkey"
  FOREIGN KEY ("metricId") REFERENCES "ScreeningCandidateMetric"("id") ON DELETE SET NULL ON UPDATE CASCADE;
