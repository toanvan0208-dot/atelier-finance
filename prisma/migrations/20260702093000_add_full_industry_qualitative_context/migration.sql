-- Phase 151B adds nullable qualitative context fields to IndustryContext.
-- The fields are research-only context, not IndustryMetric, valuation benchmark, or risk benchmark data.

ALTER TABLE "IndustryContext"
  ADD COLUMN "howIndustryMakesMoney" TEXT,
  ADD COLUMN "macroSensitivity" TEXT,
  ADD COLUMN "nextChecks" TEXT,
  ADD COLUMN "commonMisread" TEXT;
