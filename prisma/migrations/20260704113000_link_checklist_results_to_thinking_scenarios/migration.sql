-- Allow checklist answers to reference dynamic thinking question scenarios.

ALTER TABLE "ChecklistResult"
  ADD COLUMN "thinkingQuestionScenarioId" TEXT;

ALTER TABLE "ChecklistResult"
  ALTER COLUMN "checklistItemId" DROP NOT NULL;

CREATE UNIQUE INDEX "ChecklistResult_userChecklistId_thinkingQuestionScenarioId_key"
  ON "ChecklistResult"("userChecklistId", "thinkingQuestionScenarioId");

CREATE INDEX "ChecklistResult_thinkingQuestionScenarioId_idx"
  ON "ChecklistResult"("thinkingQuestionScenarioId");

ALTER TABLE "ChecklistResult"
  ADD CONSTRAINT "ChecklistResult_thinkingQuestionScenarioId_fkey"
  FOREIGN KEY ("thinkingQuestionScenarioId") REFERENCES "ThinkingQuestionScenario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
