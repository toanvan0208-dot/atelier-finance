-- Store reviewed-candidate thinking question scenarios for the dynamic checklist engine.
-- Rows remain needsReview=true and productionApproved=false unless a future review workflow changes them.

CREATE TABLE "ThinkingQuestionScenario" (
  "id" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "industryCode" TEXT NOT NULL,
  "moduleContext" TEXT NOT NULL,
  "sourceModules" TEXT NOT NULL DEFAULT '[]',
  "triggerSignal" TEXT NOT NULL,
  "questionType" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "options" TEXT NOT NULL DEFAULT '[]',
  "correctAnswer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "evidenceFields" TEXT NOT NULL DEFAULT '[]',
  "evidenceStatus" TEXT NOT NULL,
  "dataQualityStatus" TEXT NOT NULL,
  "missingDataBehavior" TEXT NOT NULL,
  "guardrailNote" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "reviewStatus" TEXT NOT NULL,
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "productionApproved" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "sourceLabel" TEXT NOT NULL,
  "sourceId" TEXT,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ThinkingQuestionScenario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ThinkingQuestionScenario_scenarioId_key" ON "ThinkingQuestionScenario"("scenarioId");
CREATE INDEX "ThinkingQuestionScenario_ticker_moduleContext_idx" ON "ThinkingQuestionScenario"("ticker", "moduleContext");
CREATE INDEX "ThinkingQuestionScenario_questionType_idx" ON "ThinkingQuestionScenario"("questionType");
CREATE INDEX "ThinkingQuestionScenario_evidenceStatus_idx" ON "ThinkingQuestionScenario"("evidenceStatus");
CREATE INDEX "ThinkingQuestionScenario_reviewStatus_idx" ON "ThinkingQuestionScenario"("reviewStatus");
CREATE INDEX "ThinkingQuestionScenario_needsReview_idx" ON "ThinkingQuestionScenario"("needsReview");
CREATE INDEX "ThinkingQuestionScenario_productionApproved_idx" ON "ThinkingQuestionScenario"("productionApproved");
CREATE INDEX "ThinkingQuestionScenario_sourceId_idx" ON "ThinkingQuestionScenario"("sourceId");

ALTER TABLE "ThinkingQuestionScenario"
  ADD CONSTRAINT "ThinkingQuestionScenario_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
